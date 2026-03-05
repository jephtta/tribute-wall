import { nanoid } from "nanoid";

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 30);
  const suffix = nanoid(5);
  return `${base}-${suffix}`;
}
