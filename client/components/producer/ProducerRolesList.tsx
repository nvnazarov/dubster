import { ChangeEvent, useCallback, useEffect, useState } from "react";

import style from "./ProducerRolesList.module.scss";
import {
  useColorProvider,
  useEventsQueue,
  useProducer,
} from "./ProducerContext";
import { Role } from "@/lib/models";
import { Event } from "@/lib/services/eventsQueue";
import Button from "@/components/shared/html/Button";
import TextInput from "@/components/shared/html/TextInput";
import Select from "@/components/shared/html/Select";

function RoleInList({ role }: { role: Role }) {
  const [name, setName] = useState(role.name);
  const [sex, setSex] = useState(role.sex);
  const producer = useProducer();
  const eq = useEventsQueue();
  const colorProvider = useColorProvider();

  const handleRoleChange = useCallback(
    (e: Event["producer.role.change"]) => {
      if (e.role.id === role.id) {
        setName(e.role.name);
      }
    },
    [role.id],
  );

  useEffect(() => {
    eq.subscribe("producer.role.change", handleRoleChange);
    return () => {
      eq.unsubscribe("producer.role.change", handleRoleChange);
    };
  }, [eq]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      producer.changeRole({ id: role.id, name: e.target.value });
    },
    [producer, role],
  );

  const removeThisRole = useCallback(() => {
    producer.removeRole(role);
  }, [role.id]);

  const changeSex = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      producer.changeRole({ id: role.id, sex: e.target.value as Role["sex"] });
    },
    [role.id],
  );

  return (
    <div className={style.role}>
      <TextInput
        value={name}
        placeholder="Role Name"
        onChange={handleChange}
        style={{ color: colorProvider.color(role.id) }}
      />
      <Select value={sex} onChange={changeSex}>
        <option value={undefined as Role["sex"]}>N/A</option>
        <option value={"male" as Role["sex"]}>Male</option>
        <option value={"female" as Role["sex"]}>Female</option>
      </Select>
      <Button text="Remove" onClick={removeThisRole} />
    </div>
  );
}

export default function ProducerRolesList() {
  const eq = useEventsQueue();
  const producer = useProducer();
  const [roles, setRoles] = useState<Role[]>([]);

  const handleRoleAdd = useCallback((e: Event["producer.role.add"]) => {
    setRoles((roles) => [...roles, e.role]);
  }, []);

  const handleRoleRemove = useCallback((e: Event["producer.role.remove"]) => {
    setRoles((roles) => roles.filter((role) => role.id !== e.role.id));
  }, []);

  const handleClick = useCallback(() => {
    producer.addRole({});
  }, []);

  useEffect(() => {
    eq.subscribe("producer.role.add", handleRoleAdd);
    eq.subscribe("producer.role.remove", handleRoleRemove);
    return () => {
      eq.unsubscribe("producer.role.add", handleRoleAdd);
      eq.unsubscribe("producer.role.remove", handleRoleRemove);
    };
  }, [eq]);

  return (
    <div className={style.container}>
      {roles.map((role) => (
        <RoleInList key={role.id} role={role} />
      ))}
      <Button text="Add Role" onClick={handleClick} />
    </div>
  );
}
