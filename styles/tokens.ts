// styles/tokens.ts
//
// Usage map: which Tailwind classes to use for which purpose.
// Actual color values live in app/globals.css (single source of truth).
// Use: className={tokens.colors.primary} or cn(tokens.colors.primary, ...)

export const tokens = {
  colors: {
    primary: "bg-brand-primary-700",
    primaryHover: "hover:bg-brand-primary-600",
    primaryText: "text-brand-primary-700",

    background: "bg-background",
    surface: "bg-brand-light-neutral-50",
    surfaceWhite: "bg-white",

    border: "border-brand-dark-neutral-200",
    borderSubtle: "border-brand-dark-neutral-200",

    textPrimary: "text-brand-dark-neutral-900",
    textSecondary: "text-brand-dark-neutral-600",
    textMuted: "text-brand-dark-neutral-500",

    success: "text-brand-success-500",
    warning: "text-brand-warn-500",
    error: "text-brand-error-500",
  },

  spacing: {
    xs: "1",
    sm: "2",
    md: "4",
    lg: "6",
    xl: "8",
    xxl: "12",
    section: "24",
  },

  radius: {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
  },

  shadow: {
    subtle: "shadow-sm",
    none: "shadow-none",
  },

  container: {
    default: "max-w-7xl mx-auto px-6",
    narrow: "max-w-3xl mx-auto px-6",
  },
} as const;
