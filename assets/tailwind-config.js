// Delt Tailwind-konfigurasjon for storefront-temaet.
// Fargepalett, typografi og spacing er identisk på tvers av alle sider.
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "tertiary-fixed": "#f1e0cf",
                "error-container": "#ffdad6",
                "on-secondary-container": "#3a7038",
                "surface-container-low": "#fbf2eb",
                "on-primary": "#ffffff",
                "background": "#fff8f4",
                "secondary-fixed": "#b5f2ac",
                "inverse-primary": "#ffb871",
                "deep-forest": "#1E421E",
                "primary-fixed": "#ffdcbe",
                "primary": "#8b5000",
                "tertiary": "#685c4f",
                "on-secondary": "#ffffff",
                "vibrant-orange": "#F8971D",
                "outline": "#877362",
                "surface-dim": "#e1d8d2",
                "surface-container-lowest": "#ffffff",
                "on-error-container": "#93000a",
                "outline-variant": "#dac2ae",
                "on-surface": "#1f1b17",
                "on-error": "#ffffff",
                "primary-container": "#f8971d",
                "error": "#ba1a1a",
                "warm-grey": "#F2EEE9",
                "on-primary-container": "#623700",
                "on-tertiary-fixed": "#221a10",
                "on-secondary-fixed": "#002203",
                "surface-container": "#f5ece5",
                "surface-variant": "#eae1da",
                "inverse-on-surface": "#f8efe8",
                "on-primary-fixed-variant": "#6a3c00",
                "surface-container-highest": "#eae1da",
                "secondary-container": "#b5f2ac",
                "inverse-surface": "#34302b",
                "tertiary-fixed-dim": "#d4c4b3",
                "on-tertiary-container": "#4a4033",
                "surface-cream": "#FCFAF7",
                "secondary": "#346a33",
                "on-tertiary": "#ffffff",
                "on-secondary-fixed-variant": "#1b511d",
                "tertiary-container": "#baab9b",
                "surface": "#fff8f4",
                "surface-tint": "#8b5000",
                "surface-bright": "#fff8f4",
                "on-surface-variant": "#544435",
                "surface-container-high": "#f0e7df",
                "secondary-fixed-dim": "#9ad592",
                "primary-fixed-dim": "#ffb871",
                "on-background": "#1f1b17",
                "on-tertiary-fixed-variant": "#504538",
                "on-primary-fixed": "#2d1600"
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
            spacing: {
                "section-gap": "80px",
                "gutter": "24px",
                "unit": "8px",
                "margin-desktop": "64px",
                "margin-mobile": "20px"
            },
            fontFamily: {
                "label-sm": ["Hanken Grotesk"],
                "headline-lg": ["Manrope"],
                "label-md": ["Hanken Grotesk"],
                "headline-xl-mobile": ["Manrope"],
                "body-lg": ["Manrope"],
                "body-md": ["Manrope"],
                "headline-md": ["Manrope"],
                "headline-xl": ["Manrope"]
            },
            fontSize: {
                "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
                "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "700" }],
                "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                "headline-xl-mobile": ["36px", { "lineHeight": "42px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
                "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
                "headline-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "800" }]
            }
        }
    }
};
