import { useCallback, useState } from "react";

import Button from "@/components/shared/html/Button";
import { useSessionContext } from "@/components/session/context";
import { useSnapshot } from "@/lib/state";

export default function StartSegmentsVoicingButton() {
  const { connection } = useSessionContext();
  const participants = useSnapshot(connection.state.participants);
  const actors = useSnapshot(connection.state.actors);
  const [switching, setSwitching] = useState(false);

  const switchToSegmentsVoicing = useCallback(async () => {
    try {
      setSwitching(true);
      await connection.switchToSegmentsVoicing();
    } finally {
      setSwitching(false);
    }
  }, [connection]);

  const actingParticipants = actors.map((a) => a.userID);
  const everyParticipantHasRole = participants.every((p) =>
    actingParticipants.includes(p.userID),
  );

  return (
    <Button
      text="Start voicing"
      onClick={switchToSegmentsVoicing}
      progress={switching ? 0 : undefined}
      disabled={switching || !everyParticipantHasRole}
      title={
        everyParticipantHasRole ? undefined : "Not all participants have a role"
      }
      primary
    />
  );
}
