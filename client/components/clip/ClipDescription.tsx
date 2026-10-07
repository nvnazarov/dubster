import style from "./ClipDescription.module.scss";
import { useClip } from "./ClipContext";

export default function ClipDescription() {
  const clip = useClip();
  return (
    clip.description && (
      <div className={style.container}>{clip.description}</div>
    )
  );
}
