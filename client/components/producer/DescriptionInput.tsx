import { ChangeEvent, useCallback } from "react";

import style from "@/components/producer/DescriptionInput.module.scss";
import { useProducerContext } from "@/components/producer/context";
import { MaxDescriptionLength } from "@/lib/models/clip";
import { useObjectProperty } from "@/lib/state";

export default function DescriptionInput() {
  const { clip } = useProducerContext();
  const description = useObjectProperty(clip, "description");

  const changeDescription = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      clip.description = e.currentTarget.value.slice(0, MaxDescriptionLength);
    },
    [clip],
  );

  return (
    <textarea
      className={style.container}
      value={description}
      onChange={changeDescription}
      placeholder="Clip description."
      rows={3}
    />
  );
}
