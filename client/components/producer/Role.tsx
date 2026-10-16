import { ChangeEvent, useCallback, useEffect, useState } from "react";

import style from "@/components/producer/Role.module.scss";
import TextInput from "@/components/shared/html/TextInput";
import Select from "@/components/shared/html/Select";
import Button from "@/components/shared/html/Button";
import { type Role } from "@/lib/models/clip";
import { useProducerState } from "./context";

export default function Role({ roleID }: { roleID: string }) {
  const state = useProducerState();
  const [role, setRole] = useState<Role>({ id: "", name: "" });

  useEffect(() => {
    const role = state.roles[roleID];
    if (!role) {
      throw `role ${roleID} does not exist`;
    }
    const sub = role.subscribe(setRole);
    return () => {
      sub.cancel();
    };
  }, [state, roleID]);

  const changeName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const change = { ...role, name: e.currentTarget.value };
      commands.execute("role.change", { role: change });
    },
    [role],
  );

  const removeRole = useCallback(() => {
    state.roles.delete(role.id);
  }, [role.id]);

  const changeSex = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const changed = { ...role };
      const sex = e.currentTarget.value;
      switch (sex) {
        case "na":
          delete changed.sex;
          break;
        case "male":
        case "female":
          changed.sex = sex;
          break;
        default:
          throw `invalid sex value: ${sex}`;
      }
      
    },
    [role],
  );

  const roleColor = colorProvider.color(role.id);
  return (
    <div className={style.container}>
      <TextInput
        value={role.name}
        placeholder="Role Name"
        onChange={changeName}
        style={{ color: roleColor }}
      />
      <Select value={role.sex} onChange={changeSex} defaultValue={"na"}>
        <option value={"na"}>N/A</option>
        <option value={"male"}>Male</option>
        <option value={"female"}>Female</option>
      </Select>
      <Button text="Remove" onClick={removeRole} />
    </div>
  );
}
