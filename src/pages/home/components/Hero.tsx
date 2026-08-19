import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CustomSelect from '@/components/base/CustomSelect';

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const locationOptions = [
    { value: '', label: t('hero.locationPlaceholder') },
    { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
    { value: 'Hà Nội', label: 'Hà Nội' },
    { value: 'Đà Nẵng', label: 'Đà Nẵng' },
    { value: 'Hải Phòng', label: 'Hải Phòng' },
    { value: 'Cần Thơ', label: 'Cần Thơ' },
    { value: 'Bình Dương', label: 'Bình Dương' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (location) params.set('locations', location);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[520px] md:min-h-[620px] lg:min-h-[680px] flex items-center">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://readdy.ai/api/search-image?query=Modern%20bright%20minimalist%20office%20workspace%20with%20warm%20natural%20lighting%2C%20clean%20white%20desks%20with%20laptops%2C%20green%20plants%2C%20large%20windows%2C%20collaborative%20open%20space%2C%20soft%20beige%20and%20cream%20tones%2C%20architectural%20photography%2C%20bright%20and%20airy%20atmosphere&width=1920&height=900&seq=hero-bg-2026&orientation=landscape"
          alt="Modern workspace"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div className="text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-heading font-bold text-white leading-tight mb-5">
              {t('hero.title')}
            </h1>
            <p className="text-base md:text-lg text-white/85 max-w-lg mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <form onSubmit={handleSearch} className="bg-background-50 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl relative z-20">
              <div className="flex-[2] relative min-w-0">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400 text-lg pointer-events-none"></i>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={t('hero.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-3.5 text-sm text-foreground-900 bg-background-100/60 border border-transparent focus:bg-background-50 focus:border-primary-300 rounded-xl placeholder:text-foreground-400 transition-all outline-none"
                />
              </div>
              <div className="hidden sm:block w-px bg-background-200 self-stretch my-1.5 flex-shrink-0"></div>
              <CustomSelect
                value={location}
                options={locationOptions}
                onChange={setLocation}
                className="w-full sm:w-auto sm:min-w-[170px]"
              />
              <button
                type="submit"
                className="px-5 md:px-6 py-3.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 justify-center flex-shrink-0"
              >
                <i className="ri-search-line"></i>
                <span className="hidden md:inline">{t('hero.searchButton')}</span>
                <span className="md:hidden">{t('common.search')}</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-6 md:gap-10 mt-8">
              <div>
                <p className="text-2xl md:text-3xl font-heading font-bold text-white">12,500+</p>
                <p className="text-sm text-white/70">{t('hero.statsJobs')}</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-heading font-bold text-white">3,200+</p>
                <p className="text-sm text-white/70">{t('hero.statsCompanies')}</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-heading font-bold text-white">50,000+</p>
                <p className="text-sm text-white/70">{t('hero.statsCandidates')}</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <div className="relative w-[400px] h-[400px] xl:w-[480px] xl:h-[480px]">
              <img
                src="https://readdy.ai/api/search-image?query=Modern%20abstract%203D%20illustration%20of%20people%20connecting%20and%20collaborating%20in%20a%20professional%20environment%2C%20geometric%20shapes%2C%20warm%20orange%20and%20cream%20color%20palette%2C%20clean%20minimalist%20style%2C%20soft%20gradients%2C%20floating%20elements%2C%20corporate%20illustration%20style%2C%20professional%20yet%20friendly%20vibe&width=960&height=960&seq=hero-illustration&orientation=squarish"
                alt="Job search illustration"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}