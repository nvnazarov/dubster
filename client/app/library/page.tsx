"use client";
import style from "./page.module.scss";
import Header from "@/components/shared/misc/Header";
import TitleFilter from "@/components/library/TitleFilter";
import Feed from "@/components/library/Feed";
import LibraryContext from "@/components/library/LibraryContext";
import FakeLibrary from "@/lib/impl/fakeLibrary";
import SyncEventsQueue from "@/lib/impl/syncEventsQueue";
import { useRef } from "react";

export default function LibraryPage() {
  const eventsQueueRef = useRef(new SyncEventsQueue());
  const libraryRef = useRef(new FakeLibrary(eventsQueueRef.current));
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
