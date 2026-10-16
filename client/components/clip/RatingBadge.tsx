import RatingBadge from "@/components/shared/misc/RatingBadge";
import { useClipContext } from "@/components/clip/context";

export default function ClipRatingBadge() {
  const { clip } = useClipContext();
  return <RatingBadge rating={clip.rating} />;
}
