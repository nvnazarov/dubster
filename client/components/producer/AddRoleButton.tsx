import { useCallback } from "react";

import Button from "@/components/shared/html/Button";
import { useProducerContext } from "@/components/producer/context";
import { Role } from "@/lib/models/clip";
import { makeState } from "@/lib/state";

export default function AddRoleButton() {
  const { clip } = useProducerContext();

  const createRole = useCallback(() => {
    const role: Role = {
      id: crypto.randomUUID(),
      name: "",
    };
    clip.roles.add(makeState(role));
  }, [clip]);

  return <Button text="Add Role" onClick={createRole} />;
}
