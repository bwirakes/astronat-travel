/**
 * Convert a local birth date/time to a UTC Date using the timezone at the
 * birth coordinates. Appending "Z" to a local ISO string is WRONG — it treats
 * the local clock as UTC, which rotates the Ascendant by the tz offset (up to
 * ±12 hours → ±180° of house shift).
 *
 * Uses geo-tz for robust historical timezone lookup (handles DST + political
 * boundary changes at the birth epoch).
 */

export async function birthToUtc(
  birthDate: string,  // "YYYY-MM-DD"
  birthTime: string,  // "HH:MM" or "HH:MM:SS"
  birthLat: number,
  birthLon: number,
): Promise<Date> {
  const { find } = await import("geo-tz");
  const tzStr = find(birthLat, birthLon)[0];

  const time = birthTime.length === 5 ? birthTime + ":00" : birthTime;
  const localIso = `${birthDate}T${time}`;

  // Iteratively refine: treat as UTC, format in the target tz, measure drift,
  // subtract drift, repeat once more to handle DST edge cases.
  let dtUtc = new Date(`${localIso}Z`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tzStr,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });

  for (let i = 0; i < 2; i++) {
    const parts = formatter.formatToParts(dtUtc);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    let h = getPart("hour")!;
    if (h === "24") h = "00";

    const fLocal = new Date(
      `${getPart("year")}-${getPart("month")}-${getPart("day")}T${h}:${getPart("minute")}:${getPart("second")}Z`
    );
    const offset = fLocal.getTime() - dtUtc.getTime();
    dtUtc = new Date(new Date(`${localIso}Z`).getTime() - offset);
  }

  return dtUtc;
}
