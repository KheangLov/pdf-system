import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const lightTheme = {
  dark: false,
  colors: {
    background: '#f6f7fb',
    surface: '#ffffff',
    'surface-bright': '#ffffff',
    'surface-light': '#f9fafb',
    'surface-variant': '#eef0f6',
    'on-surface-variant': '#4b5563',
    primary: '#6366f1',
    'primary-darken-1': '#4f46e5',
    secondary: '#0ea5e9',
    accent: '#8b5cf6',
    error: '#ef4444',
    info: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    'on-background': '#0f172a',
    'on-surface': '#0f172a',
    'on-primary': '#ffffff',
    border: '#e5e7eb'
  },
  variables: {
    'border-color': '#e5e7eb',
    'border-opacity': 1,
    'high-emphasis-opacity': 0.92,
    'medium-emphasis-opacity': 0.66,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#ffffff',
    'theme-code': '#f5f5f5',
    'theme-on-code': '#000000'
  }
}

const darkTheme = {
  dark: true,
  colors: {
    background: '#0b0d12',
    surface: '#11141b',
    'surface-bright': '#1a1e27',
    'surface-light': '#161922',
    'surface-variant': '#1d212c',
    'on-surface-variant': '#a3acc2',
    primary: '#818cf8',
    'primary-darken-1': '#6366f1',
    secondary: '#38bdf8',
    accent: '#a78bfa',
    error: '#f87171',
    info: '#38bdf8',
    success: '#34d399',
    warning: '#fbbf24',
    'on-background': '#e5e7eb',
    'on-surface': '#e5e7eb',
    'on-primary': '#ffffff',
    border: '#2a2f3c'
  },
  variables: {
    'border-color': '#2a2f3c',
    'border-opacity': 1
  }
}

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: { light: lightTheme, dark: darkTheme }
  },
  defaults: {
    VBtn: {
      style: 'text-transform:none; letter-spacing:0;',
      rounded: 'lg'
    },
    VCard: {
      rounded: 'lg',
      elevation: 0
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      hideDetails: 'auto'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      hideDetails: 'auto'
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      hideDetails: 'auto'
    },
    VChip: {
      rounded: 'md'
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  }
})
