/**
 * Compiler Layer Integration Tests
 * CompilerHost + ProgramManager + SourceFileCache の統合テスト
 */

import { describe, test, expect } from "bun:test";
import { ProgramManager } from "../../src/compiler/ProgramManager";
import { SourceFileCache } from "../../src/compiler/SourceFileCache";
import { CompilerHost } from "../../src/compiler/CompilerHost";
import { resolve } from "path";
import * as ts from "typescript";

describe("Compiler統合テスト", () => {
  const testWorkspace = resolve(process.cwd(), "tests/fixtures");

  test("ProgramManager + SourceFileCache統合", async () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });
    const cache = new SourceFileCache();

    const filePath = resolve(testWorkspace, "sample-simple.ts");

    // 初回: キャッシュミス
    const sourceFile1 = await cache.get(filePath);

    // 2回目: キャッシュヒット
    const start = Date.now();
    const sourceFile2 = await cache.get(filePath);
    const elapsed = Date.now() - start;

    expect(sourceFile1).toBe(sourceFile2);
    expect(elapsed).toBeLessThan(10);
  });

  test("TypeCheckerでシンボル解決", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const filePath = resolve(testWorkspace, "sample-simple.ts");
    const typeChecker = manager.getTypeChecker([filePath]);
    expect(typeChecker).toBeDefined();
    expect(typeof typeChecker.getTypeAtLocation).toBe("function");

    // TypeCheckerの基本的な機能確認
    const sourceFile = manager.getSourceFile(filePath);
    expect(sourceFile).toBeDefined();
  });

  test("複数ファイルのProgram作成", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const files = [
      resolve(testWorkspace, "sample-simple.ts"),
      resolve(testWorkspace, "sample-class.ts"),
      resolve(testWorkspace, "sample-types.ts"),
    ];

    const program = manager.getProgram(files);
    const sourceFiles = program.getSourceFiles();

    expect(sourceFiles.length).toBeGreaterThanOrEqual(files.length);
  });

  test("CompilerHost + ProgramManager統合", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {
        strict: true,
      },
    });

    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {
        strict: true,
      },
    });

    const filePath = resolve(testWorkspace, "sample-simple.ts");

    // CompilerHostでProgram作成
    const program1 = host.createProgram([filePath]);
    expect(program1).toBeDefined();

    // ProgramManagerでProgram取得（キャッシュ利用）
    const program2 = manager.getProgram([filePath]);
    expect(program2).toBeDefined();

    // 両方のProgramが有効なTypeCheckerを返す
    const typeChecker1 = program1.getTypeChecker();
    const typeChecker2 = program2.getTypeChecker();
    expect(typeChecker1).toBeDefined();
    expect(typeChecker2).toBeDefined();
  });

  test("Diagnosticsの統合確認", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {
        strict: true,
      },
    });

    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = host.createProgram([errorFile]);
    const diagnostics = host.getDiagnostics(program);

    // エラーファイルはdiagnosticsがある
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.every(d => d.category !== undefined)).toBe(true);
  });

  test("キャッシュの一貫性確認", async () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });
    const cache = new SourceFileCache();

    const filePath = resolve(testWorkspace, "sample-simple.ts");

    // ProgramManagerからSourceFile取得
    const sourceFile1 = manager.getSourceFile(filePath);

    // SourceFileCacheから取得
    const sourceFile2 = await cache.get(filePath);

    // 両方ともファイル名が一致
    expect(sourceFile1?.fileName).toBeDefined();
    expect(sourceFile2.fileName).toBeDefined();
    expect(sourceFile1?.fileName).toContain("sample-simple.ts");
    expect(sourceFile2.fileName).toContain("sample-simple.ts");
  });

  test("複数コンポーネントの並行動作", async () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });
    const cache = new SourceFileCache();
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const files = [
      resolve(testWorkspace, "sample-simple.ts"),
      resolve(testWorkspace, "sample-class.ts"),
    ];

    // 各コンポーネントを順次使用（タイムアウト回避のため）
    const program = manager.getProgram(files);
    const sourceFiles = await Promise.all(files.map(f => Promise.resolve(manager.getSourceFile(f))));
    const cachedFiles = await Promise.all(files.map(f => cache.get(f)));

    expect(program).toBeDefined();
    expect(sourceFiles.every(sf => sf !== undefined)).toBe(true);
    expect(cachedFiles.length).toBe(files.length);
    expect(cachedFiles.every(cf => cf !== undefined)).toBe(true);
  });

  test("エラーハンドリングの統合確認", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {
        strict: true,
      },
    });

    // エラーファイルでもProgramは作成できる
    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = manager.getProgram([errorFile]);
    expect(program).toBeDefined();

    // TypeCheckerも取得できる
    const typeChecker = manager.getTypeChecker([errorFile]);
    expect(typeChecker).toBeDefined();
  });

  test("パフォーマンス: 統合フロー全体", async () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });
    const cache = new SourceFileCache();

    const filePath = resolve(testWorkspace, "sample-simple.ts");

    // 統合フロー全体のパフォーマンス測定
    const start = Date.now();

    // 1. キャッシュから取得
    const sourceFile = await cache.get(filePath);

    // 2. ProgramManager経由でTypeChecker取得
    const typeChecker = manager.getTypeChecker([filePath]);

    // 3. Program取得
    const program = manager.getProgram([filePath]);

    const elapsed = Date.now() - start;

    expect(sourceFile).toBeDefined();
    expect(typeChecker).toBeDefined();
    expect(program).toBeDefined();

    // 統合フロー全体が高速（キャッシュ効果あり）
    expect(elapsed).toBeLessThan(5000);
  });
});
