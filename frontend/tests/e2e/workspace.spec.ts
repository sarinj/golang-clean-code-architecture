import { test, expect } from "@playwright/test";

import { dataListSchema } from "@/features/data/schemas/data";
import { appOrigin, createAccount, password, uniqueEmail } from "./helpers";

test("registration, validation, login, profile, and logout connect to FastAPI", async ({
  page,
}) => {
  const email = uniqueEmail();
  await page.goto("/register");
  await page.getByLabel("First name", { exact: true }).fill("Jordan");
  await page.getByLabel("Last name", { exact: true }).fill("Lee");
  await page.getByLabel("Email address", { exact: true }).fill("invalid-email");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill("different");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Your passwords do not match.")).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?registered=1$/);
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Workspace overview", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Hello, Jordan Lee.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "My profile", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Personal information" }),
  ).toBeVisible();
  await expect(page.getByText(email, { exact: true }).last()).toBeVisible();
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  expect((await page.request.get("/api/auth/profile")).status()).toBe(401);
});

test("invalid credentials and duplicate registration produce useful errors", async ({
  page,
}) => {
  const user = await createAccount(page.request);
  const duplicate = await page.request.post("/api/auth/register", {
    headers: { Origin: appOrigin },
    data: { email: user.email, password },
  });
  expect(duplicate.status()).toBe(409);
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "email or password is invalid" }),
  ).toContainText("email or password is invalid");
});

test("private routes and mutating routes enforce their boundaries", async ({
  request,
}) => {
  expect((await request.get("/api/data/users")).status()).toBe(401);
  const crossOrigin = await request.post("/api/auth/login", {
    headers: { Origin: "https://example.org" },
    data: { email: "user@example.com", password },
  });
  expect(crossOrigin.status()).toBe(403);
  expect((await request.post("/api/auth/logout")).status()).toBe(403);
  const invalid = await request.post("/api/auth/register", {
    headers: { Origin: appOrigin },
    data: { email: "invalid", password },
  });
  expect(invalid.status()).toBe(400);
  expect((await request.get("/api/data/unknown")).status()).toBe(404);
});

test("protected data renders on the server even with JavaScript disabled", async ({
  page,
  browser,
}) => {
  const user = await createAccount(page.request);
  const context = await browser.newContext({
    javaScriptEnabled: false,
    storageState: await page.context().storageState(),
  });
  try {
    const serverPage = await context.newPage();
    await serverPage.goto(`${appOrigin}/profile`);
    await expect(
      serverPage.getByRole("heading", { name: "Personal information" }),
    ).toBeVisible();
    await expect(
      serverPage.getByText(user.email, { exact: true }).last(),
    ).toBeVisible();
    await serverPage.goto(`${appOrigin}/data/users?page=1&pageSize=100`);
    await expect(serverPage.getByRole("table")).toBeVisible();
    await expect(
      serverPage.getByRole("cell", { name: user.email, exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("hydration reuses fresh server data and explicit refresh reaches the API", async ({
  page,
}) => {
  await createAccount(page.request);
  const fetches: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.pathname === "/api/data/users" ||
      url.pathname === "/api/auth/profile"
    )
      fetches.push(url.pathname);
  });
  await page.goto("/data/users");
  await page.getByRole("button", { name: "View schema" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(fetches).toEqual([]);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const refreshed = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/data/users" &&
      response.status() === 200,
  );
  await page.getByRole("button", { name: "Refresh records" }).click();
  await refreshed;
  expect(fetches).toContain("/api/data/users");
});

test("pagination, schema, details, and empty states use real resource data", async ({
  page,
}) => {
  await createAccount(page.request);
  for (let index = 0; index < 12; index += 1) {
    const response = await page.request.post("/api/auth/register", {
      headers: { Origin: appOrigin },
      data: { email: uniqueEmail(), password, first_name: `Reader ${index}` },
    });
    expect(response.status()).toBe(201);
  }
  await page.goto("/data/users");
  await expect(page.getByRole("row")).toHaveCount(11);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/page=2&pageSize=10$/);
  await expect(
    page.getByRole("status").filter({ hasText: "Page 2 of" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("status").filter({ hasText: "Page 2 of" }),
  ).toBeVisible();
  await page.getByLabel("Rows per page").selectOption("25");
  await expect(page).toHaveURL(/page=1&pageSize=25$/);
  await page.getByRole("button", { name: "View schema" }).click();
  const schema = page.getByRole("dialog");
  await expect(schema).toContainText('"email"');
  await expect(schema).not.toContainText('"password"');
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("link", { name: /^View record / })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Record details" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Permissions", exact: true }).click();
  await expect(
    page.getByText("No permissions yet", { exact: true }),
  ).toBeVisible();
});

test("HttpOnly cookies and token redaction protect JSON and server HTML", async ({
  page,
}) => {
  await createAccount(page.request);
  const cookies = (await page.context().cookies()).filter((cookie) =>
    cookie.name.startsWith("clean_api_"),
  );
  expect(cookies).toHaveLength(2);
  for (const cookie of cookies) {
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("Lax");
  }
  const response = await page.request.get("/api/data/user-tokens?pageSize=100");
  expect(response.status()).toBe(200);
  const body: unknown = await response.json();
  const records = dataListSchema.parse(body);
  for (const record of records.data) {
    expect(record.access).toBe("[redacted]");
    expect(record.refresh).toBe("[redacted]");
  }
  const html = await (await page.request.get("/data/user-tokens")).text();
  for (const cookie of cookies) {
    expect(JSON.stringify(body)).not.toContain(cookie.value);
    expect(html).not.toContain(cookie.value);
  }
  await page.goto("/data/user-tokens");
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "clean_api_",
  );
});

test("simultaneous tabs restore missing access cookies and preserve their destinations", async ({
  page,
}) => {
  await createAccount(page.request);
  const originalRefresh = (await page.context().cookies()).find(
    (cookie) => cookie.name === "clean_api_refresh",
  )?.value;
  await page.context().clearCookies({ name: "clean_api_access" });
  const second = await page.context().newPage();
  try {
    await Promise.all([
      page.goto("/data/users?page=2&pageSize=10"),
      second.goto("/profile"),
    ]);
    await expect(page).toHaveURL(/\/data\/users\?page=2&pageSize=10$/);
    await expect(
      second.getByRole("heading", { name: "Personal information" }),
    ).toBeVisible();
    expect((await page.request.get("/api/auth/profile")).status()).toBe(200);
    const rotated = (await page.context().cookies()).find(
      (cookie) => cookie.name === "clean_api_refresh",
    )?.value;
    expect(rotated).toBeTruthy();
    expect(rotated).not.toBe(originalRefresh);
  } finally {
    await second.close();
  }
});

test("a failed client refetch shows an error and can retry against FastAPI", async ({
  page,
}) => {
  await createAccount(page.request);
  await page.goto("/data/users");
  await expect(page.getByRole("table")).toBeVisible();
  await page.route("**/api/data/users?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Temporary service outage." }),
    }),
  );
  await page.getByRole("button", { name: "Refresh records" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Temporary service outage." }),
  ).toContainText("Temporary service outage.");
  await page.unroute("**/api/data/users?**");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
});
