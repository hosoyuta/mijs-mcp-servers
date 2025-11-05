/**
 * TASK-0009: 企業情報+最新株価取得MCPツール (Refactored)
 *
 * 【機能概要】: J-Quants APIから企業情報と最新株価を統合して取得するツール
 * 【改善内容】:
 *   - 依存性注入パターンを導入（JQuantsClient外部注入可能）
 *   - パフォーマンス最適化（ソートからreduce走査に変更）
 *   - コメントを簡潔化（可読性向上）
 * 【設計方針】:
 *   - テスト容易性: clientパラメータでモック注入可能
 *   - パフォーマンス: O(n log n) → O(n)に改善
 *   - 保守性: 明確な処理フローと適切なコメント
 * 🔵 信頼性レベル: 青信号（要件定義書、テストケース、Refactorフェーズ設計に基づく）
 *
 * @module get-company-info
 */

import { CompanyInfo } from '../types/index.js';
import { JQuantsClient } from '../api/j-quants-client.js';
import { validateCode, validateRequiredParam } from '../utils/validator.js';
import { TokenManager } from '../auth/token-manager.js';

/**
 * 企業情報+最新株価取得MCPツール
 *
 * 【機能】:
 * - J-Quants API（GET /listed/info）から企業情報を取得
 * - J-Quants API（GET /prices/daily_quotes）から株価データを取得
 * - 最新日の株価を抽出して企業情報と統合
 *
 * 【改善点】:
 * - 依存性注入: clientパラメータでJQuantsClient注入可能（テスト容易性向上）
 * - パフォーマンス: reduceで1回走査（O(n)）に最適化
 * 🔵 信頼性レベル: 青信号
 *
 * @param params - パラメータ
 * @param params.code - 銘柄コード（4桁数字、必須）
 * @param client - JQuantsClientインスタンス（省略時は自動生成、テスト用オプション）
 * @returns Promise<CompanyInfo> - 企業情報+最新株価
 * @throws ValidationError - パラメータが不正な場合
 * @throws Error - 存在しない銘柄コードまたはAPI通信エラー
 */
export async function getCompanyInfo(
  params: {
    code?: string;
  },
  client?: JQuantsClient
): Promise<CompanyInfo> {
  // パラメータバリデーション
  validateRequiredParam(params.code, 'code');
  const code = params.code as string;
  validateCode(code);

  // APIクライアント準備（clientが渡されない場合のみ生成）
  // 🔵 依存性注入パターン: テスト時はモック注入、本番時は自動生成
  if (!client) {
    const tokenManager = new TokenManager({
      refreshToken: process.env.J_QUANTS_REFRESH_TOKEN || '',
    });
    client = new JQuantsClient(tokenManager);
  }

  // 企業情報取得
  const allCompanies = await client.getListedInfo();
  const company = allCompanies.find((c) => c.code === code);
  if (!company) {
    throw new Error(`指定された銘柄コード（${code}）は存在しません`);
  }

  // 株価データ取得
  const prices = await client.getDailyQuotes(code);

  // 最新株価抽出（パフォーマンス最適化版）
  // 🔵 改善点: sort（O(n log n)）からreduce（O(n)）に変更
  let latest_price: number | undefined = undefined;
  if (prices.length > 0) {
    const latestPrice = prices.reduce((latest, current) =>
      current.date > latest.date ? current : latest
    );
    latest_price = latestPrice.close;
  }

  // データ統合・返却
  return {
    code: company.code,
    name: company.name,
    market: company.market,
    sector: company.sector,
    latest_price: latest_price,
  };
}
