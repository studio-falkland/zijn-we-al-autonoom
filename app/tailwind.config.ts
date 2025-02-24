import type { Config } from "tailwindcss";
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				'blue': {
					'50': '#f1f1f8',
					'100': '#E5E5FF',
					'200': '#9999FF',
					'300': '#85a8ff',
					'400': '#5676ff',
					'500': '#0000FF',
					'600': '#0c0eff',
					'700': '#0000C2',
					'800': '#0000AD',
					'900': '#000066',
					'950': '#0a0b5c',
				},
			},
			fontFamily: {
				'heading': ['Familjen Grotesk', ...defaultTheme.fontFamily.sans],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
