import { CSSProperties } from "react";

import ColorProvider from "@/lib/services/colorProvider";

export default class CyclicalColorProvider implements ColorProvider {
  constructor(private colors: CSSProperties["color"][]) {
    if (colors.length === 0) {
      throw "no colors provided";
    }
  }

  private colorByID = new Map<string, number>();

  color(id: string): CSSProperties["color"] {
    const index = this.colorByID.get(id);
    if (index !== undefined) {
      return this.colors[index];
    }
    const newIndex = this.colorByID.size % this.colors.length;
    this.colorByID.set(id, newIndex);
    return this.colors[newIndex];
  }
}
