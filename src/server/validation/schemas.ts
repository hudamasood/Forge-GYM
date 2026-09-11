/**
 * Request schemas (spec B3/B5). Every mutating endpoint and Server Action
 * validates its input here before anything reaches the Service layer.
 */
import { z } from "zod";
import {
  BILLING_INTERVALS,
  BOOKING_STATUSES,
  DIFFICULTIES,
  MEMBERSHIP_STATUSES,
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  ROLES,
} from "@/server/domain/types";
import { ValidationError } from "@/server/domain/errors";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
const id = z.string().trim().min(1).max(64);
const email = z.email("Enter a valid email address").trim().toLowerCase().max(254);
const password = z.string().min(8, "At least 8 characters").max(128);
const name = z.string().trim().min(2, "Enter your name").max(80);
const phone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d\s().-]*$/, "Enter a valid phone number")
  .optional()
  .transform((v) => v || null);
const cents = z.coerce.number().int().min(0).max(10_000_000);
const lines = (max: number) =>
  z
    .string()
    .max(5000)
    .transform((v) =>
      v
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, max),
    );

export const signupSchema = z.object({ name, email, password, phone });
export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password").max(128) });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z
  .object({ token: z.string().min(10).max(200), password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
export const profileSchema = z.object({ name, phone });
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: password, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export const contactSchema = z.object({
  name,
  email,
  subject: z.string().trim().min(3, "Add a subject").max(120),
  message: z.string().trim().min(10, "Tell us a little more").max(4000),
  // Honeypot: real users never fill this hidden field.
  company: z.string().max(200).optional(),
});

export const bookingSchema = z.object({ scheduleId: id });
export const membershipCheckoutSchema = z.object({ planSlug: slug, interval: z.enum(BILLING_INTERVALS) });
export const cartCheckoutSchema = z.object({
  items: z
    .array(z.object({ productId: id, quantity: z.coerce.number().int().min(1).max(10) }))
    .min(1, "Your cart is empty")
    .max(50),
});
export const attendanceSchema = z.object({ status: z.enum(["ATTENDED", "NO_SHOW"]) });

export const classFilterSchema = z.object({
  object: slug.optional().catch(undefined),
  difficulty: z.enum(DIFFICULTIES).optional().catch(undefined),
});
export const productFilterSchema = z.object({
  category: z.enum(PRODUCT_CATEGORIES).optional().catch(undefined),
  q: z.string().trim().max(80).optional().catch(undefined),
});
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
  pageSize: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
  search: z.string().trim().max(120).optional().catch(undefined),
});

// ---------------------------------------------------------------- Admin

export const adminUserSchema = z.object({ name: name.optional(), phone, role: z.enum(ROLES).optional() });

export const classInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  accessObjectId: id,
  description: z.string().trim().min(10).max(2000),
  benefits: lines(8),
  difficulty: z.enum(DIFFICULTIES),
  durationMinutes: z.coerce.number().int().min(10).max(240),
  estCalories: z.coerce.number().int().min(0).max(3000),
  defaultCapacity: z.coerce.number().int().min(1).max(200),
});

export const trainerInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  bio: z.string().trim().min(10).max(2000),
  specialty: z.string().trim().min(2).max(120),
  certifications: lines(10),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  primaryAccessObjectId: id,
  userId: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((v) => v || null),
});

export const scheduleInputSchema = z
  .object({
    classId: id,
    trainerId: id,
    spaceId: id,
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    capacityOverride: z
      .union([z.literal(""), z.coerce.number().int().min(1).max(200)])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
  })
  .refine((d) => d.endTime > d.startTime, { message: "End time must be after start time", path: ["endTime"] });

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  category: z.enum(PRODUCT_CATEGORIES),
  price: cents,
  stock: z.coerce.number().int().min(0).max(1_000_000),
  description: z.string().trim().min(10).max(4000),
  images: lines(8),
});

export const planPriceSchema = z.object({
  priceMonthly: cents,
  priceAnnual: cents,
  stripePriceIdMonthly: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || null),
  stripePriceIdAnnual: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || null),
});

export const accessObjectInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160),
  description: z.string().trim().min(10).max(2000),
  equipmentList: lines(40),
});

export const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });
export const membershipStatusSchema = z.object({ status: z.enum(MEMBERSHIP_STATUSES) });
export const bookingStatusSchema = z.object({ status: z.enum(BOOKING_STATUSES) });

/** Parses input or throws a ValidationError carrying per-field messages. */
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fieldErrors = z.flattenError(result.error).fieldErrors as Record<string, string[]>;
  const first = Object.values(fieldErrors).flat()[0] ?? result.error.issues[0]?.message ?? "Invalid input";
  throw new ValidationError(first, fieldErrors);
}

/** FormData → plain object (repeated keys become arrays). */
export function formToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    if (key in out) out[key] = ([] as unknown[]).concat(out[key], value);
    else out[key] = value;
  }
  return out;
}
