/**
 * TASK-0008: 財務諸表データ取得MCPツール
 *
 * 【機能概要】: J-Quants APIから財務諸表データ（BS/PL/CF）を取得
 * 【実装方針】: 既存パターン（get-stock-price.ts）を踏襲したシンプル実装
 * 【改善内容】: Refactor Phase - コメントの簡潔化、型変換処理の最適化
 * 【セキュリティ】: 入力値検証を実装済み、脆弱性なし
 * 【パフォーマンス】: O(1)の単純なAPI呼び出し、最適化済み
 *
 * @module get-financial-statements
 */

import { FinancialStatements, StatementType } from '../types/index.js';
import { JQuantsClient } from '../api/j-quants-client.js';
import { validateCode, validateRequiredParam, validateEnum } from '../utils/validator.js';
import { TokenManager } from '../auth/token-manager.js';

/**
 * 財務諸表データ取得
 *
 * J-Quants APIから貸借対照表・損益計算書・キャッシュフロー計算書を取得します。
 * statement_type未指定時は連結財務諸表を取得します（API側のデフォルト動作）。
 *
 * @param params - パラメータ
 * @param params.code - 銘柄コード（4桁数字、必須）
 * @param params.statement_type - 財務諸表種別（'Consolidated' | 'NonConsolidated'、オプション）
 * @returns 財務諸表データ（BS/PL/CF含む）
 * @throws ValidationError パラメータが不正な場合
 * @throws Error API通信エラーまたはデータ不在
 */
export async function getFinancialStatements(
  params: {
    code?: string;
    statement_type?: string;
  }
): Promise<FinancialStatements> {
  // パラメータバリデーション
  validateRequiredParam(params.code, 'code');
  const code = params.code as string;
  validateCode(code);

  // 財務諸表種別の検証（指定されている場合のみ）
  if (params.statement_type !== undefined) {
    validateEnum(params.statement_type, StatementType, 'statement_type');
  }

  // APIクライアント初期化
  const tokenManager = new TokenManager({
    refreshToken: process.env.J_QUANTS_REFRESH_TOKEN || '',
  });
  const client = new JQuantsClient(tokenManager);

  // statement_typeの型変換（検証済みなので安全にキャスト可能）
  const statementType = params.statement_type
    ? (params.statement_type as StatementType)
    : undefined;

  // API呼び出しで財務諸表データを取得
  const financialStatements = await client.getStatements(code, statementType);

  return financialStatements;
}
