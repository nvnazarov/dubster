import style from "./VideoPlayer.module.scss";
import { useSession } from "./context";

export default function VideoPlayer() {
  const session = useSession();

  return <div className={style.outer}></div>;
}
