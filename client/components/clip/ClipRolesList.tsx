import { type Role as RoleType } from "@/lib/models";
import { useClip } from "./ClipContext";
import style from "./ClipRolesList.module.scss";
import { Role } from "@/components/shared/misc/Role";
import { Duration } from "@/lib/util/time";

export default function ClipRolesList() {
  const clip = useClip();
  const roles = new Set<RoleType>();
  Object.values(clip.segments).forEach((segment) => roles.add(segment.role));

  function countSegments(roleID: RoleType["id"]): number {
    return Object.values(clip.segments).filter(
      (segment) => segment.role.id === roleID,
    ).length;
  }

  function calculateDuration(roleID: RoleType["id"]): Duration {
    const ms = Object.values(clip.segments)
      .filter((segment) => segment.role.id === roleID)
      .reduce(
        (ms, segment) =>
          ms + segment.end.milliseconds() - segment.begin.milliseconds(),
        0,
      );
    return new Duration(ms);
  }

  if (roles.size === 0) {
    throw "roles list: bad clip: no roles in the clip";
  }

  return (
    <div className={style.container}>
      <div className={style.label}>Roles in this clip:</div>
      <div className={style.roles}>
        {roles
          .values()
          .map((role) => (
            <Role
              key={role.id}
              role={role}
              numberOfSegments={countSegments(role.id)}
              duration={calculateDuration(role.id)}
            />
          ))
          .toArray()}
      </div>
    </div>
  );
}
