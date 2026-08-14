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
  if (!url || typeof url !== "string" || url.trim() === "" || url.includes("placeholder.com")) {
    return null;
  }
  
  let path = url.trim();

  if (
    path.startsWith("file:") ||
    path.startsWith("content:") ||
    path.startsWith("ph:") ||
    path.startsWith("assets-library:") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  
  if (path.startsWith("http")) {
    try {
      const parsed = new URL(path);
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname.startsWith("192.168.") ||
        parsed.hostname.startsWith("10.") ||
        parsed.hostname === "127.0.0.1"
      ) {
        path = parsed.pathname;
      } else {
        return path;
      }
    } catch {
      return path;
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

export const getUserDisplayName = (user?: any): string => {
  if (!user) return "User";

  const first = typeof user.first_name === "string" ? user.first_name.trim() : "";
  const last = typeof user.last_name === "string" ? user.last_name.trim() : "";
  const fullName = `${first} ${last}`.trim();
  if (fullName !== "") {
    return fullName;
  }

  if (typeof user.full_name === "string" && user.full_name.trim() !== "") {
    return user.full_name.trim();
  }
  if (typeof user.name === "string" && user.name.trim() !== "") {
    return user.name.trim();
  }
  if (typeof user.display_name === "string" && user.display_name.trim() !== "") {
    return user.display_name.trim();
  }

  if (typeof user.username === "string" && user.username.trim() !== "") {
    return user.username.trim();
  }

  if (typeof user.requester_name === "string" && user.requester_name.trim() !== "") {
    return user.requester_name.trim();
  }

  if (typeof user.sender_name === "string" && user.sender_name.trim() !== "") {
    return user.sender_name.trim();
  }

  return "User";
};

export const getUserAvatarUrl = (user?: any): string | null => {
  if (!user) return null;
  if (typeof user === "string") return resolveMediaUrl(user);

  const rawUrl =
    user.profile_media_url ||
    user.profile_media?.url ||
    user.profile_photo_url ||
    user.avatar_url ||
    user.avatar ||
    user.photo_url ||
    null;

  return resolveMediaUrl(rawUrl);
};


