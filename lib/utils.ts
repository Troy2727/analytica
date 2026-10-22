import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Join class names, letting later Tailwind classes override earlier ones (used by components/ui). */
export function cn(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}
