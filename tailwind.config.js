/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['Source Code Pro', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Figma-extracted Smart Routing tokens
        sidenav: {
          DEFAULT: '#182230',
          active: '#3d6ede',
        },
        topbar: {
          DEFAULT: '#f0f2f5',
          pill: '#ebedef',
          'pill-border': '#e3e5e7',
        },
        brand: {
          blue: '#1c73e8',
          'blue-hover': '#1862c7',
          'blue-deep': '#134ea0',
          'blue-light': '#e8f0fe',
        },
        ink: {
          DEFAULT: '#101828',
          muted: '#667085',
          subtle: '#475467',
          label: '#344054',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f9fafb',
          hover: '#f2f4f7',
          border: '#e4e7ec',
          'border-strong': '#d0d5dd',
        },
        success: {
          DEFAULT: '#15be53',
          text: '#108c3d',
          soft: '#ecfdf3',
        },
        warning: {
          DEFAULT: '#f79009',
          text: '#b54708',
          soft: '#fef0c7',
        },
        danger: {
          DEFAULT: '#d92d20',
          text: '#912018',
          soft: '#fee4e2',
        },
        // Channel identity colors (used across charts + pills)
        channel: {
          sms: '#1570ef',
          rcs: '#7839ee',
          tc: '#12b76a',
          viber: '#8a3ffc',
          fallback: '#667085',
        },
      },
      boxShadow: {
        ambient: '0px 3px 6px rgba(23,23,23,0.06)',
        standard: '0px 15px 35px rgba(23,23,23,0.08)',
        card: '0px 1px 2px rgba(16,24,40,0.06), 0px 1px 3px rgba(16,24,40,0.10)',
        elevated: '0px 30px 45px -30px rgba(50,50,93,0.25), 0px 18px 36px -18px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        micro: '1px',
        std: '4px',
        comfortable: '5px',
        relaxed: '6px',
        large: '8px',
        xl: '12px',
      },
      fontSize: {
        'display-hero': ['3.50rem', { lineHeight: '1.03', letterSpacing: '-1.4px', fontWeight: '600' }],
        'display-lg': ['3.00rem', { lineHeight: '1.15', letterSpacing: '-0.96px', fontWeight: '600' }],
        'page-title': ['1.50rem', { lineHeight: '1.20', letterSpacing: '-0.4px', fontWeight: '600' }],
        'section-heading': ['1.25rem', { lineHeight: '1.25', letterSpacing: '-0.2px', fontWeight: '600' }],
        'sub-heading': ['1.00rem', { lineHeight: '1.30', fontWeight: '600' }],
        'body-lg': ['1.00rem', { lineHeight: '1.45', fontWeight: '400' }],
        body: ['0.88rem', { lineHeight: '1.45', fontWeight: '400' }],
        button: ['0.88rem', { lineHeight: '1.00', fontWeight: '500' }],
        'button-sm': ['0.81rem', { lineHeight: '1.00', fontWeight: '500' }],
        link: ['0.88rem', { lineHeight: '1.00', fontWeight: '500' }],
        caption: ['0.75rem', { lineHeight: '1.33', fontWeight: '400' }],
        micro: ['0.63rem', { lineHeight: '1.15', letterSpacing: '0.1px', fontWeight: '400' }],
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        sidenav: '80px',
        topbar: '56px',
      },
    },
  },
  plugins: [],
}
