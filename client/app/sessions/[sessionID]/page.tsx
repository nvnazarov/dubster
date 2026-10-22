"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import style from "@/app/sessions/[sessionID]/page.module.scss";
import Header from "@/components/shared/misc/Header";
import Spinner from "@/components/shared/misc/Spinner";
import SessionContext, {
  useSessionContext,
} from "@/components/session/context";
import WebSocketHub from "@/lib/impl/webSocketSession";
import StartRolePickingButton from "@/components/session/lobby/StartRolePickingButton";
import CopyJoinLinkButton from "@/components/session/lobby/CopyJoinLinkButton";
import { useAuthContext } from "@/components/shared/auth/context";
import ParticipantsList from "@/components/session/lobby/ParticipantsList";
import SessionConnection from "@/lib/services/session";
import {
  Entities,
  makeState,
  useObjectProperty,
  useSnapshot,
} from "@/lib/state";
import config from "@/lib/config";
import StartSegmentsVoicingButton from "@/components/session/rolePicking/StartSegmentsVoicingButton";
import RolesList from "@/components/session/rolePicking/RolesList";
import SegmentsVoicingContext from "@/components/session/segmentsVoicing/context";
import SegmentsProgress from "@/components/session/segmentsVoicing/SegmentsProgress";
import NextSegmentButton from "@/components/session/segmentsVoicing/NextSegmentButton";
import { Segment } from "@/lib/models/clip";
import { Duration } from "@/lib/time";
import Video from "@/components/session/segmentsVoicing/Video";
import HTTPClipsStore from "@/lib/impl/httpClipsStore";
import VideoControls from "@/components/session/segmentsVoicing/VideoControls";
import IndexedDBCache from "@/lib/impl/indexedDBCache";

export default function SessionPage() {
  const { sessionID } = useParams();
  const { userID } = useAuthContext();
  const hub = useRef(new WebSocketHub(config.backendBaseURL)).current;
  const [connection, setConnection] = useState<SessionConnection | null>(null);

  useEffect(() => {
    if (typeof sessionID !== "string") {
      throw "session page: session id (path parameter) is not a string";
    }
    const connection = hub.connect(sessionID);
    setConnection(connection);
  }, [sessionID, userID]);

  if (!userID) {
    throw "not authenticated";
  }

  return (
    <div className={style.page}>
      <Header />
      {connection ? (
        <SessionContext value={{ connection }}>
          <Phase />
        </SessionContext>
      ) : (
        <Spinner />
      )}
    </div>
  );
}

function Phase() {
  const { connection } = useSessionContext();
  const state = useObjectProperty(connection.state, "state");
  const phase = useObjectProperty(connection.state, "phase");
  if (state !== "connected") {
    return <Spinner />;
  }
  switch (phase) {
    case "lobby":
      return <LobbyPhase />;
    case "rolePicking":
      return <RolePickingPhase />;
    case "segmentsVoicing":
      return <SegmentsVoicingPhase />;
    case "finalizing":
      return <FinalizingPhase />;
    default:
      throw "unknown phase";
  }
}

function LobbyPhase() {
  return (
    <div className={style["lobby__container"]}>
      <ParticipantsList />
      <div className={style["lobby__actions"]}>
        <CopyJoinLinkButton />
        <StartRolePickingButton />
      </div>
    </div>
  );
}

function RolePickingPhase() {
  return (
    <div className={style["role-picking__container"]}>
      <span>Pick roles</span>
      <RolesList />
      <StartSegmentsVoicingButton />
    </div>
  );
}

function SegmentsVoicingPhase() {
  const { userID } = useAuthContext();
  const { connection } = useSessionContext();
  const store = useRef(
    new HTTPClipsStore(config.backendBaseURL, {
      cache: new IndexedDBCache("dubster", "clips"),
    }),
  ).current;
  const actors = useSnapshot(connection.state.actors);
  const clip = useObjectProperty(connection.state, "clip");
  const [video, setVideo] = useState<Blob | null>(null);

  const userRoles = actors
    .filter(({ userID: actorID }) => actorID === userID)
    .map(({ roleID }) => roleID);
  const isUserSegment = ({ roleID }: Segment) => userRoles.includes(roleID);
  const userSegments = Object.values(clip.segments).filter(isUserSegment);
  const userSortedSegments = userSegments.sort((a, b) => {
    if (a.begin.milliseconds < b.begin.milliseconds) {
      return -1;
    }
    if (a.begin.milliseconds > b.begin.milliseconds) {
      return 1;
    }
    return a.end.milliseconds - b.end.milliseconds;
  });

  useEffect(() => {
    store.download(clip.id).then(setVideo);
  }, [clip]);

  if (!video) {
    return <Spinner />;
  }

  return (
    <div className={style["segments-voicing__container"]}>
      <SegmentsVoicingContext
        value={makeState({
          segments: userSortedSegments,
          recordings: new Entities((r) => r.segmentID),
          currentSegmentID: userSortedSegments[0]!.id,
          video: makeState({
            state: "stopped",
            duration: new Duration(0),
            offset: userSortedSegments[0]!.begin,
            file: video,
          }),
        })}
      >
        <SegmentsProgress />
        <Video />
        <div className={style["segments-voicing__actions"]}>
          <VideoControls />
          <NextSegmentButton />
        </div>
      </SegmentsVoicingContext>
    </div>
  );
}

function FinalizingPhase() {
  return <div></div>;
}
