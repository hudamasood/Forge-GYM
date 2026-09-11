"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/admin/action-form";
import { SelectField, TextAreaField, TextField } from "@/components/admin/fields";
import { titleCase } from "@/lib/format";
import { DIFFICULTIES, PRODUCT_CATEGORIES } from "@/server/domain/types";
import { saveClassAction, saveProductAction, saveTrainerAction } from "./actions";

type Option = { value: string; label: string };

function FormButtons({ pending, cancelHref, isNew }: { pending: boolean; cancelHref: string; isNew: boolean }) {
  return (
    <div className="flex gap-3">
      <Button type="submit" loading={pending} loadingText="Saving…">
        {isNew ? "Create" : "Save changes"}
      </Button>
      <Button asChild variant="ghost">
        <Link href={cancelHref}>Cancel</Link>
      </Button>
    </div>
  );
}

export function ClassForm({
  gymClass,
  accessObjects,
}: {
  gymClass?: {
    id: string;
    name: string;
    slug: string;
    accessObjectId: string;
    description: string;
    benefits: string[];
    difficulty: string;
    durationMinutes: number;
    estCalories: number;
    defaultCapacity: number;
  };
  accessObjects: Option[];
}) {
  return (
    <ActionForm action={saveClassAction.bind(null, gymClass?.id ?? null)}>
      {(pending) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Name" defaultValue={gymClass?.name} required />
            <TextField name="slug" label="URL slug" hint="lowercase-with-hyphens, used in /classes/…" defaultValue={gymClass?.slug} required />
            <SelectField name="accessObjectId" label="Access Object" defaultValue={gymClass?.accessObjectId} options={accessObjects} />
            <SelectField name="difficulty" label="Difficulty" defaultValue={gymClass?.difficulty ?? "ALL_LEVELS"} options={DIFFICULTIES.map((d) => ({ value: d, label: titleCase(d) }))} />
            <TextField name="durationMinutes" label="Duration (minutes)" type="number" min={10} max={240} defaultValue={gymClass?.durationMinutes ?? 60} required />
            <TextField name="estCalories" label="Estimated calories" type="number" min={0} defaultValue={gymClass?.estCalories ?? 400} required />
            <TextField name="defaultCapacity" label="Default capacity" type="number" min={1} max={200} defaultValue={gymClass?.defaultCapacity ?? 16} required />
          </div>
          <TextAreaField name="description" label="Description" rows={4} defaultValue={gymClass?.description} required />
          <TextAreaField name="benefits" label="Benefits" hint="One per line (up to 8)." rows={4} defaultValue={gymClass?.benefits.join("\n")} />
          <FormButtons pending={pending} cancelHref="/admin/classes" isNew={!gymClass} />
        </>
      )}
    </ActionForm>
  );
}

export function TrainerForm({
  trainer,
  accessObjects,
  trainerAccounts,
}: {
  trainer?: {
    id: string;
    name: string;
    slug: string;
    bio: string;
    specialty: string;
    certifications: string[];
    yearsExperience: number;
    primaryAccessObjectId: string;
    userId: string | null;
  };
  accessObjects: Option[];
  trainerAccounts: Option[];
}) {
  return (
    <ActionForm action={saveTrainerAction.bind(null, trainer?.id ?? null)}>
      {(pending) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Name" defaultValue={trainer?.name} required />
            <TextField name="slug" label="URL slug" hint="Used in /trainers/…" defaultValue={trainer?.slug} required />
            <TextField name="specialty" label="Specialty" defaultValue={trainer?.specialty} required />
            <TextField name="yearsExperience" label="Years of experience" type="number" min={0} max={60} defaultValue={trainer?.yearsExperience ?? 5} required />
            <SelectField name="primaryAccessObjectId" label="Lead space" defaultValue={trainer?.primaryAccessObjectId} options={accessObjects} />
            <SelectField
              name="userId"
              label="Linked login account"
              hint="Links the trainer portal. Only accounts with the Trainer role are listed."
              defaultValue={trainer?.userId ?? ""}
              options={[{ value: "", label: "— Not linked —" }, ...trainerAccounts]}
            />
          </div>
          <TextAreaField name="bio" label="Bio" rows={4} defaultValue={trainer?.bio} required />
          <TextAreaField name="certifications" label="Certifications" hint="One per line." rows={3} defaultValue={trainer?.certifications.join("\n")} />
          <FormButtons pending={pending} cancelHref="/admin/trainers" isNew={!trainer} />
        </>
      )}
    </ActionForm>
  );
}

export function ProductForm({
  product,
}: {
  product?: { id: string; name: string; slug: string; category: string; price: number; stock: number; description: string; images: string[] };
}) {
  return (
    <ActionForm action={saveProductAction.bind(null, product?.id ?? null)}>
      {(pending) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Name" defaultValue={product?.name} required />
            <TextField name="slug" label="URL slug" hint="Used in /store/…" defaultValue={product?.slug} required />
            <SelectField name="category" label="Category" defaultValue={product?.category ?? "SUPPLEMENTS"} options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: titleCase(c) }))} />
            <TextField name="price" label="Price (USD)" type="number" min={0} step="0.01" defaultValue={product ? (product.price / 100).toFixed(2) : ""} required />
            <TextField name="stock" label="Stock" type="number" min={0} defaultValue={product?.stock ?? 0} required />
          </div>
          <TextAreaField name="description" label="Description" rows={4} defaultValue={product?.description} required />
          <TextAreaField name="images" label="Image URLs" hint="One Cloudinary URL per line (optional)." rows={3} defaultValue={product?.images.join("\n")} />
          <FormButtons pending={pending} cancelHref="/admin/products" isNew={!product} />
        </>
      )}
    </ActionForm>
  );
}
