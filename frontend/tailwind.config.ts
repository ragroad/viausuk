import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00C795',
          dark:    '#007D5C',
          light:   '#E0FDF6',
          deep:    '#0B1B18',
        },
      },
      fontFamily: {
        sans: ['-apple-system','BlinkMacSystemFont','Inter','sans-serif'],
        mono: ['SF Mono','Fira Code','monospace'],
      },
      borderRadius: { DEFAULT: '10px', sm: '7px', lg: '16px' },
    },
  },
  plugins: [],
} satisfies Config;
