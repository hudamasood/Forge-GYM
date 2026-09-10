/** Notification channel port — Resend in production, console in development and tests. */
export interface OutgoingMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface INotificationChannel {
  send(message: OutgoingMessage): Promise<void>;
}
