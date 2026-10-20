import { useCallback } from "react";

import style from "@/components/session/rolePicking/RolePicker.module.scss";
import { useSessionContext } from "@/components/session/context";
import { useObjectProperty, useSnapshot } from "@/lib/state";
import { useAuthContext } from "@/components/shared/auth/context";
import { Duration } from "@/lib/time";

export default function RolePicker({ roleID }: { roleID: string }) {
  const { userID } = useAuthContext();
  const { connection } = useSessionContext();
  const clip = useObjectProperty(connection.state, "clip");
  const actors = useSnapshot(connection.state.actors);
  const participants = useSnapshot(connection.state.participants);

  const role = clip.roles[roleID]!;
  const segments = Object.values(clip.segments).filter(
    (s) => s.roleID === roleID,
  );
  const numberOfSegments = segments.length;
  const duration = new Duration(
    segments.reduce(
      (prev, s) => prev + s.end.milliseconds - s.begin.milliseconds,
      0,
    ),
  );
  const actor = actors.find((actor) => actor.roleID === roleID);

  const takeRole = useCallback(async () => {
    connection.takeRole(roleID);
  }, [connection, roleID]);

  const releaseRole = useCallback(async () => {
    connection.releaseRole(roleID);
  }, [connection, roleID]);

  const isFree = !actor;
  const isOccupiedByOtherUser = actor && actor.userID !== userID;
  const participant = participants.find((p) => p.userID === actor?.userID);
  return (
    <div
      className={style.container}
      onClick={
        isFree ? takeRole : isOccupiedByOtherUser ? undefined : releaseRole
      }
    >
      <span>{role.name}</span>
      {role.sex && <span>[{role.sex}]</span>}
      <span>Time: {duration.human()}</span>
      <span>#Segments: {numberOfSegments}</span>
      {participant && (
        <span>
          {participant.name || "Anonymous"}{" "}
          {participant.userID === userID && " (me)"}
        </span>
      )}
    </div>
  );
}
