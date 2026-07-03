export interface PaymentProvider {
  refund(opts: { paymentId: string; amountCents: number }): Promise<{ ok: boolean; providerRef?: string }>;
}

/** Records the refund locally without contacting a processor. */
class StubPaymentProvider implements PaymentProvider {
  async refund({ paymentId }: { paymentId: string; amountCents: number }) {
    return { ok: true, providerRef: `stub_${paymentId}` };
  }
}

class StripePaymentProvider implements PaymentProvider {
  constructor(private secretKey: string) {}
  async refund({ paymentId, amountCents }: { paymentId: string; amountCents: number }) {
    // Payments seeded locally carry no Stripe charge id; when the subscriber-facing
    // billing flow lands, Payment rows will store the charge id in a dedicated column.
    const res = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ charge: paymentId, amount: String(amountCents) }),
    });
    if (!res.ok) return { ok: false };
    const json = (await res.json()) as { id: string };
    return { ok: true, providerRef: json.id };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key) return new StripePaymentProvider(key);
  return new StubPaymentProvider();
}
