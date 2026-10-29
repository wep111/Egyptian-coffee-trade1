import React, { useState } from 'react';
import {
  Home,
  FlaskConical,
  BookOpen,
  Coffee,
  Layers,
  Store,
  Newspaper,
  GraduationCap,
  ShoppingBag,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Language, NavTab } from '../types/coffee';

interface DockNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  lang: Language;
  ordersCount?: number;
}

export const DockNav: React.FC<DockNavProps> = ({
  activeTab,
  onSelectTab,
  lang,
  ordersCount = 0,
}) => {
  const [hoveredTab, setHoveredTab] = useState<NavTab | null>(null);

  const navItems: {
    id: NavTab;
    label_ar: string;
    label_en: string;
    icon: React.FC<{ className?: string; size?: number; strokeWidth?: number }>;
    iconColor: string;
  }[] = [
    {
      id: 'home',
      label_ar: 'الرئيسية',
      label_en: 'Home',
      icon: Home,
      iconColor: 'text-[#950101]',
    },
    {
      id: 'store',
      label_ar: 'متجرنا',
      label_en: 'Store',
      icon: Store,
      iconColor: 'text-emerald-600',
    },
    {
      id: 'beans',
      label_ar: 'موسوعة البن',
      label_en: 'Beans',
      icon: Coffee,
      iconColor: 'text-amber-700',
    },
    {
      id: 'blends',
      label_ar: 'التوليفات',
      label_en: 'Blends',
      icon: Layers,
      iconColor: 'text-purple-600',
    },
    {
      id: 'library',
      label_ar: 'الكتب السبعة',
      label_en: '7 Books',
      icon: BookOpen,
      iconColor: 'text-blue-600',
    },
    {
      id: 'calculator',
      label_ar: 'حاسبة التوليفات',
      label_en: 'Calculator',
      icon: FlaskConical,
      iconColor: 'text-indigo-600',
    },
    {
      id: 'articles',
      label_ar: 'المقالات',
      label_en: 'Articles',
      icon: Newspaper,
      iconColor: 'text-teal-600',
    },
    {
      id: 'courses',
      label_ar: 'الدورات',
      label_en: 'Courses',
      icon: GraduationCap,
      iconColor: 'text-orange-600',
    },
    {
      id: 'orders',
      label_ar: 'طلباتي',
      label_en: 'My Orders',
      icon: ShoppingBag,
      iconColor: 'text-rose-600',
    },
    {
      id: 'about',
      label_ar: 'من نحن',
      label_en: 'About Us',
      icon: Info,
      iconColor: 'text-sky-600',
    },
    {
      id: 'privacy',
      label_ar: 'الخصوصية والشروط',
      label_en: 'Privacy',
      icon: ShieldCheck,
      iconColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[var(--line)] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <nav
        aria-label={
          lang === 'ar' ? 'شريط التنقل السفلي' : 'Bottom Navigation Bar'
        }
        className="max-w-[1200px] mx-auto flex items-center justify-start sm:justify-center gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar font-['Readex_Pro']"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredTab === item.id;
          const isExpanded = isActive || isHovered;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              onMouseEnter={() => setHoveredTab(item.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={`relative bg-transparent rounded-[8px] px-3.5 py-2 text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isActive
                  ? 'border border-black/35 font-semibold text-[#111111]'
                  : 'border border-transparent font-medium text-[#111111]/75 hover:text-[#111111] hover:border-black/15'
              }`}
            >
              <Icon
                size={16}
                strokeWidth={1.7}
                className={item.iconColor}
              />
              <span
                className={`${
                  isExpanded ? 'inline-block' : 'hidden xl:inline-block'
                } text-xs text-[#111111]`}
              >
                {lang === 'ar' ? item.label_ar : item.label_en}
              </span>

              {item.id === 'orders' && ordersCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-[5px] bg-transparent text-[#111111] border border-black/20 font-semibold">
                  {ordersCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
