// Theme presets for the website builder
export interface ThemePreset {
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    textSecondary: string
  }
  fonts: {
    heading: string
    body: string
  }
  styles: {
    borderRadius: string
    boxShadow: string
    spacing: string
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Minimal',
    description: 'Clean and simple design with subtle colors',
    colors: {
      primary: '#1e293b',
      secondary: '#64748b',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
    },
    fonts: {
      heading: 'Inter, sans-serif',
      body: 'Inter, sans-serif',
    },
    styles: {
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      spacing: '16px',
    },
  },
  {
    name: 'Modern',
    description: 'Contemporary design with bold colors and clean lines',
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#f59e0b',
      background: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Inter, sans-serif',
    },
    styles: {
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      spacing: '24px',
    },
  },
  {
    name: 'Vintage',
    description: 'Classic design with warm, earthy tones',
    colors: {
      primary: '#92400e',
      secondary: '#a16207',
      accent: '#d97706',
      background: '#fef7ed',
      text: '#451a03',
      textSecondary: '#92400e',
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Source Sans Pro, sans-serif',
    },
    styles: {
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      spacing: '20px',
    },
  },
  {
    name: 'Creative',
    description: 'Bold and artistic with vibrant colors',
    colors: {
      primary: '#7c3aed',
      secondary: '#5b21b6',
      accent: '#ec4899',
      background: '#faf5ff',
      text: '#1e1b4b',
      textSecondary: '#6b7280',
    },
    fonts: {
      heading: 'Montserrat, sans-serif',
      body: 'Open Sans, sans-serif',
    },
    styles: {
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      spacing: '32px',
    },
  },
  {
    name: 'Business',
    description: 'Professional and trustworthy design',
    colors: {
      primary: '#1e293b',
      secondary: '#334155',
      accent: '#0ea5e9',
      background: '#ffffff',
      text: '#0f172a',
      textSecondary: '#475569',
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Roboto, sans-serif',
    },
    styles: {
      borderRadius: '6px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      spacing: '20px',
    },
  },
  {
    name: 'Portfolio',
    description: 'Elegant design perfect for showcasing work',
    colors: {
      primary: '#000000',
      secondary: '#404040',
      accent: '#ff6b6b',
      background: '#ffffff',
      text: '#000000',
      textSecondary: '#666666',
    },
    fonts: {
      heading: 'Helvetica, sans-serif',
      body: 'Helvetica, sans-serif',
    },
    styles: {
      borderRadius: '0px',
      boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
      spacing: '40px',
    },
  },
]

// Apply theme to website settings
export function applyThemeToWebsite(theme: ThemePreset) {
  return {
    colors: theme.colors,
    fonts: theme.fonts,
    styles: theme.styles,
    themeName: theme.name,
  }
}

// Get theme by name
export function getThemeByName(name: string): ThemePreset | undefined {
  return THEME_PRESETS.find(theme => theme.name.toLowerCase() === name.toLowerCase())
}

// Generate CSS variables from theme
export function generateThemeCSS(theme: ThemePreset): string {
  return `
    :root {
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-accent: ${theme.colors.accent};
      --color-background: ${theme.colors.background};
      --color-text: ${theme.colors.text};
      --color-text-secondary: ${theme.colors.textSecondary};
      --font-heading: ${theme.fonts.heading};
      --font-body: ${theme.fonts.body};
      --border-radius: ${theme.styles.borderRadius};
      --box-shadow: ${theme.styles.boxShadow};
      --spacing: ${theme.styles.spacing};
    }
  `
}
