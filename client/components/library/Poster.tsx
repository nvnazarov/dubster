import { useRef } from "react";
import { useRouter } from "next/navigation";

import style from "./Poster.module.scss";
import { type Role, type Clip } from "@/lib/models";
import RatingBadge from "@/components/shared/misc/RatingBadge";
import Badge from "@/components/shared/misc/Badge";
import { type DeepReadonly } from "@/lib/util/type";
import roleIcon from "@/public/icons/role.png";
import segmentIcon from "@/public/icons/maker.png";

export default function Poster({ clip }: { clip: DeepReadonly<Clip> }) {
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef<Animation | null>(null);

  function openClip() {
    router.push(`/clips/${clip.id}`);
  }

  function handleMouseEnter() {
    if (!imgRef.current) {
      return;
    }
    animRef.current = imgRef.current.animate(
      [{ left: 0 }, { transform: "translate(-100%)", left: "100%" }],
      {
        iterations: Infinity,
        duration: 5000,
        direction: "alternate",
      },
    );
  }

  function handleMouseLeave() {
    if (!animRef.current) {
      return;
    }
    animRef.current.cancel();
    animRef.current = null;
  }

  const roles = new Set<Role["id"]>();
  Object.values(clip.segments).forEach((segment) => roles.add(segment.role.id));
  const numberOfRoles = roles.size;
  const numberOfSegments = Object.keys(clip.segments).length;

  return (
    <div className={style.outer}>
      <div
        className={style.inner}
        onClick={openClip}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img src="/shrek.png" ref={imgRef} />
        <div className={style.shadow} />
        <div className={style.header}>
          <div className={style.texts}>
            <div className={style.title}>{clip.title}</div>
            <div className={style.author}>@{clip.author.name}</div>
          </div>
          <div className={style.badges}>
            <RatingBadge rating={clip.rating} />
            <Badge text={numberOfRoles.toString()} icon={roleIcon.src} />
            <Badge text={numberOfSegments.toString()} icon={segmentIcon.src} />
          </div>
        </div>
      </div>
    </div>
  );
}
