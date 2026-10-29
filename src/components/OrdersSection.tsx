import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  ShoppingBag,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Download,
  Lock,
  XCircle,
  Copy,
  Check,
  MessageCircle,
  UserCheck,
  UserPlus,
  LogOut,
} from 'lucide-react';
import {
  CatalogItem,
  CustomerAccount,
  Language,
  OrderRecord,
} from '../types/coffee';
import { addSavedCustomerOrderNumber } from '../services/base44Api';

interface OrdersSectionProps {
  orders: OrderRecord[];
  catalogItems: CatalogItem[];
  lang: Language;
  initialQuery?: string;
  currentCustomer?: CustomerAccount | null;
  onOpenCustomerAuth?: () => void;
  onLogoutCustomer?: () => void;
  onRefreshOrders: (phone?: string) => Promise<void>;
  onNewOrderClick: (item: CatalogItem) => void;
}

export const OrdersSection: React.FC<OrdersSectionProps> = ({
  orders,
  catalogItems,
  lang,
  initialQuery = '',
  currentCustomer,
  onOpenCustomerAuth,
  onLogoutCustomer,
  onRefreshOrders,
  onNewOrderClick,
}) => {
  const [contactQuery, setContactQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setContactQuery(initialQuery);
      onRefreshOrders(initialQuery);
    }
  }, [initialQuery, onRefreshOrders]);

  // Live background polling every 4 seconds so Telegram / Base44 approvals appear immediately
  useEffect(() => {
    const interval = setInterval(() => {
      onRefreshOrders(contactQuery || undefined).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [contactQuery, onRefreshOrders]);

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const trimmed = contactQuery.trim();
      if (/^EGC-\d{4}-\d+$/i.test(trimmed)) {
        addSavedCustomerOrderNumber(trimmed);
      }
      await onRefreshOrders(trimmed);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="py-12 md:py-20 bg-[var(--bg)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-6 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <ShoppingBag
                size={18}
                strokeWidth={1.6}
                className="text-rose-600"
              />
              <span>
                {lang === 'ar'
                  ? 'إدارة ومتابعة الطلبات الرقمية والتسليم الفوري'
                  : 'Order Tracking & Instant Digital Delivery'}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'طلباتي ومتابعة تفعيل وتحميل الكتب والدورات'
                : 'My Orders & Book / Course Download Tracking'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <a
              href="https://wa.me/201043397384"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              <MessageCircle size={17} strokeWidth={1.6} />
              <span>
                {lang === 'ar' ? 'زر واتساب للدعم' : 'WhatsApp Support'}
              </span>
            </a>

            <button
              type="button"
              onClick={() => {
                const defaultBundle =
                  catalogItems.find((c) => c.item_type === 'bundle') ||
                  catalogItems[0];
                if (defaultBundle) onNewOrderClick(defaultBundle);
              }}
              className="uiverse-btn text-xs sm:text-sm px-6 py-2.5"
            >
              <Plus size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar' ? 'تسجيل طلب شراء جديد' : 'Create New Order'}
              </span>
            </button>
          </div>
        </div>

        {/* 30-Minute Wait Notice + Optional Account Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-[12px] bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Clock
                size={20}
                strokeWidth={1.8}
                className="text-amber-700 shrink-0 mt-0.5"
              />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-amber-950 block">
                  {lang === 'ar'
                    ? 'الرجاء الانتظار 30 دقيقة على الأقل ثم متابعة حالة طلبك'
                    : 'Please wait at least 30 minutes and then check your order status'}
                </span>
                <span className="text-[11px] text-amber-800 block">
                  {lang === 'ar'
                    ? 'بمجرد تأكيد إيصال الدفع يظهر لك رابط تحميل الكتاب هنا مباشرة. لأي استفسار تواصل مع الدعم عبر واتساب.'
                    : 'Once your receipt is verified, your book download link unlocks here automatically.'}
                </span>
              </div>
            </div>
            <a
              href="https://wa.me/201043397384"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-semibold shrink-0 transition-colors"
            >
              <MessageCircle size={15} strokeWidth={1.6} />
              <span>{lang === 'ar' ? 'واتساب للدعم' : 'Support'}</span>
            </a>
          </div>

          <div className="p-4 rounded-[12px] bg-[var(--surface)] border border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {currentCustomer ? (
              <>
                <div className="flex items-start gap-2.5 text-xs">
                  <UserCheck
                    size={20}
                    strokeWidth={1.7}
                    className="text-emerald-600 shrink-0 mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[var(--text)] block">
                      {lang === 'ar'
                        ? `حسابك الشخصي: ${currentCustomer.name}`
                        : `Your Account: ${currentCustomer.name}`}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] block">
                      {lang === 'ar'
                        ? 'بياناتك ومشترياتك محفوظة ومعزولة بالكامل في حسابك الشخصي.'
                        : 'Your orders and downloads are saved and strictly isolated in your account.'}
                    </span>
                  </div>
                </div>
                {onLogoutCustomer && (
                  <button
                    type="button"
                    onClick={onLogoutCustomer}
                    className="btn-secondary text-xs px-3.5 py-2 shrink-0 text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <LogOut size={15} strokeWidth={1.5} className="text-red-600" />
                    <span>{lang === 'ar' ? 'تسجيل خروج' : 'Sign Out'}</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5 text-xs">
                  <UserPlus
                    size={20}
                    strokeWidth={1.7}
                    className="text-[var(--accent)] shrink-0 mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[var(--text)] block">
                      {lang === 'ar'
                        ? 'تسجيل دخول اختياري لحفظ الشراء'
                        : 'Optional Sign-In to Save Purchases'}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] block">
                      {lang === 'ar'
                        ? 'بيانات كل عميل منفصلة تماماً. يمكنك تسجيل حساب (اختياري) لحفظ مشترياتك دائماً.'
                        : 'Every customer’s data is strictly isolated. Optionally sign in to save your purchases.'}
                    </span>
                  </div>
                </div>
                {onOpenCustomerAuth && (
                  <button
                    type="button"
                    onClick={onOpenCustomerAuth}
                    className="btn-secondary text-xs px-3.5 py-2 shrink-0"
                  >
                    <UserPlus size={15} strokeWidth={1.6} />
                    <span>
                      {lang === 'ar' ? 'تسجيل / دخول (اختياري)' : 'Sign In / Save'}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search / Filter by Order Number or Phone */}
        <form
          onSubmit={handleTrackSearch}
          className="surface-card p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1 flex items-center">
            <Search
              size={18}
              strokeWidth={1.5}
              className="text-[var(--accent)] absolute start-3.5 pointer-events-none"
            />
            <input
              type="text"
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'أدخل رقم الطلب (مثال: EGC-2026-xxxx) أو رقم الهاتف للاستعلام والتحميل...'
                  : 'Enter Order Number (e.g. EGC-2026-xxxx) or Phone Number to track & download...'
              }
              className="input-field ps-10 pe-4 py-2.5 text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSearching}
              className="btn-primary text-xs sm:text-sm px-5 py-2.5"
            >
              {isSearching ? (
                <RefreshCw size={18} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Search size={18} strokeWidth={1.5} />
              )}
              <span>{lang === 'ar' ? 'استعلام عن الطلب' : 'Track Order'}</span>
            </button>

            {contactQuery && (
              <button
                type="button"
                onClick={() => {
                  setContactQuery('');
                  onRefreshOrders('');
                }}
                className="btn-secondary text-xs px-4 py-2.5"
              >
                {lang === 'ar' ? 'عرض الكل' : 'Show All'}
              </button>
            )}
          </div>
        </form>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-3">
            <ShoppingBag
              size={20}
              strokeWidth={1.5}
              className="text-[var(--accent)] mx-auto"
            />
            <div className="font-display text-lg font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'لا توجد طلبات مطابقة حالياً'
                : 'No matching orders found'}
            </div>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
              {lang === 'ar'
                ? 'يمكنك شراء أي كتاب أو دورة من المتجر وسيظهر لك رقم الطلب هنا مع تفعيل رابط التحميل المباشر فور الموافقة.'
                : 'Purchase any book or course from the store to get your Order Number and unlock your direct download link here upon approval.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((ord) => {
              const isRejected =
                ord.payment_status === 'rejected' ||
                ord.order_status === 'cancelled' ||
                ord.order_status === 'rejected';

              const isPaid =
                !isRejected &&
                (ord.payment_status === 'paid' ||
                  ord.order_status === 'paid' ||
                  ord.order_status === 'completed');

              const matchedCatalog = catalogItems.find(
                (c) =>
                  c.id === ord.catalog_item_id ||
                  c.title_ar.trim() === (ord.item_title || '').trim() ||
                  (c.title_en &&
                    c.title_en.trim() === (ord.item_title || '').trim())
              );
              const secretDeliveryUrl =
                ord.delivery_file_or_url || matchedCatalog?.delivery_file_or_url;

              return (
                <div
                  key={ord.id || ord.order_number}
                  className="surface-card p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          dir="ltr"
                          className="text-xs sm:text-sm font-bold text-[var(--accent)] select-all"
                        >
                          {ord.order_number}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCode(ord.order_number, ord.order_number)
                          }
                          className="p-1 rounded hover:bg-[var(--bg-soft)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                          title={lang === 'ar' ? 'نسخ رقم الطلب' : 'Copy Order Code'}
                        >
                          {copiedId === ord.order_number ? (
                            <Check size={14} className="text-emerald-700" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <span className="text-[var(--muted)]">·</span>
                        <span className="text-xs text-[var(--muted)]">
                          {new Date(ord.created_date).toLocaleDateString('en-US')}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          isPaid
                            ? 'text-emerald-700'
                            : isRejected
                            ? 'text-red-600'
                            : 'text-[var(--accent)]'
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 size={18} strokeWidth={1.5} />
                        ) : isRejected ? (
                          <XCircle size={18} strokeWidth={1.5} />
                        ) : (
                          <Clock size={18} strokeWidth={1.5} />
                        )}
                        <span>
                          {isPaid
                            ? lang === 'ar'
                              ? 'تمت الموافقة — جاهز للتحميل'
                              : 'Approved — Ready to Download'
                            : isRejected
                            ? lang === 'ar'
                              ? 'لم تتم معالجة طلبك'
                              : 'Order Not Processed'
                            : lang === 'ar'
                            ? 'قيد مراجعة الدفع'
                            : 'Under Review'}
                        </span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-semibold text-[var(--text)] mb-1">
                        {ord.item_title}
                      </h3>
                      <div className="text-xs text-[var(--muted)]">
                        {ord.customer_name} ·{' '}
                        <span
                          dir="ltr"
                          className="ltr-num font-medium text-[var(--text)]"
                        >
                          {ord.customer_contact}
                        </span>{' '}
                        ·{' '}
                        {lang === 'ar' ? (
                          <>
                            الكمية:{' '}
                            <span className="font-medium text-[var(--text)]">
                              {ord.quantity}
                            </span>
                          </>
                        ) : (
                          <>
                            Qty:{' '}
                            <span className="font-medium text-[var(--text)]">
                              {ord.quantity}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {ord.admin_notes && !isRejected && (
                      <div className="text-xs text-[var(--muted)] bg-[var(--bg-soft)] p-3.5 rounded-[12px] border border-[var(--line)]">
                        <span className="font-medium text-[var(--accent)]">
                          {lang === 'ar' ? 'تفاصيل الدفع: ' : 'Payment Info: '}
                        </span>
                        {ord.admin_notes}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="bg-[var(--bg-soft)] rounded-[12px] p-3.5 border border-[var(--line)] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[var(--muted)] block">
                          {lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                        </span>
                        <span className="font-medium text-[var(--text)]">
                          {ord.payment_method.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-[var(--muted)] block">
                          {lang === 'ar' ? 'الإجمالي' : 'Total Price'}
                        </span>
                        <span className="text-base font-semibold text-[var(--accent)]">
                          {ord.total_price} {ord.currency || 'EGP'}
                        </span>
                      </div>
                    </div>

                    {/* Action Area Based on Approval / Rejection / Pending */}
                    {isPaid ? (
                      secretDeliveryUrl ? (
                        <a
                          href={secretDeliveryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="uiverse-btn !bg-emerald-700 w-full py-3 px-4 text-xs sm:text-sm font-semibold"
                        >
                          <Download size={18} strokeWidth={1.5} />
                          <span>
                            {lang === 'ar'
                              ? 'تحميل الكتاب / الدخول للملف الرقمي الآن'
                              : 'Download Book / Access Digital File Now'}
                          </span>
                        </a>
                      ) : (
                        <div className="w-full py-3 px-4 rounded-[10px] bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2">
                          <CheckCircle2 size={17} strokeWidth={1.5} />
                          <span>
                            {lang === 'ar'
                              ? 'تمت الموافقة على طلبك وتفعيله بنجاح'
                              : 'Your order is approved and activated'}
                          </span>
                        </div>
                      )
                    ) : isRejected ? (
                      <div className="w-full py-3 px-4 rounded-[10px] bg-red-50 border border-red-300 text-red-700 text-xs font-bold flex items-center justify-center gap-2">
                        <XCircle size={17} strokeWidth={1.5} />
                        <span>
                          {lang === 'ar'
                            ? 'لم تتم معالجة طلبك'
                            : 'Your order could not be processed'}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="w-full py-2.5 px-3 rounded-[10px] bg-amber-50 border border-amber-200 text-amber-900 text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 text-center">
                          <Clock
                            size={15}
                            strokeWidth={1.6}
                            className="text-amber-700 shrink-0"
                          />
                          <span>
                            {lang === 'ar'
                              ? 'الرجاء الانتظار 30 دقيقة على الأقل ثم متابعة حالة طلبك'
                              : 'Please wait at least 30 minutes and then check your order status'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 py-2 px-3 rounded-[10px] bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--muted)] text-[11px] flex items-center justify-center gap-1.5">
                            <Lock
                              size={14}
                              strokeWidth={1.5}
                              className="text-[var(--accent)] shrink-0"
                            />
                            <span>
                              {lang === 'ar'
                                ? 'رابط التحميل يظهر تلقائياً فور الموافقة'
                                : 'Download unlocks automatically on approval'}
                            </span>
                          </div>

                          <a
                            href={`https://wa.me/201043397384?text=${encodeURIComponent(
                              lang === 'ar'
                                ? `مرحباً، أود متابعة حالة طلبي رقم (${ord.order_number}) للمنتج (${ord.item_title}).`
                                : `Hello, I would like to follow up on my order (${ord.order_number}).`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-[11px] font-semibold shrink-0 transition-colors"
                          >
                            <MessageCircle size={14} strokeWidth={1.6} />
                            <span>
                              {lang === 'ar' ? 'واتساب للدعم' : 'WhatsApp Support'}
                            </span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </section>
  );
};
