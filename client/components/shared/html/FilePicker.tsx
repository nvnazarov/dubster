import { InputHTMLAttributes, useId } from "react";

import style from "@/components/shared/html/FilePicker.module.scss";

export type FilePickerAttributes = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "style" | "className" | "type"
>;

export default function FilePicker({ ...props }: FilePickerAttributes) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className={style.label}>
        Open Video
      </label>
      <input id={id} type="file" className={style.input} {...props} />
    </>
  );
}
