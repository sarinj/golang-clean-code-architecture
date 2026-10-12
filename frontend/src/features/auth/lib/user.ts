import type { User } from "@/features/auth/schemas/auth";

export function displayName(user: User): string {
  return (
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
  );
}

export function initials(user: User): string {
  const name = [user.first_name, user.last_name].filter(Boolean);
  return name.length > 0
    ? name
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email.slice(0, 2).toUpperCase();
}
