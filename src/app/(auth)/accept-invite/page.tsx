"use client";

import { BoxesIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";

import { AcceptInviteForm } from "@/features/auth/components/accept-invite-form";
import { FeatureList } from "@/features/auth/components/feature-list";
import { SceneLoader } from "@/components/three/scene-loader";

export default function AcceptInvitePage() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3, lg: 5 },
        py: 5,
        bgcolor: "background.default",
      }}
    >
      <Fade in timeout={400}>
        <Paper
          elevation={3}
          sx={{
            position: "relative",
            display: "flex",
            width: "100%",
            maxWidth: 1024,
            minHeight: { lg: 600 },
            flexDirection: { xs: "column", lg: "row" },
            overflow: "hidden",
            borderRadius: 4,
          }}
        >
          <Box
            sx={{
              position: "relative",
              display: { xs: "none", lg: "flex" },
              width: "100%",
              maxWidth: 460,
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
              px: 5,
              py: 5,
              bgcolor: "background.default",
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
                background: (theme) =>
                  `linear-gradient(to top, ${theme.palette.background.default} 0%, ${theme.palette.background.default}66 45%, transparent 70%)`,
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
                sx={{
                  display: "flex",
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                }}
              >
                <BoxesIcon aria-hidden size={18} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ForkStock
              </Typography>
              <Chip
                label="WAREHOUSE OS"
                size="small"
                sx={{
                  fontFamily: "var(--font-roboto-mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.08em",
                }}
              />
            </Box>

            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 500,
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                Find the right part, know whether you have it, and know exactly
                where it is.
              </Typography>
              <FeatureList />
            </Box>

            <Typography
              variant="caption"
              sx={{ position: "relative", zIndex: 1, color: "text.secondary" }}
            >
              Forklift spare-parts inventory &amp; warehouse management
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              alignItems: { xs: "center", lg: "flex-start" },
              justifyContent: "center",
              px: { xs: 3, sm: 5, lg: 7 },
              py: { xs: 6, lg: 5 },
              borderLeft: { lg: 1 },
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                width: "100%",
                maxWidth: 380,
                flexDirection: "column",
                alignItems: { xs: "center", lg: "flex-start" },
                gap: 1,
                pb: 3,
                textAlign: { xs: "center", lg: "left" },
              }}
            >
              <Box
                sx={{
                  display: { xs: "flex", lg: "none" },
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 3,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  mb: 1,
                }}
              >
                <BoxesIcon aria-hidden size={20} />
              </Box>
              <Typography
                variant="overline"
                sx={{
                  color: "primary.main",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                }}
              >
                You&apos;ve been invited
              </Typography>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                Set your password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a password to finish setting up your ForkStock account.
              </Typography>
            </Box>

            <Box sx={{ width: "100%", maxWidth: 380 }}>
              <AcceptInviteForm />
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}
