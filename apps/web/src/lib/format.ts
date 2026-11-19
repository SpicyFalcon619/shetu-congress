const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function formatDate(iso: string): string {
  return fmt.format(new Date(`${iso}T00:00:00`));
}

export function weeksBetween(startIso: string, endIso: string): number {
  const ms = new Date(`${endIso}T00:00:00`).getTime() - new Date(`${startIso}T00:00:00`).getTime();
  return Math.max(1, Math.ceil((ms / 86_400_000 + 1) / 7));
}
