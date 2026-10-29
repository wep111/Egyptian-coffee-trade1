export type Language = 'ar' | 'en';

export type NavTab =
  | 'home'
  | 'store'
  | 'calculator'
  | 'library'
  | 'beans'
  | 'blends'
  | 'articles'
  | 'courses'
  | 'orders'
  | 'about'
  | 'privacy';

export type DetailedPaymentMethod =
  | 'e_and_cash'
  | 'vodafone_cash'
  | 'instapay'
  | 'gbp_account'
  | 'usd_account'
  | 'eur_account'
  | 'bitcoin';

/**
 * Matches OpenAPI schema: #/components/schemas/CoffeePrice
 */
export interface CoffeePrice {
  id: string;
  name_ar: string;
  name_en?: string;
  coffee_type: 'green' | 'roasted';
  current_price: number;
  previous_price?: number;
  currency: string;
  unit: string;
  source_ar?: string;
  source_en?: string;
  approved_by?: string;
  last_updated?: string;
  created_date?: string;
  updated_date?: string;
  // Computed UI helpers
  type: 'green' | 'roasted';
  price: number;
  unit_ar: string;
  unit_en: string;
  change_percent: number;
  trend: 'up' | 'down' | 'stable';
  updated_at: string;
}

/**
 * Matches OpenAPI schema: #/components/schemas/PriceHistory
 */
export interface PriceHistory {
  id: string;
  price_item_id?: string;
  price_name: string;
  coffee_type: 'green' | 'roasted';
  old_price?: number;
  new_price: number;
  currency: string;
  unit: string;
  source?: string;
  approved_by?: string;
  created_date?: string;
}

/**
 * Matches OpenAPI schema: #/components/schemas/CatalogItem
 */
export interface CatalogItem {
  id: string;
  title_ar: string;
  title_en?: string;
  item_type: 'book' | 'bundle' | 'course' | 'product' | 'other' | string;
  description_ar?: string;
  description_en?: string;
  price: number;
  currency: string;
  cover_image?: string;
  delivery_file_or_url?: string;
  course_schedule?: string;
  is_active?: boolean;
  created_date?: string;
  updated_date?: string;
  // Extended UI metadata
  type: 'book' | 'bundle' | 'course' | 'product' | 'other' | string;
  subtitle_ar: string;
  subtitle_en: string;
  price_egp: number;
  original_price_egp?: number;
  pages?: number;
  duration_hours?: number;
  lessons_count?: number;
  level_ar?: string;
  level_en?: string;
  cover_color: string;
  cover_accent: string;
  badge_ar?: string;
  badge_en?: string;
  highlights_ar: string[];
  highlights_en: string[];
  volume_number?: number;
  category_ar?: string;
  unit?: string;
  created_by_id?: string;
}

/**
 * Matches OpenAPI schema: #/components/schemas/OtherProduct
 */
export interface OtherProduct {
  id: string;
  name_ar: string;
  name_en?: string;
  category_ar?: string;
  description_ar?: string;
  price: number;
  currency?: string;
  unit?: string;
  image_url?: string;
  is_published?: boolean;
  created_date?: string;
  updated_date?: string;
  created_by_id?: string;
}


/**
 * Matches OpenAPI schema: #/components/schemas/CoffeeBean
 */
export interface CoffeeBean {
  id: string;
  name_ar: string;
  name_en?: string;
  country_ar: string;
  country_en?: string;
  species: 'arabica' | 'robusta' | 'hybrid' | 'Arabica' | 'Robusta';
  processing_ar?: string;
  processing_en?: string;
  sensory_profile_ar?: string;
  recommended_roast_ar?: string;
  commercial_traits_ar?: string;
  image_url?: string;
  is_published?: boolean;
  // Extended UI fields
  code: string;
  region_ar: string;
  region_en: string;
  species_ar: string;
  process_ar: string;
  process_en: string;
  altitude: string;
  screen_size: string;
  moisture_percent: string;
  caffeine_percent: string;
  acidity_level: number;
  body_level: number;
  bitterness_level: number;
  crema_level: number;
  flavor_notes_ar: string[];
  flavor_notes_en: string[];
  suitable_for: ('turkish' | 'espresso' | 'filter')[];
  avg_green_price_egp: number;
  avg_roasted_price_egp: number;
  roast_recommendation_ar: string;
  roast_recommendation_en: string;
  commercial_notes_ar: string;
  commercial_notes_en: string;
}

export interface BlendIngredient {
  bean_name_ar: string;
  bean_name_en: string;
  percentage: number;
  species: 'Arabica' | 'Robusta';
  avg_price_egp: number;
}

/**
 * Matches OpenAPI schema: #/components/schemas/CoffeeBlend
 */
export interface CoffeeBlend {
  id: string;
  blend_number: number;
  name_ar: string;
  name_en?: string;
  category_ar?: string;
  components?: (string | { bean_name?: string; percentage?: number })[];
  total_percentage?: number;
  characteristics_ar?: string;
  roast_notes_ar?: string;
  is_published?: boolean;
  // Computed & normalized UI fields
  code: string;
  category: 'turkish' | 'espresso' | 'both' | 'french_flavored';
  category_en: string;
  tier_ar: string;
  tier_en: string;
  arabica_percent: number;
  robusta_percent: number;
  roast_level_ar: string;
  roast_level_en: string;
  expected_loss_percent: number;
  estimated_green_cost_egp: number;
  estimated_roasted_cost_egp: number;
  wesh_or_crema_score: number;
  body_score: number;
  aroma_score: number;
  ingredients: BlendIngredient[];
  flavor_profile_ar: string;
  flavor_profile_en: string;
  target_customer_ar: string;
  target_customer_en: string;
  roaster_secret_ar: string;
  roaster_secret_en: string;
}

/**
 * Matches OpenAPI schema: #/components/schemas/ArticleCategory
 */
export interface ArticleCategory {
  id: string;
  name_ar: string;
  name_en?: string;
  slug?: string;
  description_ar?: string;
  description_en?: string;
  sort_order?: number;
  article_count: number;
}

/**
 * Matches OpenAPI schema: #/components/schemas/Article
 */
export interface Article {
  id: string;
  title_ar: string;
  title_en?: string;
  slug?: string;
  category_id: string;
  category_name?: string;
  summary_ar?: string;
  content_ar: string | string[];
  content_en?: string | string[];
  cover_image?: string;
  related_beans?: string[];
  related_blends?: string[];
  seo_title?: string;
  seo_description?: string;
  status?: 'draft' | 'published';
  publish_date?: string;
  // UI Normalized fields
  category_name_ar: string;
  category_name_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  author_ar: string;
  author_en: string;
  read_time_min: number;
  published_date: string;
  key_takeaways_ar: string[];
  key_takeaways_en: string[];
}

export interface CustomerAccount {
  id: string;
  name: string;
  contact: string;
  created_date: string;
}

/**
 * Matches OpenAPI schema: #/components/schemas/AudioClip
 */
export interface AudioClip {
  id: string;
  title_ar: string;
  description_ar?: string;
  file_uri: string;
  file_name?: string;
  is_published?: boolean;
  created_date?: string;
  updated_date?: string;
  created_by_id?: string;
  // Resolved playable URL (signed URL from Base44 private storage or direct URL)
  audio_url: string;
}

/**
 * Matches OpenAPI schema: #/components/schemas/Order
 */
export interface OrderRecord {
  id: string;
  order_number: string;
  customer_name: string;
  customer_contact: string;
  catalog_item_id: string;
  item_title: string;
  quantity: number;
  total_price: number;
  currency: string;
  payment_method: 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other';
  receipt_image_url?: string;
  payment_status: 'unpaid' | 'under_review' | 'paid' | 'rejected';
  order_status:
    | 'new'
    | 'under_review'
    | 'paid'
    | 'completed'
    | 'cancelled'
    | 'rejected';
  admin_notes?: string;
  approved_by?: string;
  created_date: string;
  updated_date?: string;
  // Customer isolation & optional account fields
  client_id?: string;
  customer_id?: string;
  // Backward-compatible aliases for UI
  customer_phone?: string;
  customer_email?: string;
  governorate?: string;
  item_id?: string;
  item_title_ar?: string;
  item_title_en?: string;
  item_type?: 'book' | 'bundle' | 'course';
  amount_egp?: number;
  payment_reference?: string;
  delivery_file_or_url?: string;
}

export interface CalculatorComponentItem {
  id: string;
  name: string;
  percentage: number;
  pricePerKg: number;
}

export interface AIBlendAnalysisResult {
  summaryVerdict: string;
  sensoryProfile: {
    bodyScore: number;
    cremaOrWeshScore: number;
    acidityScore: number;
    bitternessScore: number;
    aromaNotes: string;
  };
  pros: string[];
  cons: string[];
  suitabilityAnalysis: {
    turkishSuitability: string;
    espressoSuitability: string;
    recommendedRoastLevel: string;
  };
  flavorOptimizationTips: string[];
  costOptimizationTips: string[];
}
