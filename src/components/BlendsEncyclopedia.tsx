import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FlaskConical, Search, ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { CoffeeBlend, Language } from '../types/coffee';

interface BlendsEncyclopediaProps {
  blends: CoffeeBlend[];
  lang: Language;
  initialSearch?: string;
  onLoadInCalculator: (blend: CoffeeBlend) => void;
}

export const BlendsEncyclopedia: React.FC<BlendsEncyclopediaProps> = ({
  blends,
  lang,
  initialSearch = '',
  onLoadInCalculator,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'turkish' | 'espresso' | 'both' | 'french_flavored'
  >('all');
  const [visibleCount, setVisibleCount] = useState(18);

  const filteredBlends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blends.filter((bl) => {
      if (categoryFilter !== 'all' && bl.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        bl.name_ar.toLowerCase().includes(q) ||
        bl.name_en.toLowerCase().includes(q) ||
        bl.flavor_profile_ar.toLowerCase().includes(q) ||
        bl.code.toLowerCase().includes(q)
      );
    });
  }, [blends, searchQuery, categoryFilter]);

  const displayedBlends = filteredBlends.slice(0, visibleCount);
  const ArrowIcon = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

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
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <FlaskConical
                size={18}
                strokeWidth={1.6}
                className="text-purple-600"
              />
              <span>
                {lang === 'ar'
                  ? 'معادلات التحميص والخلط المعتمدة (100%)'
                  : 'Verified 100% Commercial Roasting Formulas'}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)]">
              {lang === 'ar' ? 'قسم التوليفات' : 'Coffee Blends'}
            </h2>
          </div>

          <div className="text-xs text-[var(--muted)]">
            {lang === 'ar' ? (
              <>
                عرض{' '}
                <span className="font-medium text-[var(--text)]">
                  {displayedBlends.length}
                </span>{' '}
                من إجمالي{' '}
                <span className="font-medium text-[#950101]">
                  {filteredBlends.length}
                </span>{' '}
                توليفة
              </>
            ) : (
              <>
                Showing{' '}
                <span className="font-medium text-[var(--text)]">
                  {displayedBlends.length}
                </span>{' '}
                of{' '}
                <span className="font-medium text-[#950101]">
                  {filteredBlends.length}
                </span>{' '}
                blends
              </>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="surface-card p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', ar: 'جميع التوليفات', en: 'All Blends' },
                { id: 'turkish', ar: 'قهوة تركي', en: 'Turkish' },
                { id: 'espresso', ar: 'إسبريسو', en: 'Espresso' },
                { id: 'both', ar: 'تركي وإسبريسو', en: 'Dual Use' },
                {
                  id: 'french_flavored',
                  ar: 'فرنساوي ومنكهات',
                  en: 'French & Flavored',
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`text-xs shrink-0 ${
                  categoryFilter === tab.id ? 'chip-pill-active' : 'chip-pill'
                }`}
              >
                {lang === 'ar' ? tab.ar : tab.en}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80 flex items-center">
            <Search
              size={18}
              strokeWidth={1.6}
              className="text-amber-600 absolute start-3.5 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar' ? 'ابحث في التوليفات...' : 'Search blends...'
              }
              className="input-field ps-10 pe-4 py-2.5 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Blends Grid */}
        {displayedBlends.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-3">
            <FlaskConical
              size={22}
              strokeWidth={1.6}
              className="text-purple-600 mx-auto"
            />
            <div className="font-display text-lg font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'لا توجد توليفات مطابقة للبحث الحالي'
                : 'No matching coffee blends found'}
            </div>
            <p className="text-xs text-[var(--muted)]">
              {lang === 'ar'
                ? 'يمكنك تجربة تصميم وتحليل توليفتك الخاصة مباشرة في حاسبة التوليفات الذكية.'
                : 'You can design and analyze your custom blend directly in the Smart Blend Calculator.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedBlends.map((blend) => {
              const totalPct =
                blend.ingredients.reduce(
                  (sum, ing) => sum + (Number(ing.percentage) || 0),
                  0
                ) || 100;

              return (
                <div
                  key={blend.id}
                  className="surface-card p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#950101]">
                          #{blend.blend_number || blend.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[var(--text)]">
                          {lang === 'ar' ? blend.category_ar : blend.category_en}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {totalPct}%
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-[var(--text)]">
                      {lang === 'ar' ? blend.name_ar : blend.name_en}
                    </h3>

                    <p className="text-xs sm:text-sm text-[var(--muted)]">
                      {lang === 'ar'
                        ? blend.characteristics_ar || blend.flavor_profile_ar
                        : blend.flavor_profile_en || blend.characteristics_ar}
                    </p>

                    {/* Exact Ingredients List */}
                    <div className="bg-[var(--bg-soft)] rounded-[12px] p-4 border border-[var(--line)] space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-[var(--accent)]">
                        <span>
                          {lang === 'ar'
                            ? 'مكونات التوليفة:'
                            : 'Blend Components:'}
                        </span>
                        <span className="text-emerald-700 font-semibold">
                          {lang === 'ar' ? 'الإجمالي: 100%' : 'Total: 100%'}
                        </span>
                      </div>
                      <div className="divide-y divide-[var(--line)]">
                        {blend.ingredients.map((ing, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1.5 text-xs"
                          >
                            <span className="text-[var(--text)] font-medium">
                              {lang === 'ar' ? ing.bean_name_ar : ing.bean_name_en}
                            </span>
                            <span className="font-bold text-[#950101]">
                              {ing.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Roast Notes */}
                    {(blend.roast_notes_ar || blend.roaster_secret_ar) && (
                      <div className="text-xs text-[var(--muted)] pt-1">
                        <span className="font-medium text-[#950101]">
                          {lang === 'ar' ? 'ملاحظات التحميص: ' : 'Roast Notes: '}
                        </span>
                        {lang === 'ar'
                          ? blend.roast_notes_ar || blend.roaster_secret_ar
                          : blend.roaster_secret_en || blend.roast_notes_ar}
                      </div>
                    )}
                  </div>

                  {/* Load into AI Calculator Button */}
                  <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onLoadInCalculator(blend)}
                      className="btn-primary text-xs px-5 py-2.5"
                    >
                      <FlaskConical
                        size={18}
                        strokeWidth={1.6}
                        className="text-amber-400"
                      />
                      <span>
                        {lang === 'ar'
                          ? 'جرب وحلّل في حاسبة التوليفات'
                          : 'Load & Analyze in AI Calculator'}
                      </span>
                      <ArrowIcon
                        size={18}
                        strokeWidth={1.6}
                        className="text-emerald-400"
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Blends */}
        {visibleCount < filteredBlends.length && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 20)}
              className="btn-secondary px-7 py-3 text-xs sm:text-sm"
            >
              {lang === 'ar' ? (
                <>
                  عرض باقي التوليفات (
                  <span className="font-medium text-[var(--accent)]">
                    {filteredBlends.length - visibleCount}
                  </span>{' '}
                  متبقية)
                </>
              ) : (
                <>
                  Show Remaining Blends (
                  <span className="font-medium text-[var(--accent)]">
                    {filteredBlends.length - visibleCount}
                  </span>{' '}
                  more)
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
};
