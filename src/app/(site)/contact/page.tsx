import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container, PageHero } from "@/components/layout/section";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, healthClubJsonLd } from "@/lib/seo";
import { GYM } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  category: "Gym",
  description: "Visit or contact FORGE: address, phone, email and opening hours. Send us a message and we'll reply within one business day.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={healthClubJsonLd()} />
      <PageHero eyebrow="Contact" title="Come train with us" description="Questions about memberships, classes or the store? Send a message or drop by the front desk." />
      <Container className="grid gap-12 py-14 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-5">
          {/* NAP must match the Google Business Profile exactly once the location is confirmed (spec C3). */}
          <address className="grid gap-4 not-italic">
            {[
              { icon: MapPin, label: "Address", value: `${GYM.address.street}, ${GYM.address.city}, ${GYM.address.region} ${GYM.address.postalCode}` },
              { icon: Phone, label: "Phone", value: GYM.phone, href: `tel:${GYM.phone.replace(/[^\d+]/g, "")}` },
              { icon: Mail, label: "Email", value: GYM.email, href: `mailto:${GYM.email}` },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ember-500/15 text-ember-400">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-300">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-lg text-bone-50 hover:text-ember-300">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-lg text-bone-50">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </address>
          <div className="flex items-start gap-4 rounded-2xl border border-bone-50/8 bg-ink-800/60 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ember-500/15 text-ember-400">
              <Clock className="size-5" aria-hidden />
            </span>
            <dl className="grid flex-1 gap-1">
              <dt className="text-xs uppercase tracking-wider text-ink-300">Opening hours</dt>
              <dd className="flex justify-between gap-3 text-bone-50">
                <span>Mon – Fri</span> <span>{GYM.hours.weekdays}</span>
              </dd>
              <dd className="flex justify-between gap-3 text-bone-50">
                <span>Sat – Sun</span> <span>{GYM.hours.weekends}</span>
              </dd>
            </dl>
          </div>
        </div>
        <div className="rounded-3xl border border-bone-50/8 bg-ink-800/40 p-6 sm:p-10">
          <h2 className="mb-6 text-3xl font-semibold text-bone-50">Send a message</h2>
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
