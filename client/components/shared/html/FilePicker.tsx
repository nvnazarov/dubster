import style from "./FilePicker.module.scss";
import { InputHTMLAttributes } from "react";

export type FilePickerAttributes = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "style" | "className" | "type"
>;

export default function FilePicker({ ...props }: FilePickerAttributes) {
  return <input type="file" className={style.container} {...props} />;
}
