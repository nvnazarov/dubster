import styles from "./Header.module.scss";
import homeIcon from "@/public/icons/home.png";
import libraryIcon from "@/public/icons/note.png";
import producerIcon from "@/public/icons/maker.png";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/html/Button";

export default function Header() {
  const router = useRouter();

  function navigate(href: string) {
    router.push(href);
  }

  return (
    <div className={styles.header}>
      <Button onClick={() => navigate("/")} text="Home" icon={homeIcon.src} />
      <Button
        onClick={() => navigate("/library")}
        text="Library"
        icon={libraryIcon.src}
      />
      <Button
        onClick={() => navigate("/producer")}
        text="Producer"
        icon={producerIcon.src}
      />
    </div>
  );
}
