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
 *
 * The date is set in mono: it is a value a storekeeper cross-references
 * against a docket or a movement timestamp, not prose.
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
        <Typography variant="h3" component="h2">
          Welcome back, {firstName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Stock levels, movements, and anything that needs attention today.
        </Typography>
      </Box>
      <Typography
        component="time"
        className="numeric"
        sx={{
          flexShrink: 0,
          fontSize: "0.75rem",
          color: "text.secondary",
        }}
      >
        {dateLabel}
      </Typography>
    </Box>
  );
}

export { DashboardGreeting };
