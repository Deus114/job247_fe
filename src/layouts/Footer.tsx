import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, type SubmitEvent } from "react";
import { useAppSelector } from "@/store/hooks";

export default function Footer() {
  const { t } = useTranslation();
  const config = useAppSelector((state) => state.businessConfig.config);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  const siteName = config.name.trim() || "Jobs247";
  const about =
    config.footerAboutDesc.trim() ||
    config.tagline.trim() ||
    t("footer.aboutDesc");
  const address = config.footerAddress.trim() || config.address.trim();
  const phone = config.footerPhone.trim() || config.phone.trim();
  const mail = config.footerEmail.trim() || config.email.trim();
  const copyright = config.footerCopyright.trim() || t("footer.copyright");

  const socialLinks = [
    {
      href: config.socialFacebook,
      label: "Facebook",
      icon: "ri-facebook-fill",
    },
    {
      href: config.socialLinkedin,
      label: "LinkedIn",
      icon: "ri-linkedin-fill",
    },
    { href: config.socialTwitter, label: "Twitter", icon: "ri-twitter-x-fill" },
    { href: config.socialYoutube, label: "YouTube", icon: "ri-youtube-fill" },
  ].filter((item) => item.href.trim());

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const honeypot = (
      form.querySelector('[name="phone_alt"]') as HTMLInputElement
    )?.value?.trim();
    if (honeypot) {
      setStatus("success");
      setEmail("");
      return;
    }

    // TODO: wire to backend newsletter API (e.g. POST /newsletter)
    setStatus("error");
    setFormError(t("footer.comingSoon"));
  };

  const linkClasses =
    "text-sm text-background-50/70 dark:text-foreground-950/70 hover:text-background-50 dark:hover:text-foreground-950 transition-colors cursor-pointer";
  const socialBtnClasses =
    "w-9 h-9 rounded-full bg-background-50/10 flex items-center justify-center text-background-50 dark:text-foreground-950 hover:bg-background-50/20 transition-colors cursor-pointer";

  return (
    <footer className="bg-secondary-500 text-background-50 dark:text-foreground-950">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              {config.logoUrl ? (
                <span className="size-12 rounded-xl overflow-hidden flex-shrink-0 leading-none">
                  <img
                    src={config.logoUrl}
                    alt={siteName}
                    className="size-full object-cover"
                  />
                </span>
              ) : (
                <div className="size-12 rounded-xl bg-background-50/20 flex items-center justify-center flex-shrink-0">
                  <i className="ri-briefcase-line text-background-50 dark:text-foreground-950 text-2xl"></i>
                </div>
              )}
              <span className="font-heading text-xl font-bold leading-none text-background-50 dark:text-foreground-950 whitespace-nowrap">
                {siteName.includes("247") ? (
                  <>
                    {siteName.replace(/247.*$/, "")}
                    <span className="text-background-50/70 dark:text-foreground-950/70">
                      247
                    </span>
                  </>
                ) : (
                  siteName
                )}
              </span>
            </Link>
            <p className="text-sm text-background-50/70 dark:text-foreground-950/70 leading-relaxed mb-5">
              {about}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className={socialBtnClasses}
                  >
                    <i className={item.icon}></i>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-heading text-base font-semibold text-background-50 dark:text-foreground-950 mb-4">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/" className={linkClasses}>
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/jobs" className={linkClasses}>
                  {t("nav.jobs")}
                </Link>
              </li>
              <li>
                <Link to="/companies" className={linkClasses}>
                  {t("nav.companies")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className={linkClasses}>
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <Link to="/login" className={linkClasses}>
                  {t("nav.login")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-base font-semibold text-background-50 dark:text-foreground-950 mb-4">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-3">
              {address && (
                <li className="flex items-start gap-2.5 text-sm text-background-50/70 dark:text-foreground-950/70">
                  <i className="ri-map-pin-line mt-0.5 flex-shrink-0"></i>
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2.5 text-sm text-background-50/70 dark:text-foreground-950/70 hover:text-background-50 dark:hover:text-foreground-950 transition-colors cursor-pointer"
                  >
                    <i className="ri-phone-line flex-shrink-0"></i>
                    <span>{phone}</span>
                  </a>
                </li>
              )}
              {mail && (
                <li>
                  <a
                    href={`mailto:${mail}`}
                    className="flex items-center gap-2.5 text-sm text-background-50/70 dark:text-foreground-950/70 hover:text-background-50 dark:hover:text-foreground-950 transition-colors cursor-pointer"
                  >
                    <i className="ri-mail-line flex-shrink-0"></i>
                    <span>{mail}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-base font-semibold text-background-50 dark:text-foreground-950 mb-4">
              {t("footer.newsletter")}
            </h4>
            <p className="text-sm text-background-50/70 dark:text-foreground-950/70 mb-3">
              {t("footer.newsletterDesc")}
            </p>
            <form onSubmit={handleSubmit} data-readdy-form="true">
              <input
                name="phone_alt"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                readOnly
                className="honeypot-field"
              />
              <div className="space-y-2">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                  }}
                  placeholder={t("footer.newsletterPlaceholder")}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-lg bg-background-50/10 border border-background-50/20 text-background-50 dark:text-foreground-950 placeholder:text-background-50/40 dark:placeholder:text-foreground-950/40 focus:outline-none focus:border-background-50/50 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-background-50 text-secondary-500 dark:text-secondary-500 rounded-lg text-sm font-semibold hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-send-plane-line mr-1.5"></i>{" "}
                  {t("footer.subscribe")}
                </button>
              </div>
              {status === "success" && (
                <p className="text-xs text-green-300 mt-2 flex items-center gap-1">
                  <i className="ri-check-line"></i> {t("contact.success")}
                </p>
              )}
              {status === "error" && (
                <p className="text-xs text-red-300 mt-2">{formError}</p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-background-50/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-background-50/50 dark:text-foreground-950/50 text-center sm:text-left">
              {copyright}
            </p>
            <div className="flex items-center gap-5 flex-wrap justify-center">
              <Link
                to="/privacy"
                className="text-xs text-background-50/50 dark:text-foreground-950/50 hover:text-background-50 dark:hover:text-foreground-950 transition-colors cursor-pointer"
              >
                {t("footer.privacy")}
              </Link>
              <span className="text-background-50/20 select-none">|</span>
              <Link
                to="/terms"
                className="text-xs text-background-50/50 dark:text-foreground-950/50 hover:text-background-50 dark:hover:text-foreground-950 transition-colors cursor-pointer"
              >
                {t("footer.terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
