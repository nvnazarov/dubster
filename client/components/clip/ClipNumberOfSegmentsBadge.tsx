import segmentIcon from "@/public/icons/maker.png";
import Badge from "@/components/shared/misc/Badge";
import { useClip } from "./ClipContext";

export default function ClipNumberOfSegmentsBadge() {
  const clip = useClip();
  const numberOfSegments = Object.keys(clip.segments).length;
  return <Badge text={numberOfSegments.toString()} icon={segmentIcon.src} />;
}
