import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { icon: 'ri-briefcase-line', value: '12,500+', label: 'Việc làm đang tuyển', color: 'text-primary-500', bgColor: 'bg-primary-100' },
    { icon: 'ri-building-line', value: '3,200+', label: 'Công ty uy tín', color: 'text-accent-500', bgColor: 'bg-accent-100' },
    { icon: 'ri-user-line', value: '50,000+', label: 'Ứng viên đăng ký', color: 'text-secondary-500', bgColor: 'bg-secondary-100' },
    { icon: 'ri-check-double-line', value: '85%', label: 'Tỷ lệ tuyển dụng thành công', color: 'text-primary-500', bgColor: 'bg-primary-100' },
  ];

  return (
    <section className="py-16 md:py-20 bg-background-50">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('home.stats')}</h2>
          <p className="text-sm text-foreground-600 mt-2">{t('home.statsDesc')}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-xl bg-background-50 border border-background-200/70">
              <div className={`w-14 h-14 mx-auto rounded-xl ${stat.bgColor} flex items-center justify-center mb-4`}>
                <i className={`${stat.icon} text-2xl ${stat.color}`}></i>
              </div>
              <p className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{stat.value}</p>
              <p className="text-sm text-foreground-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}