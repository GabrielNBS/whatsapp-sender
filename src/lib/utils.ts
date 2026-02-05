import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function calculateSafetyDelay(min: number = 15000, max: number = 30000) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Generates all possible phone number variants for analytics lookup.
 * The WhatsApp API may normalize Brazilian mobile numbers differently
 * (e.g., removing the 9th digit for some DDDs or adding country code).
 * Returns an array of possible formats to try.
 */
export const getPhoneVariantsForAnalytics = (phone: string): string[] => {
  const digits = phone.replace(/\D/g, '');
  const variants: string[] = [];
  
  // Add the raw digits variant
  variants.push(digits);
  
  // With Brazil country code
  if (!digits.startsWith('55')) {
    variants.push(`55${digits}`);
  }
  
  // Without country code (if it has one)
  if (digits.startsWith('55') && digits.length >= 12) {
    variants.push(digits.substring(2));
  }
  
  // Brazilian mobile number variations (9th digit)
  // DDDs 11-28 require 9th digit, some DDDs 31+ may or may not have it
  const ddd = digits.startsWith('55') ? digits.substring(2, 4) : digits.substring(0, 2);
  const restOfNumber = digits.startsWith('55') ? digits.substring(4) : digits.substring(2);
  
  // If has 9 digits after DDD (with 9th digit), try without it
  if (restOfNumber.length === 9 && restOfNumber.startsWith('9')) {
    const without9th = restOfNumber.substring(1);
    variants.push(`55${ddd}${without9th}`);
    variants.push(`${ddd}${without9th}`);
  }
  
  // If has 8 digits after DDD (without 9th digit), try with it
  if (restOfNumber.length === 8) {
    const with9th = `9${restOfNumber}`;
    variants.push(`55${ddd}${with9th}`);
    variants.push(`${ddd}${with9th}`);
  }
  
  return [...new Set(variants)]; // Remove duplicates
};

/**
 * Analytics data type for a contact
 */
export interface ContactAnalyticsData {
  sentCount: number;
  readCount: number;
  lastSentAt?: Date | string | null;
  lastReadAt?: Date | string | null;
}

/**
 * Finds analytics for a phone number by trying multiple variants.
 */
export const findAnalyticsForPhone = (
  phone: string,
  analyticsMap: Record<string, ContactAnalyticsData>
): ContactAnalyticsData | undefined => {
  const variants = getPhoneVariantsForAnalytics(phone);
  for (const variant of variants) {
    if (analyticsMap[variant]) {
      return analyticsMap[variant];
    }
  }
  return undefined;
};

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
