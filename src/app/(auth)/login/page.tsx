"use client";

import { BoxesIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { LoginForm } from "@/features/auth/components/login-form";
import { FeatureList } from "@/features/auth/components/feature-list";
import { SceneLoader } from "@/components/three/scene-loader";

/**
 * Full-bleed split rather than a floating card on a page.
 *
 * A centred card inside an empty background is the default sign-in
 * layout, and it wastes the whole screen to frame a 380px form. Running
 * the graphite panel to the edge does two things instead: it introduces
 * the chassis a person is about to spend all day inside, and it gives the
 * 3D scene somewhere it earns its weight - this is the one route with
 * nothing else competing for attention, and the only one where the
 * three.js chunk isn't taxing a working screen.
 *
 * The panel is hidden below lg, where the form is the entire job.
 */
export default function LoginPage() {
  return (
    <Box
      sx={{
        display: "grid",
        minHeight: "100dvh",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" },
        bgcolor: "background.default",
      }}
    >
      {/* --- Left: the chassis --------------------------------------- */}
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
        {/* Scrim so the copy keeps its contrast whatever the scene is
            doing behind it - the scene animates, the text must not. */}
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
            Find the right part, know whether you have it, and know exactly
            where it is.
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

      {/* --- Right: the form ----------------------------------------- */}
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
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Use the account your warehouse administrator set up for you.
          </Typography>

          <Box sx={{ mt: 3.5 }}>
            <LoginForm />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
