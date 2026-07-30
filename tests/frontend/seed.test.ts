import { describe, expect, it } from "vitest";
import { dashboardData, graphCurrent } from "../../lib/mock-data/seed";

describe("the demo fallback", () => {
  it("contains an explicit no-action check-in decision", () => {
    expect(dashboardData.checkIn.decision).toBe("NO_ACTION");
    expect(dashboardData.checkIn.reason).toContain("space");
  });

  it("keeps graph nodes traceable to evidence", () => {
    expect(graphCurrent.nodes.every((node) => node.evidenceIds.length > 0)).toBe(true);
  });
});
