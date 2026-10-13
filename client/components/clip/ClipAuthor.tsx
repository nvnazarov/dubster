import { useRouter } from "next/navigation";
import style from "./ClipAuthor.module.scss";
import { useClip } from "./ClipContext";
import { useCallback } from "react";

export default function ClipAuthor() {
  const router = useRouter();
  const clip = useClip();

  const handleClick = useCallback(() => {
    router.push(`/library?author=${clip.authorID}`);
  }, [clip.authorID]);

  return (
    <div className={style.container} onClick={handleClick}>
      <span className={style.at}>@</span>
      {clip.authorID}
    </div>
  );
}
