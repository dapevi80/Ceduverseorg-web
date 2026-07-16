export function decideCertTransition(current: string, paymentStatus: string): "confirm" | "noop" {
  if (current === "pending_payment" && paymentStatus === "paid") return "confirm";
  return "noop";
}
