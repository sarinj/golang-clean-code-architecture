import { test, expect } from "@playwright/test";

import { createAccount } from "./helpers";

test("mobile navigation, data views, and sign-out work without page overflow", async ({
  page,
}) => {
  await createAccount(page.request);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Workspace overview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("link", { name: "Users", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Users", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "View schema" }).click();
  await expect(page.getByRole("dialog")).toContainText('"email"');
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});
