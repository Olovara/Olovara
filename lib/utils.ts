import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  price: number | string,
  options: {
    currency?: 'USD' | 'EUR' | 'GBP' | 'BDT'
    notation?: Intl.NumberFormatOptions['notation']
    isCents?: boolean
  } = {}
) {
  const { currency = 'USD', notation = 'compact', isCents = true } = options

  const numericPrice =
    typeof price === 'string' ? parseFloat(price) : price

  // Convert cents to dollars if isCents is true
  const priceInDollars = isCents ? numericPrice / 100 : numericPrice

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation,
    maximumFractionDigits: 2,
  }).format(priceInDollars)
}

export function shopNameSlugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "") // Remove spaces
    .replace(/[^\w-]+/g, ""); // Remove special characters
}