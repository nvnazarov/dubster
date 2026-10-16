"use client";

import { useEffect, useRef } from "react";

import style from "@/app/producer/page.module.scss";
import Header from "@/components/shared/misc/Header";
import ProducerContext from "@/components/producer/context";
import Video from "@/components/producer/Video";
import VideoPicker from "@/components/producer/VideoPicker";
import PlayVideoButton from "@/components/producer/PlayVideoButton";
import Timeline from "@/components/producer/Timeline";
import RolesList from "@/components/producer/RolesList";
import Event from "@/components/producer/events";
import Command from "@/components/producer/commands";
import CyclicalColorProvider from "@/lib/impl/cyclicalColorProvider";
import SyncEventsQueue from "@/lib/impl/syncEventsQueue";
import SyncCommandBus from "@/lib/impl/syncCommandBus";
import Producer from "@/lib/services/producer";
import HTTPClipsRepostory from "@/lib/impl/httpClipsRepository";
import { config } from "@/lib/config";
import SelectedSegment from "@/components/producer/SelectedSegment";
import DoneButton from "@/components/producer/DoneButton";

export default function ProducerPage() {
  const ref = useRef({
    events: new SyncEventsQueue<Event>(),
    commands: new SyncCommandBus<Command>(),
    colorProvider: new CyclicalColorProvider(["#bbe83e", "#28dee8", "#d71ebc"]),
    producer: new Producer(new HTTPClipsRepostory(config.backendBaseURL)),
  }).current;

  useEffect(() => {
    ref.commands.handle("role.add", (cmd) => {
      ref.producer.roles.add(cmd.role);
      ref.events.publish("role.added", { role: cmd.role });
    });
    ref.commands.handle("role.change", (cmd) => {
      ref.producer.roles.change(cmd.role);
      ref.events.publish("role.changed", { role: cmd.role });
    });
    ref.commands.handle("role.delete", (cmd) => {
      const role = ref.producer.roles.delete(cmd.roleID);
      ref.events.publish("role.deleted", { role });
    });
    ref.commands.handle("segment.add", (cmd) => {
      ref.producer.segments.add(cmd.segment);
      ref.events.publish("segment.added", { segment: cmd.segment });
    });
    ref.commands.handle("segment.change", (cmd) => {
      ref.producer.segments.change(cmd.segment);
      ref.events.publish("segment.changed", { segment: cmd.segment });
    });
    ref.commands.handle("segment.delete", (cmd) => {
      const segment = ref.producer.segments.delete(cmd.segmentID);
      ref.events.publish("segment.deleted", { segment });
    });
    ref.commands.handle("segment.select", (cmd) => {
      const segment = ref.producer.segments.get(cmd.segmentID);
      ref.events.publish("segment.selected", { segment });
    });
  }, []);

  return (
    <div className={style.page}>
      <Header />
      <ProducerContext
        value={{
          eventsQueue: ref.events,
          commandBus: ref.commands,
          colorProvider: ref.colorProvider,
        }}
      >
        <div className={style.outer}>
          <div className={style.header}>
            <div className={style.left}>
              <Video />
              <div className={style.actions}>
                <VideoPicker />
                <PlayVideoButton />
                <DoneButton />
              </div>
            </div>
            <div className={style.right}>
              <RolesList />
            </div>
          </div>
          <div>
            <SelectedSegment />
          </div>
          <div>
            <Timeline />
          </div>
        </div>
      </ProducerContext>
    </div>
  );
}
