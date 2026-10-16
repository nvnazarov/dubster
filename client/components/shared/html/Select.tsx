import { SelectHTMLAttributes } from "react";

import style from "@/components/shared/html/Select.module.scss";

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
