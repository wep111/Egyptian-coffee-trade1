import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'placeholder-key',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Official Telegram Bot (@wepegcoffeebot) & Admin Chat ID configuration
const DEFAULT_TELEGRAM_BOT_TOKEN =
  '9209854209:AAEILtr1kHGKET8uL6LC1h5UDkrR-k7eHgI';
const DEFAULT_TELEGRAM_BOT_USERNAME = 'wepegcoffeebot';
const DEFAULT_TELEGRAM_CHAT_ID = '8993280027';
const SUBSCRIBERS_FILE = path.join(__dirname, '.telegram-subscribers.json');
const ORDERS_STORE_FILE = path.join(__dirname, '.orders-store.json');
const CUSTOMERS_STORE_FILE = path.join(__dirname, '.customers-store.json');

interface TelegramSubscriberStore {
  chatIds: (string | number)[];
  lastUpdateId: number;
  pendingMessages: {
    text: string;
    receiptImageUrl?: string;
    orderNumber?: string;
  }[];
}

export interface StoredCustomer {
  id: string;
  name: string;
  contact: string;
  normalized_contact: string;
  password_pin: string;
  auth_token: string;
  created_date: string;
}

export interface LocalOrder {
  id: string;
  base44_id?: string;
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
  client_id?: string;
  customer_id?: string;
  customer_phone?: string;
  governorate?: string;
  item_title_ar?: string;
  item_title_en?: string;
  amount_egp?: number;
  payment_reference?: string;
  delivery_file_or_url?: string;
}

function normalizeContactKey(raw: string): string {
  const trimmed = String(raw || '').trim().toLowerCase();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.replace(/^20/, '0').replace(/^0020/, '0');
  }
  return trimmed;
}

function loadTelegramStore(): TelegramSubscriberStore {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
      const rawIds = Array.isArray(parsed.chatIds) ? parsed.chatIds : [];
      const chatSet = new Set<string | number>([
        DEFAULT_TELEGRAM_CHAT_ID,
        ...rawIds,
      ]);
      return {
        chatIds: Array.from(chatSet),
        lastUpdateId: Number(parsed.lastUpdateId) || 0,
        pendingMessages: Array.isArray(parsed.pendingMessages)
          ? parsed.pendingMessages
          : [],
      };
    }
  } catch {
    // Ignore read errors
  }
  return {
    chatIds: [DEFAULT_TELEGRAM_CHAT_ID],
    lastUpdateId: 0,
    pendingMessages: [],
  };
}

function saveTelegramStore(store: TelegramSubscriberStore) {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

function loadOrdersStore(): LocalOrder[] {
  try {
    if (fs.existsSync(ORDERS_STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ORDERS_STORE_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore read errors
  }
  return [];
}

function saveOrdersStore(orders: LocalOrder[]) {
  try {
    fs.writeFileSync(ORDERS_STORE_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch {
    // Ignore write errors
  }
}

function loadCustomersStore(): StoredCustomer[] {
  try {
    if (fs.existsSync(CUSTOMERS_STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CUSTOMERS_STORE_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore read errors
  }
  return [];
}

function saveCustomersStore(customers: StoredCustomer[]) {
  try {
    fs.writeFileSync(
      CUSTOMERS_STORE_FILE,
      JSON.stringify(customers, null, 2),
      'utf-8'
    );
  } catch {
    // Ignore write errors
  }
}

const telegramStore = loadTelegramStore();
const localOrders: LocalOrder[] = loadOrdersStore();
const customersStore: StoredCustomer[] = loadCustomersStore();
const notifiedOrderNumbers = new Set<string>();
let activeTelegramSyncPromise: Promise<(string | number)[]> | null = null;
let lastBase44SyncAt = 0;

function getNormalizedBase44ApiUrl(): string {
  const raw = (
    process.env.VITE_BASE44_API_URL || 'https://egcoffee.base44.app/api'
  )
    .trim()
    .replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

function getBase44AuthHeaders(): Record<string, string> {
  const token = (process.env.VITE_BASE44_API_TOKEN || '').trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'حط_التوكن_هنا') {
    headers.Authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }
  return headers;
}

function extractDeliveryUrl(raw: any): string {
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

async function fetchCatalogDeliveryUrlFromBase44(
  catalogItemId?: string,
  itemTitle?: string
): Promise<string> {
  try {
    const baseUrl = getNormalizedBase44ApiUrl();
    const res = await fetch(`${baseUrl}/entities/CatalogItem?limit=100`, {
      method: 'GET',
      headers: getBase44AuthHeaders(),
    });
    if (!res.ok) return '';
    const json = await res.json();
    const items: any[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.items)
      ? json.items
      : [];

    const matched = items.find(
      (it) =>
        (catalogItemId && String(it.id) === String(catalogItemId)) ||
        (itemTitle &&
          (String(it.title_ar || '').trim() === String(itemTitle).trim() ||
            String(it.title_en || '').trim() === String(itemTitle).trim()))
    );
    return extractDeliveryUrl(matched);
  } catch {
    return '';
  }
}

async function updateOrderInBase44(
  order: LocalOrder,
  decision: 'approve' | 'reject'
): Promise<void> {
  const baseUrl = getNormalizedBase44ApiUrl();
  const payload =
    decision === 'approve'
      ? {
          payment_status: 'paid',
          order_status: 'completed',
          approved_by: 'Telegram Admin (@wepegcoffeebot)',
          delivery_file_or_url: order.delivery_file_or_url || '',
        }
      : {
          payment_status: 'unpaid',
          order_status: 'cancelled',
          admin_notes: 'لم تتم معالجة طلبك',
        };

  try {
    let targetId = order.base44_id;
    if (
      !targetId &&
      order.id &&
      !order.id.startsWith('ord-eg-') &&
      !order.id.startsWith('ord-1')
    ) {
      targetId = order.id;
    }

    if (!targetId) {
      // Find matching order in Base44 by order_number
      const listRes = await fetch(
        `${baseUrl}/entities/Order?limit=100&sort_by=-created_date`,
        {
          method: 'GET',
          headers: getBase44AuthHeaders(),
        }
      );
      if (listRes.ok) {
        const listJson = await listRes.json();
        const items: any[] = Array.isArray(listJson)
          ? listJson
          : Array.isArray(listJson?.data)
          ? listJson.data
          : [];
        const found = items.find(
          (it) =>
            String(it.order_number || '').toUpperCase() ===
            String(order.order_number || '').toUpperCase()
        );
        if (found?.id) {
          targetId = String(found.id);
          order.base44_id = targetId;
        }
      }
    }

    if (targetId) {
      await fetch(`${baseUrl}/entities/Order/${targetId}`, {
        method: 'PUT',
        headers: getBase44AuthHeaders(),
        body: JSON.stringify(payload),
      }).catch(() => {});
    }
  } catch {
    // Ignore Base44 network error
  }
}

async function applyAdminOrderDecision(
  orderNumberRaw: string,
  decision: 'approve' | 'reject'
): Promise<LocalOrder | null> {
  const cleanCode = orderNumberRaw.trim().toUpperCase();
  let targetOrder = cleanCode
    ? localOrders.find(
        (o) => String(o.order_number || '').toUpperCase() === cleanCode
      )
    : localOrders.find(
        (o) =>
          o.payment_status === 'under_review' || o.order_status === 'new'
      ) || localOrders[0];

  if (!targetOrder && cleanCode) {
    // Try fetching from Base44 if not yet in localOrders
    try {
      const baseUrl = getNormalizedBase44ApiUrl();
      const res = await fetch(
        `${baseUrl}/entities/Order?limit=100&sort_by=-created_date`,
        {
          method: 'GET',
          headers: getBase44AuthHeaders(),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const items: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];
        const found = items.find(
          (it) =>
            String(it.order_number || '').toUpperCase() === cleanCode
        );
        if (found) {
          targetOrder = {
            id: String(found.id || `ord-eg-${Date.now()}`),
            base44_id: String(found.id || ''),
            order_number: found.order_number || cleanCode,
            customer_name: found.customer_name || 'عميل المنصة',
            customer_contact: found.customer_contact || '',
            catalog_item_id: found.catalog_item_id || '',
            item_title: found.item_title || 'إصدار رقمي',
            quantity: Number(found.quantity || 1),
            total_price: Number(found.total_price || 0),
            currency: found.currency || 'EGP',
            payment_method: found.payment_method || 'instapay',
            receipt_image_url: found.receipt_image_url || '',
            payment_status: 'under_review',
            order_status: 'new',
            delivery_file_or_url: extractDeliveryUrl(found),
            created_date: found.created_date || new Date().toISOString(),
          };
          localOrders.unshift(targetOrder);
        }
      }
    } catch {
      // Ignore
    }
  }

  if (!targetOrder) return null;

  if (decision === 'approve') {
    targetOrder.payment_status = 'paid';
    targetOrder.order_status = 'completed';
    targetOrder.approved_by = 'Telegram Admin';
    targetOrder.updated_date = new Date().toISOString();
    if (!targetOrder.delivery_file_or_url) {
      const fetchedUrl = await fetchCatalogDeliveryUrlFromBase44(
        targetOrder.catalog_item_id,
        targetOrder.item_title
      );
      if (fetchedUrl) {
        targetOrder.delivery_file_or_url = fetchedUrl;
      }
    }
  } else {
    targetOrder.payment_status = 'rejected';
    targetOrder.order_status = 'cancelled';
    targetOrder.admin_notes = 'لم تتم معالجة طلبك';
    targetOrder.updated_date = new Date().toISOString();
  }

  saveOrdersStore(localOrders);
  await updateOrderInBase44(targetOrder, decision);
  return targetOrder;
}

function getActiveTelegramBotToken(): string {
  const envToken = (
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.VITE_TELEGRAM_BOT_TOKEN ||
    ''
  )
    .trim()
    .replace(/^["']|["']$/g, '');
  if (!envToken || envToken.startsWith('8922960077:')) {
    return DEFAULT_TELEGRAM_BOT_TOKEN;
  }
  return envToken;
}

function getConfiguredTelegramTargets(): (string | number)[] {
  const targets = new Set<string | number>([
    DEFAULT_TELEGRAM_CHAT_ID,
    ...telegramStore.chatIds,
  ]);
  const envChat = (
    process.env.TELEGRAM_CHAT_ID ||
    process.env.VITE_TELEGRAM_CHAT_ID ||
    ''
  )
    .trim()
    .replace(/^["']|["']$/g, '');

  const lower = envChat.toLowerCase();
  if (
    envChat &&
    lower !== `@${DEFAULT_TELEGRAM_BOT_USERNAME}` &&
    lower !== DEFAULT_TELEGRAM_BOT_USERNAME &&
    lower !== '@egyptcoffee21bot' &&
    lower !== 'egyptcoffee21bot'
  ) {
    targets.add(envChat);
  }
  return Array.from(targets);
}

async function sendTelegramOrderToChat(
  botToken: string,
  chatId: string | number,
  messageText: string,
  receiptImageUrl?: string,
  orderNumber?: string
): Promise<boolean> {
  try {
    const inlineKeyboard = orderNumber
      ? {
          inline_keyboard: [
            [
              {
                text: '✅ موافق (تفعيل رابط التحميل)',
                callback_data: `approve:${orderNumber}`,
              },
              {
                text: '❌ رفض الطلب',
                callback_data: `reject:${orderNumber}`,
              },
            ],
          ],
        }
      : undefined;

    // 1. Send text + inline buttons immediately so admin receives notification in <200ms
    let tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'Markdown',
          ...(inlineKeyboard ? { reply_markup: inlineKeyboard } : {}),
        }),
      }
    );

    // Fallback: if Markdown parsing fails due to underscores/special chars in customer input, retry as plain text immediately
    if (!tgRes.ok) {
      const plainText = messageText.replace(/[*`]/g, '');
      tgRes = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: plainText,
            ...(inlineKeyboard ? { reply_markup: inlineKeyboard } : {}),
          }),
        }
      );
    }

    if (!tgRes.ok) {
      return false;
    }

    // 2. Upload receipt image asynchronously right after so it never delays the instant text notification
    if (receiptImageUrl) {
      void (async () => {
        try {
          if (receiptImageUrl.startsWith('data:image/')) {
            const matches = receiptImageUrl.match(
              /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
            );
            if (matches) {
              const mimeType = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              const formData = new FormData();
              formData.append('chat_id', String(chatId));
              formData.append(
                'caption',
                `🧾 إيصال الدفع المرفق للطلب رقم: ${orderNumber || '-'}`
              );
              const blob = new Blob([buffer], { type: mimeType });
              formData.append(
                'photo',
                blob,
                `receipt-${orderNumber || 'order'}.jpg`
              );

              await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                method: 'POST',
                body: formData,
              });
            }
          } else if (
            receiptImageUrl.startsWith('http://') ||
            receiptImageUrl.startsWith('https://')
          ) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                photo: receiptImageUrl,
                caption: `🧾 إيصال الدفع المرفق للطلب رقم: ${orderNumber || '-'}`,
              }),
            });
          }
        } catch {
          // Ignore background photo upload error
        }
      })();
    }

    return true;
  } catch {
    return false;
  }
}

async function dispatchInstantTelegramOrderNotification(params: {
  order_number?: string;
  customer_name?: string;
  customer_contact?: string;
  item_title?: string;
  quantity?: number;
  total_price?: number;
  currency?: string;
  payment_method_label?: string;
  receipt_image_url?: string;
  admin_notes?: string;
}): Promise<{ sent: boolean; deliveredToCount: number }> {
  const orderNum = String(params.order_number || '').trim();
  if (orderNum && notifiedOrderNumbers.has(orderNum.toUpperCase())) {
    return { sent: true, deliveredToCount: 1 };
  }
  if (orderNum) {
    notifiedOrderNumbers.add(orderNum.toUpperCase());
  }

  const botToken = getActiveTelegramBotToken();
  const messageText = [
    '☕ *طلب شراء جديد — منصة تجارة القهوة المصرية*',
    `• *رقم الطلب:* \`${orderNum || '-'}\``,
    `• *العميل:* ${params.customer_name || '-'}`,
    `• *التواصل:* \`${params.customer_contact || '-'}\``,
    `• *المنتج:* ${params.item_title || '-'} (الكمية: ${params.quantity || 1})`,
    `• *الإجمالي:* ${params.total_price || 0} ${params.currency || 'EGP'}`,
    `• *طريقة الدفع:* ${params.payment_method_label || '-'}`,
    params.admin_notes ? `• *ملاحظات:* ${params.admin_notes}` : '',
    `• *وقت الطلب:* ${new Date().toLocaleString('ar-EG')}`,
    '',
    '👇 *اضغط على (موافق) لتفعيل رابط تحميل الكتاب فوراً للعميل أو (رفض) لإلغاء الطلب:*',
  ]
    .filter(Boolean)
    .join('\n');

  // Send immediately to configured targets (8993280027 + any subscribers) without waiting for getUpdates
  const targetChatIds = getConfiguredTelegramTargets();
  let deliveredCount = 0;

  if (botToken && targetChatIds.length > 0) {
    const results = await Promise.all(
      targetChatIds.map((chatId) =>
        sendTelegramOrderToChat(
          botToken,
          chatId,
          messageText,
          params.receipt_image_url,
          orderNum
        )
      )
    );
    deliveredCount = results.filter(Boolean).length;
  }

  if (deliveredCount === 0) {
    telegramStore.pendingMessages.push({
      text: messageText,
      receiptImageUrl: params.receipt_image_url,
      orderNumber: orderNum,
    });
    saveTelegramStore(telegramStore);
  }

  return { sent: deliveredCount > 0, deliveredToCount: deliveredCount };
}

async function syncTelegramBotUpdatesInternal(): Promise<(string | number)[]> {
  const botToken = getActiveTelegramBotToken();
  if (!botToken) return getConfiguredTelegramTargets();

  try {
    const offsetParam =
      telegramStore.lastUpdateId > 0
        ? `?offset=${telegramStore.lastUpdateId + 1}&timeout=0`
        : '?timeout=0';
    let res = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates${offsetParam}`
    );

    if (res.status === 409) {
      const errJson = await res.json().catch(() => null);
      if (
        errJson?.description &&
        String(errJson.description).toLowerCase().includes('webhook')
      ) {
        await fetch(
          `https://api.telegram.org/bot${botToken}/deleteWebhook`
        ).catch(() => {});
        res = await fetch(
          `https://api.telegram.org/bot${botToken}/getUpdates${offsetParam}`
        );
      } else {
        return getConfiguredTelegramTargets();
      }
    }

    if (!res.ok) return getConfiguredTelegramTargets();

    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.result)) {
      return getConfiguredTelegramTargets();
    }

    let storeChanged = false;
    const newlyRegisteredChatIds: (string | number)[] = [];

    for (const update of data.result) {
      if (update.update_id > telegramStore.lastUpdateId) {
        telegramStore.lastUpdateId = update.update_id;
        storeChanged = true;
      }

      // 1. Handle Inline Button Callback Queries (approve:EGC-... / reject:EGC-...)
      if (update.callback_query) {
        const cb = update.callback_query;
        const cbData = String(cb.data || '');
        const cbChatId = cb.message?.chat?.id;

        if (cbChatId) {
          const exists = telegramStore.chatIds.some(
            (id) => String(id) === String(cbChatId)
          );
          if (!exists) {
            telegramStore.chatIds.push(cbChatId);
            storeChanged = true;
          }
        }

        if (cbData.startsWith('approve:') || cbData.startsWith('reject:')) {
          const isApprove = cbData.startsWith('approve:');
          const orderNum = cbData.split(':')[1] || '';
          const updatedOrder = await applyAdminOrderDecision(
            orderNum,
            isApprove ? 'approve' : 'reject'
          );

          await fetch(
            `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query_id: cb.id,
                text: isApprove
                  ? `✅ تمت الموافقة وتفعيل التحميل للطلب ${orderNum}`
                  : `❌ تم رفض الطلب ${orderNum}`,
                show_alert: false,
              }),
            }
          ).catch(() => {});

          if (cbChatId) {
            const replyText = isApprove
              ? [
                  `✅ تمت الموافقة على الطلب رقم: ${orderNum}`,
                  `• العميل: ${updatedOrder?.customer_name || '-'}`,
                  `• المنتج: ${updatedOrder?.item_title || '-'}`,
                  `• الحالة الآن عند العميل: مدفوع ومفعّل — ظهر للعميل رابط تحميل الكتاب مباشرة.`,
                ].join('\n')
              : [
                  `❌ تم رفض الطلب رقم: ${orderNum}`,
                  `• العميل: ${updatedOrder?.customer_name || '-'}`,
                  `• الحالة الآن عند العميل: لم تتم معالجة طلبك.`,
                ].join('\n');

            await fetch(
              `https://api.telegram.org/bot${botToken}/sendMessage`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: cbChatId,
                  text: replyText,
                }),
              }
            ).catch(() => {});
          }
        }
        continue;
      }

      const chat =
        update.message?.chat ||
        update.channel_post?.chat ||
        update.my_chat_member?.chat;

      if (chat && chat.id) {
        const exists = telegramStore.chatIds.some(
          (id) => String(id) === String(chat.id)
        );
        if (!exists) {
          telegramStore.chatIds.push(chat.id);
          newlyRegisteredChatIds.push(chat.id);
          storeChanged = true;
        } else if (
          typeof update.message?.text === 'string' &&
          update.message.text.startsWith('/start')
        ) {
          newlyRegisteredChatIds.push(chat.id);
        }
      }

      // 2. Also support text replies ("موافق" / "رفض" + optional order code)
      const msgText = String(update.message?.text || '').trim();
      if (msgText && !msgText.startsWith('/start') && chat?.id) {
        const isApproveText =
          msgText.includes('موافق') ||
          msgText.toLowerCase().startsWith('approve');
        const isRejectText =
          msgText.includes('رفض') ||
          msgText.toLowerCase().startsWith('reject');

        if (isApproveText || isRejectText) {
          const codeMatch = msgText.match(/EGC-\d{4}-\d+/i);
          const replyToText = String(
            update.message?.reply_to_message?.text ||
              update.message?.reply_to_message?.caption ||
              ''
          );
          const replyCodeMatch = replyToText.match(/EGC-\d{4}-\d+/i);
          const targetCode = codeMatch
            ? codeMatch[0].toUpperCase()
            : replyCodeMatch
            ? replyCodeMatch[0].toUpperCase()
            : '';

          const updatedOrder = await applyAdminOrderDecision(
            targetCode,
            isApproveText ? 'approve' : 'reject'
          );

          if (updatedOrder) {
            await fetch(
              `https://api.telegram.org/bot${botToken}/sendMessage`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chat.id,
                  text: isApproveText
                    ? `✅ تمت الموافقة على الطلب رقم ${updatedOrder.order_number} وتفعيل رابط التحميل للعميل فوراً!`
                    : `❌ تم رفض الطلب رقم ${updatedOrder.order_number} وإظهار رسالة "لم تتم معالجة طلبك" للعميل.`,
                }),
              }
            ).catch(() => {});
          }
        }
      }
    }

    // Send confirmation welcome message to any user who just sent /start
    for (const chatId of newlyRegisteredChatIds) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: [
            '✅ تم تفعيل وربط بوت إشعارات منصة تجارة القهوة المصرية بنجاح!',
            `• البوت النشط: @${DEFAULT_TELEGRAM_BOT_USERNAME}`,
            `• معرف المحادثة (Chat ID): ${chatId}`,
            '',
            'ستصلك هنا فوراً وفي نفس اللحظة جميع طلبات الشراء الجديدة مع أزرار (✅ موافق / ❌ رفض) لتفعيل رابط تحميل الكتاب للعميل مباشرة بضغطة زر.',
          ].join('\n'),
        }),
      }).catch(() => {});
    }

    // Flush any pending order notifications
    const allTargets = getConfiguredTelegramTargets();
    if (allTargets.length > 0 && telegramStore.pendingMessages.length > 0) {
      const pendingCopy = [...telegramStore.pendingMessages];
      telegramStore.pendingMessages = [];
      storeChanged = true;

      for (const item of pendingCopy) {
        for (const targetChatId of allTargets) {
          await sendTelegramOrderToChat(
            botToken,
            targetChatId,
            item.text,
            item.receiptImageUrl,
            item.orderNumber
          );
        }
      }
    }

    if (storeChanged) {
      saveTelegramStore(telegramStore);
    }
  } catch {
    // Ignore polling network errors
  }

  return getConfiguredTelegramTargets();
}

function syncTelegramBotUpdates(): Promise<(string | number)[]> {
  if (!activeTelegramSyncPromise) {
    activeTelegramSyncPromise = syncTelegramBotUpdatesInternal().finally(() => {
      activeTelegramSyncPromise = null;
    });
  }
  return activeTelegramSyncPromise;
}

interface OrderFilterContext {
  query?: string;
  clientId?: string;
  customerId?: string;
  authToken?: string;
  orderNumbers?: string[];
}

function findAuthenticatedCustomer(
  customerId?: string,
  authToken?: string
): StoredCustomer | null {
  if (!customerId || !authToken) return null;
  return (
    customersStore.find(
      (c) => c.id === customerId && c.auth_token === authToken
    ) || null
  );
}

function linkOrdersToCustomerAccount(
  customer: StoredCustomer,
  clientId?: string,
  orderNumbers?: string[]
) {
  const codeSet = new Set(
    (orderNumbers || []).map((c) => String(c || '').trim().toUpperCase()).filter(Boolean)
  );
  let changed = false;
  for (const ord of localOrders) {
    const matchesClient = clientId && ord.client_id && ord.client_id === clientId;
    const matchesCode = codeSet.has(String(ord.order_number || '').toUpperCase());
    const matchesContact =
      !ord.customer_id &&
      normalizeContactKey(ord.customer_contact) === customer.normalized_contact;

    if (matchesClient || matchesCode || matchesContact) {
      if (ord.customer_id !== customer.id) {
        ord.customer_id = customer.id;
        changed = true;
      }
      if (clientId && !ord.client_id) {
        ord.client_id = clientId;
        changed = true;
      }
    }
  }
  if (changed) {
    saveOrdersStore(localOrders);
  }
}

async function getMergedSyncedOrders(
  ctx: OrderFilterContext = {}
): Promise<LocalOrder[]> {
  // 1. Poll Telegram updates first so any recent button click is applied immediately
  await syncTelegramBotUpdates().catch(() => {});

  // 2. Sync Base44 Order & CatalogItem (throttled to avoid hammering Base44 on concurrent requests)
  const now = Date.now();
  if (now - lastBase44SyncAt > 2500) {
    lastBase44SyncAt = now;
    const baseUrl = getNormalizedBase44ApiUrl();
    let base44Orders: any[] = [];
    let base44Catalog: any[] = [];

    try {
      const [ordRes, catRes] = await Promise.all([
        fetch(`${baseUrl}/entities/Order?limit=100&sort_by=-created_date`, {
          method: 'GET',
          headers: getBase44AuthHeaders(),
        }).catch(() => null),
        fetch(`${baseUrl}/entities/CatalogItem?limit=100`, {
          method: 'GET',
          headers: getBase44AuthHeaders(),
        }).catch(() => null),
      ]);

      if (ordRes && ordRes.ok) {
        const ordJson = await ordRes.json();
        base44Orders = Array.isArray(ordJson)
          ? ordJson
          : Array.isArray(ordJson?.data)
          ? ordJson.data
          : Array.isArray(ordJson?.items)
          ? ordJson.items
          : [];
      }

      if (catRes && catRes.ok) {
        const catJson = await catRes.json();
        base44Catalog = Array.isArray(catJson)
          ? catJson
          : Array.isArray(catJson?.data)
          ? catJson.data
          : Array.isArray(catJson?.items)
          ? catJson.items
          : [];
      }
    } catch {
      // Ignore Base44 fetch errors
    }

    const catalogUrlMap = new Map<string, string>();
    const catalogTitleUrlMap = new Map<string, string>();
    for (const item of base44Catalog) {
      const url = extractDeliveryUrl(item);
      if (url) {
        if (item.id) catalogUrlMap.set(String(item.id), url);
        if (item.title_ar)
          catalogTitleUrlMap.set(String(item.title_ar).trim(), url);
        if (item.title_en)
          catalogTitleUrlMap.set(String(item.title_en).trim(), url);
      }
    }

    let changed = false;

    for (const raw of base44Orders) {
      const ordNum = String(raw.order_number || '').trim();
      if (!ordNum) continue;

      const existing = localOrders.find(
        (lo) => lo.order_number.toUpperCase() === ordNum.toUpperCase()
      );

      const rawPayStatus = String(raw.payment_status || '').toLowerCase();
      const rawOrdStatus = String(
        raw.order_status || raw.status || ''
      ).toLowerCase();

      const isBase44Approved =
        rawPayStatus === 'paid' ||
        rawOrdStatus === 'paid' ||
        rawOrdStatus === 'completed' ||
        rawOrdStatus === 'confirmed' ||
        rawOrdStatus === 'delivered';

      const isBase44Rejected =
        rawPayStatus === 'rejected' ||
        rawOrdStatus === 'cancelled' ||
        rawOrdStatus === 'rejected' ||
        (rawPayStatus === 'unpaid' && rawOrdStatus === 'cancelled');

      const resolvedUrl =
        extractDeliveryUrl(raw) ||
        catalogUrlMap.get(String(raw.catalog_item_id || '')) ||
        catalogTitleUrlMap.get(String(raw.item_title || '').trim()) ||
        '';

      if (existing) {
        if (!existing.base44_id && raw.id) {
          existing.base44_id = String(raw.id);
          changed = true;
        }
        if (resolvedUrl && !existing.delivery_file_or_url) {
          existing.delivery_file_or_url = resolvedUrl;
          changed = true;
        }
        if (isBase44Approved && existing.payment_status !== 'paid') {
          existing.payment_status = 'paid';
          existing.order_status = 'completed';
          changed = true;
        } else if (isBase44Rejected && existing.order_status !== 'cancelled') {
          existing.payment_status = 'rejected';
          existing.order_status = 'cancelled';
          existing.admin_notes = raw.admin_notes || 'لم تتم معالجة طلبك';
          changed = true;
        }
      } else {
        localOrders.push({
          id: String(raw.id || `ord-eg-${Date.now()}-${Math.random()}`),
          base44_id: raw.id ? String(raw.id) : undefined,
          order_number: ordNum,
          customer_name: raw.customer_name || 'عميل المنصة',
          customer_contact: raw.customer_contact || raw.customer_phone || '',
          customer_phone: raw.customer_contact || raw.customer_phone || '',
          catalog_item_id: raw.catalog_item_id || '',
          item_title: raw.item_title || 'إصدار رقمي',
          item_title_ar: raw.item_title_ar || raw.item_title || 'إصدار رقمي',
          item_title_en: raw.item_title_en || raw.item_title || 'Digital Item',
          quantity: Number(raw.quantity || 1),
          total_price: Number(raw.total_price ?? raw.amount_egp ?? 0),
          amount_egp: Number(raw.total_price ?? raw.amount_egp ?? 0),
          currency: raw.currency || 'EGP',
          payment_method: raw.payment_method || 'instapay',
          receipt_image_url: raw.receipt_image_url || '',
          payment_status: isBase44Approved
            ? 'paid'
            : isBase44Rejected
            ? 'rejected'
            : 'under_review',
          order_status: isBase44Approved
            ? 'completed'
            : isBase44Rejected
            ? 'cancelled'
            : 'new',
          admin_notes:
            isBase44Rejected && !raw.admin_notes
              ? 'لم تتم معالجة طلبك'
              : raw.admin_notes || '',
          approved_by: raw.approved_by,
          delivery_file_or_url: resolvedUrl,
          created_date: raw.created_date || new Date().toISOString(),
          updated_date: raw.updated_date,
        });
        changed = true;
      }
    }

    for (const lo of localOrders) {
      if (!lo.delivery_file_or_url) {
        const url =
          catalogUrlMap.get(String(lo.catalog_item_id || '')) ||
          catalogTitleUrlMap.get(String(lo.item_title || '').trim()) ||
          '';
        if (url) {
          lo.delivery_file_or_url = url;
          changed = true;
        }
      }
    }

    if (changed) {
      saveOrdersStore(localOrders);
    }
  }

  // 3. STRICT MANDATORY PER-CUSTOMER DATA ISOLATION
  const authCustomer = findAuthenticatedCustomer(ctx.customerId, ctx.authToken);
  const clientId = String(ctx.clientId || '').trim();
  const ownedOrderCodes = new Set(
    (ctx.orderNumbers || [])
      .map((c) => String(c || '').trim().toUpperCase())
      .filter(Boolean)
  );

  const isOwnedByCurrentVisitor = (o: LocalOrder): boolean => {
    const codeUpper = String(o.order_number || '').toUpperCase();
    if (authCustomer) {
      if (o.customer_id && o.customer_id === authCustomer.id) return true;
      if (
        !o.customer_id &&
        normalizeContactKey(o.customer_contact) ===
          authCustomer.normalized_contact
      ) {
        return true;
      }
    }
    if (clientId && o.client_id && o.client_id === clientId) {
      if (!o.customer_id || (authCustomer && o.customer_id === authCustomer.id)) {
        return true;
      }
    }
    if (ownedOrderCodes.has(codeUpper)) {
      if (!o.customer_id || (authCustomer && o.customer_id === authCustomer.id)) {
        return true;
      }
    }
    return false;
  };

  const q = String(ctx.query || '').trim();
  if (q) {
    const qUpper = q.toUpperCase();
    const qLower = q.toLowerCase();
    const qNormContact = normalizeContactKey(q);

    return localOrders.filter((o) => {
      const ordCodeUpper = String(o.order_number || '').toUpperCase();
      // Exact order number lookup (e.g., EGC-2026-6227) is always allowed for the order holder
      if (ordCodeUpper === qUpper) {
        return true;
      }
      // If already owned by this customer's session/account, allow partial search within their own orders
      if (isOwnedByCurrentVisitor(o)) {
        return (
          ordCodeUpper.includes(qUpper) ||
          String(o.customer_contact || '').toLowerCase().includes(qLower) ||
          String(o.customer_name || '').toLowerCase().includes(qLower) ||
          String(o.item_title || '').toLowerCase().includes(qLower)
        );
      }
      // Allow lookup by exact phone/email contact (at least 8 chars) ONLY if order is not locked to another customer account
      if (
        qNormContact.length >= 8 &&
        normalizeContactKey(o.customer_contact) === qNormContact &&
        (!o.customer_id || (authCustomer && o.customer_id === authCustomer.id))
      ) {
        return true;
      }
      return false;
    });
  }

  // When no explicit search query is entered, return ONLY orders strictly belonging to this customer/session
  return localOrders.filter(isOwnedByCurrentVisitor);
}

function parseOrderFilterFromReq(req: express.Request): OrderFilterContext {
  const query = (req.query.phone as string | undefined)?.trim();
  const clientId =
    (req.query.clientId as string | undefined)?.trim() ||
    (req.headers['x-client-id'] as string | undefined)?.trim();
  const customerId =
    (req.query.customerId as string | undefined)?.trim() ||
    (req.headers['x-customer-id'] as string | undefined)?.trim();
  const authHeader = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const authToken =
    (req.query.authToken as string | undefined)?.trim() || authHeader;
  const rawCodes = (req.query.orderNumbers as string | undefined) || '';
  const orderNumbers = rawCodes
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return { query, clientId, customerId, authToken, orderNumbers };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Background poll every 2.5s to process Telegram approval/rejection buttons immediately
  setInterval(() => {
    syncTelegramBotUpdates().catch(() => {});
  }, 2500);
  syncTelegramBotUpdates().catch(() => {});

  // Optional Customer Account Endpoints (Register / Login / Session Check)
  app.post('/api/customers/register', (req, res) => {
    const { name, contact, password, clientId, orderNumbers } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanContact = String(contact || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanName || !cleanContact || cleanPass.length < 4) {
      res.status(400).json({
        error:
          'يرجى إدخال الاسم ورقم الهاتف/البريد الإلكتروني وكلمة مرور (4 أحرف أو أرقام على الأقل).',
      });
      return;
    }

    const normContact = normalizeContactKey(cleanContact);
    const existing = customersStore.find(
      (c) => c.normalized_contact === normContact
    );
    if (existing) {
      if (existing.password_pin !== cleanPass) {
        res.status(409).json({
          error:
            'هذا الرقم أو البريد مسجل بالفعل. يرجى التبديل إلى تبويب تسجيل الدخول وإدخال كلمة المرور الصحيحة.',
        });
        return;
      }
      // If password matches existing account, log them in seamlessly
      linkOrdersToCustomerAccount(existing, clientId, orderNumbers);
      res.status(200).json({
        customer: {
          id: existing.id,
          name: existing.name,
          contact: existing.contact,
          created_date: existing.created_date,
        },
        token: existing.auth_token,
      });
      return;
    }

    const newCustomer: StoredCustomer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      contact: cleanContact,
      normalized_contact: normContact,
      password_pin: cleanPass,
      auth_token: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
      created_date: new Date().toISOString(),
    };

    customersStore.push(newCustomer);
    saveCustomersStore(customersStore);
    linkOrdersToCustomerAccount(newCustomer, clientId, orderNumbers);

    res.status(200).json({
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        contact: newCustomer.contact,
        created_date: newCustomer.created_date,
      },
      token: newCustomer.auth_token,
    });
  });

  app.post('/api/customers/login', (req, res) => {
    const { contact, password, clientId, orderNumbers } = req.body || {};
    const cleanContact = String(contact || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanContact || !cleanPass) {
      res.status(400).json({
        error: 'يرجى إدخال رقم الهاتف/البريد الإلكتروني وكلمة المرور.',
      });
      return;
    }

    const normContact = normalizeContactKey(cleanContact);
    const matched = customersStore.find(
      (c) =>
        c.normalized_contact === normContact && c.password_pin === cleanPass
    );

    if (!matched) {
      res.status(401).json({
        error:
          'بيانات الدخول غير صحيحة. تأكد من رقم الهاتف/البريد وكلمة المرور أو أنشئ حساباً جديداً.',
      });
      return;
    }

    linkOrdersToCustomerAccount(matched, clientId, orderNumbers);

    res.status(200).json({
      customer: {
        id: matched.id,
        name: matched.name,
        contact: matched.contact,
        created_date: matched.created_date,
      },
      token: matched.auth_token,
    });
  });

  app.get('/api/customers/me', (req, res) => {
    const customerId = (req.query.customerId as string | undefined)?.trim();
    const authHeader = (req.headers.authorization || '')
      .replace(/^Bearer\s+/i, '')
      .trim();
    const token =
      (req.query.authToken as string | undefined)?.trim() || authHeader;
    const matched = findAuthenticatedCustomer(customerId, token);
    if (!matched) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    res.status(200).json({
      customer: {
        id: matched.id,
        name: matched.name,
        contact: matched.contact,
        created_date: matched.created_date,
      },
    });
  });

  // Proxy route to Base44 API (https://egcoffee.base44.app/api) using server env variables
  app.get('/api/base44/entities/:entity', async (req, res) => {
    try {
      const entity = req.params.entity;
      if (entity === 'Order') {
        const synced = await getMergedSyncedOrders(parseOrderFilterFromReq(req));
        res.status(200).json(synced);
        return;
      }

      const baseUrl = getNormalizedBase44ApiUrl();
      const qs = new URLSearchParams(
        req.query as Record<string, string>
      ).toString();
      const targetUrl = `${baseUrl}/entities/${entity}${qs ? `?${qs}` : ''}`;

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: getBase44AuthHeaders(),
      });

      const data = await response.json();

      // For AudioClip records stored in Base44 private storage (e.g. "mp/private/..."), resolve signed URLs automatically
      if (entity === 'AudioClip' && response.ok) {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
          ? data.items
          : [];
        const appId =
          process.env.VITE_BASE44_APP_ID ||
          process.env.BASE44_APP_ID ||
          '6ae1356b20aa9cddb1240b85';
        await Promise.all(
          list.map(async (item: any) => {
            const rawUri = String(item?.file_uri || '').trim();
            if (!rawUri) return;
            if (/^https?:\/\//i.test(rawUri)) {
              item.audio_url = rawUri;
              return;
            }
            try {
              const signRes = await fetch(
                `${baseUrl.replace(/\/api$/, '')}/api/apps/${appId}/integration-endpoints/Core/CreateFileSignedUrl`,
                {
                  method: 'POST',
                  headers: getBase44AuthHeaders(),
                  body: JSON.stringify({ file_uri: rawUri }),
                }
              );
              if (signRes.ok) {
                const signJson = await signRes.json();
                if (signJson?.signed_url) {
                  item.audio_url = String(signJson.signed_url);
                }
              }
            } catch {
              // Ignore individual signing errors
            }
          })
        );
      }

      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(502).json({ error: err?.message || 'Base44 proxy error' });
    }
  });

  app.post('/api/base44/entities/:entity', async (req, res) => {
    try {
      const entity = req.params.entity;
      const baseUrl = getNormalizedBase44ApiUrl();
      const targetUrl = `${baseUrl}/entities/${entity}`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: getBase44AuthHeaders(),
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res
        .status(502)
        .json({ error: err?.message || 'Base44 proxy POST error' });
    }
  });

  // Send Instant Telegram Notification to Admin (@wepegcoffeebot) on Order Confirmation
  app.post('/api/notify-telegram', async (req, res) => {
    try {
      const result = await dispatchInstantTelegramOrderNotification(
        req.body || {}
      );
      res.status(200).json({
        sent: result.sent,
        bot: `@${DEFAULT_TELEGRAM_BOT_USERNAME}`,
        deliveredToCount: result.deliveredToCount,
      });
    } catch (err: any) {
      res.status(200).json({ sent: false, error: err?.message });
    }
  });

  app.get('/api/local-orders', async (req, res) => {
    const synced = await getMergedSyncedOrders(parseOrderFilterFromReq(req));
    res.json(synced);
  });

  app.post('/api/local-orders', async (req, res) => {
    const body = req.body || {};
    const qty = Number(body.quantity) || 1;
    const price = Number(body.total_price ?? body.amount_egp) || 0;
    const contact = body.customer_contact || body.customer_phone || '';
    const orderNum =
      body.order_number ||
      `EGC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Fire Telegram notification IMMEDIATELY in parallel so Admin receives it at the exact moment of customer submission
    void dispatchInstantTelegramOrderNotification({
      order_number: orderNum,
      customer_name: body.customer_name || 'عميل المنصة',
      customer_contact: contact,
      item_title: body.item_title || body.item_title_ar || 'إصدار رقمي',
      quantity: qty,
      total_price: price,
      currency: body.currency || 'EGP',
      payment_method_label: body.payment_method_label || body.payment_method,
      receipt_image_url: body.receipt_image_url,
      admin_notes: body.admin_notes,
    });

    // Resolve authenticated customer if provided
    const authCustomer = findAuthenticatedCustomer(
      body.customer_id,
      body.auth_token
    );
    const resolvedCustomerId = authCustomer ? authCustomer.id : body.customer_id;
    const resolvedClientId = String(body.client_id || '').trim() || undefined;

    // Resolve delivery_file_or_url from body or Base44 CatalogItem
    let deliveryUrl = body.delivery_file_or_url || '';
    if (!deliveryUrl) {
      deliveryUrl = await fetchCatalogDeliveryUrlFromBase44(
        body.catalog_item_id || body.item_id,
        body.item_title || body.item_title_ar
      );
    }

    // Also push to Base44 Dashboard Order entity if not already pushed
    let base44Id = body.base44_id || '';
    if (!base44Id) {
      try {
        const baseUrl = getNormalizedBase44ApiUrl();
        const b44Payload = {
          order_number: orderNum,
          customer_name: body.customer_name || 'عميل المنصة',
          customer_contact: contact,
          catalog_item_id: body.catalog_item_id || body.item_id || '',
          item_title: body.item_title || body.item_title_ar || 'إصدار رقمي',
          quantity: qty,
          total_price: price,
          currency: body.currency || 'EGP',
          payment_method: body.payment_method || 'instapay',
          receipt_image_url:
            body.receipt_image_url &&
            !String(body.receipt_image_url).startsWith('data:')
              ? body.receipt_image_url
              : `RECEIPT-${orderNum}`,
          payment_status: 'under_review',
          order_status: 'new',
          admin_notes: body.admin_notes || '',
          delivery_file_or_url: deliveryUrl,
        };
        const b44Res = await fetch(`${baseUrl}/entities/Order`, {
          method: 'POST',
          headers: getBase44AuthHeaders(),
          body: JSON.stringify(b44Payload),
        });
        if (b44Res.ok) {
          const b44Created = await b44Res.json();
          if (b44Created?.id) {
            base44Id = String(b44Created.id);
          }
          if (!deliveryUrl) {
            deliveryUrl = extractDeliveryUrl(b44Created);
          }
        }
      } catch {
        // Continue with local persistence if Base44 POST fails
      }
    }

    const existingIdx = localOrders.findIndex(
      (o) => o.order_number.toUpperCase() === orderNum.toUpperCase()
    );

    const newOrder: LocalOrder = {
      id: base44Id || body.id || `ord-eg-${Date.now()}`,
      base44_id: base44Id || undefined,
      order_number: orderNum,
      customer_name: body.customer_name || 'عميل المنصة',
      customer_contact: contact,
      customer_phone: contact,
      governorate: body.governorate || 'القاهرة',
      catalog_item_id: body.catalog_item_id || body.item_id || '',
      item_title: body.item_title || body.item_title_ar || 'إصدار رقمي',
      item_title_ar: body.item_title_ar || body.item_title || 'إصدار رقمي',
      item_title_en:
        body.item_title_en || body.item_title || 'Digital Publication',
      quantity: qty,
      total_price: price,
      amount_egp: price,
      currency: body.currency || 'EGP',
      payment_method: body.payment_method || 'instapay',
      receipt_image_url: body.receipt_image_url || body.payment_reference || '',
      payment_reference: body.payment_reference || body.receipt_image_url || '',
      payment_status: body.payment_status || 'under_review',
      order_status: body.order_status || 'new',
      admin_notes: body.admin_notes || '',
      delivery_file_or_url: deliveryUrl,
      client_id: resolvedClientId,
      customer_id: resolvedCustomerId || undefined,
      created_date: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      localOrders[existingIdx] = { ...localOrders[existingIdx], ...newOrder };
    } else {
      localOrders.unshift(newOrder);
    }
    saveOrdersStore(localOrders);
    res.status(200).json(newOrder);
  });

  app.post('/api/analyze-blend', async (req, res) => {
    try {
      const {
        beanState,
        roastLossPercent,
        targetUse,
        components,
        financials,
        lang = 'ar',
      } = req.body;

      if (!components || !Array.isArray(components) || components.length === 0) {
        res.status(400).json({ error: 'Blend components are required.' });
        return;
      }

      const componentsText = components
        .map(
          (c: { name: string; percentage: number; pricePerKg: number }) =>
            `- ${c.name}: ${c.percentage}% (${c.pricePerKg} EGP/kg)`
        )
        .join('\n');

      const targetLabel =
        targetUse === 'turkish'
          ? 'Turkish Coffee (قهوة تركي)'
          : targetUse === 'espresso'
          ? 'Espresso (إسبريسو)'
          : 'Both Turkish Coffee & Espresso (قهوة تركي وإسبريسو معاً)';

      const beanStateLabel =
        beanState === 'green'
          ? `Green Coffee Beans with ${roastLossPercent}% expected roast weight loss`
          : 'Ready Roasted Coffee Beans (0% additional roast loss)';

      const prompt = `You are the Chief Coffee Master Roaster and Commercial Coffee Economist in Egypt ("تجارة القهوة المصرية - Egyptian Coffee Trade").
Analyze the following coffee blend designed for the Egyptian market:

Bean Type: ${beanStateLabel}
Target Extraction: ${targetLabel}
Blend Components:
${componentsText}

Financial Metrics Calculated:
- Raw Input Cost per Kg: ${financials?.rawCostPerKg?.toFixed(2) || 0} EGP
- Net Roasted Cost per Kg (Before Operating Expenses): ${financials?.netRoastedCostPerKg?.toFixed(2) || 0} EGP
- Green Weight Required for 1 Kg Net Roasted: ${financials?.greenNeededForOneKgRoasted?.toFixed(3) || 1} Kg

Respond strictly in JSON matching the schema in ${lang === 'ar' ? 'professional Egyptian/Standard Arabic for coffee traders and roasters' : 'professional English for coffee traders and roasters'}.`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryVerdict: {
                type: Type.STRING,
                description:
                  'Executive summary of the blend character, balance, and market positioning.',
              },
              sensoryProfile: {
                type: Type.OBJECT,
                properties: {
                  bodyScore: {
                    type: Type.NUMBER,
                    description: 'Score out of 10 for body/mouthfeel (القوام)',
                  },
                  cremaOrWeshScore: {
                    type: Type.NUMBER,
                    description:
                      'Score out of 10 for Turkish Wesh or Espresso Crema (الوش / الكريما)',
                  },
                  acidityScore: {
                    type: Type.NUMBER,
                    description: 'Score out of 10 for acidity (الحمضية)',
                  },
                  bitternessScore: {
                    type: Type.NUMBER,
                    description:
                      'Score out of 10 for bitterness/strength (المرارة والقوة)',
                  },
                  aromaNotes: {
                    type: Type.STRING,
                    description:
                      'Expected aroma and flavor notes (الإيحاءات العطرية والنكهة)',
                  },
                },
                required: [
                  'bodyScore',
                  'cremaOrWeshScore',
                  'acidityScore',
                  'bitternessScore',
                  'aromaNotes',
                ],
              },
              pros: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  '3 to 4 key technical and sensory strengths of this blend.',
              },
              cons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  '2 to 3 potential weaknesses, risks, or sensory imbalances.',
              },
              suitabilityAnalysis: {
                type: Type.OBJECT,
                properties: {
                  turkishSuitability: {
                    type: Type.STRING,
                    description:
                      'Detailed assessment for Egyptian Turkish coffee (الوش، القوام، تقبل الحبهان، التحميص الفاتح/الوسط/الغامق).',
                  },
                  espressoSuitability: {
                    type: Type.STRING,
                    description:
                      'Detailed assessment for commercial/specialty Espresso (ثبات الكريما، الاستخلاص مع الحليب، البورتافلتر).',
                  },
                  recommendedRoastLevel: {
                    type: Type.STRING,
                    description:
                      'Recommended roast profile and charge/drop temperature guidance.',
                  },
                },
                required: [
                  'turkishSuitability',
                  'espressoSuitability',
                  'recommendedRoastLevel',
                ],
              },
              flavorOptimizationTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  '2 to 3 actionable ratio or origin adjustments to elevate flavor quality.',
              },
              costOptimizationTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  '2 to 3 actionable commercial tips to reduce cost per kg in the Egyptian market without sacrificing cup quality.',
              },
            },
            required: [
              'summaryVerdict',
              'sensoryProfile',
              'pros',
              'cons',
              'suitabilityAnalysis',
              'flavorOptimizationTips',
              'costOptimizationTips',
            ],
          },
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error: any) {
      console.error('Gemini Blend Analysis Error:', error);
      res.status(500).json({
        error: error?.message || 'Failed to analyze blend with AI',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Egyptian Coffee Trade server running on http://localhost:${PORT}`
    );
  });
}

startServer();
