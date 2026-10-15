import { useCallback, useEffect, useState } from "react";

import style from "@/components/producer/RolesList.module.scss";
import { useCommandBus, useEventsQueue } from "@/components/producer/context";
import RoleView from "@/components/producer/Role";
import Event from "@/components/producer/events";
import { type Role } from "@/lib/models/clip";
import Button from "@/components/shared/html/Button";

export default function RolesList() {
  const events = useEventsQueue();
  const commands = useCommandBus();
  const [roles, setRoles] = useState<Role[]>([]);

  const handleRoleAdded = useCallback((e: Event["role.added"]) => {
    setRoles((roles) => [...roles, e.role]);
  }, []);

  const handleRoleChanged = useCallback((e: Event["role.changed"]) => {
    setRoles((roles) =>
      roles.map((role) => (role.id == e.role.id ? e.role : role)),
    );
  }, []);

  const handleRoleDeleted = useCallback((e: Event["role.deleted"]) => {
    setRoles((roles) => roles.filter((role) => role.id !== e.role.id));
  }, []);

  const createRole = useCallback(async () => {
    await commands.execute("role.add", {
      role: { id: crypto.randomUUID(), name: "" },
    });
  }, [commands]);

  useEffect(() => {
    events.subscribe("role.added", handleRoleAdded);
    events.subscribe("role.changed", handleRoleChanged);
    events.subscribe("role.deleted", handleRoleDeleted);
    return () => {
      events.unsubscribe("role.added", handleRoleAdded);
      events.unsubscribe("role.changed", handleRoleChanged);
      events.unsubscribe("role.deleted", handleRoleDeleted);
    };
  }, [events]);

  return (
    <div className={style.container}>
      {roles.map((role) => (
        <RoleView key={role.id} role={role} />
      ))}
      <Button text="New Role" onClick={createRole} />
    </div>
  );
}
