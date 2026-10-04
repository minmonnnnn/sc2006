import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AvailabilityBadge } from "./AvailabilityBadge";

afterEach(() => {
  cleanup();
});

describe("AvailabilityBadge", () => {
  it("shows availability status and lot counts", () => {
    render(
      <AvailabilityBadge
        availableLots={60}
        totalLots={100}
        status="High"
        isStale={false}
      />,
    );

    expect(screen.getByText("High")).toBeTruthy();
    expect(screen.getByText("60 / 100 lots available")).toBeTruthy();
  });

  it("shows stale warning when data is outdated", () => {
    render(
      <AvailabilityBadge
        availableLots={20}
        totalLots={100}
        status="Moderate"
        isStale={true}
      />,
    );

    expect(screen.getByText("Availability data may be outdated")).toBeTruthy();
  });

  it("does not show stale warning for fresh data", () => {
    render(
      <AvailabilityBadge
        availableLots={20}
        totalLots={100}
        status="Moderate"
        isStale={false}
      />,
    );

    expect(screen.queryByText("Availability data may be outdated")).toBeNull();
  });

  it("shows unavailable status", () => {
    render(
      <AvailabilityBadge
        availableLots={0}
        totalLots={100}
        status="Unavailable"
        isStale={false}
      />,
    );

    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.getByText("0 / 100 lots available")).toBeTruthy();
  });
});
