export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        vlearn: {
          blue: "#0f4f93",
          soft: "#eef6ff",
          line: "#d9e4f2",
          ink: "#172033",
          muted: "#64748b",
        },
      },
      boxShadow: {
        vlearn: "0 12px 32px rgba(15, 79, 147, 0.12)",
      },
    },
  },
  plugins: [],
};
