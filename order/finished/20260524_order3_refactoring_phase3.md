# 作業指示書：20260525_order3_refactoring_phase3_NEWTONIAN_SYMMETRY(v1.0)
## 役割
あなたは優秀なフロントエンドエンジニアです。  
提供したソースコードに対し、以下の「Newtonian Symmetry（物理統合）フェーズ」を段階的に実施してください。

## 目的
main.js はすでに司令塔として整理済みであり、描画・UI・エフェクトはすべて utils/ に分離済みである。  
Phase 3 では、**update() 内に残っている “プレイヤー操作ロジック” と “敵 AI ロジック” をクラスへ移動し、物理演算を Ship 基底クラスに統合する**。

**【絶対原則】ゲームの挙動・操作感・敵 AI の思考・演出は 1px も変えてはならない（完全互換）。**

---

# 1. 現状の前提（重要）
- 描画処理は **drawBackground / drawEffects / drawHUD / drawOverlay** に完全分離済み  
- UI（タイトル・リザルト・レベルアップ）は utils 側に完全分離済み  
- main.js は **update() とエンティティ管理だけ** を担当する司令塔  
- resetGame / InputManager / RadarManager / MapManager / HUDManager / EffectManager は既に分離済み  
- main.js の update() には **プレイヤー操作・敵 AI・物理演算・衝突判定** が残っている
- updatePhysics() 内の処理順序は、現在 main.js に存在する順序を完全維持すること。特に以下を変更しないこと：
    - vx/vy 更新順
    - x/y 更新順
    - friction 適用順
    - speed clamp の適用タイミング
    - recoil / boost / impulse の適用前後関係


Phase 3 では **update() のプレイヤー操作と敵 AI をクラスへ移動し、物理演算を共通化する**。

---

# 2. 実装方針（AI‑IDE が誤解しないための明確な境界）
- **描画系（drawXXX.js）は絶対に触らない**  
- **UI 系（HUDManager, MapManager, RadarManager）は絶対に触らない**  
- **EffectManager（パーティクル管理）も触らない**  
- **衝突判定・パーティクル生成は main.js に残す（Phase 4 で移動）**  
- **update() の “プレイヤー操作部分” と “敵 AI 部分” のみを移動する**  
- **物理演算は Ship.updatePhysics() に統合する**
- **updatePhysics() は、「位置更新・摩擦・速度制限」のみを扱う。入力処理、AI判断、旋回判断、boost、weapon、recoil、state管理は含めないこと。**
- 発艦・着艦シーケンスは、通常物理とは分離された特殊シーケンスとして扱い、updatePhysics() へ統合しないこと。

---

# 3. 作業ステップ（段階的に実行すること）

## ✔ Step 1：基底クラス Ship の実装
以下を Ship.js に実装する：

- `updatePhysics()`  
  - vx, vy による x, y の更新  
  - 摩擦（CONFIG.FRICTION）  
  - 最高速度のクランプ（maxSpeed はサブクラスが設定）  
- `takeDamage(amount)`  
  - HP 減少  
  - flashTimer の設定  
- `applyKnockback()`（必要なら）  
- **描画はまだ移動しない（後半フェーズ）**

### 注意
- **描画は絶対に移動しない**  
- **updatePhysics() は純粋な物理演算のみ**

---

## ✔ Step 2：PlayerShip のロジックカプセル化
main.js の update() 内に残っている **プレイヤー操作部分だけ** を PlayerShip.update() に移動する。

含める処理：

- キー入力による推力・旋回  
- ブーストゲージ管理  
- ヒートゲージ管理  
- 武器発射（弾生成）  
- 発艦・着艦シーケンス  
- super.updatePhysics() の呼び出し  

### 注意
- **描画は移動しない（drawEffects / drawHUD が担当）**  
- **パーティクル生成は main.js に残す（後で移動）**

---

## ✔ Step 3：EnemyShip のロジックカプセル化
main.js の update() 内に残っている **敵 AI 部分だけ** を EnemyShip.update() に移動する。

含める処理：

- personality に応じた行動決定  
- 旋回・推力  
- 射撃ロジック  
- 発艦シーケンス  
- super.updatePhysics() の呼び出し  

### 注意
- **描画は移動しない**  
- **衝突判定は main.js に残す**

---

## ✔ Step 4：main.js の update() を司令塔化
update() 内のプレイヤー操作・敵 AI を削除し、以下の形にする：

player.update(keys, mouse, controlMode, GAME, entities);
entities.enemies.forEach(e => e.update(player, entities, GAME));


残すもの：

- 衝突判定  
- パーティクル生成  
- 弾・ミサイルの移動  
- 敵の死亡処理  
- ステージ進行  
- GAME.state の管理  

---

## ✔ Step 5：差分形式で main.js の update() を提示
AI‑IDE が誤解しないように、  
**「main.js の update() のどの部分を削除し、どこを player.update() に置き換えるか」**  
を差分形式で提示する。

---

# 4. 完了条件
- main.js の update() が **司令塔として 200〜300 行程度に縮小**  
- プレイヤーと敵の移動ロジックが **Ship.updatePhysics() を通過**  
- プレイヤー操作・敵 AI が **PlayerShip / EnemyShip に完全移動**  
- ゲーム挙動がリファクタリング前と完全一致  
- 描画・UI・エフェクトは一切壊れていない  

---

# 5. 注意事項（AI‑IDE が壊さないための絶対条件）
- **描画系ファイル（drawXXX.js）には絶対に触れない**  
- **HUDManager / MapManager / RadarManager / EffectManager には触れない**  
- **衝突判定は main.js に残す**  
- **update() のプレイヤー操作部分だけを移動する**  
- **update() の敵 AI 部分だけを移動する**  
- **描画は後半フェーズまで移動禁止**  
