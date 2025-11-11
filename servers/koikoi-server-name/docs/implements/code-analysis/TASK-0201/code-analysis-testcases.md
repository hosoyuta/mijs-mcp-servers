# TASK-0201: StructureAnalyzer基盤実装 - テストケース仕様書

## 実行日時
2025-11-05

## テスト戦略サマリー

### テストケース総数
- **総テストケース数**: 42個
- **単体テスト**: 20個
- **統合テスト**: 7個
- **エッジケーステスト**: 10個
- **パフォーマンステスト**: 5個

### カバレッジ目標
- **行カバレッジ**: 80%以上
- **分岐カバレッジ**: 75%以上
- **関数カバレッジ**: 90%以上

### テストフレームワーク
- **フレームワーク**: bun:test
- **テストランナー**: bun test
- **アサーションライブラリ**: bun:test (expect)

---

## 単体テストケース (Unit Tests)

### カテゴリ1: 初期化とインスタンス化 (3ケース)

#### TC-0201-U-001: CompilerHostを渡してインスタンス化できる
**対応要件**: FR-0201-001
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- 有効なCompilerHostインスタンスを渡す
- デフォルトのAnalyzerConfigで初期化
- エラーなくインスタンスが生成される

**期待結果**:
```typescript
const analyzer = new StructureAnalyzer(compilerHost, defaultConfig);
expect(analyzer).toBeDefined();
expect(analyzer).toBeInstanceOf(StructureAnalyzer);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-002: カスタム設定でインスタンス化できる
**対応要件**: FR-0201-001
**テストタイプ**: 正常系
**優先度**: P1 (High)

**テスト内容**:
- カスタムAnalyzerConfigを渡す
- 設定が正しく適用される
- 初期化が1ms以内に完了する

**期待結果**:
```typescript
const config: AnalyzerConfig = {
  detailedMode: true,
  timeout: 10000,
  errorHandling: "throw"
};
const startTime = performance.now();
const analyzer = new StructureAnalyzer(compilerHost, config);
const endTime = performance.now();

expect(analyzer).toBeDefined();
expect(endTime - startTime).toBeLessThan(1);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-003: nullを渡すとエラーが発生する
**対応要件**: FR-0201-001
**テストタイプ**: 異常系
**優先度**: P1 (High)

**テスト内容**:
- CompilerHostにnullを渡す
- 適切なエラーメッセージが返される
- エラーがスローされる

**期待結果**:
```typescript
expect(() => {
  // @ts-expect-error - Testing runtime error handling
  new StructureAnalyzer(null, config);
}).toThrow("CompilerHost is required");
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

### カテゴリ2: analyze()メソッド基本動作 (5ケース)

#### TC-0201-U-004: 空のSourceFileで正常終了
**対応要件**: FR-0201-002
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- 空のTypeScriptファイルのSourceFileを渡す
- エラーなく完了する
- 結果が空の配列を含むStructureAnalysisResultである

**期待結果**:
```typescript
const emptySource = ts.createSourceFile(
  "empty.ts",
  "",
  ts.ScriptTarget.ES2022,
  true
);
const result = analyzer.analyze(emptySource);

expect(result.success).toBe(true);
expect(result.filePath).toBe("empty.ts");
expect(result.functions).toEqual([]);
expect(result.classes).toEqual([]);
expect(result.errors).toBeUndefined();
expect(result.timestamp).toBeGreaterThan(0);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-005: 単純な関数を含むファイルを解析できる
**対応要件**: FR-0201-002
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- 1つの関数宣言を含むファイルを解析
- 関数名、位置情報が正確に抽出される
- エクスポート状態が正しく認識される

**期待結果**:
```typescript
const code = `
export function hello() {
  console.log("Hello");
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions).toHaveLength(1);
expect(result.functions[0].name).toBe("hello");
expect(result.functions[0].exported).toBe(true);
expect(result.functions[0].location.start.line).toBe(2);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-006: クラスを含むファイルを解析できる
**対応要件**: FR-0201-002
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- 1つのクラス宣言を含むファイルを解析
- クラス名、位置情報が正確に抽出される
- エクスポート状態が正しく認識される

**期待結果**:
```typescript
const code = `
class User {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.classes).toHaveLength(1);
expect(result.classes[0].name).toBe("User");
expect(result.classes[0].exported).toBe(false);
expect(result.classes[0].location.start.line).toBe(2);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-007: 構文エラーのあるファイルでも部分成功する
**対応要件**: FR-0201-002, NFR-0201-002
**テストタイプ**: 異常系
**優先度**: P0 (Critical)

**テスト内容**:
- 構文エラーを含むファイルを解析
- success: falseが返される
- エラー情報がerrors配列に含まれる
- 例外はスローされない

**期待結果**:
```typescript
const code = `
function hello() {
  console.log("Hello"
} // 構文エラー: 閉じ括弧不足
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(false);
expect(result.errors).toBeDefined();
expect(result.errors!.length).toBeGreaterThan(0);
expect(result.errors![0].severity).toBe("error");
expect(result.errors![0].message).toBeDefined();
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-008: 複数の関数とクラスを含むファイルを解析できる
**対応要件**: FR-0201-002, FR-0201-004
**テストタイプ**: 正常系
**優先度**: P1 (High)

**テスト内容**:
- 複数の関数とクラスを含むファイルを解析
- すべての要素が正しく抽出される
- 結果が正しく集約される

**期待結果**:
```typescript
const code = `
function foo() {}
function bar() {}
class MyClass {}
class AnotherClass {}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions).toHaveLength(2);
expect(result.classes).toHaveLength(2);
expect(result.functions.map(f => f.name)).toEqual(["foo", "bar"]);
expect(result.classes.map(c => c.name)).toEqual(["MyClass", "AnotherClass"]);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

### カテゴリ3: ASTトラバーサル基盤 (4ケース)

#### TC-0201-U-009: 基本的なAST走査が動作する
**対応要件**: FR-0201-003
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- シンプルな構造のASTを走査
- ts.forEachChildが正しく使用される
- すべてのノードが訪問される

**期待結果**:
```typescript
const code = `
function hello() {
  return "world";
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.functions).toHaveLength(1);
expect(result.functions[0].name).toBe("hello");
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-010: ネストされた構造を正しく走査できる
**対応要件**: FR-0201-003
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- クラス内のメソッドなど、ネストされた構造を走査
- 親子関係が正しく認識される
- 位置情報が正確に取得される

**期待結果**:
```typescript
const code = `
class MyClass {
  method1() {}
  method2() {}
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.classes).toHaveLength(1);
expect(result.classes[0].name).toBe("MyClass");
// ネストされたメソッドも認識される（後続タスクで詳細実装）
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-011: 深い階層のネスト構造を走査できる
**対応要件**: FR-0201-003
**テストタイプ**: 正常系
**優先度**: P2 (Medium)

**テスト内容**:
- 10階層程度のネストされた構造を走査
- スタックオーバーフローが発生しない
- 正常に完了する

**期待結果**:
```typescript
const code = `
function level1() {
  function level2() {
    function level3() {
      function level4() {
        function level5() {
          return "deep";
        }
      }
    }
  }
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions.length).toBeGreaterThanOrEqual(1);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-012: 空のASTを走査してもエラーが発生しない
**対応要件**: FR-0201-003
**テストタイプ**: 境界値
**優先度**: P1 (High)

**テスト内容**:
- 空のSourceFileを走査
- エラーが発生しない
- 空の結果が返される

**期待結果**:
```typescript
const emptySource = ts.createSourceFile("empty.ts", "", ts.ScriptTarget.ES2022);
const result = analyzer.analyze(emptySource);

expect(result.success).toBe(true);
expect(result.functions).toEqual([]);
expect(result.classes).toEqual([]);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

### カテゴリ4: 結果集約ロジック (3ケース)

#### TC-0201-U-013: 複数要素を正しく集約できる
**対応要件**: FR-0201-004
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- 複数の関数とクラスを含むファイルを解析
- 結果が配列として正しく集約される
- 順序が保たれる

**期待結果**:
```typescript
const code = `
function first() {}
class Second {}
function third() {}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.functions).toHaveLength(2);
expect(result.classes).toHaveLength(1);
expect(result.functions[0].name).toBe("first");
expect(result.functions[1].name).toBe("third");
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-014: エラー情報を含めて集約できる
**対応要件**: FR-0201-004, NFR-0201-002
**テストタイプ**: 正常系
**優先度**: P1 (High)

**テスト内容**:
- エラーのあるファイルを解析
- エラー情報がerrors配列に集約される
- success: falseが設定される

**期待結果**:
```typescript
const code = `function broken() { // 不完全な関数`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(false);
expect(result.errors).toBeDefined();
expect(result.errors!.length).toBeGreaterThan(0);
expect(result.errors![0].code).toBeDefined();
expect(result.errors![0].message).toBeDefined();
expect(result.errors![0].severity).toBe("error");
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-015: 要素が0個でも正しく集約できる
**対応要件**: FR-0201-004
**テストタイプ**: 境界値
**優先度**: P1 (High)

**テスト内容**:
- コメントのみのファイルを解析
- 空の配列が返される
- メタデータは正しく設定される

**期待結果**:
```typescript
const code = `
// これはコメントです
/* 複数行
   コメント */
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions).toEqual([]);
expect(result.classes).toEqual([]);
expect(result.filePath).toBeDefined();
expect(result.timestamp).toBeGreaterThan(0);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

### カテゴリ5: 位置情報取得 (5ケース)

#### TC-0201-U-016: 関数の位置情報を正確に取得できる
**対応要件**: FR-0201-005
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- 関数の開始位置と終了位置を取得
- 行番号が1-indexedである
- 列番号が1-indexedである

**期待結果**:
```typescript
const code = `
function hello() {
  return "world";
}
`;
const result = analyzer.analyze(createSourceFile("test.ts", code));

expect(result.functions[0].location.file).toBe("test.ts");
expect(result.functions[0].location.start.line).toBe(2);
expect(result.functions[0].location.start.column).toBeGreaterThan(0);
expect(result.functions[0].location.end.line).toBeGreaterThan(2);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-017: クラスの位置情報を正確に取得できる
**対応要件**: FR-0201-005
**テストタイプ**: 正常系
**優先度**: P0 (Critical)

**テスト内容**:
- クラスの開始位置と終了位置を取得
- 複数行にまたがるクラスの位置を正確に取得

**期待結果**:
```typescript
const code = `
class MyClass {
  prop1: string;
  prop2: number;
}
`;
const result = analyzer.analyze(createSourceFile("test.ts", code));

expect(result.classes[0].location.start.line).toBe(2);
expect(result.classes[0].location.end.line).toBe(5);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-018: ファイルの先頭（1行1列）を正しく取得できる
**対応要件**: FR-0201-005
**テストタイプ**: 境界値
**優先度**: P1 (High)

**テスト内容**:
- ファイル先頭から始まる要素の位置を取得
- 行番号が1である
- 列番号が1である

**期待結果**:
```typescript
const code = `function first() {}`;
const result = analyzer.analyze(createSourceFile("test.ts", code));

expect(result.functions[0].location.start.line).toBe(1);
expect(result.functions[0].location.start.column).toBe(1);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-019: ファイルの末尾を正しく取得できる
**対応要件**: FR-0201-005
**テストタイプ**: 境界値
**優先度**: P1 (High)

**テスト内容**:
- ファイル末尾の要素の位置を取得
- 終了位置が正確である

**期待結果**:
```typescript
const code = `function last() {\n  return "end";\n}`;
const result = analyzer.analyze(createSourceFile("test.ts", code));

const func = result.functions[0];
expect(func.location.end.line).toBe(3);
expect(func.location.end.column).toBeGreaterThan(0);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

#### TC-0201-U-020: オフセット情報が正しく記録される
**対応要件**: FR-0201-005
**テストタイプ**: 正常系
**優先度**: P2 (Medium)

**テスト内容**:
- 位置情報にオフセット（0-indexed）が含まれる
- オフセットが正確である

**期待結果**:
```typescript
const code = `function test() {}`;
const result = analyzer.analyze(createSourceFile("test.ts", code));

expect(result.functions[0].location.start.offset).toBe(0);
expect(result.functions[0].location.end.offset).toBeGreaterThan(0);
```

**実装ファイル**: `tests/analyzers/structure/StructureAnalyzer.test.ts`

---

## 統合テストケース (Integration Tests)

### TC-0201-I-001: CompilerHostと連携してファイルを解析
**対応要件**: FR-0201-001, FR-0201-002
**テストタイプ**: 統合
**優先度**: P0 (Critical)

**テスト内容**:
- 実際のCompilerHostを使用
- 実ファイルからProgramを作成
- SourceFileを取得して解析

**期待結果**:
```typescript
const compilerHost = new CompilerHost({
  rootPath: testWorkspace,
  compilerOptions: {}
});

const filePath = resolve(testWorkspace, "sample-simple.ts");
const program = compilerHost.createProgram([filePath]);
const sourceFile = program.getSourceFile(filePath);

const analyzer = new StructureAnalyzer(compilerHost, defaultConfig);
const result = analyzer.analyze(sourceFile!);

expect(result.success).toBe(true);
expect(result.filePath).toContain("sample-simple.ts");
```

**実装ファイル**: `tests/analyzers/structure/integration.test.ts`

---

### TC-0201-I-002: 実際のTypeScriptファイルを解析
**対応要件**: FR-0201-002, FR-0201-003
**テストタイプ**: 統合
**優先度**: P0 (Critical)

**テスト内容**:
- プロジェクト内の実際のTypeScriptファイルを解析
- 関数とクラスが正しく抽出される
- 位置情報が正確である

**期待結果**:
```typescript
const result = analyzer.analyze(sourceFile);

expect(result.success).toBe(true);
expect(result.functions.length).toBeGreaterThan(0);
// 実ファイルの内容に応じた検証
```

**実装ファイル**: `tests/analyzers/structure/integration.test.ts`

---

### TC-0201-I-003: 複数ファイルを連続して解析
**対応要件**: FR-0201-002, NFR-0201-001
**テストタイプ**: 統合
**優先度**: P1 (High)

**テスト内容**:
- 複数のファイルを連続して解析
- 各ファイルの結果が独立している
- メモリリークが発生しない

**期待結果**:
```typescript
const files = ["file1.ts", "file2.ts", "file3.ts"];
const results = files.map(file => {
  const program = compilerHost.createProgram([file]);
  const sourceFile = program.getSourceFile(file);
  return analyzer.analyze(sourceFile!);
});

expect(results).toHaveLength(3);
expect(results.every(r => r.success)).toBe(true);
```

**実装ファイル**: `tests/analyzers/structure/integration.test.ts`

---

### TC-0201-I-004: ProgramManagerのキャッシュと連携
**対応要件**: FR-0201-001, NFR-0201-001
**テストタイプ**: 統合
**優先度**: P1 (High)

**テスト内容**:
- ProgramManagerのキャッシュ機能と連携
- キャッシュされたProgramを利用して解析
- パフォーマンスが向上する

**期待結果**:
```typescript
// 1回目: キャッシュなし
const result1 = analyzeWithCache(filePath);

// 2回目: キャッシュあり
const startTime = performance.now();
const result2 = analyzeWithCache(filePath);
const endTime = performance.now();

expect(result2.success).toBe(true);
expect(endTime - startTime).toBeLessThan(10); // キャッシュで高速化
```

**実装ファイル**: `tests/analyzers/structure/integration.test.ts`

---

### TC-0201-I-005: SourceFileCacheと連携
**対応要件**: FR-0201-001, NFR-0201-001
**テストタイプ**: 統合
**優先度**: P1 (High)

**テスト内容**:
- SourceFileCacheのキャッシュ機能と連携
- キャッシュされたSourceFileを利用して解析
- mtime変更時に再解析される

**期待結果**:
```typescript
const cache = new SourceFileCache(100);
const sourceFile1 = cache.get(filePath, () => getSourceFile(filePath));

const result = analyzer.analyze(sourceFile1!);
expect(result.success).toBe(true);

// キャッシュから取得
const sourceFile2 = cache.get(filePath, () => getSourceFile(filePath));
expect(sourceFile2).toBe(sourceFile1); // 同一インスタンス
```

**実装ファイル**: `tests/analyzers/structure/integration.test.ts`

---

### TC-0201-I-006: エラーハンドリングの統合テスト
**対応要件**: NFR-0201-002
**テストタイプ**: 統合
**優先度**: P1 (High)

**テスト内容**:
- 実際の構文エラーファイルを解析
- CompilerHostのDiagnosticsと連携
- エラー情報が正しく伝播される

**期待結果**:
```typescript
const errorFile = resolve(testWorkspace, "sample-error.ts");
const program = compilerHost.createProgram([errorFile]);
const diagnostics = compilerHost.getDiagnostics(program);
const sourceFile = program.getSourceFile(errorFile);

const result = analyzer.analyze(sourceFile!);

expect(result.success).toBe(false);
expect(result.errors).toBeDefined();
expect(diagnostics.length).toBeGreaterThan(0);
```

**実装ファイル**: `tests/analyzers/structure/integration.test.ts`

---

### TC-0201-I-007: TypeCheckerとの連携（将来拡張）
**対応要件**: FR-0201-001
**テストタイプ**: 統合
**優先度**: P2 (Medium)

**テスト内容**:
- TypeCheckerを使用した型情報取得の基盤確認
- 後続タスクでの拡張可能性を検証

**期待結果**:
```typescript
const program = compilerHost.createProgram([filePath]);
const typeChecker = program.getTypeChecker();
const sourceFile = program.getSourceFile(filePath);

const result = analyzer.analyze(sourceFile!);

expect(result.success).toBe(true);
expect(typeChecker).toBeDefined();
// 型情報取得は後続タスクで実装
```

**実装ファイル**: `tests/analyzers/structure/integration.test.ts`

---

## エッジケーステスト (Edge Case Tests)

### TC-0201-E-001: 0行のファイル
**対応要件**: FR-0201-002
**テストタイプ**: 境界値
**優先度**: P0 (Critical)

**テスト内容**:
- 完全に空のファイルを解析
- エラーが発生しない
- 空の結果が返される

**期待結果**:
```typescript
const emptySource = ts.createSourceFile("empty.ts", "", ts.ScriptTarget.ES2022);
const result = analyzer.analyze(emptySource);

expect(result.success).toBe(true);
expect(result.functions).toEqual([]);
expect(result.classes).toEqual([]);
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-002: コメントのみのファイル
**対応要件**: FR-0201-002
**テストタイプ**: エッジケース
**優先度**: P1 (High)

**テスト内容**:
- コメントのみのファイルを解析
- 構造要素がない場合の動作確認

**期待結果**:
```typescript
const code = `
// Line comment
/* Block comment */
/**
 * JSDoc comment
 */
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions).toEqual([]);
expect(result.classes).toEqual([]);
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-003: 全角文字を含むファイル
**対応要件**: FR-0201-002
**テストタイプ**: エッジケース
**優先度**: P1 (High)

**テスト内容**:
- 全角文字を含む関数名・クラス名を解析
- Unicode文字が正しく扱われる

**期待結果**:
```typescript
const code = `
function こんにちは() {
  return "世界";
}

class ユーザー {
  名前: string;
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions[0].name).toBe("こんにちは");
expect(result.classes[0].name).toBe("ユーザー");
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-004: 特殊な構文 (アロー関数、関数式)
**対応要件**: FR-0201-003
**テストタイプ**: エッジケース
**優先度**: P1 (High)

**テスト内容**:
- アロー関数、関数式などの特殊な構文
- 基本的な認識ができる（詳細は後続タスク）

**期待結果**:
```typescript
const code = `
const arrowFunc = () => {};
const funcExpr = function() {};
const namedFuncExpr = function myFunc() {};
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
// 本タスクでは関数宣言のみ対応、関数式は後続タスクで実装
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-005: JSXを含むファイル
**対応要件**: FR-0201-003
**テストタイプ**: エッジケース
**優先度**: P2 (Medium)

**テスト内容**:
- JSX構文を含むファイルを解析
- エラーが発生しない（詳細はスキップ）

**期待結果**:
```typescript
const code = `
function Component() {
  return <div>Hello</div>;
}
`;
const result = analyzer.analyze(createSourceFile(code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX));

expect(result.success).toBe(true);
expect(result.functions[0].name).toBe("Component");
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-006: デコレータを含むファイル
**対応要件**: FR-0201-003
**テストタイプ**: エッジケース
**優先度**: P2 (Medium)

**テスト内容**:
- TypeScriptデコレータを含むファイルを解析
- 基本的な構造が認識される

**期待結果**:
```typescript
const code = `
@decorator
class MyClass {
  @propertyDecorator
  prop: string;
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.classes[0].name).toBe("MyClass");
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-007: ジェネリクスを含むファイル
**対応要件**: FR-0201-003
**テストタイプ**: エッジケース
**優先度**: P2 (Medium)

**テスト内容**:
- ジェネリック型を含む関数・クラスを解析
- 基本的な構造が認識される

**期待結果**:
```typescript
const code = `
function identity<T>(arg: T): T {
  return arg;
}

class Container<T> {
  value: T;
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions[0].name).toBe("identity");
expect(result.classes[0].name).toBe("Container");
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-008: 非常に長い行を含むファイル
**対応要件**: NFR-0201-001
**テストタイプ**: エッジケース
**優先度**: P2 (Medium)

**テスト内容**:
- 10,000文字以上の行を含むファイルを解析
- パフォーマンスが許容範囲内
- エラーが発生しない

**期待結果**:
```typescript
const longLine = "a".repeat(10000);
const code = `function test() { const x = "${longLine}"; }`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions[0].name).toBe("test");
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-009: 特殊な文字エンコーディング
**対応要件**: FR-0201-002
**テストタイプ**: エッジケース
**優先度**: P2 (Medium)

**テスト内容**:
- 絵文字、特殊Unicode文字を含むファイルを解析
- 位置情報が正確に取得される

**期待結果**:
```typescript
const code = `
function 🚀rocket() {
  return "🌟";
}
`;
const result = analyzer.analyze(createSourceFile(code));

expect(result.success).toBe(true);
expect(result.functions[0].name).toBe("🚀rocket");
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

### TC-0201-E-010: 不正なノードタイプのハンドリング
**対応要件**: FR-0201-003, NFR-0201-002
**テストタイプ**: エッジケース
**優先度**: P1 (High)

**テスト内容**:
- 予期しないノードタイプに遭遇した場合
- エラーハンドリングが正しく動作する
- 例外がスローされない

**期待結果**:
```typescript
// TypeScript Compiler APIが返す可能性のある特殊なノード
const result = analyzer.analyze(specialSourceFile);

expect(result.success).toBeDefined(); // trueまたはfalse
// 例外がスローされないことを確認
```

**実装ファイル**: `tests/analyzers/structure/edge-cases.test.ts`

---

## パフォーマンステスト (Performance Tests)

### TC-0201-P-001: 空のファイル解析 <10ms
**対応要件**: NFR-0201-001
**テストタイプ**: パフォーマンス
**優先度**: P0 (Critical)

**テスト内容**:
- 空のファイルを解析
- 処理時間が10ms以内

**期待結果**:
```typescript
const emptySource = ts.createSourceFile("empty.ts", "", ts.ScriptTarget.ES2022);

const startTime = performance.now();
const result = analyzer.analyze(emptySource);
const endTime = performance.now();

expect(result.success).toBe(true);
expect(endTime - startTime).toBeLessThan(10);
```

**実装ファイル**: `tests/analyzers/structure/performance.test.ts`

---

### TC-0201-P-002: 100行のファイル解析 <50ms
**対応要件**: NFR-0201-001
**テストタイプ**: パフォーマンス
**優先度**: P0 (Critical)

**テスト内容**:
- 100行のファイルを解析
- 処理時間が50ms以内

**期待結果**:
```typescript
const code = generateCodeWithLines(100); // 100行のコード生成
const sourceFile = createSourceFile(code);

const startTime = performance.now();
const result = analyzer.analyze(sourceFile);
const endTime = performance.now();

expect(result.success).toBe(true);
expect(endTime - startTime).toBeLessThan(50);
```

**実装ファイル**: `tests/analyzers/structure/performance.test.ts`

---

### TC-0201-P-003: 1000行のファイル解析 <200ms
**対応要件**: NFR-0201-001
**テストタイプ**: パフォーマンス
**優先度**: P1 (High)

**テスト内容**:
- 1000行のファイルを解析
- 処理時間が200ms以内

**期待結果**:
```typescript
const code = generateCodeWithLines(1000);
const sourceFile = createSourceFile(code);

const startTime = performance.now();
const result = analyzer.analyze(sourceFile);
const endTime = performance.now();

expect(result.success).toBe(true);
expect(endTime - startTime).toBeLessThan(200);
```

**実装ファイル**: `tests/analyzers/structure/performance.test.ts`

---

### TC-0201-P-004: 連続解析の平均時間測定
**対応要件**: NFR-0201-001
**テストタイプ**: パフォーマンス
**優先度**: P1 (High)

**テスト内容**:
- 同じファイルを10回連続で解析
- 平均処理時間を測定
- パフォーマンスが安定している

**期待結果**:
```typescript
const sourceFile = createSourceFile(generateCodeWithLines(100));
const times: number[] = [];

for (let i = 0; i < 10; i++) {
  const startTime = performance.now();
  analyzer.analyze(sourceFile);
  const endTime = performance.now();
  times.push(endTime - startTime);
}

const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
const maxTime = Math.max(...times);
const minTime = Math.min(...times);

expect(averageTime).toBeLessThan(50);
expect(maxTime - minTime).toBeLessThan(20); // 安定性
```

**実装ファイル**: `tests/analyzers/structure/performance.test.ts`

---

### TC-0201-P-005: メモリ使用量測定
**対応要件**: NFR-0201-001
**テストタイプ**: パフォーマンス
**優先度**: P1 (High)

**テスト内容**:
- 1ファイルあたりのメモリ使用量を測定
- メモリ使用量が10MB以下

**期待結果**:
```typescript
const initialMemory = process.memoryUsage().heapUsed;

const sourceFile = createSourceFile(generateCodeWithLines(1000));
const result = analyzer.analyze(sourceFile);

const finalMemory = process.memoryUsage().heapUsed;
const memoryDiff = (finalMemory - initialMemory) / 1024 / 1024; // MB

expect(result.success).toBe(true);
expect(memoryDiff).toBeLessThan(10);
```

**実装ファイル**: `tests/analyzers/structure/performance.test.ts`

---

## テストフィクスチャ計画

### 必要なテストファイル

#### 1. 基本ファイル
- `tests/fixtures/empty.ts` - 完全に空のファイル
- `tests/fixtures/sample-simple.ts` - 単純な関数を含むファイル
- `tests/fixtures/sample-class.ts` - クラスを含むファイル
- `tests/fixtures/sample-mixed.ts` - 関数とクラスを含むファイル

#### 2. エラーファイル
- `tests/fixtures/sample-error.ts` - 構文エラーを含むファイル
- `tests/fixtures/sample-incomplete.ts` - 不完全な構文のファイル

#### 3. 特殊ケースファイル
- `tests/fixtures/sample-unicode.ts` - 全角文字を含むファイル
- `tests/fixtures/sample-emoji.ts` - 絵文字を含むファイル
- `tests/fixtures/sample-jsx.tsx` - JSXを含むファイル
- `tests/fixtures/sample-decorator.ts` - デコレータを含むファイル
- `tests/fixtures/sample-generic.ts` - ジェネリクスを含むファイル

#### 4. パフォーマンステスト用
- `tests/fixtures/sample-large.ts` - 1000行以上の大きなファイル
- 動的生成: `generateCodeWithLines(n)` ヘルパー関数

### テストヘルパー関数

```typescript
// tests/helpers/test-utils.ts

/**
 * SourceFileを作成するヘルパー
 */
export function createSourceFile(
  code: string,
  fileName: string = "test.ts",
  target: ts.ScriptTarget = ts.ScriptTarget.ES2022
): ts.SourceFile {
  return ts.createSourceFile(fileName, code, target, true);
}

/**
 * 指定行数のコードを生成
 */
export function generateCodeWithLines(lineCount: number): string {
  const lines: string[] = [];
  for (let i = 0; i < lineCount; i++) {
    if (i % 10 === 0) {
      lines.push(`function func${i}() { return ${i}; }`);
    } else {
      lines.push(`// Comment line ${i}`);
    }
  }
  return lines.join("\n");
}

/**
 * デフォルトのAnalyzerConfig
 */
export const defaultConfig: AnalyzerConfig = {
  detailedMode: false,
  timeout: 5000,
  errorHandling: "partial",
};
```

---

## テスト実装順序

### Phase 1: 基本機能（P0 優先）
1. TC-0201-U-001: インスタンス化
2. TC-0201-U-004: 空のファイル解析
3. TC-0201-U-005: 単純な関数解析
4. TC-0201-U-006: クラス解析
5. TC-0201-U-016: 関数の位置情報
6. TC-0201-U-017: クラスの位置情報

### Phase 2: エラーハンドリング（P0-P1）
7. TC-0201-U-003: null引数エラー
8. TC-0201-U-007: 構文エラー処理
9. TC-0201-U-014: エラー情報集約

### Phase 3: ASTトラバーサル（P0-P1）
10. TC-0201-U-009: 基本的なAST走査
11. TC-0201-U-010: ネスト構造走査
12. TC-0201-U-012: 空のAST走査

### Phase 4: 結果集約（P0-P1）
13. TC-0201-U-008: 複数要素解析
14. TC-0201-U-013: 複数要素集約
15. TC-0201-U-015: 空の結果集約

### Phase 5: 統合テスト（P0-P1）
16. TC-0201-I-001: CompilerHost連携
17. TC-0201-I-002: 実ファイル解析
18. TC-0201-I-003: 複数ファイル解析
19. TC-0201-I-006: エラーハンドリング統合

### Phase 6: パフォーマンステスト（P0-P1）
20. TC-0201-P-001: 空ファイル <10ms
21. TC-0201-P-002: 100行 <50ms
22. TC-0201-P-003: 1000行 <200ms
23. TC-0201-P-005: メモリ使用量

### Phase 7: エッジケース（P1-P2）
24. TC-0201-E-001: 0行ファイル
25. TC-0201-E-002: コメントのみ
26. TC-0201-E-003: 全角文字
27. TC-0201-E-010: 不正なノード

### Phase 8: その他の機能（P2）
28. 残りのテストケース

---

## テストカバレッジ確認方法

### カバレッジ測定コマンド
```bash
bun test --coverage
```

### カバレッジレポート確認
```bash
# HTML形式でレポート生成
bun test --coverage --coverage-reporter=html
open coverage/index.html
```

### 目標カバレッジ
- **行カバレッジ**: 80%以上
- **分岐カバレッジ**: 75%以上
- **関数カバレッジ**: 90%以上

---

## 要件カバレッジマトリクス

### 機能要件カバレッジ

| 要件ID | 要件名 | テストケース | カバレッジ |
|-------|--------|------------|-----------|
| FR-0201-001 | StructureAnalyzerクラス実装 | TC-0201-U-001, U-002, U-003, I-001 | 100% |
| FR-0201-002 | analyze()メソッド実装 | TC-0201-U-004~U-008, I-002, I-003 | 100% |
| FR-0201-003 | ASTトラバーサル基盤 | TC-0201-U-009~U-012, E-004~E-007 | 100% |
| FR-0201-004 | 結果集約ロジック | TC-0201-U-013~U-015 | 100% |
| FR-0201-005 | 位置情報取得 | TC-0201-U-016~U-020 | 100% |

### 非機能要件カバレッジ

| 要件ID | 要件名 | テストケース | カバレッジ |
|-------|--------|------------|-----------|
| NFR-0201-001 | パフォーマンス | TC-0201-P-001~P-005 | 100% |
| NFR-0201-002 | 信頼性 | TC-0201-U-007, U-014, I-006 | 100% |
| NFR-0201-003 | 保守性 | コードレビュー、JSDocチェック | 手動 |
| NFR-0201-004 | テスト容易性 | 全テストケース | 100% |
| NFR-0201-005 | 拡張性 | アーキテクチャレビュー | 手動 |

---

## 次のフェーズへの準備

### tdd-red フェーズへの移行条件
- [ ] 全42個のテストケースが定義されている
- [ ] 各テストケースに期待結果が明記されている
- [ ] テスト実装順序が決定されている
- [ ] テストフィクスチャ計画が完成している
- [ ] 要件カバレッジが100%である

### 次のフェーズで実施すること
1. テストファイルの作成
2. テストフィクスチャの準備
3. テストヘルパー関数の実装
4. 失敗するテストの実装（Red フェーズ）

---

## 付録

### A. テストケース優先度定義

- **P0 (Critical)**: 基本機能、必須要件
- **P1 (High)**: 重要機能、エラーハンドリング
- **P2 (Medium)**: エッジケース、将来拡張

### B. テストファイル構成

```
tests/
  analyzers/
    structure/
      StructureAnalyzer.test.ts        # 単体テスト (20ケース)
      integration.test.ts              # 統合テスト (7ケース)
      edge-cases.test.ts               # エッジケース (10ケース)
      performance.test.ts              # パフォーマンス (5ケース)
  helpers/
    test-utils.ts                      # テストヘルパー
  fixtures/
    empty.ts
    sample-simple.ts
    sample-class.ts
    sample-mixed.ts
    sample-error.ts
    sample-unicode.ts
    sample-emoji.ts
    sample-jsx.tsx
    sample-decorator.ts
    sample-generic.ts
    sample-large.ts
```

### C. テスト実行スクリプト

```json
{
  "scripts": {
    "test": "bun test",
    "test:structure": "bun test tests/analyzers/structure",
    "test:unit": "bun test tests/analyzers/structure/StructureAnalyzer.test.ts",
    "test:integration": "bun test tests/analyzers/structure/integration.test.ts",
    "test:edge": "bun test tests/analyzers/structure/edge-cases.test.ts",
    "test:perf": "bun test tests/analyzers/structure/performance.test.ts",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch"
  }
}
```

---

**作成日**: 2025-11-05
**作成者**: Code Analysis Team
**承認**: Phase 2 TDD Testcases フェーズ完了
**次ステップ**: TASK-0201 tdd-red フェーズへ移行

---

## サマリー

本テストケース仕様書では、TASK-0201: StructureAnalyzer基盤実装に対して、以下の包括的なテストケースを定義しました：

### テストケース内訳
- **単体テスト**: 20ケース（初期化、analyze、トラバーサル、集約、位置情報）
- **統合テスト**: 7ケース（CompilerHost連携、実ファイル解析、キャッシュ連携）
- **エッジケーステスト**: 10ケース（空ファイル、Unicode、特殊構文、不正ノード）
- **パフォーマンステスト**: 5ケース（速度測定、メモリ測定）

### 要件カバレッジ
- **機能要件**: 5/5（100%）
- **非機能要件**: 5/5（100%）

### 特徴
- Phase 1で確立したテストパターンを踏襲
- bun:testフレームワークを使用
- 具体的な期待結果とコード例を記載
- 実装順序を明確化
- テストフィクスチャ計画を含む

次のtdd-redフェーズでは、この仕様書に基づいて失敗するテストを実装し、TDDサイクルを開始します。
