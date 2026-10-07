export interface Location {
  left: number;
  top: number;
  width: number;
  height: number;
};

export interface Layout {
  item(index: number): Location;
  height(): number;
  width(): number;
};
