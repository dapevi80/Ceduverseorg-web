import { describe, it, expect } from "vitest";
import { resolveAudioUrl, clampSeek } from "./audio-url";

describe("resolveAudioUrl", () => {
  it("devuelve null si no hay url", () => {
    expect(resolveAudioUrl(null)).toBeNull();
    expect(resolveAudioUrl(undefined)).toBeNull();
    expect(resolveAudioUrl("")).toBeNull();
  });
  it("respeta rutas /audio/ y http(s)", () => {
    expect(resolveAudioUrl("/audio/x.mp3")).toBe("/audio/x.mp3");
    expect(resolveAudioUrl("https://cdn/x.mp3")).toBe("https://cdn/x.mp3");
  });
  it("quita el prefijo audio-cache/ y sirve bajo /audio/", () => {
    expect(resolveAudioUrl("audio-cache/instructor_abc.mp3")).toBe("/audio/instructor_abc.mp3");
  });
  it("un nombre pelado se sirve bajo /audio/", () => {
    expect(resolveAudioUrl("instructor_abc.mp3")).toBe("/audio/instructor_abc.mp3");
  });
});

describe("clampSeek", () => {
  it("no deja pasar de maxListened + 10% de la duracion", () => {
    // maxAllowed = 10 + 60*0.1 = 16
    expect(clampSeek(100, 10, 60)).toBe(16);
  });
  it("deja pasar un objetivo por debajo del techo", () => {
    expect(clampSeek(5, 10, 60)).toBe(5);
  });
  it("con duracion 0 el techo es maxListened", () => {
    expect(clampSeek(100, 8, 0)).toBe(8);
  });
});
