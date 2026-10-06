/** API enum values for employer job create/update. */
export const EMPLOYMENT_TYPE_VALUES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "INTERNSHIP",
  "REMOTE",
] as const;

export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPE_VALUES)[number];

export const EXPERIENCE_LEVEL_VALUES = [
  "INTERN",
  "JUNIOR",
  "MIDDLE",
  "SENIOR",
  "LEAD",
] as const;

export type ExperienceLevelValue = (typeof EXPERIENCE_LEVEL_VALUES)[number];

export function employmentTypeLabelKey(value: string): string {
  return `postJob.employmentTypes.${value}`;
}

export function experienceLevelLabelKey(value: string): string {
  return `postJob.experienceLevels.${value}`;
}
