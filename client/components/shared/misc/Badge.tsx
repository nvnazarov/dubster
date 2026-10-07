import styles from "./Badge.module.scss";

export default function Badge({ text, icon }: { text: string; icon?: string }) {
  return (
    <div className={styles.badge}>
      <span>{text}</span>
      {icon && <img src={icon} />}
    </div>
  );
}
