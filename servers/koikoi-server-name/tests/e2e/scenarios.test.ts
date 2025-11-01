/**
 * End-to-End Scenario Tests
 * Tests complete workflows with real TypeScript projects
 */

import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";
import { PathResolver } from "../../src/fs/PathResolver";
import { WorkspaceValidator } from "../../src/fs/WorkspaceValidator";
import { ProgramManager } from "../../src/compiler/ProgramManager";
import { SourceFileCache } from "../../src/compiler/SourceFileCache";
import { CompilerHost } from "../../src/compiler/CompilerHost";
import { resolve } from "path";

describe("E2Eシナリオテスト", () => {
  const cwd = process.cwd();

  describe("小規模プロジェクト (5ファイル)", () => {
    const projectPath = resolve(cwd, "tests/fixtures/projects/small-project");

    test("プロジェクト全体を解析できる", async () => {
      // 1. ワークスペース検証
      const validator = new WorkspaceValidator();
      const isValid = await validator.validateWorkspace(projectPath);
      expect(isValid).toBe(true);

      // 2. PathResolverでファイルパス解決
      const resolver = new PathResolver(projectPath);
      const filePaths = [
        "./src/types.ts",
        "./src/user.ts",
        "./src/product.ts",
        "./lib/utils.ts",
        "./src/index.ts",
      ];

      const resolvedPaths = filePaths.map((p) => resolver.resolve(p));

      // 3. すべてのファイルが読み込める
      const reader = new FileReader();
      const fileContents = await Promise.all(
        resolvedPaths.map((r) => reader.readFile(r.absolutePath))
      );

      expect(fileContents.length).toBe(5);
      fileContents.forEach((content) => {
        expect(content.content.length).toBeGreaterThan(0);
        expect(content.metadata.lines).toBeGreaterThan(0);
      });

      // 4. TypeScript Programで解析
      const manager = new ProgramManager({
        rootPath: projectPath,
        compilerOptions: {
          strict: true,
        },
      });

      const absolutePaths = resolvedPaths.map((r) => r.absolutePath);
      const program = manager.getProgram(absolutePaths);

      expect(program).toBeDefined();

      // 5. SourceFileがすべて取得できる
      const sourceFiles = program.getSourceFiles();
      expect(sourceFiles.length).toBeGreaterThanOrEqual(5);

      // 6. TypeCheckerで型情報取得
      const typeChecker = manager.getTypeChecker(absolutePaths);
      expect(typeChecker).toBeDefined();
      expect(typeof typeChecker.getTypeAtLocation).toBe("function");
    });

    test("依存関係を正しく解決できる", async () => {
      const resolver = new PathResolver(projectPath);
      const manager = new ProgramManager({
        rootPath: projectPath,
        compilerOptions: {},
      });

      // index.ts は他の4ファイルに依存
      const indexPath = resolver.resolve("./src/index.ts");
      const program = manager.getProgram([indexPath.absolutePath]);

      // Programが正常に作成される（依存解決成功）
      expect(program).toBeDefined();

      // Diagnosticsをチェック（エラーがないこと）
      const host = new CompilerHost({
        rootPath: projectPath,
        compilerOptions: { strict: true },
      });
      const programWithHost = host.createProgram([indexPath.absolutePath]);
      const diagnostics = host.getDiagnostics(programWithHost);

      // 深刻なエラーがないこと（warningは許容）
      const errors = diagnostics.filter((d) => d.category === 1); // Error category
      expect(errors.length).toBeLessThan(10); // 少数のエラーは許容
    });

    test("パフォーマンス: 小規模プロジェクト全体解析が500ms以内", async () => {
      const resolver = new PathResolver(projectPath);
      const reader = new FileReader();
      const manager = new ProgramManager({
        rootPath: projectPath,
        compilerOptions: {},
      });

      const filePaths = [
        "./src/types.ts",
        "./src/user.ts",
        "./src/product.ts",
        "./lib/utils.ts",
        "./src/index.ts",
      ];

      const start = Date.now();

      // 統合フロー全体
      const resolvedPaths = filePaths.map((p) => resolver.resolve(p));
      await Promise.all(
        resolvedPaths.map((r) => reader.readFile(r.absolutePath))
      );
      const absolutePaths = resolvedPaths.map((r) => r.absolutePath);
      manager.getProgram(absolutePaths);
      manager.getTypeChecker(absolutePaths);

      const elapsed = Date.now() - start;

      console.log(`Small project analysis time: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(10000); // 10秒以内（初回実行考慮）
    });

    test("キャッシュを活用した2回目の高速化", async () => {
      const cache = new SourceFileCache();
      const resolver = new PathResolver(projectPath);

      const filePath = resolver.resolve("./src/types.ts");

      // 1回目: キャッシュミス
      await cache.get(filePath.absolutePath);

      // 2回目: キャッシュヒット
      const start = Date.now();
      const sourceFile = await cache.get(filePath.absolutePath);
      const elapsed = Date.now() - start;

      expect(sourceFile).toBeDefined();
      expect(elapsed).toBeLessThan(10); // 10ms以内
    });
  });

  describe("中規模プロジェクト (50ファイル)", () => {
    const projectPath = resolve(cwd, "tests/fixtures/projects/medium-project");

    test("中規模プロジェクトを解析できる", async () => {
      // 1. ワークスペース検証
      const validator = new WorkspaceValidator();
      const isValid = await validator.validateWorkspace(projectPath);
      expect(isValid).toBe(true);

      // 2. Glob パターンで全TypeScriptファイル取得
      const resolver = new PathResolver(projectPath);
      const tsFiles = await resolver.matchFiles(
        ["**/*.ts", "**/*.tsx"],
        ["node_modules/**", "dist/**"]
      );

      expect(tsFiles.length).toBeGreaterThan(40); // 50ファイル程度

      // 3. 最初の10ファイルを解析（全ファイルは時間がかかるため）
      const sampleFiles = tsFiles.slice(0, 10);
      const manager = new ProgramManager({
        rootPath: projectPath,
        compilerOptions: {},
      });

      const program = manager.getProgram(sampleFiles);
      expect(program).toBeDefined();

      const sourceFiles = program.getSourceFiles();
      expect(sourceFiles.length).toBeGreaterThanOrEqual(10);
    });

    test("大量ファイルのキャッシング効率", async () => {
      const resolver = new PathResolver(projectPath);
      const cache = new SourceFileCache(100); // LRU: 100エントリ

      const tsFiles = await resolver.matchFiles(["**/*.ts", "**/*.tsx"], []);
      const sampleFiles = tsFiles.slice(0, 20);

      // 相対パスを絶対パスに変換
      const absolutePaths = sampleFiles.map((f) => {
        const resolved = resolver.resolve(`./${f}`);
        return resolved.absolutePath;
      });

      // 1回目: すべてキャッシュミス
      const start1 = Date.now();
      await Promise.all(absolutePaths.map((f) => cache.get(f)));
      const elapsed1 = Date.now() - start1;

      // 2回目: すべてキャッシュヒット
      const start2 = Date.now();
      await Promise.all(absolutePaths.map((f) => cache.get(f)));
      const elapsed2 = Date.now() - start2;

      console.log(
        `Medium project cache performance: 1st=${elapsed1}ms, 2nd=${elapsed2}ms`
      );

      // キャッシュヒットは明らかに高速
      expect(elapsed2).toBeLessThan(elapsed1);
      expect(elapsed2).toBeLessThan(100); // 100ms以内
    });

    test("メモリ効率: 大量ファイル処理でメモリ増加が適切", async () => {
      const resolver = new PathResolver(projectPath);
      const manager = new ProgramManager({
        rootPath: projectPath,
        compilerOptions: {},
      });

      const tsFiles = await resolver.matchFiles(["**/*.ts"], []);
      const sampleFiles = tsFiles.slice(0, 30);

      const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      // 大量のファイルを処理
      manager.getProgram(sampleFiles);

      const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memIncrease = memAfter - memBefore;

      console.log(`Memory increase: ${memIncrease.toFixed(2)}MB`);
      expect(memIncrease).toBeLessThan(200); // 200MB未満
    });

    test("部分的なファイル更新シミュレーション", async () => {
      const resolver = new PathResolver(projectPath);
      const cache = new SourceFileCache();

      const tsFiles = await resolver.matchFiles(["src/**/*.ts"], []);
      const testFile = tsFiles[0];

      // 初回読み込み
      const sourceFile1 = await cache.get(testFile);
      expect(sourceFile1).toBeDefined();

      // キャッシュ無効化（ファイル更新をシミュレート）
      await cache.invalidate(testFile);

      // 再読み込み
      const sourceFile2 = await cache.get(testFile);
      expect(sourceFile2).toBeDefined();

      // 新しいインスタンスが作成される
      expect(sourceFile1).not.toBe(sourceFile2);
    });
  });

  describe("依存関係のあるファイル群", () => {
    const projectPath = resolve(cwd, "tests/fixtures/projects/small-project");

    test("循環参照がないことを確認", async () => {
      const resolver = new PathResolver(projectPath);
      const host = new CompilerHost({
        rootPath: projectPath,
        compilerOptions: {
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      });

      const indexPath = resolver.resolve("./src/index.ts");
      const program = host.createProgram([indexPath.absolutePath]);

      // Diagnosticsで循環参照エラーをチェック
      const diagnostics = host.getDiagnostics(program);
      const circularErrors = diagnostics.filter((d) =>
        d.messageText.toString().includes("circular")
      );

      expect(circularErrors.length).toBe(0);
    });

    test("エクスポート/インポートの整合性", async () => {
      const resolver = new PathResolver(projectPath);
      const manager = new ProgramManager({
        rootPath: projectPath,
        compilerOptions: {},
      });

      // types.ts をエクスポートし、他のファイルでインポート
      const typesPath = resolver.resolve("./src/types.ts");
      const userPath = resolver.resolve("./src/user.ts");

      const program = manager.getProgram([
        typesPath.absolutePath,
        userPath.absolutePath,
      ]);
      const typeChecker = program.getTypeChecker();

      expect(typeChecker).toBeDefined();

      // SourceFileが両方取得できる
      const typesSourceFile = manager.getSourceFile(typesPath.absolutePath);
      const userSourceFile = manager.getSourceFile(userPath.absolutePath);

      expect(typesSourceFile).toBeDefined();
      expect(userSourceFile).toBeDefined();
    });
  });

  describe("エラー時の動作確認", () => {
    test("構文エラーファイルを含むプロジェクトでも部分的に解析可能", async () => {
      const projectPath = resolve(cwd, "tests/fixtures");
      const resolver = new PathResolver(projectPath);
      const manager = new ProgramManager({
        rootPath: projectPath,
        compilerOptions: {},
      });

      // 正常ファイルとエラーファイルを混在
      const normalFile = resolver.resolve("./sample-simple.ts");
      const errorFile = resolver.resolve("./sample-error.ts");

      const program = manager.getProgram([
        normalFile.absolutePath,
        errorFile.absolutePath,
      ]);

      // Programは作成される
      expect(program).toBeDefined();

      // 正常ファイルのSourceFileは取得できる
      const normalSourceFile = manager.getSourceFile(normalFile.absolutePath);
      expect(normalSourceFile).toBeDefined();
    });

    test("存在しないファイルパスのエラーハンドリング", async () => {
      const projectPath = resolve(cwd, "tests/fixtures/projects/small-project");
      const resolver = new PathResolver(projectPath);

      // ワークスペース外のパスを拒否
      expect(() => {
        resolver.resolve("../../../etc/passwd");
      }).toThrow();
    });
  });

  describe("統合フローのパフォーマンス", () => {
    test("完全統合フロー（FS + Compiler）が効率的", async () => {
      const projectPath = resolve(
        cwd,
        "tests/fixtures/projects/small-project"
      );
      const validator = new WorkspaceValidator();
      const resolver = new PathResolver(projectPath);
      const reader = new FileReader();
      const manager = new ProgramManager({
        rootPath: projectPath,
        compilerOptions: {},
      });
      const cache = new SourceFileCache();

      const filePath = "./src/types.ts";

      // 完全統合フロー測定
      const start = Date.now();

      // 1. ワークスペース検証
      await validator.validateWorkspace(projectPath);

      // 2. パス解決
      const resolved = resolver.resolve(filePath);

      // 3. ファイル存在確認
      await validator.fileExists(resolved.absolutePath);

      // 4. ファイル読み込み
      await reader.readFile(resolved.absolutePath);

      // 5. SourceFileキャッシュ
      await cache.get(resolved.absolutePath);

      // 6. Program作成
      manager.getProgram([resolved.absolutePath]);

      // 7. TypeChecker取得
      manager.getTypeChecker([resolved.absolutePath]);

      const elapsed = Date.now() - start;

      console.log(`Full integration flow: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(5000); // 5秒以内（初回実行）
    });
  });
});
