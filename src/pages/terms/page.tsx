import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

export default function TermsPage() {
  const { t } = useTranslation();
  const html = useAppSelector(
    (state) => state.businessConfig.config.termsOfServiceHtml,
  );

  return (
    <div className="min-h-screen pt-[70px] bg-background-50">
      <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-500 hover:text-primary-600 transition-colors mb-6"
        >
          <i className="ri-arrow-left-line"></i>
          {t("notFound.backHome")}
        </Link>
        <article
          className="prose prose-sm md:prose-base max-w-none text-foreground-800 bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8 [&_a]:text-primary-600"
          dangerouslySetInnerHTML={{
            __html: html || `<p>${t("legal.emptyTerms")}</p>`,
          }}
        />
      </div>
    </div>
  );
}
