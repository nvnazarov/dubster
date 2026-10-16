import { useCallback } from "react";
import { useRouter } from "next/navigation";

import style from "@/components/clip/NotFound.module.scss";
import Button from "@/components/shared/html/Button";

export default function NotFound() {
  const router = useRouter();

  const goToLibrary = useCallback(() => {
    router.replace("/library");
  }, [router]);

  return (
    <div className={style.container}>
      <p className={style.message}>
        Sorry, this clip can't be found! Perhaps, the author has deleted it.
      </p>
      <Button text="Go to Library" onClick={goToLibrary} primary />
    </div>
  );
}
