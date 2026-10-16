"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import style from "@/app/sessions/[sessionID]/page.module.scss";
import Header from "@/components/shared/misc/Header";
import Spinner from "@/components/shared/misc/Spinner";
import WebSocketSession from "@/lib/impl/webSocketSession";
import config from "@/lib/config";
import Session from "@/lib/services/session";

export default function SessionPage() {
  const { sessionID } = useParams();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (typeof sessionID !== "string") {
      throw "session page: session id (path parameter) is not a string";
    }
    const ws = new WebSocketSession(config.backendBaseURL, sessionID);
    ws.connect()
      .then(() => setSession(ws))
      .catch(console.error);
  }, [sessionID]);

  return (
    <div className={style.page}>
      <Header />
      {session ? <div>session {sessionID}</div> : <Spinner />}
    </div>
  );
}
