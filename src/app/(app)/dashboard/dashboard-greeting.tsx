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
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your inventory today.
        </p>
      </div>
      <p className="shrink-0 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {dateLabel}
      </p>
    </div>
  );
}

export { DashboardGreeting };
