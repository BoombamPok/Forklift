import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VerificationBadge } from "@/components/shared/verification-badge";

describe("VerificationBadge", () => {
  it("labels a verified record clearly", () => {
    render(<VerificationBadge status="verified" />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("never lets unverified read as confirmed fact", () => {
    render(<VerificationBadge status="unverified" />);
    const badge = screen.getByText("Unverified");
    expect(badge).toBeInTheDocument();
    expect(badge.dataset.variant).not.toBe("success");
  });

  it("distinguishes uncertain from both verified and unverified", () => {
    render(<VerificationBadge status="uncertain" />);
    const badge = screen.getByText("Uncertain");
    expect(badge.dataset.variant).toBe("warning");
  });
});
