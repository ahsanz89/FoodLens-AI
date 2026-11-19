/** Pull "10 minutes" / "5-6 min" out of a step if no explicit duration exists. */
export function stepMinutes(text: string, explicit?: number | null): number | null {
  if (explicit) return explicit;
  const m = text.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(minutes?|mins?)\b/i);
  return m ? Number(m[2] ?? m[1]) : null;
}
