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

/** Shared layout shell for Recharts content. */
function ChartContainer({
  title,
  description,
  action,
  sx,
  children,
}: ChartContainerProps) {
  return (
    <Card sx={sx}>
      <CardHeader
        title={<Typography variant="h6">{title}</Typography>}
        subheader={
          description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : undefined
        }
        action={action}
      />
      <CardContent sx={{ height: 256, pt: 0 }}>{children}</CardContent>
    </Card>
  );
}

export { ChartContainer };
