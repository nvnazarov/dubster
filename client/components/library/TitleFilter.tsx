import { type ChangeEvent, useCallback, useState } from "react";
import TextInput from "../shared/html/TextInput";
import { useLibrary } from "./LibraryContext";

export default function TitleFilter() {
  const library = useLibrary();
  const [query, setQuery] = useState("");

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    library.filter = { ...library.filter, title: newQuery };
    setQuery(newQuery);
  }, []);

  return (
    <TextInput
      value={query}
      onChange={handleInputChange}
      placeholder="Search"
    />
  );
}
