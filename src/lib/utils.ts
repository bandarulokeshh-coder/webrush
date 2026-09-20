import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge conditional class names and resolve Tailwind class conflicts.
// Standard helper used by shadcn/ui-style component systems.
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
