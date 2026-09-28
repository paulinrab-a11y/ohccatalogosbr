/** OHC Motors design tokens */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ohc: { blue: '#214FA1', blueDeep: '#153A7A', glow: '#3B7BFF', red: '#ED1C24', bg: '#0B0D11', bg2: '#12151B', line: '#262B33', steel: '#9AA6B8', text: '#EEF1F4' } },
      fontFamily: { display: ['"Bebas Neue"', 'Impact', 'sans-serif'], body: ['Montserrat', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
