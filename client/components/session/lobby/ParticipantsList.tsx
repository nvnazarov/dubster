import style from "@/components/session/lobby/ParticipantsList.module.scss";
import { useSessionContext } from "@/components/session/context";
import { useSnapshot } from "@/lib/state";
import { useAuthContext } from "@/components/shared/auth/context";

export default function ParticipantsList() {
  const { userID } = useAuthContext();
  const { connection } = useSessionContext();
  const participants = useSnapshot(connection.state.participants);

  return (
    <div className={style.container}>
      {participants.map((participant) => (
        <div key={participant.userID} className={style.participant}>
          {participant.name || "Anonymous"}
          {participant.userID === userID && " (me)"}
        </div>
      ))}
    </div>
  );
}
