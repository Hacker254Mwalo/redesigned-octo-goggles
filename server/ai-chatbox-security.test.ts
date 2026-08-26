import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const componentPath = resolve(process.cwd(), "client/src/components/AIChatBox.tsx");

describe("AIChatBox dependency safety", () => {
  it("keeps assistant content as React text rather than importing the removed Markdown renderer", () => {
    const source = readFileSync(componentPath, "utf8");

    expect(source).not.toMatch(/from\s+["']streamdown["']/i);
    expect(source).toContain('className="whitespace-pre-wrap text-sm"');
    expect(source).toContain("{message.content}");
  });
});
