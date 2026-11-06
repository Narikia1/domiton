import { describe, expect, it } from "vitest";
import { isRegistrableLabel } from "../src/core/parse.js";
import { similarNames } from "../src/core/similar.js";

describe("similar names", () => {
  it("offers the closest changes first", () => {
    expect(similarNames("narikia").slice(0, 5)).toEqual(["narikias", "narikly", "narikify", "narikiahq", "getnarikia"]);
  });

  it("never offers the name itself or a duplicate", () => {
    for (const name of ["app", "get", "hq", "shops", "my-shop"]) {
      const similar = similarNames(name);
      expect(similar).not.toContain(name);
      expect(new Set(similar).size).toBe(similar.length);
    }
  });

  it("joins a hyphenated name", () => {
    expect(similarNames("my-shop")[0]).toBe("myshop");
  });

  it("respells names the way people do", () => {
    expect(similarNames("flicker")).toContain("flickr");
  });

  it("only offers names that can be registered", () => {
    const longest = "a".repeat(63);
    for (const name of ["narikia", longest, "a", "my-shop"]) {
      for (const similar of similarNames(name)) expect(isRegistrableLabel(similar)).toBe(true);
    }
  });

  it("drops additions that would be too long", () => {
    const similar = similarNames("a".repeat(62));
    expect(similar).toContain(`${"a".repeat(62)}s`);
    expect(similar).not.toContain(`${"a".repeat(62)}hq`);
  });

  it("ends with longer forms, which popular names need", () => {
    const similar = similarNames("coffee");
    expect(similar).toContain("trycoffeehq");
    expect(similar.indexOf("trycoffeehq")).toBeGreaterThan(similar.indexOf("coffeehq"));
  });

  it("works for accented names", () => {
    expect(similarNames("münchen")).toContain("münchenhq");
  });
});
