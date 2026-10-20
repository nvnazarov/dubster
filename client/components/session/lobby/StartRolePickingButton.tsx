import { useCallback, useState } from "react";

import Button from "@/components/shared/html/Button";
import { useSessionContext } from "@/components/session/context";

export default function StartRolePickingButton() {
  const { connection } = useSessionContext();
  const [switching, setSwitching] = useState(false);

  const switchToRolePicking = useCallback(async () => {
    try {
      setSwitching(true);
      await connection.switchToRolePicking();
    } finally {
      setSwitching(false);
    }
  }, [connection]);

  return (
    <Button
      text="Start"
      onClick={switchToRolePicking}
      progress={switching ? 0 : undefined}
      disabled={switching}
      primary
    />
  );
}
