import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * The shared title + description + optional action row every non-hub
 * page opens with. Kept deliberately simple (no back-link, unlike
 * `ReportHeader`) since most pages reach their parent via the sidebar,
 * not a breadcrumb.
 */
function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
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
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Box>
  );
}

export { PageHeader };
