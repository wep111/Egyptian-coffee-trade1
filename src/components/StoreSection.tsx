import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  BookOpen,
  GraduationCap,
  Package,
  Search,
  FileText,
  Calendar,
  Tag,
} from 'lucide-react';
import { CatalogItem, Language } from '../types/coffee';

interface StoreSectionProps {
  catalogItems: CatalogItem[];
  lang: Language;
  onBuyItem: (item: CatalogItem) => void;
}

type StoreFilter = 'all' | 'books' | 'courses' | 'other';

export const StoreSection: React.FC<StoreSectionProps> = ({
  catalogItems,
  lang,
  onBuyItem,
}) => {
  const [filter, setFilter] = useState<StoreFilter>('all');
  const [subCategory, setSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const otherCategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of catalogItems) {
      const t = String(item.item_type || item.type || 'book').toLowerCase();
      if (t !== 'book' && t !== 'bundle' && t !== 'course' && item.category_ar) {
        set.add(item.category_ar.trim());
      }
    }
    return Array.from(set);
  }, [catalogItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogItems.filter((item) => {
      const t = String(item.item_type || item.type || 'book').toLowerCase();
      if (filter === 'books' && t !== 'book' && t !== 'bundle') return false;
      if (filter === 'courses' && t !== 'course') return false;
      if (
        filter === 'other' &&
        (t === 'book' || t === 'bundle' || t === 'course')
      ) {
        return false;
      }

      if (
        filter === 'other' &&
        subCategory !== 'all' &&
        (item.category_ar || '').trim() !== subCategory
      ) {
        return false;
      }

      if (!q) return true;
      return (
        item.title_ar.toLowerCase().includes(q) ||
        (item.title_en || '').toLowerCase().includes(q) ||
        (item.description_ar || '').toLowerCase().includes(q) ||
        (item.subtitle_ar || '').toLowerCase().includes(q) ||
        (item.category_ar || '').toLowerCase().includes(q) ||
        (item.unit || '').toLowerCase().includes(q)
      );
    });
  }, [catalogItems, filter, subCategory, searchQuery]);

  const counts = useMemo(() => {
    let booksCount = 0;
    let coursesCount = 0;
    let otherCount = 0;
    for (const item of catalogItems) {
      const t = String(item.item_type || item.type || 'book').toLowerCase();
      if (t === 'book' || t === 'bundle') booksCount++;
      else if (t === 'course') coursesCount++;
      else otherCount++;
    }
    return {
      all: catalogItems.length,
      books: booksCount,
      courses: coursesCount,
      other: otherCount,
    };
  }, [catalogItems]);

  return (
    <section className="py-12 md:py-20 bg-[var(--bg)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-6 space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <ShoppingBag size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar'
                  ? 'متجر تجـــارة القهـــوة المصـــرية الرسمي'
                  : 'Official Egyptian Coffee Trade Store'}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'متجرنا الشامل — الكتب، الدورات التدريبية، والمنتجات المتخصصة'
                : 'Our Official Store — Reference Books, Courses & Specialized Products'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              {lang === 'ar'
                ? 'اختر أي كتاب رقمي، باقة شاملة، دورة تدريبية، أو منتج متخصص (أدوات تحضير، أكواب، ماكينات، مستلزمات أخرى) واطلبه مباشرة ليصلك رقم الطلب الفوري.'
                : 'Select any reference book, complete bundle, training course, or specialized coffee product to receive your instant Order Number.'}
            </p>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  {
                    id: 'all',
                    ar: `جميع المنتجات (${counts.all})`,
                    en: `All Items (${counts.all})`,
                    icon: ShoppingBag,
                  },
                  {
                    id: 'books',
                    ar: `الكتب والباقات (${counts.books})`,
                    en: `Books & Bundles (${counts.books})`,
                    icon: BookOpen,
                  },
                  {
                    id: 'courses',
                    ar: `الدورات التدريبية (${counts.courses})`,
                    en: `Courses (${counts.courses})`,
                    icon: GraduationCap,
                  },
                  {
                    id: 'other',
                    ar: `المنتجات الأخرى (${counts.other})`,
                    en: `Other Products (${counts.other})`,
                    icon: Package,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setFilter(tab.id);
                      setSubCategory('all');
                    }}
                    className={`text-xs shrink-0 inline-flex items-center gap-1.5 ${
                      active ? 'chip-pill-active' : 'chip-pill'
                    }`}
                  >
                    <Icon size={15} strokeWidth={1.5} />
                    <span>{lang === 'ar' ? tab.ar : tab.en}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-80 flex items-center">
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
                    ? 'ابحث في الكتب والدورات والمنتجات...'
                    : 'Search books, courses, products...'
                }
                className="input-field ps-10 pe-4 py-2.5 text-xs sm:text-sm"
              />
            </div>
          </div>

          {filter === 'other' && otherCategories.length > 0 && (
            <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[var(--muted)] me-1">
                {lang === 'ar' ? 'تصنيف المنتج:' : 'Category:'}
              </span>
              <button
                type="button"
                onClick={() => setSubCategory('all')}
                className={`text-xs ${
                  subCategory === 'all' ? 'chip-pill-active' : 'chip-pill'
                }`}
              >
                {lang === 'ar' ? 'الكل' : 'All'}
              </button>
              {otherCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSubCategory(cat)}
                  className={`text-xs ${
                    subCategory === cat ? 'chip-pill-active' : 'chip-pill'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Store Grid */}
        {filteredItems.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-3">
            <Package
              size={22}
              strokeWidth={1.5}
              className="text-[var(--accent)] mx-auto"
            />
            <div className="font-display text-lg font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'لا توجد منتجات في هذا القسم حالياً'
                : 'No products found in this category right now'}
            </div>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
              {lang === 'ar'
                ? 'يمكنك تصفح جميع الأقسام الأخرى أو التواصل معنا مباشرة لطلب أي منتج أو استشارة خاصة.'
                : 'Browse other categories or contact us directly for custom requests.'}
            </p>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setSubCategory('all');
                }}
                className="btn-secondary text-xs px-5 py-2 mt-2"
              >
                {lang === 'ar' ? 'عرض جميع المنتجات' : 'Show All Products'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const t = String(item.item_type || item.type || 'book').toLowerCase();
              const isBundle = t === 'bundle';
              const isCourse = t === 'course';
              const isBook = t === 'book';

              const typeBadgeAr = isBundle
                ? 'الباقة الموسوعية الكاملة'
                : isCourse
                ? 'دورة تدريبية عملية'
                : isBook
                ? 'كتاب رقمي مرجعي'
                : item.category_ar || 'منتج متخصص';
              const typeBadgeEn = isBundle
                ? 'Complete Bundle'
                : isCourse
                ? 'Training Course'
                : isBook
                ? 'Reference Book'
                : item.category_ar || 'Specialized Product';

              return (
                <div
                  key={item.id}
                  className="surface-card p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {item.cover_image ? (
                      <div
                        className={`w-full ${
                          isBook || isBundle ? 'h-72 sm:h-80' : 'h-60'
                        } rounded-[12px] border border-[var(--line)] bg-[var(--bg-soft)] p-3 flex items-center justify-center overflow-hidden`}
                      >
                        <img
                          src={item.cover_image}
                          alt={lang === 'ar' ? item.title_ar : item.title_en}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain rounded-[8px] drop-shadow-sm transition-transform duration-300 hover:scale-[1.03]"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-44 rounded-[12px] border border-[var(--line)] bg-[var(--bg-soft)] p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                          <span className="font-medium text-[var(--accent)]">
                            {lang === 'ar' ? typeBadgeAr : typeBadgeEn}
                          </span>
                          <img
                            src="/assets/aistudio/_______20013552.png"
                            alt="Egyptian Coffee Trade"
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 object-contain"
                          />
                        </div>
                        <div className="font-display text-base font-semibold text-[var(--text)] line-clamp-2">
                          {lang === 'ar' ? item.title_ar : item.title_en}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)]">
                        {isCourse ? (
                          <GraduationCap size={15} strokeWidth={1.5} />
                        ) : isBook || isBundle ? (
                          <BookOpen size={15} strokeWidth={1.5} />
                        ) : (
                          <Package size={15} strokeWidth={1.5} />
                        )}
                        <span>{lang === 'ar' ? typeBadgeAr : typeBadgeEn}</span>
                      </div>

                      <h3 className="font-display text-xl font-semibold text-[var(--text)]">
                        {lang === 'ar' ? item.title_ar : item.title_en}
                      </h3>

                      {item.title_en &&
                        item.title_en !== item.title_ar &&
                        lang === 'ar' && (
                          <div className="text-xs font-medium text-[var(--muted)]">
                            {item.title_en}
                          </div>
                        )}

                      <p className="text-xs sm:text-sm text-[var(--muted)] line-clamp-3">
                        {lang === 'ar'
                          ? item.description_ar || item.subtitle_ar
                          : item.description_en || item.subtitle_en}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[var(--muted)]">
                      {item.pages && item.pages > 0 ? (
                        <div className="inline-flex items-center gap-1.5">
                          <FileText size={15} strokeWidth={1.5} />
                          <span>
                            {item.pages} {lang === 'ar' ? 'صفحة' : 'pages'}
                          </span>
                        </div>
                      ) : null}

                      {item.course_schedule ? (
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar size={15} strokeWidth={1.5} />
                          <span>{item.course_schedule}</span>
                        </div>
                      ) : null}

                      {item.unit ? (
                        <div className="inline-flex items-center gap-1.5 font-medium text-[var(--text)]">
                          <Package size={15} strokeWidth={1.5} className="text-[var(--accent)]" />
                          <span>
                            {lang === 'ar' ? 'الوحدة / العبوة:' : 'Unit:'}{' '}
                            {item.unit}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Price & Buy Button */}
                  <div className="pt-4 border-t border-[var(--line)] space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[var(--muted)] inline-flex items-center gap-1">
                        <Tag size={14} strokeWidth={1.5} className="text-[var(--accent)]" />
                        <span>{lang === 'ar' ? 'السعر:' : 'Price:'}</span>
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-2xl font-semibold text-[var(--text)]">
                          {(item.price ?? item.price_egp ?? 0).toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-[var(--accent)]">
                          {lang === 'ar'
                            ? item.currency && item.currency !== 'EGP'
                              ? item.currency
                              : 'ج.م'
                            : item.currency || 'EGP'}
                        </span>
                        {item.unit ? (
                          <span className="text-[11px] text-[var(--muted)]">
                            / {item.unit}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onBuyItem(item)}
                      className="uiverse-btn w-full py-3 px-6 text-xs sm:text-sm font-semibold"
                    >
                      <ShoppingBag size={17} strokeWidth={1.5} />
                      <span>
                        {lang === 'ar'
                          ? 'شراء وطلب المنتج الآن'
                          : 'Purchase & Order Now'}
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
  );
};
