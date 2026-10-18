import { ChangeEvent, useCallback } from "react";

import style from "@/components/producer/TitleInput.module.scss";
import { useProducerContext } from "@/components/producer/context";
import { useObjectProperty } from "@/lib/state";
import { MaxTitleLength } from "@/lib/models/clip";

export default function TitleInput() {
  const { clip } = useProducerContext();
  const title = useObjectProperty(clip, "title");

  const changeTitle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      clip.title = e.currentTarget.value.slice(0, MaxTitleLength);
    },
    [clip],
  );

  return (
    <input
      className={style.container}
      value={title}
      onChange={changeTitle}
      placeholder="Clip Title"
    />
  );
}
