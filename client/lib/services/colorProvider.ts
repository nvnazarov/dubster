import { CSSProperties } from "react";

/**
 * `ColorProvider` abstracts a system that provides
 * colors for use inside components. This is useful
 * when a component needs to color itself according
 * to the value of some property. For example, a 
 * segment can color itself based on the role that
 * is assigned to it.
 */
export default interface ColorProvider {
  /**
   * `color` returns the color that corresponds to
   * the provided identificator.
   * @param id The identificatior. 
   */
  color(id: string): CSSProperties["color"];
};
