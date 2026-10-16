import roleIcon from "@/public/icons/role.png";
import Badge from "@/components/shared/misc/Badge";
import { useClipContext } from "@/components/clip/context";
import { Role } from "@/lib/models/clip";

export default function NumberOfRolesBadge() {
  const { clip } = useClipContext();
  const roles = new Set<Role["id"]>();
  Object.values(clip.segments).forEach((segment) => roles.add(segment.roleID));
  return <Badge text={roles.size.toString()} icon={roleIcon.src} />;
}
