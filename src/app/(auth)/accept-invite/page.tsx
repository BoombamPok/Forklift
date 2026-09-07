"use client";

import { BoxesIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { AcceptInviteForm } from "@/features/auth/components/accept-invite-form";

/**
 * Same centred card as /login, deliberately. A person following an invite
 * link lands here first and sees the sign-in screen on every visit after
 * that; two different layouts for the same moment makes the product feel
 * assembled from parts.
 *
 * Only the copy differs - this is a first-run screen, so it says what is
 * about to happen rather than asking for credentials.
 */
export default function AcceptInvitePage() {
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
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
        <Typography
          component="span"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          ForkStock
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: "var(--radius-sheet)",
          px: { xs: 3, sm: 4 },
          py: { xs: 3.5, sm: 4 },
          boxShadow:
            "0 1px 2px rgba(15,22,36,0.04), 0 12px 32px rgba(15,22,36,0.07)",
          animation: "instrument-in 420ms var(--ease-out) both",
        }}
      >
        <Typography variant="h4" component="h1">
          Set your password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Choose a password to finish setting up your ForkStock account.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <AcceptInviteForm />
        </Box>
      </Paper>
    </Box>
  );
}
