"use client";
import style from "./PageList.module.scss";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "./context";
import {
  type Page,
  type SoloSessionKeyEventMap,
} from "@/lib/services/soloSession";

function PageTab({ page, active }: { page: Page; active: boolean }) {
  const session = useSession();

  const handleClick = useCallback(() => {
    session.switch(page.number);
  }, [page.number]);

  const klass =
    style.tab + " " + (active ? style["tab-active"] : style["tab-default"]);

  return (
    <div onClick={handleClick} className={klass}>
      Segment {page.number}
    </div>
  );
}

export default function PagesList() {
  const session = useSession();
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>();

  const handlePageChange = useCallback(
    (e: SoloSessionKeyEventMap["change"]) => {
      setPages((pages) =>
        pages.map((p) => {
          if (p.segment.id === e.page.segment.id) {
            return e.page;
          }
          return p;
        }),
      );
    },
    [],
  );

  const handlePageSwitch = useCallback(
    (e: SoloSessionKeyEventMap["switch"]) => {
      setCurrentPage(e.page);
    },
    [],
  );

  useEffect(() => {
    setPages([...session.pages]);
    setCurrentPage(session.page);
    session.addEventListener("change", handlePageChange);
    session.addEventListener("switch", handlePageSwitch);
    return () => {
      session.removeEventListener("change", handlePageChange);
      session.removeEventListener("switch", handlePageSwitch);
    };
  }, [session]);

  return (
    <div className={style.list}>
      {pages.map((page) => (
        <PageTab
          key={page.number}
          page={page}
          active={page.number === currentPage?.number}
        />
      ))}
    </div>
  );
}
