import style from "./RatingBadge.module.scss";

export default function RatingBadge({ rating }: { rating?: number }) {
  const color =
    rating === undefined
      ? "grey"
      : rating > 4
        ? "green"
        : rating > 3
          ? "#a85c00"
          : "darkred";
  return (
    <div className={style.container} style={{ backgroundColor: color }}>
      {rating === undefined ? "?" : Math.max(1, rating).toFixed(1)}
    </div>
  );
}
