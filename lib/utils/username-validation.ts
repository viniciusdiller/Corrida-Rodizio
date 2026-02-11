const ALPHANUMERIC_ONLY_REGEX = /^[A-Za-z0-9]+$/;

export const sanitizeAlphanumeric = (value: string) =>
  value.replace(/[^A-Za-z0-9]/g, "");

export const isAlphanumericOnly = (value: string) =>
  ALPHANUMERIC_ONLY_REGEX.test(value);
