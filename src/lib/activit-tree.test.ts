import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ActivityTree,
  loadActivityTree,
  saveActivityTree,
} from "@/lib/activit-tree";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("ActivityTree", () => {
  it("increments a single day", () => {
    const tree = new ActivityTree();
    tree.increment(new Date(2026, 7, 16));
    const heatMap = tree.toHeatMap();
    expect(heatMap).toHaveLength(1);
    expect(heatMap[0]).toEqual({ date: "2026/8/16", count: 1 });
  });

  it("increments the same day multiple times", () => {
    const tree = new ActivityTree();
    const date = new Date(2026, 7, 16);
    tree.increment(date);
    tree.increment(date);
    tree.increment(date);
    expect(tree.toHeatMap()[0].count).toBe(3);
  });

  it("tracks multiple days across months and years", () => {
    const tree = new ActivityTree();
    tree.increment(new Date(2026, 7, 16));
    tree.increment(new Date(2026, 7, 17));
    tree.increment(new Date(2026, 0, 1));
    tree.increment(new Date(2025, 11, 31));
    expect(tree.toHeatMap()).toHaveLength(4);
  });

  it("uses today's date when none is passed", () => {
    const tree = new ActivityTree();
    tree.increment();
    const [entry] = tree.toHeatMap();
    const now = new Date();
    expect(entry.date).toBe(`${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`);
  });

  it("constructs from existing data", () => {
    const initial = {
      2026: {
        year: 2026,
        months: {
          8: { month: 8, days: { 16: { day: 16, count: 5 } } },
        },
      },
    };
    const tree = new ActivityTree(initial);
    expect(tree.toHeatMap()).toEqual([{ date: "2026/8/16", count: 5 }]);
  });
});

describe("ActivityTree persistence", () => {
  it("saves and reloads the tree", () => {
    const tree = new ActivityTree();
    tree.increment(new Date(2026, 7, 16));
    saveActivityTree(tree);

    const loaded = loadActivityTree();
    expect(loaded.toHeatMap()).toEqual([{ date: "2026/8/16", count: 1 }]);
  });

  it("returns an empty tree when nothing is stored", () => {
    const loaded = loadActivityTree();
    expect(loaded.toHeatMap()).toEqual([]);
  });
});