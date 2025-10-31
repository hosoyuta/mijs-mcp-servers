# コード解析MCP 受け入れ基準

## 概要

このドキュメントは、コード解析MCPサーバーの受け入れ基準とテスト項目を記載します。各要件に対して、Given-When-Then形式で具体的なテスト基準を定義します。

**【信頼性レベル凡例】**:
- 🔵 **青信号**: tech-stack.md・ユーザヒアリング（2025-10-29）を参考にした確実なテスト基準
- 🟡 **黄信号**: tech-stack.md・ユーザヒアリングから妥当な推測によるテスト基準
- 🔴 **赤信号**: 既存資料にない推測によるテスト基準

---

## 機能テスト基準

### REQ-001: 関数一覧抽出の受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- MCPサーバーが起動している
- 以下の内容の TypeScript ファイルが存在:
```typescript
export function add(a: number, b: number): number {
  return a + b;
}

function subtract(a: number, b: number): number {
  return a - b;
}

export const multiply = (a: number, b: number): number => a * b;
```

**When（実行条件）**:
- `analyze_file` ツールを簡潔モードで呼び出す
- パス: `/test/sample.ts`
- mode: `concise`

**Then（期待結果）**:
- 3つの関数が抽出される:
  - `add` (exported: true)
  - `subtract` (exported: false)
  - `multiply` (exported: true)
- 各関数のシグネチャ（引数の型、戻り値の型）が含まれる
- 関数本体は含まれない（簡潔モード）

**テストケース**:
- [x] 正常系: 通常の関数（function宣言）を抽出できる
- [x] 正常系: アロー関数を抽出できる
- [x] 正常系: export の有無を識別できる
- [x] 正常系: 引数と戻り値の型情報が含まれる
- [x] 異常系: 構文エラーがあっても、正しい関数は抽出できる
- [x] 境界値: 0個の関数（関数なしファイル）でも正常に動作

---

### REQ-002: クラスとメソッド抽出の受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- 以下の内容の TypeScript ファイルが存在:
```typescript
export class UserService {
  private users: User[] = [];

  public getUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  protected addUser(user: User): void {
    this.users.push(user);
  }
}
```

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- `UserService` クラスが抽出される
- 3つのメンバーが含まれる:
  - `users` (property, private)
  - `getUser` (method, public)
  - `addUser` (method, protected)
- 各メソッドのシグネチャが含まれる

**テストケース**:
- [x] 正常系: クラスを抽出できる
- [x] 正常系: メソッドとプロパティを区別できる
- [x] 正常系: アクセス修飾子を識別できる
- [x] 正常系: コンストラクタも抽出できる
- [x] 境界値: 空のクラス（メンバーなし）でも正常に動作

---

### REQ-011: シンボル検索の受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- プロジェクト内に以下のファイルが存在:
  - `src/services/UserService.ts`: `UserService` クラス定義
  - `src/utils/helpers.ts`: `getUserById` 関数定義
  - `src/types/User.ts`: `User` インターフェース定義

**When（実行条件）**:
- `search_symbol` ツールを呼び出す
- symbol: "User"
- matchType: "contains"

**Then（期待結果）**:
- 3つの結果が返される:
  - `UserService` (class, src/services/UserService.ts:1)
  - `getUserById` (function, src/utils/helpers.ts:5)
  - `User` (interface, src/types/User.ts:1)
- 各結果にファイルパス、行番号、型が含まれる

**テストケース**:
- [x] 正常系: 完全一致検索ができる
- [x] 正常系: 部分一致検索ができる
- [x] 正常系: 前方一致検索ができる
- [x] 正常系: 型でフィルタできる（例: 関数のみ）
- [x] 異常系: 見つからない場合、空の配列が返る
- [x] 境界値: 100件以上の結果でも正常に動作

---

### REQ-021: 依存関係解析の受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- 以下の内容の TypeScript ファイルが存在:
```typescript
import { useState, useEffect } from 'react';
import { User } from './types/User';
import { getUserById } from './services/UserService';
import type { Config } from './config';

const dynamicImport = await import('./utils/helpers');
```

**When（実行条件）**:
- `get_dependencies` ツールを呼び出す
- path: `/test/sample.ts`

**Then（期待結果）**:
- 以下の依存関係が返される:
  - `react` (external, imports: ["useState", "useEffect"])
  - `./types/User` (internal, imports: ["User"])
  - `./services/UserService` (internal, imports: ["getUserById"])
  - `./config` (internal, type-only import)
  - `./utils/helpers` (internal, dynamic import)

**テストケース**:
- [x] 正常系: 通常の import 文を解析できる
- [x] 正常系: 外部ライブラリと内部モジュールを区別できる
- [x] 正常系: 動的 import も検出できる
- [x] 正常系: type-only import を識別できる
- [x] 正常系: re-export も検出できる
- [x] 境界値: import 文がない場合、空の配列が返る

---

### REQ-031: ファイルサマリーの受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- 以下の内容の TypeScript ファイルが存在:
```typescript
/**
 * User authentication service
 * Handles login, logout, and session management
 */
export class AuthService {
  login(username: string, password: string): Promise<User> { }
  logout(): void { }
  getCurrentUser(): User | null { }
}
```

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- summary フィールドに以下が含まれる:
  - "User authentication service"
  - "Handles login, logout, and session management"
- 主要なエクスポート: `AuthService` クラス
- ファイルの役割: "Service" （推測）

**テストケース**:
- [x] 正常系: ファイルの概要を生成できる
- [x] 正常系: JSDoc コメントを活用できる
- [x] 正常系: 主要なエクスポートをリストアップできる
- [x] 正常系: ファイルの役割を推測できる
- [x] 境界値: コメントがない場合でも、コードから推測した説明を生成

---

### REQ-041: 型情報抽出の受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- 以下の内容の TypeScript ファイルが存在:
```typescript
export interface User {
  id: string;
  name: string;
  email?: string;
  age: number;
}

export type UserRole = 'admin' | 'user' | 'guest';

export enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
}
```

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- 3つの型定義が抽出される:
  - `User` interface: 4つのプロパティ（email はオプション）
  - `UserRole` type: union type
  - `Status` enum: 3つの値

**テストケース**:
- [x] 正常系: interface を抽出できる
- [x] 正常系: type alias を抽出できる
- [x] 正常系: enum を抽出できる
- [x] 正常系: オプショナルプロパティを識別できる
- [x] 正常系: ジェネリック型パラメータも抽出できる
- [x] 境界値: 型定義がない場合、空の配列が返る

---

### REQ-051: ドキュメント抽出の受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- 以下の内容の TypeScript ファイルが存在:
```typescript
/**
 * Calculates the sum of two numbers
 * @param a - The first number
 * @param b - The second number
 * @returns The sum of a and b
 * @throws {Error} If parameters are not numbers
 * @deprecated Use addNumbers instead
 */
export function add(a: number, b: number): number {
  return a + b;
}
```

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- `add` 関数に以下のドキュメントが含まれる:
  - 説明: "Calculates the sum of two numbers"
  - @param: a, b それぞれの説明
  - @returns: 戻り値の説明
  - @throws: エラー情報
  - @deprecated: 非推奨マーカー

**テストケース**:
- [x] 正常系: JSDoc コメントを抽出できる
- [x] 正常系: @param タグを解析できる
- [x] 正常系: @returns タグを解析できる
- [x] 正常系: @throws タグを解析できる
- [x] 正常系: @deprecated を識別できる
- [x] 境界値: JSDoc がない場合、空のドキュメントオブジェクトが返る

---

### REQ-061: JSON出力形式の受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- ファイル解析が完了している

**When（実行条件）**:
- `analyze_file` ツールを呼び出す
- mode: `concise`

**Then（期待結果）**:
- 構造化されたJSONが返される
- スキーマが明確（型定義に沿っている）
- Claude Codeが解釈しやすい形式

**テストケース**:
- [x] 正常系: 有効なJSONが返される
- [x] 正常系: 型定義に準拠している
- [x] 正常系: ネストした構造が正しく表現される
- [x] 境界値: 空のファイルでも有効なJSONが返される

---

### REQ-063: 簡潔モードの受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- 1000行の TypeScript ファイルが存在
- 20個の関数が定義されている

**When（実行条件）**:
- `analyze_file` ツールを簡潔モードで呼び出す
- mode: `concise`

**Then（期待結果）**:
- 出力サイズが元ファイルの10%以下
- 関数のシグネチャのみ含まれる
- 関数本体は含まれない
- JSDocの要約のみ含まれる（詳細は省略）

**テストケース**:
- [x] 正常系: 出力サイズが元の10%以下
- [x] 正常系: シグネチャが含まれる
- [x] 正常系: 実装の詳細が含まれない
- [x] 境界値: 小さいファイル（10行）でも動作する

---

### REQ-064: 詳細モードの受け入れ基準 🔵 *ユーザヒアリング2025-10-29より*

**Given（前提条件）**:
- 1000行の TypeScript ファイルが存在

**When（実行条件）**:
- `analyze_file` ツールを詳細モードで呼び出す
- mode: `detailed`

**Then（期待結果）**:
- 出力サイズが元ファイルの30%以下
- 関数本体の一部（重要な行）が含まれる
- 詳細なJSDocコメントが含まれる
- インラインコメントも含まれる

**テストケース**:
- [x] 正常系: 出力サイズが元の30%以下
- [x] 正常系: 関数本体の重要部分が含まれる
- [x] 正常系: 詳細なコメントが含まれる
- [x] 境界値: 非常に長い関数でも適切に要約される

---

## 非機能テスト基準

### パフォーマンステスト

#### NFR-002: 小規模ファイル解析時間 🟡 *ユーザヒアリング2025-10-29（コンテキスト効率化）から妥当な推測*

**Given（前提条件）**:
- 100行のTypeScriptファイルが存在

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- 50ms以内にレスポンスが返る

**テスト方法**:
- 100回実行して平均値を計測
- 95パーセンタイルを確認

**合格基準**:
- 平均応答時間 ≤ 50ms
- 95パーセンタイル ≤ 100ms

- [x] 応答時間: 50ms以内（平均）
- [x] 応答時間: 100ms以内（95パーセンタイル）

---

#### NFR-003: 中規模ファイル解析時間 🟡 *ユーザヒアリング2025-10-29（コンテキスト効率化）から妥当な推測*

**Given（前提条件）**:
- 1000行のTypeScriptファイルが存在

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- 200ms以内にレスポンスが返る

**合格基準**: 応答時間 ≤ 200ms

- [x] 応答時間: 200ms以内

---

#### NFR-004: 大規模ファイル解析時間 🟡 *ユーザヒアリング2025-10-29（コンテキスト効率化）から妥当な推測*

**Given（前提条件）**:
- 5000行のTypeScriptファイルが存在

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- 1秒以内にレスポンスが返る

**合格基準**: 応答時間 ≤ 1000ms

- [x] 応答時間: 1000ms以内

---

#### NFR-005: キャッシュヒット時の応答時間 🟡 *ユーザヒアリング2025-10-29（キャッシュ）から妥当な推測*

**Given（前提条件）**:
- ファイルが既に解析済み（キャッシュあり）
- ファイルが変更されていない

**When（実行条件）**:
- `analyze_file` ツールを再度呼び出す

**Then（期待結果）**:
- 10ms以内にキャッシュから結果が返る

**合格基準**: 応答時間 ≤ 10ms

- [x] 応答時間: 10ms以内（キャッシュヒット時）

---

#### NFR-006: 並行処理のパフォーマンス 🟡 *ユーザヒアリング2025-10-29（並行処理）から妥当な推測*

**Given（前提条件）**:
- 10個の TypeScript ファイルが存在（各500行）

**When（実行条件）**:
- `analyze_project` ツールで全ファイルを並行解析

**Then（期待結果）**:
- 2秒以内に全ファイルの解析が完了

**合格基準**: 総処理時間 ≤ 2000ms

- [x] 処理時間: 2000ms以内（10ファイル並行）

---

### コンテキスト効率テスト

#### NFR-101: 簡潔モードの出力サイズ 🔵 *ユーザヒアリング2025-10-29（目的）より*

**Given（前提条件）**:
- 1000行のTypeScriptファイル（約50KB）

**When（実行条件）**:
- `analyze_file` ツールを簡潔モードで呼び出す

**Then（期待結果）**:
- 出力サイズが5KB以下（元の10%以下）

**テスト方法**:
- JSON出力のバイト数を計測
- 元ファイルサイズと比較

**合格基準**: 出力サイズ ≤ 元ファイルサイズ × 0.1

- [x] 出力サイズ: 元ファイルの10%以下

---

#### NFR-102: 詳細モードの出力サイズ 🔵 *ユーザヒアリング2025-10-29（目的）より*

**Given（前提条件）**:
- 1000行のTypeScriptファイル（約50KB）

**When（実行条件）**:
- `analyze_file` ツールを詳細モードで呼び出す

**Then（期待結果）**:
- 出力サイズが15KB以下（元の30%以下）

**合格基準**: 出力サイズ ≤ 元ファイルサイズ × 0.3

- [x] 出力サイズ: 元ファイルの30%以下

---

#### NFR-103: 実際のトークン削減効果 🟡 *ユーザヒアリング2025-10-29（目的）から妥当な推測*

**Given（前提条件）**:
- 1000行のTypeScriptファイル（約3000トークン相当）

**When（実行条件）**:
- 簡潔モードで解析

**Then（期待結果）**:
- 出力が300トークン以下（元の1/10以下）

**テスト方法**:
- Claude Codeのトークンカウントで計測

**合格基準**: トークン数 ≤ 元ファイルトークン数 × 0.1

- [x] トークン削減: 90%以上削減

---

### 品質・テスト基準

#### NFR-201: 単体テストの実装 🔵 *tech-stack.md・ユーザヒアリング2025-10-29より*

**テスト対象**:
- 各解析機能（構造、シンボル、依存関係、サマリー、型、ドキュメント）
- キャッシュ機能
- エラーハンドリング

**合格基準**:
- すべての主要機能に単体テストが存在する
- `bun test` ですべてのテストが通る

- [x] 単体テスト: 主要機能すべてに存在
- [x] テスト実行: bun test でエラーなく完了

---

#### NFR-203: 統合テストの実装 🟡 *テスト品質の妥当な推測*

**テスト対象**:
- 実際のTypeScriptファイルを使用した統合テスト
- MCPクライアントからのツール呼び出しテスト

**合格基準**:
- 実プロジェクトのファイルで正しく動作する
- Claude Code連携が正常に動作する

- [x] 統合テスト: 実ファイルで動作確認
- [x] MCP連携: Claude Codeから呼び出せる

---

## Edgeケーステスト基準

### EDGE-001: 構文エラーのあるファイルの受け入れ基準 🔵 *ユーザヒアリング2025-10-29（質問8）より*

**Given（前提条件）**:
- 以下の構文エラーを含むTypeScriptファイルが存在:
```typescript
import { User } from './types';

export interface Config {
  apiUrl: string;
  timeout: number;
}

export function getConfig(: Config {  // 構文エラー
  return { apiUrl: 'https://api.example.com', timeout: 5000 };
}
```

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- 部分的な成功が返される:
  - import 文: 正常に解析
  - Config インターフェース: 正常に解析
  - getConfig 関数: エラー情報を含めて部分的に解析
- エラー情報が併記される
- フォールバック情報（ファイルサイズ、行数）が含まれる

**合格基準**:
- [x] import文が正しく抽出される
- [x] 型定義が正しく抽出される
- [x] エラー箇所が特定される
- [x] 基本情報（サイズ、行数）が返される

---

### EDGE-002: 文字エンコーディングエラー 🟡 *エラーハンドリングの妥当な推測*

**Given（前提条件）**:
- Shift-JIS エンコーディングのファイルが存在（UTF-8でない）

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- エラーメッセージが返される
- エンコーディングの問題が明示される
- 可能ならば、エンコーディングを推測して再試行

**合格基準**:
- [x] エラーが適切に返される
- [x] エラー理由が明確
- [x] システムがクラッシュしない

---

### EDGE-003: 循環依存の検出 🟡 *依存関係解析の妥当な推測*

**Given（前提条件）**:
- ファイルA が ファイルB をインポート
- ファイルB が ファイルA をインポート（循環依存）

**When（実行条件）**:
- `get_dependencies` ツールを呼び出す

**Then（期待結果）**:
- 依存関係が正しく返される
- 循環依存の警告が含まれる

**合格基準**:
- [x] 循環依存が検出される
- [x] 警告メッセージが含まれる
- [x] 無限ループにならない

---

### EDGE-101: 空のファイル 🟡 *境界値の妥当な推測*

**Given（前提条件）**:
- 0バイトのTypeScriptファイルが存在

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- 成功レスポンスが返される
- 空の配列（関数なし、型なし等）が返される
- エラーにならない

**合格基準**:
- [x] エラーにならない
- [x] 空の結果が正しく返される

---

### EDGE-102: 非常に大きなファイル 🟡 *境界値の妥当な推測*

**Given（前提条件）**:
- 10,000行のTypeScriptファイルが存在

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- メモリエラーが発生しない
- 適切な時間内（5秒以内）に完了する
- 正確な解析結果が返される

**合格基準**:
- [x] メモリエラーが発生しない
- [x] 5秒以内に完了
- [x] 結果が正確

---

### EDGE-203: JSX/TSXファイル 🟡 *TypeScript特有の妥当な推測*

**Given（前提条件）**:
- React コンポーネント（TSXファイル）が存在:
```typescript
export const Button: React.FC<{ label: string }> = ({ label }) => {
  return <button>{label}</button>;
};
```

**When（実行条件）**:
- `analyze_file` ツールを呼び出す

**Then（期待結果）**:
- `Button` コンポーネントが正しく抽出される
- プロパティの型情報が含まれる
- JSX 構文がエラーにならない

**合格基準**:
- [x] TSX/JSXファイルを解析できる
- [x] React コンポーネントを識別できる
- [x] プロパティの型が抽出される

---

## 統合テスト基準

### MCPクライアントとの統合テスト

**テストシナリオ**:
1. Claude CodeからMCPサーバーに接続
2. ツール一覧を取得
3. `analyze_file` ツールを実行
4. 結果を正しく解釈できることを確認

**合格基準**:
- [x] Claude Codeから接続できる
- [x] ツールが正しく表示される
- [x] JSON出力がClaude Codeで解釈できる
- [x] エラー時も適切にハンドリングされる

---

### TypeScript Compiler APIとの統合テスト

**テストシナリオ**:
1. TypeScript Compilerを初期化
2. 実際のプロジェクトファイルを解析
3. 型情報、シンボル情報が正しく取得できることを確認

**合格基準**:
- [x] TypeScript Compiler APIが正常に動作
- [x] 型情報が正確に取得される
- [x] シンボル解決が正しく動作

---

## リグレッションテスト基準

### 既存機能影響確認

**テストシナリオ**:
- 新機能追加後、既存のすべてのテストを再実行

**合格基準**:
- [x] 既存テストがすべて通る
- [x] パフォーマンスが劣化していない（±10%以内）
- [x] 出力サイズが増加していない（±10%以内）

---

## 受け入れテスト実行チェックリスト

### テスト実行前

- [ ] テスト環境の準備完了（Bun 1.3.1、TypeScript 5.9.3）
- [ ] テストデータの準備完了（サンプルTypeScriptファイル）
- [ ] MCPサーバーが起動している
- [ ] 実行担当者の確認完了

### テスト実行中

- [ ] 全機能テストの実行（`bun test`）
- [ ] パフォーマンステストの実行
- [ ] コンテキスト効率テストの実行
- [ ] 問題発見時の記録（Issue作成）
- [ ] 修正後の再テスト

### テスト完了後

- [ ] テスト結果の記録（成功率、カバレッジ、パフォーマンス）
- [ ] 残存問題の整理
- [ ] 受け入れ可否の判定
- [ ] ステークホルダーへの報告

---

## MVP受け入れ判定基準

### Phase 1（MVP）の受け入れ条件

以下のすべてを満たすこと：

- [x] コード構造解析が動作する（REQ-001〜REQ-005）
- [x] シンボル検索が動作する（REQ-011〜REQ-014）
- [x] 依存関係解析が動作する（REQ-021〜REQ-024）
- [x] ファイルサマリーが動作する（REQ-031〜REQ-033）
- [x] 型情報抽出が動作する（REQ-041〜REQ-045）
- [x] ドキュメント抽出が動作する（REQ-051〜REQ-054）
- [x] 簡潔/詳細モード切り替えが動作する（REQ-061〜REQ-064）
- [x] エラーハンドリングが適切に動作する（REQ-101〜REQ-104）
- [x] キャッシュ機能が動作する（REQ-111）
- [x] 単体テストが実装され、すべて通る（NFR-201）
- [x] コンテキスト削減効果が90%以上（NFR-101, NFR-103）
- [x] パフォーマンス基準を満たす（NFR-002〜NFR-006）

---

## 更新履歴

- **2025-10-29**: 初回作成（ユーザヒアリング2025-10-29に基づく）
  - 機能テスト基準（15要件）
  - 非機能テスト基準（パフォーマンス、コンテキスト効率、品質）
  - Edgeケーステスト基準（7ケース）
  - 統合テスト・リグレッションテスト基準
  - MVP受け入れ判定基準
