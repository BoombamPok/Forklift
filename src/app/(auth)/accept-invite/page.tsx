"use client";

import { BoxesIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { AcceptInviteForm } from "@/features/auth/components/accept-invite-form";
import { FeatureList } from "@/features/auth/components/feature-list";
import { SceneLoader } from "@/components/three/scene-loader";

/**
 * Same full-bleed split as /login, deliberately - a person following an
 * invite link lands here first and then sees the sign-in screen on every
 * subsequent visit. Two different layouts for the same moment makes the
 * product feel assembled from parts.
 *
 * The copy is the only difference: this is a first-run screen, so it says
 * what is about to happen rather than asking for credentials.
 */
export default function AcceptInvitePage() {
  return (
    <Box
      sx={{
        display: "grid",
        minHeight: "100dvh",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" },
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          px: 7,
          py: 6,
          bgcolor: "var(--chassis)",
        }}
      >
        <SceneLoader
          variant="login"
          posterTone="dual"
          sx={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(to top, var(--chassis) 8%, color-mix(in srgb, var(--chassis) 72%, transparent) 52%, color-mix(in srgb, var(--chassis) 30%, transparent) 100%)",
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
          }}
        >
          <Box
            aria-hidden
            sx={{
              display: "flex",
              width: 30,
              height: 30,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "7px",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <BoxesIcon size={17} strokeWidth={2.2} />
          </Box>
          <Typography
            component="span"
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--chassis-text)",
            }}
          >
            ForkStock
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxWidth: 460,
          }}
        >
          <Typography
            variant="h2"
            component="p"
            sx={{ color: "var(--chassis-text)", textWrap: "balance" }}
          >
            Everything your stores team needs to find a part and account for
            it.
          </Typography>
          <FeatureList />
        </Box>

        <Typography
          component="p"
          sx={{
            position: "relative",
            zIndex: 1,
            fontSize: "0.75rem",
            color: "var(--chassis-faint)",
          }}
        >
          Forklift spare-parts inventory &amp; warehouse management
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 3, sm: 6 },
          py: { xs: 6, lg: 5 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 392, mx: "auto" }}>
          <Box
            aria-hidden
            sx={{
              display: { xs: "flex", lg: "none" },
              width: 38,
              height: 38,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-control)",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              mb: 2.5,
            }}
          >
            <BoxesIcon size={19} strokeWidth={2.2} />
          </Box>

          <Typography variant="h3" component="h1">
            Set your password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose a password to finish setting up your ForkStock account.
          </Typography>

          <Box sx={{ mt: 3.5 }}>
            <AcceptInviteForm />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
