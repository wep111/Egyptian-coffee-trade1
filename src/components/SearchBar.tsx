import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Coffee,
  BookOpen,
  Newspaper,
  ArrowUpLeft,
} from 'lucide-react';
import {
  CatalogItem,
  CoffeeBean,
  CoffeeBlend,
  Article,
  Language,
  NavTab,
} from '../types/coffee';

interface SearchBarProps {
  lang: Language;
  catalogItems: CatalogItem[];
  beans: CoffeeBean[];
  blends?: CoffeeBlend[];
  articles: Article[];
  onNavigate: (tab: NavTab, searchQuery?: string) => void;
  onSelectOrderItem: (item: CatalogItem) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  lang,
  catalogItems,
  beans,
  articles,
  onNavigate,
  onSelectOrderItem,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalized = query.trim().toLowerCase();

  const matchedCatalog = normalized
    ? catalogItems
        .filter(
          (i) =>
            i.title_ar.toLowerCase().includes(normalized) ||
            (i.title_en || '').toLowerCase().includes(normalized) ||
            (i.description_ar || '').toLowerCase().includes(normalized)
        )
        .slice(0, 3)
    : [];

  const matchedBeans = normalized
    ? beans
        .filter(
          (b) =>
            b.name_ar.toLowerCase().includes(normalized) ||
            (b.name_en || '').toLowerCase().includes(normalized) ||
            b.country_ar.toLowerCase().includes(normalized) ||
            (b.country_en || '').toLowerCase().includes(normalized) ||
            (b.code || '').toLowerCase().includes(normalized)
        )
        .slice(0, 4)
    : [];

  const matchedArticles = normalized
    ? articles
        .filter(
          (a) =>
            a.title_ar.toLowerCase().includes(normalized) ||
            (a.title_en || '').toLowerCase().includes(normalized) ||
            (a.category_name || a.category_name_ar || '')
              .toLowerCase()
              .includes(normalized)
        )
        .slice(0, 3)
    : [];

  const totalResults =
    matchedCatalog.length + matchedBeans.length + matchedArticles.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalized) {
      onNavigate('beans');
      return;
    }
    setIsFocused(false);
    if (matchedBeans.length > 0) {
      onNavigate('beans', query.trim());
    } else if (matchedArticles.length > 0) {
      onNavigate('articles', query.trim());
    } else if (matchedCatalog.length > 0) {
      onNavigate('library', query.trim());
    } else {
      onNavigate('beans', query.trim());
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[760px] mx-auto">
      <form
        data-capture
        onSubmit={handleSubmit}
        className="flex w-full items-center rounded-[12px] bg-white border border-[var(--line)] p-1.5 sm:p-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] transition-all focus-within:border-[var(--accent)] focus-within:shadow-[0_12px_34px_-8px_rgba(149,1,1,0.14)]"
      >
        <Search
          size={18}
          strokeWidth={1.7}
          className="text-[var(--accent)] ms-2.5 sm:ms-3 shrink-0 pointer-events-none"
        />
        <input
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            lang === 'ar'
              ? 'ابحث في موسوعة القهوة، الكتب السبعة، أو المقالات...'
              : 'Search coffee encyclopedia, the 7 Books, or articles...'
          }
          aria-label={lang === 'ar' ? 'بحث' : 'Search'}
          className="min-w-0 flex-1 bg-transparent px-2.5 sm:px-3.5 py-1.5 text-[13px] sm:text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1.5 rounded-[6px] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer shrink-0"
            aria-label={lang === 'ar' ? 'مسح البحث' : 'Clear search'}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
        <button
          type="submit"
          className="shrink-0 bg-[var(--accent)] hover:bg-[#7a0101] text-white font-semibold rounded-[9px] px-4 sm:px-5 py-2 text-[12.5px] sm:text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Search size={15} strokeWidth={1.75} className="!text-white" />
          <span>{lang === 'ar' ? 'بحث' : 'Search'}</span>
        </button>
      </form>

      {/* Instant Dropdown Results */}
      {isFocused && normalized.length > 0 && (
        <div className="absolute top-full mt-2 inset-x-0 bg-white/98 backdrop-blur-xl rounded-[12px] border border-[var(--line)] shadow-[0_16px_40px_rgba(0,0,0,0.16)] z-50 max-h-[380px] overflow-y-auto p-4 divide-y divide-[var(--line)] text-start">
          {totalResults === 0 ? (
            <div className="py-6 text-center text-sm text-[color:var(--color-muted)]">
              {lang === 'ar'
                ? `لا توجد نتائج مطابقة لـ "${query}"`
                : `No matching results for "${query}"`}
            </div>
          ) : (
            <>
              {matchedCatalog.length > 0 && (
                <div className="pb-3">
                  <div className="text-xs font-medium text-[color:var(--color-ink-strong)] mb-2 flex items-center gap-2">
                    <BookOpen size={16} strokeWidth={1.5} />
                    <span>
                      {lang === 'ar'
                        ? 'الكتب السبعة والدورات'
                        : 'Digital Library & Courses'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {matchedCatalog.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setIsFocused(false);
                          onSelectOrderItem(item);
                        }}
                        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-[6px] hover:bg-white/45 text-start transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-medium text-[color:var(--color-ink-strong)]">
                            {lang === 'ar' ? item.title_ar : item.title_en}
                          </div>
                          <div className="text-xs text-[color:var(--color-muted)]">
                            {lang === 'ar' ? item.subtitle_ar : item.subtitle_en}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-[color:var(--color-ink-strong)] shrink-0">
                          {item.price_egp} {lang === 'ar' ? 'ج.م' : 'EGP'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedBeans.length > 0 && (
                <div className="py-3">
                  <div className="text-xs font-medium text-[color:var(--color-ink-strong)] mb-2 flex items-center gap-2">
                    <Coffee size={16} strokeWidth={1.5} />
                    <span>
                      {lang === 'ar'
                        ? 'موسوعة البن العالمي'
                        : 'Coffee Beans Encyclopedia'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {matchedBeans.map((bean) => (
                      <button
                        key={bean.id}
                        type="button"
                        onClick={() => {
                          setIsFocused(false);
                          onNavigate('beans', query);
                        }}
                        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-[6px] hover:bg-white/45 text-start transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-medium text-[color:var(--color-ink-strong)]">
                            {lang === 'ar' ? bean.name_ar : bean.name_en}
                          </div>
                          <div className="text-xs text-[color:var(--color-muted)]">
                            {lang === 'ar' ? bean.country_ar : bean.country_en} ·{' '}
                            {bean.species}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--color-ink-strong)] shrink-0">
                          <span>{bean.avg_green_price_egp}</span>
                          <ArrowUpLeft size={16} strokeWidth={1.5} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedArticles.length > 0 && (
                <div className="pt-3">
                  <div className="text-xs font-medium text-[color:var(--color-ink-strong)] mb-2 flex items-center gap-2">
                    <Newspaper size={16} strokeWidth={1.5} />
                    <span>
                      {lang === 'ar' ? 'المقالات والدراسات' : 'Articles & Guides'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {matchedArticles.map((art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => {
                          setIsFocused(false);
                          onNavigate('articles', query);
                        }}
                        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-[6px] hover:bg-white/45 text-start transition-colors cursor-pointer"
                      >
                        <div className="text-sm font-medium text-[color:var(--color-ink-strong)]">
                          {lang === 'ar' ? art.title_ar : art.title_en}
                        </div>
                        <span className="text-xs text-[color:var(--color-muted)] shrink-0">
                          {art.read_time_min}m
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
