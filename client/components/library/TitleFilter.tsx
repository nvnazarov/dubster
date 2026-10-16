import { type ChangeEvent, useCallback, useState } from "react";

import TextInput from "@/components/shared/html/TextInput";
import { useLibraryContext } from "@/components/library/context";
import { useField } from "@/lib/state";

export default function TitleFilter() {
  const { filter } = useLibraryContext();
  const title = useField(filter, "title") || "";

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const changedTitle = e.target.value;
    filter.title = changedTitle;
  }, []);

  return (
    <TextInput
      value={title}
      onChange={handleInputChange}
      placeholder="Search by title"
    />
  );
}
