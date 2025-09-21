/**
 * Global Font Configuration
 * 
 * This file centralizes all font settings for the application.
 * Change fonts here to update them across the entire site.
 */

// Font family configurations
export const FONTS = {
  // Main site font (for landing pages, product pages, etc.)
  MAIN: 'font-jost',
  
  // Dashboard font (for admin, seller, member dashboards)
  DASHBOARD: 'font-inter',
  
  // Modal and dropdown font (should match main site for consistency)
  MODAL: 'font-jost',
  
  // Navbar font (should match main site)
  NAVBAR: 'font-jost',
  
  // Footer font (should match main site)
  FOOTER: 'font-jost',
  
  // Heading font (for main headings, titles, etc.)
  HEADING: 'font-noto-serif-display',
} as const;

// Font class mappings for easy reference
export const FONT_CLASSES = {
  main: FONTS.MAIN,
  dashboard: FONTS.DASHBOARD,
  modal: FONTS.MODAL,
  navbar: FONTS.NAVBAR,
  footer: FONTS.FOOTER,
  heading: FONTS.HEADING,
} as const;

// Helper function to get font class
export const getFontClass = (type: keyof typeof FONT_CLASSES): string => {
  return FONT_CLASSES[type];
};

// Helper function to combine font class with other classes
export const withFont = (type: keyof typeof FONT_CLASSES, className?: string): string => {
  const fontClass = getFontClass(type);
  return className ? `${fontClass} ${className}` : fontClass;
};
