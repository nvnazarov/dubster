import { ButtonHTMLAttributes } from "react";

import style from "@/components/shared/html/Button.module.scss";

export type ButtonAttributes = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  text?: string;
  icon?: string;
  primary?: boolean;
  progress?: number;
};

export default function Button({
  text,
  icon,
  primary = false,
  progress,
  ...props
}: ButtonAttributes) {
  let klass =
    style.button +
    " " +
    (primary ? style["button-primary"] : style["button-default"]);
  if (!text) {
    klass += " " + style["button-icon"];
  }
  return (
    <button className={klass} {...props}>
      {progress !== undefined ? (
        <span className={style.spinner} />
      ) : (
        icon !== undefined && <img src={icon} />
      )}
      {text && <span>{text}</span>}
      {progress !== undefined && (
        <div className={style.progress} style={{ width: `${progress}%` }} />
      )}
    </button>
  );
}
