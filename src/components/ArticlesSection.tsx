import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Clock,
  X,
  Check,
  Share2,
  Star,
  MessageCircle,
  Coffee,
  FlaskConical,
  LayoutGrid,
  Network,
  Grid3x3,
  Newspaper,
  Search,
  ArrowUpLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Article, ArticleCategory, Language } from '../types/coffee';
import { SOCIAL_LINKS } from './StaticPages';

interface ArticlesSectionProps {
  categories: ArticleCategory[];
  articles: Article[];
  lang: Language;
  initialSearch?: string;
}

interface ArticleRatingMap {
  [articleId: string]: {
    userRating: number;
    totalScore: number;
    votesCount: number;
  };
}

const RATINGS_STORAGE_KEY = 'egcoffee_article_ratings_v1';

interface CategoryVisualMeta {
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  stageAr: string;
  stageEn: string;
  defaultDescAr: string;
  defaultDescEn: string;
}

const CATEGORY_VISUAL_META: Record<string, CategoryVisualMeta> = {
  basics: {
    icon: Coffee,
    stageAr: 'المحطة 01 · التأسيس المعرفي',
    stageEn: 'Stage 01 · Foundation',
    defaultDescAr: 'مدخل إلى عالم القهوة: الحبة والأنواع والمصطلحات الأساسية.',
    defaultDescEn:
      'Introduction to the coffee world: beans, varieties, and core terminology.',
  },
  origins: {
    icon: Coffee,
    stageAr: 'المحطة 02 · الحزام الأخضر',
    stageEn: 'Stage 02 · Coffee Belt Origins',
    defaultDescAr: 'أرابيكا وروبوستا والمناشئ التجارية حول العالم.',
    defaultDescEn:
      'Arabica, Robusta, and commercial coffee origins worldwide.',
  },
  roasting: {
    icon: FlaskConical,
    stageAr: 'المحطة 03 · هندسة التحميص',
    stageEn: 'Stage 03 · Roasting Science',
    defaultDescAr: 'درجات التحميص وأثرها على الطعم والرائحة.',
    defaultDescEn:
      'Roast levels and their impact on flavor, body, and aroma.',
  },
  brewing: {
    icon: FlaskConical,
    stageAr: 'المحطة 04 · الاستخلاص والتحضير',
    stageEn: 'Stage 04 · Extraction & Brewing',
    defaultDescAr: 'طرق التحضير: إسبريسو، V60، فرنش برس، وقهوة تركي.',
    defaultDescEn:
      'Brewing methods: Espresso, V60, French Press, and Turkish Coffee.',
  },
  equipment: {
    icon: LayoutGrid,
    stageAr: 'المحطة 05 · الماكينات والمطاحن',
    stageEn: 'Stage 05 · Roasters & Grinders',
    defaultDescAr: 'المطاحن والماكينات وأدوات التحضير المنزلية والمهنية.',
    defaultDescEn:
      'Grinders, espresso machines, and commercial/home brewing gear.',
  },
  trade: {
    icon: Newspaper,
    stageAr: 'المحطة 06 · البورصة والسوق المصري',
    stageEn: 'Stage 06 · Trade & Markets',
    defaultDescAr: 'أسعار البن العالمية والاستيراد والتجارة في السوق المصري.',
    defaultDescEn:
      'Global coffee futures, importing, and Egyptian market trade.',
  },
  recipes: {
    icon: BookOpen,
    stageAr: 'المحطة 07 · التوليفات والمشروبات',
    stageEn: 'Stage 07 · Recipes & Menu',
    defaultDescAr: 'وصفات القهوة الساخنة والباردة وخلطات المنزل.',
    defaultDescEn: 'Hot and cold coffee recipes and signature house blends.',
  },
};

function getCategoryMeta(
  cat: ArticleCategory,
  index: number
): CategoryVisualMeta {
  const slugKey = (cat.slug || '').toLowerCase().trim();
  if (CATEGORY_VISUAL_META[slugKey]) {
    return CATEGORY_VISUAL_META[slugKey];
  }

  const nameAr = cat.name_ar || '';
  if (nameAr.includes('أساسيات')) return CATEGORY_VISUAL_META.basics;
  if (nameAr.includes('أنواع') || nameAr.includes('مناشئ'))
    return CATEGORY_VISUAL_META.origins;
  if (nameAr.includes('تحميص')) return CATEGORY_VISUAL_META.roasting;
  if (nameAr.includes('تخمير') || nameAr.includes('تحضير'))
    return CATEGORY_VISUAL_META.brewing;
  if (nameAr.includes('أدوات') || nameAr.includes('معدات'))
    return CATEGORY_VISUAL_META.equipment;
  if (nameAr.includes('تجارة') || nameAr.includes('أسواق'))
    return CATEGORY_VISUAL_META.trade;
  if (nameAr.includes('وصفات') || nameAr.includes('مشروبات'))
    return CATEGORY_VISUAL_META.recipes;

  const fallbackKeys = [
    'basics',
    'origins',
    'roasting',
    'brewing',
    'equipment',
    'trade',
    'recipes',
  ];
  return CATEGORY_VISUAL_META[fallbackKeys[index % fallbackKeys.length]];
}

function doesArticleBelongToCategory(
  article: Article,
  cat: ArticleCategory
): boolean {
  if (!article || !cat) return false;
  if (article.category_id && article.category_id === cat.id) return true;
  if (article.category_id && cat.slug && article.category_id === cat.slug)
    return true;

  const artCatAr = (
    article.category_name ||
    article.category_name_ar ||
    ''
  ).trim();
  const artCatEn = (article.category_name_en || '').trim().toLowerCase();

  if (artCatAr && cat.name_ar && artCatAr === cat.name_ar.trim()) return true;
  if (artCatEn && cat.name_en && artCatEn === cat.name_en.trim().toLowerCase())
    return true;
  if (artCatEn && cat.slug && artCatEn === cat.slug.trim().toLowerCase())
    return true;

  return false;
}

export const ArticlesSection: React.FC<ArticlesSectionProps> = ({
  categories,
  articles,
  lang,
  initialSearch = '',
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [mapLayout, setMapLayout] = useState<'grid' | 'map'>('grid');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [openShareArticleId, setOpenShareArticleId] = useState<string | null>(
    null
  );
  const [hoverStarMap, setHoverStarMap] = useState<Record<string, number>>({});
  const [copiedInstaId, setCopiedInstaId] = useState<string | null>(null);

  const ArrowIcon = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const [ratings, setRatings] = useState<ArticleRatingMap>(() => {
    try {
      const saved = localStorage.getItem(RATINGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
    } catch {
      // Ignore storage errors
    }
  }, [ratings]);

  const enrichedCategories = useMemo(() => {
    const sorted = [...categories].sort(
      (a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)
    );
    return sorted.map((cat, idx) => {
      const matchingArticles = articles.filter((art) =>
        doesArticleBelongToCategory(art, cat)
      );
      const count = matchingArticles.length;
      const meta = getCategoryMeta(cat, idx);
      return {
        ...cat,
        liveCount: count,
        meta,
        orderNumber: String(cat.sort_order || idx + 1).padStart(2, '0'),
      };
    });
  }, [categories, articles]);

  const activeCategoryObj = useMemo(() => {
    if (selectedCategoryId === 'all') return null;
    return (
      enrichedCategories.find((c) => c.id === selectedCategoryId) || null
    );
  }, [enrichedCategories, selectedCategoryId]);

  const handleRateArticle = (
    articleId: string,
    stars: number,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setRatings((prev) => {
      const existing = prev[articleId] || {
        userRating: 0,
        totalScore: 4.8 * 12,
        votesCount: 12,
      };
      const isUpdating = existing.userRating > 0;
      const newTotal = isUpdating
        ? existing.totalScore - existing.userRating + stars
        : existing.totalScore + stars;
      const newCount = isUpdating ? existing.votesCount : existing.votesCount + 1;
      return {
        ...prev,
        [articleId]: {
          userRating: stars,
          totalScore: newTotal,
          votesCount: newCount,
        },
      };
    });
  };

  const getArticleRatingStats = (articleId: string) => {
    const entry = ratings[articleId];
    if (!entry) {
      return { userRating: 0, average: '4.8', count: 12 };
    }
    const avg = (entry.totalScore / Math.max(1, entry.votesCount)).toFixed(1);
    return {
      userRating: entry.userRating,
      average: avg,
      count: entry.votesCount,
    };
  };

  const getShareDetails = (article: Article) => {
    const pageUrl = window.location.origin;
    const title =
      lang === 'ar' ? article.title_ar : article.title_en || article.title_ar;
    const summary =
      lang === 'ar'
        ? article.summary_ar || article.excerpt_ar
        : article.excerpt_en || article.summary_ar || '';
    const shareText = `${title}\n${summary}\nمنصة تجـــارة القهـــوة المصـــرية: ${pageUrl}`;
    return {
      facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        pageUrl
      )}&quote=${encodeURIComponent(title)}`,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      shareText,
    };
  };

  const handleInstagramShare = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    const { shareText } = getShareDetails(article);
    navigator.clipboard.writeText(shareText).catch(() => {});
    setCopiedInstaId(article.id);
    setTimeout(() => setCopiedInstaId(null), 2500);
  };

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((art) => {
      if (selectedCategoryId !== 'all' && activeCategoryObj) {
        if (!doesArticleBelongToCategory(art, activeCategoryObj)) {
          return false;
        }
      }
      if (!q) return true;
      return (
        art.title_ar.toLowerCase().includes(q) ||
        (art.title_en || '').toLowerCase().includes(q) ||
        (art.summary_ar || art.excerpt_ar || '').toLowerCase().includes(q) ||
        (art.category_name || art.category_name_ar || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [articles, selectedCategoryId, activeCategoryObj, searchQuery]);

  const renderArticleContent = (content: string | string[] | undefined) => {
    if (!content) return null;
    if (Array.isArray(content)) {
      return content.map((para, i) => <p key={i}>{para}</p>);
    }
    if (
      content.includes('<p') ||
      content.includes('<div') ||
      content.includes('<h')
    ) {
      return (
        <div
          className="space-y-3"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    return content
      .split('\n')
      .filter(Boolean)
      .map((para, i) => <p key={i}>{para}</p>);
  };

  const renderStarRatingWidget = (articleId: string) => {
    const stats = getArticleRatingStats(articleId);
    const hovered = hoverStarMap[articleId] || 0;
    const activeLevel = hovered || stats.userRating || 5;

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5"
      >
        <div
          className="flex items-center gap-0.5"
          onMouseLeave={() =>
            setHoverStarMap((prev) => ({ ...prev, [articleId]: 0 }))
          }
        >
          {[1, 2, 3, 4, 5].map((starNum) => {
            const filled = starNum <= activeLevel;
            return (
              <button
                key={starNum}
                type="button"
                onMouseEnter={() =>
                  setHoverStarMap((prev) => ({ ...prev, [articleId]: starNum }))
                }
                onClick={(e) => handleRateArticle(articleId, starNum, e)}
                aria-label={`Rate ${starNum} stars`}
                className="p-0.5 cursor-pointer"
              >
                <Star
                  size={16}
                  strokeWidth={1.5}
                  className={`transition-colors ${
                    filled
                      ? 'fill-[var(--accent)] text-[var(--accent)]'
                      : 'text-[var(--line)]'
                  }`}
                />
              </button>
            );
          })}
        </div>
        <span className="text-[11px] font-medium text-[var(--text)]">
          {stats.average}
        </span>
        <span className="text-[10px] text-[var(--muted)]">({stats.count})</span>
      </div>
    );
  };

  const renderSocialShareMenu = (article: Article) => {
    const isOpen = openShareArticleId === article.id;
    const { facebookUrl, whatsappUrl } = getShareDetails(article);

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative inline-flex items-center"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenShareArticleId(isOpen ? null : article.id);
          }}
          className={`text-xs ${isOpen ? 'chip-pill-active' : 'chip-pill'}`}
        >
          <Share2 size={16} strokeWidth={1.5} />
          <span>{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-2 end-0 bg-[var(--surface)] text-[var(--text)] rounded-[12px] p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-[var(--line)] flex items-center gap-1.5 z-30 whitespace-nowrap"
            >
              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="chip-pill text-[11px]"
              >
                {lang === 'ar' ? 'فيسبوك' : 'Facebook'}
              </a>

              {/* Instagram */}
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleInstagramShare(article, e)}
                className="chip-pill text-[11px]"
              >
                {copiedInstaId === article.id
                  ? lang === 'ar'
                    ? 'تم نسخ النص لإنستجرام!'
                    : 'Copied for IG!'
                  : lang === 'ar'
                  ? 'إنستجرام'
                  : 'Instagram'}
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="chip-pill text-[11px] text-[var(--accent)]"
              >
                <MessageCircle size={16} strokeWidth={1.5} />
                <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <section id="articles" className="py-12 md:py-20 bg-[var(--bg)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-6 space-y-8"
      >
        {/* Section Header + Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <Newspaper size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar'
                  ? 'مركز الأبحاث والدراسات · الخريطة التفاعلية للأقسام السبعة'
                  : 'Research & Industry Insights · Interactive 7-Pillar Knowledge Map'}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'المقالات التخصصية وشبكة التصنيفات السبعة لصناعة القهوة'
                : 'Specialized Coffee Trade Articles & 7 Visual Knowledge Categories'}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {lang === 'ar'
                ? 'تصفح الأقسام السبعة عبر الشبكة المرئية أو الخريطة التفاعلية لسلسلة قيمة القهوة، مع عداد مباشر يعرض عدد المقالات المتاحة حالياً في كل تصنيف.'
                : 'Explore all 7 coffee industry pillars via the Visual Category Grid or the Interactive Value-Chain Map, with live article counters for each category.'}
            </p>
          </div>

          {/* View Mode Toggle: Visual Grid (Grid3x3) vs Interactive Map (Network) */}
          <div className="flex items-center gap-2 bg-[var(--bg-soft)] p-1.5 rounded-full border border-[var(--line)] self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setMapLayout('grid')}
              className={`text-xs ${
                mapLayout === 'grid' ? 'chip-pill-active' : 'chip-pill'
              }`}
            >
              <Grid3x3 size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar' ? 'شبكة التصنيفات المرئية' : 'Visual Category Grid'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMapLayout('map')}
              className={`text-xs ${
                mapLayout === 'map' ? 'chip-pill-active' : 'chip-pill'
              }`}
            >
              <Network size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar'
                  ? 'الخريطة المعرفية التفاعلية'
                  : 'Interactive Knowledge Map'}
              </span>
            </button>
          </div>
        </div>

        {/* Summary Stats Bar + Search */}
        <div className="surface-card p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('all')}
              className={`text-xs ${
                selectedCategoryId === 'all' ? 'chip-pill-active' : 'chip-pill'
              }`}
            >
              <LayoutGrid size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar'
                  ? 'عرض جميع الأقسام السبعة'
                  : 'Show All 7 Categories'}
              </span>
              <span className="font-medium text-[var(--accent)]">
                ({articles.length})
              </span>
            </button>

            <div className="flex items-center gap-2 text-xs text-[var(--muted)] px-2">
              <span className="font-medium text-[var(--accent)]">
                {enrichedCategories.length}
              </span>
              <span>
                {lang === 'ar'
                  ? 'أقسام معرفية رئيسية لصناعة القهوة'
                  : 'Specialized Knowledge Pillars'}
              </span>
            </div>
          </div>

          {/* Instant Search Input */}
          <div className="relative min-w-[260px] sm:min-w-[320px] flex items-center">
            <Search
              size={18}
              strokeWidth={1.5}
              className="text-[var(--accent)] absolute start-3.5 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'ابحث في عنوان المقال أو القسم أو الملخص...'
                  : 'Search article titles, categories, or summaries...'
              }
              className="input-field ps-10 pe-9 py-2.5 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 p-1 rounded-full text-[var(--muted)] hover:text-[var(--accent)] cursor-pointer"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Horizontal Category Pill Strip (Right at the top for instant filtering) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`text-xs shrink-0 ${
              selectedCategoryId === 'all' ? 'chip-pill-active' : 'chip-pill'
            }`}
          >
            <span>{lang === 'ar' ? 'جميع المقالات' : 'All Articles'}</span>
            <span className="font-medium text-[var(--accent)]">
              ({articles.length})
            </span>
          </button>

          {enrichedCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategoryId(isSelected ? 'all' : cat.id)
                }
                className={`text-xs shrink-0 ${
                  isSelected ? 'chip-pill-active' : 'chip-pill'
                }`}
              >
                <span>
                  {lang === 'ar' ? cat.name_ar : cat.name_en || cat.name_ar}
                </span>
                <span className="font-medium text-[var(--accent)]">
                  ({cat.liveCount})
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Category Inspector Banner */}
        <AnimatePresence mode="wait">
          {activeCategoryObj && (
            <motion.div
              key={activeCategoryObj.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="surface-card border-[var(--accent)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-[var(--accent)]">
                    {lang === 'ar'
                      ? activeCategoryObj.meta.stageAr
                      : activeCategoryObj.meta.stageEn}
                  </span>
                  <span className="text-xs text-[var(--muted)]">·</span>
                  <span className="text-xs font-medium text-[var(--text)]">
                    {activeCategoryObj.liveCount}{' '}
                    {lang === 'ar'
                      ? 'مقالات متاحة حالياً'
                      : 'Articles Available'}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--text)]">
                  {lang === 'ar'
                    ? activeCategoryObj.name_ar
                    : activeCategoryObj.name_en || activeCategoryObj.name_ar}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)]">
                  {lang === 'ar'
                    ? activeCategoryObj.description_ar ||
                      activeCategoryObj.meta.defaultDescAr
                    : activeCategoryObj.description_en ||
                      activeCategoryObj.meta.defaultDescEn}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className="modal-close-btn text-xs self-start sm:self-center shrink-0"
              >
                <X size={16} strokeWidth={2.4} />
                <span>
                  {lang === 'ar'
                    ? 'إلغاء التصفية وعرض الكل'
                    : 'Reset Filter & Show All'}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ARTICLES GRID FIRST — So visitors can read articles immediately */}
        {filteredArticles.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-4">
            <Newspaper
              size={20}
              strokeWidth={1.5}
              className="text-[var(--accent)] mx-auto"
            />
            <div className="font-display text-lg font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'جاري إعداد ونشر أبحاث ودراسات جديدة في هذا القسم قريباً'
                : 'New specialized studies and articles in this category are coming soon'}
            </div>
            {selectedCategoryId !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className="btn-primary text-xs px-5 py-2.5"
              >
                {lang === 'ar'
                  ? 'العودة لعرض جميع المقالات'
                  : 'Back to All Articles'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                onClick={() => setReadingArticle(article)}
                className="surface-card p-6 flex flex-col justify-between space-y-5 cursor-pointer group"
              >
                <div className="space-y-3">
                  {article.cover_image && (
                    <img
                      src={article.cover_image}
                      alt={article.title_ar}
                      referrerPolicy="no-referrer"
                      className="w-full h-48 object-cover rounded-[12px] mb-3 border border-[var(--line)]"
                    />
                  )}
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="font-medium text-[var(--accent)]">
                      {lang === 'ar'
                        ? article.category_name || article.category_name_ar
                        : article.category_name_en || article.category_name}
                    </span>
                    {article.published_date && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{article.published_date}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} strokeWidth={1.5} />
                      <span>{article.read_time_min}</span>{' '}
                      {lang === 'ar' ? 'دقائق' : 'min'}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    {lang === 'ar'
                      ? article.title_ar
                      : article.title_en || article.title_ar}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--muted)] line-clamp-3">
                    {lang === 'ar'
                      ? article.summary_ar || article.excerpt_ar
                      : article.excerpt_en || article.summary_ar}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--line)] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {renderStarRatingWidget(article.id)}
                    {renderSocialShareMenu(article)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[var(--muted)] truncate max-w-[180px]">
                      {lang === 'ar' ? article.author_ar : article.author_en}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--accent)] shrink-0">
                      <span>{lang === 'ar' ? 'اقرأ الدراسة' : 'Read Study'}</span>
                      <ArrowIcon size={18} strokeWidth={1.5} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CATEGORIES OVERVIEW & KNOWLEDGE MAP BELOW ARTICLES */}
        <div className="pt-8 border-t border-[var(--line)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-display text-lg sm:text-xl font-semibold text-[var(--text)]">
                {lang === 'ar'
                  ? 'دليل الأقسام المعرفية السبعة لصناعة القهوة'
                  : 'Guide to the 7 Coffee Industry Knowledge Pillars'}
              </h3>
              <p className="text-xs text-[var(--muted)]">
                {lang === 'ar'
                  ? 'اختر أي قسم لتصفية المقالات أعلاه حسب التخصص'
                  : 'Select any pillar to filter the articles above by specialty'}
              </p>
            </div>
          </div>

          {mapLayout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* All Categories Overview Tile */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId('all');
                  document
                    .getElementById('articles')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`surface-card text-start p-5 cursor-pointer flex flex-col justify-between min-h-[180px] ${
                  selectedCategoryId === 'all' ? 'border-[var(--accent)]' : ''
                }`}
              >
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <LayoutGrid
                      size={20}
                      strokeWidth={1.5}
                      className="text-[var(--accent)]"
                    />
                    <span className="text-xs font-medium text-[var(--accent)]">
                      {articles.length} {lang === 'ar' ? 'مقال' : 'Articles'}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-medium text-[var(--accent)] mb-1">
                      {lang === 'ar'
                        ? 'الدليل الشامل · 01 — 07'
                        : 'Complete Index · 01 — 07'}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-[var(--text)]">
                      {lang === 'ar'
                        ? 'جميع الأقسام السبعة'
                        : 'All 7 Knowledge Pillars'}
                    </h3>
                    <p className="text-xs mt-1 line-clamp-2 text-[var(--muted)]">
                      {lang === 'ar'
                        ? 'استعراض كافة المقالات والدراسات المنشورة عبر جميع تصنيفات القهوة السبعة دون تصفية.'
                        : 'Browse all published studies and articles across every coffee trade category.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between text-xs font-medium text-[var(--accent)] w-full">
                  <span>
                    {selectedCategoryId === 'all'
                      ? lang === 'ar'
                        ? 'القسم النشط حالياً'
                        : 'Currently Active'
                      : lang === 'ar'
                      ? 'انقر لعرض الكل'
                      : 'Click to view all'}
                  </span>
                  <ArrowIcon size={18} strokeWidth={1.5} />
                </div>
              </button>

              {/* The 7 Categories Cards */}
              {enrichedCategories.map((cat) => {
                const IconComponent = cat.meta.icon;
                const isSelected = selectedCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(isSelected ? 'all' : cat.id);
                      document
                        .getElementById('articles')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`surface-card text-start p-5 cursor-pointer flex flex-col justify-between min-h-[180px] group ${
                      isSelected ? 'border-[var(--accent)]' : ''
                    }`}
                  >
                    <div className="space-y-3 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <IconComponent
                            size={20}
                            strokeWidth={1.5}
                            className="text-[var(--accent)]"
                          />
                          <span className="text-xs text-[var(--muted)]">
                            #{cat.orderNumber}
                          </span>
                        </div>

                        <span className="text-xs font-medium text-[var(--accent)]">
                          {cat.liveCount}{' '}
                          {lang === 'ar'
                            ? cat.liveCount === 1
                              ? 'مقال'
                              : 'مقالات'
                            : cat.liveCount === 1
                            ? 'Article'
                            : 'Articles'}
                        </span>
                      </div>

                      <div>
                        <div className="text-[11px] font-medium text-[var(--accent)] mb-1">
                          {lang === 'ar' ? cat.meta.stageAr : cat.meta.stageEn}
                        </div>
                        <h3 className="font-display text-lg font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                          {lang === 'ar'
                            ? cat.name_ar
                            : cat.name_en || cat.name_ar}
                        </h3>
                        <p className="text-xs mt-1 line-clamp-2 text-[var(--muted)]">
                          {lang === 'ar'
                            ? cat.description_ar || cat.meta.defaultDescAr
                            : cat.description_en ||
                              cat.meta.defaultDescEn ||
                              cat.description_ar}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between text-xs font-medium text-[var(--accent)] w-full">
                      <span>
                        {isSelected
                          ? lang === 'ar'
                            ? 'مُفعل'
                            : 'Selected'
                          : lang === 'ar'
                          ? 'تصفح مقالات القسم'
                          : 'View Articles'}
                      </span>
                      <ArrowIcon size={18} strokeWidth={1.5} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* MODE 2: INTERACTIVE KNOWLEDGE MAP */
            <div className="surface-card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[var(--line)]">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                    <Network size={18} strokeWidth={1.5} />
                    <span>
                      {lang === 'ar'
                        ? 'خريطة مسار القهوة التفاعلية (من الحبة الخضراء إلى الكوب والتجارة)'
                        : 'Interactive Coffee Value-Chain Map (From Seed & Trade to Cup)'}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-[var(--text)]">
                    {lang === 'ar'
                      ? 'اضغط على أي محطة في الخريطة لعرض مقالاتها وعدّادها المباشر'
                      : 'Click any station on the map to filter articles and inspect its live counter'}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-medium text-[var(--muted)]">
                    {lang === 'ar' ? 'إجمالي المقالات:' : 'Total Articles:'}
                  </span>
                  <span className="chip-pill-active text-xs">
                    {articles.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {enrichedCategories.map((cat) => {
                  const IconComponent = cat.meta.icon;
                  const isSelected = selectedCategoryId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(isSelected ? 'all' : cat.id);
                        document
                          .getElementById('articles')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`surface-card p-4 text-start cursor-pointer flex flex-col justify-between min-h-[180px] ${
                        isSelected ? 'border-[var(--accent)]' : ''
                      }`}
                    >
                      <div className="space-y-3 w-full">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs text-[var(--muted)]">
                            #{cat.orderNumber}
                          </span>
                          <span className="text-xs font-medium text-[var(--accent)]">
                            {cat.liveCount} {lang === 'ar' ? 'مقال' : 'Art.'}
                          </span>
                        </div>

                        <IconComponent
                          size={20}
                          strokeWidth={1.5}
                          className="text-[var(--accent)]"
                        />

                        <div>
                          <h4 className="font-display text-sm font-semibold text-[var(--text)] mb-1">
                            {lang === 'ar'
                              ? cat.name_ar
                              : cat.name_en || cat.name_ar}
                          </h4>
                          <p className="text-[11px] line-clamp-3 text-[var(--muted)]">
                            {lang === 'ar'
                              ? cat.description_ar || cat.meta.defaultDescAr
                              : cat.description_en ||
                                cat.meta.defaultDescEn ||
                                cat.description_ar}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-medium text-[var(--accent)] w-full">
                        <span>
                          {lang === 'ar' ? 'متاح:' : 'Avail:'} {cat.liveCount}
                        </span>
                        <ArrowIcon size={16} strokeWidth={1.5} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Full Article Reader Modal */}
        {readingArticle && (
          <div
            onClick={() => setReadingArticle(null)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="surface-card max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 bg-white"
            >
              <div className="sticky top-0 z-20 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 px-6 pt-5 pb-4 sm:px-8 sm:pt-6 bg-white/95 backdrop-blur-md flex items-start justify-between gap-4 border-b border-[var(--line)]">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                    <Newspaper size={18} strokeWidth={1.5} />
                    <span>
                      {lang === 'ar'
                        ? readingArticle.category_name ||
                          readingArticle.category_name_ar
                        : readingArticle.category_name_en}{' '}
                      · {readingArticle.published_date}
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text)]">
                    {lang === 'ar'
                      ? readingArticle.title_ar
                      : readingArticle.title_en || readingArticle.title_ar}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReadingArticle(null)}
                  className="modal-close-btn"
                  aria-label={lang === 'ar' ? 'إغلاق المقال' : 'Close Article'}
                >
                  <X size={17} strokeWidth={2.5} />
                  <span>{lang === 'ar' ? 'إغلاق' : 'Close'}</span>
                </button>
              </div>

              <div className="p-4 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text)]">
                    {lang === 'ar' ? 'قيّم هذا المقال:' : 'Rate this article:'}
                  </span>
                  {renderStarRatingWidget(readingArticle.id)}
                </div>
                {renderSocialShareMenu(readingArticle)}
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[var(--text)]">
                {renderArticleContent(
                  lang === 'ar'
                    ? readingArticle.content_ar
                    : readingArticle.content_en || readingArticle.content_ar
                )}
              </div>

              {readingArticle.key_takeaways_ar?.length > 0 && (
                <div className="bg-[var(--bg-soft)] rounded-[12px] p-5 border border-[var(--line)] space-y-2.5">
                  <div className="text-xs font-medium text-[var(--accent)]">
                    {lang === 'ar'
                      ? 'الخلاصة التنفيذية والنقاط العملية:'
                      : 'Key Executive Takeaways:'}
                  </div>
                  {(lang === 'ar'
                    ? readingArticle.key_takeaways_ar
                    : readingArticle.key_takeaways_en
                  ).map((tk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-sm text-[var(--text)]"
                    >
                      <Check
                        size={18}
                        strokeWidth={1.5}
                        className="text-[var(--accent)] shrink-0 mt-0.5"
                      />
                      <span>{tk}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[var(--line)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setReadingArticle(null)}
                  className="modal-close-btn"
                >
                  <X size={17} strokeWidth={2.5} />
                  <span>{lang === 'ar' ? 'إغلاق المقال' : 'Close Article'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
};
