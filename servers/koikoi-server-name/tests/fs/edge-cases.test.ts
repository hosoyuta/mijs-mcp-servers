import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";
import { PathResolver } from "../../src/fs/PathResolver";
import { WorkspaceValidator } from "../../src/fs/WorkspaceValidator";

describe("エッジケーステスト", () => {
  describe("FileReader Edge Cases", () => {
    test("空のファイル (0バイト)", async () => {
      const reader = new FileReader();
      const result = await reader.readFile("./tests/fixtures/empty.ts");

      expect(result.content).toBe("");
      expect(result.metadata.size).toBe(0);
      expect(result.metadata.lines).toBe(0);
    });

    test("非常に大きなファイル (10,000行以上)", async () => {
      const reader = new FileReader();
      const result = await reader.readFile("./tests/fixtures/sample-large.ts");

      expect(result.metadata.lines).toBeGreaterThan(1000);
      // メモリエラーが発生しないことを確認
      expect(result.content).toBeDefined();
    });

    test("特殊文字を含むファイルパス", async () => {
      const reader = new FileReader();
      const result = await reader.readFile("./tests/fixtures/special-char (1).ts");

      expect(result.content).toBeDefined();
      expect(result.metadata.path).toContain("special-char (1).ts");
    });

    test("空文字列パスはエラー", async () => {
      const reader = new FileReader();
      await expect(reader.readFile("")).rejects.toThrow();
    });

    test("nullish値パスはエラー", async () => {
      const reader = new FileReader();
      // @ts-expect-error - Testing runtime error handling
      await expect(reader.readFile(null)).rejects.toThrow();
    });

    test("スペースのみのパスはエラー", async () => {
      const reader = new FileReader();
      await expect(reader.readFile("   ")).rejects.toThrow();
    });

    test("undefinedパスはエラー", async () => {
      const reader = new FileReader();
      // @ts-expect-error - Testing runtime error handling
      await expect(reader.readFile(undefined)).rejects.toThrow();
    });

    test("数値パスはエラー", async () => {
      const reader = new FileReader();
      // @ts-expect-error - Testing runtime error handling
      await expect(reader.readFile(123)).rejects.toThrow();
    });
  });

  describe("PathResolver Edge Cases", () => {
    const workspacePath = process.cwd() + "/tests/fixtures/workspace";

    test("空文字列パスの処理", () => {
      const resolver = new PathResolver(workspacePath);
      const resolved = resolver.resolve("");

      // 空文字列はワークスペースルートとして解決される
      expect(resolved.isWithinWorkspace).toBe(true);
      expect(resolved.relativePath).toBe("");
      expect(resolved.absolutePath).toContain("workspace");
    });

    test("ドットのみのパス", () => {
      const resolver = new PathResolver(workspacePath);
      const resolved = resolver.resolve(".");

      expect(resolved.isWithinWorkspace).toBe(true);
      expect(resolved.absolutePath).toContain("workspace");
    });

    test("ダブルドットのパス", () => {
      const resolver = new PathResolver(workspacePath);

      expect(() => {
        resolver.resolve("..");
      }).toThrow("outside workspace");
    });

    test("絶対パスの境界チェック", () => {
      const resolver = new PathResolver(workspacePath);
      const outsidePath = "C:\\Windows\\System32\\config";

      expect(() => {
        resolver.resolve(outsidePath);
      }).toThrow();
    });

    test("Windowsスタイルパス区切り文字", () => {
      const resolver = new PathResolver(workspacePath);
      const resolved = resolver.resolve("src\\index.ts");

      expect(resolved.absolutePath).toBeDefined();
      expect(resolved.isWithinWorkspace).toBe(true);
    });

    test("末尾スラッシュのあるパス", () => {
      const resolver = new PathResolver(workspacePath);
      const resolved = resolver.resolve("./src/");

      expect(resolved.absolutePath).toBeDefined();
      expect(resolved.isWithinWorkspace).toBe(true);
    });

    test("複数の連続スラッシュ", () => {
      const resolver = new PathResolver(workspacePath);
      const resolved = resolver.resolve("./src///index.ts");

      expect(resolved.absolutePath).toContain("index.ts");
      expect(resolved.isWithinWorkspace).toBe(true);
    });

    test("相対パス (./) の解決", () => {
      const resolver = new PathResolver(workspacePath);
      const resolved = resolver.resolve("./src/index.ts");

      expect(resolved.relativePath).toBe("src/index.ts");
      expect(resolved.isWithinWorkspace).toBe(true);
    });

    test("親ディレクトリを含むパスのセキュリティ", () => {
      const resolver = new PathResolver(workspacePath);

      // ワークスペース外に出ようとする試み
      expect(() => {
        resolver.resolve("../../../../../../etc/passwd");
      }).toThrow();
    });

    test("ワークスペースルートパスの取得", () => {
      const resolver = new PathResolver(workspacePath);
      const root = resolver.getWorkspaceRoot();

      expect(root).toBeDefined();
      expect(root).toContain("workspace");
    });
  });

  describe("WorkspaceValidator Edge Cases", () => {
    test("空文字列パスはfalse", async () => {
      const validator = new WorkspaceValidator();
      const result = await validator.validateWorkspace("");

      expect(result).toBe(false);
    });

    test("ファイルをワークスペースとして検証", async () => {
      const validator = new WorkspaceValidator();
      const result = await validator.validateWorkspace("./tests/fixtures/sample-simple.ts");

      // ファイルはディレクトリではないのでfalse
      expect(result).toBe(false);
    });

    test("存在しないパスはfalse", async () => {
      const validator = new WorkspaceValidator();
      const result = await validator.validateWorkspace("./nonexistent-directory");

      expect(result).toBe(false);
    });

    test("有効なディレクトリはtrue", async () => {
      const validator = new WorkspaceValidator();
      const result = await validator.validateWorkspace("./tests/fixtures");

      expect(result).toBe(true);
    });

    test("ファイル存在確認 - 存在するファイル", async () => {
      const validator = new WorkspaceValidator();
      const result = await validator.fileExists("./tests/fixtures/sample-simple.ts");

      expect(result).toBe(true);
    });

    test("ファイル存在確認 - 存在しないファイル", async () => {
      const validator = new WorkspaceValidator();
      const result = await validator.fileExists("./nonexistent.ts");

      expect(result).toBe(false);
    });

    test("ディレクトリ存在確認 - 存在するディレクトリ", async () => {
      const validator = new WorkspaceValidator();
      const result = await validator.directoryExists("./tests/fixtures");

      expect(result).toBe(true);
    });

    test("ディレクトリ存在確認 - 存在しないディレクトリ", async () => {
      const validator = new WorkspaceValidator();
      const result = await validator.directoryExists("./nonexistent-dir");

      expect(result).toBe(false);
    });
  });

  describe("Glob Pattern Edge Cases", () => {
    const workspacePath = process.cwd() + "/tests/fixtures/workspace";

    test("空のパターン配列", async () => {
      const resolver = new PathResolver(workspacePath);
      const files = await resolver.matchFiles([]);

      expect(files).toEqual([]);
    });

    test("マッチしないパターン", async () => {
      const resolver = new PathResolver(workspacePath);
      const files = await resolver.matchFiles(["**/*.nonexistent"]);

      expect(files).toEqual([]);
    });

    test("重複するパターン", async () => {
      const resolver = new PathResolver(workspacePath);
      const files = await resolver.matchFiles(["src/**/*.ts", "src/**/*.ts"]);

      // 重複が排除されていることを確認
      const uniqueFiles = new Set(files);
      expect(files.length).toBe(uniqueFiles.size);
    });

    test("複数パターンのマッチ", async () => {
      const resolver = new PathResolver(workspacePath);
      const files = await resolver.matchFiles(["src/**/*.ts", "tests/**/*.ts"]);

      expect(files.length).toBeGreaterThan(0);
      expect(files.every(f => f.endsWith(".ts"))).toBe(true);
    });

    test("ネストされたディレクトリのパターン", async () => {
      const resolver = new PathResolver(workspacePath);
      const files = await resolver.matchFiles(["**/*.ts"]);

      expect(files.length).toBeGreaterThan(0);
      expect(files.some(f => f.includes("/"))).toBe(true);
    });

    test("除外パターンの動作確認", async () => {
      const resolver = new PathResolver(workspacePath);
      const files = await resolver.matchFiles(
        ["**/*.ts"],
        ["tests/**"]
      );

      // testsディレクトリが除外されていることを確認
      expect(files.every(f => !f.includes("tests/"))).toBe(true);
    });
  });

  describe("境界値とパフォーマンステスト", () => {
    test("ファイルメタデータの正確性", async () => {
      const reader = new FileReader();
      const result = await reader.readFile("./tests/fixtures/sample-simple.ts");

      // メタデータの各フィールドが適切に設定されている
      expect(result.metadata.path).toBeDefined();
      expect(result.metadata.size).toBeGreaterThan(0);
      expect(result.metadata.mtime).toBeInstanceOf(Date);
      expect(result.metadata.lines).toBeGreaterThan(0);
      expect(result.metadata.encoding).toBe("utf-8");
    });

    test("連続した読み込み操作", async () => {
      const reader = new FileReader();

      // 同じファイルを複数回読み込む
      const result1 = await reader.readFile("./tests/fixtures/sample-simple.ts");
      const result2 = await reader.readFile("./tests/fixtures/sample-simple.ts");

      expect(result1.content).toBe(result2.content);
      expect(result1.metadata.size).toBe(result2.metadata.size);
    });

    test("複数のファイルを並行読み込み", async () => {
      const reader = new FileReader();

      const promises = [
        reader.readFile("./tests/fixtures/sample-simple.ts"),
        reader.readFile("./tests/fixtures/sample-class.ts"),
        reader.readFile("./tests/fixtures/sample-types.ts"),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.content.length > 0)).toBe(true);
    });

    test("パス正規化の一貫性", () => {
      const workspacePath = process.cwd() + "/tests/fixtures/workspace";
      const resolver = new PathResolver(workspacePath);

      const resolved1 = resolver.resolve("./src/index.ts");
      const resolved2 = resolver.resolve("src/index.ts");
      const resolved3 = resolver.resolve("./src//index.ts");

      // すべて同じファイルを指している
      expect(resolved1.absolutePath).toBe(resolved2.absolutePath);
      expect(resolved2.absolutePath).toBe(resolved3.absolutePath);
    });
  });
});
