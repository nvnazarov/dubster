import style from "./Dialog.module.scss";
import { type ReactNode } from "react";

export default function Dialog({ children }: { children?: ReactNode }) {
  return <div className={style.container}>{children}</div>;
}
