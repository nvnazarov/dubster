import { createContext, useContext } from "react";

import Library, { Filter } from "@/lib/services/library";
import { State } from "@/lib/state";

export interface LibraryContext {
  library: Library;
  filter: State<Filter>;
}

const context = createContext<LibraryContext>({} as any);

export function useLibraryContext(): LibraryContext {
  return useContext(context);
}

export default context;
