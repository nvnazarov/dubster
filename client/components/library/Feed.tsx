import { UIEvent, useCallback, useEffect, useRef, useState } from "react";

import style from "./Feed.module.scss";
import {
  useEventsQueue,
  useLibrary,
} from "@/components/library/LibraryContext";
import Poster from "@/components/library/Poster";
import Spinner from "@/components/shared/misc/Spinner";
import { type Event } from "@/lib/services/eventsQueue";
import { type Cursor } from "@/lib/services/library";
import { type Clip } from "@/lib/models";
import { DeepReadonly } from "@/lib/util/type";
import ColumnarLayout from "@/lib/impl/columnarLayout";

export default function Feed() {
  const library = useLibrary();
  const eventsQueue = useEventsQueue();
  const cursorRef = useRef<Cursor>(undefined);
  const layoutRef = useRef(new ColumnarLayout());
  const [clips, setClips] = useState<DeepReadonly<Clip>[]>([]);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const refresh = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.dispose();
    }
    cursorRef.current = library.cursor();
    layoutRef.current.clear();
    setClips([]);
    setCanAdvance(true);
    setIsAdvancing(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (cursorRef.current) {
        cursorRef.current.dispose();
      }
    };
  }, []);

  const advance = useCallback(
    async (cursor: Cursor) => {
      if (isAdvancing || !canAdvance) {
        return;
      }
      try {
        setIsAdvancing(true);
        await cursor.advance();
        if (cursorRef.current === cursor) {
          setClips((clips) => [...clips, ...cursor.clips]);
          setCanAdvance(cursor.canAdvance);
          layoutRef.current.add(cursor.clips);
        }
      } finally {
        setIsAdvancing(false);
      }
    },
    [isAdvancing, canAdvance],
  );

  const handleLibraryFilter = useCallback(
    (e: Event["library.filter"]) => {
      // TODO: implement debounce logic (react if filter is unchanged for some time).
      refresh();
    },
    [refresh],
  );

  useEffect(() => {
    eventsQueue.subscribe("library.filter", handleLibraryFilter);
    return () => {
      eventsQueue.unsubscribe("library.filter", handleLibraryFilter);
    };
  }, [handleLibraryFilter, eventsQueue]);

  useEffect(() => {
    if (!cursorRef.current) {
      return;
    }
    advance(cursorRef.current);
  }, [cursorRef.current]);

  const handleFeedScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (!cursorRef.current) {
        return;
      }
      const advanceThreshold = 500;
      if (
        e.currentTarget.scrollTop +
          e.currentTarget.clientHeight +
          advanceThreshold >=
        e.currentTarget.scrollHeight
      ) {
        advance(cursorRef.current);
      }
    },
    [advance],
  );

  return (
    <div className={style.container}>
      <div className={style.feed} onScroll={handleFeedScroll}>
        <div
          style={{
            height: layoutRef.current.height(),
            width: layoutRef.current.width(),
          }}
        >
          {clips.map((clip, index) => (
            <div
              key={index}
              style={{ position: "absolute", ...layoutRef.current.item(index) }}
            >
              <Poster clip={clip} />
            </div>
          ))}
        </div>
        <div className={style.info}>
          {canAdvance ? (
            <Spinner />
          ) : clips.length === 0 ? (
            "No clips were found"
          ) : (
            "No more clips"
          )}
        </div>
      </div>
    </div>
  );
}
