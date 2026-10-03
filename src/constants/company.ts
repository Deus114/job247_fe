export const companySizeValues = [
  "SIZE_1_10",
  "SIZE_11_50",
  "SIZE_51_200",
  "SIZE_201_500",
  "SIZE_501_1000",
  "SIZE_1000_PLUS",
] as const;

export type CompanySizeValue = (typeof companySizeValues)[number];

/** @deprecated Prefer `companySizeValues` — kept as alias for existing imports. */
export const companySizes: string[] = [...companySizeValues];

export function companySizeLabelKey(size: string): string {
  return `company.sizeOptions.${size}`;
}
