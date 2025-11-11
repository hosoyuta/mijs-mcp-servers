/**
 * StructureAnalyzer Edge Case Tests
 * Testing boundary conditions and special cases
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { StructureAnalyzer } from "../../../src/analyzers/StructureAnalyzer";
import { CompilerHost } from "../../../src/compiler/CompilerHost";
import {
  createSourceFile,
  createEmptySourceFile,
  defaultConfig,
} from "../../helpers/analyzer-test-utils";
import { resolve } from "path";
import * as ts from "typescript";

describe("StructureAnalyzer Edge Cases", () => {
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

  // TC-0201-E-001: Zero-line file
  test("TC-0201-E-001: 0行のファイル", () => {
    const emptySource = createEmptySourceFile();
    const result = analyzer.analyze(emptySource);

    expect(result.success).toBe(true);
    expect(result.functions).toEqual([]);
    expect(result.classes).toEqual([]);
  });

  // TC-0201-E-002: Comment-only file
  test("TC-0201-E-002: コメントのみのファイル", () => {
    const code = `
// Line comment
/* Block comment */
/**
 * JSDoc comment
 */
`;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.functions).toEqual([]);
    expect(result.classes).toEqual([]);
  });

  // TC-0201-E-003: Full-width characters
  test("TC-0201-E-003: 全角文字を含むファイル", () => {
    const code = `
function こんにちは() {
  return "世界";
}

class ユーザー {
  名前: string;
}
`;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.functions[0].name).toBe("こんにちは");
    expect(result.classes[0].name).toBe("ユーザー");
  });

  // TC-0201-E-004: Special syntax (arrow functions, function expressions)
  test("TC-0201-E-004: 特殊な構文 (アロー関数、関数式)", () => {
    const code = `
const arrowFunc = () => {};
const funcExpr = function() {};
const namedFuncExpr = function myFunc() {};
function normalFunc() {}
`;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    // This task only handles function declarations
    // Function expressions will be handled in future tasks
    expect(result.functions.length).toBeGreaterThanOrEqual(1);
  });

  // TC-0201-E-005: JSX syntax
  test("TC-0201-E-005: JSXを含むファイル", () => {
    const code = `
function Component() {
  return <div>Hello</div>;
}
`;
    const sourceFile = createSourceFile(
      code,
      "test.tsx",
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.TSX
    );
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.functions[0].name).toBe("Component");
  });

  // TC-0201-E-006: Decorators
  test("TC-0201-E-006: デコレータを含むファイル", () => {
    const code = `
function decorator(target: any) {}

@decorator
class MyClass {
  @decorator
  prop: string;
}
`;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.classes.some((c) => c.name === "MyClass")).toBe(true);
  });

  // TC-0201-E-007: Generics
  test("TC-0201-E-007: ジェネリクスを含むファイル", () => {
    const code = `
function identity<T>(arg: T): T {
  return arg;
}

class Container<T> {
  value: T;
}
`;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.functions[0].name).toBe("identity");
    expect(result.classes[0].name).toBe("Container");
  });

  // TC-0201-E-008: Very long lines
  test("TC-0201-E-008: 非常に長い行を含むファイル", () => {
    const longLine = "a".repeat(10000);
    const code = `function test() { const x = "${longLine}"; }`;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.functions[0].name).toBe("test");
  });

  // TC-0201-E-009: Special character encoding (emoji)
  test("TC-0201-E-009: 特殊な文字エンコーディング", () => {
    const code = `
function 🚀rocket() {
  return "🌟";
}
`;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.functions[0].name).toBe("🚀rocket");
  });

  // TC-0201-E-010: Unexpected node type handling
  test("TC-0201-E-010: 不正なノードタイプのハンドリング", () => {
    // Create a file with complex syntax that might have unexpected nodes
    const code = `
export default function() {
  return "anonymous";
}

export = function() {
  return "export equals";
};
`;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    // Should not throw, should handle gracefully
    expect(result.success).toBeDefined(); // true or false
    // No exception should be thrown
  });
});
