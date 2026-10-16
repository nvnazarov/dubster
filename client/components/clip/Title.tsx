import style from "@/components/clip/Title.module.scss";

import { useClipContext } from "@/components/clip/context";

export default function Title() {
  const { clip } = useClipContext();
  return (
    <div className={style.container}>
      <span>{clip.title}</span>
    </div>
  );
}
