const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

export const formatDate = (value: string): string =>
  (/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)).toLocaleDateString(undefined, DATE);

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { ...DATE, hour: '2-digit', minute: '2-digit' });
