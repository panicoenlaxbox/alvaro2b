import { describe, expect, it } from "vitest";
import { attachmentPath, checkAttachmentFile, formatBytes, linkLabel, parseAttachmentLink } from "./attachments";

describe("parseAttachmentLink", () => {
  it("accepts http and https links", () => {
    expect(parseAttachmentLink(" https://example.com/tool?x=1 ")).toBe("https://example.com/tool?x=1");
    expect(parseAttachmentLink("http://example.com")).toBe("http://example.com/");
  });
  it("adds https to a bare address", () => expect(parseAttachmentLink("www.example.com/faq")).toBe("https://www.example.com/faq"));
  it("rejects other schemes and garbage", () => {
    expect(parseAttachmentLink("javascript:alert(1)")).toBeNull();
    expect(parseAttachmentLink("ftp://example.com")).toBeNull();
    expect(parseAttachmentLink("not a link")).toBeNull();
    expect(parseAttachmentLink("")).toBeNull();
  });
});

describe("linkLabel", () => {
  it("shows the host and path without www or trailing slash", () => {
    expect(linkLabel("https://www.example.com/")).toBe("example.com");
    expect(linkLabel("https://example.com/tools/hex-calculator?x=1")).toBe("example.com/tools/hex-calculator");
  });
  it("shortens long paths", () => expect(linkLabel(`https://example.com/${"a".repeat(80)}`).length).toBeLessThanOrEqual(60));
});

describe("attachmentPath", () => {
  it("keeps the extension and a safe name under the Game", () => {
    expect(attachmentPath("game-1", "FAQ oficial (v2).PDF", "id-1")).toBe("games/game-1/id-1-faq-oficial-v2.pdf");
    expect(attachmentPath("game-1", "Ayuda de juego ñ.txt", "id-2")).toBe("games/game-1/id-2-ayuda-de-juego-n.txt");
    expect(attachmentPath("game-1", "...", "id-3")).toBe("games/game-1/id-3-file");
  });
});

describe("checkAttachmentFile", () => {
  it("accepts documents and images up to 20 MB", () => {
    expect(checkAttachmentFile({ type: "application/pdf", size: 1000 })).toBeNull();
    expect(checkAttachmentFile({ type: "image/png", size: 20 * 1024 * 1024 })).toBeNull();
  });
  it("rejects other types and big files", () => {
    expect(checkAttachmentFile({ type: "text/html", size: 10 })).toMatch(/tipo/);
    expect(checkAttachmentFile({ type: "application/pdf", size: 20 * 1024 * 1024 + 1 })).toMatch(/20 MB/);
  });
});

describe("formatBytes", () => {
  it("uses KB and MB", () => {
    expect(formatBytes(900)).toBe("1 KB");
    expect(formatBytes(2_500_000)).toBe("2,4 MB");
  });
});
