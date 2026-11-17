export default {
  "content": [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  "theme": {
    "spacing": {
      "0": "0px",
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "6": "24px",
      "8": "32px",
      "10": "40px",
      "12": "48px",
      "16": "64px",
      "20": "80px",
      "24": "96px",
      "0.5": "2px"
    },
    "extend": {
      "fontFamily": {
        "sans": [
          "Geist",
          "sans-serif"
        ]
      },
      "colors": {
        "brand": {
          "50": "#edf3ff",
          "100": "#e4ecff",
          "500": "#2458cf",
          "600": "#1d47a8",
          "900": "#172b4d"
        },
        "ink": "#172b4d",
        "muted": "#5b6b83"
      },
      "fontSize": {
        "xs": [
          "12px",
          {
            "lineHeight": "16px"
          }
        ],
        "sm": [
          "14px",
          {
            "lineHeight": "20px"
          }
        ],
        "base": [
          "16px",
          {
            "lineHeight": "24px"
          }
        ],
        "lg": [
          "18px",
          {
            "lineHeight": "28px"
          }
        ],
        "xl": [
          "20px",
          {
            "lineHeight": "28px"
          }
        ],
        "2xl": [
          "24px",
          {
            "lineHeight": "32px"
          }
        ],
        "3xl": [
          "30px",
          {
            "lineHeight": "36px"
          }
        ],
        "4xl": [
          "36px",
          {
            "lineHeight": "40px"
          }
        ],
        "5xl": [
          "48px",
          {
            "lineHeight": "48px"
          }
        ],
        "6xl": [
          "60px",
          {
            "lineHeight": "60px"
          }
        ]
      },
      "borderRadius": {
        "sm": "4px",
        "DEFAULT": "8px",
        "lg": "8px",
        "xl": "12px",
        "2xl": "16px",
        "3xl": "24px"
      },
      "transitionTimingFunction": {
        "out": "cubic-bezier(0.22,1,0.36,1)"
      },
      "transitionDuration": {
        "300": "300ms",
        "500": "500ms",
        "650": "650ms"
      },
      "boxShadow": {
        "soft": "0 2px 4px #1c3b6b04,0 8px 24px #1c3b6b06"
      }
    }
  },
  "plugins": []
};
