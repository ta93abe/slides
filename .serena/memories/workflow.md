# ワークフロー

## Issue管理
- **ツール**: Linear
- チーム/プロジェクト設定は別途確認

## PR管理
- **ツール**: Graphite (gt)
- スタックPRをサポート
- `gt create` でブランチ作成
- `gt submit --no-interactive` でPR作成

## 基本フロー
1. Linearでissueを作成
2. `gt create -m "feat: ..."` でブランチ作成・コミット
3. 実装
4. `gt submit --no-interactive` でPR作成
5. レビュー・マージ
