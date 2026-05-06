import {
  AUTH_ENTRY_PREFIXES,
  PROTECTED_PREFIXES,
  config,
  isAuthEntryPath,
  isProtectedPath,
  startsWithPath,
} from "@/proxy";

describe("proxy path predicates", () => {
  describe("startsWithPath", () => {
    it("matches the exact prefix", () => {
      expect(startsWithPath("/dashboard", "/dashboard")).toBe(true);
    });

    it("matches a child segment", () => {
      expect(startsWithPath("/dashboard/settings", "/dashboard")).toBe(true);
    });

    it("does not match a sibling that shares the prefix string", () => {
      expect(startsWithPath("/dashboardx", "/dashboard")).toBe(false);
      expect(startsWithPath("/login-help", "/login")).toBe(false);
    });
  });

  describe("isProtectedPath", () => {
    it("returns true for known protected roots and children", () => {
      expect(isProtectedPath("/dashboard")).toBe(true);
      expect(isProtectedPath("/reading/new")).toBe(true);
      expect(isProtectedPath("/geodetic-patterns/foo/bar")).toBe(true);
    });

    it("returns false for public paths and prefix collisions", () => {
      expect(isProtectedPath("/")).toBe(false);
      expect(isProtectedPath("/login")).toBe(false);
      expect(isProtectedPath("/dashboardx")).toBe(false);
    });
  });

  describe("isAuthEntryPath", () => {
    it("returns true for /login and /flow and their children", () => {
      expect(isAuthEntryPath("/login")).toBe(true);
      expect(isAuthEntryPath("/flow")).toBe(true);
      expect(isAuthEntryPath("/flow/step-2")).toBe(true);
    });

    it("returns false for unrelated paths", () => {
      expect(isAuthEntryPath("/dashboard")).toBe(false);
      expect(isAuthEntryPath("/flowers")).toBe(false);
    });
  });

  describe("config.matcher", () => {
    it("stays in sync with PROTECTED_PREFIXES + AUTH_ENTRY_PREFIXES", () => {
      const expected = [...PROTECTED_PREFIXES, ...AUTH_ENTRY_PREFIXES].map(
        (prefix) => `${prefix}/:path*`,
      );
      expect(config.matcher).toEqual(expected);
    });
  });
});
