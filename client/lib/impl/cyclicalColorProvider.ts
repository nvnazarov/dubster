import { CSSProperties } from "react";
import ColorProvider from "@/lib/services/colorProvider";

export default class CyclicalColorProvider implements ColorProvider {
  constructor(private _colors: CSSProperties["color"][]) {
    if (_colors.length === 0) {
      throw "no colors provided";
    }
  }

  private _colorByID = new Map<string, number>();

  color(id: string): CSSProperties["color"] {
    const index = this._colorByID.get(id);
    if (index !== undefined) {
      return this._colors[index];
    }
    const newIndex = this._colorByID.size % this._colors.length;
    this._colorByID.set(id, newIndex);
    return this._colors[newIndex];
  }
}