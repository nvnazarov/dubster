import { useRouter } from "next/navigation";
import style from "./ClipAuthor.module.scss";
import { useClip } from "./ClipContext";
import { useCallback } from "react";

export default function ClipAuthor() {
  const router = useRouter();
  const clip = useClip();

  const handleClick = useCallback(() => {
    router.push(`/library?author=${clip.author.id}`);
  }, [clip.author.id]);

  return (
    <div className={style.container} onClick={handleClick}>
      <span className={style.at}>@</span>
      {clip.author.name}
    </div>
  );
}
