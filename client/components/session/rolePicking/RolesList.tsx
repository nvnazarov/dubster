import style from "@/components/session/rolePicking/RolesList.module.scss";
import { useObjectProperty } from "@/lib/state";
import { useSessionContext } from "@/components/session/context";
import RolePicker from "./RolePicker";

export default function RolesList() {
  const { connection } = useSessionContext();
  const clip = useObjectProperty(connection.state, "clip");
  const roles = Object.values(clip.roles);

  return (
    <div className={style.container}>
      {roles.map((role) => (
        <RolePicker key={role.id} roleID={role.id} />
      ))}
    </div>
  );
}
