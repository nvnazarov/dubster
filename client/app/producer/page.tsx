"use client";

import { useRef } from "react";

import style from "./page.module.scss";
import Header from "@/components/shared/misc/Header";
import { ProducerContext } from "@/components/producer/ProducerContext";
import SyncEventsQueue from "@/lib/impl/syncEventsQueue";
import ProducerVideo from "@/components/producer/ProducerVideo";
import ProducerPlayVideoButton from "@/components/producer/PlayVideoButton";
import { ProducerTimeline } from "@/components/producer/ProducerTimeline";
import ProducerRolesList from "@/components/producer/RolesList";
import ProducerSelectedSegmentInfo from "@/components/producer/ProducerSelectedSegmentInfo";
import SyncCommandBus from "@/lib/impl/syncCommandBus";
import { ProducerCommand, ProducerEvent } from "@/lib/services/producer";
import CyclicalColorProvider from "@/lib/impl/cyclicalColorProvider";

export default function ProducerPage() {
  const eventsQueueRef = useRef(new SyncEventsQueue<ProducerEvent>());
  const commandBusRef = useRef(new SyncCommandBus<ProducerCommand>());
  const colorProviderRef = useRef(
    new CyclicalColorProvider(["#bbe83e", "#28dee8", "#d71ebc"]),
  );
  return (
    <div className={style.page}>
      <Header />
      <ProducerContext
        value={{
          eventsQueue: eventsQueueRef.current,
          commandBus: commandBusRef.current,
          colorProvider: colorProviderRef.current,
        }}
      >
        <div className={style.outer}>
          <div className={style.header}>
            <div className={style.left}>
              <ProducerVideo />
              <ProducerSelectedSegmentInfo />
            </div>
            <div className={style.right}>
              <ProducerRolesList />
            </div>
          </div>
          <div className={style.timeline}>
            <ProducerTimeline />
          </div>
          <div className={style.controls}>
            <ProducerPlayVideoButton />
          </div>
        </div>
      </ProducerContext>
    </div>
  );
}
