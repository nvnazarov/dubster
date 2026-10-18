import { ChangeEvent, useCallback } from "react";

import style from "@/components/producer/SelectedSegment.module.scss";
import { useProducerContext } from "@/components/producer/context";
import { useObjectProperty, useSnapshot } from "@/lib/state";

export default function SelectedSegment() {
  const { producer } = useProducerContext();
  const selectedSegmentID = useObjectProperty(producer, "selectedSegmentID");

  return selectedSegmentID ? (
    <Form segmentID={selectedSegmentID} />
  ) : (
    <div className={style.empty}>Please, select a segment.</div>
  );
}

function Form({ segmentID }: { segmentID: string }) {
  const { clip, colorProvider } = useProducerContext();
  const roles = useSnapshot(clip.roles);
  const segmentState = clip.segments.get(segmentID);
  const segment = useSnapshot(segmentState);

  const changeLine = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!segment) return;
      segmentState.line = e.currentTarget.value;
    },
    [segment],
  );

  const changeRole = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!segment) return;
      segmentState.roleID = e.currentTarget.value;
    },
    [segment],
  );

  const color = segment.roleID ? colorProvider.color(segment.roleID) : "grey";
  return (
    <div className={style.container}>
      <select
        className={style.role}
        onChange={changeRole}
        value={segment.roleID}
        style={{ color }}
      >
        <option value="">Role</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      <span className={style.says}>:</span>
      <input
        value={segment.line}
        placeholder="Line"
        onChange={changeLine}
        className={style.line}
        style={{ flex: 1 }}
      />
    </div>
  );
}
