"use client";
import { useRef } from "react";

import style from "@/app/library/page.module.scss";
import Header from "@/components/shared/misc/Header";
import TitleFilter from "@/components/library/TitleFilter";
import Feed from "@/components/library/Feed";
import LibraryContext from "@/components/library/context";
import HTTPLibrary from "@/lib/impl/httpLibrary";
import config from "@/lib/config";
import { makeState } from "@/lib/state";
import FilterFromQueryParams from "@/components/library/FilterFromQueryParams";
import SortByRatingFilter from "@/components/library/SortByRatingFilter";

export default function LibraryPage() {
  const library = useRef(new HTTPLibrary(config.backendBaseURL)).current;
  return (
    <div className={style.page}>
      <Header />
      <LibraryContext
        value={{
          library,
          filter: makeState({ sortByRating: false }),
        }}
      >
        <div className={style.container}>
          <div className={style.aside}>
            <FilterFromQueryParams />
            <TitleFilter />
            <SortByRatingFilter />
          </div>
          <div className={style.feed}>
            <Feed />
          </div>
          <div className={style.aside}></div>
        </div>
      </LibraryContext>
    </div>
  );
}
