export interface BusinessConfig {
  id: string;
  name: string;
  tagline: string;
  email: string;
  phone: string;
  taxCode: string;
  /** Used for Google Maps embed on public pages */
  latitude: number;
  longitude: number;
  address: string;
  /** Banner / background images */
  logoUrl: string;
  faviconUrl: string;
  homeBannerUrl: string;
  loginBgUrl: string;
  adminLoginBgUrl: string;
  registerBgUrl: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  footerAboutDesc: string;
  footerCopyright: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  socialFacebook: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialYoutube: string;
  /** HTML content for public /privacy and /terms pages */
  privacyPolicyHtml: string;
  termsOfServiceHtml: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpAuth: boolean;
  smtpStartTls: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Raw payload from public GET /business-config (no auth). */
export interface PublicBusinessConfigApi {
  id: number;
  siteName: string | null;
  tagline: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxCode: string | null;
  latitude: number | null;
  longitude: number | null;
  logo: string | null;
  homeBanner: string | null;
  userLoginBackground: string | null;
  userRegisterBanner: string | null;
  footerAbout: string | null;
  footerCopyright: string | null;
  footerAddress: string | null;
  footerPhone: string | null;
  footerEmail: string | null;
  privacyPolicy: string | null;
  termsOfService: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

export interface AdminBusinessConfigApi extends PublicBusinessConfigApi {
  adminLoginBackground: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpPassword: string | null;
  smtpFromEmail: string | null;
  smtpFromName: string | null;
  smtpAuth: boolean | null;
  smtpStartTls: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function str(value: string | null | undefined): string {
  return value == null ? "" : String(value);
}

function numOrZero(value: number | null | undefined): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Empty admin form before API load / when fields are null. */
export function createEmptyBusinessConfig(): BusinessConfig {
  return {
    id: "",
    name: "",
    tagline: "",
    email: "",
    phone: "",
    address: "",
    latitude: 0,
    longitude: 0,
    taxCode: "",
    logoUrl: "",
    faviconUrl: "",
    homeBannerUrl: "",
    loginBgUrl: "",
    adminLoginBgUrl: "",
    registerBgUrl: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    footerAboutDesc: "",
    footerCopyright: "",
    footerAddress: "",
    footerPhone: "",
    footerEmail: "",
    socialFacebook: "",
    socialLinkedin: "",
    socialTwitter: "",
    socialYoutube: "",
    privacyPolicyHtml: "",
    termsOfServiceHtml: "",
    smtpHost: "",
    smtpPort: 0,
    smtpUsername: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "",
    smtpAuth: true,
    smtpStartTls: true,
    createdAt: "",
    updatedAt: "",
  };
}

/** Map public GET /business-config → app config (admin-only fields stay empty). */
export function mapPublicBusinessConfigApiToForm(
  data: PublicBusinessConfigApi,
): BusinessConfig {
  return {
    ...createEmptyBusinessConfig(),
    id: data.id != null ? String(data.id) : "",
    name: str(data.siteName),
    tagline: str(data.tagline),
    email: str(data.email),
    phone: str(data.phone),
    address: str(data.address),
    latitude: numOrZero(data.latitude),
    longitude: numOrZero(data.longitude),
    taxCode: str(data.taxCode),
    logoUrl: str(data.logo),
    homeBannerUrl: str(data.homeBanner),
    loginBgUrl: str(data.userLoginBackground),
    registerBgUrl: str(data.userRegisterBanner),
    metaTitle: str(data.metaTitle),
    metaDescription: str(data.metaDescription),
    metaKeywords: str(data.metaKeywords),
    footerAboutDesc: str(data.footerAbout),
    footerCopyright: str(data.footerCopyright),
    footerAddress: str(data.footerAddress),
    footerPhone: str(data.footerPhone),
    footerEmail: str(data.footerEmail),
    socialFacebook: str(data.facebookUrl),
    socialLinkedin: str(data.linkedinUrl),
    socialTwitter: str(data.twitterUrl),
    socialYoutube: str(data.youtubeUrl),
    privacyPolicyHtml: str(data.privacyPolicy),
    termsOfServiceHtml: str(data.termsOfService),
  };
}

/** Map admin GET/PUT DTO → admin form. Null fields become empty strings / 0. */
export function mapAdminBusinessConfigApiToForm(
  data: AdminBusinessConfigApi,
): BusinessConfig {
  return {
    ...mapPublicBusinessConfigApiToForm(data),
    adminLoginBgUrl: str(data.adminLoginBackground),
    smtpHost: str(data.smtpHost),
    smtpPort: numOrZero(data.smtpPort),
    smtpUsername: str(data.smtpUsername),
    smtpPassword: str(data.smtpPassword),
    smtpFromEmail: str(data.smtpFromEmail),
    smtpFromName: str(data.smtpFromName),
    smtpAuth: data.smtpAuth ?? true,
    smtpStartTls: data.smtpStartTls ?? true,
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
  };
}

/** Form image keys that map to API logo/banner URL + File pairs */
export type BusinessConfigImageFormKey =
  | "logoUrl"
  | "homeBannerUrl"
  | "loginBgUrl"
  | "adminLoginBgUrl"
  | "registerBgUrl";

export type BusinessConfigImageFiles = Partial<
  Record<BusinessConfigImageFormKey, File | null>
>;

const TEXT_FIELD_MAP: Array<{
  formKey: keyof BusinessConfig;
  apiKey: string;
}> = [
  { formKey: "name", apiKey: "siteName" },
  { formKey: "tagline", apiKey: "tagline" },
  { formKey: "email", apiKey: "email" },
  { formKey: "phone", apiKey: "phone" },
  { formKey: "address", apiKey: "address" },
  { formKey: "taxCode", apiKey: "taxCode" },
  { formKey: "footerAboutDesc", apiKey: "footerAbout" },
  { formKey: "footerCopyright", apiKey: "footerCopyright" },
  { formKey: "footerAddress", apiKey: "footerAddress" },
  { formKey: "footerPhone", apiKey: "footerPhone" },
  { formKey: "footerEmail", apiKey: "footerEmail" },
  { formKey: "privacyPolicyHtml", apiKey: "privacyPolicy" },
  { formKey: "termsOfServiceHtml", apiKey: "termsOfService" },
  { formKey: "socialFacebook", apiKey: "facebookUrl" },
  { formKey: "socialLinkedin", apiKey: "linkedinUrl" },
  { formKey: "socialTwitter", apiKey: "twitterUrl" },
  { formKey: "socialYoutube", apiKey: "youtubeUrl" },
  { formKey: "metaTitle", apiKey: "metaTitle" },
  { formKey: "metaDescription", apiKey: "metaDescription" },
  { formKey: "metaKeywords", apiKey: "metaKeywords" },
  { formKey: "smtpHost", apiKey: "smtpHost" },
  { formKey: "smtpUsername", apiKey: "smtpUsername" },
  { formKey: "smtpPassword", apiKey: "smtpPassword" },
  { formKey: "smtpFromEmail", apiKey: "smtpFromEmail" },
  { formKey: "smtpFromName", apiKey: "smtpFromName" },
];

const IMAGE_FIELD_MAP: Array<{
  formKey: BusinessConfigImageFormKey;
  urlKey: string;
  fileKey: string;
}> = [
  { formKey: "logoUrl", urlKey: "logo", fileKey: "logoFile" },
  { formKey: "homeBannerUrl", urlKey: "homeBanner", fileKey: "homeBannerFile" },
  {
    formKey: "loginBgUrl",
    urlKey: "userLoginBackground",
    fileKey: "userLoginBackgroundFile",
  },
  {
    formKey: "adminLoginBgUrl",
    urlKey: "adminLoginBackground",
    fileKey: "adminLoginBackgroundFile",
  },
  {
    formKey: "registerBgUrl",
    urlKey: "userRegisterBanner",
    fileKey: "userRegisterBannerFile",
  },
];

export function hasBusinessConfigImageFileChanges(
  imageFiles: BusinessConfigImageFiles,
): boolean {
  return IMAGE_FIELD_MAP.some(({ formKey }) => Boolean(imageFiles[formKey]));
}

/**
 * Build multipart body with only changed fields.
 * Image: send File XOR URL (never both).
 */
export function buildBusinessConfigUpdateFormData(input: {
  form: BusinessConfig;
  baseline: BusinessConfig;
  imageFiles: BusinessConfigImageFiles;
}): FormData {
  const { form, baseline, imageFiles } = input;
  const body = new FormData();

  for (const { formKey, apiKey } of TEXT_FIELD_MAP) {
    if (form[formKey] !== baseline[formKey]) {
      body.append(apiKey, String(form[formKey] ?? ""));
    }
  }

  if (form.latitude !== baseline.latitude) {
    body.append("latitude", String(form.latitude));
  }
  if (form.longitude !== baseline.longitude) {
    body.append("longitude", String(form.longitude));
  }
  if (form.smtpPort !== baseline.smtpPort) {
    body.append("smtpPort", String(form.smtpPort));
  }
  if (form.smtpAuth !== baseline.smtpAuth) {
    body.append("smtpAuth", String(form.smtpAuth));
  }
  if (form.smtpStartTls !== baseline.smtpStartTls) {
    body.append("smtpStartTls", String(form.smtpStartTls));
  }

  for (const { formKey, urlKey, fileKey } of IMAGE_FIELD_MAP) {
    const file = imageFiles[formKey];
    if (file instanceof File) {
      body.append(fileKey, file);
      continue;
    }
    if (form[formKey] !== baseline[formKey]) {
      // Remote/object URL preview from a pending file should not be sent as link
      const url = form[formKey];
      if (url.startsWith("blob:") || url.startsWith("data:")) continue;
      body.append(urlKey, url);
    }
  }

  return body;
}
