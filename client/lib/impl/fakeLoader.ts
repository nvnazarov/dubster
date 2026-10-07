import { Loader, LoaderKeyEventMap } from "@/lib/services/store";
import { sleep } from "@/lib/util/async";
import Listener from "@/lib/util/listener";

export default class FakeLoader extends Listener<LoaderKeyEventMap<Blob>> implements Loader<Blob> {
  async load() {
    var progress = 0;
    const interval = setInterval(() => {
      this.notifyListeners("progress", progress);
      progress = Math.min(100, progress + 10);
    }, 1000);
    await sleep(10000);
    clearInterval(interval);
    this.notifyListeners("progress", 100);
    const blob = new Blob();
    this.notifyListeners("finish", blob);
    return blob;
  }
};
