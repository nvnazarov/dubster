import roleIcon from "@/public/icons/role.png";
import Badge from "@/components/shared/misc/Badge";
import { useClip } from "./ClipContext";
import { Role } from "@/lib/models";

export default function ClipNumberOfRolesBadge() {
  const clip = useClip();
  const roles = new Set<Role["id"]>();
  Object.values(clip.segments).forEach((segment) => roles.add(segment.role.id));
  return <Badge text={roles.size.toString()} icon={roleIcon.src} />;
}
