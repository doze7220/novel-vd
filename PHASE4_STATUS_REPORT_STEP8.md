# PHASE4_STATUS_REPORT_STEP8.md

VANGUARDRIFTER — Phase 4 進捗管理

最終更新: 2026-06-05

---

## 1. 現在のバージョン

v0.5.39

---

## 2. Phase 別進捗一覧

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1 | 描画基盤・スプライトキャッシュ化 | 完了 |
| Phase 2 | 各種マネージャー分離（HUD / Radar / Map / Input / Effect / Eliminator / Scene） | 完了 |
| Phase 3 | Ship クラス化・PlayerShip / EnemyShip への AI・操作ロジック移植 | 完了 |
| Phase 4 | 残存エンティティのクラス化 + CollisionManager 分離 | **Step 1〜8 全完了 ✅** |

---

## 3. Step 1〜8 進捗一覧

### Phase 4

| Step | 内容 | 状態 |
|------|------|------|
| Step 1 | Bullet クラス化（js/classes/Bullet.js 新規作成） | ✅ 完了 |
| Step 2 | EnemyBullet クラス化（js/classes/EnemyBullet.js 新規作成） | ✅ 完了 |
| Step 3 | Missile クラス化（js/classes/Missile.js 新規作成。ホーミング・噴煙生成を update() に移植） | ✅ 完了 |
| Step 4 | Particle クラス化（js/classes/Particle.js 新規作成。EffectManager.update() に p.update() を適用） | ✅ 完了 |
| Step 5 | Debris クラス化（js/classes/Debris.js 新規作成） | ✅ 完了 |
| Step 6 | Explosion クラス化（js/classes/Explosion.js 新規作成。scale/shake 計算を update() に移植） | ✅ 完了 |
| Step 7 | Gem クラス化（js/classes/Gem.js 新規作成。吸引・移動処理を update(player) に移植） | ✅ 完了 |
| Step 8 | CollisionManager 分離（handleGemPickup() を CollisionManager へ移植） | ✅ **完了（本 Step）** |

---

## 4. 完了済みリファクタリング一覧

### Phase 4 Step 8 での変更ファイル

| ファイル | 変更内容 | 変更行数 |
|---------|---------|---------|
| js/systems/CollisionManager.js | **新規作成**（42行） | +42行 |
| js/main.js | L1785–L1808 の Gem 回収ループ（23行）を1行呼び出しに置換 | -22行 |
| index.html | L63 直後に CollisionManager.js の script タグを1行追加 | +1行 |
| js/changelog.js | 先頭に v0.5.39 エントリを追加（11行） | +11行 |
| js/classes/Gem.js | L7–17 のコメントブロックを Step 8 完了記述に更新 | 2行変更 |

### main.js 行数推移

| バージョン | 行数 |
|----------|------|
| v0.5.38（Step 7 完了時） | 2422 行 |
| v0.5.39（Step 8 完了時） | **2399 行** |
| 削減量 | **-23 行** |

> [!NOTE]
> 計画書記載の削減予測（約17行）に対し、実際は23行削減（コメント行を含むため）。

---

## 5. 残存 main.js 責務

### 衝突判定（インライン残存、CollisionManager への将来移植候補）

| カテゴリ | 内容 |
|---------|------|
| debrisVsPlayer | Debris が自機に当たった際の押し返し・ダメージ |
| debrisVsEnemy | Debris が敵機に当たった際の押し返し・ダメージ |
| explosionVsPlayer | 爆風が自機にダメージを与える（progress 0.02〜0.15） |
| explosionVsEnemy | 爆風が敵機にダメージを与える |
| enemyBulletVsPlayer | 敵弾が自機にダメージを与える |
| enemyBulletVsMissile | 敵弾がミサイルを撃墜する |
| missileVsEnemy | ミサイルが敵機に命中・爆発 |
| enemyVsEnemy | 敵機同士の衝突 |
| playerBulletVsEnemy | 自機弾が敵機に命中 |
| enemyVsPlayer | 敵機が自機に体当たり |
| playerBulletVsMothership | 自機弾が敵母艦に命中 |
| missileVsMothership | ミサイルが敵母艦に命中 |
| playerVsMothership | 自機が敵母艦に体当たり |

### ヘルパー関数（現状 main.js のグローバル関数）

- resetGame()
- initResultScreen()
- spawnDebris() / spawnDeathDebris() / spawnExplosion()
- clearAllEnemiesInstantly()
- getEnemyColor() / damagePlayer() / checkLevelUp()
- drawGameEntities()
- updateLevelUpScreen()
- update() / draw() / loop()

---

## 6. 残存 Collision 一覧

以下の衝突カテゴリは main.js にインライン残存している（将来 CollisionManager への移植候補）。

| カテゴリ | 担当 Step（将来フェーズ） |
|---------|----------------------|
| debrisVsPlayer / debrisVsEnemy | Phase 5 候補 |
| explosionVsPlayer / explosionVsEnemy | Phase 5 候補 |
| enemyBulletVsPlayer / enemyBulletVsMissile | Phase 5 候補 |
| missileVsEnemy | Phase 5 候補 |
| enemyVsEnemy | Phase 5 候補 |
| playerBulletVsEnemy | Phase 5 候補 |
| enemyVsPlayer | Phase 5 候補 |
| playerBulletVsMothership / missileVsMothership / playerVsMothership | Phase 5 候補 |
| gemPickup | **✅ Step 8 で CollisionManager.handleGemPickup() に移植済み** |

---

## 7. 残存 cleanup 一覧

| エンティティ | cleanup 位置 | 状態 |
|-----------|------------|------|
| Particle | EffectManager.update()（effects.js） | 移植済み（Phase 2 相当） |
| Debris | main.js デブリループ内 splice | 残存（将来フェーズ） |
| Explosion | main.js 爆発ループ内 splice | 残存（将来フェーズ） |
| Bullet | main.js 弾ループ内 splice | 残存（将来フェーズ） |
| EnemyBullet | main.js 敵弾ループ内 splice | 残存（将来フェーズ） |
| Missile | main.js ミサイルループ内 splice | 残存（将来フェーズ） |
| Enemy | eliminator.processEntityDeath()（eliminator.js） | 移植済み（Phase 2 相当） |
| Gem | **CollisionManager.handleGemPickup()（CollisionManager.js）** | **✅ Step 8 で移植済み** |

---

## 8. 残存 draw 一覧

以下の描画処理が main.js に残存している。

| 描画内容 | 担当関数 | 将来候補 |
|---------|---------|---------|
| 全エンティティ描画のオーケストレーション | drawGameEntities() | renderers/ への移動候補 |
| ゲームループ描画のオーケストレーション | draw() | 変更不要（coordinator） |
| レベルアップ画面 | updateLevelUpScreen() | 将来フェーズで分離候補 |

---

## 9. Phase 4 完了判定

### 判定基準

| 項目 | 判定 |
|-----|------|
| Step 1〜8 全完了 | ✅ |
| 全エンティティのクラス化（Bullet/EnemyBullet/Missile/Particle/Debris/Explosion/Gem） | ✅ |
| CollisionManager の足場作成（handleGemPickup 実装） | ✅ |
| Gem 回収処理の main.js からの完全移植 | ✅ |
| update 順序・cleanup 順序・挙動の維持 | ✅ |
| changelog.js への記録（v0.5.32〜v0.5.39） | ✅ |

**Phase 4: ✅ 完了**

---

## 10. Phase 5 候補

### 優先度: 高

| 候補 | 内容 |
|-----|------|
| CollisionManager への衝突判定移植（全カテゴリ） | playerBulletVsEnemy, enemyBulletVsPlayer, explosionVsEnemy, debrisVsPlayer, missileVsEnemy, enemyVsEnemy, playerVsMothership |

### 優先度: 中

| 候補 | 内容 |
|-----|------|
| PlayerShip / EnemyShip の実体コード分離 | main.js 内部に残存するロジックをクラスファイルに移植 |
| drawGameEntities() の分離 | main.js L2237 の描画コードを renderers/ へ移動 |
| spawnDebris / spawnDeathDebris / spawnExplosion の分離 | spawner 系をシステムクラスに移植 |

### 優先度: 低

| 候補 | 内容 |
|-----|------|
| constants.js の充実 | 現在空のまま。定数の移植先として将来使用予定 |
| TitleScene の Explosion 不整合解消 | isFlavor Explosion の更新が TitleScene 独自ロジックに依存している |

---

## 11. 次に着手すべき項目

### 推奨: Phase 5 Step 1

**CollisionManager.playerBulletVsEnemy() の移植**

```
対象: main.js の敵ループ内 playerBulletVsEnemy 判定
移植先: CollisionManager.js に playerBulletVsEnemy(entities, playerStats, checkLevelUp) を追加
```

理由:
- Step 8 で CollisionManager の足場が完成したため、次の自然なステップ
- playerBulletVsEnemy は main.js で最もコードが集中している衝突カテゴリ（Scatter Shot 生成・flashTimer 等）
- 分離によって main.js の敵ループが大幅にシンプルになる

---

## 12. リスク事項

### 長期的リスク

| リスク | 内容 |
|--------|------|
| main.js への機能追加 | Phase 5 リファクタリング中に新機能を追加すると行数が増加し、分離作業が複雑化する |
| 衝突判定の順序破壊 | 将来の CollisionManager 拡張時に誤って判定順序を変更するリスク |
| TitleScene の Explosion 不整合 | isFlavor Explosion が Explosion.update() ではなく TitleScene 独自ロジックで動いているため、Explosion クラスを修正すると乖離が生じる |

---

## 13. 引継ぎメモ

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

- 全体設計: PROJECT_ARCHITECTURE.md
- 関数インデックス: PROJECT_FUNCTION_INDEX.md
- Phase 4 方針書: order/20260524_order4_refactoring_phase4.md
- Step 8 計画書: order/20260525_order4_refactoring_phase4_Step8_implementationPlan.md
- 変更履歴: js/changelog.js

### ファイル変更後の必須作業

1. js/changelog.js にバージョンエントリを追加する
   - バージョン規則: vX.Y.Z — X はメジャー（指示時のみ UP）、Y はマイナー（機能追加時 UP）、Z はリビジョン（作業ごとに加算）
2. PROJECT_ARCHITECTURE.md の更新が必要な場合（ファイル追加・責務変更時）は随時更新する
3. PROJECT_FUNCTION_INDEX.md の更新が必要な場合（関数追加・移動時）は随時更新する

### 現在の作業の中断ポイント

Phase 4 Step 8（CollisionManager 分離）まで完了。
Phase 4 は全 Step 完了。
Phase 5 は未開始。次の作業は Phase 5 Step 1（CollisionManager.playerBulletVsEnemy）の計画・実装。
