import { test, expect } from "@playwright/test";

import { createAccount } from "./helpers";

test("mobile navigation, sidebar profile, data views, and sign-out work without page overflow", async ({
  page,
}) => {
  await createAccount(page.request);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Mobile navigation", exact: true })
      .getByRole("link"),
  ).toHaveText(["Overview", "Users", "Permissions", "Sessions"]);
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
  await expect(page.getByRole("button", { name: "View schema" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("link", { name: "View your profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Personal information" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});
