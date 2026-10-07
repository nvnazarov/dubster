import { type Clip, type Segment } from "@/lib/models";

/**
 * `Page` contains content specific to a page.
 */
export interface Page {
  number: number;
  segment: Segment;
  audio?: Blob;
  hasNext: boolean;
  hasPrevious: boolean;
};

export interface SoloSession {
  /** `id` is the session id. */
  readonly id: string;

  /** `page` contains current page. */
  get page(): Readonly<Page>;

  /** `pages` lists all pages. */
  get pages(): ReadonlyArray<Readonly<Page>>;

  /** `clip` is the clip assosiated with the session. */
  readonly clip: Readonly<Clip>;

  /**
   * `record` saves the audio recorded by the user for the current segment.
   * @param audio Audio `Blob`.
   */
  record(audio: Blob): Promise<void>;

  /**
   * `next` moves to the next page.
   */
  next(): Readonly<Page>;

  /**
   * `previous` moves to the previous page.
   */
  previous(): Readonly<Page>;

  /**
   * `switch` switches to the given page.
   * @param pageNumber The number of the page.
   */
  switch(pageNumber: Page["number"]): Readonly<Page>;

  /**
   * `finish` signals that the user finished voicing clip's segments.
   * It raises a `"finish"` event.
   */
  finish(): Promise<void>;

  /**
   * `dispose` closes the session and disposes the resources
   * held by this object.
   */
  dispose(): void;
};
