# オーケストレーションスキル設計ガイド

> 出典: https://nyosegawa.github.io/posts/skill-creator-and-orchestration-skill

## 1. Agent Skills の基本構造

### Progressive Disclosure（段階的情報開示）

| Level | 内容 | タイミング |
|-------|------|-----------|
| Level 1 | name + description | 常時システムプロンプトに注入 |
| Level 2 | SKILL.md ボディ | スキルトリガー時に読み込み |
| Level 3 | scripts/, references/, assets/ | 参照時のみ |

> 設計哲学: 「コンテキストウィンドウは公共財」

### フォルダ構造

```
your-skill-name/
├── SKILL.md              # 必須: メインファイル（制御フロー）
├── scripts/              # 実行可能コード（確定的処理）
├── references/           # ドキュメント・スキーマ定義
└── assets/               # テンプレート等
```

---

## 2. skill-creator の内部アーキテクチャ

skill-creator は「スキルの CI/CD パイプライン」として機能する。

### 実行サイクル

1. 意図把握とインタビュー
2. SKILL.md ドラフト作成
3. テストケース生成
4. 並列評価実行
5. 採点・統計集約
6. ブラウザベースのレビュー
7. 改善反復ループ
8. Description 自動最適化
9. パッケージング

### コンポーネント構成

| コンポーネント | 行数 | 役割 |
|---------------|------|------|
| SKILL.md | ~480 | フロー制御（オーケストレーター） |
| grader.md | 224 | アサーション評価 |
| comparator.md | 203 | 盲検比較分析 |
| analyzer.md | 275 | パターン分析 |

---

## 3. 7つの設計ベストプラクティス

### BP1: オーケストレーターパターン

SKILL.md はマネージャー的役割に徹し、詳細処理をしない。`agents/` ディレクトリのサブエージェント用プロンプトに分離し、各フェーズで必要な指示だけをコンテキストに載せる。

### BP2: 確定的処理のスクリプト化

> "Code is deterministic; language interpretation isn't"

以下をスクリプト（Python等）にオフロード:
- 並列実行（`run_eval.py`）
- 統計集約（`aggregate_benchmark.py`）
- API 呼び出し（`improve_description.py`）
- ファイル操作（`package_skill.py`）

### BP3: スキーマ契約

`references/schemas.md` で JSON スキーマを定義し、出力フォーマットを安定化。スクリプトとの連携信頼性を確保する。

### BP4: Why-driven Prompt 設計

ルール指示（`ALWAYS validate`）より、理由説明を重視:

```
# 悪い例
ALWAYS validate input

# 良い例
Validation prevents API errors that waste tokens and frustrate users
→ 理由がわかれば未知ケースにも対応可能
```

セキュリティなど本当にクリティカルな箇所のみ Must-driven で書く。

### BP5: Description の最適化

Description はスキル選択の生命線。最適化手法:

1. 20 テストクエリ作成（トリガーすべき/すべきでない混在）
2. 60/40 の train/test 分割
3. 各クエリ 3 回実行で安定性確認
4. Extended Thinking（`budget_tokens=10000`）で改善
5. 最大 5 反復
6. test 精度でベストを選択

> 「Claude は過度にアンダートリガーする傾向がある」→ description を「押し強め」に書く

### BP6: Human-in-the-Loop の外部化

チャット UI の制約を回避するため:
- ローカル HTML ダッシュボード生成（`eval-viewer/generate_review.py`）
- `feedback.json` で構造化フィードバック収集
- 5 秒 auto-refresh でリアルタイム進捗表示

### BP7: Portability と環境別フォールバック

| 機能 | Claude Code | Claude.ai | Cowork |
|------|------------|-----------|--------|
| サブエージェント並列実行 | ○ | × (直列) | ○ |
| ブラウザビューア | ○ | × (インライン) | × (--static) |

コアワークフロー（ドラフト→テスト→レビュー→改善）は環境非依存。実行方法だけが変わる設計。

---

## 4. 2つのオーケストレーション戦略

### 戦略A: Sub-agent 型（skill-creator が採用）

1つの親スキル内で複数サブエージェントを生成・並列実行。

```
SKILL.md（オーケストレーター）
├── Spawn → with_skill版実行
├── Spawn → baseline版実行（同時並列）
├── Spawn → grader.md（評価）
├── Spawn → comparator.md（比較）
└── analyzer.md（分析）
```

**特徴**:
- SKILL.md はマネージャー（専門処理なし）
- 並列性が高い（同ターン実行）
- 全体文脈を共有
- 人間協働が中核

### 戦略B: Skill Chain 型（agentic-bench が採用）

独立スキルの直列連結パイプライン。

```
agentic-bench（トリガー + 全体制御）
├── model-researcher（Phase 1: 調査）
├── gpu-runner（Phase 2: 実行）
└── eval-reporter（Phase 3: レポート）
```

**特徴**:
- 各スキルが独立した SKILL.md, scripts/, references/ を持つ
- 単体で再利用可能
- スキルの順序性を活かす
- `references/` を「カンペ」として使用

### 選択基準

| 軸 | Sub-agent 型 | Skill Chain 型 |
|----|-------------|---------------|
| 処理フロー | 並列 | 直列（順序性あり） |
| 単体利用 | 不可 | 独立利用可 |
| references/ の役割 | メタ知識（スキーマ） | ドメイン知識 |
| 拡張方法 | agents/ 追加 | references/ 追加 |

---

## 5. Anthropic "Building Effective Agents" との対応

| エージェントパターン | スキル設計での対応 |
|--------------------|--------------------|
| Prompt Chaining | Skill Chain 型 |
| Routing | description によるスキル選択 |
| Parallelization | Sub-agent 並列 Spawn |
| Orchestrator-Workers | SKILL.md → サブエージェント委譲 |
| Evaluator-Optimizer | grader → improve → 再テストループ |

skill-creator はこれらが複合した構造。

---

## 6. 課題: Attention 競合

- **ゼロサム的競合**: スキル A の description 強化がスキル B の低下を招く可能性
- **競合環境の非制御性**: テスト時の共存スキルが実行者依存
- **description 長のジレンマ**: 詳述するほどシステムプロンプト膨張

---

## 7. アーキテクチャの進化

「プロンプトの束」から「小さなソフトウェア」への転換:

| レイヤー | 役割 | MVC 対応 |
|---------|------|----------|
| SKILL.md | オーケストレーター（制御フロー） | Controller |
| agents/ | 専門家プロンプト（ドメインロジック） | Model |
| references/ | データ契約・知識ベース | Model/Config |
| scripts/ | 確定的処理（実行エンジン） | Service |
| eval-viewer/ | ユーザーインターフェース | View |
