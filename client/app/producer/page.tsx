"use client";

import { useRef } from "react";

import style from "@/app/producer/page.module.scss";
import Header from "@/components/shared/misc/Header";
import ProducerContext from "@/components/producer/context";
import Video from "@/components/producer/Video";
import VideoPicker from "@/components/producer/VideoPicker";
import VideoControls from "@/components/producer/VideoControls";
import Timeline from "@/components/producer/Timeline";
import RolesList from "@/components/producer/RolesList";
import SelectedSegment from "@/components/producer/SelectedSegment";
import DoneButton from "@/components/producer/DoneButton";
import CyclicalColorProvider from "@/lib/impl/cyclicalColorProvider";
import HTTPClipsRepostory from "@/lib/impl/httpClipsRepository";
import config from "@/lib/config";
import HTTPClipVerifier from "@/lib/impl/httpClipVerifier";
import { Entities, makeState } from "@/lib/state";
import { Duration } from "@/lib/time";
import TitleInput from "@/components/producer/TitleInput";
import DescriptionInput from "@/components/producer/DescriptionInput";
import AddRoleButton from "@/components/producer/AddRoleButton";
import HTTPClipsStore from "@/lib/impl/httpClipsStore";

export default function ProducerPage() {
  const clips = useRef(new HTTPClipsRepostory(config.backendBaseURL)).current;
  const verifier = useRef(new HTTPClipVerifier(config.backendBaseURL)).current;
  const store = useRef(new HTTPClipsStore(config.backendBaseURL)).current;
  const colorProvider = useRef(
    new CyclicalColorProvider(["#bbe83e", "#28dee8", "#d71ebc"]),
  ).current;

  return (
    <div className={style.page}>
      <Header />
      <ProducerContext
        value={{
          clips,
          store,
          colorProvider,
          verifier,
          video: makeState({
            state: "stopped",
            offset: new Duration(0),
            duration: new Duration(0),
            file: null,
          }),
          clip: makeState({
            title: "",
            description: "",
            roles: new Entities((role) => role.id),
            segments: new Entities((segment) => segment.id),
          }),
          producer: makeState({
            selectedSegmentID: null,
          }),
        }}
      >
        <div className={style.container}>
          <div className={style.header}>
            <TitleInput />
            <div className={style.header__actions}>
              <VideoPicker />
              <AddRoleButton />
              <DoneButton />
            </div>
          </div>
          <div className={style.body}>
            <div className={style.left}>
              <Video />
              <div className={style.actions}>
                <VideoControls />
              </div>
            </div>
            <div className={style.right}>
              <DescriptionInput />
              <RolesList />
            </div>
          </div>
          <Timeline />
          <SelectedSegment />
        </div>
      </ProducerContext>
    </div>
  );
}
