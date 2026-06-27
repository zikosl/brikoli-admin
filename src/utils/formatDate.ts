import { Timestamp } from 'firebase/firestore';

export type DateValue = Timestamp | Date | string | number | null | undefined;

const isTimestamp = (value: DateValue): value is Timestamp => value instanceof Timestamp;

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

  const date = isTimestamp(value) ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale.startsWith('ar') ? 'تاريخ غير صالح' : 'Invalid date';
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}
