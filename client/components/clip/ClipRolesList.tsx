import { type Role as RoleType } from "@/lib/models/clip";
import { useClip } from "./ClipContext";
import style from "./ClipRolesList.module.scss";
import { Role } from "@/components/shared/misc/Role";
import { Duration } from "@/lib/util/time";

export default function ClipRolesList() {
  const clip = useClip();
  const roles = Object.values(clip.roles);

  function countSegments(roleID: RoleType["id"]): number {
    return Object.values(clip.segments).filter(
      (segment) => segment.roleID === roleID,
    ).length;
  }

  function calculateDuration(roleID: RoleType["id"]): Duration {
    const ms = Object.values(clip.segments)
      .filter((segment) => segment.roleID === roleID)
      .reduce(
        (ms, segment) =>
          ms + segment.end.milliseconds - segment.begin.milliseconds,
        0,
      );
    return new Duration(ms);
  }

  if (roles.length === 0) {
    throw "roles list: bad clip: no roles in the clip";
  }

  return (
    <div className={style.container}>
      <div className={style.roles}>
        {roles.map((role) => (
          <Role
            key={role.id}
            role={role}
            numberOfSegments={countSegments(role.id)}
            duration={calculateDuration(role.id)}
          />
        ))}
      </div>
    </div>
  );
}
