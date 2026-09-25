/** At least 6 characters, with upper, lower, a digit, and a special character. */
const STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export function isStrongPassword(value: string): boolean {
  return STRONG_PASSWORD.test(value);
}
