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
					'100': '#F1F1F8',
					'200': '#b3ccff',
					'300': '#85a8ff',
					'400': '#5676ff',
					'500': '#2f45ff',
					'600': '#0c0eff',
					'700': '#0000ff',
					'800': '#0609cd',
					'900': '#0000A1',
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
