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
import { useObjectProperty } from "@/lib/state";
import config from "@/lib/config";
import StartSegmentsVoicingButton from "@/components/session/rolePicking/StartSegmentsVoicingButton";
import RolesList from "@/components/session/rolePicking/RolesList";

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
  return <div></div>;
}

function FinalizingPhase() {
  return <div></div>;
}
