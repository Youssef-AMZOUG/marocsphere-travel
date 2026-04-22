/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        terracotta: {
                                50: '#FDF2F0',
                                100: '#FAE0DB',
                                200: '#F5C1B7',
                                300: '#EFA293',
                                400: '#E98A76',
                                500: '#E2725B',
                                600: '#D1654F',
                                700: '#B5503D',
                                800: '#8C3E30',
                                900: '#6B2F24',
                                950: '#3D1A14',
                        },
                        midnight: {
                                50: '#EFF3FB',
                                100: '#DCE4F5',
                                200: '#B9C9EB',
                                300: '#8AA6DD',
                                400: '#5B82CF',
                                500: '#1E3A5F',
                                600: '#1A3252',
                                700: '#152843',
                                800: '#111F34',
                                900: '#0C1525',
                        },
                        saffron: {
                                50: '#FFFBEB',
                                100: '#FEF3C7',
                                200: '#FDE68A',
                                300: '#FCD34D',
                                400: '#FBBF24',
                                500: '#D4A017',
                                600: '#B8860B',
                                700: '#92400E',
                        },
                        safety: {
                                safe: '#10B981',
                                caution: '#F59E0B',
                                avoid: '#EF4444',
                        },
                },
                fontFamily: {
                        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        'fade-up': {
                                '0%': { opacity: '0', transform: 'translateY(20px)' },
                                '100%': { opacity: '1', transform: 'translateY(0)' }
                        },
                        'fade-in': {
                                '0%': { opacity: '0' },
                                '100%': { opacity: '1' }
                        },
                        'slide-in-right': {
                                '0%': { opacity: '0', transform: 'translateX(20px)' },
                                '100%': { opacity: '1', transform: 'translateX(0)' }
                        },
                        'bounce-subtle': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-5px)' }
                        },
                        'pulse-soft': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0.7' }
                        },
                        'float': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-10px)' }
                        },
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'fade-up': 'fade-up 0.6s ease-out forwards',
                        'fade-in': 'fade-in 0.5s ease-out forwards',
                        'slide-in-right': 'slide-in-right 0.3s ease-out',
                        'bounce-subtle': 'bounce-subtle 2s infinite',
                        'pulse-soft': 'pulse-soft 2s infinite',
                        'float': 'float 6s ease-in-out infinite',
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
