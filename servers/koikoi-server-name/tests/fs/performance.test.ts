import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";
import { PathResolver } from "../../src/fs/PathResolver";
import { WorkspaceValidator } from "../../src/fs/WorkspaceValidator";

describe("パフォーマンステスト", () => {
  describe("FileReader Performance", () => {
    test("小規模ファイル読み込みが50ms以内", async () => {
      const reader = new FileReader();
      const start = performance.now();

      await reader.readFile("./tests/fixtures/sample-simple.ts");

      const elapsed = performance.now() - start;
      console.log(`Small file read time: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(50);
    });

    test("中規模ファイル読み込みが200ms以内", async () => {
      const reader = new FileReader();
      const start = performance.now();

      await reader.readFile("./tests/fixtures/sample-large.ts");

      const elapsed = performance.now() - start;
      console.log(`Large file read time: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(200);
    });

    test("10ファイル並行読み込みが500ms以内", async () => {
      const reader = new FileReader();
      const files = Array(10).fill("./tests/fixtures/sample-simple.ts");

      const start = performance.now();
      await Promise.all(files.map(f => reader.readFile(f)));
      const elapsed = performance.now() - start;

      console.log(`10 parallel reads: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(500); // 10ファイルなので緩和
    });

    test("連続読み込みのオーバーヘッド確認", async () => {
      const reader = new FileReader();
      const iterations = 100;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await reader.readFile("./tests/fixtures/sample-simple.ts");
      }
      const elapsed = performance.now() - start;
      const avgTime = elapsed / iterations;

      console.log(`Average read time (${iterations} iterations): ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(10); // 平均10ms以内
    });
  });

  describe("PathResolver Performance", () => {
    const workspacePath = process.cwd() + "/tests/fixtures/workspace";

    test("パス解決が5ms以内", () => {
      const resolver = new PathResolver(workspacePath);

      const start = performance.now();
      resolver.resolve("./src/index.ts");
      const elapsed = performance.now() - start;

      console.log(`Path resolution time: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(5);
    });

    test("1000回のパス解決が100ms以内", () => {
      const resolver = new PathResolver(workspacePath);
      const iterations = 1000;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        resolver.resolve("./src/index.ts");
      }
      const elapsed = performance.now() - start;

      console.log(`1000 path resolutions: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(100);
    });

    test("Glob パターンマッチングが1秒以内", async () => {
      const resolver = new PathResolver(workspacePath);

      const start = performance.now();
      await resolver.matchFiles(["**/*.ts"]);
      const elapsed = performance.now() - start;

      console.log(`Glob pattern matching: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(1000);
    });
  });

  describe("WorkspaceValidator Performance", () => {
    test("ファイル存在確認が5ms以内", async () => {
      const validator = new WorkspaceValidator();

      const start = performance.now();
      await validator.fileExists("./tests/fixtures/sample-simple.ts");
      const elapsed = performance.now() - start;

      console.log(`File existence check: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(5);
    });

    test("100回の存在確認が50ms以内", async () => {
      const validator = new WorkspaceValidator();
      const iterations = 100;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await validator.fileExists("./tests/fixtures/sample-simple.ts");
      }
      const elapsed = performance.now() - start;

      console.log(`100 existence checks: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("Integration Performance", () => {
    const workspacePath = process.cwd() + "/tests/fixtures/workspace";

    test("完全統合フロー（Validator→Resolver→Reader）が100ms以内", async () => {
      const validator = new WorkspaceValidator();
      const resolver = new PathResolver(workspacePath);
      const reader = new FileReader();

      const start = performance.now();

      // 1. Workspace validation
      await validator.validateWorkspace(workspacePath);

      // 2. Path resolution
      const resolved = resolver.resolve("./src/index.ts");

      // 3. File existence check
      await validator.fileExists(resolved.absolutePath);

      // 4. File reading
      await reader.readFile(resolved.absolutePath);

      const elapsed = performance.now() - start;

      console.log(`Full integration flow: ${elapsed.toFixed(2)}ms`);
      expect(elapsed).toBeLessThan(100);
    });

    test("メモリ使用量が適切（大きなファイル）", async () => {
      const reader = new FileReader();

      // メモリ使用量の基準値を取得
      const memBefore = process.memoryUsage().heapUsed;

      // 大きなファイルを読み込み
      await reader.readFile("./tests/fixtures/sample-large.ts");

      const memAfter = process.memoryUsage().heapUsed;
      const memDiff = (memAfter - memBefore) / 1024 / 1024; // MB

      console.log(`Memory increase: ${memDiff.toFixed(2)}MB`);
      expect(memDiff).toBeLessThan(10); // 10MB以内
    });
  });
});
