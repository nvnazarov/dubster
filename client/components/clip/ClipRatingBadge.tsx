import RatingBadge from "@/components/shared/misc/RatingBadge";
import { useClip } from "./ClipContext";

export default function ClipRatingBadge() {
  const clip = useClip();
  return <RatingBadge rating={clip.rating} />;
}
