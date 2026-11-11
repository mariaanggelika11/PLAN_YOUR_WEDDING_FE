/** Count calendar days rather than 24-hour intervals, including across timezone/DST changes. */
export function weddingDaysRemaining(value?: string | null, today = new Date()): number | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const event = new Date(Date.UTC(y, m - 1, d));
  if (event.getUTCFullYear() !== y || event.getUTCMonth() !== m - 1 || event.getUTCDate() !== d)
    return null;
  return Math.round(
    (event.getTime() - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000,
  );
}
