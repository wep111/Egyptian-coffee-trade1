import {
  CoffeePrice,
  PriceHistory,
  CatalogItem,
  CoffeeBean,
  CoffeeBlend,
  ArticleCategory,
  Article,
} from '../types/coffee';

// تم مسح جميع البيانات التجريبية — يتم جلب كافة البيانات مباشرة من لوحة تحكم Base44 (https://egcoffee.base44.app/api)
export const FALLBACK_COFFEE_PRICES: CoffeePrice[] = [];
export const FALLBACK_PRICE_HISTORY: PriceHistory[] = [];
export const FALLBACK_CATALOG_ITEMS: CatalogItem[] = [];
export const FALLBACK_COFFEE_BEANS: CoffeeBean[] = [];
export const FALLBACK_COFFEE_BLENDS: CoffeeBlend[] = [];
export const FALLBACK_ARTICLE_CATEGORIES: ArticleCategory[] = [];
export const FALLBACK_ARTICLES: Article[] = [];
