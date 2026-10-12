import type { DataRecord, JsonValue } from "@/features/data/schemas/data";

const secretFields = new Set([
  "password",
  "access",
  "refresh",
  "access_token",
  "refresh_token",
]);

export function isSecretField(name: string): boolean {
  return secretFields.has(name.toLowerCase());
}

export function redactSecrets(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        isSecretField(key) ? "[redacted]" : redactSecrets(item),
      ]),
    );
  }
  return value;
}

export function redactRecord(record: DataRecord): DataRecord {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      isSecretField(key) ? "[redacted]" : redactSecrets(value),
    ]),
  );
}

export function recordId(record: DataRecord): string | null {
  const value = record.id ?? record.ID;
  return typeof value === "number" || typeof value === "string"
    ? String(value)
    : null;
}

export function fieldLabel(name: string): string {
  if (name.toLowerCase() === "id") return "ID";
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (first) => first.toUpperCase());
}

export function displayValue(value: JsonValue | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    if (!Array.isArray(value) && typeof value.email === "string")
      return value.email;
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
