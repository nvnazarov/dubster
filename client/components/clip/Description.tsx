import style from "@/components/clip/Description.module.scss";
import { useClipContext } from "@/components/clip/context";

export default function ClipDescription() {
  const { clip } = useClipContext();
  return (
    <div className={style.container}>
      {clip.description || "No description."}
    </div>
  );
}
