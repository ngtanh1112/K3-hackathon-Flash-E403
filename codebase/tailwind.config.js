export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        vlearn: {
          teal: "#0d7b8a",
          "teal-dark": "#0a6470",
          "teal-light": "#e6f4f6",
          "teal-soft": "#f0fafa",
          line: "#e2e8f0",
          ink: "#0f172a",
          muted: "#64748b",
          sidebar: "#f8fafc",
        },
      },
      boxShadow: {
        vlearn: "0 4px 16px rgba(13, 123, 138, 0.10)",
        toolbar: "0 2px 12px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};
