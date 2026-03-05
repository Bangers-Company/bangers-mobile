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
