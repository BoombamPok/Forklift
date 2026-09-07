"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";
import { PackageSearchIcon, MapPinIcon, HistoryIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

const FEATURES = [
  {
    icon: PackageSearchIcon,
    label: "Fast search across parts, brands, and models",
  },
  { icon: MapPinIcon, label: "Exact warehouse location for every part" },
  { icon: HistoryIcon, label: "Full stock movement history, never silent" },
];

/**
 * Icon components can't cross the server/client boundary as props (they're
 * functions, not serializable), so the feature data lives here rather than
 * being passed in from the server-rendered login page. Renders motion.li
 * directly (rather than wrapping <li> in a motion.div) so the list keeps
 * valid <ul>/<li> semantics - axe-core flags a <div>-wrapped <li> as a
 * structure violation.
 */
function FeatureList() {
  return (
    <Box
      component={motion.ul}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      sx={{ display: "flex", flexDirection: "column", gap: 1.25, p: 0, m: 0 }}
    >
      {FEATURES.map(({ icon: Icon, label }, index) => (
        <Box
          component={motion.li}
          key={label}
          variants={itemVariants}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: (theme) => alpha(theme.palette.common.white, 0.6),
            px: 1.5,
            py: 1.25,
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: 28,
              height: 28,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            }}
          >
            <Icon aria-hidden size={14} />
          </Box>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "var(--font-roboto-mono)",
              letterSpacing: "0.1em",
              color: "text.disabled",
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export { FeatureList };
