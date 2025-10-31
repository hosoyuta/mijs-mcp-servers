/**
 * TASK-0006: 上場銘柄一覧取得MCPツール (Refactored)
 *
 * 【機能概要】: J-Quants APIから上場銘柄一覧を取得し、market/sectorでフィルタリングするツール
 * 【改善内容】:
 *   - 依存性注入パターンを導入（JQuantsClient外部注入可能）
 *   - フィルタリング処理を1回の走査に統合（パフォーマンス改善）
 *   - コメントを簡潔化（可読性向上）
 * 【設計方針】:
 *   - テスト容易性: clientパラメータでモック注入可能
 *   - パフォーマンス: 配列走査を最小化
 *   - 保守性: 明確な処理フローと適切なコメント
 * 🔵 信頼性レベル: 青信号（要件定義書、テストケース、Refactorフェーズ設計に基づく）
 *
 * @module get-listed-companies
 */

import { Company, Market, Sector } from '../types/index.js';
import { JQuantsClient } from '../api/j-quants-client.js';
import { validateEnum } from '../utils/validator.js';
import { TokenManager } from '../auth/token-manager.js';

/**
 * 上場銘柄一覧取得MCPツール
 *
 * 【機能】:
 * - J-Quants API（GET /listed/info）から全上場銘柄を取得
 * - market（市場区分）、sector（業種コード）でフィルタリング
 * - 両パラメータ指定時はAND条件適用
 *
 * 【改善点】:
 * - 依存性注入: clientパラメータでJQuantsClient注入可能（テスト容易性向上）
 * - 統合フィルタ: 1回の配列走査で両条件を評価（パフォーマンス改善）
 * 🔵 信頼性レベル: 青信号
 *
 * @param params - フィルタパラメータ
 * @param params.market - 市場区分フィルタ（'Prime' | 'Standard' | 'Growth' | 'Other'）
 * @param params.sector - 業種コードフィルタ（'0050'～'9050'）
 * @param client - JQuantsClientインスタンス（省略時は自動生成、テスト用オプション）
 * @returns Promise<{ companies: Company[] }> - フィルタリング済み銘柄一覧
 * @throws ValidationError - market/sector値が不正な場合
 * @throws Error - API通信エラー
 */
export async function getListedCompanies(
  params: {
    market?: string;
    sector?: string;
    limit?: number;
    offset?: number;
  },
  client?: JQuantsClient
): Promise<{ companies: Company[]; total: number; returned: number }> {
  // 【入力値バリデーション】: パラメータの妥当性を検証
  // 🔵 validateEnum()を使用した型安全なバリデーション
  if (params.market !== undefined) {
    validateEnum(params.market, Market, 'market');
  }
  if (params.sector !== undefined) {
    validateEnum(params.sector, Sector, 'sector');
  }
  // 【limit上限チェック】: レスポンスサイズ制限のため100件まで
  if (params.limit !== undefined && params.limit > 100) {
    throw new Error('limitは100以下を指定してください。レスポンスサイズの制限により100件までとなります。');
  }

  // 【APIクライアント準備】: clientが渡されない場合のみ生成
  // 🔵 依存性注入パターン: テスト時はモック注入、本番時は自動生成
  if (!client) {
    const tokenManager = new TokenManager({
      refreshToken: process.env.J_QUANTS_REFRESH_TOKEN || '',
    });
    client = new JQuantsClient(tokenManager);
  }

  // 【全銘柄取得】: J-Quants APIから上場銘柄一覧を取得
  // 🔵 JQuantsClient.getListedInfo()による取得
  const allCompanies = await client.getListedInfo();

  // 【統合フィルタリング】: market/sector条件を1回の走査で評価
  // 【パフォーマンス改善】: 従来の2回filter → 1回filterに統合
  // 🔵 AND条件: 両パラメータ指定時は両方の条件を満たす銘柄のみ抽出
  const filteredCompanies = allCompanies.filter((company) => {
    // 【market条件】: 指定されている場合のみ評価
    const matchesMarket =
      params.market === undefined || company.market === params.market;
    // 【sector条件】: 指定されている場合のみ評価
    const matchesSector =
      params.sector === undefined || company.sector === params.sector;
    // 【AND条件】: 両条件を満たす銘柄のみ通過
    return matchesMarket && matchesSector;
  });

  // 【ページネーション】: offset/limitによるページング処理
  // 【理由】: MCPプロトコルのレスポンスサイズ制限を考慮
  const offset = params.offset !== undefined ? params.offset : 0;
  const limit = params.limit !== undefined ? params.limit : 100;
  const total = filteredCompanies.length;
  const limitedCompanies = filteredCompanies.slice(offset, offset + limit);

  // 【結果返却】: 要求フォーマットで返却
  // 🔵 MCP仕様準拠: { companies: Company[], total: number, returned: number } 形式
  return {
    companies: limitedCompanies,
    total,
    returned: limitedCompanies.length,
  };
}
