/** Published URLs use UTC dates; display the same date on every build host. */
export function postDateLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}
