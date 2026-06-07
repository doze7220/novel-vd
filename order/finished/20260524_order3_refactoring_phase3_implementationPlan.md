# Phase 3: Newtonian Symmetry（物理統合）リファクタリング実装計画

## 概要

`main.js` の `update()` 関数（現在約1,570行: L446〜L2017）に残っている **プレイヤー操作ロジック** と **敵AIロジック** を `PlayerShip` / `EnemyShip` クラスへ移動し、共通の物理演算を `Ship.updatePhysics()` に統合する。

> [!IMPORTANT]
> **絶対原則**: ゲームの挙動・操作感・敵AIの思考・演出は1pxも変えない（完全互換）。

---

## 現状分析

### main.js update() の構造（L446〜L2017）

| 行範囲 | 処理内容 | 移動先 |
|---|---|---|
| L446-467 | シーン分岐（TITLE/LEVEL_UP/RESULT/PLAYING） | **残す** |
| L469-475 | 経過時間カウント | **残す** |
| L477-479 | prevVx/prevVy保存 | → `PlayerShip.update()` |
| L482-499 | 発艦シーケンス | → `PlayerShip.update()` |
| L501-504 | HUD表示切替 | **残す**（UIなので） |
| L506-512 | handling計算 | → `PlayerShip.update()` |
| L514-568 | ブーストゲージ管理 | → `PlayerShip.update()` |
| L570-659 | キー入力→推力・旋回・摩擦・速度クランプ・座標更新 | → `PlayerShip.update()` (物理部分は`Ship.updatePhysics()`) |
| L660-663 | 発進中の座標更新 | → `PlayerShip.update()` |
| L664-783 | 着艦シーケンス | → `PlayerShip.update()` |
| L786-795 | 最近敵探索（自動エイム用） | → `PlayerShip.update()` |
| L800-847 | ヒートゲージ＆射撃ロジック | → `PlayerShip.update()` |
| L849-901 | ミサイル発射 | → `PlayerShip.update()` |
| L903-913 | 星背景スクロール | **残す** |
| L915-916 | EffectManager.update | **残す** |
| L918-1121 | デブリ・爆発の衝突判定 | **残す**（Phase 4で移動） |
| L1123-1250 | 弾・ミサイルの移動・衝突 | **残す**（Phase 4で移動） |
| L1252-1319 | 敵スポーン制御 | **残す** |
| L1322-1371 | 敵同士の衝突物理 | **残す**（衝突判定） |
| L1373-1399 | 敵・射出シーケンス | → `EnemyShip.update()` |
| L1402-1440 | 敵・性格別ターゲット計算 | → `EnemyShip.update()` |
| L1442-1525 | 敵・障害物回避AI | → `EnemyShip.update()` |
| L1527-1557 | 敵・移動物理（加速→摩擦→クランプ→座標更新） | → `EnemyShip.update()` (物理部分は`Ship.updatePhysics()`) |
| L1559-1569 | 敵・エイム揺らぎ＆機首旋回 | → `EnemyShip.update()` |
| L1572-1611 | 敵・射撃＆ヒート管理 | → `EnemyShip.update()` |
| L1613 | 敵・flashTimer減算 | → `EnemyShip.update()` |
| L1615-1707 | 弾−敵衝突判定・体当たり衝突・生存チェック | **残す**（衝突判定） |
| L1710-1810 | 敵母艦衝突判定 | **残す** |
| L1812-1905 | ジェム回収・ミッション・着艦判定・HP警告 | **残す** |
| L1907-2014 | トレイル更新 | **残す**（描画関連） |
| L2016 | HUDManager.update | **残す** |

---

## 提案する変更

### 触れないファイル（絶対条件）

- `js/renderers/` 配下全ファイル（drawBackground, drawEffects, drawHUD, drawOverlay）
- `js/systems/hud.js`, `map.js`, `radar.js`, `effects.js`
- `js/utils/` 配下全ファイル
- `js/scenes/` 配下全ファイル

---

### Step 1: Ship基底クラスの物理メソッド実装

#### [MODIFY] [main.js](file:///d:/ozlab/star-survivor/js/main.js) 内の `class Ship`

`Ship` クラスに以下のメソッドを追加:

```javascript
// 純粋な物理演算のみ: 摩擦 → 速度クランプ → 座標更新
updatePhysics(maxSpeed) {
    // 摩擦（CONFIG.FRICTION）
    this.vx *= CONFIG.FRICTION;
    this.vy *= CONFIG.FRICTION;

    // 最高速度クランプ
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
    }

    // 座標更新
    this.x += this.vx;
    this.y += this.vy;
}

// ダメージ処理（flashTimer設定）
takeDamage(amount) {
    this.hp -= amount;
    this.flashTimer = CONFIG.FLASH_DURATION;
}
```

> [!WARNING]
> **updatePhysics() の処理順序について**: 現在の `main.js` を精査すると、**プレイヤーと敵で物理演算の順序が異なります**。
> - **プレイヤー**: 推力加算 → 摩擦 → 速度クランプ → **座標更新**（L618-659）
> - **敵**: 加速度加算 → **摩擦** → 速度クランプ → **座標更新**（L1541-1557）
>
> 両者とも「摩擦 → クランプ → 座標更新」の順序は同一のため、`updatePhysics()` は共通化可能です。
> ただしプレイヤーの `currentMaxSpeed` はブースト時に変動するため、引数で `maxSpeed` を渡す設計にします。

---

### Step 2: PlayerShip ロジックカプセル化

#### [MODIFY] [main.js](file:///d:/ozlab/star-survivor/js/main.js) 内の `class PlayerShip`

`PlayerShip` に `update(keys, mouse, controlMode, GAME, entities)` メソッドを追加し、以下のロジックを移動:

1. **prevVx/prevVy 保存**（L477-479）
2. **発艦シーケンス**（L482-499）
3. **handling 計算**（L506-512）
4. **ブーストゲージ管理**（L514-568）
5. **キー入力→推力・旋回**（L570-629）
6. **タクティカル・ブレーキ**（L631-645）
7. **摩擦・速度クランプ・座標更新** → `super.updatePhysics(currentMaxSpeed)` を呼び出し
8. **発進中の座標更新**（L660-663）
9. **着艦シーケンス**（L664-783）
10. **最近敵探索**（L786-795）
11. **ヒートゲージ＆射撃ロジック**（L800-847）
12. **ミサイル発射**（L849-901）

> [!IMPORTANT]
> **パーティクル生成（タクティカル・ブレーキのスパーク L637-644）について**: 指示書では「パーティクル生成は main.js に残す」とありますが、タクティカル・ブレーキの火花は操作ロジックと不可分です。以下のいずれかを選択いただけますか：
> - **(A)** タクティカル・ブレーキのスパーク生成も含めて `PlayerShip.update()` へ移動する（`entities.particles` への参照が必要）
> - **(B)** タクティカル・ブレーキのスパーク生成のみ main.js に残し、フラグで制御する
>
> **推奨: (A)** — entities を引数で受け取るため、パーティクル追加は自然に行えます。Phase 4で衝突判定側のパーティクルを移す際に分離すれば整合性が保てます。

#### PlayerShip.update() の物理演算部分の詳細

```javascript
// PlayerShip.update() 内（概略）
update(GAME, entities) {
    this.prevVx = this.vx;
    this.prevVy = this.vy;

    // 発艦シーケンス処理
    if (GAME.launchSequence) { ... }

    const canControl = !GAME.isPlayerDying && !this.isLandingSequence && !GAME.launchSequence;

    // handling計算、ブーストゲージ管理
    if (canControl) { ... }

    // 操作入力→推力、旋回
    if (canControl) {
        // ... 推力・旋回・ブレーキ ...

        // ※ここでは摩擦を適用せず、super.updatePhysics() に委ねる
        // ただし、プレイヤーは摩擦適用の「前に」推力とブレーキを適用するため、
        // 直接 vx/vy を変更してから updatePhysics を呼ぶ
        super.updatePhysics(currentMaxSpeed);
    } else if (GAME.launchSequence) {
        this.x += this.vx;
        this.y += this.vy;
    } else if (this.isLandingSequence) {
        // 着艦は物理と独立した特殊シーケンス
        ...
    }

    // ヒート＆射撃
    // ミサイル発射
}
```

> [!WARNING]
> **プレイヤーの物理演算で `updatePhysics()` に統合できない部分**:
> - プレイヤーの後退（S キー）は `player.vx *= 0.95` のブレーキ処理があり、これは摩擦（FRICTION=0.996）とは別の減衰。これは `updatePhysics()` の**前に**適用されている。
> - タクティカル・ブレーキ（Q キー）も `player.vx *= 0.7` で、同様に摩擦前に適用。
>
> → これらは `updatePhysics()` 呼び出し前に PlayerShip 側で処理するため、問題なし。

---

### Step 3: EnemyShip ロジックカプセル化

#### [MODIFY] [main.js](file:///d:/ozlab/star-survivor/js/main.js) 内の `class EnemyShip`

`EnemyShip` に `update(player, entities, GAME)` メソッドを追加し、以下のロジックを移動:

1. **射出シーケンス**（L1380-1399）
2. **性格別ターゲット座標計算**（L1402-1440）
3. **障害物回避AI**（L1442-1525）
4. **移動物理（加速度加算）** → `super.updatePhysics(maxSpd)` を呼び出し（L1527-1557）
5. **エイム揺らぎ＆機首旋回**（L1559-1569）
6. **射撃＆ヒート管理**（L1572-1611）
7. **flashTimer 減算**（L1613）

#### EnemyShip.update() の物理演算部分の詳細

```javascript
// EnemyShip.update() 内（概略）
update(player, entities, GAME) {
    const edx = player.x - this.x;
    const edy = player.y - this.y;
    const distToPlayer = Math.hypot(edx, edy);

    // 射出シーケンス
    if (this.isLaunching) { ... return; }

    // 性格別ターゲット座標決定
    let targetX, targetY;
    ...

    // 障害物回避AI
    let avoidX = 0, avoidY = 0;
    ...

    // 移動角度→加速度をvx/vyに加算
    const maxSpd = CONFIG.ENEMY_MAX_SPEED * (this.spdMult || 1.0);
    ...
    this.vx += Math.cos(driveAngle) * accelForce;
    this.vy += Math.sin(driveAngle) * accelForce;

    // 物理演算を基底クラスに委譲
    super.updatePhysics(maxSpd);

    // エイム揺らぎ、機首旋回
    ...

    // 射撃＆ヒート管理
    ...

    // flashTimer減算
    if (this.flashTimer > 0) this.flashTimer--;
}
```

> [!IMPORTANT]
> **敵の射出シーケンス中の座標更新について**: 射出中（`isLaunching = true`）の敵は `e.x += e.vx; e.y += e.vy;`（L1392-1393）を手動で行っており、`updatePhysics()` を通過しません。これは指示書の「発艦シーケンスは通常物理とは分離された特殊シーケンスとして扱い、updatePhysics() へ統合しないこと」の方針に合致しています。

---

### Step 4: main.js の update() を司令塔化

移動完了後の `update()` の構造:

```javascript
function update() {
    // シーン分岐（TITLE/LEVEL_UP/RESULT/PLAYING）
    ...
    if (GAME.state !== 'PLAYING') return;

    // 経過時間カウント
    ...

    // ★ プレイヤー更新（1行に集約）
    player.update(GAME, entities);

    // HUD表示切替
    ...

    // 星背景スクロール
    ...

    // エフェクト更新
    EffectManager.update(entities);

    // デブリ衝突判定（残す）
    ...

    // 弾・ミサイルの移動・衝突（残す）
    ...

    // 敵スポーン制御（残す）
    ...

    // 敵同士の衝突物理（残す）
    ...

    // ★ 敵更新＋衝突判定ループ
    for (let i = entities.enemies.length - 1; i >= 0; i--) {
        let e = entities.enemies[i];
        e.update(player, entities, GAME);

        // 弾−敵衝突判定（残す）
        ...

        // 体当たり衝突（残す）
        ...

        // 生存チェック（残す）
        ...
    }

    // 敵母艦衝突判定（残す）
    ...

    // ジェム回収・ミッション・着艦判定（残す）
    ...

    // トレイル更新（残す）
    ...

    // HUDManager.update
    HUDManager.update(playerStats, GAME);
}
```

---

### Step 5: 差分形式の提示

実装時に各ステップの差分を明確にし、削除行と置換行を提示します。

---

## 設計決定事項（確定済み）

以下の4項目はユーザーとの協議により確定。

### Q1: パーティクル生成 → **(A) PlayerShip.update() に含める**

タクティカル・ブレーキの火花パーティクル（L637-644）は操作ロジックと不可分であるため、`PlayerShip.update()` に含める。`entities` を引数で受け取るため `entities.particles.push(...)` は自然に記述可能。Phase 4 で衝突判定系のパーティクル（被弾火花・デブリ生成）を移す際に改めて整理する。

### Q2: HUD表示切替 → **(A) main.js に残す**

`document.getElementById('credits-panel')` 等のDOM操作はUIレイヤーの責務。`PlayerShip` はゲームロジック（物理・操作）のクラスであり、DOM参照を持たせない。発艦状態（`GAME.launchSequence`）は `PlayerShip.update()` の後に main.js 側で参照可能。

### Q3: クラス定義位置 → **(A) 既存構造を維持する**

今回の目的はロジック移植と物理統合であり、新規のファイル分割・module構造変更は行わない。既に `js/classes/` 等へ分離済みのクラスはそのまま維持し、`main.js` 内に残っているクラス定義も現状維持とする。`index.html` の script 読み込み順や依存関係の変更は行わない。

### Q4: トレイル更新処理 → **(B) main.js に残す**

トレイル更新処理（L1907-2014）は描画パイプラインへの入力データ生成であり、指示書の「描画は後半フェーズまで移動禁止」に該当する。敵機のトレイル更新（L2002-2014）も同じブロックにあるため、ここを分割するとプレイヤーと敵でトレイル更新の管理箇所がバラバラになる。

---

## 完了条件の確認

| 条件 | 検証方法 |
|---|---|
| `update()` が200〜300行程度に縮小 | 行数カウント |
| 物理演算が `Ship.updatePhysics()` を通過 | コードレビュー |
| プレイヤー操作が `PlayerShip.update()` に完全移動 | コードレビュー |
| 敵AIが `EnemyShip.update()` に完全移動 | コードレビュー |
| ゲーム挙動が完全一致 | ブラウザでの動作確認 |
| 描画・UI・エフェクトが無傷 | ブラウザでの動作確認 |

---

## Verification Plan

### 手動検証
1. ブラウザでゲームを起動し、タイトル→出撃→プレイ→着艦→リザルトの全フローを確認
2. プレイヤーの操作感（WASD移動、旋回、ブースト、ブレーキ）が変わらないことを確認
3. 敵AIの行動（RAMMER/SNIPER/DOGFIGHTER）が変わらないことを確認
4. 発艦・着艦シーケンスが正常に動作することを確認
5. 射撃・ミサイル発射が正常に動作することを確認
6. ヒートゲージ・ブーストゲージの挙動が変わらないことを確認
7. 衝突判定（弾−敵、体当たり、デブリ、爆発）が正常に動作することを確認
