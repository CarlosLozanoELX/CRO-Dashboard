/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Futuristic Dark Palette
                'app-bg': '#050505',     // Almost black
                'card-bg': '#121212',    // Dark grey for cards
                'card-header': '#1E1E1E',

                // Neon Accents
                'neon-blue': '#00F0FF',
                'neon-pink': '#FF003C',
                'neon-yellow': '#FCEE0A',
                'neon-purple': '#BC13FE',
                'neon-green': '#0AFF99',

                // Semantic Colors (Futuristic twist)
                'success': '#0AFF99',
                'warning': '#FCEE0A',
                'error': '#FF003C',
                'info': '#00F0FF',

                // Text
                'text-primary': '#FFFFFF',
                'text-secondary': '#A1A1AA',
                'text-muted': '#52525B',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'], // Good for data/code
            },
            boxShadow: {
                'glow-blue': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
                'glow-pink': '0 0 10px rgba(255, 0, 60, 0.5), 0 0 20px rgba(255, 0, 60, 0.3)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            backdropBlur: {
                'xs': '2px',
            }
        },
    },
    plugins: [],
}
