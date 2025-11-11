/**
 * Test utility functions for Analyzer tests
 */

import * as ts from "typescript";
import { AnalyzerConfig } from "../../src/types/analyzer";

/**
 * SourceFileを作成するヘルパー
 * @param code - TypeScript/JavaScriptコード
 * @param fileName - ファイル名 (デフォルト: "test.ts")
 * @param target - コンパイルターゲット (デフォルト: ES2022)
 * @param setParentNodes - 親ノードを設定するか (デフォルト: true)
 * @param scriptKind - スクリプト種別 (デフォルト: TS)
 * @returns TypeScript SourceFile
 */
export function createSourceFile(
  code: string,
  fileName: string = "test.ts",
  target: ts.ScriptTarget = ts.ScriptTarget.ES2022,
  setParentNodes: boolean = true,
  scriptKind?: ts.ScriptKind
): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    code,
    target,
    setParentNodes,
    scriptKind
  );
}

/**
 * 指定行数のコードを生成
 * テストやパフォーマンス測定用に、指定された行数のコードを生成する
 *
 * @param lineCount - 生成する行数
 * @returns 生成されたTypeScriptコード
 */
export function generateCodeWithLines(lineCount: number): string {
  const lines: string[] = [];
  for (let i = 0; i < lineCount; i++) {
    if (i % 10 === 0) {
      // 10行ごとに関数を生成
      lines.push(`function func${i}() { return ${i}; }`);
    } else {
      // それ以外はコメント
      lines.push(`// Comment line ${i}`);
    }
  }
  return lines.join("\n");
}

/**
 * デフォルトのAnalyzerConfig
 * テストで使用するデフォルト設定
 *
 * @returns デフォルトのAnalyzerConfig
 */
export function defaultConfig(): AnalyzerConfig {
  return {
    detailedMode: false,
    timeout: 5000,
    errorHandling: "partial",
  };
}

/**
 * 空のSourceFileを作成
 * @param fileName - ファイル名 (デフォルト: "empty.ts")
 * @returns 空のSourceFile
 */
export function createEmptySourceFile(fileName: string = "empty.ts"): ts.SourceFile {
  return createSourceFile("", fileName);
}

/**
 * 単純な関数を含むSourceFileを作成
 * @param functionName - 関数名 (デフォルト: "testFunction")
 * @param exported - エクスポートするか (デフォルト: false)
 * @returns 関数を含むSourceFile
 */
export function createSimpleFunctionSourceFile(
  functionName: string = "testFunction",
  exported: boolean = false
): ts.SourceFile {
  const exportKeyword = exported ? "export " : "";
  const code = `${exportKeyword}function ${functionName}() {\n  return "test";\n}`;
  return createSourceFile(code);
}

/**
 * 単純なクラスを含むSourceFileを作成
 * @param className - クラス名 (デフォルト: "TestClass")
 * @param exported - エクスポートするか (デフォルト: false)
 * @returns クラスを含むSourceFile
 */
export function createSimpleClassSourceFile(
  className: string = "TestClass",
  exported: boolean = false
): ts.SourceFile {
  const exportKeyword = exported ? "export " : "";
  const code = `${exportKeyword}class ${className} {\n  prop: string;\n}`;
  return createSourceFile(code);
}
