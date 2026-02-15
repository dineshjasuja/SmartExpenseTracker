
import { Budget, Category } from './types';

export const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Grocery', limit: 10000 },
  { category: 'Household Help', limit: 5000 },
  { category: 'Medical', limit: 2000 },
  { category: 'Shopping', limit: 5000 },
  { category: 'Transport', limit: 3000 },
  { category: 'Education', limit: 5000 },
  { category: 'Entertainment', limit: 3000 },
  { category: 'Medical Insurance', limit: 2000 },
  { category: 'Property Tax', limit: 1000 },
  { category: 'Electricity', limit: 3000 },
  { category: 'Mobile', limit: 1000 },
  { category: 'Home Maintenance', limit: 2000 },
  { category: 'Petrol', limit: 5000 },
  { category: 'Food & Drinks', limit: 5000 },
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Grocery': '#4ADE80',          // Green
  'Household Help': '#60A5FA',   // Blue
  'Medical': '#F87171',          // Red
  'Shopping': '#A78BFA',         // Violet
  'Education': '#FBBF24',        // Amber
  'Entertainment': '#F472B6',    // Pink
  'Medical Insurance': '#2DD4BF', // Teal
  'Property Tax': '#94A3B8',      // Slate
  'Electricity': '#FB923C',      // Orange
  'Mobile': '#38BDF8',           // Sky
  'Home Maintenance': '#818CF8',  // Indigo
  'Petrol': '#FACC15',           // Yellow
  'Transport': '#4ade80',        // Emerald
  'Food & Drinks': '#F97316',    // Deep Orange
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#6366F1'; // Default indigo
};
