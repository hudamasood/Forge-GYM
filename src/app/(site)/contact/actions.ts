"use server";

import { headers } from "next/headers";
import { services } from "@/server/container";
import { type ActionState, runAction } from "@/server/http/action";
import { LIMITS, clientIp, rateLimit } from "@/server/http/rate-limit";
import { contactSchema, formToObject, parse } from "@/server/validation/schemas";

export async function sendContactMessage(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction(async () => {
    rateLimit(`contact:${clientIp(await headers())}`, LIMITS.contact.limit, LIMITS.contact.windowMs);
    const { company, ...message } = parse(contactSchema, formToObject(form));
    if (!company) await services().contact.submit(message); // honeypot filled → silently drop
    return "Thanks — your message is in. We reply within one business day.";
  });
}
