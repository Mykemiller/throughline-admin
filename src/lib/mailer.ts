export interface Mailer {
  send(opts: { to: string; subject: string; text: string }): Promise<void>;
}

/** Logs the letter to the server log — used until a real provider is configured. */
class ConsoleMailer implements Mailer {
  async send({ to, subject, text }: { to: string; subject: string; text: string }) {
    console.log(`[mailer] to=${to} subject=${JSON.stringify(subject)}\n${text}`);
  }
}

class ResendMailer implements Mailer {
  constructor(private apiKey: string, private from: string) {}
  async send({ to, subject, text }: { to: string; subject: string; text: string }) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [to], subject, text }),
    });
    if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
}

export function getMailer(): Mailer {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) return new ResendMailer(key, from);
  return new ConsoleMailer();
}
