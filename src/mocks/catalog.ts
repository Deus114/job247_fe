import type { Province } from '@/types/catalog';

/** Provinces remain mock until provinces API is wired. Industries use real API. */
export const mockProvinces: Province[] = [
  { id: 'pv-1', name: 'Hà Nội', code: 'HN', region: 'north', createdAt: '2025-01-01' },
  { id: 'pv-2', name: 'Hồ Chí Minh', code: 'HCM', region: 'south', createdAt: '2025-01-01' },
  { id: 'pv-3', name: 'Đà Nẵng', code: 'DN', region: 'central', createdAt: '2025-01-01' },
  { id: 'pv-4', name: 'Hải Phòng', code: 'HP', region: 'north', createdAt: '2025-01-02' },
  { id: 'pv-5', name: 'Cần Thơ', code: 'CT', region: 'south', createdAt: '2025-01-02' },
  { id: 'pv-6', name: 'Bình Dương', code: 'BD', region: 'south', createdAt: '2025-01-03' },
  { id: 'pv-7', name: 'Đồng Nai', code: 'DNai', region: 'south', createdAt: '2025-01-03' },
  { id: 'pv-8', name: 'Khánh Hòa', code: 'KH', region: 'central', createdAt: '2025-01-04' },
  { id: 'pv-9', name: 'Quảng Ninh', code: 'QN', region: 'north', createdAt: '2025-01-04' },
  { id: 'pv-10', name: 'Thừa Thiên Huế', code: 'TTH', region: 'central', createdAt: '2025-01-05' },
  { id: 'pv-11', name: 'Lâm Đồng', code: 'LD', region: 'central', createdAt: '2025-01-05' },
  { id: 'pv-12', name: 'Nghệ An', code: 'NA', region: 'central', createdAt: '2025-01-06' },
  { id: 'pv-13', name: 'Thanh Hóa', code: 'TH', region: 'north', createdAt: '2025-01-06' },
  { id: 'pv-14', name: 'Bà Rịa - Vũng Tàu', code: 'BRVT', region: 'south', createdAt: '2025-01-07' },
  { id: 'pv-15', name: 'An Giang', code: 'AG', region: 'south', createdAt: '2025-01-07' },
];
