# TypeScript Compiler API Layer

このディレクトリには、TypeScript Compiler APIの抽象化層が含まれています。

## 概要

TypeScript Compiler APIを使用してTypeScript/JavaScriptコードを解析するための基盤を提供します。

## コンポーネント

### CompilerHost

TypeScript Programの作成と管理を担当するクラス。

**主な機能**:
- `createProgram(fileNames)`: TypeScript Programインスタンスの作成
- `getDiagnostics(program)`: 構文エラー・意味エラーの取得
- デフォルトCompilerOptionsの適用
- カスタムCompilerOptionsのマージ

**使用例**:

```typescript
import { CompilerHost } from './CompilerHost';
import * as ts from 'typescript';

const host = new CompilerHost({
  rootPath: '/path/to/project',
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    strict: true,
  },
});

// TypeScript Programを作成
const program = host.createProgram(['./src/index.ts']);

// SourceFileを取得
const sourceFile = program.getSourceFile('./src/index.ts');

// TypeCheckerを取得 (型解析用)
const typeChecker = program.getTypeChecker();

// Diagnostics (エラー情報) を取得
const diagnostics = host.getDiagnostics(program);
if (diagnostics.length > 0) {
  console.error('Compilation errors found:', diagnostics);
}
```

### ProgramManager

TypeScript Programインスタンスの再利用とキャッシュ管理を担当します (実装予定)。

**主な機能**:
- Programインスタンスのキャッシング
- mtimeベースのキャッシュ無効化
- メモリ効率的な管理

## パフォーマンス最適化

### デフォルトCompilerOptions

`CompilerHost`は、パフォーマンスを最適化するために以下のデフォルトオプションを使用します:

- `skipLibCheck: true`: TypeScript標準ライブラリの型チェックをスキップ
- `noEmit: true`: 出力ファイルを生成しない (解析のみ)
- `allowJs: true`: JavaScriptファイルもサポート

### Program再利用

同じファイルセットに対して複数回解析を行う場合、`ProgramManager`を使用してProgramインスタンスを再利用することで、起動時間を大幅に短縮できます。

## エラーハンドリング

### CompilerError

`CompilerHost.createProgram()`が失敗した場合、`CompilerError`がスローされます:

```typescript
import { CompilerError } from '../utils/errors';

try {
  const program = host.createProgram(['./invalid-file.ts']);
} catch (error) {
  if (error instanceof CompilerError) {
    console.error('Compiler error:', error.message);
    if (error.diagnostics) {
      console.error('Diagnostics:', error.diagnostics);
    }
  }
}
```

### 構文エラー時の動作

構文エラーがあるファイルでも、`createProgram()`は成功し、Programインスタンスが返されます。エラー情報は`getDiagnostics()`で取得できます。

```typescript
const program = host.createProgram(['./file-with-error.ts']);
const diagnostics = host.getDiagnostics(program);

if (diagnostics.length > 0) {
  diagnostics.forEach(diagnostic => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.error(`Error: ${message}`);
  });
}
```

## 型定義

型定義は`../types/compiler.ts`に定義されています:

- `CompilerConfig`: CompilerHostの設定
- `ProgramInfo`: TypeScript Program情報

## 関連ドキュメント

- [TypeScript Compiler API Documentation](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [architecture.md](../../docs/design/code-analysis/architecture.md) - Section 5 (TS Compiler API Layer)
- [tech-stack.md](../../docs/tech-stack.md) - TypeScript Compiler API選定理由
