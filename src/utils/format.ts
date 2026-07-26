import ENV from "../config/env";

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
  
  let path = url;
  
  if (url.startsWith("http")) {
    try {
      const parsed = new URL(url);
      // If the backend returned a local development IP or localhost,
      // we extract the pathname to ensure we use our STORAGE_BASE_URL instead,
      // which properly points to valid network URLs (e.g. ngrok HTTPS)
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname.startsWith("192.168.") ||
        parsed.hostname.startsWith("10.") ||
        parsed.hostname === "127.0.0.1"
      ) {
        path = parsed.pathname;
      } else {
        // External URLs or already valid absolute URLs
        return url;
      }
    } catch {
      // Return as is if URL parsing fails
      return url;
    }
  }

  const STORAGE_BASE = ENV.STORAGE_BASE_URL;
  return `${STORAGE_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
