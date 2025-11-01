/**
 * Compiler Error Handling Tests
 * エラーケースの包括的なテスト
 */

import { describe, test, expect } from "bun:test";
import { ProgramManager } from "../../src/compiler/ProgramManager";
import { SourceFileCache } from "../../src/compiler/SourceFileCache";
import { CompilerHost } from "../../src/compiler/CompilerHost";
import { resolve } from "path";

describe("Compilerエラーハンドリング", () => {
  const testWorkspace = resolve(process.cwd(), "tests/fixtures");

  test("構文エラーファイルでもProgramを作成", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    // 構文エラーのあるファイル
    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = manager.getProgram([errorFile]);

    expect(program).toBeDefined();

    // Diagnosticsを取得
    const diagnostics = program.getSyntacticDiagnostics();
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  test("構文エラーと意味エラーの両方を検出", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: { strict: true },
    });

    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = host.createProgram([errorFile]);
    const diagnostics = host.getDiagnostics(program);

    // 構文エラーまたは意味エラーがある
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.every(d => d.category !== undefined)).toBe(true);
  });

  test("存在しないファイルでもエラーにならない（TypeScriptの仕様）", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    // TypeScriptはファイルが存在しなくてもProgramを作成できる
    const program = manager.getProgram([resolve(testWorkspace, "nonexistent.ts")]);
    expect(program).toBeDefined();

    // SourceFileは取得できない
    const sourceFile = manager.getSourceFile(resolve(testWorkspace, "nonexistent.ts"));
    expect(sourceFile).toBeUndefined();
  });

  test("SourceFileCacheで存在しないファイルはエラー", async () => {
    const cache = new SourceFileCache();
    const nonExistentFile = resolve(testWorkspace, "nonexistent-file.ts");

    // ファイルが存在しない場合はエラー
    await expect(cache.get(nonExistentFile)).rejects.toThrow();
  });

  test("TypeCheckerでエラーファイルも処理可能", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: { strict: true },
    });

    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const typeChecker = manager.getTypeChecker([errorFile]);

    // エラーがあってもTypeCheckerは取得できる
    expect(typeChecker).toBeDefined();
    expect(typeof typeChecker.getTypeAtLocation).toBe("function");
  });

  test("複数ファイルで一部がエラーでも処理可能", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const files = [
      resolve(testWorkspace, "sample-simple.ts"), // 正常
      resolve(testWorkspace, "sample-error.ts"),  // エラー
      resolve(testWorkspace, "sample-class.ts"),  // 正常
    ];

    const program = manager.getProgram(files);
    expect(program).toBeDefined();

    // すべてのファイルのSourceFileが取得できる（エラーがあっても）
    const sourceFiles = program.getSourceFiles();
    expect(sourceFiles.length).toBeGreaterThanOrEqual(files.length);
  });

  test("CompilerHostで無効な設定でもProgram作成", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {
        // 存在しないモジュールパス
        baseUrl: "/invalid/path",
      },
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program = host.createProgram([sampleFile]);

    // 無効な設定でもProgramは作成できる
    expect(program).toBeDefined();
  });

  test("ProgramManagerキャッシュのクリア後も動作", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");

    // Program作成
    const program1 = manager.getProgram([sampleFile]);
    expect(program1).toBeDefined();

    // キャッシュクリア
    manager.clearCache();

    // クリア後も新しいProgramを作成できる
    const program2 = manager.getProgram([sampleFile]);
    expect(program2).toBeDefined();
    expect(program1).not.toBe(program2);
  });

  test("SourceFileCacheの無効化後も動作", async () => {
    const cache = new SourceFileCache();
    const sampleFile = resolve(testWorkspace, "sample-simple.ts");

    // SourceFile取得
    const sourceFile1 = await cache.get(sampleFile);
    expect(sourceFile1).toBeDefined();

    // キャッシュ無効化
    await cache.invalidate(sampleFile);

    // 無効化後も新しいSourceFileを取得できる
    const sourceFile2 = await cache.get(sampleFile);
    expect(sourceFile2).toBeDefined();
    expect(sourceFile1).not.toBe(sourceFile2);
  });

  test("診断情報の取得とフォーマット", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: { strict: true },
    });

    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = host.createProgram([errorFile]);
    const diagnostics = host.getDiagnostics(program);

    expect(diagnostics.length).toBeGreaterThan(0);

    // 診断情報の基本構造確認
    diagnostics.forEach(diagnostic => {
      expect(diagnostic.category).toBeDefined();
      expect(diagnostic.code).toBeDefined();
      expect(diagnostic.messageText).toBeDefined();
    });
  });

  test("空のファイルリストでもProgram作成", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    // 空のファイルリストでもProgramは作成できる
    const program = manager.getProgram([]);
    expect(program).toBeDefined();
  });

  test("大量のエラーがあるファイルでも処理可能", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: { strict: true },
    });

    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = manager.getProgram([errorFile]);

    // 大量のエラーがあってもProgramは作成できる
    expect(program).toBeDefined();

    const diagnostics = [
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ];

    // エラーが複数ある
    expect(diagnostics.length).toBeGreaterThan(0);
  });
});
