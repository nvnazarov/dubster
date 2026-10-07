import style from "./TextInput.module.scss";
import { InputHTMLAttributes } from "react";

export type TextInputAttributes = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
>;

export default function TextInput({ ...props }: TextInputAttributes) {
  return <input className={style.input} {...props} />;
}
