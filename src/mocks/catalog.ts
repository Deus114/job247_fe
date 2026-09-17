import type { Industry, Province } from '@/types/catalog';

/** Mock industries until industries API is wired. groupId should match API industry-group ids when available. */
export const mockIndustries: Industry[] = [
  {
    id: 'ind-1',
    name: 'Công nghệ thông tin',
    groupId: '',
    image:
      'https://readdy.ai/api/search-image?query=Modern%20clean%20technology%20office%20workspace%20with%20laptop%20and%20code%20on%20screen%2C%20minimalist%20flat%20lay%20photography%2C%20warm%20neutral%20lighting%2C%20white%20background%2C%20professional%20corporate%20aesthetic&width=400&height=300&seq=cat-it&orientation=landscape',
    createdAt: '2025-01-10',
  },
  {
    id: 'ind-2',
    name: 'Marketing',
    groupId: '',
    image:
      'https://readdy.ai/api/search-image?query=Creative%20marketing%20workspace%20with%20colorful%20sticky%20notes%20on%20glass%20wall%2C%20modern%20office%20desk%20with%20analytics%20dashboard%2C%20warm%20ambient%20lighting%2C%20clean%20professional%20setup&width=400&height=300&seq=cat-marketing&orientation=landscape',
    createdAt: '2025-01-12',
  },
  {
    id: 'ind-3',
    name: 'Kế toán - Tài chính',
    groupId: '',
    image:
      'https://readdy.ai/api/search-image?query=Professional%20financial%20workspace%20with%20calculator%20and%20financial%20charts%20on%20clean%20desk%2C%20warm%20morning%20light%2C%20organized%20modern%20office%20aesthetic%2C%20corporate%20finance%20theme&width=400&height=300&seq=cat-finance&orientation=landscape',
    createdAt: '2025-01-15',
  },
  {
    id: 'ind-4',
    name: 'Nhân sự',
    groupId: '',
    createdAt: '2025-02-01',
  },
  {
    id: 'ind-5',
    name: 'Thiết kế',
    groupId: '',
    createdAt: '2025-02-05',
  },
];

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
