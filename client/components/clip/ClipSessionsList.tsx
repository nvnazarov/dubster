import { useCallback, useEffect, useState } from "react";

import style from "./ClipSessionsList.module.scss";
import refreshIcon from "@/public/icons/refresh.png";
import { useClip, useSessionsRepository } from "./ClipContext";
import { type Session } from "@/lib/models/session";
import SessionView from "@/components/clip/Session";
import Spinner from "@/components/shared/misc/Spinner";
import Button from "@/components/shared/html/Button";

export default function ClipSessionsList() {
  const clip = useClip();
  const sessions = useSessionsRepository();
  const [clipSessions, setClipSessions] = useState<Session[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadSessions = useCallback(() => {
    setPending(true);
    sessions
      .my()
      .then((sessions) => {
        setClipSessions(
          sessions.filter((session) => session.clipID == clip.id),
        );
        setError(null);
      })
      .catch((e) => {
        setClipSessions([]);
        setError(e);
      })
      .finally(() => setPending(false));
  }, [sessions, clip.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <div className={style.container}>
      {error != null ? (
        <div className={style.error}>
          <Button
            text="Refresh Sessions"
            icon={refreshIcon.src}
            onClick={loadSessions}
            progress={pending ? 0 : undefined}
            disabled={pending}
          />
        </div>
      ) : pending ? (
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
