/**
 * TypeScript Compiler type definitions
 */

import * as ts from "typescript";

/**
 * Compiler設定
 */
export interface CompilerConfig {
  /** TypeScriptコンパイラオプション */
  compilerOptions: ts.CompilerOptions;
  /** プロジェクトルートパス */
  rootPath: string;
}

/**
 * TypeScript Program情報
 */
export interface ProgramInfo {
  /** TypeScript Program インスタンス */
  program: ts.Program;
  /** TypeChecker インスタンス */
  typeChecker: ts.TypeChecker;
  /** ソースファイルのマップ */
  sourceFiles: Map<string, ts.SourceFile>;
}

/**
 * Compilerオプション
 * @deprecated Use CompilerConfig instead
 */
export interface CompilerOptions {
  strict?: boolean;
  target?: string;
  module?: string;
}

/**
 * ソースファイル情報
 * @deprecated Use ProgramInfo.sourceFiles instead
 */
export interface SourceFileInfo {
  fileName: string;
  text: string;
}

/**
 * コンパイル結果
 * @deprecated Use ts.Diagnostic[] directly
 */
export type CompilationResult = {
  success: boolean;
  diagnostics: any[];
};
