import { ChangeEvent, useCallback } from "react";

import FilePicker from "@/components/shared/html/FilePicker";
import { useProducerContext } from "@/components/producer/context";
import { useObjectProperty } from "@/lib/state";

export default function VideoPicker() {
  const { video } = useProducerContext();
  const file = useObjectProperty(video, "file");

  const handleVideoPick = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (!files || files.length != 1) {
        return;
      }
      video.file = files[0]!;
    },
    [video],
  );

  const isVideoOpen = file !== null;
  return (
    <FilePicker
      onChange={handleVideoPick}
      text={isVideoOpen ? "Open another video" : "Open video"}
    />
  );
}
