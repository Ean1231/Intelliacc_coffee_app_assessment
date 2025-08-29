/**
 * Coffee-related models and interfaces
 */

export interface CoffeeFlavour {
  id: string;
  name: string;
  description: string;
  intensity: number; // 1-5 scale
  price: number;
  image?: string;
  category: CoffeeCategory;
  origin?: string;
  roastLevel: RoastLevel;
  available: boolean;
}

export type CoffeeCategory = 'espresso' | 'americano' | 'latte' | 'cappuccino' | 'mocha' | 'specialty';

export type RoastLevel = 'light' | 'medium' | 'dark' | 'extra-dark';

export interface CoffeeOrder {
  flavour: CoffeeFlavour;
  size: CoffeeSize;
  quantity: number;
  customizations?: string[];
}

export type CoffeeSize = 'small' | 'medium' | 'large';

export const COFFEE_SIZES: Record<CoffeeSize, { name: string; multiplier: number }> = {
  small: { name: 'Small (8oz)', multiplier: 1 },
  medium: { name: 'Medium (12oz)', multiplier: 1.3 },
  large: { name: 'Large (16oz)', multiplier: 1.6 }
};

/**
 * Local DB entity for flavours used in CoffeeStock database
 */
export interface FlavourRecord {
  id: string; // GUID/UUID string
  barcode: string;
  name: string;
  pricePerBox: number;
  pricePerPod: number;
  podsPerBox: number;
  photoName?: string;
  // Data URL or file URI for preview/storage in local DB
  photoData?: string;
}