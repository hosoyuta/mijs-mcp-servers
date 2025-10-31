import { describe, test, expect } from "bun:test";
import { PathResolver } from "../../src/fs/PathResolver";

describe("PathResolver", () => {
  const workspacePath = process.cwd() + "/tests/fixtures/workspace";

  test("相対パスを絶対パスに解決", () => {
    const resolver = new PathResolver(workspacePath);
    const resolved = resolver.resolve("./src/index.ts");

    expect(resolved.absolutePath).toContain("index.ts");
    expect(resolved.relativePath).toBe("src/index.ts");
  });

  test("ワークスペース内のパスを許可", () => {
    const resolver = new PathResolver(workspacePath);
    const resolved = resolver.resolve("./src/index.ts");

    expect(resolved.isWithinWorkspace).toBe(true);
  });

  test("ワークスペース外のパスを拒否", () => {
    const resolver = new PathResolver(workspacePath);

    expect(() => {
      resolver.resolve("../../outside.ts");
    }).toThrow("outside workspace");
  });

  test("絶対パスも正しく処理", () => {
    const resolver = new PathResolver(workspacePath);
    const absolutePath = workspacePath + "/src/index.ts";
    const resolved = resolver.resolve(absolutePath);

    expect(resolved.isWithinWorkspace).toBe(true);
  });
});

describe("PathResolver - Glob Pattern Matching", () => {
  const workspacePath = process.cwd() + "/tests/fixtures/workspace";

  test("パターンマッチング: *.ts", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles(["src/**/*.ts"]);

    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".ts"))).toBe(true);
    expect(files.every((f) => f.startsWith("src/"))).toBe(true);
  });

  test("複数パターンのマッチング", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles(["src/**/*.ts", "lib/**/*.ts"]);

    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".ts"))).toBe(true);
    // src/ または lib/ で始まるファイル
    expect(
      files.every((f) => f.startsWith("src/") || f.startsWith("lib/"))
    ).toBe(true);
  });

  test("除外パターンが機能する", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles(["**/*.ts"], ["tests/**"]);

    // tests配下のファイルが除外されていることを確認
    expect(files.every((f) => !f.startsWith("tests/"))).toBe(true);
  });

  test("デフォルト除外パターンが適用される", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles(["**/*.ts"]);

    // node_modules, dist, .git が除外されていることを確認
    expect(files.every((f) => !f.includes("node_modules"))).toBe(true);
    expect(files.every((f) => !f.includes("dist"))).toBe(true);
    expect(files.every((f) => !f.includes(".git"))).toBe(true);
  });

  test("空のパターン配列は空配列を返す", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles([]);

    expect(files).toEqual([]);
  });

  test("マッチするファイルがない場合は空配列を返す", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles(["**/*.nonexistent"]);

    expect(files).toEqual([]);
  });

  test("結果がソートされている", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles(["**/*.ts"]);

    // 配列がソートされていることを確認
    const sorted = [...files].sort();
    expect(files).toEqual(sorted);
  });

  test("重複ファイルが除外される", async () => {
    const resolver = new PathResolver(workspacePath);
    // 同じファイルにマッチする複数のパターン
    const files = await resolver.matchFiles(["src/index.ts", "src/**/*.ts"]);

    // Set を使って重複チェック
    const uniqueFiles = new Set(files);
    expect(files.length).toBe(uniqueFiles.size);
  });

  test("特定のファイルパターンのマッチング", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles(["**/*.test.ts"]);

    expect(files.every((f) => f.includes(".test.ts"))).toBe(true);
  });

  test("カスタム除外パターンの動作", async () => {
    const resolver = new PathResolver(workspacePath);
    // src配下を除外
    const files = await resolver.matchFiles(["**/*.ts"], ["src/**"]);

    expect(files.every((f) => !f.startsWith("src/"))).toBe(true);
  });

  test("パスの正規化（フォワードスラッシュ使用）", async () => {
    const resolver = new PathResolver(workspacePath);
    const files = await resolver.matchFiles(["**/*.ts"]);

    // すべてのパスがフォワードスラッシュを使用していることを確認
    expect(files.every((f) => !f.includes("\\"))).toBe(true);
  });
});
