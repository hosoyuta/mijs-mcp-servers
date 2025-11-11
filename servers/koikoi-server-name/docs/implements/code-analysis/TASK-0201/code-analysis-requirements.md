# TASK-0201: StructureAnalyzer基盤実装 - 要件定義書

## 実行日時
2025-11-05

## タスク概要

### タスクID
TASK-0201

### タスク名
StructureAnalyzer基盤実装

### フェーズ
Phase 2 - 解析エンジンレイヤー (Analyzer Engine Layer)

### タスクタイプ
TDD (テスト駆動開発)

### 工数見積もり
6-8時間

### 依存関係
- **前提条件**: TASK-0134 (Phase 1完了) ✅
- **Phase 1成果物**:
  - `src/compiler/CompilerHost.ts` - TypeScript Program作成
  - `src/compiler/ProgramManager.ts` - Programキャッシング
  - `src/compiler/SourceFileCache.ts` - SourceFileキャッシング
  - `src/fs/FileReader.ts` - 高速ファイル読み込み

### 概要説明

StructureAnalyzerは、TypeScript/JavaScriptファイルのコード構造を解析し、関数・クラス・プロパティなどの構造情報を抽出する基盤クラスです。本タスクでは、AST（抽象構文木）を走査する基盤機能を実装し、後続のFunctionExtractor、ClassExtractor実装の土台を構築します。

### ビジネス価値

- **Claude Codeコンテキスト削減**: ファイル全体ではなく、構造情報のみを提供することで90%のコンテキスト削減
- **高速解析**: TypeScript Compiler APIを活用し、正確かつ高速な構造抽出
- **拡張性**: Visitor パターンにより、新しい構造要素の追加が容易

---

## 機能要件

### FR-0201-001: StructureAnalyzerクラス実装

**説明**: StructureAnalyzerクラスの基本構造を実装し、AST走査の基盤を構築する

**対応する上位要件**:
- REQ-001: システムは、TypeScript/JavaScriptファイルから関数一覧を抽出しなければならない
- REQ-002: システムは、クラスとそのメソッド一覧を抽出しなければならない
- REQ-025: システムは、各関数/メソッドの構造情報を抽出しなければならない

**受け入れ基準**:
- [ ] StructureAnalyzerクラスが実装されている
- [ ] CompilerHostと連携してSourceFileを取得できる
- [ ] クラスの初期化が1ms以内に完了する
- [ ] TypeScript strict modeでコンパイルエラーがない
- [ ] JSDocが100%記述されている

**技術的詳細**:
```typescript
export class StructureAnalyzer {
  private readonly compilerHost: CompilerHost;
  private readonly config: AnalyzerConfig;

  constructor(compilerHost: CompilerHost, config: AnalyzerConfig);
  analyze(sourceFile: ts.SourceFile): StructureAnalysisResult;
}
```

**テストケース**:
1. 正常系: CompilerHostを渡してインスタンス化できる
2. 正常系: 設定を渡してインスタンス化できる
3. 異常系: nullを渡すとエラーが発生する

---

### FR-0201-002: analyze()メソッド実装

**説明**: SourceFileを受け取り、構造解析結果を返すメソッドを実装する

**対応する上位要件**:
- REQ-001: 関数一覧の抽出
- REQ-002: クラス一覧の抽出
- REQ-025: 構造情報の抽出

**受け入れ基準**:
- [ ] analyze()メソッドが実装されている
- [ ] SourceFileを引数として受け取る
- [ ] StructureAnalysisResult型の結果を返す
- [ ] 空のSourceFileでもエラーが発生しない
- [ ] 100行のファイルを50ms以内で解析できる

**技術的詳細**:
```typescript
interface StructureAnalysisResult {
  filePath: string;
  timestamp: number;
  success: boolean;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  errors?: ParseError[];
}

analyze(sourceFile: ts.SourceFile): StructureAnalysisResult {
  // 1. 初期化
  // 2. AST走査
  // 3. 結果集約
  // 4. エラーハンドリング
}
```

**テストケース**:
1. 正常系: 空のSourceFileを解析し、空の結果を返す
2. 正常系: 単純な関数を含むファイルを解析できる
3. 正常系: クラスを含むファイルを解析できる
4. 異常系: 構文エラーのあるファイルでも部分成功する
5. 境界値: 0行のファイルを解析できる

---

### FR-0201-003: ASTトラバーサル基盤実装

**説明**: ts.forEachChild()を使用してASTを再帰的に走査する基盤を実装する

**対応する上位要件**:
- REQ-025: 構造情報の抽出基盤

**受け入れ基準**:
- [ ] ts.forEachChild()を使用したトラバーサルが実装されている
- [ ] Visitorパターンで各ノードタイプを処理できる
- [ ] ネストされた構造（クラス内の関数等）を正しく走査できる
- [ ] 走査中のエラーが適切にハンドリングされる

**技術的詳細**:
```typescript
private traverseNode(node: ts.Node, context: TraversalContext): void {
  // ノードタイプに応じた処理
  switch (node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
      this.visitFunction(node);
      break;
    case ts.SyntaxKind.ClassDeclaration:
      this.visitClass(node);
      break;
    // ...
  }

  // 子ノードの再帰的走査
  ts.forEachChild(node, (child) => this.traverseNode(child, context));
}
```

**テストケース**:
1. 正常系: 単純なASTを走査できる
2. 正常系: ネストされたASTを走査できる
3. 正常系: 10階層の深いネストを走査できる
4. 境界値: 空のASTを走査してもエラーが発生しない
5. 異常系: 不正なノードがあってもスキップして継続する

---

### FR-0201-004: 結果集約ロジック実装

**説明**: 走査中に収集した情報を構造化されたデータに集約する

**対応する上位要件**:
- REQ-061: 解析結果を構造化されたJSON形式で返す

**受け入れ基準**:
- [ ] 関数情報を配列で集約できる
- [ ] クラス情報を配列で集約できる
- [ ] 位置情報（行番号・列番号）が正確に記録される
- [ ] エラー情報が適切に集約される
- [ ] 結果がStructureAnalysisResult型に適合する

**技術的詳細**:
```typescript
private collectResults(): StructureAnalysisResult {
  return {
    filePath: this.currentFile,
    timestamp: Date.now(),
    success: this.errors.length === 0,
    functions: this.collectedFunctions,
    classes: this.collectedClasses,
    errors: this.errors.length > 0 ? this.errors : undefined,
  };
}
```

**テストケース**:
1. 正常系: 複数の関数を集約できる
2. 正常系: 複数のクラスを集約できる
3. 正常系: エラー情報を含めて集約できる
4. 境界値: 要素が0個でも正しく集約できる

---

### FR-0201-005: 位置情報取得機能

**説明**: 各構造要素の正確な位置情報（ファイル名、行番号、列番号）を取得する

**対応する上位要件**:
- REQ-012: 検索結果にファイルパスと行番号を含める

**受け入れ基準**:
- [ ] ノードの開始位置を取得できる
- [ ] ノードの終了位置を取得できる
- [ ] 行番号が1-indexedで取得される
- [ ] 列番号が1-indexedで取得される
- [ ] ファイルパスが絶対パスで記録される

**技術的詳細**:
```typescript
private getLocation(node: ts.Node, sourceFile: ts.SourceFile): Location {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

  return {
    file: sourceFile.fileName,
    start: {
      line: start.line + 1,  // 1-indexed
      column: start.character + 1,
      offset: node.getStart(),
    },
    end: {
      line: end.line + 1,
      column: end.character + 1,
      offset: node.getEnd(),
    },
  };
}
```

**テストケース**:
1. 正常系: 関数の位置情報を正確に取得できる
2. 正常系: クラスの位置情報を正確に取得できる
3. 正常系: ネストされた要素の位置情報を正確に取得できる
4. 境界値: ファイルの先頭（1行1列）を正しく取得できる
5. 境界値: ファイルの末尾を正しく取得できる

---

## 非機能要件

### NFR-0201-001: パフォーマンス

**説明**: 解析処理のパフォーマンス要件

**受け入れ基準**:
- [ ] 空のファイルの解析が10ms以内に完了する
- [ ] 100行のファイルの解析が50ms以内に完了する
- [ ] 1000行のファイルの解析が200ms以内に完了する
- [ ] メモリ使用量が1ファイルあたり10MB以下である

**測定方法**:
```typescript
test("performance: 100行のファイルを50ms以内で解析", () => {
  const startTime = performance.now();
  const result = analyzer.analyze(sourceFile);
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(50);
});
```

---

### NFR-0201-002: 信頼性

**説明**: エラー耐性と部分的成功の実装

**受け入れ基準**:
- [ ] 構文エラーのあるファイルでも部分的に解析できる
- [ ] エラー情報が構造化されて返される
- [ ] エラーが発生しても例外がスローされない（部分成功）
- [ ] エラーメッセージが明確で具体的である

**テストケース**:
1. 構文エラーのあるファイルを解析し、success: falseを返す
2. 部分的に解析可能な要素を返す
3. エラー情報にファイル名・行番号・エラーメッセージが含まれる

---

### NFR-0201-003: 保守性

**説明**: コードの可読性と保守性の確保

**受け入れ基準**:
- [ ] 全てのpublic APIにJSDocが記述されている
- [ ] private メソッドにもコメントが記述されている
- [ ] 複雑な処理には説明コメントがある
- [ ] 型定義が明確である
- [ ] 循環依存がない

**検証方法**:
- TypeScript strict modeでコンパイル
- JSDocカバレッジ100%確認
- 依存関係グラフの検証

---

### NFR-0201-004: テスト容易性

**説明**: テストが容易な設計

**受け入れ基準**:
- [ ] 依存関係が注入可能である
- [ ] 各メソッドが単独でテスト可能である
- [ ] モック化が容易である
- [ ] テストカバレッジが80%以上である

---

### NFR-0201-005: 拡張性

**説明**: 後続タスクでの拡張が容易な設計

**受け入れ基準**:
- [ ] 新しいノードタイプの追加が容易である
- [ ] Visitorパターンで拡張可能である
- [ ] インターフェースが安定している
- [ ] 後方互換性が保たれる

---

## 技術仕様

### TypeScript Compiler API使用箇所

#### 1. SourceFile取得
```typescript
const program = compilerHost.createProgram([filePath]);
const sourceFile = program.getSourceFile(filePath);
```

#### 2. AST走査
```typescript
ts.forEachChild(sourceFile, (node) => {
  // ノード処理
});
```

#### 3. ノード種別判定
```typescript
if (ts.isFunctionDeclaration(node)) {
  // 関数として処理
}
if (ts.isClassDeclaration(node)) {
  // クラスとして処理
}
```

#### 4. 位置情報取得
```typescript
const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
```

---

### データ構造と型定義

#### StructureAnalysisResult
```typescript
/**
 * 構造解析結果
 */
export interface StructureAnalysisResult {
  /** 解析対象ファイルパス */
  filePath: string;

  /** 解析実行日時 (Unix timestamp) */
  timestamp: number;

  /** 解析が完全に成功したか */
  success: boolean;

  /** 抽出された関数一覧 */
  functions: FunctionInfo[];

  /** 抽出されたクラス一覧 */
  classes: ClassInfo[];

  /** 解析エラー（あれば） */
  errors?: ParseError[];
}
```

#### FunctionInfo
```typescript
/**
 * 関数情報（基本構造のみ、TASK-0202で詳細化）
 */
export interface FunctionInfo {
  /** 関数名 */
  name: string;

  /** 位置情報 */
  location: Location;

  /** エクスポートされているか */
  exported: boolean;
}
```

#### ClassInfo
```typescript
/**
 * クラス情報（基本構造のみ、TASK-0203で詳細化）
 */
export interface ClassInfo {
  /** クラス名 */
  name: string;

  /** 位置情報 */
  location: Location;

  /** エクスポートされているか */
  exported: boolean;
}
```

#### Location
```typescript
/**
 * ソースコード内の位置情報
 */
export interface Location {
  /** ファイルパス */
  file: string;

  /** 開始位置 */
  start: Position;

  /** 終了位置 */
  end: Position;
}

/**
 * 位置 (行と列)
 */
export interface Position {
  /** 行番号 (1-indexed) */
  line: number;

  /** 列番号 (1-indexed) */
  column: number;

  /** オフセット (0-indexed) */
  offset?: number;
}
```

#### ParseError
```typescript
/**
 * 解析エラー
 */
export interface ParseError {
  /** エラーコード */
  code: string;

  /** エラーメッセージ */
  message: string;

  /** エラーの重大度 */
  severity: "error" | "warning" | "info";

  /** 位置情報 */
  location?: Location;
}
```

#### AnalyzerConfig
```typescript
/**
 * Analyzer設定
 */
export interface AnalyzerConfig {
  /** 詳細モードか */
  detailedMode: boolean;

  /** タイムアウト (ms) */
  timeout: number;

  /** エラー時の動作（throw or return partial） */
  errorHandling: "throw" | "partial";
}
```

---

### エラーハンドリング方針

#### エラー種別と対応

| エラー種別 | 対応方法 | severity |
|-----------|---------|----------|
| 構文エラー | 部分的に解析、errors配列に追加 | error |
| ファイル未取得 | 空の結果を返す、errors配列に追加 | error |
| ノード解析エラー | そのノードをスキップ、errors配列に追加 | warning |
| タイムアウト | 途中結果を返す、errors配列に追加 | warning |

#### エラーハンドリングパターン
```typescript
analyze(sourceFile: ts.SourceFile): StructureAnalysisResult {
  const errors: ParseError[] = [];

  try {
    // メイン処理
    this.traverseNode(sourceFile, context);
  } catch (error) {
    errors.push({
      code: "TRAVERSAL_ERROR",
      message: error.message,
      severity: "error",
    });
  }

  return {
    filePath: sourceFile.fileName,
    timestamp: Date.now(),
    success: errors.length === 0,
    functions: this.collectedFunctions,
    classes: this.collectedClasses,
    errors: errors.length > 0 ? errors : undefined,
  };
}
```

---

## 制約事項

### 技術的制約

1. **TypeScript Compiler API依存**
   - TypeScript 5.9.3以上が必要
   - ts.forEachChild()の動作に依存

2. **Phase 1基盤依存**
   - CompilerHostが正常に動作している必要がある
   - SourceFileCacheが利用可能である必要がある

3. **メモリ制約**
   - 1ファイルあたり10MB以下のメモリ使用
   - 大規模ファイル（10,000行以上）は対象外（Phase 3で対応）

### 機能的制約

1. **基本構造のみ抽出**
   - 本タスクでは関数名・クラス名・位置情報のみ
   - 詳細情報（パラメータ、戻り値型等）はTASK-0202以降で実装

2. **TypeScript/JavaScript限定**
   - 本タスクではTS/JSのみ対応
   - 他言語対応はPhase 2以降

3. **シンプルな構造のみ**
   - ネストされた関数・クラスの基本情報のみ
   - 複雑な構造（デコレータ、ジェネリック等）の詳細はTASK-0202以降

---

## テスト戦略

### テストレベル

#### 1. 単体テスト (Unit Tests)

**ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

**テストケース数**: 15-20ケース

**カバレッジ目標**: 80%以上

**テストカテゴリ**:
1. 初期化テスト (3ケース)
   - 正常なインスタンス化
   - 設定を渡したインスタンス化
   - 不正な引数でのエラー

2. analyze()メソッドテスト (5ケース)
   - 空のファイル解析
   - 単純な関数を含むファイル解析
   - クラスを含むファイル解析
   - 構文エラーのあるファイル解析
   - 複雑なネスト構造の解析

3. ASTトラバーサルテスト (4ケース)
   - 単純なAST走査
   - ネストされたAST走査
   - 深い階層のAST走査
   - 空のAST走査

4. 結果集約テスト (3ケース)
   - 複数要素の集約
   - エラー情報の集約
   - 空の結果の集約

5. 位置情報テスト (3ケース)
   - 関数の位置情報取得
   - クラスの位置情報取得
   - ネストされた要素の位置情報取得

#### 2. 統合テスト (Integration Tests)

**ファイル**: `tests/analyzers/structure/integration.test.ts`

**テストケース数**: 5-8ケース

**テストシナリオ**:
1. CompilerHostと連携したファイル解析
2. 実際のTypeScriptファイルの解析
3. 複数ファイルの連続解析
4. キャッシュを利用した高速解析

#### 3. エッジケーステスト (Edge Case Tests)

**ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

**テストケース数**: 8-10ケース

**テストシナリオ**:
1. 0行のファイル
2. 10,000行の大規模ファイル
3. コメントのみのファイル
4. 全角文字を含むファイル
5. 特殊な構文（JSX、デコレータ等）
6. 循環参照のあるファイル

#### 4. パフォーマンステスト (Performance Tests)

**ファイル**: `tests/analyzers/structure/performance.test.ts`

**テストケース数**: 5ケース

**テストシナリオ**:
1. 空のファイル解析 (<10ms)
2. 100行のファイル解析 (<50ms)
3. 1000行のファイル解析 (<200ms)
4. 10回連続解析の平均時間
5. メモリ使用量測定

---

### テスト実装例

#### 単体テスト例
```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { StructureAnalyzer } from "../../../src/analyzers/structure/StructureAnalyzer";
import { CompilerHost } from "../../../src/compiler/CompilerHost";

describe("StructureAnalyzer", () => {
  let compilerHost: CompilerHost;
  let analyzer: StructureAnalyzer;

  beforeEach(() => {
    compilerHost = new CompilerHost({
      compilerOptions: {},
      workspaceRoot: "/test",
    });

    analyzer = new StructureAnalyzer(compilerHost, {
      detailedMode: false,
      timeout: 5000,
      errorHandling: "partial",
    });
  });

  test("空のファイルを解析できる", () => {
    const sourceFile = createEmptySourceFile();
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.functions).toEqual([]);
    expect(result.classes).toEqual([]);
    expect(result.errors).toBeUndefined();
  });

  test("単純な関数を含むファイルを解析できる", () => {
    const code = `
      function hello() {
        console.log("Hello");
      }
    `;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(true);
    expect(result.functions).toHaveLength(1);
    expect(result.functions[0].name).toBe("hello");
    expect(result.functions[0].location.start.line).toBe(2);
  });

  test("構文エラーのあるファイルでも部分的に解析できる", () => {
    const code = `
      function hello() {
        console.log("Hello"
      } // 構文エラー: )が不足
    `;
    const sourceFile = createSourceFile(code);
    const result = analyzer.analyze(sourceFile);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});
```

#### パフォーマンステスト例
```typescript
test("100行のファイルを50ms以内で解析", () => {
  const code = generateCodeWithLines(100);
  const sourceFile = createSourceFile(code);

  const startTime = performance.now();
  const result = analyzer.analyze(sourceFile);
  const endTime = performance.now();

  expect(result.success).toBe(true);
  expect(endTime - startTime).toBeLessThan(50);
});
```

---

## 成功基準

### 完了条件チェックリスト

#### 実装完了
- [ ] StructureAnalyzerクラスが実装されている
- [ ] analyze()メソッドが実装されている
- [ ] ASTトラバーサル機能が実装されている
- [ ] 結果集約ロジックが実装されている
- [ ] 位置情報取得機能が実装されている

#### テスト完了
- [ ] 単体テストが15ケース以上実装されている
- [ ] 統合テストが5ケース以上実装されている
- [ ] エッジケーステストが8ケース以上実装されている
- [ ] パフォーマンステストが5ケース実装されている
- [ ] 全テストが100%通過している
- [ ] テストカバレッジが80%以上である

#### 非機能要件達成
- [ ] 空のファイル解析が10ms以内に完了する
- [ ] 100行のファイル解析が50ms以内に完了する
- [ ] 1000行のファイル解析が200ms以内に完了する
- [ ] メモリ使用量が1ファイルあたり10MB以下である
- [ ] TypeScript strict modeでコンパイルエラーがない

#### ドキュメント完了
- [ ] 全public APIにJSDocが記述されている
- [ ] 型定義が`src/analyzers/types.ts`に追加されている
- [ ] 実装ガイドが作成されている
- [ ] テストドキュメントが作成されている

---

## 参考資料

### Phase 1で実装した基盤

1. **CompilerHost** (`src/compiler/CompilerHost.ts`)
   - TypeScript Programの作成
   - Diagnosticsの取得

2. **ProgramManager** (`src/compiler/ProgramManager.ts`)
   - Programインスタンスのキャッシング
   - LRU方式のメモリ管理

3. **SourceFileCache** (`src/compiler/SourceFileCache.ts`)
   - SourceFileのキャッシング
   - mtime基準の無効化

### TypeScript Compiler API資料

1. **公式ドキュメント**
   - [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
   - [AST Viewer](https://ts-ast-viewer.com/)

2. **主要API**
   - `ts.forEachChild()` - AST走査
   - `ts.isFunctionDeclaration()` - 関数判定
   - `ts.isClassDeclaration()` - クラス判定
   - `sourceFile.getLineAndCharacterOfPosition()` - 位置情報取得

### プロジェクト内資料

1. **設計文書**
   - `docs/design/code-analysis/architecture.md` - システムアーキテクチャ
   - `docs/design/code-analysis/interfaces.ts` - 型定義

2. **要件文書**
   - `docs/spec/code-analysis-requirements.md` - 全体要件

3. **タスク文書**
   - `docs/tasks/code-analysis-phase2.md` - Phase 2タスク一覧

4. **Phase 1成果物**
   - `docs/reports/phase1-completion-report.md` - Phase 1完了レポート

---

## 付録

### A. 実装の優先順位

1. **高優先度** (本タスクで必須)
   - StructureAnalyzerクラスの基本構造
   - analyze()メソッドの実装
   - ASTトラバーサル基盤
   - 位置情報取得

2. **中優先度** (本タスクで実装)
   - エラーハンドリング
   - 結果集約ロジック
   - パフォーマンス最適化

3. **低優先度** (後続タスクで実装)
   - 詳細な関数情報抽出（TASK-0202）
   - 詳細なクラス情報抽出（TASK-0203）
   - メソッド・プロパティの詳細（TASK-0204, 0205）

### B. 後続タスクとの関係

```
TASK-0201: StructureAnalyzer基盤実装
    ↓ 基盤を提供
TASK-0202: Function抽出機能実装
    ↓ FunctionInfoを詳細化
TASK-0203: Class抽出機能実装
    ↓ ClassInfoを詳細化
TASK-0204: Classメソッド詳細抽出
    ↓ メソッド情報を追加
TASK-0205: Classプロパティ抽出
    ↓ プロパティ情報を追加
TASK-0206: StructureAnalyzer統合とテスト
    ↓ 全機能統合
```

### C. よくある実装パターン

#### Visitorパターンの実装
```typescript
class StructureAnalyzer {
  private visitNode(node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        this.visitFunctionDeclaration(node as ts.FunctionDeclaration);
        break;
      case ts.SyntaxKind.ClassDeclaration:
        this.visitClassDeclaration(node as ts.ClassDeclaration);
        break;
      default:
        // 子ノードを走査
        ts.forEachChild(node, child => this.visitNode(child));
    }
  }
}
```

#### エラーハンドリングパターン
```typescript
private safeVisitNode(node: ts.Node): void {
  try {
    this.visitNode(node);
  } catch (error) {
    this.errors.push({
      code: "NODE_VISIT_ERROR",
      message: `Failed to visit node: ${error.message}`,
      severity: "warning",
      location: this.getLocation(node),
    });
  }
}
```

---

**作成日**: 2025-11-05
**作成者**: Code Analysis Team
**承認**: ✅ Phase 2 TDD Requirements フェーズ
**次ステップ**: TASK-0201 tdd-testcases フェーズへ移行
