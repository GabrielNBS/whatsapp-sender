import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function calculateSafetyDelay(min: number = 15000, max: number = 30000) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  let match = cleaned;
  if (cleaned.length > 11 && cleaned.startsWith("55")) {
    match = cleaned.substring(2);
  }
  if (match.length === 11) {
    return match.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  }
  if (match.length === 10) {
    return match.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
};
