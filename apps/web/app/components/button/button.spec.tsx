import { test, expect } from "@playwright/experimental-ct-react";
import { Button } from "./button";

test.use({ viewport: { width: 1280, height: 720 } });

test("should work", async ({ page, mount }) => {
  await mount(<Button>Click me</Button>);

  const button = await page.getByRole("button", { name: "Click me" });

  await expect(button).toContainText("Click me");
});
