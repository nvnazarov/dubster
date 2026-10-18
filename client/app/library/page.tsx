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

export default function LibraryPage() {
  const library = useRef(new HTTPLibrary(config.backendBaseURL)).current;
  return (
    <div className={style.page}>
      <Header />
      <LibraryContext
        value={{
          library,
          filter: makeState({}),
        }}
      >
        <div className={style.container}>
          <TitleFilter />
          <div className={style.feed}>
            <Feed />
          </div>
        </div>
      </LibraryContext>
    </div>
  );
}
