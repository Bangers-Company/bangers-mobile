import { format, parseISO } from "date-fns";

export const formatDate = (dateString: string, formatStr: string = "PPp") => {
  try {
    return format(parseISO(dateString), formatStr);
  } catch (error) {
    return dateString;
  }
};

export const getSyncTimestamp = () => {
  return Math.floor(Date.now() / 1000).toString();
};

export const isFuture = (dateString: string) => {
  return new Date(dateString) > new Date();
};
