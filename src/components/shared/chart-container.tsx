import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

type ChartContainerProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
  children: React.ReactNode;
};

/**
 * Shared layout shell for Recharts content.
 *
 * The header is separated from the plot by a rule rather than by empty
 * space: charts have their own internal whitespace, and without a hard
 * edge the title tends to float and read as part of the plot area.
 */
function ChartContainer({
  title,
  description,
  action,
  sx,
  children,
}: ChartContainerProps) {
  return (
    <Card sx={{ display: "flex", flexDirection: "column", ...sx }}>
      <CardHeader
        title={<Typography variant="h6">{title}</Typography>}
        subheader={
          description ? (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          ) : undefined
        }
        action={action}
        sx={{ pb: 1.5, borderBottom: "1px solid var(--rule)" }}
      />
      <CardContent sx={{ flex: 1, height: 244, pt: 2 }}>{children}</CardContent>
    </Card>
  );
}

export { ChartContainer };
