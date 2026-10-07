import { useCallback, useState } from "react";
import style from "./Session.module.scss";
import { type Session } from "@/lib/models";
import { useRouter } from "next/navigation";

export default function Session({ session }: { session: Session }) {
  const router = useRouter();

  const openSession = useCallback(() => {
    router.push(`/sessions/${session.id}`);
  }, []);

  return (
    <>
      <div className={style.container} onClick={openSession}>
        <span>{session.dateCreated.toDateString()}</span>
        <span>{10}</span>
      </div>
    </>
  );
}
