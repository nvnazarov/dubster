import style from "./RatingBadge.module.scss";

export default function RatingBadge({ rating }: { rating?: number }) {
  const color = !rating
    ? "grey"
    : rating > 4
      ? "green"
      : rating > 3
        ? "#a85c00"
        : "darkred";
  const title = rating ? undefined : "Unrated";
  return (
    <div
      className={style.container}
      style={{ backgroundColor: color }}
      title={title}
    >
      {!rating ? "?" : Math.max(1, rating).toFixed(1)}
    </div>
  );
}
