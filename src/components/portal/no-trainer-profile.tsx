import { UserX } from "lucide-react";
import { EmptyState } from "@/components/ui/states";

export function NoTrainerProfile() {
  return (
    <EmptyState
      icon={UserX}
      title="No trainer profile linked"
      message="This account isn't linked to a trainer profile yet. An admin can link it from Admin → Trainers."
      action={{ label: "Go to admin", href: "/admin/trainers" }}
    />
  );
}
