# Phase 5 実装計画書: Controller Abstraction / Newtonian Symmetry

VANGUARDRIFTER — Phase 5 実装計画

作成日: 2026-06-05
ベースバージョン: v0.5.39
参照設計案: 20260525_order5_controller_abstraction.md

---

## 1. 現状分析

### 1-1. PlayerShip / EnemyShip の実体コード配置

現在、Ship / PlayerShip / EnemyShip の**全クラス定義は main.js 内（L202〜L984）にインラインで存在**している。
`js/classes/Ship.js`（6行）、`js/classes/PlayerShip.js`（6行）、`js/classes/EnemyShip.js`（6行）はスタブファイルであり、
**index.html からもコメントアウトされて読み込まれていない**。

```
main.js L202-244:  class Ship（constructor + updatePhysics + takeDamage）
main.js L262-708:  class PlayerShip extends Ship（constructor + update）
main.js L715-984:  class EnemyShip extends Ship（constructor + update）
```

### 1-2. PlayerShip.update() の構成（L297〜L707、約410行）

```
L297-320:   発艦シーケンス（launchSequence）
L322-328:   canControl 判定、handling 計算
L330-384:   ブーストゲージ管理（ShiftLeft/ShiftRight 入力）
L386-461:   操作入力（A/D 旋回、W 推進、S 後退、Q ブレーキ）
L463-464:   super.updatePhysics(currentMaxSpeed) 呼び出し
L465-468:   発艦中の座標更新
L469-588:   着艦シーケンス（TIP_LAND → TOW_TO_ROOT → ROTATE_UP → RESUPPLY → WAIT_CLEAR）
L591-600:   最近敵探索（自動エイム用）
L604-652:   ヒートゲージ管理 + 射撃ロジック（Bullet 生成）
L654-706:   ミサイル発射（E キー。ロックオン → Missile 生成）
```

### 1-3. EnemyShip.update() の構成（L755〜L983、約228行）

```
L755-781:   射出シーケンス（isLaunching）
L783-821:   性格別ターゲット座標設定（RAMMER/SNIPER/DOGFIGHTER）
L823-906:   障害物回避（Obstacle Avoidance）
L908-926:   移動方向計算 → vx/vy への加速度加算 → super.updatePhysics(maxSpd)
L928-938:   機体向き（エイム揺らぎ + rotateTowards）
L941-980:   射撃処理（ヒートゲージ + EnemyBullet 生成）
```

### 1-4. Ship.updatePhysics() の構成（L229〜L244、15行）

```
L231-232:   摩擦適用（vx *= FRICTION, vy *= FRICTION）
L235-239:   速度クランプ（maxSpeed 超過時の正規化）
L242-243:   座標更新（x += vx, y += vy）
```

### 1-5. playerStats の問題

PlayerShip は HP/heat/maxHp を `playerStats` オブジェクト（グローバル、stats.js 定義）で管理しており、
Ship 基底クラスの `this.hp` / `this.maxHp` / `this.heat` は使用していない。
一方、EnemyShip は Ship 基底クラスの `this.hp` / `this.heat` を直接使用している。

この**二重管理構造**は Controller Abstraction の直接の障害ではないが、
将来の統合作業（同一 applyControl を経由する構造）で意識が必要。

---

## 2. ControllerInput 化の障害一覧

### 2-1. PlayerShip の障害

| # | 障害 | 箇所 | 詳細 |
|---|------|------|------|
| P1 | InputManager への直接アクセス | L350, L387-388, L401, L407, L439, L448, L606-607, L655 | 計10箇所で `InputManager.isPressed()` / `InputManager.getMouse()` を直接呼び出し |
| P2 | 発艦シーケンス中の vx/vy 直接設定 | L315-316 | `this.vx = 0; this.vy = -12;` ← 強制的な射出速度 |
| P3 | ブーストゲージが入力と密結合 | L330-384 | `isHoldingShift` → `isBoosting` → `boostGauge--` がすべて同一ブロック |
| P4 | 推進中の vx/vy 直接加算 | L434-435 | `this.vx += cos(bodyAngle) * accel` |
| P5 | 後退中の vx/vy 直接操作 | L440-444 | `vx *= 0.95` + `vx -= cos(bodyAngle) * reverseAccel` |
| P6 | ブレーキ中の vx/vy 直接操作 | L449-450 | `vx *= 0.7` |
| P7 | 着艦シーケンス中の vx/vy/angle 強制 | L469-588 | landingPhase 全体で vx=0, vy=0, bodyAngle 強制設定 |
| P8 | 射撃入力がクラス内で直接処理 | L606-607, L623-652 | InputManager → isFiringInput → fireTimer → Bullet 生成 |
| P9 | ミサイル入力がクラス内で直接処理 | L655 | InputManager.isPressed('KeyE') |
| P10 | controlMode による分岐 | L398-404, L637, L661 | GAME.controlMode が 'SUBSPACE' / 'MOUSE_AIM' で砲塔角度計算が分岐 |

### 2-2. EnemyShip の障害

| # | 障害 | 箇所 | 詳細 |
|---|------|------|------|
| E1 | 射出シーケンス中の vx/vy 直接設定 | L765-778 | `vx=0; vy+=0.5;` 射出中。`vy=8` 射出完了時 |
| E2 | AI 思考→vx/vy 直接加算の一体化 | L908-923 | AI の moveAngle → driveAngle → `vx += cos(driveAngle) * accelForce` |
| E3 | 障害物回避→vx/vy 間接加算 | L891-904 | avoidX/avoidY → targetVx/targetVy → driveAngle → vx/vy |
| E4 | 射撃判定が update() 内で完結 | L941-976 | distToPlayer < 800 → fireTimer → EnemyBullet 生成 |
| E5 | angle（機体向き）が bodyAngle と別名 | L740, L938 | EnemyShip は `this.angle`、PlayerShip は `this.bodyAngle`。統一が必要 |

### 2-3. 外部（main.js の衝突判定）からの vx/vy 操作

| # | 箇所 | 対象 | 操作 |
|---|------|------|------|
| C1 | L1234-1237 | Debris ↔ Player | impulse による vx/vy 加算 |
| C2 | L1284-1287 | Debris ↔ Enemy | impulse による vx/vy 加算 |
| C3 | L1560-1563 | Enemy ↔ Enemy | impulse による vx/vy 加算 |
| C4 | L1655-1658 | Enemy ↔ Player | impulse による vx/vy 加算 |
| C5 | L1766-1767 | Player ↔ Mothership | impulse による vx/vy 加算 |
| C6 | L1821-1822 | 着艦トリガー | player.vx = 0; player.vy = 0; |
| C7 | L2073-2074 | レベルアップ後 | player.vx = 0; player.vy = 0; |

> **重要**: C1〜C5 の impulse は衝突判定の結果としての即時力であり、applyControl() / updatePhysics() の管轄外とする。
> 衝突 impulse は order5 の明示的除外事項（「recoil / impulse は除外可能」L306）に該当する。

---

## 3. Physics 処理の所在マップ

### 3-1. rotation（旋回）

| 処理 | ファイル | 行番号 | 所属 | 概要 |
|------|---------|--------|------|------|
| Player 左旋回 | main.js | L392 | PlayerShip.update() | `bodyAngle -= playerStats.handling` |
| Player 右旋回 | main.js | L395 | PlayerShip.update() | `bodyAngle += playerStats.handling` |
| Player 砲塔角度同期（SUBSPACE） | main.js | L399 | PlayerShip.update() | `turretAngle = bodyAngle` |
| Player 砲塔角度（MOUSE_AIM） | main.js | L403 | PlayerShip.update() | `turretAngle = mouseAngle` |
| Enemy 機首旋回 | main.js | L938 | EnemyShip.update() | `this.angle = rotateTowards(this.angle, targetAimAngle, eHandling)` |
| 着艦中の機体旋回 | main.js | L483,514,515 | PlayerShip.update() | `rotateTowards(bodyAngle, target, speed)` |

### 3-2. acceleration（加速）

| 処理 | ファイル | 行番号 | 所属 | 概要 |
|------|---------|--------|------|------|
| Player 前進推力 | main.js | L434-435 | PlayerShip.update() | `vx += cos(bodyAngle) * accel` |
| Player 後退推力 | main.js | L443-444 | PlayerShip.update() | `vx -= cos(bodyAngle) * reverseAccel` |
| Enemy 慣性駆動 | main.js | L922-923 | EnemyShip.update() | `vx += cos(driveAngle) * accelForce` |
| Enemy 射出加速 | main.js | L771 | EnemyShip.update() | `vy += 0.5` |

### 3-3. boost（ブースト）

| 処理 | ファイル | 行番号 | 所属 | 概要 |
|------|---------|--------|------|------|
| ブーストゲージ管理 | main.js | L330-384 | PlayerShip.update() | ShiftLeft/ShiftRight → isBoosting → gauge 消費/回復/クールダウン |
| ブースト速度倍率 | main.js | L420-427 | PlayerShip.update() | boostSpeedMult = 3.0, boostAccelMult = 10.0〜20.0 |
| ブースト最高速度拡張 | main.js | L429 | PlayerShip.update() | `currentMaxSpeed = playerStats.maxSpeed * boostSpeedMult` |

### 3-4. friction（摩擦）

| 処理 | ファイル | 行番号 | 所属 | 概要 |
|------|---------|--------|------|------|
| 統一摩擦 | main.js | L231-232 | Ship.updatePhysics() | `vx *= CONFIG.FRICTION; vy *= CONFIG.FRICTION;` |
| Player 後退ブレーキ | main.js | L440-441 | PlayerShip.update() | `vx *= 0.95; vy *= 0.95;` |
| Player 急ブレーキ（Q） | main.js | L449-450 | PlayerShip.update() | `vx *= 0.7; vy *= 0.7;` |

### 3-5. drift（ドリフト）

ドリフトは独立した処理ではなく、以下の組み合わせにより創発される:

- `bodyAngle` 方向に推力を加算（L434-435）
- `FRICTION = 0.996` の極めて弱い摩擦（L231-232）
- speed clamp による最高速制限（L236-239）

→ ドリフト感は physics パラメータの結果であり、専用コードは存在しない。

### 3-6. recoil（反動）

| 処理 | ファイル | 行番号 | 所属 | 概要 |
|------|---------|--------|------|------|
| 射撃反動 | **なし** | — | — | 現在のコードに射撃反動は実装されていない |
| 衝突反動（impulse） | main.js | L1234-1237, L1284-1287, L1560-1563, L1655-1658, L1766-1767 | 衝突判定 | 衝突時に vx/vy へ直接加算。Controller 管轄外 |

---

## 4. applyControl() / updatePhysics() 導入に必要な移動処理

### 4-1. Ship.applyControl(input) に移動する処理

| 移動元 | 行番号 | 処理 | 概要 |
|--------|--------|------|------|
| PlayerShip.update() | L392-395 | rotation | bodyAngle への handling 加算（left/right 入力に基づく） |
| PlayerShip.update() | L398-404 | turret sync | turretAngle の設定（controlMode 分岐） |
| PlayerShip.update() | L431-436 | thrust | bodyAngle 方向への推力加算 |
| PlayerShip.update() | L439-445 | brake/reverse | 後退ブレーキ + 逆方向推力 |
| PlayerShip.update() | L448-461 | tactical brake | Q ブレーキ（速度減衰 0.7） |
| EnemyShip.update() | L922-923 | thrust | driveAngle 方向への推力加算 |

### 4-2. Ship.updatePhysics() — 変更不要（現在のまま維持）

```
摩擦適用 → 速度クランプ → 座標更新
```

order5 の設計どおり、updatePhysics() は純粋な物理計算のみ。現状ですでにその責務を満たしている。

### 4-3. Controller 管轄外として残す処理

| 処理 | 理由 |
|------|------|
| 発艦シーケンス（L302-320, L761-781） | 入力に依存しない強制遷移。applyControl を呼ばない |
| 着艦シーケンス（L469-588） | 入力に依存しない強制遷移。applyControl を呼ばない |
| 衝突 impulse（C1〜C5） | 衝突判定の結果。order5 で明示的に除外 |
| 射撃処理（L604-706, L941-980） | fire は ControllerInput に含めるが、実弾生成は Ship 側に残す |
| ブーストゲージ管理（L330-384） | ControllerInput.boost を通すが、ゲージ管理自体は Ship 側 |

---

## 5. ControllerInput に必要な項目（実コードから抽出）

### 5-1. PlayerShip から抽出した入力

| 項目 | 型 | 抽出元 | 概要 |
|------|-----|--------|------|
| turnLeft | boolean | L387: `InputManager.isPressed('KeyA') \|\| isPressed('ArrowLeft')` | 左旋回入力 |
| turnRight | boolean | L388: `InputManager.isPressed('KeyD') \|\| isPressed('ArrowRight')` | 右旋回入力 |
| thrust | boolean | L407: `InputManager.isPressed('KeyW') \|\| isPressed('ArrowUp')` | 前進入力 |
| brake | boolean | L439: `InputManager.isPressed('KeyS') \|\| isPressed('ArrowDown')` | 後退入力 |
| tacticalBrake | boolean | L448: `InputManager.isPressed('KeyQ')` | タクティカル・ブレーキ（maneuver >= 6 時のみ有効） |
| boost | boolean | L350: `InputManager.isPressed('ShiftLeft') \|\| isPressed('ShiftRight')` | ブースト入力 |
| firePrimary | boolean | L607: `InputManager.isPressed('Space') \|\| mouse.rightDown` | 主砲射撃入力 |
| fireSecondary | boolean | L655: `InputManager.isPressed('KeyE')` | ミサイル発射入力 |
| aimAngle | number | L402-403: `Math.atan2(mouse.y - height/2, mouse.x - width/2)` | マウスエイム角度（MOUSE_AIM モード時のみ使用） |

### 5-2. EnemyShip から抽出する仮想入力

| 項目 | 型 | 抽出元 | 概要 |
|------|-----|--------|------|
| turnLeft | boolean | 不使用（Enemy は角度直接操作） | → 代替: `driveAngle` を出力 |
| turnRight | boolean | 不使用 | 同上 |
| thrust | boolean | L922-923: 常時推力加算中 | → 代替: `thrustPower` (number) を出力 |
| firePrimary | boolean | L951-976: distToPlayer < 800 かつ fireTimer 超過時 | 射撃意思 |

> **重要な気付き**: EnemyShip は `bodyAngle` + `handling` による旋回をしていない。
> EnemyShip は `driveAngle`（= 目標方向 + 回避方向の合成角度）を直接計算し、`vx += cos(driveAngle) * accelForce` で加速している。
> つまり Enemy の移動は **turn + thrust 方式ではなく、直接方向指定方式** である。

### 5-3. ControllerInput 統一インターフェースの提案

```
ControllerInput = {
    // === 旋回 ===
    turnLeft:       false,    // Player: A/← キー。Enemy: 不使用
    turnRight:      false,    // Player: D/→ キー。Enemy: 不使用

    // === 推進 ===
    thrust:         false,    // Player: W/↑ キー。Enemy: 常時 true
    brake:          false,    // Player: S/↓ キー。Enemy: 不使用
    tacticalBrake:  false,    // Player: Q キー（maneuver >= 6）。Enemy: 不使用

    // === ブースト ===
    boost:          false,    // Player: Shift キー。Enemy: 不使用

    // === 射撃 ===
    firePrimary:    false,    // Player: Space/右クリック。Enemy: 射程内時 true
    fireSecondary:  false,    // Player: E キー。Enemy: 不使用

    // === エイム ===
    aimAngle:       0,        // Player: マウス角度 / bodyAngle。Enemy: rotateTowards 角度

    // === AI 専用（Enemy のみ使用） ===
    driveAngle:     0,        // Enemy: 移動方向角度（AI 思考結果）。Player: 不使用
    drivePower:     0,        // Enemy: 加速度係数。Player: 不使用
}
```

### 5-4. 統一の困難点

**PlayerShip と EnemyShip の操縦モデルが根本的に異なる:**

| 項目 | PlayerShip | EnemyShip |
|------|-----------|-----------|
| 旋回方式 | `bodyAngle += handling`（旋回速度制限あり）| 旋回なし。`driveAngle` を直接計算 |
| 推進方式 | `bodyAngle` 方向に推力加算 | `driveAngle` 方向に推力加算 |
| 最高速度 | `playerStats.maxSpeed * boostSpeedMult` | `CONFIG.ENEMY_MAX_SPEED * spdMult` |
| 摩擦 | Ship.updatePhysics() の FRICTION | 同一 |
| ブレーキ | 3種（S, Q, なし） | なし |
| ブースト | あり（Shift、ゲージ管理あり） | なし |
| エイム方式 | bodyAngle or マウス角度 | `rotateTowards(angle, aimAngle, handling)` |

→ **Player は「旋回 + 推進」モデル、Enemy は「方向指定」モデル** であり、
applyControl() の内部実装でこの差異を吸収する必要がある。

---

## 6. HumanController 導入時の最小変更案

### 6-1. 新規ファイル

```
js/controllers/HumanController.js
js/controllers/ControllerInput.js  （ControllerInput のファクトリ/テンプレート）
```

### 6-2. HumanController の責務

```javascript
// HumanController.getInput(player, GAME, playerStats) → ControllerInput
// 以下を InputManager から読み取り、ControllerInput に詰めて返す:
//   turnLeft, turnRight, thrust, brake, tacticalBrake,
//   boost, firePrimary, fireSecondary, aimAngle
```

### 6-3. PlayerShip.update() の変更方針

**Before（現在）:**
```
PlayerShip.update(GAME, entities):
    1. 発艦シーケンス
    2. InputManager から入力を読む
    3. 入力 → vx/vy に変換
    4. super.updatePhysics()
    5. 射撃処理
```

**After（Phase 5）:**
```
PlayerShip.update(GAME, entities):
    1. 発艦シーケンス（変更なし）
    2. canControl 時:
       input = HumanController.getInput(this, GAME, playerStats)
       this.applyControl(input, playerStats)
       super.updatePhysics(currentMaxSpeed)
    3. 着艦シーケンス（変更なし）
    4. 射撃処理（input.firePrimary / input.fireSecondary を使用）
```

### 6-4. 最小変更の範囲

| ファイル | 操作 | 変更内容 |
|---------|------|---------|
| js/controllers/ControllerInput.js | **新規** | ControllerInput テンプレートの定義 |
| js/controllers/HumanController.js | **新規** | InputManager → ControllerInput 変換 |
| main.js 内 Ship クラス | **修正** | applyControl(input, stats) メソッドの追加 |
| main.js 内 PlayerShip.update() | **修正** | InputManager 直接呼び出しを HumanController.getInput() に置換 |
| index.html | **修正** | ControllerInput.js / HumanController.js の script タグ追加 |
| changelog.js | **修正** | バージョンエントリ追加 |

### 6-5. USE_UNIFIED_CONTROLLER フラグ

```javascript
// CONFIG に追加
USE_UNIFIED_CONTROLLER: false,
```

PlayerShip.update() 内で:
```
if (CONFIG.USE_UNIFIED_CONTROLLER) {
    // 新方式: HumanController → applyControl → updatePhysics
} else {
    // 旧方式: 現行コードをそのまま維持
}
```

---

## 7. AIController 導入時の最大リスク箇所

### 7-1. EnemyShip.update() 内の vx/vy 直接アクセス全箇所

| # | 行番号 | コード | 文脈 | リスク |
|---|--------|--------|------|--------|
| 1 | L765 | `this.vx = 0;` | 射出シーケンス：ドック待機 | 低（applyControl 管轄外） |
| 2 | L766 | `this.vy = 0;` | 同上 | 低 |
| 3 | L770 | `this.vx = 0;` | 射出シーケンス：カタパルト射出中 | 低 |
| 4 | L771 | `this.vy += 0.5;` | 射出加速 | 低（管轄外） |
| 5 | L773 | `this.x += this.vx;` | 射出中の座標更新（updatePhysics 不使用） | 低 |
| 6 | L774 | `this.y += this.vy;` | 同上 | 低 |
| 7 | L778 | `this.vy = 8;` | 射出完了時の初速設定 | 低（管轄外） |
| **8** | **L922** | **`this.vx += Math.cos(driveAngle) * accelForce;`** | **AI 加速（メインの推進力）** | **最大リスク** |
| **9** | **L923** | **`this.vy += Math.sin(driveAngle) * accelForce;`** | **同上** | **最大リスク** |
| 10 | L971 | `this.vx * 0.5`（参照のみ） | 敵弾速度に慣性を加味 | なし（参照のみ） |
| 11 | L972 | `this.vy * 0.5`（参照のみ） | 同上 | なし |
| 12 | L826 | `Math.hypot(this.vx, this.vy)`（参照のみ） | eSpeed 計算 | なし |
| 13 | L832-833 | `this.vx / eSpeed`（参照のみ） | 進行方向ベクトル | なし |

### 7-2. 最大リスクの詳細（L922-923）

**問題**: EnemyShip は PlayerShip と異なる操縦モデルを使用している。

- PlayerShip: `bodyAngle` 方向に推力加算（turn + thrust モデル）
- EnemyShip: `driveAngle` 方向に推力加算（方向指定モデル）

AI の思考結果（moveAngle + avoidX/avoidY → driveAngle）を applyControl() に変換する際、
以下の2つの方式が考えられる:

**方式A: ControllerInput に driveAngle / drivePower を追加**
→ applyControl() 内で driveAngle 方向に推力加算。
→ 利点: AI 思考ロジックの変更が最小。
→ 欠点: Player と Enemy で applyControl() 内部のコードパスが分岐する。

**方式B: AI の driveAngle を turn + thrust に逆変換**
→ AIController が `turnLeft/turnRight/thrust` を計算して出力。
→ 利点: 真の Newtonian Symmetry（同一 physics パス）。
→ 欠点: AI の挙動が微妙に変わるリスクが高い。ドリフト特性が変化する。

> **推奨: 方式A**
> order5 の原則「AI 思考ロジックを変更しない」（L79）を遵守するため。
> driveAngle / drivePower は ControllerInput の AI 専用フィールドとし、
> applyControl() 内で `if (input.driveAngle !== undefined)` で分岐する。

### 7-3. 外部からの EnemyShip.vx/vy 操作（衝突判定）

| # | 行番号 | コード | リスク |
|---|--------|--------|--------|
| C2 | L1286-1287 | `e.vx += eImpulse * nx;` | なし（impulse は管轄外） |
| C3 | L1560-1563 | `e1.vx -= impulse * nx;` 等 | なし（同上） |
| C4 | L1657-1658 | `e.vx += impulse * nx;` | なし（同上） |

---

## 8. Newtonian Symmetry 実現までの実装ステップ

### Step 分割案

| Step | 内容 | 新規ファイル | 修正ファイル | リスク |
|------|------|------------|------------|--------|
| **Step 1** | ControllerInput 定義 + HumanController 導入 + Ship.applyControl() 追加 | ControllerInput.js, HumanController.js | Ship(main.js), PlayerShip(main.js), index.html, changelog.js | 中 |
| **Step 2** | PlayerShip.update() を HumanController 経由に切り替え（USE_UNIFIED_CONTROLLER フラグ付き） | なし | PlayerShip(main.js), config.js, changelog.js | 高 |
| **Step 3** | AIController 導入 + EnemyShip.update() を AIController 経由に切り替え（フラグ付き） | AIController.js | EnemyShip(main.js), index.html, changelog.js | **最高** |
| **Step 4** | EnemyShip の vx/vy 直接操作（L922-923）を applyControl 経由に変換 | なし | EnemyShip(main.js), changelog.js | 高 |
| **Step 5** | USE_UNIFIED_CONTROLLER = true をデフォルト化 + 旧コードパス除去 | なし | PlayerShip(main.js), EnemyShip(main.js), config.js, changelog.js | 中 |
| **Step 6** | PlayerShip / EnemyShip / Ship クラスの main.js からの正式分離 | 該当ファイルに実体コード移動 | main.js, Ship.js, PlayerShip.js, EnemyShip.js, index.html, changelog.js | 中 |

### 順序変更禁止ルールへの適合確認

| ルール | 適合 | 理由 |
|--------|------|------|
| collision 順変更禁止 | ✅ | 衝突判定コードは一切変更しない。impulse は管轄外 |
| cleanup 順変更禁止 | ✅ | cleanup（splice）コードは一切変更しない |
| draw 順変更禁止 | ✅ | 描画コードは一切変更しない |
| update 順変更禁止 | ✅ | update() 内の `player.update()` / `e.update()` の呼び出し位置は変わらない。内部構造のみ変更 |

---

## 9. 各 Step の詳細

### Step 1: ControllerInput 定義 + HumanController 導入 + Ship.applyControl()

**目的**: 基盤を構築。まだ既存コードに影響しない。

**新規ファイル**:
- `js/controllers/ControllerInput.js` — ControllerInput のファクトリ関数を定義
- `js/controllers/HumanController.js` — InputManager → ControllerInput 変換

**修正ファイル**:
- `main.js` 内 Ship クラス — `applyControl(input, stats)` メソッドを追加（空実装）
- `index.html` — 2ファイルの script タグ追加
- `changelog.js` — バージョンエントリ

**リスク**: 低。既存動作に影響なし。

---

### Step 2: PlayerShip を HumanController 経由に切り替え

**目的**: PlayerShip.update() の InputManager 直接呼び出しを HumanController.getInput() に置換。

**修正ファイル**:
- `main.js` 内 PlayerShip.update() — InputManager 呼び出しを ControllerInput 経由に変更
- `main.js` 内 Ship.applyControl() — Player 用の推力・旋回ロジックを実装
- `config.js` — `USE_UNIFIED_CONTROLLER: false` フラグ追加

**修正箇所の具体的な内容**:
```
PlayerShip.update() 内:
  if (CONFIG.USE_UNIFIED_CONTROLLER && canControl) {
      const input = HumanController.getInput(this, GAME, playerStats);
      this.applyControl(input, playerStats);
      super.updatePhysics(currentMaxSpeed);
  } else {
      // 旧コード
  }
```

**リスク**: 中〜高。ブーストゲージ管理の密結合が最大の課題。

**検証方法**:
1. `USE_UNIFIED_CONTROLLER = true` に設定してプレイ
2. 旋回感覚・ドリフト感覚・ブースト挙動が同一であることを確認
3. `false` に戻して旧方式でも動作することを確認

---

### Step 3: AIController 導入 + EnemyShip 切り替え

**目的**: EnemyShip.update() の AI 思考→推力加算を AIController 経由に変更。

**新規ファイル**:
- `js/controllers/AIController.js` — AI 思考 → ControllerInput 変換

**修正ファイル**:
- `main.js` 内 EnemyShip.update() — AI 加速（L922-923）を applyControl 経由に変更
- `index.html` — AIController.js の script タグ追加
- `changelog.js` — バージョンエントリ

**最大リスク箇所**:
- L922-923 の `vx += cos(driveAngle) * accelForce` を除去し、
  `ControllerInput.driveAngle = driveAngle; ControllerInput.drivePower = accelForce;` に変換する。
- applyControl() 内で `input.driveAngle` が存在する場合にのみ方向指定推進を適用する。

**リスク**: 最高。敵の挙動が微妙に変化する可能性がある。

**検証方法**:
1. `USE_UNIFIED_CONTROLLER = true` で敵の動きを観察
2. 特に SNIPER の距離維持、DOGFIGHTER のすれ違い、RAMMER の突進パターンを確認
3. フラグ切り替えで旧方式に戻せることを確認

---

### Step 4: vx/vy 直接操作の除去

**目的**: EnemyShip 内の AI 推力加算（L922-923）を applyControl() に完全移行。

**修正箇所**: Step 3 で `USE_UNIFIED_CONTROLLER = true` パスが安定したら、
`false` パスの旧コードを削除する作業の一部。

**リスク**: 高。Step 3 の検証結果に依存。

---

### Step 5: フラグ除去 + 旧コードパス削除

**目的**: `USE_UNIFIED_CONTROLLER` フラグを除去し、新方式を唯一のコードパスにする。

**リスク**: 中。ロールバック不可になるため、十分な検証が必要。

---

### Step 6: クラスの main.js からの正式分離

**目的**: Ship / PlayerShip / EnemyShip のクラス定義を main.js から対応するファイルに移動。

**リスク**: 中。Phase 3 の延長作業。index.html の読み込み順に注意。

---

## 10. リスク評価まとめ

### 危険度順

| 順位 | リスク | 該当 Step | 影響 | 対策 |
|------|--------|----------|------|------|
| **1** | EnemyShip の操縦モデル差異 | Step 3-4 | 敵の動きが変わる | 方式A（driveAngle/drivePower）を採用し、AI 思考ロジックを変更しない |
| **2** | ブースト管理の密結合 | Step 2 | ブースト挙動の変化 | ブーストゲージ管理は PlayerShip に残し、applyControl は純粋な物理のみ |
| **3** | playerStats の二重管理 | Step 2 | handling/maxSpeed の参照先不整合 | applyControl の引数に playerStats を渡す設計で回避 |
| **4** | 着艦/発艦シーケンスの特殊制御 | Step 2 | applyControl をスキップする場合の漏れ | canControl フラグで明確にガード |
| **5** | 射撃タイミングのズレ | Step 2-3 | fireTimer の更新順序 | 射撃処理は applyControl の外に残す |
| **6** | angle vs bodyAngle の名前不統一 | Step 3 | コードの可読性低下 | Step 6 で統一名称に変更 |

### 長期リスク

| リスク | 内容 |
|--------|------|
| 方式A と方式B の中途半端な混在 | driveAngle を使用する限り、完全な Newtonian Symmetry（方式B）にはならない |
| パフォーマンス | 毎フレーム ControllerInput オブジェクトを生成する。GC 負荷は微量だが、プールする選択肢あり |
| 将来の AI 拡張 | 方式A では AI が常に「方向指定」で操縦するため、「旋回して前進」するAIを作るには方式B が必要 |

---

## 11. 作業規模見積もり

### ファイル数

| 項目 | 数 |
|------|-----|
| 新規ファイル | 3〜4（ControllerInput.js, HumanController.js, AIController.js + 必要に応じて controllers/ ディレクトリ） |
| 修正ファイル | 4〜5（main.js, config.js, index.html, changelog.js + Ship.js/PlayerShip.js/EnemyShip.js は Step 6 で） |
| 合計想定 Step 数 | **6 Step** |

### Step 別工数見積もり

| Step | 内容 | 想定行数 | 工数 | リスク |
|------|------|---------|------|--------|
| Step 1 | ControllerInput + HumanController 足場 | +100行 | 小 | 低 |
| Step 2 | PlayerShip HumanController 経由化 | ±150行 | 中 | 中〜高 |
| Step 3 | AIController 導入 + EnemyShip 切替 | +120行 / -20行 | 中 | **最高** |
| Step 4 | vx/vy 直接操作除去 | ±30行 | 小 | 高（Step 3 依存） |
| Step 5 | フラグ除去 + 旧パス削除 | -200行 | 小 | 中 |
| Step 6 | クラス分離（main.js → 個別ファイル） | ±0行（移動のみ） | 中 | 中 |

---

## 12. 推奨実装順

```
Step 1（足場構築）
  ↓ リスク: 低。既存動作影響なし
Step 2（Player 切替）
  ↓ リスク: 中〜高。要手動検証
Step 3（Enemy 切替）
  ↓ リスク: 最高。要入念検証
Step 4（vx/vy 除去）
  ↓ リスク: 高（Step 3 依存）
Step 5（フラグ除去）
  ↓ リスク: 中
Step 6（クラス分離）
    リスク: 中
```

> **特記**: Step 2 → Step 3 の間に必ず十分な挙動検証を挟むこと。
> Player の挙動が完全互換であることを確認してから Enemy に着手する。

---

## 13. 未決定事項（ユーザー判断待ち）

| # | 項目 | 選択肢 | 推奨 |
|---|------|--------|------|
| 1 | AI 操縦モデル | A: driveAngle/drivePower（現行挙動維持）/ B: turn+thrust（真の対称性） | **A** |
| 2 | ControllerInput の形式 | オブジェクトリテラル / class | オブジェクトリテラル |
| 3 | HumanController / AIController の形式 | const オブジェクト / class | const オブジェクト（既存パターンに統一） |
| 4 | Step 6（クラス分離）の実施タイミング | Phase 5 内 / Phase 6 に後回し | Phase 5 内（Step 5 の後） |
| 5 | angle vs bodyAngle の名称統一 | Step 3 で先行統一 / Step 6 で統一 | Step 6 |
| 6 | playerStats 二重管理の解消 | Phase 5 内 / 将来フェーズ | **将来フェーズ**（Phase 5 のスコープ外） |

---

## 14. 計画書終了

本文書はコード変更を含まない。
実装開始にはユーザーの承認が必要。
