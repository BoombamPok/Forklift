"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";
import { PackageSearchIcon, MapPinIcon, HistoryIcon } from "lucide-react";

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

type FeatureListProps = {
  className?: string;
};

/**
 * Icon components can't cross the server/client boundary as props (they're
 * functions, not serializable), so the feature data lives here rather than
 * being passed in from the server-rendered login page. Renders motion.li
 * directly (rather than wrapping <li> in a motion.div) so the list keeps
 * valid <ul>/<li> semantics - axe-core flags a <div>-wrapped <li> as a
 * structure violation.
 */
function FeatureList({ className }: FeatureListProps) {
  return (
    <motion.ul
      className={className}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {FEATURES.map(({ icon: Icon, label }, index) => (
        <motion.li
          key={label}
          className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 text-sm text-sidebar-foreground/80"
          variants={itemVariants}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
            <Icon aria-hidden className="size-3.5 text-sidebar-primary" />
          </span>
          <span className="flex-1">{label}</span>
          <span className="font-mono text-[10px] tracking-widest text-sidebar-foreground/35">
            {String(index + 1).padStart(2, "0")}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export { FeatureList };
