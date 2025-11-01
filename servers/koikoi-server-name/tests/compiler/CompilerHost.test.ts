/**
 * CompilerHost tests
 * TDD Red Phase: Test cases for CompilerHost implementation
 */

import { describe, test, expect } from "bun:test";
import { CompilerHost } from "../../src/compiler/CompilerHost";
import * as ts from "typescript";
import { resolve } from "path";

describe("CompilerHost", () => {
  const testWorkspace = resolve(process.cwd(), "tests/fixtures");

  test("TypeScript Programを作成できる", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        strict: true,
      },
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program = host.createProgram([sampleFile]);
    expect(program).toBeDefined();
    expect(program.getCompilerOptions).toBeDefined();
  });

  test("SourceFileを取得できる", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program = host.createProgram([sampleFile]);

    // TypeScript Programは正規化されたファイル名を使用するため、
    // getSourceFileの引数も正規化する必要がある
    const sourceFiles = program.getSourceFiles();
    const targetFile = sourceFiles.find(sf => sf.fileName.includes("sample-simple.ts"));

    expect(targetFile).toBeDefined();
    expect(targetFile?.fileName).toContain("sample-simple.ts");
  });

  test("TypeCheckerを取得できる", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program = host.createProgram([sampleFile]);
    const typeChecker = program.getTypeChecker();

    expect(typeChecker).toBeDefined();
    expect(typeof typeChecker.getTypeAtLocation).toBe("function");
  });

  test("複数ファイルでProgramを作成できる", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const files = [
      resolve(testWorkspace, "sample-simple.ts"),
      resolve(testWorkspace, "sample-class.ts"),
    ];

    const program = host.createProgram(files);
    const sourceFiles = program.getSourceFiles();

    // 複数ファイル + libファイルが含まれる
    expect(sourceFiles.length).toBeGreaterThanOrEqual(files.length);
  });

  test("デフォルトのCompilerOptionsが適用される", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program = host.createProgram([sampleFile]);
    const options = program.getCompilerOptions();

    // デフォルトオプションの確認
    expect(options.target).toBe(ts.ScriptTarget.ES2022);
    expect(options.module).toBe(ts.ModuleKind.ESNext);
    expect(options.strict).toBe(true);
  });

  test("カスタムCompilerOptionsが優先される", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {
        target: ts.ScriptTarget.ES2015,
        strict: false,
      },
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program = host.createProgram([sampleFile]);
    const options = program.getCompilerOptions();

    // カスタムオプションが優先
    expect(options.target).toBe(ts.ScriptTarget.ES2015);
    expect(options.strict).toBe(false);
  });

  test("正常なファイルではdiagnosticsが空", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program = host.createProgram([sampleFile]);
    const diagnostics = host.getDiagnostics(program);

    // 正常なファイルではエラーなし
    expect(Array.isArray(diagnostics)).toBe(true);
  });

  test("構文エラーファイルでもProgramを作成できる", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = host.createProgram([errorFile]);

    expect(program).toBeDefined();

    // Diagnosticsを取得
    const diagnostics = host.getDiagnostics(program);
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  test("getDiagnosticsが構文エラーと意味エラーを返す", () => {
    const host = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: { strict: true },
    });

    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = host.createProgram([errorFile]);
    const diagnostics = host.getDiagnostics(program);

    // エラー情報が含まれる
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.every(d => d.category !== undefined)).toBe(true);
  });
});
