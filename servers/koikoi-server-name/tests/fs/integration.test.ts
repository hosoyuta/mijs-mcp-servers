import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";
import { PathResolver } from "../../src/fs/PathResolver";
import { WorkspaceValidator } from "../../src/fs/WorkspaceValidator";
import { resolve } from "path";

describe("File System統合テスト", () => {
  const workspace = resolve(process.cwd(), "tests/fixtures/workspace");

  test("FileReader + PathResolver統合", async () => {
    // 1. PathResolverでパス解決
    const resolver = new PathResolver(workspace);
    const resolved = resolver.resolve("./src/index.ts");

    // 2. FileReaderでファイル読み込み
    const reader = new FileReader();
    const result = await reader.readFile(resolved.absolutePath);

    expect(result.content).toBeDefined();
    expect(result.metadata.lines).toBeGreaterThan(0);
  });

  test("ワークスペース外ファイルの拒否", async () => {
    const resolver = new PathResolver(workspace);

    expect(() => {
      resolver.resolve("../../../etc/passwd");
    }).toThrow("outside workspace");
  });

  test("大きなファイルの処理", async () => {
    const reader = new FileReader();
    const largePath = resolve(process.cwd(), "tests/fixtures/sample-large.ts");
    const result = await reader.readFile(largePath);

    expect(result.metadata.lines).toBeGreaterThan(1000);
    expect(result.content.length).toBeGreaterThan(10000);
  });

  test("WorkspaceValidator + PathResolver統合", async () => {
    const validator = new WorkspaceValidator();
    const resolver = new PathResolver(workspace);

    // ワークスペースの検証
    const isValid = await validator.validateWorkspace(workspace);
    expect(isValid).toBe(true);

    // ワークスペース内ファイルの存在確認
    const resolved = resolver.resolve("./src/index.ts");
    const exists = await validator.fileExists(resolved.absolutePath);
    expect(exists).toBe(true);
  });

  test("3コンポーネント完全統合", async () => {
    const validator = new WorkspaceValidator();
    const resolver = new PathResolver(workspace);
    const reader = new FileReader();

    // 1. ワークスペース検証
    const isValidWorkspace = await validator.validateWorkspace(workspace);
    expect(isValidWorkspace).toBe(true);

    // 2. パス解決
    const resolved = resolver.resolve("./src/index.ts");
    expect(resolved.isWithinWorkspace).toBe(true);

    // 3. ファイル存在確認
    const exists = await validator.fileExists(resolved.absolutePath);
    expect(exists).toBe(true);

    // 4. ファイル読み込み
    const result = await reader.readFile(resolved.absolutePath);
    expect(result.content).toBeDefined();
    expect(result.metadata.path).toContain("index.ts");
  });

  test("存在しないファイルのエラーハンドリング", async () => {
    const resolver = new PathResolver(workspace);
    const reader = new FileReader();
    const validator = new WorkspaceValidator();

    const resolved = resolver.resolve("./nonexistent.ts");

    // ファイルが存在しないことを確認
    const exists = await validator.fileExists(resolved.absolutePath);
    expect(exists).toBe(false);

    // FileReaderがエラーをスローすることを確認
    await expect(reader.readFile(resolved.absolutePath)).rejects.toThrow();
  });

  test("Globパターンマッチング統合", async () => {
    const resolver = new PathResolver(workspace);
    const validator = new WorkspaceValidator();

    // パターンマッチング
    const files = await resolver.matchFiles(["src/**/*.ts"]);
    expect(files.length).toBeGreaterThan(0);

    // マッチしたファイルがすべて存在することを確認
    for (const file of files.slice(0, 3)) { // 最初の3ファイルのみチェック
      const absolutePath = resolver.resolve(file).absolutePath;
      const exists = await validator.fileExists(absolutePath);
      expect(exists).toBe(true);
    }
  });
});
