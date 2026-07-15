import { describe, it, expect } from "vitest";
import { decideCertTransition } from "./cert-webhook-logic";

describe("decideCertTransition", () => {
  it("confirma cuando pending_payment y paid", () => {
    expect(decideCertTransition("pending_payment", "paid")).toBe("confirm");
  });
  it("noop si ya solicitado (idempotente)", () => {
    expect(decideCertTransition("solicitado", "paid")).toBe("noop");
  });
  it("noop si no pagó", () => {
    expect(decideCertTransition("pending_payment", "unpaid")).toBe("noop");
  });
});
