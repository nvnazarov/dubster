import { InputHTMLAttributes } from "react";

import style from "@/components/shared/html/TextInput.module.scss";

export type TextInputAttributes = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
>;

export default function TextInput({ ...props }: TextInputAttributes) {
  return <input className={style.input} {...props} />;
}
