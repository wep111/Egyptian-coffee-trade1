import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  BookOpen,
  FlaskConical,
  MessageCircle,
  Coffee,
  ArrowUpLeft,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { Language } from '../types/coffee';

export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61593679437845',
  instagram: 'https://www.instagram.com/egyptiancoffee1',
  instagramHandle: 'egyptiancoffee1',
  tiktok: 'https://www.tiktok.com/@egyptiancoffeetrade1',
  tiktokHandle: '@egyptiancoffeetrade1',
  youtube: 'https://www.youtube.com/@EgyptianCoffeeTrade',
  youtubeHandle: '@EgyptianCoffeeTrade',
  whatsappGeneral: 'https://wa.me/201043397384',
  whatsappGeneralDisplay: '+201043397384',
  whatsappBusiness: 'https://wa.me/46700930184',
  whatsappBusinessDisplay: '+46 70 093 01 84',
};

export const WhatsAppBrandIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 32 32"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#25D366" />
    <path
      fill="#FFFFFF"
      d="M16.02 7.2c-4.83 0-8.76 3.92-8.76 8.75 0 1.54.4 3.05 1.17 4.38L7.2 24.8l4.6-1.2a8.74 8.74 0 0 0 4.22 1.08h.01c4.83 0 8.76-3.92 8.76-8.75a8.75 8.75 0 0 0-8.77-8.73Zm5.13 12.48c-.22.61-1.27 1.17-1.76 1.24-.46.07-1.03.1-1.67-.1a15.2 15.2 0 0 1-1.52-.56c-2.68-1.15-4.43-3.85-4.56-4.03-.13-.18-1.09-1.45-1.09-2.76 0-1.31.69-1.96.93-2.22.25-.27.54-.33.72-.33.18 0 .36 0 .52.01.17.01.39-.06.61.46.22.54.76 1.85.83 1.98.07.14.11.3.02.48-.09.18-.13.29-.27.45-.13.15-.28.34-.4.46-.13.13-.27.28-.12.55.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.43.11.58-.07.16-.18.67-.78.85-1.05.18-.27.36-.22.6-.13.25.09 1.56.74 1.83.87.27.14.45.2.52.31.07.11.07.65-.15 1.26Z"
    />
  </svg>
);

export const FacebookBrandIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 32 32"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#1877F2" />
    <path
      fill="#FFFFFF"
      d="M20.68 17.5l.55-3.58h-3.44v-2.32c0-.98.48-1.94 2.02-1.94h1.57V6.61s-1.42-.24-2.78-.24c-2.84 0-4.7 1.72-4.7 4.84v2.71H10.7v3.58h3.16v8.66a12.56 12.56 0 0 0 3.93 0V17.5h2.89Z"
    />
  </svg>
);

export const InstagramBrandIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => {
  const gradId = React.useId();
  return (
    <svg
      viewBox="0 0 32 32"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FD5949" />
          <stop offset="45%" stopColor="#D6249F" />
          <stop offset="100%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradId})`} />
      <rect
        x="7.5"
        y="7.5"
        width="17"
        height="17"
        rx="5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <circle
        cx="16"
        cy="16"
        r="4"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <circle cx="21.2" cy="10.8" r="1.2" fill="#FFFFFF" />
    </svg>
  );
};

export const TikTokBrandIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 32 32"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#000000" />
    <path
      fill="#25F4EE"
      d="M21.8 12.6a4.7 4.7 0 0 1-3.3-1.45v6.42a5.35 5.35 0 1 1-4.62-5.3v2.74a2.65 2.65 0 1 0 1.92 2.55V7.5h2.7a4.7 4.7 0 0 0 3.3 3.2v1.9Z"
      transform="translate(-0.7 -0.5)"
    />
    <path
      fill="#FE2C55"
      d="M21.8 12.6a4.7 4.7 0 0 1-3.3-1.45v6.42a5.35 5.35 0 1 1-4.62-5.3v2.74a2.65 2.65 0 1 0 1.92 2.55V7.5h2.7a4.7 4.7 0 0 0 3.3 3.2v1.9Z"
      transform="translate(0.7 0.5)"
    />
    <path
      fill="#FFFFFF"
      d="M21.8 12.6a4.7 4.7 0 0 1-3.3-1.45v6.42a5.35 5.35 0 1 1-4.62-5.3v2.74a2.65 2.65 0 1 0 1.92 2.55V7.5h2.7a4.7 4.7 0 0 0 3.3 3.2v1.9Z"
    />
  </svg>
);

export const YouTubeBrandIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 32 32"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#FF0000" />
    <path
      fill="#FFFFFF"
      d="M23.8 12.1a2.47 2.47 0 0 0-1.74-1.75C20.52 9.93 16 9.93 16 9.93s-4.52 0-6.06.42A2.47 2.47 0 0 0 8.2 12.1c-.41 1.54-.41 3.9-.41 3.9s0 2.36.41 3.9a2.47 2.47 0 0 0 1.74 1.75c1.54.42 6.06.42 6.06.42s4.52 0 6.06-.42a2.47 2.47 0 0 0 1.74-1.75c.41-1.54.41-3.9.41-3.9s0-2.36-.41-3.9ZM14.4 18.4v-4.8L18.6 16l-4.2 2.4Z"
    />
  </svg>
);

export const AboutUsPage: React.FC<{ lang: Language }> = ({ lang }) => {
  return (
    <section className="py-12 md:py-20 bg-[var(--bg)] overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-6 space-y-10"
      >
        {/* Hero Banner */}
        <div className="surface-card p-6 sm:p-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)] p-4 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/_______20013552.png"
                alt="تجـــارة القهـــوة المصـــرية - Egyptian Coffee Trade"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-3 text-center md:text-start">
              <div className="text-xs font-medium text-[var(--accent)]">
                {lang === 'ar'
                  ? 'من نحن · About Egyptian Coffee Trade'
                  : 'About Us · Egyptian Coffee Trade'}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text)]">
                {lang === 'ar'
                  ? 'تجـــارة القهـــوة المصـــرية — المرجع العلمي والتجاري الأول لصناع البن'
                  : 'Egyptian Coffee Trade — The Premier Scientific & Commercial Reference'}
              </h1>
              <p className="text-sm sm:text-base text-[var(--muted)]">
                {lang === 'ar'
                  ? 'منصة "تجـــارة القهـــوة المصـــرية" هي المنصة المرجعية المتخصصة في هندسة وتجارة وتحميص البن في مصر والعالم العربي، وتهدف إلى نقل تجارة القهوة من العشوائية إلى الاحترافية المبنية على المعادلات الدقيقة وبيانات السوق الفورية.'
                  : 'Egyptian Coffee Trade is the specialized reference platform for coffee trading, roasting, and blend engineering in Egypt and the Arab world—transforming coffee trade through exact financial formulas and real-time market intelligence.'}
              </p>
            </div>
          </div>
        </div>

        {/* Vision, Mission, Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="surface-card p-6 space-y-3">
            <Coffee
              size={20}
              strokeWidth={1.5}
              className="text-[var(--accent)]"
            />
            <h2 className="font-display text-xl font-semibold text-[var(--text)]">
              {lang === 'ar' ? 'رؤيتنا في تجارة القهوة' : 'Our Vision'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              {lang === 'ar'
                ? 'تمكين أصحاب المحامص، التجار، الكافيهات، ورواد الأعمال في مصر من بناء علامات تجارية مربحة ومستدامة عبر فهم خصائص السلالات، ضبط فاقد التحميص، وتصميم توليفات تركي وإسبريسو قياسية.'
                : 'Empowering Egyptian roasteries, green bean traders, cafes, and entrepreneurs to build profitable coffee brands through origin mastery, roast shrinkage control, and precision Turkish & Espresso blending.'}
            </p>
          </div>

          <div className="surface-card p-6 space-y-3">
            <BookOpen
              size={20}
              strokeWidth={1.5}
              className="text-[var(--accent)]"
            />
            <h2 className="font-display text-xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'المكتبة الرقمية وموسوعة البن'
                : 'Digital Library & Bean Encyclopedia'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              {lang === 'ar'
                ? 'تقدم المنصة المكتبة الرقمية للكتب السبعة المتخصصة، وموسوعة البن الشاملة، بالإضافة إلى الدورات التدريبية العملية.'
                : 'Featuring the 7-volume digital library, the comprehensive global coffee beans encyclopedia, and hands-on roasting courses.'}
            </p>
          </div>

          <div className="surface-card p-6 space-y-3">
            <FlaskConical
              size={20}
              strokeWidth={1.5}
              className="text-[var(--accent)]"
            />
            <h2 className="font-display text-xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'التحليل الهندسي والمالي بالـ AI'
                : 'AI Financial & Sensory Engine'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              {lang === 'ar'
                ? 'حاسبة ذكية لحساب تكلفة الكيلو المحمص الصافي بعد فاقد التحميص (0% إلى 30%) مع تحليل فوري بالذكاء الاصطناعي للمميزات والعيوب وملاءمة التوليفة للتركي والإسبريسو.'
                : 'An interactive roast-loss calculator (0%–30%) paired with AI sensory & financial diagnostics to optimize flavor and reduce cost per kilogram.'}
            </p>
          </div>
        </div>

        {/* Official Contact & Social Channels — Horizontal Icon-Only Strip */}
        <div className="surface-card p-6 sm:p-8 space-y-5">
          <div>
            <div className="text-xs font-medium text-[var(--accent)] mb-1">
              {lang === 'ar' ? 'قنوات التواصل' : 'Contact Channels'}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'تواصل مباشرة مع إدارة منصة تجـــارة القهـــوة المصـــرية'
                : 'Connect Directly with Egyptian Coffee Trade'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href={SOCIAL_LINKS.whatsappGeneral}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${SOCIAL_LINKS.whatsappGeneralDisplay}`}
              title={SOCIAL_LINKS.whatsappGeneralDisplay}
              className="inline-flex items-center justify-center rounded-xl p-2 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
            >
              <WhatsAppBrandIcon className="w-8 h-8" />
            </a>

            <a
              href={SOCIAL_LINKS.whatsappBusiness}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp Business ${SOCIAL_LINKS.whatsappBusinessDisplay}`}
              title={SOCIAL_LINKS.whatsappBusinessDisplay}
              className="inline-flex items-center justify-center rounded-xl p-2 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
            >
              <WhatsAppBrandIcon className="w-8 h-8" />
            </a>

            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook - Egyptian Coffee Trade"
              title="Facebook"
              className="inline-flex items-center justify-center rounded-xl p-2 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
            >
              <FacebookBrandIcon className="w-8 h-8" />
            </a>

            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram @${SOCIAL_LINKS.instagramHandle}`}
              title={`@${SOCIAL_LINKS.instagramHandle}`}
              className="inline-flex items-center justify-center rounded-xl p-2 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
            >
              <InstagramBrandIcon className="w-8 h-8" />
            </a>

            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`TikTok ${SOCIAL_LINKS.tiktokHandle}`}
              title={SOCIAL_LINKS.tiktokHandle}
              className="inline-flex items-center justify-center rounded-xl p-2 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
            >
              <TikTokBrandIcon className="w-8 h-8" />
            </a>

            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`YouTube ${SOCIAL_LINKS.youtubeHandle}`}
              title={SOCIAL_LINKS.youtubeHandle}
              className="inline-flex items-center justify-center rounded-xl p-2 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
            >
              <YouTubeBrandIcon className="w-8 h-8" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export const PrivacyTermsPage: React.FC<{ lang: Language }> = ({ lang }) => {
  return (
    <section className="py-12 md:py-20 bg-[var(--bg)] overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-6 space-y-8"
      >
        <div className="surface-card p-6 sm:p-10 space-y-6">
          <div className="border-b border-[var(--line)] pb-5 space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <ShieldCheck size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar'
                  ? 'اللوائح القانونية وحماية الحقوق'
                  : 'Legal Framework & Policies'}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'سياسة الخصوصية والشروط والأحكام'
                : 'Privacy Policy & Terms and Conditions'}
            </h1>
          </div>

          <div className="divide-y divide-[var(--line)] text-xs sm:text-sm text-[var(--muted)]">
            <div className="py-4 space-y-2">
              <h2 className="font-display text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                <Lock
                  size={18}
                  strokeWidth={1.5}
                  className="text-[var(--accent)]"
                />
                <span>
                  {lang === 'ar'
                    ? '1. سياسة الخصوصية وحماية بيانات العملاء'
                    : '1. Privacy Policy & Customer Data Protection'}
                </span>
              </h2>
              <p>
                {lang === 'ar'
                  ? 'تلتزم منصة "تجـــارة القهـــوة المصـــرية - Egyptian Coffee Trade" بحماية سرية بيانات جميع الزوار والمشتركين. البيانات التي يتم إدخالها عند طلب الكتب أو الباقات أو الدورات (الاسم، رقم الهاتف أو الواتساب، وإيصال التحويل) تُستخدم حصرياً لمطابقة عملية الدفع وتسليم المحتوى الرقمي للمشتري ولا يتم مشاركتها مع أي طرف ثالث.'
                  : 'Egyptian Coffee Trade strictly protects the privacy of all visitors and customers. Information provided during manual checkout (name, WhatsApp/contact details, and transfer receipts) is used exclusively to verify payments and deliver digital publications.'}
              </p>
            </div>

            <div className="py-4 space-y-2">
              <h2 className="font-display text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                <BookOpen
                  size={18}
                  strokeWidth={1.5}
                  className="text-[var(--accent)]"
                />
                <span>
                  {lang === 'ar'
                    ? '2. حقوق الملكية الفكرية للكتب والموسوعات'
                    : '2. Intellectual Property Rights'}
                </span>
              </h2>
              <p>
                {lang === 'ar'
                  ? 'جميع الكتب الرقمية السبعة، الباقة الموسوعية، الدورات التدريبية، ومحتوى موسوعة البن محمية بحقوق الملكية الفكرية لصالح منصة تجـــارة القهـــوة المصـــرية. يُمنح المشتري ترخيص استخدام شخصي ومهني داخل محمصته أو مشروعه، ويُحظر إعادة بيع الملفات الرقمية أو نشرها تجارياً بدون إذن كتابي مسبق.'
                  : 'All 7 reference books, digital bundles, training courses, and encyclopedia datasets are copyrighted intellectual property of Egyptian Coffee Trade. Buyers receive a personal/commercial usage license for their business; unauthorized redistribution or resale of digital files is strictly prohibited.'}
              </p>
            </div>

            <div className="py-4 space-y-2">
              <h2 className="font-display text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  strokeWidth={1.5}
                  className="text-[var(--accent)]"
                />
                <span>
                  {lang === 'ar'
                    ? '3. شروط الدفع اليدوي وتفعيل الطلبات الرقمية'
                    : '3. Manual Payment Verification & Order Fulfillment'}
                </span>
              </h2>
              <p>
                {lang === 'ar'
                  ? 'تتم عمليات الدفع عبر الحسابات الرسمية المعتمدة فقط سواء عبر المحافظ المحلية (e& cash, Vodafone Cash, InstaPay) أو الحسابات البنكية الدولية (GBP, USD, EUR) أو البيتكوين عبر واتساب الأعمال. يتم تفعيل رابط التحميل المباشر فور مراجعة إيصال التحويل من الإدارة.'
                  : 'Payments are accepted exclusively through official accounts (e& cash, Vodafone Cash, InstaPay, GBP, USD, EUR bank accounts, or Bitcoin via Business WhatsApp). Digital download links unlock immediately upon admin verification of the transfer receipt.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
