import type { INotificationChannel } from "@/server/ports/notification";

const BRAND = "FORGE";

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#1c1b19;font-family:Arial,sans-serif;color:#f2eee6">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#252421;border:1px solid #3d3a35;border-radius:12px">
<tr><td style="padding:28px 32px;border-bottom:1px solid #3d3a35;font-size:20px;letter-spacing:4px;color:#dd5a22;font-weight:bold">${BRAND}</td></tr>
<tr><td style="padding:28px 32px"><h1 style="margin:0 0 16px;font-size:22px;text-transform:uppercase;color:#faf8f4">${escapeHtml(title)}</h1>${body}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #3d3a35;font-size:12px;color:#a39e94">Strength is made, not born.</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#c2410c;color:#faf8f4;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">${escapeHtml(label)}</a></p>`;
}

function p(text: string) {
  return `<p style="margin:0 0 12px;line-height:1.6;color:#e5dfd3">${escapeHtml(text)}</p>`;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Composes FORGE transactional emails and hands them to the channel. */
export class NotificationService {
  constructor(
    private readonly channel: INotificationChannel,
    private readonly siteUrl: string,
  ) {}

  welcome(to: string, name: string) {
    return this.channel.send({
      to,
      subject: `Welcome to ${BRAND}`,
      text: `Welcome to ${BRAND}, ${name}. Choose a membership to start booking classes: ${this.siteUrl}/memberships`,
      html: layout(`Welcome, ${name}`, p("Your account is ready. Pick the space you train in — or go All-Access — and start booking classes.") + button(`${this.siteUrl}/memberships`, "View memberships")),
    });
  }

  passwordReset(to: string, token: string) {
    const url = `${this.siteUrl}/reset-password?token=${encodeURIComponent(token)}`;
    return this.channel.send({
      to,
      subject: `Reset your ${BRAND} password`,
      text: `Reset your password within 1 hour: ${url}. If you did not request this, ignore this email.`,
      html: layout("Reset your password", p("Use the button below within the next hour to choose a new password.") + button(url, "Reset password") + p("If you didn't request this, you can safely ignore this email.")),
    });
  }

  bookingConfirmed(to: string, details: { className: string; startsAt: string; trainerName: string; spaceName: string }) {
    return this.channel.send({
      to,
      subject: `Booked: ${details.className}`,
      text: `You're booked into ${details.className} with ${details.trainerName} in the ${details.spaceName} on ${details.startsAt}.`,
      html: layout("You're booked", p(`${details.className} with ${details.trainerName}`) + p(`${details.spaceName} · ${details.startsAt}`) + button(`${this.siteUrl}/dashboard/bookings`, "Manage bookings")),
    });
  }

  orderReceipt(to: string, details: { orderId: string; total: string; items: { name: string; quantity: number }[] }) {
    const lines = details.items.map((i) => `${i.quantity} × ${i.name}`);
    return this.channel.send({
      to,
      subject: `Your ${BRAND} order is confirmed`,
      text: `Order ${details.orderId} confirmed. ${lines.join(", ")}. Total ${details.total}.`,
      html: layout("Order confirmed", lines.map(p).join("") + p(`Total: ${details.total}`) + button(`${this.siteUrl}/dashboard/orders`, "View order history")),
    });
  }

  membershipActivated(to: string, planName: string) {
    return this.channel.send({
      to,
      subject: `Your ${planName} membership is active`,
      text: `Your ${planName} membership is active. Book your first class: ${this.siteUrl}/classes`,
      html: layout("Membership active", p(`Your ${planName} membership is now active.`) + button(`${this.siteUrl}/classes`, "Book a class")),
    });
  }

  contactReceived(to: string, from: { name: string; email: string; subject: string; message: string }) {
    return this.channel.send({
      to,
      subject: `Contact form: ${from.subject}`,
      text: `${from.name} <${from.email}>\n\n${from.message}`,
      html: layout("New contact message", p(`${from.name} <${from.email}>`) + p(from.subject) + p(from.message)),
    });
  }
}
