import { afterEach, beforeEach, describe, expect, test, mock } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { watchDocsDir } from "./file-watcher";
import type { FileWatcherHandle } from "./file-watcher";

describe("watchDocsDir", () => {
  let testDir: string;
  let handle: FileWatcherHandle | null;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-watcher-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    handle = null;
  });

  afterEach(() => {
    handle?.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  test("throws error when directory does not exist", () => {
    const missingDir = join(testDir, "nonexistent");

    expect(() =>
      watchDocsDir(missingDir, () => {}),
    ).toThrow(/does not exist/);
  });

  test("returns a handle with a close method", () => {
    handle = watchDocsDir(testDir, () => {});

    expect(handle).toBeDefined();
    expect(typeof handle.close).toBe("function");
  });

  test("close can be called multiple times without error", () => {
    handle = watchDocsDir(testDir, () => {});

    handle.close();
    handle.close();
    handle.close();
    // Should not throw
    handle = null; // prevent afterEach from closing again
  });

  // fs.watch({ recursive: true }) is unreliable on Linux — event delivery
  // for both create and modify is inconsistent. These tests only run on
  // macOS/Windows where recursive watching is fully supported.
  const isLinux = process.platform === "linux";
  const fsWatchTest = isLinux ? test.skip : test;

  fsWatchTest("invokes callback when a YAML file is created", async () => {
    const onChange = mock(() => {});

    handle = watchDocsDir(testDir, onChange, { debounceMs: 50 });

    await sleep(200);

    writeFileSync(join(testDir, "main.yaml"), "requirements: []\n", "utf-8");

    for (let i = 0; i < 10; i++) {
      if (onChange.mock.calls.length > 0) break;
      await sleep(200);
    }

    expect(onChange).toHaveBeenCalled();
  });

  fsWatchTest("invokes callback when a YAML file is modified", async () => {
    writeFileSync(join(testDir, "main.yaml"), "requirements: []\n", "utf-8");

    const onChange = mock(() => {});
    handle = watchDocsDir(testDir, onChange, { debounceMs: 50 });

    writeFileSync(
      join(testDir, "main.yaml"),
      "requirements:\n  - id: req-001\n    description: test\n    userValue: v\n    priority: high\n    status: draft\n",
      "utf-8",
    );

    await sleep(200);

    expect(onChange).toHaveBeenCalled();
  });

  fsWatchTest("does not invoke callback for non-YAML files", async () => {
    const onChange = mock(() => {});
    handle = watchDocsDir(testDir, onChange, { debounceMs: 50 });

    writeFileSync(join(testDir, "readme.md"), "# Hello\n", "utf-8");

    await sleep(200);

    expect(onChange).not.toHaveBeenCalled();
  });

  fsWatchTest("invokes callback for .yml extension", async () => {
    const onChange = mock(() => {});
    handle = watchDocsDir(testDir, onChange, { debounceMs: 50 });

    writeFileSync(join(testDir, "extra.yml"), "data: true\n", "utf-8");

    await sleep(200);

    expect(onChange).toHaveBeenCalled();
  });

  fsWatchTest("debounces rapid changes into a single callback", async () => {
    const onChange = mock(() => {});
    handle = watchDocsDir(testDir, onChange, { debounceMs: 100 });

    writeFileSync(join(testDir, "main.yaml"), "requirements: []\n", "utf-8");
    await sleep(10);
    writeFileSync(join(testDir, "main.yaml"), "requirements:\n  - id: r1\n    description: a\n    userValue: b\n    priority: high\n    status: draft\n", "utf-8");
    await sleep(10);
    writeFileSync(join(testDir, "main.yaml"), "requirements:\n  - id: r2\n    description: c\n    userValue: d\n    priority: low\n    status: draft\n", "utf-8");

    await sleep(300);

    expect(onChange.mock.calls.length).toBeLessThanOrEqual(2);
    expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  fsWatchTest("does not invoke callback after close", async () => {
    const onChange = mock(() => {});
    handle = watchDocsDir(testDir, onChange, { debounceMs: 50 });

    handle.close();
    handle = null;

    writeFileSync(join(testDir, "main.yaml"), "requirements: []\n", "utf-8");

    await sleep(200);

    expect(onChange).not.toHaveBeenCalled();
  });

  test("uses default debounce when not specified", () => {
    // Should not throw — just verifying the default works
    handle = watchDocsDir(testDir, () => {});

    expect(handle).toBeDefined();
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
