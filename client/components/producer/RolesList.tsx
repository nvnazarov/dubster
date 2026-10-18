import { ChangeEvent, useCallback } from "react";

import style from "@/components/producer/RolesList.module.scss";
import crossIcon from "@/public/icons/cross.png";
import { useProducerContext } from "@/components/producer/context";
import { useSnapshot } from "@/lib/state";

export default function RolesList() {
  const { clip } = useProducerContext();
  const roles = useSnapshot(clip.roles);

  return (
    <div className={style.list}>
      {roles.map((role) => (
        <RoleView key={role.id} roleID={role.id} />
      ))}
    </div>
  );
}

function RoleView({ roleID }: { roleID: string }) {
  const { clip, colorProvider } = useProducerContext();
  const roleState = clip.roles.get(roleID);
  const role = useSnapshot(roleState);

  const changeName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      roleState.name = e.currentTarget.value;
    },
    [roleState],
  );

  const deleteRole = useCallback(() => {
    for (const segment of clip.segments) {
      if (segment.roleID === roleID) {
        segment.roleID = "";
      }
    }
    clip.roles.delete(roleID);
  }, [clip, roleID]);

  const changeSex = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const sex = e.currentTarget.value;
      switch (sex) {
        case "na":
          roleState.sex = undefined;
          break;
        case "male":
        case "female":
          roleState.sex = sex;
          break;
        default:
          throw `invalid sex value: ${sex}`;
      }
    },
    [roleState],
  );

  const roleColor = colorProvider.color(role.id);
  return (
    <div className={style.role}>
      <input
        value={role.name}
        placeholder="Role Name"
        onChange={changeName}
        style={{ color: roleColor }}
        className={style.role__name}
      />
      <select
        value={role.sex}
        onChange={changeSex}
        defaultValue={"na"}
        className={
          style.role__sex! +
          " " +
          (role.sex ? "" : style.role__sex__placeholder)
        }
      >
        <option value={"na"}>Sex</option>
        <option value={"male"}>Male</option>
        <option value={"female"}>Female</option>
      </select>
      <button className={style.role__delete} onClick={deleteRole}>
        <img src={crossIcon.src} />
      </button>
    </div>
  );
}
