import style from "./Select.module.scss";
import { SelectHTMLAttributes } from "react";

export type SelectAttributes = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "style" | "className"
> & {
  text?: string;
};

export default function Select({ children, ...props }: SelectAttributes) {
  return (
    <select className={style.container} {...props}>
      {children}
    </select>
  );
}
