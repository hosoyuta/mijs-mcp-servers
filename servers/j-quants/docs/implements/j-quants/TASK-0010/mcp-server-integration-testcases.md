# TASK-0010: MCPサーバー本体実装・統合 - テストケース仕様書

**タスクID**: TASK-0010
**タスク名**: MCPサーバー本体実装・統合（MCP Server Integration）
**作成日**: 2025-10-30
**作成者**: Claude (Sonnet 4.5)
**テストフレームワーク**: Vitest 2.1.4
**プログラミング言語**: TypeScript 5.x

---

## 📋 概要

本ドキュメントは、TASK-0010（MCPサーバー本体実装・統合）のテストケース仕様書です。要件定義書（`mcp-server-integration-requirements.md`）に基づいて、包括的な統合テストケースを定義します。

### テストケース総数

**合計**: 8件
- 正常系: 3件
- 異常系: 3件
- 境界値: 2件

---

## 🧪 開発言語・フレームワーク

### プログラミング言語: TypeScript 5.x

**言語選択の理由**:
- Phase 1タスク定義で確定済み（既存実装がTypeScript）
- strict mode 完全対応
- @modelcontextprotocol/sdk が TypeScript ネイティブサポート
- 既存ツール実装（TASK-0006~0009）と同じ技術スタック

**テストに適した機能**:
- 型安全性: MCPサーバーインターフェースの型チェック
- モックサポート: Vitest の vi.spyOn() でメソッドを簡潔にモック化
- IntelliSense: IDE補完により、テストコード記述が効率化

🔵 **信頼性レベル**: 青信号（既存実装パターンから確定）

### テストフレームワーク: Vitest 2.1.4

**フレームワーク選択の理由**:
- 既存テスト（TASK-0006~0009）と同一フレームワーク
- 高速実行: Jest互換APIながら、Viteベースで高速
- TypeScript ネイティブサポート: 設定不要で TypeScript を実行可能
- モックAPI充実: vi.spyOn(), vi.mock() で柔軟なモック作成

**テスト実行環境**:
- Node.js 環境
- Vitest CLI経由で実行
- ファイル: `tests/integration/server.test.ts`
- 実行コマンド: `npm test tests/integration/server.test.ts`

🔵 **信頼性レベル**: 青信号（既存テストファイル、vitest.config.tsから確定）

---

## 🎯 正常系テストケース（3件）

### TC-NORMAL-001: MCPサーバー起動成功

**テスト名**: startMCPServer() - 正常起動（TokenManager初期化、ツール登録）

**何をテストするか**:
- 環境変数が正しく設定されている場合に、MCPサーバーが正常に起動すること
- TokenManagerが正常に初期化され、IDトークンが取得できること
- 4つのMCPツールがすべて登録されること

**期待される動作**:
1. 環境変数 `J_QUANTS_REFRESH_TOKEN` が読み込まれる
2. TokenManagerが初期化される
3. TokenManager.getIdToken()が呼ばれ、トークンが取得される
4. MCPサーバー（Server）が作成される
5. 4つのツール（get_listed_companies, get_stock_price, get_financial_statements, get_company_info）が登録される
6. サーバーが起動完了状態になる

#### 入力値

```typescript
// 環境変数
process.env.J_QUANTS_REFRESH_TOKEN = 'test-refresh-token-valid';
```

**入力データの意味**:
- 有効なリフレッシュトークンが設定されていることを模擬
- 実際のトークンではなく、テスト用のダミー値

#### 期待される結果

```typescript
// サーバーが起動完了状態
expect(server).toBeDefined();
expect(server.name).toBe('j-quants');
expect(server.version).toBe('1.0.0');

// TokenManagerが呼ばれたこと
expect(TokenManager.prototype.getIdToken).toHaveBeenCalled();

// ツールが登録されていること
const tools = server.listTools();
expect(tools).toHaveLength(4);
expect(tools.map(t => t.name)).toContain('get_listed_companies');
expect(tools.map(t => t.name)).toContain('get_stock_price');
expect(tools.map(t => t.name)).toContain('get_financial_statements');
expect(tools.map(t => t.name)).toContain('get_company_info');
```

**期待結果の理由**:
- サーバーが正常に作成され、名前とバージョンが設定されている
- TokenManagerが呼ばれ、認証フローが実行された
- 4つのツールすべてが登録され、MCPプロトコル経由で呼び出し可能

#### テストの目的

**確認ポイント**:
- 環境変数からの設定読み込みが正しく動作すること
- TokenManagerとの統合が正しく動作すること
- すべてのツールが正しく登録されること
- サーバーが起動完了状態になること

🔵 **信頼性レベル**: 青信号（要件定義書 REQ-1002、Phase 1タスク定義から確定）

---

### TC-NORMAL-002: ツール登録確認（4つのツール定義）

**テスト名**: listTools() - 4つのMCPツールが正しく登録されていることを確認

**何をテストするか**:
- 登録されたツールの数が4件であること
- 各ツールの名前（name）が正しく設定されていること
- 各ツールの説明（description）が日本語で設定されていること
- 各ツールの入力スキーマ（inputSchema）が正しく設定されていること

**期待される動作**:
1. server.listTools()を呼び出し
2. 返却されるツールリストが4件
3. 各ツールの定義が要件通りに設定されている

#### 入力値

```typescript
// サーバー起動後の状態（TC-NORMAL-001の後続テスト）
const tools = server.listTools();
```

**入力データの意味**:
- サーバーが起動済みであることが前提
- ツールリストを取得するだけ（パラメータなし）

#### 期待される結果

```typescript
// ツール数の確認
expect(tools).toHaveLength(4);

// get_listed_companies の確認
const getListedCompaniesTool = tools.find(t => t.name === 'get_listed_companies');
expect(getListedCompaniesTool).toBeDefined();
expect(getListedCompaniesTool.description).toBe('J-Quants APIから上場銘柄一覧を取得します');
expect(getListedCompaniesTool.inputSchema.properties).toHaveProperty('market');
expect(getListedCompaniesTool.inputSchema.properties).toHaveProperty('sector');

// get_stock_price の確認
const getStockPriceTool = tools.find(t => t.name === 'get_stock_price');
expect(getStockPriceTool).toBeDefined();
expect(getStockPriceTool.description).toBe('指定銘柄の日次株価データを取得します');
expect(getStockPriceTool.inputSchema.required).toContain('code');

// get_financial_statements の確認
const getFinancialStatementsTool = tools.find(t => t.name === 'get_financial_statements');
expect(getFinancialStatementsTool).toBeDefined();
expect(getFinancialStatementsTool.description).toBe('指定銘柄の財務諸表を取得します');
expect(getFinancialStatementsTool.inputSchema.required).toContain('code');

// get_company_info の確認
const getCompanyInfoTool = tools.find(t => t.name === 'get_company_info');
expect(getCompanyInfoTool).toBeDefined();
expect(getCompanyInfoTool.description).toBe('指定銘柄の企業情報と最新株価を取得します');
expect(getCompanyInfoTool.inputSchema.required).toContain('code');
```

**期待結果の理由**:
- 要件定義書で定義された4つのツールがすべて登録されている
- 各ツールの名前、説明、入力スキーマが要件通りに設定されている
- JSON Schemaの形式が正しく、MCPプロトコルに準拠している

#### テストの目的

**確認ポイント**:
- ツールの登録漏れがないこと
- ツール定義が要件通りに正しく設定されていること
- 入力スキーマが正しく、必須パラメータが定義されていること

🔵 **信頼性レベル**: 青信号（要件定義書、Phase 1タスク定義から確定）

---

### TC-NORMAL-003: ツール実行（end-to-end、get_listed_companies）

**テスト名**: callTool('get_listed_companies') - ツール実行が成功し、銘柄一覧が返却される

**何をテストするか**:
- MCPサーバー経由でツールを呼び出せること
- ツール実装関数が正しく実行されること
- 実行結果がJSON形式で返却されること
- エラーが発生しないこと

**期待される動作**:
1. server.callTool('get_listed_companies', { market: 'Prime' }) を呼び出し
2. getListedCompanies関数が実行される
3. 銘柄一覧データがJSON形式で返却される
4. レスポンスタイムが5秒以内

#### 入力値

```typescript
const toolName = 'get_listed_companies';
const params = { market: 'Prime' };
```

**入力データの意味**:
- market='Prime': 東証プライム市場の銘柄のみ取得
- 既存ツール（TASK-0006）で実装済みのパラメータ

#### 期待される結果

```typescript
const result = await server.callTool(toolName, params);

// 実行成功
expect(result.isError).toBe(false);

// 結果がJSON形式
expect(result.content).toBeDefined();
expect(result.content[0].type).toBe('text');
const data = JSON.parse(result.content[0].text);

// 銘柄一覧が返却されている
expect(data.companies).toBeDefined();
expect(Array.isArray(data.companies)).toBe(true);
expect(data.companies.length).toBeGreaterThan(0);

// 各銘柄がプライム市場
data.companies.forEach(company => {
  expect(company.market).toBe('Prime');
});
```

**期待結果の理由**:
- ツールが正しく実行され、エラーが発生しない
- 既存のgetListedCompanies実装が正しく動作
- MCPプロトコルに準拠したレスポンス形式

#### テストの目的

**確認ポイント**:
- ツール呼び出しのend-to-endフローが正しく動作すること
- ツール実装関数が正しく統合されていること
- レスポンス形式がMCPプロトコルに準拠していること

🔵 **信頼性レベル**: 青信号（Phase 1タスク定義、既存ツール実装から確定）

---

## 🔥 異常系テストケース（3件）

### TC-ERROR-001: 環境変数未設定でのサーバー起動失敗

**テスト名**: startMCPServer() - J_QUANTS_REFRESH_TOKEN未設定時のエラー

**エラーケースの概要**:
- 環境変数 `J_QUANTS_REFRESH_TOKEN` が設定されていない場合
- TokenManagerの初期化が失敗する

**エラー処理の重要性**:
- ユーザーが環境変数を設定し忘れた場合の明確なエラーメッセージ
- システムが不正な状態で起動することを防ぐ

#### 入力値

```typescript
// 環境変数未設定
delete process.env.J_QUANTS_REFRESH_TOKEN;
```

**不正な理由**:
- J-Quants APIの認証に必要なリフレッシュトークンが未設定
- TokenManagerが正常に動作できない

**実際の発生シナリオ**:
- 初回セットアップ時に`.env`ファイルの設定を忘れた
- 環境変数の名前を間違えた（J_QUANTS_REFRESH_TOKEN → JQUANTS_REFRESH_TOKEN等）

#### 期待される結果

```typescript
// サーバー起動がエラーをスロー
await expect(startMCPServer()).rejects.toThrow();
await expect(startMCPServer()).rejects.toThrow('環境変数 J_QUANTS_REFRESH_TOKEN を設定してください');

// TokenManagerが呼ばれていないこと（初期化前にエラー）
expect(TokenManager.prototype.getIdToken).not.toHaveBeenCalled();
```

**エラーメッセージの内容**:
- 日本語で明確なメッセージ
- 何をすべきか（環境変数を設定する）が明確
- ユーザーフレンドリー

**システムの安全性**:
- サーバーが不正な状態で起動しない
- プロセスが正常終了する（exit code: 1）

#### テストの目的

**品質保証の観点**:
- 環境変数のバリデーションが正しく動作すること
- エラーメッセージがユーザーにとって分かりやすいこと
- システムが安全な状態を保つこと

🔵 **信頼性レベル**: 青信号（要件定義書 EDGE-001、Phase 1タスク定義から確定）

---

### TC-ERROR-002: ツール実行時のパラメータエラー

**テスト名**: callTool('get_stock_price') - 不正なパラメータでのエラー

**エラーケースの概要**:
- ツール呼び出し時にパラメータが不正な場合
- ValidationErrorが発生し、ユーザーフレンドリーなエラーメッセージが返却される

**エラー処理の重要性**:
- ユーザーが誤ったパラメータを指定した場合のガイダンス
- システムが予期しない動作をすることを防ぐ

#### 入力値

```typescript
const toolName = 'get_stock_price';
const params = { code: '123' }; // 不正: 3桁（4桁必須）
```

**不正な理由**:
- 銘柄コードは4桁の数字である必要がある
- '123'は3桁のため、形式が不正

**実際の発生シナリオ**:
- ユーザーが銘柄コードの桁数を間違えた
- ユーザーがアルファベットを入力した（例: 'AAPL'）

#### 期待される結果

```typescript
const result = await server.callTool(toolName, params);

// エラーレスポンス
expect(result.isError).toBe(true);

// エラーメッセージが日本語で分かりやすい
expect(result.content[0].text).toContain('銘柄コードは4桁の数字である必要があります');

// ValidationErrorが発生
expect(result.content[0].text).toContain('ValidationError');
```

**エラーメッセージの内容**:
- 日本語で明確なメッセージ
- 何が間違っているか（桁数、形式）が明確
- 正しい形式の例が示されている（オプション）

**システムの安全性**:
- 不正なパラメータでツールが実行されない
- エラーが適切にキャッチされ、ユーザーに返却される

#### テストの目的

**品質保証の観点**:
- パラメータバリデーションが正しく動作すること
- エラーハンドリングが適切に行われること
- エラーメッセージがユーザーフレンドリーであること

🔵 **信頼性レベル**: 青信号（要件定義書 EDGE-003、既存ツール実装のバリデーションから確定）

---

### TC-ERROR-003: 起動時認証失敗（TokenManager初期化エラー）

**テスト名**: startMCPServer() - リフレッシュトークンが無効な場合のエラー

**エラーケースの概要**:
- リフレッシュトークンが無効または期限切れの場合
- TokenManager.getIdToken()がエラーをスローする

**エラー処理の重要性**:
- 認証失敗時の適切なエラーハンドリング
- ユーザーに再認証を促す

#### 入力値

```typescript
// 無効なリフレッシュトークン
process.env.J_QUANTS_REFRESH_TOKEN = 'invalid-token';

// TokenManager.getIdToken()がエラーをスロー
vi.spyOn(TokenManager.prototype, 'getIdToken').mockRejectedValue(
  new Error('認証に失敗しました: リフレッシュトークンが無効です')
);
```

**不正な理由**:
- リフレッシュトークンが無効または期限切れ
- J-Quants APIが認証を拒否

**実際の発生シナリオ**:
- ユーザーがリフレッシュトークンを更新していない
- トークンの有効期限が切れた
- J-Quants APIのアカウントが無効化された

#### 期待される結果

```typescript
// サーバー起動がエラーをスロー
await expect(startMCPServer()).rejects.toThrow();
await expect(startMCPServer()).rejects.toThrow('J-Quants API認証に失敗しました');

// TokenManagerが呼ばれたこと（初期化は試みられた）
expect(TokenManager.prototype.getIdToken).toHaveBeenCalled();

// サーバーが起動していないこと
// プロセスが正常終了すること（exit code: 1）
```

**エラーメッセージの内容**:
- 日本語で明確なメッセージ
- 認証失敗の理由が示されている
- 対処方法（リフレッシュトークンの更新）が示されている

**システムの安全性**:
- 認証失敗時にサーバーが起動しない
- エラーログが出力される
- プロセスが正常終了する

#### テストの目的

**品質保証の観点**:
- 認証エラーが適切にハンドリングされること
- エラーメッセージがユーザーに分かりやすいこと
- システムが不正な状態で起動しないこと

🔵 **信頼性レベル**: 青信号（要件定義書 EDGE-002、Phase 1タスク定義から確定）

---

## 🎲 境界値テストケース（2件）

### TC-BOUNDARY-001: 最小パラメータでのツール実行

**テスト名**: callTool('get_company_info') - 必須パラメータのみ指定

**境界値の意味**:
- ツールの必須パラメータのみを指定した最小限の呼び出し
- オプションパラメータが省略された場合の動作確認

**境界値での動作保証**:
- 必須パラメータのみでツールが正常に動作すること
- オプションパラメータのデフォルト値が正しく適用されること

#### 入力値

```typescript
const toolName = 'get_company_info';
const params = { code: '7203' }; // 必須パラメータのみ
```

**境界値選択の根拠**:
- get_company_infoの必須パラメータは`code`のみ
- 最小限のパラメータで動作することを確認

**実際の使用場面**:
- ユーザーがシンプルにツールを呼び出す場合
- デフォルト動作を期待する場合

#### 期待される結果

```typescript
const result = await server.callTool(toolName, params);

// 実行成功
expect(result.isError).toBe(false);

// 企業情報が返却される
const data = JSON.parse(result.content[0].text);
expect(data.code).toBe('7203');
expect(data.name).toBeDefined();
expect(data.market).toBeDefined();
expect(data.sector).toBeDefined();
// latest_priceはオプション（undefinedも許容）
```

**境界での正確性**:
- 必須パラメータのみで正しく動作
- オプションパラメータが省略された場合のデフォルト動作が正しい

**一貫した動作**:
- パラメータの有無にかかわらず、一貫した結果形式

#### テストの目的

**堅牢性の確認**:
- 最小限のパラメータでツールが正常に動作すること
- オプションパラメータの省略が正しく処理されること

🔵 **信頼性レベル**: 青信号（既存ツール実装、要件定義書から確定）

---

### TC-BOUNDARY-002: サーバー起動時間の確認（5秒以内）

**テスト名**: startMCPServer() - 起動時間が5秒以内であることを確認

**境界値の意味**:
- 要件で定義された起動時間（5秒以内）の境界値確認
- パフォーマンス要件を満たしていることの検証

**境界値での動作保証**:
- サーバーが5秒以内に起動完了すること
- 起動処理がタイムアウトしないこと

#### 入力値

```typescript
// 正常な環境変数
process.env.J_QUANTS_REFRESH_TOKEN = 'test-refresh-token';

// 起動時間の計測開始
const startTime = Date.now();
```

**境界値選択の根拠**:
- 要件定義書で「起動時間: 5秒以内」と定義されている
- ユーザー体験を損なわない起動時間の上限

**実際の使用場面**:
- サーバーの初回起動時
- Claude Desktopからの接続時

#### 期待される結果

```typescript
const server = await startMCPServer();
const endTime = Date.now();
const elapsedTime = endTime - startTime;

// サーバーが起動成功
expect(server).toBeDefined();

// 起動時間が5秒以内
expect(elapsedTime).toBeLessThan(5000); // 5000ms = 5秒

// ツールがすべて登録されている
const tools = server.listTools();
expect(tools).toHaveLength(4);
```

**境界での正確性**:
- 起動時間が要件を満たしている
- 起動時間の計測が正確

**一貫した動作**:
- 起動処理がタイムアウトしない
- 起動完了後、すぐにツールが使用可能

#### テストの目的

**堅牢性の確認**:
- パフォーマンス要件を満たしていること
- 起動処理が効率的に行われていること
- タイムアウト処理が正しく動作すること

🔵 **信頼性レベル**: 青信号（要件定義書 NFR-001から確定）

---

## 📊 テストケース実装時の日本語コメント指針

### テストケース開始時のコメント

```typescript
// 【テスト目的】: MCPサーバーが正常に起動し、4つのツールが登録されることを確認
// 【テスト内容】: 環境変数を設定し、startMCPServer()を実行、ツールリストを取得
// 【期待される動作】: サーバーが起動完了状態になり、4つのツールがlistTools()で取得できる
// 🔵 信頼性レベル: 青信号（要件定義書から確定）
```

### Given（準備フェーズ）のコメント

```typescript
// 【テストデータ準備】: 環境変数を設定し、TokenManagerをモック化
// 【初期条件設定】: J_QUANTS_REFRESH_TOKENを有効な値に設定
// 【前提条件確認】: TokenManager.getIdToken()が成功するようモック化
vi.spyOn(TokenManager.prototype, 'getIdToken').mockResolvedValue('mock-token');
```

### When（実行フェーズ）のコメント

```typescript
// 【実際の処理実行】: MCPサーバーを起動
// 【処理内容】: startMCPServer()を呼び出し、初期化処理を実行
// 【実行タイミング】: テストデータ準備完了後、すぐに実行
const server = await startMCPServer();
```

### Then（検証フェーズ）のコメント

```typescript
// 【結果検証】: サーバーが正常に起動し、ツールが登録されていることを確認
// 【期待値確認】: 4つのツールがlistTools()で取得できることを確認
// 【品質保証】: MCPサーバーの統合が正しく動作し、すべてのツールが使用可能
const tools = server.listTools();
expect(tools).toHaveLength(4); // 【確認内容】: 4つのツールが登録されていることを確認
```

### 各expectステートメントのコメント

```typescript
expect(result.isError).toBe(false); // 【確認内容】: ツール実行がエラーなく成功
expect(data.companies).toBeDefined(); // 【確認内容】: 銘柄一覧データが返却されている
expect(data.companies.length).toBeGreaterThan(0); // 【確認内容】: 銘柄が1件以上取得されている
```

### セットアップ・クリーンアップのコメント

```typescript
beforeEach(() => {
  // 【テスト前準備】: 各テスト実行前にモックをリセットし、環境変数を設定
  // 【環境初期化】: 前のテストの影響を受けないよう、クリーンな状態にする
  vi.clearAllMocks();
  process.env.J_QUANTS_REFRESH_TOKEN = 'test-refresh-token';
});

afterEach(() => {
  // 【テスト後処理】: 環境変数をクリーンアップ
  // 【状態復元】: 次のテストに影響しないよう、環境変数を削除
  delete process.env.J_QUANTS_REFRESH_TOKEN;
});
```

---

## ✅ テストケース品質判定

### 判定結果: ✅ 高品質

**判定基準に対する評価**:

1. **テストケース分類**: ✅ 完全
   - 正常系: 3件（起動、登録確認、ツール実行）
   - 異常系: 3件（環境変数未設定、パラメータエラー、認証失敗）
   - 境界値: 2件（最小パラメータ、起動時間）

2. **期待値定義**: ✅ 明確
   - 各テストケースの期待値が具体的に定義されている
   - エラーメッセージの内容まで定義されている
   - パフォーマンス要件（5秒以内）が明確

3. **技術選択**: ✅ 確定
   - TypeScript 5.x（既存実装と統一）
   - Vitest 2.1.4（既存テストと統一）
   - @modelcontextprotocol/sdk（MCPサーバー実装）

4. **実装可能性**: ✅ 確実
   - 既存のツール実装（TASK-0006~0009）が完了済み
   - テストフレームワークが確定済み
   - モック戦略が明確

### 信頼性レベル分布

- 🔵 青信号: 100% （すべてのテストケースが要件定義書、Phase 1タスク定義、既存実装から確定）
- 🟡 黄信号: 0%
- 🔴 赤信号: 0%

### カバレッジ分析

| 要件ID | 要件名 | テストケース | カバレッジ |
|--------|--------|-------------|----------|
| REQ-1002 | MCPサーバー起動 | TC-NORMAL-001, TC-ERROR-001, TC-ERROR-003, TC-BOUNDARY-002 | 100% |
| REQ-1004 | ツール登録 | TC-NORMAL-002, TC-NORMAL-003 | 100% |
| NFR-001 | パフォーマンス要件 | TC-BOUNDARY-002 | 100% |
| EDGE-001 | 環境変数未設定 | TC-ERROR-001 | 100% |
| EDGE-002 | 起動時認証失敗 | TC-ERROR-003 | 100% |
| EDGE-003 | ツール実行エラー | TC-ERROR-002 | 100% |

**要件網羅率**: 100% （6/6要件）

---

## 📁 テストファイル構成

### ファイルパス

```
tests/
└── integration/
    └── server.test.ts (新規作成、約600-800行)
```

### テストファイル構造

```typescript
// tests/integration/server.test.ts

/**
 * TASK-0010: MCPサーバー本体実装・統合 テストケース
 *
 * 【テストフェーズ】: TDD Red Phase（失敗するテストを作成）
 * 【作成日】: 2025-10-30
 * 【テストフレームワーク】: Vitest 2.1.4
 * 【言語】: TypeScript 5.x
 * 【目的】: MCPサーバー統合テスト（実装は存在しないため、全テストが失敗する）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startMCPServer } from '../../src/index';
import { TokenManager } from '../../src/auth/token-manager';

// =========================================
// 正常系テストケース（3件）
// =========================================
describe('MCPサーバー統合テスト - 正常系', () => {
  beforeEach(() => { /* ... */ });
  afterEach(() => { /* ... */ });

  it('TC-NORMAL-001: サーバー起動成功', async () => { /* ... */ });
  it('TC-NORMAL-002: ツール登録確認', async () => { /* ... */ });
  it('TC-NORMAL-003: ツール実行（get_listed_companies）', async () => { /* ... */ });
});

// =========================================
// 異常系テストケース（3件）
// =========================================
describe('MCPサーバー統合テスト - 異常系', () => {
  beforeEach(() => { /* ... */ });
  afterEach(() => { /* ... */ });

  it('TC-ERROR-001: 環境変数未設定エラー', async () => { /* ... */ });
  it('TC-ERROR-002: パラメータエラー', async () => { /* ... */ });
  it('TC-ERROR-003: 起動時認証失敗', async () => { /* ... */ });
});

// =========================================
// 境界値テストケース（2件）
// =========================================
describe('MCPサーバー統合テスト - 境界値', () => {
  beforeEach(() => { /* ... */ });
  afterEach(() => { /* ... */ });

  it('TC-BOUNDARY-001: 最小パラメータでのツール実行', async () => { /* ... */ });
  it('TC-BOUNDARY-002: サーバー起動時間確認（5秒以内）', async () => { /* ... */ });
});
```

---

## 🚀 次のステップ

次のお勧めステップ: `/tsumiki:tdd-red` でRedフェーズ（失敗テスト作成）を開始します。

**実施内容**: 本テストケース仕様書に基づいて、失敗するテストコードを実装します（src/index.tsが存在しないため、すべてのテストが失敗する）。

**期待される成果物**:
- `tests/integration/server.test.ts`（約600-800行）
- 全8件のテストケースが実装される
- すべてのテストが失敗する（Red Phase）

---

**作成者**: Claude (Sonnet 4.5)
**最終更新**: 2025-10-30
**ステータス**: ✅ テストケース洗い出し完了
**次フェーズ**: Red Phase（失敗テスト作成）
