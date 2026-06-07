# PROJECT_STATUS.md

VANGUARDRIFTER — 開発進捗管理

最終更新: 2026-06-04

---

## 1. 現在のバージョン

v0.5.38

---

## 2. Phase 別進捗一覧

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1 | 描画基盤・スプライトキャッシュ化 | 完了 |
| Phase 2 | 各種マネージャー分離（HUD / Radar / Map / Input / Effect / Eliminator / Scene） | 完了 |
| Phase 3 | Ship クラス化・PlayerShip / EnemyShip への AI・操作ロジック移植 | 完了 |
| Phase 4 | 残存エンティティのクラス化 + CollisionManager 分離 | Step 1〜7 完了 / Step 8 未実施 |

---

## 3. 完了済み Step 一覧

### Phase 3

- [x] Step1: Ship.updatePhysics() 実装（基底クラスに物理演算を追加）
- [x] Step2: PlayerShip.update() 実装（自機操作ロジック移植）
- [x] Step3: EnemyShip.update() 実装（敵 AI ロジック移植）
- [x] Step4: main.js の呼び出し置換（各 update() 呼び出しに変更）
- [x] Step5: changelog 更新
- [x] Step6: 動作確認

### Phase 4

- [x] Step1: Bullet クラス化（js/classes/Bullet.js 新規作成）
- [x] Step2: EnemyBullet クラス化（js/classes/EnemyBullet.js 新規作成）
- [x] Step3: Missile クラス化（js/classes/Missile.js 新規作成。ホーミング・噴煙生成を update() に移植）
- [x] Step4: Particle クラス化（js/classes/Particle.js 新規作成。EffectManager.update() に p.update() を適用）
- [x] Step5: Debris クラス化（js/classes/Debris.js 新規作成）
- [x] Step6: Explosion クラス化（js/classes/Explosion.js 新規作成。scale/shake 計算を update() に移植）
- [x] Step7: Gem クラス化（js/classes/Gem.js 新規作成。吸引・移動処理を update(player) に移植）

---

## 4. 未実施 Step 一覧

### Phase 4

- [ ] Step8: CollisionManager 分離（handleGemPickup() 単体を CollisionManager へ移植）

### 未定義（将来フェーズ）

- [ ] CollisionManager.playerBulletVsEnemy() の分離
- [ ] CollisionManager.enemyBulletVsPlayer() の分離
- [ ] CollisionManager.explosionVsEnemy() の分離
- [ ] CollisionManager.debrisVsPlayer() の分離
- [ ] CollisionManager.missileVsEnemy() の分離
- [ ] CollisionManager.enemyVsEnemy() の分離
- [ ] CollisionManager.playerVsMothership() の分離
- [ ] main.js の最終整理（update() を orchestration layer のみに）

---

## 5. 現在の main.js 行数

約 2422 行

---

## 6. 作成済みクラス一覧

| クラス | ファイル | update() | draw() | 備考 |
|-------|---------|----------|--------|------|
| Ship | js/classes/Ship.js | なし | なし | 基底クラス（現状ほぼスタブ） |
| PlayerShip | 主に main.js 内（約L200-L984） | あり（GAME, entities） | なし | 描画は drawGameEntities に残存 |
| EnemyShip | 主に main.js 内 | あり（player, entities, GAME） | なし | 描画は drawGameEntities に残存 |
| Bullet | js/classes/Bullet.js | あり（引数なし） | なし | collision / cleanup は main.js |
| EnemyBullet | js/classes/EnemyBullet.js | あり（引数なし） | なし | collision / cleanup は main.js |
| Missile | js/classes/Missile.js | あり（entities） | なし | collision / Sub-Munition生成 / cleanup は main.js |
| Particle | js/classes/Particle.js | あり（引数なし） | なし | cleanup は EffectManager.update() |
| Debris | js/classes/Debris.js | あり（引数なし） | なし | collision / cleanup は main.js |
| Explosion | js/classes/Explosion.js | あり（引数なし） | なし | damage / cleanup は main.js |
| Gem | js/classes/Gem.js | あり（player） | なし | 回収判定 / cleanup は main.js（Step 8 移植予定） |
| Communication | js/classes/communication.js | なし | なし | play(text) のみ |
| TitleScene | js/scenes/TitleScene.js | あり（引数なし） | なし | 描画は drawOverlay.js |
| ResultScene | js/scenes/ResultScene.js | あり（引数なし） | なし | 描画は drawOverlay.js |

---

## 7. 残存技術的負債

### 高優先度

| 内容 | 場所 | 担当 Step |
|------|------|----------|
| Gem 回収判定（dist < GEM_COLLECT_RADIUS）が main.js に残存 | main.js L1785–L1808 | Step 8（次の作業） |
| EXP 加算 / HP 回復 / checkLevelUp() が main.js の Gem ループ内に残存 | main.js L1799–L1807 | Step 8（次の作業） |
| entities.gems.splice() が main.js に残存 | main.js L1806 | Step 8（次の作業） |

### 中優先度

| 内容 | 場所 | 担当 Step |
|------|------|----------|
| 全衝突判定がインラインで main.js に残存（gemPickup 以外） | main.js L1180–L1783 | 将来フェーズ |
| PlayerShip / EnemyShip の実体コードが main.js 内部に残存している | main.js L197〜L984 | 将来フェーズ |
| Ship.js が事実上スタブ（updatePhysics / takeDamage 等が未移植） | js/classes/Ship.js | 将来フェーズ |
| drawGameEntities() が main.js にインライン定義されている | main.js L2259〜L2398 | 将来フェーズ |
| spawnDebris / spawnDeathDebris / spawnExplosion が main.js のグローバル関数 | main.js L1010〜L1072 | 将来フェーズ |

### 低優先度

| 内容 | 場所 | 担当 Step |
|------|------|----------|
| Gem.js のコメント（L7–17）が「main.js に残存」と記述されており、Step 8 完了後に更新が必要 | js/classes/Gem.js | Step 8 完了後 |
| constants.js が空（CONSTANTS オブジェクトのみで中身なし） | js/data/constants.js | 未定 |
| TitleScene.update() が Explosion.update() を使わず独自の timer/scale 計算をしている | js/scenes/TitleScene.js | 将来フェーズ |

---

## 8. 次に行う作業

### Phase 4 Step 8: CollisionManager 分離

詳細は以下の計画書を参照すること。

参照ファイル: order/20260525_order4_refactoring_phase4_Step8_implementationPlan.md

#### 概要

- 新規作成: js/systems/CollisionManager.js
- CollisionManager.handleGemPickup(entities, player, playerStats, checkLevelUp) を実装
- main.js L1785–L1808 を削除し、1行の呼び出しに置換
- index.html: Gem.js の直後に CollisionManager.js の script タグを追加
- Gem.js のコメント（L7–17）を更新
- changelog.js に v0.5.39 エントリを追加

#### 実装後の期待値

- main.js の行数: 約 2422 → 約 2405 行（約17行削減）
- Gem 回収判定が CollisionManager に移植され、main.js の Gem 残存処理ゼロになる

---

## 9. リスク事項

### Step 8 に関するリスク

| リスク | 内容 | 対策 |
|--------|------|------|
| 変数名衝突 | CollisionManager がグローバルに存在しない名前であることを確認 | 現時点で同名変数なし（確認済み） |
| 読み込み順 | CollisionManager.js が Gem.js より先に読み込まれると ReferenceError | index.html の script 順を Gem.js の直後に限定 |
| g.update(player) の位置 | handleGemPickup() 外に分離すると移動・回収判定の間に他処理が挟まる | handleGemPickup() 内で g.update() を呼び出すこと |
| checkLevelUp 参照 | CollisionManager.js は main.js の checkLevelUp を引数で受け取る必要がある | 呼び出し側で明示的に渡す |

### 長期的リスク

| リスク | 内容 |
|--------|------|
| main.js への機能追加 | Phase 4 リファクタリング中に新機能を追加すると行数が増加し、分離作業が複雑化する |
| 衝突判定の順序破壊 | 将来の CollisionManager 拡張時に誤って判定順序を変更するリスク |
| TitleScene の Explosion 不整合 | isFlavor Explosion が Explosion.update() ではなく TitleScene 独自ロジックで動いているため、Explosion クラスを修正すると乖離が生じる |

---

## 10. 引継ぎメモ

### このプロジェクトで最も重要なルール（AI への伝達事項）

1. ゲームの見た目・操作感・機能は 1px も変更してはならない（完全互換）
2. update() の処理順序は絶対に変更しない
3. collision の判定順序は絶対に変更しない
4. cleanup（splice）の順序は絶対に変更しない
5. 汎用 collision system（ECS 風の二重ループ）を作成しない
6. entity は constructor 内で副作用を起こしてはならない
7. entity は自身を即時削除してはならない（self destroy 禁止）
8. drawXXX.js / EffectManager / HUDManager / RadarManager / MapManager に触らない

### 作業時の参照先

- 全体設計: PROJECT_ARCHITECTURE.md（本ファイルと同じ階層）
- Phase 4 方針書: order/20260524_order4_refactoring_phase4.md
- Step 8 計画書: order/20260525_order4_refactoring_phase4_Step8_implementationPlan.md
- 変更履歴: js/changelog.js

### ファイル変更後の必須作業

1. js/changelog.js にバージョンエントリを追加する
   - バージョン規則: vX.Y.Z — X はメジャー（指示時のみ UP）、Y はマイナー（機能追加時 UP）、Z はリビジョン（作業ごとに加算）
2. PROJECT_ARCHITECTURE.md の更新が必要な場合（ファイル追加・責務変更時）は随時更新する

### 現在の作業の中断ポイント

Phase 4 Step 7（Gem クラス化）まで完了。Step 8（CollisionManager）が次の作業。Step 8 の実装計画書は既に作成済み。実装前に計画書を必ず確認すること。
