const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "America/Bogota",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Bogota",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "America/Bogota",
});

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMatchDate(date: string, time?: string) {
  if (!date) return "";

  const dateTime = time ? `${date}T${time}` : `${date}T00:00:00`;
  const parsed = new Date(`${dateTime}-05:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  const parts = (time ? DATE_TIME_FORMATTER : DATE_FORMATTER).formatToParts(parsed);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const day = `${titleCase(values.weekday ?? "")} ${values.day ?? ""} ${values.month ?? ""}`;

  if (!time) return day;
  const formattedTime = TIME_FORMATTER.format(parsed).toUpperCase();
  return `${day} ${formattedTime}`;
}
