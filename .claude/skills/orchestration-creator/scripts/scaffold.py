#!/usr/bin/env python3
"""
オーケストレーションスキルのディレクトリ構造を生成するスクリプト。

使い方:
    python scripts/scaffold.py <skill-name> <output-dir> --agents agent1 agent2 agent3

例:
    python scripts/scaffold.py code-reviewer ./skills --agents analyzer linter reporter
"""

import argparse
import os
import sys


def create_scaffold(skill_name: str, output_dir: str, agents: list[str]) -> None:
    """スキルのディレクトリ構造を生成する。"""
    skill_dir = os.path.join(output_dir, skill_name)

    if os.path.exists(skill_dir):
        print(f"Error: {skill_dir} already exists", file=sys.stderr)
        sys.exit(1)

    # ディレクトリ作成
    dirs = [
        skill_dir,
        os.path.join(skill_dir, "agents"),
        os.path.join(skill_dir, "references"),
        os.path.join(skill_dir, "scripts"),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)

    # SKILL.md テンプレート
    agent_list = "\n".join(
        [f"- `agents/{a}.md` — TODO: {a} の役割を記述" for a in agents]
    )
    skill_md = f"""---
name: {skill_name}
description: "TODO: スキルの説明を記述。トリガーフレーズを含め、押し強めに書く。"
---

# {skill_name.replace('-', ' ').title()}

TODO: スキルの目的と設計思想を 3-5 行で記述。

## ワークフロー

### Phase 0: 意図把握

TODO: ユーザーから何をヒアリングするかを記述。

### Phase 1: 実行

TODO: サブエージェントの実行フローを記述。

### Phase 2: 検証

TODO: 結果の検証方法を記述。

---

## エージェント

{agent_list}

## リファレンス

- `references/schemas.md` — データ契約定義
"""
    with open(os.path.join(skill_dir, "SKILL.md"), "w") as f:
        f.write(skill_md)

    # エージェントプロンプトテンプレート
    for agent in agents:
        agent_md = f"""# {agent.replace('-', ' ').title()} — TODO: 役割の一言説明

TODO: このエージェントが何をする専門家かを 1-2 文で説明。

## 入力

TODO: 受け取るデータの説明。

## 出力

TODO: 生成するデータの説明と具体例。

## 手順

1. TODO: ステップ 1
2. TODO: ステップ 2
3. TODO: ステップ 3
"""
        with open(os.path.join(skill_dir, "agents", f"{agent}.md"), "w") as f:
            f.write(agent_md)

    # references/schemas.md テンプレート
    schemas_md = """# スキーマ定義

TODO: サブエージェント間のデータ契約を定義する。

## 入出力スキーマ

```json
{
  "TODO": "スキーマを定義"
}
```
"""
    with open(os.path.join(skill_dir, "references", "schemas.md"), "w") as f:
        f.write(schemas_md)

    print(f"Scaffold created at: {skill_dir}")
    print(f"  SKILL.md")
    for agent in agents:
        print(f"  agents/{agent}.md")
    print(f"  references/schemas.md")


def main():
    parser = argparse.ArgumentParser(
        description="オーケストレーションスキルのディレクトリ構造を生成"
    )
    parser.add_argument("skill_name", help="スキル名 (kebab-case)")
    parser.add_argument("output_dir", help="出力先ディレクトリ")
    parser.add_argument(
        "--agents",
        nargs="+",
        required=True,
        help="サブエージェント名のリスト (kebab-case)",
    )
    args = parser.parse_args()

    create_scaffold(args.skill_name, args.output_dir, args.agents)


if __name__ == "__main__":
    main()
