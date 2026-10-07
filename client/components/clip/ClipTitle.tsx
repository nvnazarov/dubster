import style from "./ClipTitle.module.scss";
import { useClip } from "./ClipContext";

export default function ClipTitle() {
  const clip = useClip();
  return <div className={style.container}>{clip.title}</div>;
}
