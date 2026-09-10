/**
 * Business identity. PLACEHOLDER until the location, legal name and contact
 * details are confirmed (spec A13) — NAP must then match the Google Business
 * Profile exactly (spec C3).
 */
export const GYM = {
  name: "FORGE",
  legalName: "FORGE Strength Co.",
  tagline: "Strength is made, not born.",
  description: "FORGE is a premium strength gym with six dedicated training spaces — gym floor, yoga, Zumba, spin, boxing and CrossFit — object-based memberships and expert coaching.",
  address: {
    street: "100 Foundry Lane",
    city: "Your City",
    region: "ST",
    postalCode: "00000",
    country: "US",
  },
  phone: "+1 (555) 010-0100",
  email: "hello@forge.example",
  hours: { weekdays: "5:00 AM – 11:00 PM", weekends: "7:00 AM – 9:00 PM" },
  openingHoursSpecification: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "05:00", closes: "23:00" },
    { days: ["Saturday", "Sunday"], opens: "07:00", closes: "21:00" },
  ],
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
