import style from "./Role.module.scss";
import timeIcon from "@/public/icons/time.png";
import segmentIcon from "@/public/icons/maker.png";
import Badge from "./Badge";
import { type Role } from "@/lib/models";
import { type Duration } from "@/lib/util/time";

export function Role({
  role,
  duration,
  numberOfSegments,
}: {
  role: Role;
  duration?: Duration;
  numberOfSegments?: number;
}) {
  return (
    <div className={style.container}>
      <span>{role.name}</span>{" "}
      <div className={style.badges}>
        {duration !== undefined && (
          <Badge text={duration.human()} icon={timeIcon.src} />
        )}
        {numberOfSegments !== undefined && (
          <Badge text={numberOfSegments.toString()} icon={segmentIcon.src} />
        )}
        {role.sex == "female" && <span className={style.female}>F</span>}
        {role.sex == "male" && <span className={style.male}>M</span>}
      </div>
    </div>
  );
}
