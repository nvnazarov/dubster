"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import style from "@/app/clips/[clipID]/page.module.scss";
import Header from "@/components/shared/misc/Header";
import Title from "@/components/clip/Title";
import Description from "@/components/clip/Description";
import PlayButton from "@/components/clip/PlayButton";
import ClipContext from "@/components/clip/context";
import Video from "@/components/clip/Video";
import RolesList from "@/components/clip/RolesList";
import NumberOfRolesBadge from "@/components/clip/NumberOfRolesBadge";
import NumberOfSegmentsBadge from "@/components/clip/NumberOfSegmentsBadge";
import RatingBadge from "@/components/clip/RatingBadge";
import SessionsList from "@/components/clip/SessionsList";
import Author from "@/components/clip/Author";
import NotFound from "@/components/clip/NotFound";
import Spinner from "@/components/shared/misc/Spinner";
import DeleteButton from "@/components/clip/DeleteButton";
import { useAuthContext } from "@/components/shared/auth/context";
import HTTPSessionsRepository from "@/lib/impl/httpSessionsRepository";
import HTTPClipsRepostory from "@/lib/impl/httpClipsRepository";
import HTTPClipVerifier from "@/lib/impl/httpClipVerifier";
import config from "@/lib/config";
import { Clip } from "@/lib/models/clip";
import FakeUsersRepository from "@/lib/impl/fakeUsersRepository";
import { useObjectProperty } from "@/lib/state";
import HTTPClipsStore from "@/lib/impl/httpClipsStore";

export default function ClipPage() {
  const { clipID } = useParams();
  const auth = useAuthContext();
  const userID = useObjectProperty(auth, "userID");
  const [clip, setClip] = useState<Clip | null>(null);
  const [loading, setLoading] = useState(true);
  const users = useRef(new FakeUsersRepository()).current;
  const clips = useRef(new HTTPClipsRepostory(config.backendBaseURL)).current;
  const verifier = useRef(new HTTPClipVerifier(config.backendBaseURL)).current;
  const store = useRef(new HTTPClipsStore(config.backendBaseURL)).current;
  const sessions = useRef(
    new HTTPSessionsRepository(config.backendBaseURL),
  ).current;

  useEffect(() => {
    if (typeof clipID !== "string") {
      throw "ClipPage: clipID (path parameter) is not a string";
    }
    setLoading(true);
    clips
      .find(clipID)
      .then(setClip)
      .catch(console.error) // TODO: show error to the user.
      .finally(() => setLoading(false));
  }, [clipID]);

  return (
    <div className={style.page}>
      <Header />
      {loading ? (
        <Spinner />
      ) : clip ? (
        <ClipContext
          value={{
            clip,
            clips,
            sessions,
            verifier,
            users,
            store,
          }}
        >
          <div className={style.container}>
            <div className={style.header}>
              <div className={style.title}>
                <Title />
                <Author />
              </div>
              <div className={style.actions}>
                <PlayButton />
              </div>
            </div>
            <div className={style.body}>
              <div className={style["left-column"]}>
                <Video />
                <Description />
              </div>
              <div className={style["right-column"]}>
                <div className={style.badges}>
                  <RatingBadge />
                  <NumberOfRolesBadge />
                  <NumberOfSegmentsBadge />
                </div>
                <RolesList />
                <SessionsList />
                {userID == clip.authorID && (
                  <div className={style.authoractions}>
                    <DeleteButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        </ClipContext>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
