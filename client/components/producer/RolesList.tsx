import { ChangeEvent, useCallback, useEffect, useState } from "react";
import style from "./RolesList.module.scss";
import {
  useColorProvider,
  useCommandBus,
  useEventsQueue,
} from "./ProducerContext";
import { Role } from "@/lib/models/clip";
import Button from "@/components/shared/html/Button";
import TextInput from "@/components/shared/html/TextInput";
import Select from "@/components/shared/html/Select";
import { ProducerEvent } from "@/lib/services/producer";

function RoleInList({ role }: { role: Role }) {
  const colorProvider = useColorProvider();

  const changeName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      producer.changeRole({ id: role.id, name: e.target.value });
    },
    [role],
  );

  const removeRole = useCallback(() => {
    producer.removeRole(role);
  }, [role]);

  const changeSex = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      producer.changeRole({ id: role.id, sex: e.target.value as Role["sex"] });
    },
    [role.id],
  );

  const roleColor = colorProvider.color(role.id);
  return (
    <div className={style.role}>
      <TextInput
        value={role.name}
        placeholder="Role Name"
        onChange={changeName}
        style={{ color: roleColor }}
      />
      <Select value={role.sex} onChange={changeSex}>
        <option value={undefined as Role["sex"]}>N/A</option>
        <option value={"male" as Role["sex"]}>Male</option>
        <option value={"female" as Role["sex"]}>Female</option>
      </Select>
      <Button text="Remove" onClick={removeRole} />
    </div>
  );
}

export default function RolesList() {
  const events = useEventsQueue();
  const commands = useCommandBus();
  const [roles, setRoles] = useState<Role[]>([]);

  const handleRoleAdded = useCallback((e: ProducerEvent["role.added"]) => {
    setRoles((roles) => [...roles, e.role]);
  }, []);

  const handleRoleChanged = useCallback((e: ProducerEvent["role.changed"]) => {
    setRoles((roles) =>
      roles.map((role) => (role.id == e.role.id ? e.role : role)),
    );
  }, []);

  const handleRoleRemoved = useCallback((e: ProducerEvent["role.removed"]) => {
    setRoles((roles) => roles.filter((role) => role.id !== e.role.id));
  }, []);

  const createRole = useCallback(async () => {
    await commands.execute("role.add", undefined);
  }, [commands]);

  useEffect(() => {
    events.subscribe("role.added", handleRoleAdded);
    events.subscribe("role.changed", handleRoleChanged);
    events.subscribe("role.removed", handleRoleRemoved);
    return () => {
      events.unsubscribe("role.added", handleRoleAdded);
      events.unsubscribe("role.changed", handleRoleChanged);
      events.unsubscribe("role.removed", handleRoleRemoved);
    };
  }, [events]);

  return (
    <div className={style.container}>
      {roles.map((role) => (
        <RoleInList key={role.id} role={role} />
      ))}
      <Button text="New Role" onClick={createRole} />
    </div>
  );
}
