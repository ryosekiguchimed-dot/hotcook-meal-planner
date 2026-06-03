# ホットクック献立プランナー

忙しい子育て世帯向けに、ホットクックで作れる 1 週間分の夕食献立を提案するスマホ向け MVP です。

## 機能

- 4 人家族向けの 1 週間夕食献立
- 月火木金は冷凍ミールキット方式
- 水土日は通常調理
- 固定レシピ DB から買い物リストを自動生成
- 各献立のホットクック調理手順を表示
- PWA 対応を見据えた `manifest.json`

## 技術構成

- Next.js
- React
- TypeScript
- pnpm
- Vercel デプロイ対応

## ローカル開発

```bash
pnpm install
pnpm dev
```

ブラウザで以下を開きます。

```text
http://localhost:3000
```

## ビルド

```bash
pnpm build
```

## 画面

- `/` トップページ
- `/menu` 週間献立ページ
- `/shopping-list` 買い物リストページ

## Vercel で公開する手順

1. このリポジトリを GitHub に push します。
2. [Vercel](https://vercel.com/) にログインします。
3. `Add New...` から `Project` を選びます。
4. GitHub の `hotcook-meal-planner` リポジトリを import します。
5. Framework Preset が `Next.js` になっていることを確認します。
6. Build Command は `pnpm build`、Install Command は `pnpm install` を使います。
7. `Deploy` を押します。

このリポジトリには `vercel.json` が含まれているため、Vercel 側では基本的に自動検出のまま公開できます。

## 今後の拡張候補

- レシピ DB の永続化
- 家族構成や好みに応じた献立生成
- アレルギー、予算、調理時間でのフィルタ
- 買い物リストのチェック状態保存
- PWA アイコンとオフライン対応
