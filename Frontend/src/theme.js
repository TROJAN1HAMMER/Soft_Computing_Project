// src/theme.js

import { createTheme } from "@mui/material/styles";

const getTheme = (mode) => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      ...(isDark
        ? {
            // --- Dark Mode (Modern Calming Teal) ---
            primary: {
              main: "#64dfdf", // aqua-teal accent
              light: "#80ffdb",
              dark: "#56cfe1",
            },
            secondary: {
              main: "#f3a6ff", // soft violet accent
            },
            background: {
              default: "#0f172a", // deep slate-blue background
              paper: "#1e293b", // card color
            },
            text: {
              primary: "#e2e8f0", // light text
              secondary: "#94a3b8", // muted gray-blue
            },
          }
        : {
            // --- Light Mode (Warm + Soothing) ---
            primary: {
              main: "#0096c7", // soft ocean blue
              light: "#48cae4",
              dark: "#0077b6",
            },
            secondary: {
              main: "#ffb4a2", // blush peach accent
            },
            background: {
              default: "#f7f9fc", // very light gray-blue background
              paper: "#ffffff", // pure card white
            },
            text: {
              primary: "#1e293b", // dark navy text
              secondary: "#64748b", // muted gray-blue
            },
          }),
    },

    typography: {
      fontFamily: "Inter, 'Plus Jakarta Sans', sans-serif",
      h1: { fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontWeight: 700, letterSpacing: "-0.01em" },
      h3: { fontWeight: 600 },
      button: { fontWeight: 600 },
      body1: { lineHeight: 1.6 },
    },

    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? "0 4px 20px rgba(0, 0, 0, 0.4)"
              : "0 4px 20px rgba(0, 0, 0, 0.08)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: isDark
                ? "0 6px 24px rgba(0, 0, 0, 0.6)"
                : "0 6px 24px rgba(0, 0, 0, 0.12)",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "none",
            transition: "all 0.25s ease",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            marginBottom: 8,
            backgroundColor: isDark ? "#1e293b" : "#f9fafb",
            "&:before": { display: "none" },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background:
              isDark
                ? "linear-gradient(90deg, #0f172a, #1e293b)"
                : "linear-gradient(90deg, #48cae4, #00b4d8)",
            boxShadow: "none",
          },
        },
      },
    },
  });
};

export default getTheme;
