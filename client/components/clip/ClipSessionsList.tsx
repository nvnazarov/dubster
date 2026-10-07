import { useEffect, useState } from "react";

import style from "./ClipSessionsList.module.scss";
import { useClip, useSessionRepository } from "./ClipContext";
import { type Session } from "@/lib/models";
import SessionView from "@/components/clip/Session";
import Spinner from "@/components/shared/misc/Spinner";

export default function ClipSessionsList() {
  const clip = useClip();
  const sessions = useSessionRepository();
  const [clipSessions, setClipSessions] = useState<Session[]>([]);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    setPending(true);
    sessions
      .forClip(clip)
      .then((sessions) => {
        setClipSessions(sessions);
      })
      .finally(() => setPending(false));
  }, [sessions, clip]);

  return (
    <div className={style.container}>
      <div className={style.label}>Your sessions:</div>
      {pending ? (
        <Spinner />
      ) : clipSessions.length === 0 ? (
        <div className={style.empty}>
          Your sessions will be here! You will be able to rate this clip after
          the first session.
        </div>
      ) : (
        <div className={style.sessions}>
          {clipSessions.map((session) => (
            <SessionView key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
