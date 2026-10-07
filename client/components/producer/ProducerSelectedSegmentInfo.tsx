import { ChangeEvent, useCallback, useEffect, useState } from "react";

import style from "./ProducerSelectedSegmentInfo.module.scss";
import { useEventsQueue, useProducer } from "./ProducerContext";
import { ProducerSegment } from "@/lib/services/producer";
import { Event } from "@/lib/services/eventsQueue";
import { DeepReadonly } from "@/lib/util/type";
import TextInput from "@/components/shared/html/TextInput";
import Select from "@/components/shared/html/Select";
import { Role } from "@/lib/models";

export default function ProducerSelectedSegmentInfo() {
  const eq = useEventsQueue();
  const producer = useProducer();
  const [segment, setSegment] = useState<DeepReadonly<ProducerSegment> | null>(
    null,
  );
  const [roles, setRoles] = useState<Role[]>([]);

  const handleSegmentSelect = useCallback(
    (e: Event["producer.segment.select"]) => {
      setSegment(e.producer.clip.segments[e.segment.id]);
    },
    [],
  );

  const handleSegmentChange = useCallback(
    (e: Event["producer.segment.change"]) => {
      setSegment(e.producer.clip.segments[e.segment.id]);
    },
    [],
  );

  const handleRoleAdd = useCallback((e: Event["producer.role.add"]) => {
    setRoles((roles) => [...roles, e.role]);
  }, []);

  const handleRoleRemove = useCallback((e: Event["producer.role.remove"]) => {
    setRoles((roles) => roles.filter((role) => role.id !== e.role.id));
  }, []);

  const handleRoleChange = useCallback((e: Event["producer.role.change"]) => {
    setRoles((roles) =>
      roles.map((role) => (role.id === e.role.id ? e.role : role)),
    );
  }, []);

  useEffect(() => {
    eq.subscribe("producer.segment.select", handleSegmentSelect);
    eq.subscribe("producer.segment.change", handleSegmentChange);
    eq.subscribe("producer.role.add", handleRoleAdd);
    eq.subscribe("producer.role.remove", handleRoleRemove);
    eq.subscribe("producer.role.change", handleRoleChange);
    return () => {
      eq.unsubscribe("producer.segment.select", handleSegmentSelect);
      eq.unsubscribe("producer.segment.change", handleSegmentChange);
      eq.unsubscribe("producer.role.add", handleRoleAdd);
      eq.unsubscribe("producer.role.remove", handleRoleRemove);
      eq.unsubscribe("producer.role.change", handleRoleChange);
    };
  }, [eq]);

  const handleLineChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (segment) {
        producer.changeSegment({ ...segment, line: e.target.value });
      }
    },
    [segment],
  );

  const handleRoleSelect = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (segment) {
        producer.changeSegment({ ...segment, role: roles[e.target.value] });
      }
    },
    [segment, roles],
  );

  return segment ? (
    <div className={style.container}>
      <TextInput
        value={segment.line}
        placeholder="Line"
        onChange={handleLineChange}
      />
      <Select value={segment.role?.id} onChange={handleRoleSelect}>
        <option value={undefined}>Select a Role</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </Select>
    </div>
  ) : (
    <div className={style.container}>Select a segment</div>
  );
}
