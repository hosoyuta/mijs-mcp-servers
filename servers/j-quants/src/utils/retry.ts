/**
 * TASK-0005: リトライユーティリティ実装
 *
 * 【モジュール概要】: リトライロジックを提供するユーティリティモジュール
 * 【実装方針】: テストケースを通すための最小限の実装
 * 【対応テストケース】: TC-NORMAL-011～013, TC-ERROR-007
 * 【作成日】: 2025-10-29
 */

/**
 * 遅延関数
 *
 * 【機能概要】: 指定ミリ秒待機してPromiseをresolve
 * 【実装方針】: Promise + setTimeoutによる非同期待機
 * 【テスト対応】: TC-NORMAL-011で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のsleep()仕様から確定）
 *
 * @param ms - 待機時間（ミリ秒）
 * @returns 指定時間後にresolveされるPromise
 */
export function sleep(ms: number): Promise<void> {
  // 【非同期待機】: PromiseでラップしたsetTimeoutで指定時間待機 🔵
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff 遅延時間計算関数
 *
 * 【機能概要】: リトライ試行回数に基づいて指数バックオフの遅延時間を計算
 * 【実装方針】: baseDelay * (2 ^ attempt) の計算式
 * 【改善内容】: 入力値検証を追加し、不正な値への対応を強化 🔵
 * 【計算例】:
 *   - attempt 0 → 1000ms (1秒)
 *   - attempt 1 → 2000ms (2秒)
 *   - attempt 2 → 4000ms (4秒)
 * 【テスト対応】: TC-NORMAL-012で使用
 * 🔵 信頼性レベル: 青信号（要件定義書の計算式から確定）
 *
 * @param attempt - リトライ試行回数（0から開始、0以上の整数）
 * @param baseDelay - 基本遅延時間（デフォルト: 1000ms、正の数）
 * @returns 計算された遅延時間（ミリ秒）
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  // 【入力値検証】: attemptが負の値の場合は0として扱う 🔵
  // 【堅牢性向上】: 不正な入力に対する防御的プログラミング
  const validAttempt = Math.max(0, attempt);

  // 【入力値検証】: baseDelayが0以下の場合はデフォルト値を使用 🔵
  const validBaseDelay = baseDelay > 0 ? baseDelay : 1000;

  // 【Exponential backoff計算】: baseDelay * (2 ^ attempt) 🔵
  return validBaseDelay * Math.pow(2, validAttempt);
}

/**
 * リトライ可能リクエスト実行関数
 *
 * 【機能概要】: 非同期関数を最大maxRetries回まで試行
 * 【実装方針】:
 *   - 成功時は即座に結果を返却
 *   - 失敗時はExponential backoffで遅延後、再試行
 *   - maxRetries回失敗したら最後のエラーをスロー
 * 【テスト対応】: TC-NORMAL-013, TC-ERROR-007で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のretryableRequest()仕様から確定）
 *
 * @param fn - リトライ対象の非同期関数
 * @param maxRetries - 最大リトライ回数（デフォルト: 3）
 * @returns 関数の実行結果
 * @throws 最大リトライ回数に達した場合に最後のエラーをスロー
 */
export async function retryableRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;

  // 【リトライループ】: maxRetries回まで試行 🔵
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 【関数実行】: fnを実行して結果を取得 🔵
      const result = await fn();

      // 【成功時の即時返却】: 成功した場合は結果を返却 🔵
      return result;
    } catch (error) {
      // 【エラー記録】: 最後のエラーを記録
      lastError = error;

      // 【最終試行判定】: 最後の試行でない場合は遅延後に再試行 🔵
      if (attempt < maxRetries - 1) {
        // 【遅延時間計算】: Exponential backoffで遅延時間を計算
        const delay = calculateBackoffDelay(attempt);

        // 【待機】: 計算された遅延時間だけ待機
        await sleep(delay);
      }
    }
  }

  // 【最大リトライ超過】: maxRetries回失敗した場合は最後のエラーをスロー 🔵
  throw lastError;
}
