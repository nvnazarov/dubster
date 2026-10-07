import { CSSProperties, useCallback, useState } from "react";
import {
  useColorProvider,
  useEventsQueue,
  useProducer,
} from "./ProducerContext";
import { type ProducerSegment } from "@/lib/services/producer";
import { Segment } from "@/lib/models";
import { Event } from "@/lib/services/eventsQueue";

export default function ProducerSegment({
  segment,
}: {
  segment: Pick<Segment, "id">;
}) {
  const eq = useEventsQueue();
  const producer = useProducer();
  const colorProvider = useColorProvider();
  const [selected, setSelected] = useState(false);
  const [color, setColor] = useState("grey");
  const [_segment, setSegment] = useState(producer.clip.segments[segment.id]);

  const handleSegmentSelect = useCallback(
    (e: Event["producer.segment.select"]) => {
      setSelected(e.segment.id === segment.id);
    },
    [segment.id],
  );

  const handleSegmentChange = useCallback(
    (e: Event["producer.segment.change"]) => {
      if (e.segment.id === segment.id) {
        const seg = producer.clip.segments[e.segment.id];
        setColor(seg.role ? colorProvider.color(seg.role.id) : "grey");
      }
    },
    [producer, colorProvider, segment.role, segment.id],
  );

  useEffect(() => {
    eq.subscribe("producer.segment.select", handleSegmentSelect);
    eq.subscribe("producer.segment.change", handleSegmentChange);
    return () => {
      eq.unsubscribe("producer.segment.select", handleSegmentSelect);
      eq.unsubscribe("producer.segment.change", handleSegmentChange);
    };
  }, [eq]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (selected) {
        return;
      }
      e.stopPropagation();
      producer.selectSegment(segment);
    },
    [selected, segment.id],
  );

  const segmentDuration =
    segment.end.milliseconds() - segment.begin.milliseconds();
  const width = (segmentDuration / video.duration.milliseconds()) * 100 + "%";
  const left =
    (segment.begin.milliseconds() / video.duration.milliseconds()) * 100 + "%";

  return (
    <div
      className={style.segment}
      onClick={handleClick}
      style={{
        left,
        width,
        backgroundColor: color,
        opacity: selected ? 0.9 : 0.4,
      }}
    ></div>
  );
}
