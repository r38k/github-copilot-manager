# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

GitHub Copilot Managerプロジェクト。TypeScript/Node.jsベースで開発。

## 開発コマンド

### TypeScriptファイルの実行
```bash
npx tsx src/index.ts
```

### TypeScriptのコンパイル
```bash
npx tsgo
```

### パッケージ管理（pnpm使用）
```bash
pnpm install  # 依存関係のインストール
pnpm add <package>  # 依存関係の追加
pnpm add -D <package>  # 開発依存関係の追加
```

## TypeScriptコーディング規約

**必須ルール:**
- `any`型の使用は厳禁。すべての型を明確に定義すること
- `let`の使用を避け、`const`を使用すること
- 純粋関数をベースに実装すること
- 副作用のある関数では`Result<T, E>`型を使用してエラーハンドリングを行うこと
- `class`は使用せず、関数とオブジェクトで実装すること

## プロジェクト構造

- `/src/` - TypeScriptソースコード
- `/src/index.ts` - メインエントリーポイント
- `tsconfig.json` - TypeScript設定（strict mode有効）
- `package.json` - 依存関係とスクリプト定義

## TypeScript設定

- モジュールシステム: `nodenext`
- ターゲット: `esnext`
- Strictモード有効
- 追加の厳格チェック: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`