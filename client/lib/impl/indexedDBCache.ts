import Cache from "@/lib/services/cache";

export default class IndexedDBCache<T> implements Cache<T> {
  constructor(private db: string, private store: string) { }

  async find(id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.open().then((db) => {
        const request = db.transaction([this.store], "readonly")
          .objectStore(this.store)
          .get(id);
        request.onsuccess = function () {
          if (this.result === undefined) {
            resolve(null)
          } else {
            resolve(this.result);
          }
        }
        request.onerror = reject;
      }).catch(reject);
    });
  }

  async save(id: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      this.open().then((db) => {
        const request = db.transaction([this.store], "readwrite")
          .objectStore(this.store)
          .put(value, id);
        request.onsuccess = () => resolve();
        request.onerror = reject;
      }).catch(reject);
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.open().then((db) => {
        const request = db.transaction([this.store], "readwrite")
          .objectStore(this.store)
          .delete(id);
        request.onsuccess = () => resolve();
        request.onerror = reject;
      }).catch(reject);
    });
  }

  private async open(): Promise<IDBDatabase> {
    const store = this.store;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.db);
      request.onsuccess = function (e) {
        resolve(this.result);
      };
      request.onerror = (e) => {
        reject(e);
      };
      request.onupgradeneeded = function () {
        this.result.createObjectStore(store, { autoIncrement: true });
      };
    });
  }
};
