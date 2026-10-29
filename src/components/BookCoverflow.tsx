import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  FileText,
  Tag,
} from 'lucide-react';
import { CatalogItem, Language } from '../types/coffee';

interface BookCoverflowProps {
  books: CatalogItem[];
  bundleItem?: CatalogItem;
  lang: Language;
  onBuyItem: (item: CatalogItem) => void;
  onOpenStore?: () => void;
}

export interface CoverflowCarouselProps {
  items: CatalogItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  rotate?: number;
  depth?: number;
  perspective?: number;
  falloff?: number;
  fade?: number;
  loop?: boolean;
  showNavigation?: boolean;
  showPagination?: boolean;
  lang: Language;
}

export const CoverflowCarousel: React.FC<CoverflowCarouselProps> = ({
  items,
  selectedIndex,
  onSelect,
  rotate = 44,
  depth = 0.6,
  perspective = 3,
  falloff = 0.56,
  fade = 0.1,
  loop = true,
  showNavigation = true,
  showPagination = true,
  lang,
}) => {
  const total = items.length;

  const handlePrev = () => {
    if (total === 0) return;
    if (loop) {
      onSelect((selectedIndex - 1 + total) % total);
    } else {
      onSelect(Math.max(0, selectedIndex - 1));
    }
  };

  const handleNext = () => {
    if (total === 0) return;
    if (loop) {
      onSelect((selectedIndex + 1) % total);
    } else {
      onSelect(Math.min(total - 1, selectedIndex + 1));
    }
  };

  const getCircularOffset = (index: number) => {
    let diff = index - selectedIndex;
    if (loop && total > 2) {
      const half = Math.floor(total / 2);
      if (diff > half) diff -= total;
      if (diff < -half) diff += total;
    }
    return diff;
  };

  return (
    <div className="w-full">
      {/* 3D Coverflow Stage */}
      <div
        className="relative h-[380px] sm:h-[420px] flex items-center justify-center overflow-hidden select-none my-4"
        style={{ perspective: `${perspective * 400}px` }}
      >
        {items.map((book, idx) => {
          const offset = getCircularOffset(idx);
          const absOffset = Math.abs(offset);
          const isSelected = offset === 0;

          if (absOffset > 3) return null;

          const directionMultiplier = lang === 'ar' ? -1 : 1;
          const stepSpacing = 135 * falloff * 1.65;
          const translateX = offset * stepSpacing * directionMultiplier;
          const translateZ = -absOffset * (depth * 210);
          const rotateY =
            offset === 0
              ? 0
              : (offset > 0 ? -1 : 1) *
                Math.min(rotate, rotate * (0.68 + absOffset * 0.16)) *
                directionMultiplier;
          const scale = isSelected
            ? 1
            : Math.max(0.72, 1 - absOffset * (0.14 * falloff));
          const opacity = isSelected
            ? 1
            : Math.max(fade, 1 - absOffset * (0.26 + fade));
          const zIndex = 30 - absOffset;

          return (
            <motion.div
              key={book.id}
              onClick={() => onSelect(idx)}
              animate={{
                x: translateX,
                z: translateZ,
                rotateY,
                scale,
                opacity,
              }}
              transition={{
                duration: 0.6,
              }}
              style={{
                zIndex,
                transformStyle: 'preserve-3d',
              }}
              className={`absolute w-[220px] sm:w-[252px] aspect-[3/4] rounded-[12px] cursor-pointer bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_16px_36px_rgba(0,0,0,0.12)] overflow-hidden border transition-colors ${
                isSelected
                  ? 'border-[color:var(--color-ink-strong)]'
                  : 'border-[color:var(--color-line)] hover:border-[color:var(--color-ink-strong)]'
              }`}
            >
              {book.cover_image ? (
                <img
                  src={book.cover_image}
                  alt={lang === 'ar' ? book.title_ar : book.title_en}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain bg-white p-1.5"
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-5 bg-white bg-coffee-sketch text-[var(--text)] relative">
                  {/* Top Header of Book Cover */}
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src="/assets/aistudio/_______20013552.png"
                        alt="Egyptian Coffee Trade"
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-[11px] font-medium text-[var(--muted)]">
                        {lang === 'ar' ? 'الكتب السبعة' : '7 Volumes'}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-[var(--accent)]">
                      {book.type === 'bundle'
                        ? lang === 'ar'
                          ? 'الباقة'
                          : 'Bundle'
                        : `0${book.volume_number || idx + 1}`}
                    </span>
                  </div>

                  {/* Center Cover Title */}
                  <div className="my-auto py-3">
                    <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--text)] mb-2 line-clamp-3">
                      {lang === 'ar' ? book.title_ar : book.title_en}
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2">
                      {lang === 'ar' ? book.subtitle_ar : book.subtitle_en}
                    </p>
                  </div>

                  {/* Bottom Footer of Book Cover */}
                  <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>
                      {lang === 'ar'
                        ? 'تجـــارة القهـــوة المصـــرية'
                        : 'Egyptian Coffee Trade'}
                    </span>
                    <span className="font-medium text-[var(--accent)]">
                      {book.price_egp && book.price_egp > 0
                        ? `${book.price_egp} EGP`
                        : `0${book.volume_number || idx + 1}`}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Side Navigation Buttons */}
        {showNavigation && total > 1 && (
          <>
            <button
              type="button"
              onClick={lang === 'ar' ? handleNext : handlePrev}
              className="absolute start-2 sm:start-4 z-40 w-10 h-10 rounded-full border border-black/15 bg-white/90 hover:bg-white hover:border-black text-[#111111] flex items-center justify-center transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              aria-label={lang === 'ar' ? 'الكتاب التالي' : 'Previous book'}
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={lang === 'ar' ? handlePrev : handleNext}
              className="absolute end-2 sm:end-4 z-40 w-10 h-10 rounded-full border border-black/15 bg-white/90 hover:bg-white hover:border-black text-[#111111] flex items-center justify-center transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              aria-label={lang === 'ar' ? 'الكتاب السابق' : 'Next book'}
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {showPagination && total > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 mb-8">
          {items.map((item, idx) => {
            const active = idx === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(idx)}
                className={`text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'chip-pill-active' : 'chip-pill'
                }`}
              >
                {item.type === 'bundle'
                  ? lang === 'ar'
                    ? 'الباقة الكاملة'
                    : 'Full Bundle'
                  : lang === 'ar'
                  ? `الكتاب ${item.volume_number || idx + 1}`
                  : `Book ${item.volume_number || idx + 1}`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const BookCoverflow: React.FC<BookCoverflowProps> = ({
  books,
  bundleItem,
  lang,
  onBuyItem,
  onOpenStore,
}) => {
  const allDisplayItems = bundleItem ? [...books, bundleItem] : books;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeIndex =
    selectedIndex < allDisplayItems.length ? selectedIndex : 0;
  const activeItem = allDisplayItems[safeIndex];

  return (
    <section
      id="books"
      className="py-12 md:py-20 bg-[var(--bg-soft)] border-t border-[var(--line)] overflow-x-hidden w-full max-w-[100vw]"
    >
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
              <BookOpen size={18} strokeWidth={1.5} />
              <span>
                {lang === 'ar'
                  ? 'المكتبة الرقمية المتخصصة · الكتب السبعة'
                  : 'Digital Specialized Library · The 7 Books'}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)]">
              {lang === 'ar'
                ? 'المكتبة الرقمية للكتب والباقة الشاملة'
                : 'Digital Library of Reference Books & Full Bundle'}
            </h2>
          </div>

          <a
            href="#store"
            onClick={(e) => {
              if (onOpenStore) {
                e.preventDefault();
                onOpenStore();
              }
            }}
            className="shop-btn !bg-[#e6b08a] self-start md:self-auto"
          >
            <div className="svg-wrapper-1">
              <div className="svg-wrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M19 1a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H6.5A3.5 3.5 0 0 1 3 19.5v-15A3.5 3.5 0 0 1 6.5 1zM6.5 18c-.78 0-1.5.645-1.5 1.5c0 1 .837 1.5 1.5 1.5l12.5.002v-3zM9 9a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <span>{lang === 'ar' ? 'متجرنا' : 'Our Store'}</span>
          </a>
        </div>

        {allDisplayItems.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-3">
            <BookOpen
              size={20}
              strokeWidth={1.5}
              className="text-[var(--accent)] mx-auto"
            />
            <p className="font-display text-lg font-semibold text-[var(--text)]">
              {lang === 'ar' ? 'الكتب قريباً' : 'Books coming soon'}
            </p>
          </div>
        ) : (
          <>
            <CoverflowCarousel
              items={allDisplayItems}
              selectedIndex={safeIndex}
              onSelect={setSelectedIndex}
              rotate={44}
              depth={0.6}
              perspective={3}
              falloff={0.56}
              fade={0.1}
              loop={true}
              showNavigation={true}
              showPagination={true}
              lang={lang}
            />

            {activeItem && (
              <div className="surface-card p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                      <BookOpen size={18} strokeWidth={1.5} />
                      <span>
                        {activeItem.type === 'bundle'
                          ? lang === 'ar'
                            ? 'الموسوعة الشاملة — 7 مجلدات'
                            : 'Complete 7-Volume Bundle'
                          : lang === 'ar'
                          ? `الكتاب ${activeItem.volume_number || safeIndex + 1}`
                          : `Volume ${activeItem.volume_number || safeIndex + 1}`}
                      </span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-semibold text-[var(--text)]">
                      {lang === 'ar' ? activeItem.title_ar : activeItem.title_en}
                    </h3>

                    <p className="text-sm sm:text-base text-[var(--muted)]">
                      {lang === 'ar'
                        ? activeItem.description_ar
                        : activeItem.description_en}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm border-t border-[var(--line)]">
                      <div className="inline-flex items-center gap-2">
                        <FileText
                          size={18}
                          strokeWidth={1.5}
                          className="text-[var(--muted)]"
                        />
                        <span className="text-[var(--muted)]">
                          {lang === 'ar' ? 'عدد الصفحات:' : 'Pages:'}
                        </span>
                        <span className="font-medium text-[var(--text)]">
                          {activeItem.pages && activeItem.pages > 0
                            ? `${activeItem.pages} ${lang === 'ar' ? 'صفحة' : 'pages'}`
                            : lang === 'ar'
                            ? 'قريباً'
                            : 'Coming Soon'}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-2">
                        <Tag
                          size={18}
                          strokeWidth={1.5}
                          className="text-[var(--accent)]"
                        />
                        <span className="text-[var(--muted)]">
                          {lang === 'ar' ? 'السعر:' : 'Price:'}
                        </span>
                        <span className="font-medium text-[var(--accent)]">
                          {activeItem.price_egp && activeItem.price_egp > 0
                            ? `${activeItem.price_egp.toLocaleString()} ${
                                lang === 'ar' ? 'ج.م' : 'EGP'
                              }`
                            : lang === 'ar'
                            ? 'قريباً'
                            : 'Coming Soon'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeItem.price_egp > 0 && (
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => onBuyItem(activeItem)}
                        className="uiverse-btn !bg-[#56d459] py-2.5 px-6 text-sm font-semibold"
                      >
                        <ShoppingBag size={18} strokeWidth={1.5} />
                        <span>
                          {lang === 'ar'
                            ? 'شراء وطلب الكتاب'
                            : 'Purchase Volume'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </section>
  );
};
