import { useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/store/hooks";

export default function ContactPage() {
  const { t } = useTranslation();
  const config = useAppSelector((state) => state.businessConfig.config);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const honeypot = (
      form.querySelector('[name="website_alt"]') as HTMLInputElement
    )?.value?.trim();
    if (honeypot) {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      return;
    }

    // TODO: wire to backend contact API (e.g. POST /contact)
    setStatus("error");
    setFormError(t("contact.comingSoon"));
  };

  const mapSrc = `https://www.google.com/maps?q=${config.latitude},${config.longitude}&z=15&output=embed`;

  const contactInfos = [
    {
      icon: "ri-map-pin-line",
      label: t("contact.address"),
      value: config.address,
      colorClass: "text-primary-500 bg-primary-100",
    },
    {
      icon: "ri-phone-line",
      label: t("contact.phone"),
      value: config.phone,
      colorClass: "text-accent-500 bg-accent-100",
    },
    {
      icon: "ri-mail-line",
      label: t("contact.email"),
      value: config.email,
      colorClass: "text-secondary-500 bg-secondary-100",
    },
    {
      icon: "ri-time-line",
      label: t("contact.workingHours"),
      value: t("contact.workingHoursValue"),
      colorClass: "text-primary-500 bg-primary-100",
    },
  ];

  return (
    <div className="min-h-screen pt-[70px]">
      <div className="bg-background-100 border-b border-background-200/70">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">
            {t("contact.title")}
          </h1>
          <p className="text-sm text-foreground-600 mt-1">
            {t("contact.subtitle")}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12">
          <div className="lg:col-span-2">
            <div className="space-y-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-6">
                {t("contact.contactInfo")}
              </h3>
              {contactInfos.map((info) => (
                <div
                  key={info.label}
                  className="flex items-start gap-4 p-4 rounded-xl bg-background-50 border border-background-200/70"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${info.colorClass} flex items-center justify-center flex-shrink-0`}
                  >
                    <i className={info.icon}></i>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500 mb-0.5">
                      {info.label}
                    </p>
                    <p className="text-sm font-medium text-foreground-950">
                      {info.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-background-50 border border-background-200/70 rounded-xl">
              <h4 className="font-heading text-sm font-semibold text-foreground-950 mb-3">
                {t("contact.connectWithUs")}
              </h4>
              <div className="flex gap-3">
                {config.socialFacebook && (
                  <a
                    href={config.socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center hover:bg-primary-200 transition-colors cursor-pointer"
                  >
                    <i className="ri-facebook-fill"></i>
                  </a>
                )}
                {config.socialLinkedin && (
                  <a
                    href={config.socialLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-accent-100 text-accent-500 flex items-center justify-center hover:bg-accent-200 transition-colors cursor-pointer"
                  >
                    <i className="ri-linkedin-fill"></i>
                  </a>
                )}
                {config.socialTwitter && (
                  <a
                    href={config.socialTwitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-secondary-100 text-secondary-500 flex items-center justify-center hover:bg-secondary-200 transition-colors cursor-pointer"
                  >
                    <i className="ri-twitter-x-fill"></i>
                  </a>
                )}
                {config.socialYoutube && (
                  <a
                    href={config.socialYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors cursor-pointer"
                  >
                    <i className="ri-youtube-fill"></i>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
              <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-6">
                {t("contact.sendMessageTitle")}
              </h3>

              {status === "success" && (
                <div className="mb-6 p-4 rounded-xl bg-accent-50 border border-accent-200">
                  <p className="text-sm text-accent-700 flex items-center gap-2">
                    <i className="ri-check-line"></i> {t("contact.success")}
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                data-readdy-form="true"
                className="space-y-5"
              >
                <input
                  name="website_alt"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  readOnly
                  className="honeypot-field"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-sm font-medium text-foreground-700 mb-1.5"
                    >
                      {t("contact.name")} *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setStatus("idle");
                      }}
                      required
                      className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                      placeholder={t("contact.namePlaceholder")}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-sm font-medium text-foreground-700 mb-1.5"
                    >
                      {t("contact.email")} *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setStatus("idle");
                      }}
                      required
                      className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                      placeholder={t("contact.emailPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-sm font-medium text-foreground-700 mb-1.5"
                  >
                    {t("contact.subject")}
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                      setStatus("idle");
                    }}
                    className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                    placeholder={t("contact.subjectPlaceholder")}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm font-medium text-foreground-700 mb-1.5"
                  >
                    {t("contact.message")} *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      setStatus("idle");
                    }}
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none"
                    placeholder={t("contact.messagePlaceholder")}
                    maxLength={500}
                  ></textarea>
                  <p className="text-xs text-foreground-400 mt-1 text-right">
                    {formData.message.length}/500
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-send-plane-fill mr-2"></i>{" "}
                  {t("contact.send")}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl overflow-hidden h-[400px] border border-background-200/70">
          <iframe
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Jobs247 Location"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
