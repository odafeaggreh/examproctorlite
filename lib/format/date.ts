export function formatDateTime(
  value: string | null | undefined,
  locale?: string,
) {
  if (!value) {
    return;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
