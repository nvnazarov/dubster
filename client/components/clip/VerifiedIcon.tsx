import verifiedIcon from "@/public/icons/verified.png";
import style from "@/components/clip/VerifiedIcon.module.scss";

export default function VerifiedIcon() {
  return (
    <img
      className={style.container}
      src={verifiedIcon.src}
      title="This clip is verified"
    />
  );
}
