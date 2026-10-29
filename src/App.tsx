import React, { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { motion } from 'motion/react';
import {
  Newspaper,
  ArrowUpLeft,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  FlaskConical,
  UserCheck,
  UserPlus,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume1,
  Volume2,
} from 'lucide-react';
import {
  Language,
  NavTab,
  CoffeePrice,
  CatalogItem,
  CoffeeBean,
  CoffeeBlend,
  ArticleCategory,
  Article,
  OrderRecord,
  CustomerAccount,
  AudioClip,
} from './types/coffee';
import {
  getCoffeePrices,
  getCatalogItems,
  getCoffeeBeans,
  getCoffeeBlends,
  getArticleCategories,
  getArticles,
  getOrders,
  getAudioClips,
  getStoredCustomerAuth,
  logoutCustomerAccount,
} from './services/base44Api';
import { SearchBar } from './components/SearchBar';
import { BookCoverflow } from './components/BookCoverflow';
import { BlendCalculator } from './components/BlendCalculator';
import { BeansEncyclopedia } from './components/BeansEncyclopedia';
import { BlendsEncyclopedia } from './components/BlendsEncyclopedia';
import { ArticlesSection } from './components/ArticlesSection';
import { CoursesSection } from './components/CoursesSection';
import { StoreSection } from './components/StoreSection';
import { OrdersSection } from './components/OrdersSection';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { DockNav } from './components/DockNav';
import { MarketTicker } from './components/MarketTicker';
import {
  AboutUsPage,
  PrivacyTermsPage,
  SOCIAL_LINKS,
  WhatsAppBrandIcon,
  FacebookBrandIcon,
  InstagramBrandIcon,
  TikTokBrandIcon,
  YouTubeBrandIcon,
} from './components/StaticPages';
import { useGlobalUiverseButtons } from './components/UiverseButtonVines';


interface GatesNavProps {
  lang: Language;
  activeTab: NavTab;
  ordersCount: number;
  currentCustomer: CustomerAccount | null;
  onOpenAuth: () => void;
  onNavigate: (tab: NavTab) => void;
  onToggleLang: () => void;
  variant?: 'hero' | 'light';
}

function GatesNav({
  lang,
  activeTab,
  ordersCount,
  currentCustomer,
  onOpenAuth,
  onNavigate,
  onToggleLang,
  variant = 'hero',
}: GatesNavProps) {
  const isLight = variant === 'light';
  const navLinks: { tab: NavTab; label_ar: string; label_en: string }[] = [
    { tab: 'home', label_ar: 'الرئيسية', label_en: 'Home' },
    { tab: 'beans', label_ar: 'موسوعة البن', label_en: 'Bean Origins' },
    { tab: 'blends', label_ar: 'التوليفات', label_en: 'Blends' },
    { tab: 'library', label_ar: 'الكتب السبعة', label_en: 'The 7 Books' },
    {
      tab: 'calculator',
      label_ar: 'حاسبة التوليفات',
      label_en: 'Blend Calculator',
    },
    { tab: 'articles', label_ar: 'المقالات', label_en: 'Research' },
    { tab: 'courses', label_ar: 'الدورات', label_en: 'Courses' },
    {
      tab: 'orders',
      label_ar: ordersCount > 0 ? `طلباتي (${ordersCount})` : 'طلباتي',
      label_en: ordersCount > 0 ? `Orders (${ordersCount})` : 'Orders',
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="reveal flex items-center justify-between gap-4"
    >
      {/* Brand mark */}
      <a
        href="#home"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('home');
        }}
        className={`flex items-center gap-2.5 text-[18px] sm:text-[20px] font-semibold tracking-[-0.03em] select-none shrink-0 ${
          isLight ? 'text-[var(--text)]' : 'text-white'
        }`}
      >
        <img
          src="/assets/aistudio/_______20013552.png"
          alt="تجـــارة القهـــوة المصـــرية"
          referrerPolicy="no-referrer"
          className="pl-0 pr-[1px] pt-0 pb-[1px] -ml-4 -mr-1 mb-[1px] w-[41.9886px] h-[44.9886px] object-contain shrink-0"
        />
        <span
          className={`whitespace-nowrap text-right text-[13px] leading-[32.5px] rounded-[100px] ${
            !isLight ? 'text-[#fef3f3] font-bold italic' : ''
          }`}
        >
          {lang === 'ar' ? 'تجـــارة القهـــوة المصـــرية' : 'Egyptian Coffee Trade'}
        </span>
      </a>

      {/* Center navigation links — Transparent without colors */}
      <ul
        className={`hidden lg:flex items-center gap-1.5 text-[13px] font-medium ${
          isLight ? 'text-[var(--text)]' : 'text-white'
        }`}
      >
        {navLinks.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <li key={item.tab}>
              <button
                type="button"
                onClick={() => onNavigate(item.tab)}
                className={`bg-transparent rounded-[8px] py-1.5 px-3 text-[12.5px] whitespace-nowrap transition-colors cursor-pointer ${
                  isLight
                    ? isActive
                      ? 'border border-black/30 text-[#111111] font-semibold'
                      : 'border border-transparent text-[#111111]/80 hover:text-[#111111] hover:border-black/15'
                    : isActive
                    ? 'border border-white/55 text-white font-semibold'
                    : 'border border-transparent text-white/85 hover:text-white hover:border-white/25'
                }`}
              >
                {lang === 'ar' ? item.label_ar : item.label_en}
              </button>
            </li>
          );
        })}
      </ul>

      {/* End actions: Icon-only Customer Account + Transparent Language switch */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenAuth}
          aria-label={
            currentCustomer
              ? lang === 'ar'
                ? 'حسابي المسجل'
                : 'My Account'
              : lang === 'ar'
              ? 'تسجيل الدخول'
              : 'Sign In'
          }
          title={
            currentCustomer
              ? currentCustomer.name
              : lang === 'ar'
              ? 'تسجيل دخول اختياري لحفظ المشتريات'
              : 'Optional Sign-In to Save Purchases'
          }
          className={`relative bg-transparent rounded-[8px] w-9 h-9 transition-colors cursor-pointer border inline-flex items-center justify-center ${
            currentCustomer
              ? isLight
                ? 'border-emerald-600/50 bg-emerald-500/10 text-emerald-600 hover:border-emerald-600'
                : 'border-emerald-400/75 bg-emerald-500/15 text-emerald-400 hover:border-emerald-300'
              : isLight
              ? 'border-black/20 hover:border-black/50 text-[#111111]'
              : 'border-white/35 hover:border-white/75 text-white'
          }`}
        >
          {currentCustomer ? (
            <>
              <UserCheck size={17} strokeWidth={2.2} className="text-emerald-500 shrink-0" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </>
          ) : (
            <UserPlus size={16} strokeWidth={1.8} className="shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleLang}
          aria-label={
            lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'
          }
          className={`bg-transparent rounded-[8px] w-9 h-9 text-[12px] transition-colors cursor-pointer border inline-flex items-center justify-center ${
            isLight
              ? 'border-black/20 hover:border-black/50 text-[#111111]'
              : 'border-white/35 hover:border-white/75 text-white'
          }`}
        >
          <span
            className={`fi ${
              lang === 'ar' ? 'fi-eg' : 'fi-us'
            } text-xs rounded-[2px]`}
          />
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  useGlobalUiverseButtons();
  const [lang, setLang] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  const [prices, setPrices] = useState<CoffeePrice[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [blends, setBlends] = useState<CoffeeBlend[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0.6);

  const [presetBlend, setPresetBlend] = useState<CoffeeBlend | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<CatalogItem | null>(null);
  const [currentCustomer, setCurrentCustomer] =
    useState<CustomerAccount | null>(() => {
      const saved = getStoredCustomerAuth();
      return saved ? saved.customer : null;
    });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);

  const heroRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeTab !== 'home') {
      setIsPastHero(true);
      return;
    }
    const checkScroll = () => {
      const heroHeight = heroRef.current?.offsetHeight || window.innerHeight;
      setIsPastHero(window.scrollY >= heroHeight - 140);
    };
    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [activeTab]);

  const activeAudioUrl =
    audioClips[currentTrackIndex]?.audio_url || '/media/coffee-music.mp3';
  const activeAudioTitle =
    audioClips[currentTrackIndex]?.title_ar ||
    (lang === 'ar' ? 'مقطع صوتي' : 'Audio Track');

  const handleToggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.volume = musicVolume;
      audio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch(() => setIsMusicPlaying(false));
    } else {
      audio.pause();
      setIsMusicPlaying(false);
    }
  }, [musicVolume]);

  const handleSwitchTrack = useCallback(
    (direction: 'next' | 'prev') => {
      const total = audioClips.length;
      if (total <= 1) {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.volume = musicVolume;
        audio
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
        return;
      }
      setCurrentTrackIndex((prev) =>
        direction === 'next' ? (prev + 1) % total : (prev - 1 + total) % total
      );
      setTimeout(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = musicVolume;
        audio
          .play()
          .then(() => setIsMusicPlaying(true))
          .catch(() => {});
      }, 40);
    },
    [audioClips.length, musicVolume]
  );

  const handleAdjustVolume = useCallback((delta: number) => {
    setMusicVolume((prev) => {
      const next = Math.max(0.05, Math.min(1, Number((prev + delta).toFixed(2))));
      if (audioRef.current) {
        audioRef.current.volume = next;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // GSAP 3 On-Load Entrance Timeline for the Gates Hero
  useEffect(() => {
    if (activeTab !== 'home' || !heroRef.current) return;

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reduce) {
      if (videoRef.current) videoRef.current.pause();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(
        'nav.reveal',
        { y: -14, autoAlpha: 0, duration: 0.7 },
        0.05
      )
        .from(
          '[data-r="headline"] .line',
          { yPercent: 118, duration: 1.15, stagger: 0.12 },
          0.15
        )
        .from(
          '[data-r="body"]',
          { y: 16, autoAlpha: 0, duration: 0.8 },
          0.55
        )
        .from(
          '[data-r="cta"]',
          { y: 14, autoAlpha: 0, duration: 0.75 },
          0.7
        );
    }, heroRef);

    return () => ctx.revert();
  }, [activeTab]);

  const refreshOrders = useCallback(async (phone?: string) => {
    const data = await getOrders(phone);
    setOrders(data);
  }, []);

  const syncAllFromBase44 = useCallback(async () => {
    try {
      const [
        pricesData,
        catalogData,
        beansData,
        blendsData,
        catsData,
        artsData,
        ordersData,
        audioData,
      ] = await Promise.all([
        getCoffeePrices(),
        getCatalogItems(),
        getCoffeeBeans(),
        getCoffeeBlends(),
        getArticleCategories(),
        getArticles(),
        getOrders(),
        getAudioClips(),
      ]);
      setPrices(pricesData);
      setCatalogItems(catalogData);
      setBeans(beansData);
      setBlends(blendsData);
      setCategories(catsData);
      setArticles(artsData);
      setOrders(ordersData);
      if (audioData.length > 0) {
        setAudioClips(audioData);
        setCurrentTrackIndex((prev) => (prev < audioData.length ? prev : 0));
      }
    } catch {
      // Silent background sync
    }
  }, []);

  useEffect(() => {
    syncAllFromBase44();
  }, [syncAllFromBase44]);

  const books = catalogItems.filter(
    (item) => (item.item_type || item.type) === 'book'
  );
  const bundleItem = catalogItems.find(
    (item) => (item.item_type || item.type) === 'bundle'
  );
  const courses = catalogItems.filter(
    (item) => (item.item_type || item.type) === 'course'
  );

  const handleNavigate = (tab: NavTab, query = '') => {
    setGlobalSearchQuery(query);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadBlendIntoCalculator = (blend: CoffeeBlend) => {
    setPresetBlend(blend);
    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderCreated = (newOrder: OrderRecord) => {
    setOrders((prev) => [
      newOrder,
      ...prev.filter((o) => o.id !== newOrder.id),
    ]);
  };

  const ArrowIcon = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col bg-white bg-coffee-sketch text-[var(--text)] pb-24">
      {/* When viewing internal tabs outside the home hero, render the crisp white sticky top bar */}
      {activeTab !== 'home' && (
        <header className="sticky top-0 z-40 px-6 py-4 sm:px-12 lg:px-20 bg-white/95 backdrop-blur-md border-b border-[var(--line)]">
          <GatesNav
            lang={lang}
            activeTab={activeTab}
            ordersCount={orders.length}
            currentCustomer={currentCustomer}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNavigate={(tab) => handleNavigate(tab)}
            onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            variant="light"
          />
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
        {activeTab === 'home' && (
          <>
            {/* GATES 5SDESIGN FULLSCREEN HERO */}
            <section
              ref={heroRef}
              id="home"
              aria-label="Hero"
              className="relative min-h-[100svh] w-full overflow-hidden bg-[color:var(--color-bg)]"
            >
              {/* Layer 1 — Full-bleed background video (Gates cloud portal) */}
              <video
                ref={videoRef}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
                src="/media/gates.mp4"
                poster="/media/gates-poster.jpg"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />

              {/* Layer 2 — Contrast scrims so white type stays crisp over bright clouds */}
              <div
                aria-hidden="true"
                className="hero-scrim pointer-events-none absolute inset-0"
              />
              <div
                aria-hidden="true"
                className="hero-topwash pointer-events-none absolute inset-x-0 top-0 h-28"
              />

              {/* Layer 3 — Foreground layout */}
              <div className="relative z-10 flex min-h-[100svh] flex-col justify-between px-6 pt-6 pb-10 sm:px-12 sm:pt-7 sm:pb-12 lg:px-20 lg:pb-14">
                <GatesNav
                  lang={lang}
                  activeTab={activeTab}
                  ordersCount={orders.length}
                  currentCustomer={currentCustomer}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onNavigate={(tab) => handleNavigate(tab)}
                  onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                />

                {/* Upper-middle headline block */}
                <div className="mt-14 sm:mt-16 lg:mt-20 max-w-[860px]">
                  <h1
                    data-r="headline"
                    className="text-white font-normal tracking-[-0.03em] leading-[1.18] text-[clamp(2.1rem,4.8vw,4.1rem)]"
                  >
                    <span className="block overflow-hidden pb-1.5">
                      <span className="line block will-change-transform font-['Readex_Pro']">
                        {lang === 'ar'
                          ? 'بوابتك لعالم'
                          : 'Your gateway to the world of'}
                      </span>
                    </span>
                    <span className="block overflow-hidden pb-1.5">
                      <span className="line block will-change-transform font-['Readex_Pro'] font-semibold text-[#f8f8f8]">
                        {lang === 'ar' ? 'القهــوة' : 'Coffee'}
                      </span>
                    </span>
                    <span className="block overflow-hidden pb-1.5">
                      <span className="line block will-change-transform font-['Readex_Pro'] text-right no-underline italic font-bold ml-[6px] mt-[1px] mr-[6px] text-[#f5ecec]">
                        {lang === 'ar'
                          ? 'تبدأ من تجـــارة القهـــوة المصـــرية'
                          : 'Starts at Egyptian Coffee Trade'}
                      </span>
                    </span>
                  </h1>
                </div>

                {/* Lower cluster — body copy and 3 organized transparent CTAs */}
                <div className="mt-auto pt-12 max-w-[560px]">
                  <div data-r="body">
                    <p className="text-[14.5px] sm:text-[15.5px] leading-[1.65] font-normal text-white/90 max-w-[490px]">
                      {lang === 'ar'
                        ? 'منصة رقمية موحدة تجمع أسعار وسلالات البن الأخضر العالمي، الكتب السبعة المرجعية، وحاسبة التوليفات بالذكاء الاصطناعي في طبقة واحدة واضحة لصناع وتجار القهوة.'
                        : 'A unified platform bringing green coffee origins, the 7 Reference Volumes, and AI blend engineering into one accessible layer for roasters and traders.'}
                    </p>
                  </div>

                  {/* CTA row: 3 transparent buttons side-by-side on mobile & desktop */}
                  <div
                    data-r="cta"
                    className="mt-7 grid grid-cols-3 gap-2 sm:gap-3 w-full"
                  >
                    <button
                      type="button"
                      onClick={() => handleNavigate('store')}
                      className="uiverse-btn uiverse-btn-transparent rounded-[8px] font-medium flex items-center justify-center text-center leading-snug w-full"
                    >
                      <span>
                        {lang === 'ar'
                          ? 'تصفح الكتب ومتجرنا'
                          : 'Store & Books'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('beans')}
                      className="bg-transparent border border-white/55 hover:bg-white/15 hover:border-white text-white rounded-[8px] px-2 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-[13px] font-medium transition-colors cursor-pointer flex items-center justify-center text-center leading-snug"
                    >
                      <span>
                        {lang === 'ar'
                          ? 'موسوعة القهوة'
                          : 'Coffee Encyclopedia'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('blends')}
                      className="bg-transparent border border-white/55 hover:bg-white/15 hover:border-white text-white rounded-[8px] px-2 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-[13px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center leading-snug"
                    >
                      <Layers
                        size={14}
                        strokeWidth={1.6}
                        className="text-amber-300 shrink-0 hidden sm:inline"
                      />
                      <span>
                        {lang === 'ar' ? 'قسم التوليفات' : 'Coffee Blends'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* SEARCH BAR SECTION IMMEDIATELY AFTER THE HERO */}
            <section
              aria-label={lang === 'ar' ? 'شريط البحث السريع' : 'Quick Search'}
              className="py-6 sm:py-8 px-6 bg-[var(--bg-soft)] border-b border-[var(--line)]"
            >
              <div className="max-w-[1200px] mx-auto">
                <SearchBar
                  lang={lang}
                  catalogItems={catalogItems}
                  beans={beans}
                  articles={articles}
                  onNavigate={handleNavigate}
                  onSelectOrderItem={(item) => setCheckoutItem(item)}
                />
              </div>
            </section>

            {/* 3D COVERFLOW DIGITAL LIBRARY SECTION */}
            <BookCoverflow
              books={books}
              bundleItem={bundleItem}
              lang={lang}
              onBuyItem={(item) => setCheckoutItem(item)}
              onOpenStore={() => handleNavigate('store')}
            />

            {/* AI BLEND COST CALCULATOR & ANALYZER SECTION */}
            <BlendCalculator
              lang={lang}
              beans={beans}
              presetBlend={presetBlend}
              onClearPreset={() => setPresetBlend(null)}
            />

            {/* LIVE BLENDS PREVIEW SECTION ON HOME PAGE */}
            <section className="py-12 md:py-20 bg-[var(--bg)] border-t border-[var(--line)] overflow-x-hidden">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-[1200px] mx-auto px-6 space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                      <Layers
                        size={18}
                        strokeWidth={1.6}
                        className="text-purple-600"
                      />
                      <span>
                        {lang === 'ar'
                          ? `موسوعة التوليفات التجارية (${blends.length} توليفة · 100%)`
                          : `Commercial Blends (${blends.length} Blends · 100%)`}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text)]">
                      {lang === 'ar' ? 'قسم التوليفات' : 'Coffee Blends'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigate('blends')}
                    className="btn-secondary text-xs sm:text-sm px-5 py-2.5 self-start sm:self-auto"
                  >
                    <span>
                      {lang === 'ar'
                        ? 'تصفح جميع التوليفات'
                        : 'Browse All Coffee Blends'}
                    </span>
                    <ArrowIcon
                      size={18}
                      strokeWidth={1.6}
                      className="text-[#950101]"
                    />
                  </button>
                </div>

                {blends.length === 0 ? (
                  <div className="surface-card p-10 text-center text-sm text-[var(--muted)]">
                    {lang === 'ar'
                      ? 'جاري تحميل التوليفات...'
                      : 'Loading coffee blends...'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {blends.slice(0, 3).map((blend) => {
                      const totalPct =
                        blend.ingredients.reduce(
                          (sum, ing) => sum + (Number(ing.percentage) || 0),
                          0
                        ) || 100;

                      return (
                        <div
                          key={blend.id}
                          className="surface-card p-6 flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#950101]">
                                  #{blend.blend_number || blend.code}
                                </span>
                                <span>·</span>
                                <span className="font-medium text-[var(--text)]">
                                  {lang === 'ar'
                                    ? blend.category_ar
                                    : blend.category_en}
                                </span>
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {totalPct}%
                              </span>
                            </div>
                            <h3 className="font-display text-lg font-semibold text-[var(--text)]">
                              {lang === 'ar' ? blend.name_ar : blend.name_en}
                            </h3>
                            <p className="text-xs text-[var(--muted)] line-clamp-2">
                              {lang === 'ar'
                                ? blend.characteristics_ar ||
                                  blend.flavor_profile_ar
                                : blend.flavor_profile_en ||
                                  blend.characteristics_ar}
                            </p>
                            <div className="bg-[var(--bg-soft)] rounded-[10px] p-3 border border-[var(--line)] divide-y divide-[var(--line)]">
                              {blend.ingredients.map((ing, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between py-1 text-xs"
                                >
                                  <span className="text-[var(--text)] font-medium truncate">
                                    {lang === 'ar'
                                      ? ing.bean_name_ar
                                      : ing.bean_name_en}
                                  </span>
                                  <span className="font-bold text-[#950101] shrink-0 ms-2">
                                    {ing.percentage}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleLoadBlendIntoCalculator(blend)
                              }
                              className="btn-primary text-xs px-4 py-2 w-full justify-center"
                            >
                              <FlaskConical
                                size={16}
                                strokeWidth={1.6}
                                className="text-amber-400"
                              />
                              <span>
                                {lang === 'ar'
                                  ? 'فتح في الحاسبة الذكية'
                                  : 'Load in AI Calculator'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </section>

            {/* LIVE CATEGORIES & ARTICLES SECTION PREVIEW (Editorial List Layout) */}
            <section className="py-12 md:py-20 bg-[var(--bg-soft)] border-t border-[var(--line)] overflow-x-hidden">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-[1200px] mx-auto px-6 space-y-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                      <Newspaper
                        size={18}
                        strokeWidth={1.6}
                        className="text-blue-600"
                      />
                      <span>
                        {lang === 'ar'
                          ? `مركز الأبحاث والدراسات (${categories.length} أقسام معرفية)`
                          : `Research & Knowledge Center (${categories.length} Categories)`}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text)]">
                      {lang === 'ar'
                        ? 'أقسام ومقالات صناعة وتجارة القهوة'
                        : 'Specialized Coffee Trade Categories & Articles'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigate('articles')}
                    className="btn-secondary text-xs sm:text-sm px-5 py-2.5 self-start sm:self-auto"
                  >
                    <span>
                      {lang === 'ar'
                        ? 'تصفح جميع المقالات والأقسام'
                        : 'Browse All Articles & Categories'}
                    </span>
                    <ArrowIcon
                      size={18}
                      strokeWidth={1.5}
                      className="border-[#e51414] text-[#2bbe34]"
                    />
                  </button>
                </div>

                {/* Categories Pills */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat, idx) => {
                      const pillBgClasses = [
                        '!bg-[#ffd69c]',
                        '!bg-[#edb1b1]',
                        '!bg-[#e0c297]',
                        '!bg-[#9a9efb]',
                        '!bg-[#b58ff4]',
                        '!bg-[#ffb4e0]',
                        '!bg-[#a3ffde]',
                      ];
                      const bgClass = pillBgClasses[idx] || '';
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleNavigate('articles')}
                          className={`chip-pill text-xs ${bgClass}`}
                        >
                          {lang === 'ar'
                            ? cat.name_ar
                            : cat.name_en || cat.name_ar}
                        </button>
                      );
                    })}
                  </div>
                )}

                {articles.length === 0 ? (
                  <div className="surface-card p-10 text-center text-sm text-[var(--muted)]">
                    {lang === 'ar'
                      ? 'لا توجد مقالات منشورة حالياً.'
                      : 'No published articles yet.'}
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)]">
                    {articles.slice(0, 6).map((art) => (
                      <div
                        key={art.id}
                        onClick={() => handleNavigate('articles')}
                        className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                      >
                        <div className="space-y-1 max-w-3xl">
                          <div className="text-xs text-[var(--accent)] font-medium">
                            {lang === 'ar'
                              ? art.category_name || art.category_name_ar
                              : art.category_name_en || art.category_name}
                            {art.published_date ? (
                              <span className="text-[var(--muted)]">
                                {' '}
                                · {art.published_date}
                              </span>
                            ) : (
                              ''
                            )}
                          </div>
                          <h3 className="font-display text-lg font-semibold text-[var(--text)] group-hover:opacity-75 transition-opacity">
                            {lang === 'ar'
                              ? art.title_ar
                              : art.title_en || art.title_ar}
                          </h3>
                          <p className="text-xs sm:text-sm text-[var(--muted)] line-clamp-2">
                            {lang === 'ar'
                              ? art.summary_ar || art.excerpt_ar
                              : art.excerpt_en || art.summary_ar}
                          </p>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] shrink-0">
                          <span>
                            {lang === 'ar' ? 'اقرأ الدراسة' : 'Read Study'}
                          </span>
                          <ArrowIcon size={18} strokeWidth={1.5} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </section>

            {/* LIVE COFFEE MARKET EXCHANGE TICKER BELOW THE LAST SECTION */}
            <MarketTicker prices={prices} beans={beans} lang={lang} />
          </>
        )}

        {activeTab === 'store' && (
          <StoreSection
            catalogItems={catalogItems}
            lang={lang}
            onBuyItem={(item) => setCheckoutItem(item)}
          />
        )}

        {activeTab === 'calculator' && (
          <BlendCalculator
            lang={lang}
            beans={beans}
            presetBlend={presetBlend}
            onClearPreset={() => setPresetBlend(null)}
          />
        )}

        {activeTab === 'library' && (
          <BookCoverflow
            books={books}
            bundleItem={bundleItem}
            lang={lang}
            onBuyItem={(item) => setCheckoutItem(item)}
            onOpenStore={() => handleNavigate('store')}
          />
        )}

        {activeTab === 'beans' && (
          <BeansEncyclopedia
            beans={beans}
            lang={lang}
            initialSearch={globalSearchQuery}
          />
        )}

        {activeTab === 'blends' && (
          <BlendsEncyclopedia
            blends={blends}
            lang={lang}
            initialSearch={globalSearchQuery}
            onLoadInCalculator={handleLoadBlendIntoCalculator}
          />
        )}

        {activeTab === 'articles' && (
          <ArticlesSection
            categories={categories}
            articles={articles}
            lang={lang}
            initialSearch={globalSearchQuery}
          />
        )}

        {activeTab === 'courses' && (
          <CoursesSection
            courses={courses}
            lang={lang}
            onBuyCourse={(course) => setCheckoutItem(course)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersSection
            orders={orders}
            catalogItems={catalogItems}
            lang={lang}
            initialQuery={globalSearchQuery}
            currentCustomer={currentCustomer}
            onOpenCustomerAuth={() => setIsAuthModalOpen(true)}
            onLogoutCustomer={() => {
              logoutCustomerAccount();
              setCurrentCustomer(null);
              refreshOrders('');
            }}
            onRefreshOrders={refreshOrders}
            onNewOrderClick={(item) => setCheckoutItem(item)}
          />
        )}

        {activeTab === 'about' && <AboutUsPage lang={lang} />}

        {activeTab === 'privacy' && <PrivacyTermsPage lang={lang} />}
      </main>

      {/* Footer: Crisp White with Transparent Black Drawn Line-Art, 4 Columns */}
      <footer className="border-t border-[var(--line)] bg-white bg-coffee-sketch pt-12 pb-20 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-[1200px] mx-auto px-6 space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Brand + Short Blurb */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/_______20013552.png"
                  alt="Egyptian Coffee Trade"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 object-contain shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-display text-lg font-semibold text-[var(--text)]">
                    {lang === 'ar'
                      ? 'تجـــارة القهـــوة المصـــرية'
                      : 'Egyptian Coffee Trade'}
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[var(--muted)]">
                {lang === 'ar'
                  ? 'المرجع العلمي والتجاري الأول لصناع وتجار البن في مصر والعالم العربي: موسوعة البن، حاسبة التوليفات الذكية، والكتب السبعة.'
                  : 'The premier scientific and commercial reference for coffee roasters and traders: Bean Encyclopedia, Smart Blend Calculator, and the 7 Books.'}
              </p>
            </div>

            {/* Column 2: روابط الصفحات — شفاف بدون ألوان */}
            <div className="space-y-3">
              <h3 className="font-display text-base font-semibold text-[var(--text)]">
                {lang === 'ar' ? 'روابط الصفحات' : 'Page Links'}
              </h3>
              <ul className="flex flex-wrap gap-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('home')}
                    className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'الرئيسية' : 'Home'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('store')}
                    className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'متجرنا الشامل' : 'Our Store'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('beans')}
                    className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'موسوعة البن' : 'Bean Encyclopedia'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('blends')}
                    className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'قسم التوليفات' : 'Coffee Blends'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('calculator')}
                    className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'حاسبة التوليفات' : 'Blend Calculator'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('library')}
                    className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'الكتب السبعة' : 'The Seven Books'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('articles')}
                    className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === 'ar'
                      ? 'الأقسام السبعة والمقالات'
                      : 'Articles & 7 Pillars'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('orders')}
                    className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-1.5 px-3 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === 'ar'
                      ? `طلباتي (${orders.length})`
                      : `Orders (${orders.length})`}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: قنوات التواصل — أيقونات فقط بشكل أفقي ومرتب */}
            <div className="space-y-3">
              <h3 className="font-display text-base font-semibold text-[var(--text)]">
                {lang === 'ar' ? 'قنوات التواصل' : 'Contact Channels'}
              </h3>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={SOCIAL_LINKS.whatsappGeneral}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${SOCIAL_LINKS.whatsappGeneralDisplay}`}
                  title={SOCIAL_LINKS.whatsappGeneralDisplay}
                  className="inline-flex items-center justify-center rounded-xl p-1.5 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
                >
                  <WhatsAppBrandIcon className="w-7 h-7" />
                </a>

                <a
                  href={SOCIAL_LINKS.whatsappBusiness}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp Business ${SOCIAL_LINKS.whatsappBusinessDisplay}`}
                  title={SOCIAL_LINKS.whatsappBusinessDisplay}
                  className="inline-flex items-center justify-center rounded-xl p-1.5 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
                >
                  <WhatsAppBrandIcon className="w-7 h-7" />
                </a>

                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook - Egyptian Coffee Trade"
                  title="Facebook"
                  className="inline-flex items-center justify-center rounded-xl p-1.5 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
                >
                  <FacebookBrandIcon className="w-7 h-7" />
                </a>

                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram @${SOCIAL_LINKS.instagramHandle}`}
                  title={`@${SOCIAL_LINKS.instagramHandle}`}
                  className="inline-flex items-center justify-center rounded-xl p-1.5 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
                >
                  <InstagramBrandIcon className="w-7 h-7" />
                </a>

                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`TikTok ${SOCIAL_LINKS.tiktokHandle}`}
                  title={SOCIAL_LINKS.tiktokHandle}
                  className="inline-flex items-center justify-center rounded-xl p-1.5 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
                >
                  <TikTokBrandIcon className="w-7 h-7" />
                </a>

                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`YouTube ${SOCIAL_LINKS.youtubeHandle}`}
                  title={SOCIAL_LINKS.youtubeHandle}
                  className="inline-flex items-center justify-center rounded-xl p-1.5 border border-[var(--line)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-black hover:-translate-y-0.5 transition-all"
                >
                  <YouTubeBrandIcon className="w-7 h-7" />
                </a>
              </div>
            </div>

            {/* Column 4: Legal Links — شفاف بدون ألوان */}
            <div className="space-y-3">
              <h3 className="font-display text-base font-semibold text-[var(--text)]">
                {lang === 'ar'
                  ? 'الشؤون القانونية والتعريفية'
                  : 'Legal & About'}
              </h3>
              <div className="flex flex-col items-start gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleNavigate('about')}
                  className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-2 px-3.5 w-full flex items-center justify-between text-xs font-medium transition-colors cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'من نحن' : 'About Us'}</span>
                  <ArrowIcon
                    size={16}
                    strokeWidth={1.6}
                    className="text-amber-600"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigate('privacy')}
                  className="bg-transparent border border-black/15 hover:border-black/45 text-[var(--text)] rounded-[8px] py-2 px-3.5 w-full flex items-center justify-between text-xs font-medium transition-colors cursor-pointer"
                >
                  <span>
                    {lang === 'ar'
                      ? 'سياسة الخصوصية والشروط والأحكام'
                      : 'Privacy Policy & Terms'}
                  </span>
                  <ShieldCheck
                    size={16}
                    strokeWidth={1.6}
                    className="text-emerald-600 shrink-0"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Copyright Line */}
          <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
            <div className="text-center sm:text-start">
              {lang === 'ar' ? (
                <>
                  جميع الحقوق محفوظة ©{' '}
                  <span className="font-medium text-[var(--text)]">2026</span>{' '}
                  تجـــارة القهـــوة المصـــرية
                </>
              ) : (
                <>
                  All rights reserved ©{' '}
                  <span className="font-medium text-[var(--text)]">2026</span>{' '}
                  Egyptian Coffee Trade
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigate('about')}
                className="bg-transparent border border-transparent hover:border-black/25 text-[var(--text)] rounded-[8px] py-1 px-3 text-xs font-medium transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'من نحن' : 'About Us'}
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('privacy')}
                className="bg-transparent border border-transparent hover:border-black/25 text-[var(--text)] rounded-[8px] py-1 px-3 text-xs font-medium transition-colors cursor-pointer"
              >
                {lang === 'ar'
                  ? 'سياسة الخصوصية والشروط والأحكام'
                  : 'Privacy Policy & Terms'}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Checkout Modal for Books, Full Bundle, Courses & Other Products */}
      <CheckoutModal
        item={checkoutItem}
        lang={lang}
        currentCustomer={currentCustomer}
        onOpenCustomerAuth={() => setIsAuthModalOpen(true)}
        onClose={() => setCheckoutItem(null)}
        onOrderSuccess={(ord) => {
          handleOrderCreated(ord);
        }}
        onGoToOrders={(orderNumber) => handleNavigate('orders', orderNumber)}
      />

      {/* Optional Customer Login / Register Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        lang={lang}
        currentCustomer={currentCustomer}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={(cust) => {
          setCurrentCustomer(cust);
          refreshOrders('');
        }}
      />

      {/* Persistent Audio Player from Base44 AudioClip & Clean Icon-Only Bottom Controller (Visible ONLY below Hero) */}
      <audio
        ref={audioRef}
        src={activeAudioUrl}
        loop={audioClips.length <= 1}
        preload="metadata"
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
        onEnded={() => {
          if (audioClips.length > 1) {
            handleSwitchTrack('next');
          }
        }}
      />

      <div
        dir="ltr"
        title={activeAudioTitle}
        className={`fixed bottom-20 left-3 sm:bottom-20 sm:left-6 z-50 rounded-full px-2 py-1.5 shadow-lg backdrop-blur-md border bg-white/95 text-[#111111] border-black/15 hover:border-black/35 transition-all duration-300 flex items-center gap-1 select-none ${
          isPastHero
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Play / Pause Button (Icon Only — No Text, Same Clean Color) */}
        <button
          type="button"
          onClick={handleToggleMusic}
          aria-label={
            isMusicPlaying
              ? lang === 'ar'
                ? 'إيقاف الصوت'
                : 'Pause Audio'
              : lang === 'ar'
              ? 'تشغيل الصوت'
              : 'Play Audio'
          }
          title={activeAudioTitle}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer bg-[#950101]/10 hover:bg-[#950101]/20 text-[#950101]"
        >
          {isMusicPlaying ? (
            <Pause size={15} strokeWidth={2.4} className="text-[#950101] shrink-0" />
          ) : (
            <Play size={15} strokeWidth={2.4} className="text-[#950101] fill-[#950101] ml-0.5 shrink-0" />
          )}
        </button>

        {/* Track Switching Controls (Prev / Next AudioClip) */}
        <div className="flex items-center gap-0.5 px-1 border-x border-black/10">
          <button
            type="button"
            onClick={() => handleSwitchTrack('prev')}
            aria-label={lang === 'ar' ? 'المقطع السابق' : 'Previous Track'}
            title={lang === 'ar' ? 'المقطع السابق' : 'Previous Track'}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5 text-[#111111]/80 hover:text-[#111111]"
          >
            <SkipBack size={13} strokeWidth={2.1} />
          </button>

          {isMusicPlaying && (
            <span className="flex items-end gap-[2px] h-3 px-1">
              <span className="w-[2px] h-full bg-[#950101] rounded-full music-bar-1" />
              <span className="w-[2px] h-full bg-[#950101] rounded-full music-bar-2" />
              <span className="w-[2px] h-full bg-[#950101] rounded-full music-bar-3" />
            </span>
          )}

          <button
            type="button"
            onClick={() => handleSwitchTrack('next')}
            aria-label={lang === 'ar' ? 'المقطع التالي' : 'Next Track'}
            title={lang === 'ar' ? 'المقطع التالي' : 'Next Track'}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5 text-[#111111]/80 hover:text-[#111111]"
          >
            <SkipForward size={13} strokeWidth={2.1} />
          </button>
        </div>

        {/* Volume Down / Volume Level / Volume Up Controls */}
        <div className="flex items-center gap-0.5 pl-0.5">
          <button
            type="button"
            onClick={() => handleAdjustVolume(-0.15)}
            aria-label={lang === 'ar' ? 'خفض الصوت' : 'Volume Down'}
            title={lang === 'ar' ? 'خفض الصوت' : 'Volume Down'}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5 text-[#111111]/75 hover:text-[#111111]"
          >
            <Volume1 size={14} strokeWidth={2} />
          </button>

          {/* Mini 4-step volume level indicator */}
          <div className="flex items-end gap-[2px] h-3 px-0.5" aria-hidden="true">
            {[0.25, 0.5, 0.75, 1].map((threshold, idx) => {
              const active = musicVolume >= threshold - 0.1;
              return (
                <span
                  key={threshold}
                  style={{ height: `${(idx + 1) * 25}%` }}
                  className={`w-[2px] rounded-full transition-colors ${
                    active ? 'bg-[#950101]' : 'bg-black/15'
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleAdjustVolume(0.15)}
            aria-label={lang === 'ar' ? 'رفع الصوت' : 'Volume Up'}
            title={lang === 'ar' ? 'رفع الصوت' : 'Volume Up'}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/5 text-[#111111]/75 hover:text-[#111111]"
          >
            <Volume2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <DockNav
        activeTab={activeTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        lang={lang}
        ordersCount={orders.length}
      />
    </div>
  );
}
