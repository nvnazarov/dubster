import style from "./FilePicker.module.scss";
import { InputHTMLAttributes, useId } from "react";

export type FilePickerAttributes = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "style" | "className" | "type"
>;

export default function FilePicker({ ...props }: FilePickerAttributes) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className={style.label}>Open Video</label>
      <input id={id} type="file" className={style.input} {...props} />
    </>
  );
}
