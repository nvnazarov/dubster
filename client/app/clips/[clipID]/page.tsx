"use client";
import { useRef } from "react";

import style from "./page.module.scss";
import Header from "@/components/shared/misc/Header";
import ClipTitle from "@/components/clip/ClipTitle";
import ClipDescription from "@/components/clip/ClipDescription";
import PlaySoloButton from "@/components/clip/PlaySoloButton";
import PlayPartyButton from "@/components/clip/PlayPartyButton";
import ClipContext from "@/components/clip/ClipContext";
import ClipVideo from "@/components/clip/ClipVideo";
import ClipRolesList from "@/components/clip/ClipRolesList";
import ClipNumberOfRolesBadge from "@/components/clip/ClipNumberOfRolesBadge";
import ClipNumberOfSegmentsBadge from "@/components/clip/ClipNumberOfSegmentsBadge";
import SyncEventsQueue from "@/lib/impl/syncEventsQueue";

import { Duration } from "@/lib/util/time";
import FakeSessionRepository from "@/lib/impl/fakeSessionRepository";
import { type Clip } from "@/lib/models";
import ClipRatingBadge from "@/components/clip/ClipRatingBadge";
import ClipSessionsList from "@/components/clip/ClipSessionsList";
import ClipAuthor from "@/components/clip/ClipAuthor";

export default function ClipPage() {
  const eventsQueueRef = useRef(new SyncEventsQueue());
  const sessionsRef = useRef(new FakeSessionRepository());
  const clipRef = useRef<Clip>({
    id: "",
    title: "Clip Title",
    description: "Clip description.",
    author: {
      id: "13006901854022",
      name: "user",
    },
    segments: {
      "1": {
        id: "1",
        begin: new Duration(0),
        end: new Duration(1000),
        line: "",
        role: {
          id: "1",
          name: "Fiona",
          sex: "female",
        },
      },
      "2": {
        id: "2",
        begin: new Duration(1100),
        end: new Duration(3500),
        line: "",
        role: {
          id: "2",
          name: "Shrek",
          sex: "male",
        },
      },
    },
    rating: 4.3,
    verified: true,
    dateCreated: new Date(),
  });
  return (
    <div className={style.page}>
      <Header />
      <ClipContext
        value={{
          eventsQueue: eventsQueueRef.current,
          sessions: sessionsRef.current,
          clip: clipRef.current,
        }}
      >
        <div className={style.container}>
          <div className={style.header}>
            <div className={style.title}>
              <ClipTitle />
              <ClipAuthor />
            </div>
            <div className={style.actions}>
              <PlaySoloButton />
              <PlayPartyButton />
            </div>
          </div>
          <div className={style.body}>
            <div className={style["left-column"]}>
              <ClipVideo />
              <ClipDescription />
            </div>
            <div className={style["right-column"]}>
              <div className={style.badges}>
                <ClipRatingBadge />
                <ClipNumberOfRolesBadge />
                <ClipNumberOfSegmentsBadge />
              </div>
              <ClipRolesList />
              <ClipSessionsList />
            </div>
          </div>
        </div>
      </ClipContext>
    </div>
  );
}
