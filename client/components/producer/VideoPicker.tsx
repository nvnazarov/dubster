import { ChangeEvent, useCallback } from "react";
import FilePicker from "@/components/shared/html/FilePicker";
import { useCommandBus } from "@/components/producer/context";

export default function VideoPicker() {
  const commands = useCommandBus();

  const handleVideoPick = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (!files || files.length != 1) {
        return;
      }
      await commands.execute("video.open", { file: files[0]! });
    },
    [commands],
  );

  return <FilePicker onChange={handleVideoPick} />;
}
