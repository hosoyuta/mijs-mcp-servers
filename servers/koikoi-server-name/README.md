# Code Analysis MCP Server

TypeScript Compiler APIを活用した高速コード解析システム

## 📋 プロジェクト概要

Claude Codeのコンテキスト消費を90%削減することを目的とした、TypeScript Compiler APIを活用した高速なコード解析システム。ファイルの生の内容を送信する代わりに、必要な情報（関数構造、型定義、依存関係等）のみを抽出・構造化して提供する。

## 🎯 Phase 1完了状況

### File System Layer ✅ (Week 1完了)

- ✅ **FileReader**: Bun.file()を使用した高速ファイル読み込み
- ✅ **PathResolver**: パス解決とワークスペース境界チェック
- ✅ **WorkspaceValidator**: ワークスペース検証とファイル存在確認
- ✅ **77テスト**: 100%通過
- ✅ **パフォーマンス**: NFR目標を大幅に上回る

### 技術スタック

- **ランタイム**: Bun 1.3.1
- **言語**: TypeScript 5.9.3 (strict mode)
- **テストフレームワーク**: Bun Test
- **主要ライブラリ**: glob@11.0.3

## 🚀 使用方法

```typescript
import { FileReader, PathResolver, WorkspaceValidator } from './src/fs';

// ワークスペース検証
const validator = new WorkspaceValidator();
await validator.validateWorkspace('./my-project');

// パス解決
const resolver = new PathResolver('./my-project');
const resolved = resolver.resolve('./src/index.ts');

// ファイル読み込み
const reader = new FileReader();
const result = await reader.readFile(resolved.absolutePath);
```

## 📊 テスト結果

```
✅ 77 tests passed (100%)
⏱️  Execution time: ~300ms
📈 Coverage: 主要機能70%以上
```

## 📝 ドキュメント

- [技術スタック定義](docs/tech-stack.md)
- [File System Layer API](src/fs/README.md)
- [Phase 1タスク](docs/tasks/code-analysis-phase1.md)
- [アーキテクチャ](docs/design/code-analysis/architecture.md)

## 🎯 次のステップ

Week 2: TypeScript Compiler API Layer実装
