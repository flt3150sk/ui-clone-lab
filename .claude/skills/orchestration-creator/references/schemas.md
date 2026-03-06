# スキーマ定義

生成するオーケストレーションスキルの構造と、各コンポーネント間のデータ契約を定義する。

---

## 1. スキルディレクトリ構造

```
<skill-name>/
├── SKILL.md                    # 必須: オーケストレーター
├── agents/                     # 必須: サブエージェントプロンプト
│   ├── <agent-name-1>.md
│   ├── <agent-name-2>.md
│   └── ...
├── references/                 # 任意: スキーマ・ドメイン知識
│   ├── schemas.md              # 推奨: データ契約定義
│   └── ...
└── scripts/                    # 任意: 確定的処理
    └── ...
```

## 2. SKILL.md フロントマター

```yaml
---
name: "<skill-name>"
description: "<トリガー条件を含む説明文>"
---
```

- `name`: kebab-case。ディレクトリ名と一致させる
- `description`: 1つの文字列。改行なし。トリガーフレーズを含める

## 3. 設計ドキュメント（Phase 1 出力）

アーキテクトエージェントが出力する設計ドキュメントの構造:

```json
{
  "skill_name": "my-orchestration-skill",
  "purpose": "スキルの目的の説明",
  "agents": [
    {
      "name": "agent-name",
      "role": "役割の説明",
      "input": "入力の説明",
      "output": "出力の説明",
      "parallel": true
    }
  ],
  "phases": [
    {
      "number": 1,
      "name": "フェーズ名",
      "agents": ["agent-a", "agent-b"],
      "parallel": true,
      "human_in_the_loop": false,
      "dependencies": []
    },
    {
      "number": 2,
      "name": "フェーズ名",
      "agents": ["agent-c"],
      "parallel": false,
      "human_in_the_loop": true,
      "dependencies": [1]
    }
  ],
  "references": [
    {
      "filename": "schemas.md",
      "purpose": "データ契約定義",
      "used_by": ["agent-a", "agent-b", "agent-c"]
    }
  ],
  "scripts": [
    {
      "filename": "aggregate.py",
      "language": "python",
      "purpose": "結果集約",
      "args": ["workspace_dir"],
      "output": "aggregate.json"
    }
  ]
}
```

## 4. 検証レポート（Phase 3 出力）

バリデーターエージェントが出力する検証結果:

```json
{
  "status": "pass | warn | fail",
  "checks": [
    {
      "name": "check-name",
      "status": "pass | warn | fail",
      "message": "検証結果の説明",
      "suggestions": ["改善提案"]
    }
  ],
  "summary": "全体サマリー"
}
```

### チェック名の一覧

| チェック名 | 検証内容 |
|-----------|---------|
| `orchestrator-purity` | SKILL.md がフロー制御のみか |
| `agent-self-containment` | サブエージェントが自己完結しているか |
| `schema-consistency` | スキーマと入出力の整合性 |
| `progressive-disclosure` | 行数制限の遵守 |
| `why-driven` | 不必要な ALWAYS/NEVER がないか |
| `deterministic-separation` | 確定的処理が scripts/ に分離されているか |
| `description-quality` | description の品質 |

## 5. サブエージェント間データ契約

サブエージェント間でデータを受け渡す場合、以下の規約に従う:

- **ファイルベース**: JSON ファイルでワークスペースディレクトリに保存する
- **パス規約**: `<workspace>/<phase>/<agent-name>/output.json`
- **スキーマ参照**: 各エージェントプロンプトで references/schemas.md を参照する

```
workspace/
├── phase-1/
│   ├── agent-a/
│   │   └── output.json
│   └── agent-b/
│       └── output.json
└── phase-2/
    └── agent-c/
        └── output.json    ← agent-a, agent-b の output.json を入力として使用
```
