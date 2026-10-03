import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth";

export default function CTASection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return null;

  return (
    <section className="relative py-20 md:py-24 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=Warm%20inspiring%20abstract%20background%20with%20soft%20orange%20and%20cream%20gradients%2C%20flowing%20organic%20shapes%2C%20modern%20corporate%20design%2C%20clean%20minimalist%20style%2C%20professional%20yet%20approachable&width=1920&height=600&seq=cta-bg-2026&orientation=landscape"
          alt="CTA background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary-500/90"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-8 text-center">
        <h2 className="text-2xl md:text-4xl font-heading font-bold text-white mb-4">
          {t("home.cta")}
        </h2>
        <p className="text-base md:text-lg text-white/80 max-w-xl mx-auto mb-8">
          {t("home.ctaDesc")}
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary-500 rounded-full text-sm font-semibold hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer shadow-lg"
        >
          {t("home.ctaButton")}
          <i className="ri-arrow-right-line"></i>
        </Link>
      </div>
    </section>
  );
}
