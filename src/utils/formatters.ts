import { formatDistanceToNow, format } from "date-fns";

export const formatters = {
  currency: (value: number, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(value);
  },

  number: (value: number, decimals = 0) => {
    return value.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },

  percentage: (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  },

  date: (date: string | Date, fmt = "MMM dd, yyyy") => {
    return format(new Date(date), fmt);
  },

  timeAgo: (date: string | Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  },

  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return value;
  },

  initials: (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },
};
