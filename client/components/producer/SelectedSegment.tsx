import { ChangeEvent, useCallback, useEffect, useState } from "react";

import style from "@/components/producer/SelectedSegment.module.scss";
import { Role, Segment } from "@/lib/models/clip";
import { useCommandBus, useEventsQueue } from "./context";
import Event from "@/components/producer/events";
import { DeepReadonly } from "@/lib/util/type";
import TextInput from "@/components/shared/html/TextInput";
import Select from "@/components/shared/html/Select";

export default function SelectedSegment() {
  const events = useEventsQueue();
  const commands = useCommandBus();
  const [segment, setSegment] = useState<DeepReadonly<Segment> | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const handleSegmentSelected = useCallback((e: Event["segment.selected"]) => {
    setSegment(e.segment);
  }, []);

  const handleSegmentChanged = useCallback(
    (e: Event["segment.changed"]) => {
      if (e.segment.id == segment?.id) {
        setSegment(e.segment);
      }
    },
    [segment],
  );

  const handleSegmentDeleted = useCallback(
    (e: Event["segment.deleted"]) => {
      if (e.segment.id == segment?.id) {
        setSegment(null);
      }
    },
    [segment],
  );

  const changeSegmentLine = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!segment) return;
      const change = { ...segment, line: e.currentTarget.value };
      commands.execute("segment.change", { segment: change });
    },
    [segment, commands],
  );

  const changeSegmentRole = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!segment) return;
      const change = { ...segment, roleID: e.currentTarget.value };
      commands.execute("segment.change", { segment: change });
    },
    [segment, commands],
  );

  const handleRoleAdded = useCallback((e: Event["role.added"]) => {
    setRoles((roles) => [...roles, e.role]);
  }, []);

  const handleRoleChanged = useCallback((e: Event["role.changed"]) => {
    setRoles((roles) =>
      roles.map((role) => (role.id == e.role.id ? e.role : role)),
    );
  }, []);

  const handleRoleDeleted = useCallback((e: Event["role.deleted"]) => {
    setRoles((roles) => roles.filter((role) => role.id !== e.role.id));
  }, []);

  useEffect(() => {
    events.subscribe("role.added", handleRoleAdded);
    events.subscribe("role.changed", handleRoleChanged);
    events.subscribe("role.deleted", handleRoleDeleted);
    events.subscribe("segment.selected", handleSegmentSelected);
    return () => {
      events.unsubscribe("role.added", handleRoleAdded);
      events.unsubscribe("role.changed", handleRoleChanged);
      events.unsubscribe("role.deleted", handleRoleDeleted);
      events.unsubscribe("segment.selected", handleSegmentSelected);
    };
  }, [
    events,
    handleRoleAdded,
    handleRoleChanged,
    handleRoleDeleted,
    handleSegmentSelected,
  ]);

  useEffect(() => {
    events.subscribe("segment.changed", handleSegmentChanged);
    events.subscribe("segment.deleted", handleSegmentDeleted);
    return () => {
      events.unsubscribe("segment.changed", handleSegmentChanged);
      events.unsubscribe("segment.deleted", handleSegmentDeleted);
    };
  }, [events, handleSegmentChanged, handleSegmentDeleted]);

  return segment ? (
    <div className={style.segment}>
      <Select onChange={changeSegmentRole} value={segment.roleID}>
        <option value="">Someone</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </Select>
      <span>says</span>
      <TextInput
        value={segment.line}
        placeholder="Line"
        onChange={changeSegmentLine}
        style={{ flex: 1 }}
      />
    </div>
  ) : (
    <div className={style.empty}>Please, select a segment.</div>
  );
}
