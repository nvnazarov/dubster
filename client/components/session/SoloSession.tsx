"use client";
import style from "./SoloSession.module.scss";
import { SessionContext } from "./context";
import PagesList from "./PagesList";
import { SoloSession } from "@/lib/services/soloSession";
import AudioRecordButton from "./AudioRecordButton";
import { useEffect, useState } from "react";
import FakeSoloSession from "@/lib/impl/fakeSoloSession";
import VideoPlayer from "./VideoPlayer";
import NextPageButton from "./NextPageButton";
import PreviousPageButton from "./PreviousPageButton";

export default function SoloSessionView({ sessionID }: { sessionID: string }) {
  const [session, setSession] = useState<SoloSession | undefined>(undefined);

  useEffect(() => {
    setSession(new FakeSoloSession(sessionID));
  }, [sessionID]);

  if (session === undefined) {
    return <></>;
  }

  return (
    <SessionContext value={{ session }}>
      <div className={style.outer}>
        <PagesList />
        <div className={style.main}>
          <VideoPlayer />
          <div className={style.panel}>
            <PreviousPageButton />
            <AudioRecordButton />
            <NextPageButton />
          </div>
        </div>
      </div>
    </SessionContext>
  );
}
