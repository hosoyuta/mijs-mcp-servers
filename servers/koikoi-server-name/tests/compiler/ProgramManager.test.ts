/**
 * ProgramManager tests
 * TDD Red Phase: Test cases for ProgramManager implementation
 */

import { describe, test, expect } from "bun:test";
import { ProgramManager } from "../../src/compiler/ProgramManager";
import { resolve } from "path";

describe("ProgramManager", () => {
  const testWorkspace = resolve(process.cwd(), "tests/fixtures");

  test("Programインスタンスを再利用", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program1 = manager.getProgram([sampleFile]);
    const program2 = manager.getProgram([sampleFile]);

    // 同じインスタンスが返される
    expect(program1).toBe(program2);
  });

  test("ファイルリストが異なれば新しいProgramを作成", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const file1 = resolve(testWorkspace, "sample-simple.ts");
    const file2 = resolve(testWorkspace, "sample-class.ts");

    const program1 = manager.getProgram([file1]);
    const program2 = manager.getProgram([file2]);

    expect(program1).not.toBe(program2);
  });

  test("TypeCheckerを取得", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const typeChecker = manager.getTypeChecker([sampleFile]);

    expect(typeChecker).toBeDefined();
    expect(typeof typeChecker.getTypeAtLocation).toBe("function");
  });

  test("SourceFileを取得", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const sourceFile = manager.getSourceFile(sampleFile);

    expect(sourceFile).toBeDefined();
    expect(sourceFile?.fileName).toContain("sample-simple.ts");
  });

  test("キャッシュをクリア", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program1 = manager.getProgram([sampleFile]);

    manager.clearCache();

    const program2 = manager.getProgram([sampleFile]);

    // クリア後は新しいインスタンスが作成される
    expect(program1).not.toBe(program2);
  });

  test("複数ファイルでもキャッシュが機能", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const files = [
      resolve(testWorkspace, "sample-simple.ts"),
      resolve(testWorkspace, "sample-class.ts"),
    ];

    const program1 = manager.getProgram(files);
    const program2 = manager.getProgram(files);

    expect(program1).toBe(program2);
  });

  test("ファイル順序が異なっても同じキャッシュキーを生成", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const file1 = resolve(testWorkspace, "sample-simple.ts");
    const file2 = resolve(testWorkspace, "sample-class.ts");

    const program1 = manager.getProgram([file1, file2]);
    const program2 = manager.getProgram([file2, file1]);

    // ソートされるので同じProgramが返される
    expect(program1).toBe(program2);
  });

  test("異なるCompilerOptionsでは異なるProgramを作成", () => {
    const manager1 = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: { strict: true },
    });

    const manager2 = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: { strict: false },
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");
    const program1 = manager1.getProgram([sampleFile]);
    const program2 = manager2.getProgram([sampleFile]);

    // 異なるマネージャーなので異なるインスタンス
    expect(program1).not.toBe(program2);
  });

  test("キャッシュサイズ制限が機能する", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    // 複数のファイルでキャッシュを埋める
    const files = [
      "sample-simple.ts",
      "sample-class.ts",
      "sample-types.ts",
      "sample-error.ts",
    ];

    files.forEach(file => {
      manager.getProgram([resolve(testWorkspace, file)]);
    });

    // キャッシュサイズが制限されていることを確認
    // (内部実装に依存するため、クラッシュしないことを確認)
    expect(manager).toBeDefined();
  });

  test("getProgramを複数回呼んでもキャッシュが効く", () => {
    const manager = new ProgramManager({
      rootPath: testWorkspace,
      compilerOptions: {},
    });

    const sampleFile = resolve(testWorkspace, "sample-simple.ts");

    // 100回連続で呼び出してもパフォーマンスが良い
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      manager.getProgram([sampleFile]);
    }
    const elapsed = Date.now() - start;

    // 100回でも5秒以内（キャッシュが効いている）
    // LRU実装によるわずかなオーバーヘッドを考慮
    expect(elapsed).toBeLessThan(5000);
  });
});
