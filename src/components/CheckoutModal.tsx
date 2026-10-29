import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Send,
  Upload,
  Copy,
  Check,
  MessageCircle,
  Wallet,
  Landmark,
  Bitcoin,
  ChevronDown,
  BookOpen,
  Download,
  Clock,
  XCircle,
  RefreshCw,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  CatalogItem,
  CustomerAccount,
  DetailedPaymentMethod,
  Language,
  OrderRecord,
} from '../types/coffee';
import { createOrder, getOrders } from '../services/base44Api';

interface CheckoutModalProps {
  item: CatalogItem | null;
  lang: Language;
  currentCustomer?: CustomerAccount | null;
  onOpenCustomerAuth?: () => void;
  onClose: () => void;
  onOrderSuccess: (order: OrderRecord) => void;
  onGoToOrders?: (orderNumber: string) => void;
}

const PAYMENT_OPTIONS: {
  id: DetailedPaymentMethod;
  label_ar: string;
  label_en: string;
  apiEnum: 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'other';
  category: 'wallet' | 'bank' | 'crypto';
}[] = [
  {
    id: 'e_and_cash',
    label_ar: 'e& cash (اتصالات كاش)',
    label_en: 'e& cash',
    apiEnum: 'other',
    category: 'wallet',
  },
  {
    id: 'vodafone_cash',
    label_ar: 'Vodafone Cash (فودافون كاش)',
    label_en: 'Vodafone Cash',
    apiEnum: 'vodafone_cash',
    category: 'wallet',
  },
  {
    id: 'instapay',
    label_ar: 'InstaPay (إنستا باي)',
    label_en: 'InstaPay',
    apiEnum: 'instapay',
    category: 'wallet',
  },
  {
    id: 'gbp_account',
    label_ar: 'حساب الجنيه الإسترليني (GBP)',
    label_en: 'GBP Bank Account (UK)',
    apiEnum: 'bank_transfer',
    category: 'bank',
  },
  {
    id: 'usd_account',
    label_ar: 'حساب الدولار الأمريكي (USD)',
    label_en: 'USD Bank Account (US)',
    apiEnum: 'bank_transfer',
    category: 'bank',
  },
  {
    id: 'eur_account',
    label_ar: 'حساب اليورو الأوروبي (EUR)',
    label_en: 'EUR Bank Account (IBAN)',
    apiEnum: 'bank_transfer',
    category: 'bank',
  },
  {
    id: 'bitcoin',
    label_ar: 'البيتكوين (Bitcoin)',
    label_en: 'Bitcoin (BTC)',
    apiEnum: 'other',
    category: 'crypto',
  },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  lang,
  currentCustomer,
  onOpenCustomerAuth,
  onClose,
  onOrderSuccess,
  onGoToOrders,
}) => {
  const [customerName, setCustomerName] = useState(
    currentCustomer?.name || ''
  );
  const [customerContact, setCustomerContact] = useState(
    currentCustomer?.contact || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<
    DetailedPaymentMethod | ''
  >('');
  const [receiptUrlOrRef, setReceiptUrlOrRef] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    if (currentCustomer) {
      if (!customerName) setCustomerName(currentCustomer.name);
      if (!customerContact) setCustomerContact(currentCustomer.contact);
    }
  }, [currentCustomer, customerName, customerContact]);

  const checkLiveOrderStatus = useCallback(async () => {
    if (!createdOrder?.order_number) return;
    setIsCheckingStatus(true);
    try {
      const updatedList = await getOrders(createdOrder.order_number);
      const matched = updatedList.find(
        (o) =>
          o.order_number.toUpperCase() ===
          createdOrder.order_number.toUpperCase()
      );
      if (matched) {
        setCreatedOrder((prev) =>
          prev
            ? {
                ...prev,
                ...matched,
                delivery_file_or_url:
                  matched.delivery_file_or_url ||
                  prev.delivery_file_or_url ||
                  item?.delivery_file_or_url,
              }
            : matched
        );
        onOrderSuccess(matched);
      }
    } catch {
      // Ignore network polling error
    } finally {
      setIsCheckingStatus(false);
    }
  }, [createdOrder?.order_number, item?.delivery_file_or_url, onOrderSuccess]);

  useEffect(() => {
    if (!createdOrder?.order_number) return;
    const isResolved =
      createdOrder.payment_status === 'paid' ||
      createdOrder.order_status === 'completed' ||
      createdOrder.payment_status === 'rejected' ||
      createdOrder.order_status === 'cancelled';
    if (isResolved && createdOrder.delivery_file_or_url) return;

    const timer = setInterval(() => {
      checkLiveOrderStatus();
    }, 3500);

    return () => clearInterval(timer);
  }, [
    createdOrder?.order_number,
    createdOrder?.payment_status,
    createdOrder?.order_status,
    createdOrder?.delivery_file_or_url,
    checkLiveOrderStatus,
  ]);

  if (!item) return null;

  const unitPrice = item.price ?? item.price_egp;
  const totalPrice = unitPrice * Math.max(1, quantity);

  const activeOption = PAYMENT_OPTIONS.find((o) => o.id === selectedMethod);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptUrlOrRef(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !customerName.trim() || !customerContact.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        customer_name: customerName.trim(),
        customer_contact: customerContact.trim(),
        catalog_item_id: item.id,
        item_title: item.title_ar,
        item_title_ar: item.title_ar,
        item_title_en: item.title_en,
        quantity,
        total_price: totalPrice,
        currency: item.currency || 'EGP',
        payment_method: activeOption?.apiEnum || 'other',
        payment_method_label: activeOption
          ? `${activeOption.label_ar} (${activeOption.label_en})`
          : selectedMethod,
        receipt_image_url:
          receiptUrlOrRef.trim() ||
          `RECEIPT-${Math.floor(100000 + Math.random() * 900000)}`,
        admin_notes: adminNotes.trim(),
        delivery_file_or_url: item.delivery_file_or_url,
      });
      setCreatedOrder(order);
      onOrderSuccess(order);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCopyRow = (label: string, value: string, key: string) => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-[var(--line)] last:border-b-0">
      <div className="text-xs">
        <span className="text-[var(--muted)] block">{label}</span>
        <span
          dir="ltr"
          className="font-medium text-[var(--text)] text-xs sm:text-sm select-all inline-block mt-0.5"
        >
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={() => handleCopy(value, key)}
        className="chip-pill text-[11px] shrink-0"
      >
        {copiedField === key ? (
          <>
            <Check size={16} strokeWidth={1.5} className="text-emerald-700" />
            <span className="text-emerald-700">
              {lang === 'ar' ? 'تم النسخ' : 'Copied'}
            </span>
          </>
        ) : (
          <>
            <Copy size={16} strokeWidth={1.5} className="text-[var(--accent)]" />
            <span>{lang === 'ar' ? 'نسخ' : 'Copy'}</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white bg-coffee-sketch border border-[var(--line)] rounded-[14px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] max-w-2xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {createdOrder ? (
          <div className="text-center py-4 space-y-5">
            {(() => {
              const isPaid =
                createdOrder.payment_status === 'paid' ||
                createdOrder.order_status === 'paid' ||
                createdOrder.order_status === 'completed';
              const isRejected =
                createdOrder.payment_status === 'rejected' ||
                createdOrder.order_status === 'cancelled' ||
                createdOrder.order_status === 'rejected';
              const downloadUrl =
                createdOrder.delivery_file_or_url ||
                item.delivery_file_or_url ||
                '';

              return (
                <>
                  {isPaid ? (
                    <CheckCircle2
                      size={36}
                      strokeWidth={1.6}
                      className="text-emerald-600 mx-auto"
                    />
                  ) : isRejected ? (
                    <XCircle
                      size={36}
                      strokeWidth={1.6}
                      className="text-red-600 mx-auto"
                    />
                  ) : (
                    <Clock
                      size={34}
                      strokeWidth={1.6}
                      className="text-[var(--accent)] mx-auto animate-pulse"
                    />
                  )}

                  <div className="space-y-1.5">
                    <h3 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text)]">
                      {isPaid
                        ? lang === 'ar'
                          ? 'تمت الموافقة على طلبك وتفعيل التحميل!'
                          : 'Order Approved & Download Unlocked!'
                        : isRejected
                        ? lang === 'ar'
                          ? 'لم تتم معالجة طلبك'
                          : 'Your order could not be processed'
                        : lang === 'ar'
                        ? 'تم استلام طلبك بنجاح — احتفظ برقم الطلب'
                        : 'Order Received — Save Your Order Number'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto">
                      {isPaid
                        ? lang === 'ar'
                          ? 'تمت مراجعة الدفع والموافقة على طلبك. يمكنك الآن تحميل الكتاب / المنتج مباشرة من الزر أدناه.'
                          : 'Your payment has been verified and approved. You can now download your book/product below.'
                        : isRejected
                        ? lang === 'ar'
                          ? 'لم تتم معالجة طلبك. يرجى التأكد من إيصال التحويل أو التواصل مع إدارة المنصة.'
                          : 'Your order could not be processed. Please check your transfer receipt or contact support.'
                        : lang === 'ar'
                        ? 'تم تسجيل طلبك بنجاح وجاري مراجعة إيصال الدفع. بمجرد تأكيد الطلب سيظهر رابط التحميل هنا تلقائياً!'
                        : 'Your order has been registered and your payment receipt is being verified. Once confirmed, the download link will appear here automatically!'}
                    </p>
                  </div>

                  {/* Highlighted Order Number Box with Copy Button */}
                  <div className="max-w-md mx-auto p-4 rounded-[12px] bg-[var(--accent-soft)] border-2 border-[var(--accent)] flex items-center justify-between gap-3">
                    <div className="text-start">
                      <span className="text-[11px] font-medium text-[var(--muted)] block">
                        {lang === 'ar'
                          ? 'رقم الطلب الخاص بك (للمتابعة والتحميل):'
                          : 'Your Order Number (For Tracking & Download):'}
                      </span>
                      <span
                        dir="ltr"
                        className="font-display text-lg sm:text-xl font-bold text-[var(--accent)] select-all tracking-wider"
                      >
                        {createdOrder.order_number}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(createdOrder.order_number, 'order-code-copy')
                      }
                      className="chip-pill text-xs shrink-0 bg-white"
                    >
                      {copiedField === 'order-code-copy' ? (
                        <>
                          <Check
                            size={15}
                            strokeWidth={1.5}
                            className="text-emerald-700"
                          />
                          <span className="text-emerald-700">
                            {lang === 'ar' ? 'تم نسخ الرقم' : 'Copied'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy
                            size={15}
                            strokeWidth={1.5}
                            className="text-[var(--accent)]"
                          />
                          <span>
                            {lang === 'ar' ? 'نسخ رقم الطلب' : 'Copy Code'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Live Status / Action Box */}
                  <div className="max-w-md mx-auto">
                    {isPaid ? (
                      <div className="p-5 rounded-[12px] bg-emerald-50 border border-emerald-300 space-y-3 text-center">
                        <div className="text-xs sm:text-sm font-semibold text-emerald-800">
                          {lang === 'ar'
                            ? '✅ تمت الموافقة من الإدارة — رابط التحميل جاهز الآن:'
                            : '✅ Approved by Admin — Your download link is ready:'}
                        </div>
                        {downloadUrl ? (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="uiverse-btn !bg-emerald-700 w-full py-3.5 px-6 text-sm font-semibold"
                          >
                            <Download size={18} strokeWidth={1.5} />
                            <span>
                              {lang === 'ar'
                                ? 'تحميل الكتاب / الملف الرقمي الآن'
                                : 'Download Book / Digital File Now'}
                            </span>
                          </a>
                        ) : (
                          <p className="text-xs text-emerald-700">
                            {lang === 'ar'
                              ? 'تم تفعيل طلبك بنجاح! يمكنك الوصول لملفك من قسم طلباتي.'
                              : 'Your order is unlocked! Access your file in My Orders.'}
                          </p>
                        )}
                      </div>
                    ) : isRejected ? (
                      <div className="p-5 rounded-[12px] bg-red-50 border border-red-300 space-y-2 text-center">
                        <div className="text-sm font-bold text-red-700">
                          {lang === 'ar'
                            ? '❌ لم تتم معالجة طلبك'
                            : '❌ Your order could not be processed'}
                        </div>
                        <p className="text-xs text-red-600">
                          {createdOrder.admin_notes &&
                          createdOrder.admin_notes !== 'لم تتم معالجة طلبك'
                            ? createdOrder.admin_notes
                            : lang === 'ar'
                            ? 'تم رفض الطلب من قِبل الإدارة. يرجى التحقق من صحة إيصال الدفع والمحاولة مرة أخرى.'
                            : 'Order was declined by admin. Please verify your payment receipt and try again.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* 30-Minute Wait Notice + WhatsApp Support Button */}
                        <div className="p-4 rounded-[12px] bg-amber-50/90 border border-amber-300 text-start space-y-3">
                          <div className="flex items-start gap-2.5">
                            <Clock
                              size={20}
                              strokeWidth={1.8}
                              className="text-amber-700 shrink-0 mt-0.5"
                            />
                            <div className="space-y-1">
                              <span className="font-bold text-xs sm:text-sm text-amber-950 block">
                                {lang === 'ar'
                                  ? 'الرجاء الانتظار 30 دقيقة على الأقل ثم متابعة حالة طلبك'
                                  : 'Please wait at least 30 minutes and then check your order status'}
                              </span>
                              <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
                                {lang === 'ar'
                                  ? 'تتم مراجعة إيصال الدفع وتفعيل رابط التحميل من الإدارة. يمكنك متابعة حالة طلبك برقم الطلب أو التواصل مباشرة مع الدعم الفني عبر واتساب.'
                                  : 'Your payment receipt is being verified to unlock your download link. You can track your order status using your order number or contact WhatsApp support.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/80">
                            <a
                              href={`https://wa.me/201043397384?text=${encodeURIComponent(
                                lang === 'ar'
                                  ? `مرحباً، قمت بإرسال طلب شراء رقم (${createdOrder.order_number}) للمنتج (${createdOrder.item_title}) وأود متابعة حالة طلبي.`
                                  : `Hello, I submitted order (${createdOrder.order_number}) for (${createdOrder.item_title}) and would like to follow up.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
                            >
                              <MessageCircle size={16} strokeWidth={1.7} />
                              <span>
                                {lang === 'ar'
                                  ? 'زر واتساب للدعم الفني'
                                  : 'WhatsApp Support'}
                              </span>
                            </a>

                            <button
                              type="button"
                              onClick={checkLiveOrderStatus}
                              disabled={isCheckingStatus}
                              className="chip-pill text-[11px] bg-white shrink-0"
                            >
                              <RefreshCw
                                size={14}
                                strokeWidth={1.6}
                                className={
                                  isCheckingStatus
                                    ? 'text-amber-600 animate-spin'
                                    : 'text-[var(--accent)]'
                                }
                              />
                              <span>
                                {lang === 'ar' ? 'تحديث حالة الطلب الآن' : 'Refresh Status'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Optional Customer Login Prompt After Purchase */}
                        {!currentCustomer && onOpenCustomerAuth && (
                          <div className="p-3.5 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-start">
                            <div className="text-xs space-y-0.5">
                              <span className="font-semibold text-[var(--text)] block">
                                {lang === 'ar'
                                  ? 'هل ترغب في حفظ هذا الشراء في حساب شخصي؟ (اختياري)'
                                  : 'Want to save this purchase to a personal account? (Optional)'}
                              </span>
                              <span className="text-[11px] text-[var(--muted)] block">
                                {lang === 'ar'
                                  ? 'سجّل دخول أو أنشئ حساباً لحفظ طلباتك وروابط التحميل دائماً من أي جهاز.'
                                  : 'Sign in or create an account to keep your orders & download links across devices.'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={onOpenCustomerAuth}
                              className="btn-secondary text-xs px-3.5 py-2 shrink-0"
                            >
                              <UserPlus size={15} strokeWidth={1.6} />
                              <span>
                                {lang === 'ar'
                                  ? 'حفظ الشراء في حسابي'
                                  : 'Save to Account'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Summary Details */}
                  <div className="bg-[var(--bg-soft)] rounded-[12px] p-4 border border-[var(--line)] text-start text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">
                        {lang === 'ar' ? 'المنتج:' : 'Item:'}
                      </span>
                      <span className="font-medium text-[var(--text)]">
                        {createdOrder.item_title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">
                        {lang === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}
                      </span>
                      <span className="font-medium text-[var(--text)]">
                        {activeOption
                          ? lang === 'ar'
                            ? activeOption.label_ar
                            : activeOption.label_en
                          : createdOrder.payment_method}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">
                        {lang === 'ar' ? 'الإجمالي:' : 'Total Price:'}
                      </span>
                      <span className="font-medium text-[var(--accent)]">
                        {createdOrder.total_price} {createdOrder.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <a
                      href={`https://wa.me/201043397384?text=${encodeURIComponent(
                        lang === 'ar'
                          ? `مرحباً، أود متابعة حالة طلبي رقم (${createdOrder.order_number}).`
                          : `Hello, I would like to follow up on my order (${createdOrder.order_number}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <MessageCircle size={17} strokeWidth={1.6} />
                      <span>
                        {lang === 'ar' ? 'واتساب للدعم' : 'WhatsApp Support'}
                      </span>
                    </a>

                    {onGoToOrders && (
                      <button
                        type="button"
                        onClick={() => {
                          const code = createdOrder.order_number;
                          onClose();
                          onGoToOrders(code);
                        }}
                        className="btn-primary px-6 py-2.5 text-xs sm:text-sm"
                      >
                        {lang === 'ar'
                          ? 'متابعة حالة الطلب في قسم طلباتي'
                          : 'Track Order in My Orders'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary px-6 py-2.5 text-xs sm:text-sm"
                    >
                      {lang === 'ar' ? 'إغلاق النافذة' : 'Close'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                  <BookOpen size={18} strokeWidth={1.5} />
                  <span>
                    {lang === 'ar'
                      ? 'نظام الدفع اليدوي التفاعلي'
                      : 'Interactive Manual Payment Checkout'}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold text-[var(--text)]">
                  {lang === 'ar' ? item.title_ar : item.title_en || item.title_ar}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="modal-close-btn"
                aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X size={17} strokeWidth={2.5} />
                <span>{lang === 'ar' ? 'إغلاق' : 'Close'}</span>
              </button>
            </div>

            {/* Product & Total Summary */}
            <div className="p-4 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)] flex items-center justify-between gap-4">
              <div className="text-xs">
                <div className="text-[var(--muted)]">
                  {lang === 'ar' ? 'المنتج المختار' : 'Selected Item'}
                </div>
                <div className="font-medium text-[var(--text)] mt-0.5">
                  {lang === 'ar' ? item.subtitle_ar : item.subtitle_en}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-xs">
                  <label className="text-[var(--muted)] block text-[10px]">
                    {lang === 'ar' ? 'الكمية' : 'Qty'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                    className="input-field !w-14 px-2 py-1 text-xs text-center"
                  />
                </div>
                <div className="font-display text-2xl font-semibold text-[var(--accent)]">
                  {totalPrice}{' '}
                  <span className="text-xs font-medium text-[var(--text)]">
                    {lang === 'ar' ? 'ج.م' : item.currency || 'EGP'}
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 1: Select Payment Method First */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-medium text-[var(--text)]">
                  {lang === 'ar'
                    ? 'الخطوة 1: اختر طريقة الدفع أولاً *'
                    : 'Step 1: Select Your Payment Method First *'}
                </label>
                <span className="text-[11px] font-medium text-[var(--accent)]">
                  7 {lang === 'ar' ? 'وسائل متاحة' : 'Methods Available'}
                </span>
              </div>

              {/* Dropdown Selector */}
              <div className="relative">
                <select
                  value={selectedMethod}
                  onChange={(e) =>
                    setSelectedMethod(
                      e.target.value as DetailedPaymentMethod | ''
                    )
                  }
                  className="input-field appearance-none px-4 py-3 text-xs sm:text-sm font-medium cursor-pointer bg-[var(--surface)] text-[var(--text)]"
                >
                  <option
                    value=""
                    className="bg-[var(--surface)] text-[var(--text)]"
                  >
                    {lang === 'ar'
                      ? '— اضغط هنا لاختيار وسيلة الدفع لعرض بيانات الحساب —'
                      : '— Select a payment method to view account details —'}
                  </option>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <option
                      key={opt.id}
                      value={opt.id}
                      className="bg-[var(--surface)] text-[var(--text)]"
                    >
                      {lang === 'ar' ? opt.label_ar : opt.label_en}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  strokeWidth={1.5}
                  className="text-[var(--accent)] absolute top-1/2 -translate-y-1/2 end-3.5 pointer-events-none"
                />
              </div>

              {/* Quick Interactive Method Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const active = selectedMethod === opt.id;
                  const Icon =
                    opt.category === 'wallet'
                      ? Wallet
                      : opt.category === 'bank'
                      ? Landmark
                      : Bitcoin;
                  const iconColor =
                    opt.category === 'wallet'
                      ? 'text-emerald-600'
                      : opt.category === 'bank'
                      ? 'text-blue-600'
                      : 'text-amber-500';
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedMethod(opt.id)}
                      className={`text-xs justify-center ${
                        active ? 'chip-pill-active' : 'chip-pill'
                      }`}
                    >
                      <Icon
                        size={16}
                        strokeWidth={1.6}
                        className={`shrink-0 ${iconColor}`}
                      />
                      <span className="truncate">
                        {lang === 'ar'
                          ? opt.label_ar.split(' (')[0]
                          : opt.label_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Account Details & Customer Form */}
            {selectedMethod && (
              <div className="space-y-5 pt-3 border-t border-[var(--line)]">
                <div className="bg-[var(--bg-soft)] rounded-[12px] p-4 sm:p-5 border border-[var(--line)] space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                    <div>
                      <span className="text-[11px] font-medium text-[var(--accent)] block">
                        {lang === 'ar'
                          ? 'الخطوة 2: بيانات الحساب المعتمد للتحويل'
                          : 'Step 2: Official Account Details for Transfer'}
                      </span>
                      <h4 className="font-display text-sm sm:text-base font-semibold text-[var(--text)]">
                        {lang === 'ar'
                          ? 'صاحب الحساب: يوسف رشاد البدري (YOUSSEF RASHAD ELBADRY)'
                          : 'Account Holder: YOUSSEF RASHAD ELBADRY (يوسف رشاد البدري)'}
                      </h4>
                    </div>
                  </div>

                  {/* 1. e& cash */}
                  {selectedMethod === 'e_and_cash' && (
                    <div className="space-y-1">
                      {renderCopyRow(
                        lang === 'ar'
                          ? 'اسم صاحب الحساب (Account Holder)'
                          : 'Account Holder',
                        'يوسف رشاد البدري — YOUSSEF RASHAD ELBADRY',
                        'ecash-holder'
                      )}
                      {renderCopyRow(
                        lang === 'ar'
                          ? 'رقم محفظة e& cash (اتصالات كاش)'
                          : 'e& cash Wallet Number',
                        '01143788283',
                        'ecash-num'
                      )}
                    </div>
                  )}

                  {/* 2. Vodafone Cash */}
                  {selectedMethod === 'vodafone_cash' && (
                    <div className="space-y-1">
                      {renderCopyRow(
                        lang === 'ar'
                          ? 'اسم صاحب الحساب (Account Holder)'
                          : 'Account Holder',
                        'يوسف رشاد البدري — YOUSSEF RASHAD ELBADRY',
                        'vf-holder'
                      )}
                      {renderCopyRow(
                        lang === 'ar'
                          ? 'رقم محفظة Vodafone Cash (فودافون كاش)'
                          : 'Vodafone Cash Wallet Number',
                        '01018516175',
                        'vf-num'
                      )}
                    </div>
                  )}

                  {/* 3. InstaPay */}
                  {selectedMethod === 'instapay' && (
                    <div className="space-y-1">
                      {renderCopyRow(
                        lang === 'ar'
                          ? 'اسم صاحب الحساب (Account Holder)'
                          : 'Account Holder',
                        'يوسف رشاد البدري — YOUSSEF RASHAD ELBADRY',
                        'ipn-holder'
                      )}
                      {renderCopyRow(
                        lang === 'ar'
                          ? 'رقم تحويل InstaPay (إنستا باي)'
                          : 'InstaPay Phone Number',
                        '01018516175',
                        'ipn-num'
                      )}
                    </div>
                  )}

                  {/* 4. GBP Bank Account */}
                  {selectedMethod === 'gbp_account' && (
                    <div className="space-y-1">
                      {renderCopyRow(
                        'Account holder',
                        'YOUSSEF RASHAD ELBADRY',
                        'gbp-holder'
                      )}
                      {renderCopyRow(
                        'Account number',
                        '41947386',
                        'gbp-acc'
                      )}
                      {renderCopyRow('Sort code', '04-13-07', 'gbp-sort')}
                      {renderCopyRow(
                        'Bank name',
                        'Clear Junction Limited',
                        'gbp-bank'
                      )}
                      {renderCopyRow(
                        'Bank address',
                        '4th Floor Imperial House, 15 Kingsway, London, United Kingdom, WC2B 6UN',
                        'gbp-addr'
                      )}
                    </div>
                  )}

                  {/* 5. USD Bank Account */}
                  {selectedMethod === 'usd_account' && (
                    <div className="space-y-1">
                      {renderCopyRow(
                        'Account holder',
                        'YOUSSEF RASHAD ELBADRY',
                        'usd-holder'
                      )}
                      {renderCopyRow(
                        'Account number',
                        '212160348767',
                        'usd-acc'
                      )}
                      {renderCopyRow('Account type', 'Checking', 'usd-type')}
                      {renderCopyRow(
                        'ACH routing',
                        '101019644',
                        'usd-routing'
                      )}
                      {renderCopyRow('Bank name', 'Lead', 'usd-bank')}
                    </div>
                  )}

                  {/* 6. EUR Bank Account */}
                  {selectedMethod === 'eur_account' && (
                    <div className="space-y-1">
                      {renderCopyRow(
                        'Account holder',
                        'YOUSSEF RASHAD ELBADRY',
                        'eur-holder'
                      )}
                      {renderCopyRow(
                        'Bank name',
                        'Clear Junction Limited',
                        'eur-bank'
                      )}
                      {renderCopyRow(
                        'IBAN',
                        'GB31CLJU04130741947386',
                        'eur-iban'
                      )}
                      {renderCopyRow(
                        'SWIFT code',
                        'CLJUGB21XXX',
                        'eur-swift'
                      )}
                      {renderCopyRow(
                        'Bank address',
                        '4th Floor Imperial House, 15 Kingsway, London, United Kingdom, WC2B 6UN',
                        'eur-addr'
                      )}
                    </div>
                  )}

                  {/* 7. Bitcoin (BTC) */}
                  {selectedMethod === 'bitcoin' && (
                    <div className="p-4 rounded-[12px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
                      <p className="text-xs sm:text-sm font-medium text-[var(--text)]">
                        {lang === 'ar' ? (
                          <>
                            يرجى التواصل عبر واتساب الأعمال (
                            <span
                              dir="ltr"
                              className="ltr-num font-medium text-[var(--accent)]"
                            >
                              +46 70 093 01 84
                            </span>
                            ) للحصول على عنوان محفظة البيتكوين وإتمام الدفع
                          </>
                        ) : (
                          <>
                            Please contact Business WhatsApp (
                            <span
                              dir="ltr"
                              className="ltr-num font-medium text-[var(--accent)]"
                            >
                              +46 70 093 01 84
                            </span>
                            ) to receive the Bitcoin wallet address and complete
                            payment.
                          </>
                        )}
                      </p>
                      <a
                        href="https://wa.me/46700930184"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs px-4 py-2.5"
                      >
                        <MessageCircle
                          size={18}
                          strokeWidth={1.5}
                          className="shrink-0"
                        />
                        <span dir="ltr" className="ltr-num">
                          +46 70 093 01 84
                        </span>
                        <span>
                          {lang === 'ar'
                            ? '(واتساب الأعمال)'
                            : '(Business WhatsApp)'}
                        </span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Optional Customer Login Banner Before Checkout */}
                {onOpenCustomerAuth && (
                  <div className="p-3 rounded-[10px] bg-[var(--bg-soft)] border border-[var(--line)] flex items-center justify-between gap-2 text-xs">
                    {currentCustomer ? (
                      <div className="flex items-center gap-2 text-emerald-800 font-medium">
                        <UserCheck
                          size={16}
                          strokeWidth={1.6}
                          className="text-emerald-600 shrink-0"
                        />
                        <span>
                          {lang === 'ar'
                            ? `مسجل الدخول باسم: ${currentCustomer.name} (سيتم حفظ الشراء في حسابك تلقائياً)`
                            : `Signed in as: ${currentCustomer.name} (Purchase will be saved to your account)`}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-[11px] sm:text-xs text-[var(--muted)]">
                          {lang === 'ar'
                            ? 'يمكنك إتمام الشراء مباشرة كزائر، أو تسجيل دخول (اختياري) لحفظ الشراء في حسابك.'
                            : 'Checkout as guest, or sign in (optional) to save purchases to your account.'}
                        </span>
                        <button
                          type="button"
                          onClick={onOpenCustomerAuth}
                          className="chip-pill text-[11px] shrink-0 bg-white"
                        >
                          <UserPlus size={14} strokeWidth={1.6} />
                          <span>
                            {lang === 'ar'
                              ? 'تسجيل دخول (اختياري)'
                              : 'Optional Sign In'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Customer Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-medium text-[var(--text)] mb-1.5">
                      {lang === 'ar' ? 'اسم العميل الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={
                        lang === 'ar' ? 'الاسم الثلاثي' : 'Your full name'
                      }
                      className="input-field px-3.5 py-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[var(--text)] mb-1.5">
                      {lang === 'ar'
                        ? 'رقم الواتساب أو البريد الإلكتروني *'
                        : 'WhatsApp Number or Email *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="input-field px-3.5 py-2.5 text-xs"
                    />
                  </div>
                </div>

                {/* Upload Receipt Image */}
                <div className="space-y-2 text-xs">
                  <label className="block font-medium text-[var(--text)]">
                    {lang === 'ar'
                      ? 'رفع صورة إيصال التحويل أو رقم العملية المرجعي *'
                      : 'Upload Transfer Receipt Image or Reference ID *'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={
                        receiptUrlOrRef.startsWith('data:')
                          ? lang === 'ar'
                            ? `تم إرفاق الإيصال: ${receiptFileName || 'receipt.png'}`
                            : `Receipt attached: ${receiptFileName || 'receipt.png'}`
                          : receiptUrlOrRef
                      }
                      onChange={(e) => setReceiptUrlOrRef(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? 'ارفع صورة الإيصال من الزر المجاور أو اكتب رقم التحويل...'
                          : 'Upload receipt image or enter reference number...'
                      }
                      className="input-field flex-1 px-3.5 py-2.5 text-xs"
                    />
                    <label className="btn-secondary px-4 py-2.5 text-xs cursor-pointer shrink-0">
                      <Upload
                        size={18}
                        strokeWidth={1.5}
                        className="text-[var(--accent)]"
                      />
                      <span>
                        {lang === 'ar' ? 'رفع صورة الإيصال' : 'Upload Receipt'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {receiptUrlOrRef.startsWith('data:image') && (
                    <div className="pt-2">
                      <img
                        src={receiptUrlOrRef}
                        alt="Receipt Preview"
                        className="h-24 rounded-[12px] border border-[var(--line)] object-contain bg-[var(--bg-soft)] p-1"
                      />
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div className="text-xs">
                  <label className="block font-medium text-[var(--text)] mb-1.5">
                    {lang === 'ar'
                      ? 'ملاحظات إضافية (اختياري):'
                      : 'Additional Notes (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'أي ملاحظات إضافية للإدارة...'
                        : 'Any notes for the admin...'
                    }
                    className="input-field px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                  <ShieldCheck
                    size={18}
                    strokeWidth={1.5}
                    className="text-[var(--accent)] shrink-0"
                  />
                  <span>
                    {lang === 'ar'
                      ? 'عند التأكيد يتم إرسال الطلب ومراجعة إيصال التحويل من الإدارة.'
                      : 'Confirming submits your order for instant receipt verification.'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="uiverse-btn w-full py-3.5 px-6 text-sm"
                >
                  <Send size={18} strokeWidth={1.5} />
                  <span>
                    {isSubmitting
                      ? lang === 'ar'
                        ? 'جاري إرسال الطلب...'
                        : 'Submitting Order...'
                      : lang === 'ar'
                      ? 'تأكيد الطلب وإرسال إيصال الدفع'
                      : 'Confirm Order & Submit Receipt'}
                  </span>
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
