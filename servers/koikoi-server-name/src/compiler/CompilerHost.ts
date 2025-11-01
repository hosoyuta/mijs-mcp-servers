/**
 * CompilerHost - TypeScript Compiler Host
 * TypeScript Programの作成と管理
 */

import * as ts from "typescript";
import { CompilerConfig } from "../types/compiler";
import { CompilerError } from "../utils/errors";

/**
 * TypeScript Compiler Host
 * TypeScript Programの作成と管理を行うクラス
 */
export class CompilerHost {
  private readonly config: CompilerConfig;
  private readonly defaultCompilerOptions: ts.CompilerOptions;

  /**
   * CompilerHostを構築
   * @param config - Compiler設定
   */
  constructor(config: CompilerConfig) {
    this.config = config;
    this.defaultCompilerOptions = this.getDefaultCompilerOptions();
  }

  /**
   * TypeScript Programを作成
   * @param fileNames - 解析するファイル一覧
   * @returns ts.Program
   * @throws CompilerError - Program作成に失敗した場合
   */
  createProgram(fileNames: string[]): ts.Program {
    try {
      const compilerOptions: ts.CompilerOptions = {
        ...this.defaultCompilerOptions,
        ...this.config.compilerOptions,
      };

      const program = ts.createProgram({
        rootNames: fileNames,
        options: compilerOptions,
      });

      return program;
    } catch (error) {
      throw new CompilerError(
        `Failed to create TypeScript Program: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * デフォルトのCompilerOptionsを取得
   * パフォーマンス最適化のため、必要最小限のオプションを設定
   * @returns デフォルトのCompilerOptions
   */
  private getDefaultCompilerOptions(): ts.CompilerOptions {
    return {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true, // パフォーマンス最適化
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      jsx: ts.JsxEmit.React, // TSX対応
      allowJs: true, // JavaScript対応
      noEmit: true, // 出力不要 (解析のみ)
    };
  }

  /**
   * Compiler diagnosticsを取得
   * @param program - TypeScript Program
   * @returns 構文エラー・意味エラーの診断結果
   */
  getDiagnostics(program: ts.Program): ts.Diagnostic[] {
    const diagnostics = [
      ...program.getSyntacticDiagnostics(),
      ...program.getSemanticDiagnostics(),
    ];
    return diagnostics;
  }
}

export default CompilerHost;
