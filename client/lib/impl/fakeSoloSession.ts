import { Clip } from "../models/clip";
import { Page, SoloSession, SoloSessionKeyEventMap } from "../services/soloSession";
import { sleep } from "../util/async";
import Listener from "../util/listener";

export default class FakeSoloSession extends Listener<SoloSessionKeyEventMap> implements SoloSession {
  private _pages: Page[];
  private activePageIndex: number = 0;
  readonly clip: Clip = {
    id: "0",
    author: {
      id: "0",
      name: "Fake user",
    },
    title: "Fake clip",
    segments: {
      "0": {
        id: "0",
        timeBegin: 0,
        timeEnd: 1000,
        line: "Fake line",
        roleID: "0",
      },
      "1": {
        id: "1",
        timeBegin: 0,
        timeEnd: 1000,
        line: "Fake line",
        roleID: "1",
      },
    },
    roles: {
      "0": {
        id: "0",
        name: "Fiona",
        sex: "female",
      },
      "1": {
        id: "1",
        name: "Shrek",
        sex: "female",
      }
    },
    valid: true,
    dateCreated: ""
  };

  constructor(readonly id: string) {
    super();
    const segments = Object.values(this.clip.segments);
    if (segments.length === 0) {
      throw "no segments";
    }
    this._pages = segments.map((segment, index) => ({
      number: index + 1,
      segment,
      hasNext: (index + 1 < segments.length),
      hasPrevious: index > 0,
    }));
  }

  get page(): Readonly<Page> {
    return this._pages[this.activePageIndex];
  }

  get pages(): ReadonlyArray<Readonly<Page>> {
    return this._pages;
  }

  async record(audio: Blob): Promise<void> {
    const page = this._pages[this.activePageIndex];
    page.audio = audio;
    this.notifyListeners("change", { session: this, page });
  }

  next(): Readonly<Page> {
    if (this.activePageIndex === this._pages.length - 1) {
      return this._pages[this.activePageIndex];
    }
    this.activePageIndex++;
    const page = this._pages[this.activePageIndex];
    this.notifyListeners("switch", { session: this, page });
    return page;
  }

  previous(): Readonly<Page> {
    if (this.activePageIndex === 0) {
      return this._pages[this.activePageIndex];
    }
    this.activePageIndex--;
    const page = this._pages[this.activePageIndex];
    this.notifyListeners("switch", { session: this, page });
    return page;
  }

  switch(pageNumber: Page["number"]): Readonly<Page> {
    if (pageNumber > this._pages.length || pageNumber < 1) {
      throw `page number out of bounds: ${pageNumber}`;
    }
    this.activePageIndex = pageNumber - 1;
    const page = this._pages[this.activePageIndex];
    this.notifyListeners("switch", { session: this, page });
    return page;
  }

  async finish(): Promise<void> {
    this.notifyListeners("finish", { session: this });
    await sleep(2500);
    this.notifyListeners("grade", { session: this, grade: 10 });
  }

  dispose(): void {
    this._pages = [];
  }
}