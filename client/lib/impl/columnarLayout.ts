import { type Clip } from "@/lib/models";
import { type Location, type Layout } from "@/lib/services/layout";
import { type DeepReadonly } from "@/lib/util/type";

export default class ColumnarLayout implements Layout {
  private items: Location[] = [];
  private columns: number[] = [0, 0, 0];

  constructor(
    private gap: number = 10,
    private columnWidth: number = 200,
    private minHeight: number = 200,
    private maxHeight: number = 300,
  ) { }

  private weight(clip: DeepReadonly<Clip>): number {
    return ((clip.rating ?? 0) ** 3) / 125;
  }

  add(clips: DeepReadonly<Clip[]>) {
    for (const clip of clips) {
      const weight = this.weight(clip);
      const shake = Math.floor(Math.random() * 20);
      const height = this.minHeight + weight * (this.maxHeight - this.minHeight) + shake;
      const column = this.columns.indexOf(Math.min(...this.columns));
      this.items.push({
        top: this.columns[column],
        left: (this.columnWidth + this.gap) * column,
        width: this.columnWidth,
        height,
      });
      this.columns[column] += height + this.gap;
    }
  }

  clear() {
    this.items = [];
    this.columns = [0, 0, 0];
  }

  item(index: number): Location {
    return this.items[index];
  }

  height(): number {
    return Math.max(...this.columns);
  }

  width(): number {
    return this.columns.length * (this.columnWidth + this.gap) - this.gap;
  }
};