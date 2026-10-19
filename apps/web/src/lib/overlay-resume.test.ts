import { afterEach, describe, expect, it } from "vitest";
import { armOverlayResume, noteOpenOverlay, takeOverlayResume } from "./overlay-resume";

function memoryStorage(store = new Map<string, string>()) {
  return {
    store,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe("overlay resume", () => {
  afterEach(() => noteOpenOverlay(null));

  it("reopens the overlay that was open when recovery armed it, once", () => {
    const storage = memoryStorage();
    noteOpenOverlay({ overlay: "settings", section: "models" });

    armOverlayResume(storage);

    expect(takeOverlayResume(storage)).toEqual({ overlay: "settings", section: "models" });
    expect(takeOverlayResume(storage)).toBeNull();
  });

  it("arms nothing when no overlay is open", () => {
    const storage = memoryStorage();
    noteOpenOverlay({ overlay: "plugins" });
    noteOpenOverlay(null);

    armOverlayResume(storage);

    expect(storage.store.size).toBe(0);
    expect(takeOverlayResume(storage)).toBeNull();
  });

  it("ignores a stored value that is not a resumable overlay", () => {
    const storage = memoryStorage(new Map([["rk:overlay-resume", '{"overlay":"create"}']]));
    expect(takeOverlayResume(storage)).toBeNull();
    expect(storage.store.size).toBe(0);

    storage.store.set("rk:overlay-resume", "not json");
    expect(takeOverlayResume(storage)).toBeNull();
  });

  it("falls back to the general section when the stored section is missing", () => {
    const storage = memoryStorage(new Map([["rk:overlay-resume", '{"overlay":"settings"}']]));
    expect(takeOverlayResume(storage)).toEqual({ overlay: "settings", section: "general" });
  });

  it("does not block the reload when storage throws", () => {
    noteOpenOverlay({ overlay: "mcp" });
    expect(() =>
      armOverlayResume({
        setItem: () => {
          throw new Error("quota");
        },
      }),
    ).not.toThrow();
  });
});
