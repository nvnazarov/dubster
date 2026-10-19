import { type ChangeEvent, useCallback, useId } from "react";

import style from "@/components/library/SortByRating.module.scss";
import { useLibraryContext } from "@/components/library/context";
import { useObjectProperty } from "@/lib/state";

export default function SortByRatingFilter() {
  const id = useId();
  const { filter } = useLibraryContext();
  const sortByRating = useObjectProperty(filter, "sortByRating");

  const changeSorting = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    filter.sortByRating = checked;
  }, []);

  return (
    <div className={style.container}>
      <input
        id={id}
        type="checkbox"
        checked={sortByRating}
        onChange={changeSorting}
      />
      <label htmlFor={id} className={style.label}>
        Sort by rating
      </label>
    </div>
  );
}
