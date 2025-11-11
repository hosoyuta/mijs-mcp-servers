/**
 * StructureAnalyzer Unit Tests
 * TDD Red Phase: Failing tests that define the required implementation
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { StructureAnalyzer } from "../../../src/analyzers/StructureAnalyzer";
import { CompilerHost } from "../../../src/compiler/CompilerHost";
import {
  createSourceFile,
  createEmptySourceFile,
  createSimpleFunctionSourceFile,
  createSimpleClassSourceFile,
  defaultConfig,
  generateCodeWithLines,
} from "../../helpers/analyzer-test-utils";
import { resolve } from "path";

describe("StructureAnalyzer", () => {
  let compilerHost: CompilerHost;
  const testWorkspace = resolve(process.cwd(), "tests/fixtures");

  beforeEach(() => {
    compilerHost = new CompilerHost({
      rootPath: testWorkspace,
      compilerOptions: {},
    });
  });

  // ============================================================
  // Category 1: Initialization and Instantiation (3 test cases)
  // ============================================================
  describe("Initialization", () => {
    // TC-0201-U-001: Basic instantiation
    test("TC-0201-U-001: CompilerHostを渡してインスタンス化できる", () => {
      const analyzer = new StructureAnalyzer(compilerHost, defaultConfig());

      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(StructureAnalyzer);
    });

    // TC-0201-U-002: Custom configuration
    test("TC-0201-U-002: カスタム設定でインスタンス化できる", () => {
      const customConfig = {
        detailedMode: true,
        timeout: 10000,
        errorHandling: "throw" as const,
      };

      const startTime = performance.now();
      const analyzer = new StructureAnalyzer(compilerHost, customConfig);
      const endTime = performance.now();

      expect(analyzer).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1); // Initialization should be fast
    });

    // TC-0201-U-003: Error handling for null input
    test("TC-0201-U-003: nullを渡すとエラーが発生する", () => {
      expect(() => {
        // @ts-expect-error - Testing runtime error handling
        new StructureAnalyzer(null, defaultConfig());
      }).toThrow("CompilerHost is required");
    });
  });

  // ============================================================
  // Category 2: analyze() Method Basic Operations (5 test cases)
  // ============================================================
  describe("analyze() Method", () => {
    let analyzer: StructureAnalyzer;

    beforeEach(() => {
      analyzer = new StructureAnalyzer(compilerHost, defaultConfig());
    });

    // TC-0201-U-004: Empty SourceFile
    test("TC-0201-U-004: 空のSourceFileで正常終了", () => {
      const emptySource = createEmptySourceFile();
      const result = analyzer.analyze(emptySource);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.filePath).toBe("empty.ts");
      expect(result.functions).toEqual([]);
      expect(result.classes).toEqual([]);
      expect(result.errors).toBeUndefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    // TC-0201-U-005: Simple function analysis
    test("TC-0201-U-005: 単純な関数を含むファイルを解析できる", () => {
      const code = `
export function hello() {
  console.log("Hello");
}
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.success).toBe(true);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe("hello");
      expect(result.functions[0].exported).toBe(true);
      expect(result.functions[0].location.start.line).toBe(2);
    });

    // TC-0201-U-006: Class analysis
    test("TC-0201-U-006: クラスを含むファイルを解析できる", () => {
      const code = `
class User {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.success).toBe(true);
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe("User");
      expect(result.classes[0].exported).toBe(false);
      expect(result.classes[0].location.start.line).toBe(2);
    });

    // TC-0201-U-007: Syntax error handling
    test("TC-0201-U-007: 構文エラーのあるファイルでも部分成功する", () => {
      const code = `
function hello() {
  console.log("Hello"
} // Missing closing parenthesis
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors![0].severity).toBe("error");
      expect(result.errors![0].message).toBeDefined();
    });

    // TC-0201-U-008: Multiple elements analysis
    test("TC-0201-U-008: 複数の関数とクラスを含むファイルを解析できる", () => {
      const code = `
function foo() {}
function bar() {}
class MyClass {}
class AnotherClass {}
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.success).toBe(true);
      expect(result.functions).toHaveLength(2);
      expect(result.classes).toHaveLength(2);
      expect(result.functions.map((f) => f.name)).toEqual(["foo", "bar"]);
      expect(result.classes.map((c) => c.name)).toEqual([
        "MyClass",
        "AnotherClass",
      ]);
    });
  });

  // ============================================================
  // Category 3: AST Traversal Foundation (4 test cases)
  // ============================================================
  describe("AST Traversal", () => {
    let analyzer: StructureAnalyzer;

    beforeEach(() => {
      analyzer = new StructureAnalyzer(compilerHost, defaultConfig());
    });

    // TC-0201-U-009: Basic AST traversal
    test("TC-0201-U-009: 基本的なAST走査が動作する", () => {
      const code = `
function hello() {
  return "world";
}
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe("hello");
    });

    // TC-0201-U-010: Nested structure traversal
    test("TC-0201-U-010: ネストされた構造を正しく走査できる", () => {
      const code = `
class MyClass {
  method1() {}
  method2() {}
}
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe("MyClass");
      // Nested methods will be extracted in later tasks
    });

    // TC-0201-U-011: Deep nesting traversal
    test("TC-0201-U-011: 深い階層のネスト構造を走査できる", () => {
      const code = `
function level1() {
  function level2() {
    function level3() {
      function level4() {
        function level5() {
          return "deep";
        }
      }
    }
  }
}
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.success).toBe(true);
      expect(result.functions.length).toBeGreaterThanOrEqual(1);
    });

    // TC-0201-U-012: Empty AST traversal
    test("TC-0201-U-012: 空のASTを走査してもエラーが発生しない", () => {
      const emptySource = createEmptySourceFile();
      const result = analyzer.analyze(emptySource);

      expect(result.success).toBe(true);
      expect(result.functions).toEqual([]);
      expect(result.classes).toEqual([]);
    });
  });

  // ============================================================
  // Category 4: Result Aggregation (3 test cases)
  // ============================================================
  describe("Result Aggregation", () => {
    let analyzer: StructureAnalyzer;

    beforeEach(() => {
      analyzer = new StructureAnalyzer(compilerHost, defaultConfig());
    });

    // TC-0201-U-013: Multiple elements aggregation
    test("TC-0201-U-013: 複数要素を正しく集約できる", () => {
      const code = `
function first() {}
class Second {}
function third() {}
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.functions).toHaveLength(2);
      expect(result.classes).toHaveLength(1);
      expect(result.functions[0].name).toBe("first");
      expect(result.functions[1].name).toBe("third");
    });

    // TC-0201-U-014: Error information aggregation
    test("TC-0201-U-014: エラー情報を含めて集約できる", () => {
      const code = `function broken() { // Incomplete function`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors![0].code).toBeDefined();
      expect(result.errors![0].message).toBeDefined();
      expect(result.errors![0].severity).toBe("error");
    });

    // TC-0201-U-015: Empty aggregation
    test("TC-0201-U-015: 要素が0個でも正しく集約できる", () => {
      const code = `
// This is a comment
/* Multi-line
   comment */
`;
      const sourceFile = createSourceFile(code);
      const result = analyzer.analyze(sourceFile);

      expect(result.success).toBe(true);
      expect(result.functions).toEqual([]);
      expect(result.classes).toEqual([]);
      expect(result.filePath).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Category 5: Location Information (5 test cases)
  // ============================================================
  describe("Location Information", () => {
    let analyzer: StructureAnalyzer;

    beforeEach(() => {
      analyzer = new StructureAnalyzer(compilerHost, defaultConfig());
    });

    // TC-0201-U-016: Function location
    test("TC-0201-U-016: 関数の位置情報を正確に取得できる", () => {
      const code = `
function hello() {
  return "world";
}
`;
      const sourceFile = createSourceFile(code, "test.ts");
      const result = analyzer.analyze(sourceFile);

      expect(result.functions[0].location.file).toBe("test.ts");
      expect(result.functions[0].location.start.line).toBe(2);
      expect(result.functions[0].location.start.column).toBeGreaterThan(0);
      expect(result.functions[0].location.end.line).toBeGreaterThan(2);
    });

    // TC-0201-U-017: Class location
    test("TC-0201-U-017: クラスの位置情報を正確に取得できる", () => {
      const code = `
class MyClass {
  prop1: string;
  prop2: number;
}
`;
      const sourceFile = createSourceFile(code, "test.ts");
      const result = analyzer.analyze(sourceFile);

      expect(result.classes[0].location.start.line).toBe(2);
      expect(result.classes[0].location.end.line).toBe(5);
    });

    // TC-0201-U-018: File start location (line 1, column 1)
    test("TC-0201-U-018: ファイルの先頭（1行1列）を正しく取得できる", () => {
      const code = `function first() {}`;
      const sourceFile = createSourceFile(code, "test.ts");
      const result = analyzer.analyze(sourceFile);

      expect(result.functions[0].location.start.line).toBe(1);
      expect(result.functions[0].location.start.column).toBe(1);
    });

    // TC-0201-U-019: File end location
    test("TC-0201-U-019: ファイルの末尾を正しく取得できる", () => {
      const code = `function last() {\n  return "end";\n}`;
      const sourceFile = createSourceFile(code, "test.ts");
      const result = analyzer.analyze(sourceFile);

      const func = result.functions[0];
      expect(func.location.end.line).toBe(3);
      expect(func.location.end.column).toBeGreaterThan(0);
    });

    // TC-0201-U-020: Offset information
    test("TC-0201-U-020: オフセット情報が正しく記録される", () => {
      const code = `function test() {}`;
      const sourceFile = createSourceFile(code, "test.ts");
      const result = analyzer.analyze(sourceFile);

      expect(result.functions[0].location.start.offset).toBe(0);
      expect(result.functions[0].location.end.offset).toBeGreaterThan(0);
    });
  });
});
