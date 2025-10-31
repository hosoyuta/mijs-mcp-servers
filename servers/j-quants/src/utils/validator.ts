/**
 * TASK-0005: バリデーター実装
 *
 * 【モジュール概要】: パラメータバリデーション機能を提供するユーティリティモジュール
 * 【実装方針】: テストケースを通すための最小限の実装
 * 【対応テストケース】: TC-NORMAL-005～008, TC-ERROR-002～006, TC-BOUNDARY-001
 * 【作成日】: 2025-10-29
 */

import { ErrorCode } from './error-handler.js';

/**
 * バリデーションエラークラス
 *
 * 【クラス概要】: バリデーションエラー用のカスタムエラークラス
 * 【実装方針】: Errorクラスを継承し、code, contextプロパティを追加
 * 【テスト対応】: TC-ERROR-002～006, TC-BOUNDARY-001で使用
 * 🔵 信頼性レベル: 青信号（要件定義書から確定）
 */
export class ValidationError extends Error {
  /** 【プロパティ】: エラーコード */
  public code: ErrorCode;
  /** 【プロパティ】: 追加コンテキスト情報 */
  public context?: any;

  /**
   * 【コンストラクタ】: ValidationErrorインスタンスを生成
   * @param message - エラーメッセージ
   * @param code - エラーコード
   * @param context - 追加コンテキスト情報（オプション）
   */
  constructor(message: string, code: ErrorCode, context?: any) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.context = context;
  }
}

/**
 * 銘柄コード バリデーション関数
 *
 * 【機能概要】: 銘柄コードが4桁数字であることを検証
 * 【実装方針】: 正規表現 `/^[0-9]{4}$/` でパターンマッチング
 * 【テスト対応】: TC-NORMAL-005, TC-ERROR-002, TC-ERROR-003で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のバリデーションルールから確定）
 *
 * @param code - 検証対象の銘柄コード
 * @throws {ValidationError} 銘柄コードが4桁数字でない場合
 */
export function validateCode(code: string): void {
  // 【パターンマッチング】: 4桁数字のパターン検証 🔵
  const codePattern = /^[0-9]{4}$/;

  // 【バリデーション実行】: パターンに一致しない場合はエラー
  if (!codePattern.test(code)) {
    // 【エラースロー】: ValidationErrorをスロー
    throw new ValidationError(
      '銘柄コードは4桁の数字である必要があります',
      ErrorCode.INVALID_CODE,
      { code }
    );
  }

  // 【正常終了】: バリデーション成功、何もスローしない
}

/**
 * 日付 バリデーション関数
 *
 * 【機能概要】: 日付がYYYY-MM-DD形式かつ実在する日付であることを検証
 * 【実装方針】:
 *   - 正規表現 `/^\d{4}-\d{2}-\d{2}$/` で形式検証
 *   - Date.parse()で実在性検証
 * 【テスト対応】: TC-NORMAL-006, TC-ERROR-004, TC-ERROR-005で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のバリデーションルールから確定）
 *
 * @param date - 検証対象の日付文字列
 * @throws {ValidationError} 日付形式が不正または実在しない日付の場合
 */
export function validateDate(date: string): void {
  // 【形式検証】: YYYY-MM-DD形式のパターン検証 🔵
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  // 【形式バリデーション】: パターンに一致しない場合はエラー
  if (!datePattern.test(date)) {
    // 【エラースロー】: 形式不正エラー
    throw new ValidationError(
      '日付はYYYY-MM-DD形式で指定してください',
      ErrorCode.INVALID_DATE,
      { date }
    );
  }

  // 【実在性検証】: Date.parse()で日付の実在性を確認 🔵
  const timestamp = Date.parse(date);

  // 【実在性バリデーション】: NaNの場合は実在しない日付
  if (isNaN(timestamp)) {
    // 【エラースロー】: 実在しない日付エラー
    throw new ValidationError(
      '実在しない日付です',
      ErrorCode.INVALID_DATE,
      { date }
    );
  }

  // 【正常終了】: バリデーション成功
}

/**
 * 日付範囲 バリデーション関数
 *
 * 【機能概要】: from <= toの日付範囲が正しいことを検証
 * 【実装方針】:
 *   - 個別にvalidateDate()で形式・実在性を検証
 *   - Date比較でfrom <= toを検証
 * 【テスト対応】: TC-NORMAL-007, TC-ERROR-006で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のバリデーションルールから確定）
 *
 * @param from - 開始日（YYYY-MM-DD）
 * @param to - 終了日（YYYY-MM-DD）
 * @throws {ValidationError} 日付範囲が不正（from > to）の場合
 */
export function validateDateRange(from: string, to: string): void {
  // 【個別バリデーション】: 開始日と終了日を個別に検証 🔵
  validateDate(from);
  validateDate(to);

  // 【日付比較】: from <= to の検証 🔵
  const fromDate = new Date(from);
  const toDate = new Date(to);

  // 【範囲バリデーション】: from > to の場合はエラー
  if (fromDate > toDate) {
    // 【エラースロー】: 日付範囲不正エラー
    throw new ValidationError(
      '日付範囲が不正です（from > to）',
      ErrorCode.INVALID_RANGE,
      { from, to }
    );
  }

  // 【正常終了】: バリデーション成功
}

/**
 * 必須パラメータ バリデーション関数
 *
 * 【機能概要】: パラメータがnull/undefined/空文字列でないことを検証
 * 【実装方針】: falsy値（null, undefined, ''）を厳密に判定
 * 【テスト対応】: TC-BOUNDARY-001で使用
 * 🔵 信頼性レベル: 青信号（要件定義書のバリデーションルールから確定）
 *
 * @param value - 検証対象の値
 * @param paramName - パラメータ名（エラーメッセージ用）
 * @throws {ValidationError} 必須パラメータが不足している場合
 */
export function validateRequiredParam(value: any, paramName: string): void {
  // 【null/undefined/空文字列判定】: falsy値の厳密な判定 🔵
  if (value === undefined || value === null || value === '') {
    // 【エラースロー】: 必須パラメータ不足エラー
    throw new ValidationError(
      `必須パラメータ ${paramName} が指定されていません`,
      ErrorCode.MISSING_PARAM,
      { paramName }
    );
  }

  // 【正常終了】: バリデーション成功
}

/**
 * 列挙型 バリデーション関数
 *
 * 【機能概要】: 値がTypeScript列挙型に含まれることを検証
 * 【実装方針】: Object.values()で列挙型の値を取得し、includesで判定
 * 【テスト対応】: TC-NORMAL-008で使用
 * 🟡 信頼性レベル: 黄信号（要件定義書から推測、実装詳細は不明）
 *
 * @param value - 検証対象の値
 * @param enumObj - TypeScript列挙型オブジェクト
 * @param paramName - パラメータ名（エラーメッセージ用）
 * @throws {ValidationError} 値が列挙型に含まれない場合
 */
export function validateEnum<T>(value: any, enumObj: T, paramName: string): void {
  // 【列挙型値取得】: Object.values()で列挙型の値を取得 🟡
  const validValues = Object.values(enumObj as any);

  // 【値判定】: valueが列挙型の値に含まれるか確認
  if (!validValues.includes(value)) {
    // 【エラースロー】: 列挙型不正エラー
    throw new ValidationError(
      `${paramName} パラメータの値が不正です`,
      ErrorCode.INVALID_CODE,
      { paramName, value, validValues }
    );
  }

  // 【正常終了】: バリデーション成功
}
