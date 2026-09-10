import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "./safe-redirect";

describe("safeCallbackUrl", () => {
  it("accepts same-origin paths", () => {
    expect(safeCallbackUrl("/classes/vinyasa-flow?x=1")).toBe("/classes/vinyasa-flow?x=1");
  });

  it.each(["https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)", "/api/auth/signout", "/continue", 42, null])("rejects %s", (value) => {
    expect(safeCallbackUrl(value)).toBeNull();
  });
});
