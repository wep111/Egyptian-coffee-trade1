import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Coffee, Search, ArrowUpLeft, ArrowUpRight, X } from 'lucide-react';
import { CoffeeBean, Language } from '../types/coffee';

interface BeansEncyclopediaProps {
  beans: CoffeeBean[];
  lang: Language;
  initialSearch?: string;
}

export const BeansEncyclopedia: React.FC<BeansEncyclopediaProps> = ({
  beans,
  lang,
  initialSearch = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [speciesFilter, setSpeciesFilter] = useState<
    'all' | 'arabica' | 'robusta' | 'hybrid'
  >('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [useFilter, setUseFilter] = useState<'all' | 'turkish' | 'espresso'>(
    'all'
  );
  const [visibleCount, setVisibleCount] = useState(24);
  const [selectedBean, setSelectedBean] = useState<CoffeeBean | null>(null);

  const countries = useMemo(() => {
    const map = new Map<string, { ar: string; en: string }>();
    beans.forEach((b) => {
      const key = b.country_en || b.country_ar;
      if (key && !map.has(key)) {
        map.set(key, { ar: b.country_ar, en: b.country_en || b.country_ar });
      }
    });
    return Array.from(map.values());
  }, [beans]);

  const filteredBeans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return beans.filter((b) => {
      const spLower = String(b.species).toLowerCase();
      if (speciesFilter !== 'all' && spLower !== speciesFilter) return false;
      const cKey = b.country_en || b.country_ar;
      if (countryFilter !== 'all' && cKey !== countryFilter) return false;
      if (useFilter !== 'all' && !b.suitable_for.includes(useFilter))
        return false;
      if (!q) return true;
      return (
        b.name_ar.toLowerCase().includes(q) ||
        (b.name_en || '').toLowerCase().includes(q) ||
        b.country_ar.toLowerCase().includes(q) ||
        (b.country_en || '').toLowerCase().includes(q) ||
        (b.sensory_profile_ar || '').toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q)
      );
    });
  }, [beans, searchQuery, speciesFilter, countryFilter, useFilter]);

  const displayedBeans = filteredBeans.slice(0, visibleCount);
  const ArrowIcon = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  return (
    <section id="bean-encyclopedia" className="py-12 md:py-20 bg-[var(--bg)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-6 space-y-8"
      >
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
              <Coffee size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar'
                  ? 'قاعدة البيانات المرجعية · 200 صنف عالمي'
                  : 'Reference Database · 200 Global Varieties'}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'موسوعة الـ 200 نوع بن عالمي ومتداول في مصر'
                : 'Encyclopedia of 200 Global & Egyptian-Traded Coffee Beans'}
            </h2>
          </div>

          <div className="text-xs text-[var(--muted)]">
            {lang === 'ar' ? (
              <>
                عرض{' '}
                <span className="font-medium text-[var(--text)]">
                  {displayedBeans.length}
                </span>{' '}
                من إجمالي{' '}
                <span className="font-medium text-[var(--accent)]">
                  {filteredBeans.length}
                </span>{' '}
                صنف
              </>
            ) : (
              <>
                Showing{' '}
                <span className="font-medium text-[var(--text)]">
                  {displayedBeans.length}
                </span>{' '}
                of{' '}
                <span className="font-medium text-[var(--accent)]">
                  {filteredBeans.length}
                </span>{' '}
                varieties
              </>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="surface-card p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative flex items-center">
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
                    ? 'ابحث باسم البن، المنشأ، المعالجة، أو الإيحاءات...'
                    : 'Search by bean name, origin, processing, or code...'
                }
                className="input-field ps-10 pe-4 py-2.5 text-xs sm:text-sm"
              />
            </div>

            {/* Species Filter (arabica / robusta / hybrid) */}
            <div className="lg:col-span-3 flex flex-wrap items-center gap-1.5">
              {(['all', 'arabica', 'robusta', 'hybrid'] as const).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpeciesFilter(sp)}
                  className={`text-xs flex-1 text-center justify-center ${
                    speciesFilter === sp ? 'chip-pill-active' : 'chip-pill'
                  }`}
                >
                  {sp === 'all'
                    ? lang === 'ar'
                      ? 'الكل'
                      : 'All'
                    : sp === 'arabica'
                    ? lang === 'ar'
                      ? 'أرابيكا'
                      : 'Arabica'
                    : sp === 'robusta'
                    ? lang === 'ar'
                      ? 'روبوستا'
                      : 'Robusta'
                    : lang === 'ar'
                    ? 'هجين'
                    : 'Hybrid'}
                </button>
              ))}
            </div>

            {/* Country Dropdown */}
            <div className="lg:col-span-2">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                aria-label={lang === 'ar' ? 'اختر دولة المنشأ' : 'Select Country'}
                className="input-field px-3.5 py-2.5 text-xs font-medium bg-[var(--surface)] text-[var(--text)]"
              >
                <option value="all" className="bg-[var(--surface)] text-[var(--text)]">
                  {lang === 'ar' ? 'جميع المناشئ' : 'All Origins'}
                </option>
                {countries.map((c) => (
                  <option
                    key={c.en}
                    value={c.en}
                    className="bg-[var(--surface)] text-[var(--text)]"
                  >
                    {lang === 'ar' ? c.ar : c.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Extraction Filter */}
            <div className="lg:col-span-2">
              <select
                value={useFilter}
                onChange={(e) =>
                  setUseFilter(e.target.value as 'all' | 'turkish' | 'espresso')
                }
                aria-label={lang === 'ar' ? 'الاستخدام' : 'Suitability'}
                className="input-field px-3.5 py-2.5 text-xs font-medium bg-[var(--surface)] text-[var(--text)]"
              >
                <option value="all" className="bg-[var(--surface)] text-[var(--text)]">
                  {lang === 'ar' ? 'كل الاستخدامات' : 'All Uses'}
                </option>
                <option value="turkish" className="bg-[var(--surface)] text-[var(--text)]">
                  {lang === 'ar' ? 'مناسب للتركي' : 'For Turkish'}
                </option>
                <option value="espresso" className="bg-[var(--surface)] text-[var(--text)]">
                  {lang === 'ar' ? 'مناسب للإسبريسو' : 'For Espresso'}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Beans Grid */}
        {displayedBeans.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-3">
            <Coffee
              size={20}
              strokeWidth={1.5}
              className="text-[var(--accent)] mx-auto"
            />
            <div className="font-display text-lg font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'لا توجد أصناف بن مطابقة لمعايير البحث الحالية'
                : 'No matching coffee bean varieties found'}
            </div>
            <p className="text-xs text-[var(--muted)]">
              {lang === 'ar'
                ? 'جرب تغيير الفلاتر أو البحث بكلمة أخرى لاستعراض أصناف الموسوعة.'
                : 'Try adjusting your filters or search query to explore the encyclopedia.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedBeans.map((bean) => (
              <div
                key={bean.id}
                onClick={() => setSelectedBean(bean)}
                className="surface-card p-6 cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {bean.image_url && (
                    <img
                      src={bean.image_url}
                      alt={bean.name_ar}
                      referrerPolicy="no-referrer"
                      className="w-full h-40 object-cover rounded-[12px] mb-4 border border-[var(--line)]"
                    />
                  )}
                  <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--accent)]">
                        {bean.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[var(--text)]">
                        {lang === 'ar'
                          ? bean.country_ar
                          : bean.country_en || bean.country_ar}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {lang === 'ar' ? bean.species_ar : String(bean.species)}
                      </span>
                    </div>
                    {bean.screen_size && (
                      <span className="text-[11px] text-[var(--muted)]">
                        Scr {bean.screen_size}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-semibold text-[var(--text)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                    {lang === 'ar' ? bean.name_ar : bean.name_en || bean.name_ar}
                  </h3>

                  <p className="text-xs text-[var(--muted)] line-clamp-2 mb-4">
                    {lang === 'ar'
                      ? bean.commercial_traits_ar ||
                        bean.sensory_profile_ar ||
                        bean.commercial_notes_ar
                      : bean.commercial_notes_en ||
                        bean.commercial_traits_ar ||
                        bean.sensory_profile_ar}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--line)] text-[11px]">
                    <div>
                      <span className="text-[var(--muted)] block mb-0.5">
                        {lang === 'ar' ? 'الإيحاءات' : 'Profile'}
                      </span>
                      <span className="font-medium text-[var(--text)] truncate block">
                        {bean.sensory_profile_ar || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block mb-0.5">
                        {lang === 'ar' ? 'التحميص' : 'Roast'}
                      </span>
                      <span className="font-medium text-[var(--accent)] truncate block">
                        {bean.recommended_roast_ar || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] block mb-0.5">
                        {lang === 'ar' ? 'المعالجة' : 'Process'}
                      </span>
                      <span className="font-medium text-[var(--text)] truncate block">
                        {lang === 'ar'
                          ? bean.processing_ar || bean.process_ar
                          : bean.processing_en || bean.process_en}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
                  <Coffee
                    size={18}
                    strokeWidth={1.5}
                    className="text-[var(--muted)]"
                  />
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)]">
                    <span>{lang === 'ar' ? 'بطاقة الصنف' : 'Specs'}</span>
                    <ArrowIcon size={18} strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {visibleCount < filteredBeans.length && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 36)}
              className="btn-secondary px-7 py-3 text-xs sm:text-sm"
            >
              {lang === 'ar' ? (
                <>
                  عرض المزيد من أصناف البن (
                  <span className="font-medium text-[var(--accent)]">
                    {filteredBeans.length - visibleCount}
                  </span>{' '}
                  متبقي)
                </>
              ) : (
                <>
                  Load More Coffee Beans (
                  <span className="font-medium text-[var(--accent)]">
                    {filteredBeans.length - visibleCount}
                  </span>{' '}
                  remaining)
                </>
              )}
            </button>
          </div>
        )}

        {/* Bean Technical Datasheet Modal */}
        {selectedBean && (
          <div className="fixed inset-0 z-50 bg-[#faf6f4]/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="surface-card max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                    <Coffee size={18} strokeWidth={1.5} />
                    <span>
                      {selectedBean.code} ·{' '}
                      {lang === 'ar'
                        ? selectedBean.country_ar
                        : selectedBean.country_en || selectedBean.country_ar}{' '}
                      ({lang === 'ar' ? selectedBean.region_ar : selectedBean.region_en})
                    </span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text)]">
                    {lang === 'ar'
                      ? selectedBean.name_ar
                      : selectedBean.name_en || selectedBean.name_ar}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBean(null)}
                  className="modal-close-btn"
                  aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
                >
                  <X size={17} strokeWidth={2.5} />
                  <span>{lang === 'ar' ? 'إغلاق' : 'Close'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)]">
                  <span className="text-[var(--muted)] block mb-1">
                    {lang === 'ar' ? 'السلالة' : 'Species'}
                  </span>
                  <span className="font-medium text-[var(--text)]">
                    {lang === 'ar'
                      ? selectedBean.species_ar
                      : String(selectedBean.species)}
                  </span>
                </div>
                <div className="p-3.5 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)]">
                  <span className="text-[var(--muted)] block mb-1">
                    {lang === 'ar' ? 'المعالجة' : 'Processing'}
                  </span>
                  <span className="font-medium text-[var(--text)]">
                    {lang === 'ar'
                      ? selectedBean.processing_ar || selectedBean.process_ar
                      : selectedBean.processing_en || selectedBean.process_en}
                  </span>
                </div>
                <div className="p-3.5 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)]">
                  <span className="text-[var(--muted)] block mb-1">
                    {lang === 'ar' ? 'مقاس الغربال' : 'Screen Size'}
                  </span>
                  <span className="font-medium text-[var(--text)]">
                    Screen {selectedBean.screen_size}
                  </span>
                </div>
                <div className="p-3.5 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)]">
                  <span className="text-[var(--muted)] block mb-1">
                    {lang === 'ar' ? 'الرطوبة / الكافيين' : 'Moisture / Caffeine'}
                  </span>
                  <span className="font-medium text-[var(--text)]">
                    {selectedBean.moisture_percent} /{' '}
                    {selectedBean.caffeine_percent}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-medium text-[var(--accent)]">
                  {lang === 'ar'
                    ? 'الخصائص الحسية والإيحاءات:'
                    : 'Sensory & Flavor Profile:'}
                </div>
                <div className="text-[var(--text)] font-medium">
                  {selectedBean.sensory_profile_ar ||
                    (lang === 'ar'
                      ? selectedBean.flavor_notes_ar
                      : selectedBean.flavor_notes_en
                    ).join(' · ')}
                </div>
              </div>

              <div className="p-4 rounded-[12px] bg-[var(--bg-soft)] border border-[var(--line)] space-y-3 text-xs">
                <div>
                  <span className="font-medium text-[var(--accent)]">
                    {lang === 'ar'
                      ? 'درجات التحميص المناسبة: '
                      : 'Recommended Roast: '}
                  </span>
                  <span className="text-[var(--text)]">
                    {lang === 'ar'
                      ? selectedBean.recommended_roast_ar ||
                        selectedBean.roast_recommendation_ar
                      : selectedBean.roast_recommendation_en ||
                        selectedBean.recommended_roast_ar}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[var(--text)]">
                    {lang === 'ar'
                      ? 'الخصائص التجارية واستخداماته في السوق: '
                      : 'Commercial Market Traits: '}
                  </span>
                  <span className="text-[var(--muted)]">
                    {lang === 'ar'
                      ? selectedBean.commercial_traits_ar ||
                        selectedBean.commercial_notes_ar
                      : selectedBean.commercial_notes_en ||
                        selectedBean.commercial_traits_ar}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
};
