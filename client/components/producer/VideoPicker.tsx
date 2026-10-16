import { ChangeEvent, useCallback } from "react";
import FilePicker from "@/components/shared/html/FilePicker";
import { useProducerState } from "./context";

export default function VideoPicker() {
  const state = useProducerState();

  const handleVideoPick = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (!files || files.length != 1) {
        return;
      }
      state.videoFile.value = files[0]!;
    },
    [state],
  );

  return <FilePicker onChange={handleVideoPick} />;
}
