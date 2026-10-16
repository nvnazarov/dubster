import segmentIcon from "@/public/icons/maker.png";
import Badge from "@/components/shared/misc/Badge";
import { useClipContext } from "@/components/clip/context";

export default function NumberOfSegmentsBadge() {
  const { clip } = useClipContext();
  const numberOfSegments = Object.keys(clip.segments).length;
  return <Badge text={numberOfSegments.toString()} icon={segmentIcon.src} />;
}
