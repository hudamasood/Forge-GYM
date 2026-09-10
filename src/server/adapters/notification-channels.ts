import { Resend } from "resend";
import type { INotificationChannel, OutgoingMessage } from "@/server/ports/notification";

export class ResendNotificationChannel implements INotificationChannel {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(message: OutgoingMessage) {
    const { error } = await this.resend.emails.send({ from: this.from, ...message });
    if (error) throw new Error(`Email delivery failed: ${error.message}`);
  }
}

/** Development fallback: prints emails to the server log instead of sending them. */
export class ConsoleNotificationChannel implements INotificationChannel {
  async send(message: OutgoingMessage) {
    console.info(`\n[email] to=${message.to} subject="${message.subject}"\n${message.text}\n`);
  }
}
