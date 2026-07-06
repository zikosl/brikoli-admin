export type DateValue = Date | string | number | null | undefined | { toDate: () => Date };

const hasToDate = (value: DateValue): value is { toDate: () => Date } =>
  Boolean(value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function');

const defaultOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDate(
  value: DateValue,
  options: Intl.DateTimeFormatOptions = defaultOptions,
  locale = 'en',
) {
  if (!value) {
    return locale.startsWith('ar') ? 'غير محدد' : 'Not set';
  }

  const date = hasToDate(value) ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale.startsWith('ar') ? 'تاريخ غير صالح' : 'Invalid date';
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}
