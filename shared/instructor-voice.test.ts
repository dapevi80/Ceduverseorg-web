import { describe, it, expect } from "vitest";
import { voiceForInstructor } from "./instructor-voice";

describe("voiceForInstructor", () => {
  it("Yuridia -> coral", () => {
    expect(voiceForInstructor("Psic. Yuridia Iturriaga").voice).toBe("coral");
  });

  it("Medina -> ash", () => {
    expect(voiceForInstructor("Lic. Jorge Armando Medina Castillo").voice).toBe("ash");
  });

  it("David Pérez -> verse", () => {
    expect(voiceForInstructor("David Pérez").voice).toBe("verse");
  });

  it("Daniel Zavala -> onyx", () => {
    expect(voiceForInstructor("Daniel Zavala").voice).toBe("onyx");
  });

  it("nombre desconocido -> default ash", () => {
    expect(voiceForInstructor("Instructor Genérico").voice).toBe("ash");
  });

  it("null -> default ash", () => {
    expect(voiceForInstructor(null).voice).toBe("ash");
  });

  it("cada voz trae instructions no vacías", () => {
    expect(voiceForInstructor("Yuridia").instructions.length).toBeGreaterThan(0);
    expect(voiceForInstructor(null).instructions.length).toBeGreaterThan(0);
  });
});
