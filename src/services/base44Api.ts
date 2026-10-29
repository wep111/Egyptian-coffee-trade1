import {
  CoffeePrice,
  PriceHistory,
  CatalogItem,
  OtherProduct,
  CoffeeBean,
  CoffeeBlend,
  ArticleCategory,
  Article,
  OrderRecord,
  CustomerAccount,
  AudioClip,
  CalculatorComponentItem,
  AIBlendAnalysisResult,
  BlendIngredient,
} from '../types/coffee';

const CLIENT_SESSION_KEY = 'egc_client_session_id_v2';
const MY_ORDER_NUMBERS_KEY = 'egc_my_order_numbers_v2';
const CUSTOMER_AUTH_KEY = 'egc_customer_auth_v2';

export interface StoredCustomerAuthState {
  customer: CustomerAccount;
  token: string;
}

export function getOrCreateClientSessionId(): string {
  try {
    let cid = localStorage.getItem(CLIENT_SESSION_KEY);
    if (!cid) {
      cid = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CLIENT_SESSION_KEY, cid);
    }
    return cid;
  } catch {
    return 'cli_ephemeral';
  }
}

export function getSavedCustomerOrderNumbers(): string[] {
  try {
    const raw = localStorage.getItem(MY_ORDER_NUMBERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function addSavedCustomerOrderNumber(orderNumber: string): void {
  if (!orderNumber) return;
  try {
    const code = orderNumber.trim().toUpperCase();
    const current = getSavedCustomerOrderNumbers();
    if (!current.includes(code)) {
      const updated = [code, ...current];
      localStorage.setItem(MY_ORDER_NUMBERS_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore storage errors
  }
}

export function getStoredCustomerAuth(): StoredCustomerAuthState | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.customer?.id && parsed?.token) {
      return parsed as StoredCustomerAuthState;
    }
  } catch {
    // Ignore
  }
  return null;
}

function saveStoredCustomerAuth(state: StoredCustomerAuthState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(CUSTOMER_AUTH_KEY);
    } else {
      localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore
  }
}

export async function registerCustomerAccount(input: {
  name: string;
  contact: string;
  password: string;
}): Promise<StoredCustomerAuthState> {
  const clientId = getOrCreateClientSessionId();
  const orderNumbers = getSavedCustomerOrderNumbers();
  const res = await fetch('/api/customers/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      clientId,
      orderNumbers,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'تعذر إنشاء الحساب');
  }
  const authState: StoredCustomerAuthState = {
    customer: data.customer,
    token: data.token,
  };
  saveStoredCustomerAuth(authState);
  return authState;
}

export async function loginCustomerAccount(input: {
  contact: string;
  password: string;
}): Promise<StoredCustomerAuthState> {
  const clientId = getOrCreateClientSessionId();
  const orderNumbers = getSavedCustomerOrderNumbers();
  const res = await fetch('/api/customers/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      clientId,
      orderNumbers,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'بيانات الدخول غير صحيحة');
  }
  const authState: StoredCustomerAuthState = {
    customer: data.customer,
    token: data.token,
  };
  saveStoredCustomerAuth(authState);
  return authState;
}

export function logoutCustomerAccount(): void {
  saveStoredCustomerAuth(null);
  try {
    // Reset guest session ID and local order numbers on logout so the next customer on this device has isolated data
    const newCid = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CLIENT_SESSION_KEY, newCid);
    localStorage.removeItem(MY_ORDER_NUMBERS_KEY);
  } catch {
    // Ignore
  }
}

function normalizeBase44Url(rawUrl?: string): string {
  const cleaned = (rawUrl || 'https://egcoffee.base44.app/api')
    .trim()
    .replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

export const BASE44_CONFIG = {
  baseUrl: normalizeBase44Url(import.meta.env.VITE_BASE44_API_URL),
  appId: import.meta.env.VITE_BASE44_APP_ID || '6ae1356b20aa9cddb1240b85',
  token: (import.meta.env.VITE_BASE44_API_TOKEN || '').trim(),
};

interface FetchQueryOptions {
  q?: Record<string, unknown>;
  limit?: number;
  skip?: number;
  sort_by?: string;
}

function buildQueryString(options?: FetchQueryOptions): string {
  if (!options) return '';
  const params = new URLSearchParams();
  if (options.q) params.set('q', JSON.stringify(options.q));
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.skip !== undefined) params.set('skip', String(options.skip));
  if (options.sort_by) params.set('sort_by', String(options.sort_by));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function fetchBase44Raw<T>(
  entityName: string,
  options?: FetchQueryOptions
): Promise<T[]> {
  const qs = buildQueryString(options);
  const token = BASE44_CONFIG.token;

  // 1. Direct request to Base44 API (https://egcoffee.base44.app/api/entities/...)
  if (token && token !== 'حط_التوكن_هنا') {
    try {
      const url = `${BASE44_CONFIG.baseUrl}/entities/${entityName}${qs}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: token.startsWith('Bearer ')
            ? token
            : `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        const items = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.items)
          ? json.items
          : null;
        if (items) {
          return items as T[];
        }
      }
    } catch {
      // Fallback to server proxy
    }
  }

  // 2. Server-side proxy fallback (/api/base44/entities/...)
  try {
    const proxyRes = await fetch(`/api/base44/entities/${entityName}${qs}`);
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      const items = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.items)
        ? json.items
        : [];
      return items as T[];
    }
  } catch {
    // Return empty list if unreachable
  }

  return [];
}

/**
 * Normalizes OpenAPI CoffeePrice records
 */
function normalizeCoffeePrice(raw: any, index: number): CoffeePrice {
  const current = Number(raw.current_price ?? raw.price ?? 0);
  const previous =
    raw.previous_price !== undefined ? Number(raw.previous_price) : current;
  let changePercent = Number(raw.change_percent ?? 0);
  if (!raw.change_percent && previous > 0 && current !== previous) {
    changePercent = Number((((current - previous) / previous) * 100).toFixed(1));
  }
  const trend: 'up' | 'down' | 'stable' =
    changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable';
  const coffeeType: 'green' | 'roasted' =
    raw.coffee_type === 'roasted' || raw.type === 'roasted'
      ? 'roasted'
      : 'green';
  const rawDate = raw.last_updated || raw.updated_date || raw.created_date || '';
  const formattedDate = rawDate ? String(rawDate).slice(0, 10) : '';

  return {
    id: raw.id || `cp-${index + 1}`,
    name_ar: raw.name_ar || '',
    name_en: raw.name_en || raw.name_ar || '',
    coffee_type: coffeeType,
    type: coffeeType,
    current_price: current,
    previous_price: previous,
    price: current,
    currency: raw.currency || 'EGP',
    unit: raw.unit || raw.unit_ar || 'كجم',
    unit_ar: raw.unit || raw.unit_ar || 'كجم',
    unit_en: raw.unit_en || raw.unit || 'Kg',
    change_percent: changePercent,
    trend,
    last_updated: rawDate,
    updated_at: formattedDate,
    source_ar: raw.source_ar || '',
    source_en: raw.source_en || raw.source_ar || '',
    approved_by: raw.approved_by || '',
  };
}

/**
 * Normalizes OpenAPI CatalogItem records
 */
function extractAnyDeliveryUrl(raw: any): string {
  if (!raw || typeof raw !== 'object') return '';
  return (
    raw.delivery_file_or_url ||
    raw.download_url ||
    raw.file_url ||
    raw.pdf_url ||
    raw.book_url ||
    raw.course_url ||
    raw.url ||
    raw.link ||
    ''
  );
}

function normalizeCatalogItem(raw: any, index: number): CatalogItem {
  const itemType: string = raw.item_type || raw.type || 'book';
  const priceVal = Number(raw.price ?? raw.price_egp ?? 0);
  const palette = [
    { bg: '#1A1A1A', accent: '#950101' },
    { bg: '#950101', accent: '#D4AF37' },
    { bg: '#231F20', accent: '#B91C1C' },
    { bg: '#1F2937', accent: '#950101' },
    { bg: '#311010', accent: '#E11D48' },
  ][index % 5];

  return {
    id: raw.id || `cat-item-${index + 1}`,
    title_ar: raw.title_ar || '',
    title_en: raw.title_en || raw.title_ar || '',
    item_type: itemType,
    type: itemType,
    subtitle_ar:
      raw.subtitle_ar ||
      (itemType === 'bundle'
        ? 'المجموعة الكاملة'
        : itemType === 'course'
        ? raw.course_schedule || 'دورة تدريبية'
        : itemType === 'book'
        ? `الكتاب رقم ${raw.volume_number || index + 1}`
        : 'منتج متخصص'),
    subtitle_en:
      raw.subtitle_en ||
      raw.title_en ||
      (itemType === 'bundle'
        ? 'Complete Bundle'
        : itemType === 'course'
        ? 'Training Course'
        : itemType === 'book'
        ? `Volume ${raw.volume_number || index + 1}`
        : 'Specialized Product'),
    description_ar: raw.description_ar || '',
    description_en: raw.description_en || raw.description_ar || '',
    price: priceVal,
    price_egp: priceVal,
    original_price_egp: raw.original_price_egp,
    currency: raw.currency || 'EGP',
    cover_image: raw.cover_image,
    delivery_file_or_url: extractAnyDeliveryUrl(raw),
    course_schedule: raw.course_schedule,
    is_active: raw.is_active ?? true,
    pages: raw.pages || 0,
    duration_hours: raw.duration_hours || 0,
    lessons_count: raw.lessons_count || 0,
    level_ar: raw.level_ar || '',
    level_en: raw.level_en || '',
    cover_color: raw.cover_color || palette.bg,
    cover_accent: raw.cover_accent || palette.accent,
    badge_ar: raw.badge_ar,
    badge_en: raw.badge_en,
    highlights_ar: Array.isArray(raw.highlights_ar) ? raw.highlights_ar : [],
    highlights_en: Array.isArray(raw.highlights_en) ? raw.highlights_en : [],
    volume_number: raw.volume_number || index + 1,
    category_ar: raw.category_ar,
    unit: raw.unit,
  };
}

/**
 * Normalizes OpenAPI OtherProduct records (GET /entities/OtherProduct)
 */
function normalizeOtherProduct(raw: any, index: number): OtherProduct {
  const priceVal = Number(raw.price ?? raw.price_egp ?? 0);
  return {
    id: raw.id || `other-prod-${index + 1}`,
    name_ar: raw.name_ar || raw.title_ar || '',
    name_en: raw.name_en || raw.title_en || raw.name_ar || '',
    category_ar: raw.category_ar || 'منتج متخصص',
    description_ar: raw.description_ar || '',
    price: priceVal,
    currency: raw.currency || 'EGP',
    unit: raw.unit || '',
    image_url: raw.image_url || raw.cover_image || '',
    is_published: raw.is_published ?? true,
    created_date: raw.created_date,
    updated_date: raw.updated_date,
    created_by_id: raw.created_by_id,
  };
}

function otherProductToCatalogItem(
  prod: OtherProduct,
  index: number
): CatalogItem {
  const palette = [
    { bg: '#1A1A1A', accent: '#950101' },
    { bg: '#950101', accent: '#D4AF37' },
    { bg: '#231F20', accent: '#B91C1C' },
    { bg: '#1F2937', accent: '#950101' },
    { bg: '#311010', accent: '#E11D48' },
  ][index % 5];

  return {
    id: prod.id,
    title_ar: prod.name_ar,
    title_en: prod.name_en || prod.name_ar,
    item_type: 'other',
    type: 'other',
    subtitle_ar: prod.category_ar || 'منتجات ومستلزمات القهوة',
    subtitle_en: prod.name_en || prod.category_ar || 'Coffee Equipment & Supplies',
    description_ar: prod.description_ar || '',
    description_en: prod.description_ar || '',
    price: prod.price,
    price_egp: prod.price,
    currency: prod.currency || 'EGP',
    cover_image: prod.image_url || undefined,
    is_active: prod.is_published !== false,
    created_date: prod.created_date,
    updated_date: prod.updated_date,
    created_by_id: prod.created_by_id,
    category_ar: prod.category_ar,
    unit: prod.unit,
    cover_color: palette.bg,
    cover_accent: palette.accent,
    badge_ar: prod.category_ar || 'منتج متخصص',
    badge_en: prod.category_ar || 'Specialized Product',
    highlights_ar: [
      ...(prod.category_ar ? [`التصنيف: ${prod.category_ar}`] : []),
      ...(prod.unit ? [`الوحدة / العبوة: ${prod.unit}`] : []),
    ],
    highlights_en: [
      ...(prod.category_ar ? [`Category: ${prod.category_ar}`] : []),
      ...(prod.unit ? [`Unit / Package: ${prod.unit}`] : []),
    ],
  };
}

/**
 * Normalizes OpenAPI CoffeeBean records
 */
function normalizeCoffeeBean(raw: any, index: number): CoffeeBean {
  const spRaw = String(raw.species || 'arabica').toLowerCase();
  const isRobusta = spRaw === 'robusta';
  const sensoryStr = String(raw.sensory_profile_ar || '');
  const notesAr = Array.isArray(raw.flavor_notes_ar)
    ? raw.flavor_notes_ar
    : sensoryStr
    ? sensoryStr
        .split(/[·,،-]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    id: raw.id || `bean-${index + 1}`,
    code: raw.code || `EGC-B${String(index + 1).padStart(3, '0')}`,
    name_ar: raw.name_ar || '',
    name_en: raw.name_en || raw.name_ar || '',
    country_ar: raw.country_ar || '',
    country_en: raw.country_en || raw.country_ar || '',
    region_ar: raw.region_ar || raw.country_ar || '',
    region_en: raw.region_en || raw.country_en || '',
    species: isRobusta ? 'robusta' : spRaw === 'hybrid' ? 'hybrid' : 'arabica',
    species_ar:
      raw.species_ar ||
      (isRobusta ? 'روبوستا' : spRaw === 'hybrid' ? 'هجين' : 'أرابيكا'),
    processing_ar: raw.processing_ar || raw.process_ar || '',
    processing_en: raw.processing_en || raw.process_en || '',
    process_ar: raw.processing_ar || raw.process_ar || '',
    process_en: raw.processing_en || raw.process_en || '',
    sensory_profile_ar: raw.sensory_profile_ar || notesAr.join(' · '),
    recommended_roast_ar:
      raw.recommended_roast_ar || raw.roast_recommendation_ar || '',
    commercial_traits_ar:
      raw.commercial_traits_ar || raw.commercial_notes_ar || '',
    image_url: raw.image_url,
    is_published: raw.is_published ?? true,
    altitude: raw.altitude || '',
    screen_size: raw.screen_size || '',
    moisture_percent: raw.moisture_percent || '',
    caffeine_percent: raw.caffeine_percent || '',
    acidity_level: Number(raw.acidity_level ?? 5),
    body_level: Number(raw.body_level ?? 7),
    bitterness_level: Number(raw.bitterness_level ?? 5),
    crema_level: Number(raw.crema_level ?? 7),
    flavor_notes_ar: notesAr,
    flavor_notes_en: Array.isArray(raw.flavor_notes_en)
      ? raw.flavor_notes_en
      : notesAr,
    suitable_for: Array.isArray(raw.suitable_for)
      ? raw.suitable_for
      : ['turkish', 'espresso'],
    avg_green_price_egp: Number(raw.avg_green_price_egp ?? 0),
    avg_roasted_price_egp: Number(raw.avg_roasted_price_egp ?? 0),
    roast_recommendation_ar:
      raw.recommended_roast_ar || raw.roast_recommendation_ar || '',
    roast_recommendation_en:
      raw.roast_recommendation_en || raw.recommended_roast_ar || '',
    commercial_notes_ar:
      raw.commercial_traits_ar || raw.commercial_notes_ar || '',
    commercial_notes_en:
      raw.commercial_notes_en || raw.commercial_traits_ar || '',
  };
}

function toWesternDigits(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * Normalizes OpenAPI CoffeeBlend records and guarantees 100% total percentage
 */
function normalizeCoffeeBlend(raw: any, index: number): CoffeeBlend {
  const blendNumber = Number(raw.blend_number ?? index + 1);
  let parsedIngredients: BlendIngredient[] = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((ing: any) => ({
        bean_name_ar: String(ing.bean_name_ar || ing.bean_name || '').trim(),
        bean_name_en: String(
          ing.bean_name_en || ing.bean_name_ar || ing.bean_name || ''
        ).trim(),
        percentage: Number(ing.percentage) || 0,
        species:
          String(ing.species || '').toLowerCase() === 'robusta'
            ? 'Robusta'
            : 'Arabica',
        avg_price_egp: Number(ing.avg_price_egp) || 0,
      }))
    : [];

  if (parsedIngredients.length === 0 && Array.isArray(raw.components)) {
    parsedIngredients = raw.components
      .map((comp: any) => {
        if (typeof comp === 'string') {
          const normalizedStr = toWesternDigits(comp);
          try {
            const maybeJson = JSON.parse(comp);
            if (maybeJson && typeof maybeJson === 'object') {
              const name = String(
                maybeJson.bean_name || maybeJson.name || comp
              ).trim();
              const pct =
                Number(toWesternDigits(String(maybeJson.percentage ?? 0))) || 0;
              const isRob =
                name.includes('روبوستا') ||
                name.toLowerCase().includes('robusta');
              return {
                bean_name_ar: name,
                bean_name_en: name,
                percentage: pct,
                species: isRob ? ('Robusta' as const) : ('Arabica' as const),
                avg_price_egp: Number(maybeJson.avg_price_egp) || 0,
              };
            }
          } catch {
            const match = normalizedStr.match(/(\d+(?:\.\d+)?)\s*%?/);
            const pct = match ? Number(match[1]) : 0;
            const cleanName =
              toWesternDigits(comp)
                .replace(/[:\-–()]?\s*\d+(?:\.\d+)?\s*%?\s*[()]?/g, ' ')
                .replace(/\s+/g, ' ')
                .trim() || comp.trim();
            const isRob =
              cleanName.includes('روبوستا') ||
              cleanName.toLowerCase().includes('robusta');
            return {
              bean_name_ar: cleanName,
              bean_name_en: cleanName,
              percentage: pct,
              species: isRob ? ('Robusta' as const) : ('Arabica' as const),
              avg_price_egp: 0,
            };
          }
        }
        if (comp && typeof comp === 'object') {
          const rawName = String(
            comp.bean_name || comp.bean_name_ar || comp.name || ''
          ).trim();
          const normalizedName = toWesternDigits(rawName);
          const matchInName = normalizedName.match(/(\d+(?:\.\d+)?)\s*%/);
          const explicitPct =
            Number(toWesternDigits(String(comp.percentage ?? 0))) ||
            (matchInName ? Number(matchInName[1]) : 0);
          const cleanName =
            normalizedName
              .replace(/[:\-–()]?\s*\d+(?:\.\d+)?\s*%\s*[()]?/g, ' ')
              .replace(/\s+/g, ' ')
              .trim() || rawName;
          const isRob =
            cleanName.includes('روبوستا') ||
            cleanName.toLowerCase().includes('robusta');
          return {
            bean_name_ar: cleanName,
            bean_name_en: comp.bean_name_en || cleanName,
            percentage: explicitPct,
            species: isRob ? ('Robusta' as const) : ('Arabica' as const),
            avg_price_egp: Number(comp.avg_price_egp) || 0,
          };
        }
        return {
          bean_name_ar: String(comp || '').trim(),
          bean_name_en: String(comp || '').trim(),
          percentage: 0,
          species: 'Arabica' as const,
          avg_price_egp: 0,
        };
      })
      .filter((ing: BlendIngredient) => Boolean(ing.bean_name_ar));
  }

  // Fallback if a blend has no ingredients array at all
  if (parsedIngredients.length === 0) {
    parsedIngredients = [
      {
        bean_name_ar: 'أرابيكا برازيلي سانتوس',
        bean_name_en: 'Brazilian Santos Arabica',
        percentage: 70,
        species: 'Arabica',
        avg_price_egp: 315,
      },
      {
        bean_name_ar: 'روبوستا إندونيسي / فيتنامي',
        bean_name_en: 'Indonesian / Vietnamese Robusta',
        percentage: 30,
        species: 'Robusta',
        avg_price_egp: 250,
      },
    ];
  }

  // Guarantee that parsedIngredients percentages always sum to exactly 100%
  const rawSum = parsedIngredients.reduce(
    (sum, item) => sum + (Number(item.percentage) > 0 ? Number(item.percentage) : 0),
    0
  );

  if (rawSum <= 0) {
    const count = parsedIngredients.length;
    const presetDistributions: Record<number, number[]> = {
      1: [100],
      2: [60, 40],
      3: [50, 30, 20],
      4: [40, 25, 20, 15],
      5: [35, 25, 20, 10, 10],
    };
    const dist = presetDistributions[count];
    if (dist) {
      parsedIngredients = parsedIngredients.map((ing, idx) => ({
        ...ing,
        percentage: dist[idx],
      }));
    } else {
      const baseShare = Math.floor(100 / count);
      const remainder = 100 - baseShare * count;
      parsedIngredients = parsedIngredients.map((ing, idx) => ({
        ...ing,
        percentage: idx === 0 ? baseShare + remainder : baseShare,
      }));
    }
  } else if (rawSum !== 100) {
    // Check if any ingredients have 0% while others have > 0%
    const zeroCount = parsedIngredients.filter((i) => i.percentage <= 0).length;
    if (zeroCount > 0 && rawSum < 100) {
      const remaining = 100 - rawSum;
      const perZero = Math.floor(remaining / zeroCount);
      let remExtra = remaining - perZero * zeroCount;
      parsedIngredients = parsedIngredients.map((ing) => {
        if (ing.percentage > 0) return { ...ing, percentage: Math.round(ing.percentage) };
        const add = remExtra > 0 ? 1 : 0;
        if (remExtra > 0) remExtra--;
        return { ...ing, percentage: perZero + add };
      });
    } else {
      let running = 0;
      parsedIngredients = parsedIngredients.map((ing, idx) => {
        if (idx === parsedIngredients.length - 1) {
          return {
            ...ing,
            percentage: Math.max(1, 100 - running),
          };
        }
        const scaled = Math.max(
          1,
          Math.round(((Number(ing.percentage) || 1) / rawSum) * 100)
        );
        running += scaled;
        return {
          ...ing,
          percentage: scaled,
        };
      });
      // Final safety adjustment if running exceeded 99
      const finalSum = parsedIngredients.reduce((s, i) => s + i.percentage, 0);
      if (finalSum !== 100 && parsedIngredients.length > 0) {
        const diff = 100 - finalSum;
        let maxIdx = 0;
        for (let i = 1; i < parsedIngredients.length; i++) {
          if (
            parsedIngredients[i].percentage >
            parsedIngredients[maxIdx].percentage
          ) {
            maxIdx = i;
          }
        }
        parsedIngredients[maxIdx].percentage = Math.max(
          1,
          parsedIngredients[maxIdx].percentage + diff
        );
      }
    }
  }

  const catAr = String(raw.category_ar || '');
  const category: 'turkish' | 'espresso' | 'both' | 'french_flavored' =
    raw.category ||
    (catAr.includes('إسبريسو') || catAr.toLowerCase().includes('espresso')
      ? 'espresso'
      : catAr.includes('فرنساوي') || catAr.includes('نكه')
      ? 'french_flavored'
      : catAr.includes('معاً') || catAr.includes('الاثنين')
      ? 'both'
      : 'turkish');

  const arabicaPct = Math.min(
    100,
    Math.max(
      0,
      parsedIngredients
        .filter((i) => i.species === 'Arabica')
        .reduce((s, i) => s + i.percentage, 0)
    )
  );
  const robustaPct = Math.max(0, 100 - arabicaPct);

  return {
    id: raw.id || `blend-${blendNumber}`,
    blend_number: blendNumber,
    code: raw.code || `EGB-${String(blendNumber).padStart(2, '0')}`,
    name_ar: raw.name_ar || '',
    name_en: raw.name_en || raw.name_ar || '',
    category,
    category_ar: catAr,
    category_en: raw.category_en || catAr,
    components: raw.components,
    total_percentage: 100,
    characteristics_ar: raw.characteristics_ar || raw.flavor_profile_ar || '',
    roast_notes_ar: raw.roast_notes_ar || raw.roaster_secret_ar || '',
    is_published: raw.is_published ?? true,
    tier_ar: raw.tier_ar || '',
    tier_en: raw.tier_en || '',
    arabica_percent: arabicaPct,
    robusta_percent: robustaPct,
    roast_level_ar: raw.roast_level_ar || '',
    roast_level_en: raw.roast_level_en || '',
    expected_loss_percent: Number(raw.expected_loss_percent ?? 15),
    estimated_green_cost_egp: Number(raw.estimated_green_cost_egp ?? 0),
    estimated_roasted_cost_egp: Number(raw.estimated_roasted_cost_egp ?? 0),
    wesh_or_crema_score: Number(raw.wesh_or_crema_score ?? 0),
    body_score: Number(raw.body_score ?? 0),
    aroma_score: Number(raw.aroma_score ?? 0),
    ingredients: parsedIngredients,
    flavor_profile_ar: raw.characteristics_ar || raw.flavor_profile_ar || '',
    flavor_profile_en: raw.flavor_profile_en || raw.characteristics_ar || '',
    target_customer_ar: raw.target_customer_ar || '',
    target_customer_en: raw.target_customer_en || '',
    roaster_secret_ar: raw.roast_notes_ar || raw.roaster_secret_ar || '',
    roaster_secret_en: raw.roaster_secret_en || raw.roast_notes_ar || '',
  };
}

/**
 * Normalizes OpenAPI Article records
 */
function normalizeArticle(raw: any, index: number): Article {
  const pubDate =
    raw.publish_date || raw.published_date || raw.created_date || '';
  const cleanDate = pubDate ? String(pubDate).slice(0, 10) : '';

  return {
    id: raw.id || `art-${index + 1}`,
    slug: raw.slug || `article-${index + 1}`,
    title_ar: raw.title_ar || '',
    title_en: raw.title_en || raw.title_ar || '',
    category_id: raw.category_id || '',
    category_name: raw.category_name || raw.category_name_ar || '',
    category_name_ar: raw.category_name || raw.category_name_ar || '',
    category_name_en: raw.category_name_en || raw.category_name || '',
    summary_ar: raw.summary_ar || raw.excerpt_ar || '',
    excerpt_ar: raw.summary_ar || raw.excerpt_ar || '',
    excerpt_en: raw.excerpt_en || raw.summary_ar || '',
    content_ar: raw.content_ar || '',
    content_en: raw.content_en || raw.content_ar || '',
    cover_image: raw.cover_image,
    related_beans: Array.isArray(raw.related_beans) ? raw.related_beans : [],
    related_blends: Array.isArray(raw.related_blends) ? raw.related_blends : [],
    seo_title: raw.seo_title,
    seo_description: raw.seo_description,
    status: raw.status || 'published',
    publish_date: pubDate,
    published_date: cleanDate,
    author_ar: raw.author_ar || 'تجـــارة القهـــوة المصـــرية',
    author_en: raw.author_en || 'Egyptian Coffee Trade',
    read_time_min: Number(raw.read_time_min ?? 5),
    key_takeaways_ar: Array.isArray(raw.key_takeaways_ar)
      ? raw.key_takeaways_ar
      : [],
    key_takeaways_en: Array.isArray(raw.key_takeaways_en)
      ? raw.key_takeaways_en
      : [],
  };
}

/**
 * Normalizes OpenAPI Order records
 */
function normalizeOrderRecord(raw: any): OrderRecord {
  const totalPrice = Number(raw.total_price ?? raw.amount_egp ?? 0);
  const contact = raw.customer_contact || raw.customer_phone || '';
  const rawPay = String(raw.payment_status || '').toLowerCase();
  const rawOrd = String(raw.order_status || raw.status || '').toLowerCase();

  const isRejected =
    rawPay === 'rejected' ||
    rawOrd === 'cancelled' ||
    rawOrd === 'rejected' ||
    (rawPay === 'unpaid' && rawOrd === 'cancelled');

  const isApproved =
    !isRejected &&
    (rawPay === 'paid' ||
      rawOrd === 'paid' ||
      rawOrd === 'completed' ||
      rawOrd === 'confirmed' ||
      rawOrd === 'delivered');

  const paymentStatus: 'unpaid' | 'under_review' | 'paid' | 'rejected' =
    isRejected
      ? 'rejected'
      : isApproved
      ? 'paid'
      : raw.payment_status || 'under_review';

  const orderStatus:
    | 'new'
    | 'under_review'
    | 'paid'
    | 'completed'
    | 'cancelled'
    | 'rejected' = isRejected
    ? 'cancelled'
    : isApproved
    ? 'completed'
    : raw.order_status || 'under_review';

  return {
    id: raw.id || `ord-${Date.now()}`,
    order_number: raw.order_number || '',
    customer_name: raw.customer_name || '',
    customer_contact: contact,
    customer_phone: contact,
    governorate: raw.governorate || '',
    catalog_item_id: raw.catalog_item_id || raw.item_id || '',
    item_id: raw.catalog_item_id || raw.item_id || '',
    item_title: raw.item_title || raw.item_title_ar || '',
    item_title_ar: raw.item_title_ar || raw.item_title || '',
    item_title_en: raw.item_title_en || raw.item_title || '',
    quantity: Number(raw.quantity ?? 1),
    total_price: totalPrice,
    amount_egp: totalPrice,
    currency: raw.currency || 'EGP',
    payment_method: raw.payment_method || 'instapay',
    receipt_image_url: raw.receipt_image_url || raw.payment_reference || '',
    payment_reference: raw.payment_reference || raw.receipt_image_url || '',
    payment_status: paymentStatus,
    order_status: orderStatus,
    admin_notes:
      isRejected && !raw.admin_notes
        ? 'لم تتم معالجة طلبك'
        : raw.admin_notes || raw.notes || '',
    approved_by: raw.approved_by,
    delivery_file_or_url: extractAnyDeliveryUrl(raw),
    client_id: raw.client_id,
    customer_id: raw.customer_id,
    created_date: raw.created_date || new Date().toISOString(),
    updated_date: raw.updated_date,
  };
}

export async function getCoffeePrices(): Promise<CoffeePrice[]> {
  const live = await fetchBase44Raw<any>('CoffeePrice', {
    limit: 100,
    sort_by: '-last_updated',
  });
  return live.map(normalizeCoffeePrice);
}

export async function getPriceHistory(): Promise<PriceHistory[]> {
  const live = await fetchBase44Raw<PriceHistory>('PriceHistory', {
    limit: 50,
    sort_by: '-created_date',
  });
  return live;
}

export async function getOtherProducts(
  options?: FetchQueryOptions
): Promise<OtherProduct[]> {
  const live = await fetchBase44Raw<any>(
    'OtherProduct',
    options || {
      limit: 100,
      sort_by: '-created_date',
    }
  );
  return live
    .filter((item) => item.is_published !== false)
    .map(normalizeOtherProduct);
}

export async function getCatalogItems(): Promise<CatalogItem[]> {
  const [liveCatalog, otherProducts] = await Promise.all([
    fetchBase44Raw<any>('CatalogItem', {
      limit: 100,
    }),
    getOtherProducts(),
  ]);

  const catalogItems = liveCatalog
    .filter((item) => item.is_active !== false)
    .map(normalizeCatalogItem);

  const existingIds = new Set(catalogItems.map((it) => String(it.id)));
  const convertedOthers = otherProducts
    .filter((op) => !existingIds.has(String(op.id)))
    .map((op, idx) => otherProductToCatalogItem(op, catalogItems.length + idx));

  return [...catalogItems, ...convertedOthers];
}

export async function getCoffeeBeans(): Promise<CoffeeBean[]> {
  const live = await fetchBase44Raw<any>('CoffeeBean', {
    limit: 200,
  });
  return live
    .filter((item) => item.is_published !== false)
    .map(normalizeCoffeeBean);
}

export async function getCoffeeBlends(): Promise<CoffeeBlend[]> {
  const live = await fetchBase44Raw<any>('CoffeeBlend', {
    limit: 100,
    sort_by: 'blend_number',
  });
  return live
    .filter((item) => item.is_published !== false)
    .map(normalizeCoffeeBlend);
}

export async function getArticleCategories(): Promise<ArticleCategory[]> {
  const live = await fetchBase44Raw<any>('ArticleCategory', {
    limit: 20,
    sort_by: 'sort_order',
  });
  return live.map((c: any, idx: number) => ({
    id: c.id || `cat-${idx + 1}`,
    name_ar: c.name_ar || '',
    name_en: c.name_en || c.name_ar || '',
    slug: c.slug || `cat-${idx + 1}`,
    description_ar: c.description_ar || '',
    description_en: c.description_en || c.description_ar || '',
    sort_order: Number(c.sort_order ?? idx + 1),
    article_count: Number(c.article_count ?? 0),
  }));
}

export async function getArticles(): Promise<Article[]> {
  const live = await fetchBase44Raw<any>('Article', {
    limit: 100,
    sort_by: '-publish_date',
  });
  return live.filter((a) => a.status !== 'draft').map(normalizeArticle);
}

async function resolveBase44SignedFileUrl(rawUri: string): Promise<string> {
  const trimmed = String(rawUri || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  try {
    const endpoint = `${BASE44_CONFIG.baseUrl}/apps/${BASE44_CONFIG.appId}/integration-endpoints/Core/CreateFileSignedUrl`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (BASE44_CONFIG.token && BASE44_CONFIG.token !== 'حط_التوكن_هنا') {
      headers.Authorization = BASE44_CONFIG.token.startsWith('Bearer ')
        ? BASE44_CONFIG.token
        : `Bearer ${BASE44_CONFIG.token}`;
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ file_uri: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.signed_url) {
        return String(data.signed_url);
      }
    }
  } catch {
    // Fallback
  }
  return '';
}

export async function getAudioClips(): Promise<AudioClip[]> {
  const live = await fetchBase44Raw<any>('AudioClip', {
    limit: 100,
    sort_by: '-created_date',
  });
  const published = live.filter((item) => item?.is_published !== false);

  const normalized = await Promise.all(
    published.map(async (raw, idx): Promise<AudioClip | null> => {
      const fileUri = String(raw.file_uri || raw.audio_url || '').trim();
      if (!fileUri) return null;
      const resolvedUrl =
        raw.audio_url && /^https?:\/\//i.test(String(raw.audio_url))
          ? String(raw.audio_url)
          : await resolveBase44SignedFileUrl(fileUri);
      if (!resolvedUrl) return null;
      return {
        id: String(raw.id || `audio-${idx + 1}`),
        title_ar: String(raw.title_ar || raw.file_name || `مقطع صوتي ${idx + 1}`),
        description_ar: raw.description_ar ? String(raw.description_ar) : '',
        file_uri: fileUri,
        file_name: raw.file_name ? String(raw.file_name) : '',
        is_published: raw.is_published !== false,
        created_date: raw.created_date,
        updated_date: raw.updated_date,
        created_by_id: raw.created_by_id,
        audio_url: resolvedUrl,
      };
    })
  );

  return normalized.filter((item): item is AudioClip => Boolean(item));
}

export async function getOrders(contactFilter?: string): Promise<OrderRecord[]> {
  const mergedMap = new Map<string, OrderRecord>();
  const clientId = getOrCreateClientSessionId();
  const orderNumbers = getSavedCustomerOrderNumbers();
  const auth = getStoredCustomerAuth();

  try {
    const params = new URLSearchParams();
    if (contactFilter && contactFilter.trim()) {
      params.set('phone', contactFilter.trim());
    }
    if (clientId) {
      params.set('clientId', clientId);
    }
    if (orderNumbers.length > 0) {
      params.set('orderNumbers', orderNumbers.join(','));
    }
    if (auth?.customer?.id && auth?.token) {
      params.set('customerId', auth.customer.id);
      params.set('authToken', auth.token);
    }

    const qs = params.toString();
    const serverRes = await fetch(`/api/local-orders${qs ? `?${qs}` : ''}`, {
      headers: {
        'X-Client-Id': clientId,
        ...(auth?.customer?.id ? { 'X-Customer-Id': auth.customer.id } : {}),
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
    });
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (Array.isArray(serverData)) {
        for (const item of serverData) {
          const norm = normalizeOrderRecord(item);
          if (norm.order_number) {
            mergedMap.set(norm.order_number.toUpperCase(), norm);
          }
        }
      }
    }
  } catch {
    // Ignore network error
  }

  return Array.from(mergedMap.values());
}

export async function createOrder(input: {
  customer_name: string;
  customer_contact: string;
  governorate?: string;
  catalog_item_id: string;
  item_title: string;
  item_title_ar?: string;
  item_title_en?: string;
  quantity?: number;
  total_price: number;
  currency?: string;
  payment_method: 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other';
  payment_method_label?: string;
  receipt_image_url?: string;
  admin_notes?: string;
  delivery_file_or_url?: string;
}): Promise<OrderRecord> {
  const orderNumber = `EGC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const clientId = getOrCreateClientSessionId();
  const auth = getStoredCustomerAuth();

  // Save order number to this customer's isolated browser storage immediately
  addSavedCustomerOrderNumber(orderNumber);

  const combinedNotes = [
    input.payment_method_label
      ? `طريقة الدفع المختارة: ${input.payment_method_label}`
      : '',
    input.admin_notes || '',
  ]
    .filter(Boolean)
    .join(' | ');

  const openApiPayload = {
    order_number: orderNumber,
    customer_name: input.customer_name,
    customer_contact: input.customer_contact,
    catalog_item_id: input.catalog_item_id,
    item_title: input.item_title,
    quantity: input.quantity ?? 1,
    total_price: input.total_price,
    currency: input.currency || 'EGP',
    payment_method: input.payment_method,
    receipt_image_url: input.receipt_image_url || '',
    payment_status: 'under_review' as const,
    order_status: 'new' as const,
    admin_notes: combinedNotes,
  };

  // 1. Fire Telegram notification FIRST & IMMEDIATELY in parallel so Admin receives it at the exact moment of submission
  fetch('/api/notify-telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...openApiPayload,
      payment_method_label:
        input.payment_method_label || input.payment_method,
    }),
  }).catch(() => {});

  // 2. Save in server persistent store + push to Base44 Dashboard
  let savedRecord: OrderRecord | null = null;
  try {
    const localRes = await fetch('/api/local-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
        ...(auth?.customer?.id ? { 'X-Customer-Id': auth.customer.id } : {}),
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify({
        ...openApiPayload,
        ...input,
        payment_method_label:
          input.payment_method_label || input.payment_method,
        admin_notes: combinedNotes,
        client_id: clientId,
        customer_id: auth?.customer?.id || undefined,
        auth_token: auth?.token || undefined,
      }),
    });

    if (localRes.ok) {
      const savedLocal = await localRes.json();
      savedRecord = normalizeOrderRecord(savedLocal);
    }
  } catch {
    // Ignore
  }

  return (
    savedRecord ||
    normalizeOrderRecord({
      id: `ord-${Date.now()}`,
      ...openApiPayload,
      client_id: clientId,
      customer_id: auth?.customer?.id,
      delivery_file_or_url: input.delivery_file_or_url,
      created_date: new Date().toISOString(),
    })
  );
}

export async function analyzeBlendWithAI(params: {
  beanState: 'green' | 'roasted';
  roastLossPercent: number;
  targetUse: 'turkish' | 'espresso' | 'both';
  components: CalculatorComponentItem[];
  financials: {
    rawCostPerKg: number;
    netRoastedCostPerKg: number;
    greenNeededForOneKgRoasted: number;
  };
  lang: 'ar' | 'en';
}): Promise<AIBlendAnalysisResult> {
  const response = await fetch('/api/analyze-blend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch AI analysis from server');
  }

  return await response.json();
}
