import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/shared/html/Button";
import { useClipContext } from "@/components/clip/context";

export default function DeleteButton() {
  const router = useRouter();
  const { clip, clips } = useClipContext();
  const [deleting, setDeleting] = useState(false);

  const deleteClip = useCallback(async () => {
    setDeleting(true);
    await clips.delete(clip.id).finally(() => setDeleting(false));
    router.replace("/library");
  }, [clip.id, clips, router]);

  return (
    <Button
      text="Delete clip"
      onClick={deleteClip}
      danger
      progress={deleting ? 0 : undefined}
    />
  );
}
