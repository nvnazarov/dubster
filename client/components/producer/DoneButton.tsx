import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/shared/html/Button";
import { useProducerContext } from "@/components/producer/context";
import { useObjectProperty, useSnapshot } from "@/lib/state";
import { Role, Segment } from "@/lib/models/clip";

export default function DoneButton() {
  const { video, clip, clips, verifier, store } = useProducerContext();
  const snapshot = useSnapshot(clip);
  const file = useObjectProperty(video, "file");
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);

  const done = useCallback(async () => {
    if (!file) return;
    try {
      setProgress(0);
      const clip = await clips.create({
        title: snapshot.title,
        description: snapshot.description,
        roles: snapshot.roles.reduce(
          (prev, role) => {
            prev[role.id] = role;
            return prev;
          },
          {} as Record<Role["id"], Role>,
        ),
        segments: snapshot.segments.reduce(
          (prev, segment) => {
            prev[segment.id] = segment;
            return prev;
          },
          {} as Record<Segment["id"], Segment>,
        ),
      });
      await verifier.requestVerification(clip.id);
      await store.upload(clip.id, file, { onProgress: setProgress });
      router.replace(`/clips/${clip.id}`);
    } finally {
      setProgress(null);
    }
  }, [snapshot, clips, verifier, video, store, file]);

  const isValid = (() => {
    if (!file) return false;
    if (snapshot.title === "") return false;
    if (snapshot.segments.length === 0) return false;
    if (snapshot.roles.length === 0) return false;
    const usedRoles = new Set<Role["id"]>();
    for (const segment of snapshot.segments) {
      if (segment.roleID === "") return false;
      usedRoles.add(segment.roleID);
    }
    if (usedRoles.size !== snapshot.roles.length) return false;
    return true;
  })();

  return (
    <Button
      text="Done"
      onClick={done}
      disabled={!isValid || progress !== null}
      progress={progress || undefined}
      primary
    />
  );
}
