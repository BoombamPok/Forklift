"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";
import { PackageSearchIcon, MapPinIcon, HistoryIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const FEATURES = [
  {
    icon: PackageSearchIcon,
    label: "Search every part, brand, and model at once",
  },
  { icon: MapPinIcon, label: "Exact rack, shelf, and box for every part" },
  { icon: HistoryIcon, label: "Full stock movement history, never silent" },
];

/**
 * Icon components can't cross the server/client boundary as props (they're
 * functions, not serializable), so the feature data lives here rather than
 * being passed in from the server-rendered login page. Renders motion.li
 * directly (rather than wrapping <li> in a motion.div) so the list keeps
 * valid <ul>/<li> semantics - axe-core flags a <div>-wrapped <li> as a
 * structure violation.
 *
 * The 01/02/03 markers this list used to carry are gone: numbered markers
 * mean "these happen in order", and these three are simultaneous
 * capabilities, not steps. Sits on the graphite panel, so it uses the
 * chassis tokens rather than the palette.
 */
function FeatureList() {
  return (
    <Box
      component={motion.ul}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        p: 0,
        m: 0,
        listStyle: "none",
      }}
    >
      {FEATURES.map(({ icon: Icon, label }) => (
        <Box
          component={motion.li}
          key={label}
          variants={itemVariants}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.75,
            py: 1.5,
            "& + &": { borderTop: "1px solid var(--chassis-hairline)" },
          }}
        >
          <Box
            aria-hidden
            sx={{
              display: "flex",
              width: 30,
              height: 30,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-chip)",
              border: "1px solid var(--chassis-hairline)",
              bgcolor: "var(--chassis-raised)",
              color: "var(--mui-palette-primary-main)",
            }}
          >
            <Icon size={15} />
          </Box>
          <Typography
            component="span"
            sx={{
              flex: 1,
              fontSize: "0.875rem",
              lineHeight: 1.45,
              color: "var(--chassis-muted)",
            }}
          >
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export { FeatureList };
