import { createContext, useContext } from "react";

import Library, { Filter } from "@/lib/services/library";
import { StateObject } from "@/lib/state";

export interface LibraryContext {
  library: Library;
  filter: StateObject<Filter>;
}

const context = createContext<LibraryContext>({} as any);

export function useLibraryContext(): LibraryContext {
  return useContext(context);
}

export default context;
