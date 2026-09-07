import type { ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { NavLinkText } from "@/components/shared/nav-link-text";

type ReportHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

/** The shared header every `/reports/*` page opens with - title,
 * one-line description, and a way back to the report index. */
function ReportHeader({ title, description, action }: ReportHeaderProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <NavLinkText
        href="/reports"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          fontSize: "0.875rem",
          color: "text.secondary",
          "&:hover": { color: "text.primary" },
        }}
      >
        <ArrowLeftIcon aria-hidden size={14} />
        Reports
      </NavLinkText>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        {action}
      </Box>
    </Box>
  );
}

export { ReportHeader };
