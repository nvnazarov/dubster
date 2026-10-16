import { useCallback, useEffect, useState } from "react";

import style from "@/components/producer/RolesList.module.scss";
import { useProducerState } from "@/components/producer/context";
import RoleView from "@/components/producer/Role";
import Button from "@/components/shared/html/Button";
import { Role } from "@/lib/models/clip";

export default function RolesList() {
  const state = useProducerState();
  const [roles, setRoles] = useState<Role[]>([]);

  const createRole = useCallback(() => {
    const role: Role = {
      id: crypto.randomUUID(),
      name: "",
    };
    state.roles[role.id] = role;
  }, [state]);

  useEffect(() => {
    const sub = state.roles.subscribe((roles) => {
      setRoles(Object.values(roles));
    });
    return () => {
      sub.cancel();
    };
  }, [state]);

  return (
    <div className={style.container}>
      {roles.map((role) => (
        <RoleView key={role.id} roleID={role.id} />
      ))}
      <Button text="New Role" onClick={createRole} />
    </div>
  );
}
