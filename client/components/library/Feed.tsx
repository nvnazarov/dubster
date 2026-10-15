import { UIEvent, useCallback, useEffect, useRef, useState } from "react";

import style from "./Feed.module.scss";
import {
  useEventsQueue,
  useLibrary,
} from "@/components/library/LibraryContext";
import Poster from "@/components/library/Poster";
import Spinner from "@/components/shared/misc/Spinner";
import { type LibraryEvent } from "@/lib/services/library";
import { type Cursor } from "@/lib/services/library";
import { type Clip } from "@/lib/models/clip";
import { DeepReadonly } from "@/lib/util/type";
import ColumnarLayout from "@/lib/impl/columnarLayout";
import { debounce } from "@/lib/services/debounce";
import { Duration } from "@/lib/util/time";

export default function Feed() {
  const library = useLibrary();
  const eventsQueue = useEventsQueue();
  const cursorRef = useRef<Cursor>(undefined);
  const layoutRef = useRef(new ColumnarLayout());
  const [clips, setClips] = useState<DeepReadonly<Clip>[]>([]);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const refresh = useCallback(
    debounce(
      async () => {
        if (cursorRef.current) {
          cursorRef.current.dispose();
        }
        cursorRef.current = await library.cursor();
        layoutRef.current.clear();
        setClips([]);
        setCanAdvance(true);
        setIsAdvancing(false);
      },
      { delay: new Duration(1500), skipFirst: true },
    ),
    [],
  );

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

  useEffect(() => {
    eventsQueue.subscribe("filtered", refresh);
    return () => {
      eventsQueue.unsubscribe("filtered", refresh);
    };
  }, [refresh, eventsQueue]);

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
