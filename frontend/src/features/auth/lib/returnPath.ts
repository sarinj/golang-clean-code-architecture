const allowedPath =
  /^\/(?:dashboard|profile|data\/(?:users|user-tokens|user-permissions)(?:\/[1-9]\d{0,18})?)$/;

export function safeReturnPath(value: string | undefined): string {
  try {
    const url = new URL(value ?? "/dashboard", "http://internal.invalid");
    return url.origin === "http://internal.invalid" &&
      allowedPath.test(url.pathname)
      ? `${url.pathname}${url.search}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
