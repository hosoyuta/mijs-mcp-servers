/**
 * StructureAnalyzer Performance Tests
 * Testing performance requirements and benchmarks
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { StructureAnalyzer } from "../../../src/analyzers/StructureAnalyzer";
import { CompilerHost } from "../../../src/compiler/CompilerHost";
import {
  createSourceFile,
  createEmptySourceFile,
  defaultConfig,
  generateCodeWithLines,
} from "../../helpers/analyzer-test-utils";
import { resolve } from "path";

describe("StructureAnalyzer Performance", () => {
  let compilerHost: CompilerHost;
  let analyzer: StructureAnalyzer;
  const testWorkspace = resolve(process.cwd(), "tests/fixtures");

  beforeEach(() => {
    compilerHost = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });
    analyzer = new StructureAnalyzer(compilerHost, defaultConfig());
  });

  // TC-0201-P-001: Empty file analysis < 10ms
  test("TC-0201-P-001: 空のファイル解析 <10ms", () => {
    const emptySource = createEmptySourceFile();

    const startTime = performance.now();
    const result = analyzer.analyze(emptySource);
    const endTime = performance.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(10);
  });

  // TC-0201-P-002: 100-line file analysis < 50ms
  test("TC-0201-P-002: 100行のファイル解析 <50ms", () => {
    const code = generateCodeWithLines(100);
    const sourceFile = createSourceFile(code);

    const startTime = performance.now();
    const result = analyzer.analyze(sourceFile);
    const endTime = performance.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(50);
  });

  // TC-0201-P-003: 1000-line file analysis < 200ms
  test("TC-0201-P-003: 1000行のファイル解析 <200ms", () => {
    const code = generateCodeWithLines(1000);
    const sourceFile = createSourceFile(code);

    const startTime = performance.now();
    const result = analyzer.analyze(sourceFile);
    const endTime = performance.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(200);
  });

  // TC-0201-P-004: Sequential analysis average time
  test("TC-0201-P-004: 連続解析の平均時間測定", () => {
    const sourceFile = createSourceFile(generateCodeWithLines(100));
    const times: number[] = [];

    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      analyzer.analyze(sourceFile);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    expect(averageTime).toBeLessThan(50);
    expect(maxTime - minTime).toBeLessThan(20); // Stability check
  });

  // TC-0201-P-005: Memory usage measurement
  test("TC-0201-P-005: メモリ使用量測定", () => {
    // Force garbage collection if available (V8 only)
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;

    const sourceFile = createSourceFile(generateCodeWithLines(1000));
    const result = analyzer.analyze(sourceFile);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryDiff = (finalMemory - initialMemory) / 1024 / 1024; // MB

    expect(result.success).toBe(true);
    expect(memoryDiff).toBeLessThan(10); // Less than 10MB
  });
});
