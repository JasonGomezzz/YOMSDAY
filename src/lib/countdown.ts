export type CountdownValue = {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  arrived: boolean;
};

const ZERO_COUNTDOWN: CountdownValue = {
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalSeconds: 0,
  arrived: true,
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

function getZonedParts(timestamp: number, timeZone: string): ZonedParts {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
    millisecond: date.getUTCMilliseconds(),
  };
}

function toCalendarTimestamp(parts: ZonedParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
}

function addCalendarMonths(timestamp: number, months: number): number {
  const date = new Date(timestamp);
  const originalDay = date.getUTCDate();

  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);

  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();

  date.setUTCDate(Math.min(originalDay, lastDay));
  return date.getTime();
}

export function getCountdown(
  nowTimestamp: number,
  targetTimestamp: number,
  timeZone: string,
): CountdownValue {
  const absoluteDifference = targetTimestamp - nowTimestamp;

  if (absoluteDifference <= 0) {
    return ZERO_COUNTDOWN;
  }

  const nowLocal = toCalendarTimestamp(getZonedParts(nowTimestamp, timeZone));
  const targetLocal = toCalendarTimestamp(
    getZonedParts(targetTimestamp, timeZone),
  );
  const nowDate = new Date(nowLocal);
  const targetDate = new Date(targetLocal);

  let months =
    (targetDate.getUTCFullYear() - nowDate.getUTCFullYear()) * 12 +
    targetDate.getUTCMonth() -
    nowDate.getUTCMonth();

  months = Math.max(0, months);
  let anchor = addCalendarMonths(nowLocal, months);

  while (months > 0 && anchor > targetLocal) {
    months -= 1;
    anchor = addCalendarMonths(nowLocal, months);
  }

  let remainder = Math.max(0, Math.ceil((targetLocal - anchor) / 1000));
  const days = Math.floor(remainder / 86_400);
  remainder %= 86_400;
  const hours = Math.floor(remainder / 3_600);
  remainder %= 3_600;
  const minutes = Math.floor(remainder / 60);
  const seconds = remainder % 60;

  return {
    months,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: Math.ceil(absoluteDifference / 1000),
    arrived: false,
  };
}

export function padCountdownValue(value: number): string {
  return String(value).padStart(2, "0");
}
