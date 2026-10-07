import style from "./Button.module.scss";
import { ButtonHTMLAttributes } from "react";

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
  const klass =
    style.button +
    " " +
    (primary ? style["button-primary"] : style["button-default"]);
  return (
    <button className={klass} {...props}>
      {progress !== undefined ? (
        <span className={style.spinner} />
      ) : (
        icon !== undefined && <img src={icon} />
      )}
      {text}
      {progress !== undefined && (
        <div className={style.progress} style={{ width: `${progress}%` }} />
      )}
    </button>
  );
}
