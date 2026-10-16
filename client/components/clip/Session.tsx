import { useCallback } from "react";
import { useRouter } from "next/navigation";

import style from "@/components/clip/Session.module.scss";
import { type Session } from "@/lib/models/session";

export default function Session({ session }: { session: Session }) {
  const router = useRouter();

  const openSession = useCallback(() => {
    router.push(`/sessions/${session.id}`);
  }, [session.id]);

  return (
    <div className={style.container} onClick={openSession}>
      <span>{session.dateCreated.toDateString()}</span>
    </div>
  );
}
