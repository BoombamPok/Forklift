"use client";

import { BoxesIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { LoginForm } from "@/features/auth/components/login-form";

/**
 * Material's own sign-in pattern: a single centred card on the page
 * canvas, brand mark above the heading, form filling the card, one
 * primary action.
 *
 * The previous version was a full-bleed two-column split with a 3D scene
 * filling half the viewport. It looked like a marketing page for a
 * product you had not bought yet - which is the wrong note for a screen
 * that a storekeeper hits every morning and wants to be through in four
 * seconds. Everything that isn't the form is gone: no feature list
 * selling the app to someone already using it, no WebGL chunk on the
 * critical path, no decorative half-screen.
 *
 * What's left is deliberately small: 420px, vertically centred, with the
 * card's own hairline doing the framing.
 */
export default function LoginPage() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        px: 2,
        py: 6,
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: "flex",
            width: 34,
            height: 34,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9px",
            bgcolor: "var(--signal-display)",
            color: "#1A0E07",
          }}
        >
          <BoxesIcon size={19} strokeWidth={2.4} />
        </Box>
        <Box>
          <Typography
            component="span"
            sx={{
              display: "block",
              fontSize: "1.125rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            ForkStock
          </Typography>
          <Typography
            component="span"
            sx={{
              display: "block",
              fontSize: "0.75rem",
              lineHeight: 1.3,
              color: "text.secondary",
            }}
          >
            Spare parts &amp; stores
          </Typography>
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: "var(--radius-sheet)",
          px: { xs: 3, sm: 4 },
          py: { xs: 3.5, sm: 4 },
          // The one place a real shadow is worth spending: this card is
          // the only object on the page, and a flat rectangle on a flat
          // canvas has nothing to separate it from the background.
          boxShadow: "0 1px 2px rgba(15,22,36,0.04), 0 12px 32px rgba(15,22,36,0.07)",
          animation: "instrument-in 420ms var(--ease-out) both",
        }}
      >
        <Typography variant="h4" component="h1">
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Use the account your warehouse administrator set up for you.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <LoginForm />
        </Box>
      </Paper>

      <Typography
        component="p"
        sx={{ fontSize: "0.75rem", color: "text.disabled", textAlign: "center" }}
      >
        Forklift spare-parts inventory &amp; warehouse management
      </Typography>
    </Box>
  );
}
