import { describe, expect, it } from "vitest";
import { getCountdown, padCountdownValue } from "./countdown";

const target = new Date("2026-09-27T03:00:00.000Z").getTime();
const zone = "America/Lima";

describe("getCountdown", () => {
  it("counts down to the Lima event instant", () => {
    const now = new Date("2026-09-06T03:00:00.000Z").getTime();
    expect(getCountdown(now, target, zone)).toMatchObject({
      months: 0,
      days: 21,
      hours: 0,
      minutes: 0,
      seconds: 0,
      arrived: false,
    });
  });

  it("keeps one second visible until the exact boundary", () => {
    expect(getCountdown(target - 1, target, zone)).toMatchObject({
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
      arrived: false,
    });
  });

  it("returns zero exactly at and after arrival", () => {
    expect(getCountdown(target, target, zone)).toMatchObject({
      totalSeconds: 0,
      arrived: true,
    });
    expect(getCountdown(target + 60_000, target, zone)).toMatchObject({
      totalSeconds: 0,
      arrived: true,
    });
  });

  it("uses calendar-aware months and clamps month ends", () => {
    const twoMonthsBefore = new Date("2026-07-27T03:00:00.000Z").getTime();
    expect(getCountdown(twoMonthsBefore, target, zone)).toMatchObject({
      months: 2,
      days: 0,
    });

    const monthEndTarget = new Date("2026-09-30T15:00:00.000Z").getTime();
    const monthEndStart = new Date("2026-08-31T15:00:00.000Z").getTime();
    expect(getCountdown(monthEndStart, monthEndTarget, zone)).toMatchObject({
      months: 1,
      days: 0,
    });
  });

  it("depends on the instant, not the visitor's written offset", () => {
    const fromPeru = new Date("2026-09-20T22:00:00-05:00").getTime();
    const fromEurope = new Date("2026-09-21T05:00:00+02:00").getTime();
    expect(getCountdown(fromPeru, target, zone)).toEqual(
      getCountdown(fromEurope, target, zone),
    );
  });
});

describe("padCountdownValue", () => {
  it("pads single digits without truncating larger values", () => {
    expect(padCountdownValue(4)).toBe("04");
    expect(padCountdownValue(125)).toBe("125");
  });
});
