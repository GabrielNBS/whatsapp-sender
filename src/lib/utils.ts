import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateSafetyDelay(min: number = 15000, max: number = 30000) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
