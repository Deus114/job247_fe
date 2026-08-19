import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockCategories } from '@/mocks/jobs';

const categoryIcons: Record<string, string> = {
  'Công nghệ thông tin': 'ri-code-s-slash-line',
  'Marketing': 'ri-megaphone-line',
  'Kế toán - Tài chính': 'ri-pie-chart-line',
  'Nhân sự': 'ri-team-line',
  'Thiết kế': 'ri-pencil-ruler-2-line',
  'Giáo dục': 'ri-book-open-line',
  'Dịch vụ khách hàng': 'ri-customer-service-2-line',
  'Kinh doanh - Bán hàng': 'ri-hand-coin-line',
  'Xây dựng': 'ri-building-line',
  'Y tế - Sức khỏe': 'ri-heart-pulse-line',
  'Sản xuất': 'ri-building-2-line',
  'Vận tải - Logistics': 'ri-truck-line',
  'Ngân hàng': 'ri-bank-line',
  'Bất động sản': 'ri-home-office-line',
  'Du lịch - Nhà hàng - Khách sạn': 'ri-hotel-line',
};

export default function CategoryGrid() {
  const { t } = useTranslation();
  const displayCategories = mockCategories.slice(0, 8);

  return (
    <section className="py-16 md:py-20 bg-background-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('home.categories')}</h2>
          <p className="text-sm text-foreground-600 mt-2">{t('home.categoriesDesc')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {displayCategories.map((cat) => (
            <Link
              key={cat.name}
              to={`/jobs?category=${encodeURIComponent(cat.name)}`}
              className="group relative bg-background-50 rounded-xl overflow-hidden border border-background-200/70 hover:border-primary-300 transition-all duration-200 cursor-pointer"
            >
              <div className="aspect-[4/3] overflow-hidden">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                    <i className={`${categoryIcons[cat.name] || 'ri-briefcase-line'} text-4xl text-primary-400`}></i>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-background-50/20 flex items-center justify-center">
                    <i className={`${categoryIcons[cat.name] || 'ri-briefcase-line'} text-sm text-white`}></i>
                  </div>
                  <h3 className="font-heading text-sm font-semibold text-white">{cat.name}</h3>
                </div>
                <p className="text-xs text-white/70">
                  {Math.floor(Math.random() * 200 + 50)} {t('hero.statsJobs').toLowerCase()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}