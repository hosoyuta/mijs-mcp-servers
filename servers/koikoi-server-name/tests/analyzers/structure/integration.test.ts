/**
 * StructureAnalyzer Integration Tests
 * Testing integration with CompilerHost and real files
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { StructureAnalyzer } from "../../../src/analyzers/StructureAnalyzer";
import { CompilerHost } from "../../../src/compiler/CompilerHost";
import { defaultConfig } from "../../helpers/analyzer-test-utils";
import { resolve } from "path";

describe("StructureAnalyzer Integration", () => {
  let compilerHost: CompilerHost;
  let analyzer: StructureAnalyzer;
  const testWorkspace = resolve(process.cwd(), "tests/fixtures/analyzers");

  beforeEach(() => {
    compilerHost = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });
    analyzer = new StructureAnalyzer(compilerHost, defaultConfig());
  });

  // TC-0201-I-001: Integration with CompilerHost
  test("TC-0201-I-001: CompilerHostと連携してファイルを解析", () => {
    const filePath = resolve(testWorkspace, "sample-simple.ts");
    const program = compilerHost.createProgram([filePath]);
    const sourceFile = program.getSourceFile(filePath);

    expect(sourceFile).toBeDefined();

    const result = analyzer.analyze(sourceFile!);

    expect(result.success).toBe(true);
    expect(result.filePath).toContain("sample-simple.ts");
  });

  // TC-0201-I-002: Real TypeScript file analysis
  test("TC-0201-I-002: 実際のTypeScriptファイルを解析", () => {
    const filePath = resolve(testWorkspace, "sample-class.ts");
    const program = compilerHost.createProgram([filePath]);
    const sourceFile = program.getSourceFile(filePath);

    const result = analyzer.analyze(sourceFile!);

    expect(result.success).toBe(true);
    expect(result.classes.length).toBeGreaterThan(0);
  });

  // TC-0201-I-003: Multiple files sequential analysis
  test("TC-0201-I-003: 複数ファイルを連続して解析", () => {
    const files = [
      resolve(testWorkspace, "sample-simple.ts"),
      resolve(testWorkspace, "sample-class.ts"),
      resolve(testWorkspace, "sample-mixed.ts"),
    ];

    const results = files.map((file) => {
      const program = compilerHost.createProgram([file]);
      const sourceFile = program.getSourceFile(file);
      return analyzer.analyze(sourceFile!);
    });

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
  });

  // TC-0201-I-004: Integration with ProgramManager cache
  test("TC-0201-I-004: ProgramManagerのキャッシュと連携", () => {
    const filePath = resolve(testWorkspace, "sample-simple.ts");

    // First analysis (no cache)
    const program1 = compilerHost.createProgram([filePath]);
    const sourceFile1 = program1.getSourceFile(filePath);
    const result1 = analyzer.analyze(sourceFile1!);

    // Second analysis (with cache)
    const startTime = performance.now();
    const program2 = compilerHost.createProgram([filePath]);
    const sourceFile2 = program2.getSourceFile(filePath);
    const result2 = analyzer.analyze(sourceFile2!);
    const endTime = performance.now();

    expect(result2.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(50); // Fast with cache
  });

  // TC-0201-I-005: Integration with error handling
  test("TC-0201-I-006: エラーハンドリングの統合テスト", () => {
    const errorFile = resolve(testWorkspace, "sample-error.ts");
    const program = compilerHost.createProgram([errorFile]);
    const diagnostics = compilerHost.getDiagnostics(program);
    const sourceFile = program.getSourceFile(errorFile);

    const result = analyzer.analyze(sourceFile!);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(diagnostics.length).toBeGreaterThan(0);
  });

  // TC-0201-I-006: TypeChecker integration foundation
  test("TC-0201-I-007: TypeCheckerとの連携（将来拡張）", () => {
    const filePath = resolve(testWorkspace, "sample-simple.ts");
    const program = compilerHost.createProgram([filePath]);
    const typeChecker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(filePath);

    const result = analyzer.analyze(sourceFile!);

    expect(result.success).toBe(true);
    expect(typeChecker).toBeDefined();
    // Type information extraction will be implemented in future tasks
  });
});
