export const cleanUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/\[.*?\]\((.*?)\)/g, '$1').trim();
};

export const cleanPhone = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
};

export const displayUrl = (url: string): string => {
  if (!url) return '';
  return cleanUrl(url).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
};
