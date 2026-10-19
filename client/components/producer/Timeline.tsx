import { MouseEvent as ReactMouseEvent, useCallback } from "react";

import style from "@/components/producer/Timeline.module.scss";
import { useProducerContext } from "@/components/producer/context";
import { Duration } from "@/lib/time";
import { makeState, useObjectProperty, useSnapshot } from "@/lib/state";

export default function Timeline() {
  return (
    <div className={style.container}>
      <Scroll />
      <Segments />
    </div>
  );
}

function Scroll() {
  const { video } = useProducerContext();
  const duration = useObjectProperty(video, "duration");

  const seekClickPosition = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const offset =
        (video.duration.milliseconds * (e.pageX - rect.x)) /
        e.currentTarget.clientWidth;
      video.offset = new Duration(offset);
    },
    [video],
  );

  const twoSecondsStep = 200 / (duration.seconds || 1);
  return (
    <div
      className={style.scroll}
      style={{
        backgroundImage: "linear-gradient(90deg, transparent 50%, black 50%)",
        backgroundSize: `${twoSecondsStep}% 1px`,
      }}
      onClick={seekClickPosition}
    >
      {duration.milliseconds > 0 && <Pointer />}
    </div>
  );
}

function Pointer() {
  const { video } = useProducerContext();
  const offset = useObjectProperty(video, "offset");
  const duration = useObjectProperty(video, "duration");
  const progress =
    100 *
    Math.min(1, offset.milliseconds / Math.max(duration.milliseconds, 0.1));
  const left = progress + "%";
  return <div className={style.pointer} style={{ left }}></div>;
}

function Segments() {
  const { clip, video, producer } = useProducerContext();
  const segments = useSnapshot(clip.segments);

  const createSegmentAtClickPosition = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (video.duration.milliseconds <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const offset =
        (video.duration.milliseconds * (e.pageX - rect.x)) /
        e.currentTarget.clientWidth;
      clip.segments.add(
        makeState({
          id: crypto.randomUUID(),
          begin: new Duration(offset),
          end: new Duration(
            Math.min(offset + 1000, video.duration.milliseconds),
          ),
          line: "",
          roleID: "",
        }),
      );
    },
    [video, clip],
  );

  const deselectSegment = useCallback(() => {
    producer.selectedSegmentID = null;
  }, [producer]);

  return (
    <div
      className={style.segments}
      onClick={deselectSegment}
      onDoubleClick={createSegmentAtClickPosition}
    >
      {segments.map((segment) => (
        <SegmentView key={segment.id} segmentID={segment.id} />
      ))}
    </div>
  );
}

export function SegmentView({ segmentID }: { segmentID: string }) {
  const { colorProvider, clip, video, producer } = useProducerContext();
  const segment = useSnapshot(clip.segments.get(segmentID));
  const selectedSegmentID = useObjectProperty(producer, "selectedSegmentID");

  const selectThisSegment = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      producer.selectedSegmentID = segment.id;
      video.offset = segment.begin;
    },
    [segment],
  );

  const hasRole = Boolean(segment.roleID);
  const isSegmentInvalid = segment.line === "" || !hasRole;
  const isSelected = segmentID === selectedSegmentID;

  const segmentDuration = segment.end.milliseconds - segment.begin.milliseconds;
  const roleColor = hasRole ? colorProvider.color(segment.roleID) : "grey";
  const borderColor = isSegmentInvalid ? "red" : "transparent";
  const left = (segment.begin.seconds / video.duration.seconds) * 100 + "%";
  const width = (segmentDuration / video.duration.milliseconds) * 100 + "%";

  return (
    <div
      className={style.segment}
      onClick={selectThisSegment}
      style={{
        left,
        width,
        backgroundColor: roleColor,
        borderColor: borderColor,
        opacity: isSelected ? 0.9 : 0.2,
        pointerEvents: isSelected ? "none" : "all",
      }}
    >
      {isSelected && (
        <>
          <BeginBar segmentID={selectedSegmentID} />{" "}
          <EndBar segmentID={selectedSegmentID} />
        </>
      )}
    </div>
  );
}

function BeginBar({ segmentID }: { segmentID: string }) {
  const { clip, video } = useProducerContext();
  const segment = clip.segments.get(segmentID);

  const startDrag = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startBegin = segment.begin;
    const startEnd = segment.end;
    const container = e.currentTarget.parentElement!.parentElement!;
    const handleMouseMove = (e: MouseEvent) => {
      const ratio = video.duration.milliseconds / container.clientWidth;
      const begin = Math.min(
        Math.max((e.clientX - startX) * ratio + startBegin.milliseconds, 0),
        startEnd.milliseconds - 500,
      );
      segment.begin = new Duration(begin);
      video.offset = segment.begin;
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  return <div className={style.beginbar} onMouseDown={startDrag}></div>;
}

function EndBar({ segmentID }: { segmentID: string }) {
  const { clip, video } = useProducerContext();
  const segment = clip.segments.get(segmentID);

  const startDrag = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startBegin = segment.begin;
    const startEnd = segment.end;
    const container = e.currentTarget.parentElement!.parentElement!;
    const handleMouseMove = (e: MouseEvent) => {
      const ratio = video.duration.milliseconds / container.clientWidth;
      const end = Math.max(
        Math.min(
          (e.clientX - startX) * ratio + startEnd.milliseconds,
          video.duration.milliseconds,
        ),
        startBegin.milliseconds + 500,
      );
      segment.end = new Duration(end);
      video.offset = segment.end;
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  return <div className={style.endbar} onMouseDown={startDrag}></div>;
}
