"use client";
import { useRef } from "react";

import style from "@/app/library/page.module.scss";
import Header from "@/components/shared/misc/Header";
import TitleFilter from "@/components/library/TitleFilter";
import Feed from "@/components/library/Feed";
import LibraryContext from "@/components/library/LibraryContext";
import SyncEventsQueue from "@/lib/impl/syncEventsQueue";
import HTTPLibrary from "@/lib/impl/httpLibrary";
import { config } from "@/lib/config";

export default function LibraryPage() {
  const eventsQueueRef = useRef(new SyncEventsQueue());
  const libraryRef = useRef(
    new HTTPLibrary(config.backendBaseURL, eventsQueueRef.current),
  );
  return (
    <div className={style.page}>
      <Header />
      <LibraryContext
        value={{
          library: libraryRef.current,
          eventsQueue: eventsQueueRef.current,
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
