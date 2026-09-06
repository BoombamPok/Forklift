import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

type ReportHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

/** The shared header every `/reports/*` page opens with - title,
 * one-line description, and a way back to the report index. */
function ReportHeader({ title, description, action }: ReportHeaderProps) {
  return (
    <div className="space-y-3">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Reports
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export { ReportHeader };
