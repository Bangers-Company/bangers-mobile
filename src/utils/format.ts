export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

export const truncateString = (str: string, length: number) => {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
};

export const formatUsername = (username: string) => {
  return `@${username.toLowerCase()}`;
};

export const resolveMediaUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;

  // For local development, we assume media is served from the root of the backend
  const STORAGE_BASE = "http://localhost:8080";
  return `${STORAGE_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
