import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type DashboardGreetingProps = {
  name: string;
};

/**
 * No time-of-day "Good morning/evening" text - this renders server-side
 * on whatever timezone the deployment runs in (not the viewer's), so it
 * would be confidently wrong for a good chunk of the day. A neutral
 * greeting avoids that without losing the personalization.
 */
function DashboardGreeting({ name }: DashboardGreetingProps) {
  const firstName = name.split(" ")[0];
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        justifyContent: "space-between",
        columnGap: 2,
        rowGap: 0.5,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          Welcome back, {firstName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Here&apos;s what&apos;s happening with your inventory today.
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{
          flexShrink: 0,
          fontFamily: "var(--font-roboto-mono)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {dateLabel}
      </Typography>
    </Box>
  );
}

export { DashboardGreeting };
