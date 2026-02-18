// Client-side utility to match server's business income
import type { BusinessType } from '../types';
import { BUSINESS_DEFINITIONS } from '../types';

export function territoryIncome(business: BusinessType): number {
  return BUSINESS_DEFINITIONS[business].income;
}
