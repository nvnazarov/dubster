import { useCallback } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/shared/html/Button";
import { useProducerContext } from "@/components/producer/context";

export default function DoneButton() {
  const { state, clips, verifier } = useProducerContext();
  const router = useRouter();

  const done = useCallback(async () => {
    const clip = await clips.create({
      id: crypto.randomUUID(),
      title: state.clip.title,
      description: state.clip.description,
      roles: state.clip.roles.entities,
      segments: state.clip.segments.entities,
    });
    await verifier.requestVerification(clip.id);
    router.replace(`/clips/${clip.id}`);
  }, [state, clips, verifier]);

  return <Button text="Done" onClick={done} primary />;
}
