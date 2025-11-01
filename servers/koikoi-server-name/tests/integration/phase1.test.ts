/**
 * Phase 1 Complete Integration Tests
 * File System層 + Compiler層の完全統合テスト
 */

import { describe, test, expect } from "bun:test";
import { FileReader } from "../../src/fs/FileReader";
import { PathResolver } from "../../src/fs/PathResolver";
import { WorkspaceValidator } from "../../src/fs/WorkspaceValidator";
import { ProgramManager } from "../../src/compiler/ProgramManager";
import { SourceFileCache } from "../../src/compiler/SourceFileCache";
import { CompilerHost } from "../../src/compiler/CompilerHost";
import { resolve } from "path";

describe("Phase 1完全統合テスト", () => {
  const workspace = resolve(process.cwd(), "tests/fixtures");

  test("File System + Compiler完全統合", async () => {
    // 1. WorkspaceValidator でワークスペース検証
    const validator = new WorkspaceValidator();
    const isValid = await validator.validateWorkspace(workspace);
    expect(isValid).toBe(true);

    // 2. PathResolverでパス解決
    const resolver = new PathResolver(workspace);
    const resolved = resolver.resolve("./sample-simple.ts");

    expect(resolved.absolutePath).toBeDefined();
    expect(resolved.absolutePath).toContain("sample-simple.ts");

    // 3. FileReaderでファイル読み込み
    const reader = new FileReader();
    const fileResult = await reader.readFile(resolved.absolutePath);

    expect(fileResult.content).toBeDefined();
    expect(fileResult.content.length).toBeGreaterThan(0);
    expect(fileResult.metadata.lines).toBeGreaterThan(0);

    // 4. ProgramManagerでTypeScript Program作成
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });
    const program = manager.getProgram([resolved.absolutePath]);

    expect(program).toBeDefined();

    // 5. SourceFile取得
    const sourceFile = manager.getSourceFile(resolved.absolutePath);

    expect(sourceFile).toBeDefined();
    expect(sourceFile?.fileName).toContain("sample-simple.ts");

    // 6. TypeChecker取得
    const typeChecker = manager.getTypeChecker([resolved.absolutePath]);
    expect(typeChecker).toBeDefined();
  });

  test("複数ファイルの完全統合フロー", async () => {
    const resolver = new PathResolver(workspace);
    const reader = new FileReader();
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });

    const fileNames = ["sample-simple.ts", "sample-class.ts", "sample-types.ts"];

    // すべてのファイルを統合処理
    const results = await Promise.all(
      fileNames.map(async (fileName) => {
        // パス解決
        const resolved = resolver.resolve(`./${fileName}`);

        // ファイル読み込み
        const fileContent = await reader.readFile(resolved.absolutePath);

        // SourceFile取得
        const sourceFile = manager.getSourceFile(resolved.absolutePath);

        return {
          fileName,
          fileContent,
          sourceFile,
        };
      })
    );

    // すべてのファイルが正常に処理されている
    expect(results.length).toBe(fileNames.length);
    results.forEach((result) => {
      expect(result.fileContent.content.length).toBeGreaterThan(0);
      expect(result.sourceFile).toBeDefined();
    });

    // Programで複数ファイルを一度に処理
    const allPaths = results.map((r) => {
      const resolved = resolver.resolve(`./${r.fileName}`);
      return resolved.absolutePath;
    });

    const program = manager.getProgram(allPaths);
    const sourceFiles = program.getSourceFiles();

    expect(sourceFiles.length).toBeGreaterThanOrEqual(fileNames.length);
  });

  test("SourceFileCache + FileReader統合", async () => {
    const cache = new SourceFileCache();
    const reader = new FileReader();
    const resolver = new PathResolver(workspace);

    const fileName = "sample-simple.ts";
    const resolved = resolver.resolve(`./${fileName}`);

    // FileReaderで読み込み
    const fileContent = await reader.readFile(resolved.absolutePath);
    expect(fileContent.content.length).toBeGreaterThan(0);

    // SourceFileCacheでSourceFile取得
    const sourceFile = await cache.get(resolved.absolutePath);
    expect(sourceFile).toBeDefined();

    // ファイルの内容が一致
    expect(sourceFile.text.length).toBe(fileContent.content.length);
  });

  test("エラーファイルの完全統合処理", async () => {
    const resolver = new PathResolver(workspace);
    const reader = new FileReader();
    const host = new CompilerHost({
      rootPath: workspace,
      compilerOptions: { strict: true },
    });

    const errorFileName = "sample-error.ts";
    const resolved = resolver.resolve(`./${errorFileName}`);

    // FileReaderで読み込み（エラーファイルでも読み込める）
    const fileContent = await reader.readFile(resolved.absolutePath);
    expect(fileContent.content.length).toBeGreaterThan(0);

    // CompilerHostでProgram作成（エラーがあっても作成できる）
    const program = host.createProgram([resolved.absolutePath]);
    expect(program).toBeDefined();

    // Diagnostics取得
    const diagnostics = host.getDiagnostics(program);
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  test("Glob パターンマッチング + Compiler統合", async () => {
    const resolver = new PathResolver(workspace);
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });

    // Globパターンで複数ファイルを検索
    const tsFiles = await resolver.matchFiles(["*.ts"], []);

    expect(tsFiles.length).toBeGreaterThan(0);

    // すべてのファイルでProgramを作成
    const program = manager.getProgram(tsFiles);
    expect(program).toBeDefined();

    // すべてのSourceFileが取得できる
    const sourceFiles = program.getSourceFiles();
    expect(sourceFiles.length).toBeGreaterThanOrEqual(tsFiles.length);
  });

  test("ワークスペース外ファイルの統合エラーハンドリング", () => {
    const resolver = new PathResolver(workspace);

    // ワークスペース外のパスは拒否される
    expect(() => {
      resolver.resolve("../../../etc/passwd");
    }).toThrow();
  });

  test("パフォーマンス: 完全統合フロー", async () => {
    const resolver = new PathResolver(workspace);
    const reader = new FileReader();
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });
    const cache = new SourceFileCache();

    const fileName = "sample-simple.ts";
    const resolved = resolver.resolve(`./${fileName}`);

    // 統合フロー全体のパフォーマンス測定
    const start = Date.now();

    // 1. パス解決
    const resolved2 = resolver.resolve(`./${fileName}`);

    // 2. ファイル読み込み
    const fileContent = await reader.readFile(resolved2.absolutePath);

    // 3. SourceFileキャッシュ取得
    const sourceFile = await cache.get(resolved2.absolutePath);

    // 4. Program作成
    const program = manager.getProgram([resolved2.absolutePath]);

    // 5. TypeChecker取得
    const typeChecker = manager.getTypeChecker([resolved2.absolutePath]);

    const elapsed = Date.now() - start;

    expect(fileContent).toBeDefined();
    expect(sourceFile).toBeDefined();
    expect(program).toBeDefined();
    expect(typeChecker).toBeDefined();

    // 統合フロー全体が高速（初回）
    expect(elapsed).toBeLessThan(10000);
  });

  test("キャッシュ効果による2回目の高速化", async () => {
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });
    const cache = new SourceFileCache();
    const resolver = new PathResolver(workspace);

    const fileName = "sample-simple.ts";
    const resolved = resolver.resolve(`./${fileName}`);

    // 1回目: キャッシュミス
    await cache.get(resolved.absolutePath);
    manager.getProgram([resolved.absolutePath]);

    // 2回目: キャッシュヒット
    const start = Date.now();
    const sourceFile = await cache.get(resolved.absolutePath);
    const program = manager.getProgram([resolved.absolutePath]);
    const elapsed = Date.now() - start;

    expect(sourceFile).toBeDefined();
    expect(program).toBeDefined();

    // キャッシュヒットは非常に高速
    expect(elapsed).toBeLessThan(5000);
  });

  test("メモリ効率的な大量ファイル処理", async () => {
    const resolver = new PathResolver(workspace);
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: {},
    });

    // すべてのTypeScriptファイルを取得
    const tsFiles = await resolver.matchFiles(["*.ts"], []);

    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

    // 大量のファイルを処理
    const program = manager.getProgram(tsFiles);
    const sourceFiles = program.getSourceFiles();

    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
    const memIncrease = memAfter - memBefore;

    expect(sourceFiles.length).toBeGreaterThan(0);

    // メモリ使用量が適切（大きく増加していない）
    expect(memIncrease).toBeLessThan(100); // 100MB未満
  });

  test("TypeChecker統合: 型情報の取得", () => {
    const resolver = new PathResolver(workspace);
    const manager = new ProgramManager({
      rootPath: workspace,
      compilerOptions: { strict: true },
    });

    const fileName = "sample-class.ts";
    const resolved = resolver.resolve(`./${fileName}`);

    const program = manager.getProgram([resolved.absolutePath]);
    const typeChecker = program.getTypeChecker();
    const sourceFile = manager.getSourceFile(resolved.absolutePath);

    expect(typeChecker).toBeDefined();
    expect(sourceFile).toBeDefined();

    // TypeCheckerの基本機能確認
    expect(typeof typeChecker.getTypeAtLocation).toBe("function");
    expect(typeof typeChecker.getSymbolAtLocation).toBe("function");
  });
});
