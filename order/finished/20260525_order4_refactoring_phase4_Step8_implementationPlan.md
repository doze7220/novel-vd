# Phase 4 Step 8: CollisionManager 分離 — 実装計画書

## 1. Step 8 の目的

Step8は「CollisionManager導入の足場作り」である。

今回移植するのは
Gem回収処理のみ。

Enemy
Bullet
Missile
Explosion
Debris
Mothership

関連の衝突判定には一切触れるな。

CollisionManagerには
handleGemPickup() 以外のメソッドを作らないこと。

main.js の update() 内 Phase 6（L1785–L1808）に残存する **Gem 回収判定処理** を、  
新規ファイル `js/systems/CollisionManager.js` の `handleGemPickup()` メソッドへ移植する。

- 汎用 Collision System は作成しない
- `handleGemPickup()` **単体の分離のみ** を対象とする
- 将来的に他の衝突カテゴリ（playerBulletVsEnemy, enemyBulletVsPlayer 等）を  
  同ファイルへ追加する足場を作る意図もあるが、本 Step では実装しない

Gem.update() は Step7 で完了済み。

今回移植対象なのは

- GEM_COLLECT_RADIUS 判定
- HP回復
- EXP加算
- checkLevelUp()
- gems.splice()

のみ。

Gem の吸引処理・移動処理には触れないこと。
---

## 2. CollisionManager の責務定義

```
CollisionManager = {
    handleGemPickup: function(entities, player, playerStats, checkLevelUp) { ... }
}
```
CollisionManager は新規作成するが、
今回実装するメソッドは
handleGemPickup() のみ。
他の衝突カテゴリは絶対に移植しない。

空メソッド、
TODOメソッド、
将来用スタブ、
コメントアウトされた雛形

も作成禁止。

CollisionManager.js に存在してよいメソッドは
handleGemPickup() のみとする。

### 責務

| 項目 | 内容 |
|------|------|
| 入力 | `entities.gems`, `player`, `playerStats`, `checkLevelUp` 関数参照 |
| 処理 | Gem回収判定（dist計算→EXP/HP加算→checkLevelUp→splice） |
| 副作用 | HP 回復 / EXP 加算 / `checkLevelUp()` 呼び出し / `entities.gems.splice()` |
| 出力 | なし（void） |

### 責務外（CollisionManager に含めないもの）

- Gem の生成（eliminator.js の責務）
- Gem の描画（drawEffects.js の責務）
- 他の衝突カテゴリ（本 Step では移植しない）
- Gem の吸引処理（Gem.update の責務）
- Gem の移動処理（Gem.update の責務）

---

## 3. handleGemPickup() の設計

### 3.1 関数シグネチャ

```javascript
/**
 * Gem 回収判定。
 * 毎フレーム update() から呼び出される。
 * 処理順序（変更禁止）:
 *   1. 逆順ループ (i = gems.length - 1 → 0)
 *   2. g.update(player) — 吸引・移動処理
 *   3. dist 再計算（update 後の最新座標）
 *   4. dist < GEM_COLLECT_RADIUS → 回収
 *      - HEAL: HP 回復（maxHp キャップ）
 *      - EXP/BIG_EXP: EXP 加算 → checkLevelUp()
 *   5. gems.splice(i, 1) — 回収済み Gem 削除
 *
 * @param {object} entities   - entities オブジェクト（gems 配列を含む）
 * @param {object} player     - プレイヤーエンティティ（x, y 参照）
 * @param {object} playerStats - playerStats オブジェクト（hp, maxHp, exp 参照・更新）
 * @param {function} checkLevelUp - レベルアップ判定関数
 */
handleGemPickup: function(entities, player, playerStats, checkLevelUp) {
    for (let i = entities.gems.length - 1; i >= 0; i--) {
        let g = entities.gems[i];

        // 吸引処理・移動処理を Gem.update(player) に委譲
        g.update(player);

        // 回収判定（g.update() 内で座標が更新されるため、dist を再計算）
        const gdx = player.x - g.x;
        const gdy = player.y - g.y;
        const dist = Math.hypot(gdx, gdy);

        if (dist < CONFIG.GEM_COLLECT_RADIUS) {
            if (g.kind === 'HEAL') {
                playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + (g.heal || CONFIG.HEAL_ITEM_AMOUNT));
            } else {
                playerStats.exp += g.exp;
                checkLevelUp();
            }
            entities.gems.splice(i, 1);
        }
    }
}
```

### 3.2 設計方針

- main.js L1786–L1807 のコードを **そのまま移植** する（ロジック変更なし）
- `g.update(player)` の呼び出し位置も維持する
- `CONFIG.GEM_COLLECT_RADIUS`, `CONFIG.HEAL_ITEM_AMOUNT` は既存グローバル参照をそのまま使用
- `checkLevelUp` は main.js で定義された関数を引数として受け取る
- `playerStats` は main.js のグローバルオブジェクトを引数として受け取る

---

## 4. main.js から移動するコード範囲

### 4.1 移植対象（main.js L1785–L1808）

```diff
-    // --- Phase 6: 成長要素 (ジェム回収) ---
-    for (let i = entities.gems.length - 1; i >= 0; i--) {
-        let g = entities.gems[i];
-
-        // 吸引処理・移動処理を Gem.update(player) に委譲
-        // 元コード: 距離計算 + MAGNET_RANGE 判定 + locked 吸引 + vx/vy 慣性移動
-        g.update(player);
-
-        // 回収判定（CollisionManager フェーズで移動予定）
-        // dist 再計算: g.update() 内で座標が更新されるため、収集半径チェックに最新座標を使う
-        const gdx = player.x - g.x;
-        const gdy = player.y - g.y;
-        const dist = Math.hypot(gdx, gdy);
-
-        if (dist < CONFIG.GEM_COLLECT_RADIUS) {
-            if (g.kind === 'HEAL') {
-                playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + (g.heal || CONFIG.HEAL_ITEM_AMOUNT));
-            } else {
-                playerStats.exp += g.exp;
-                checkLevelUp();
-            }
-            entities.gems.splice(i, 1);
-        }
-    }
```

### 4.2 置換後（main.js 同一行位置）

```diff
+    // --- Phase 6: 成長要素 (ジェム回収) ---
+    CollisionManager.handleGemPickup(entities, player, playerStats, checkLevelUp);
```

---

## 5. 変更対象ファイル一覧

| ファイル | 操作 | 内容 |
|---------|------|------|
| `js/systems/CollisionManager.js` | **新規作成** | `CollisionManager` オブジェクト定義。`handleGemPickup()` メソッドのみ |
| `js/main.js` | **修正** | L1785–L1808 の Gem 回収ループを削除し、`CollisionManager.handleGemPickup()` 呼び出しに置換 |
| `index.html` | **修正** | `<script>` タグを追加（CollisionManager.js の読み込み） |
| `js/changelog.js` | **修正** | v0.5.39 エントリ追加 |

---

## 6. index.html 変更有無

### 変更あり

`CollisionManager.js` を main.js より前に読み込む `<script>` タグを追加する。

```html
<!-- 追加位置: js/classes/Gem.js の直後、js/renderers/ の直前 -->
<script src="js/classes/Gem.js"></script>
<script src="js/systems/CollisionManager.js"></script>   <!-- ← 追加 -->
<script src="js/renderers/drawBackground.js"></script>
```

### 読み込み順序の根拠

- `CollisionManager.handleGemPickup()` は `Gem` クラス、`CONFIG` オブジェクトを参照する
- `Gem.js` は L63 で既に読み込まれている
- `CONFIG` は L34 (`js/data/config.js`) で読み込み済み
- `CollisionManager.js` は `main.js`（L68）より前に読み込む必要がある
- `js/systems/` ディレクトリに配置するため、同ディレクトリの他ファイル（eliminator.js 等）と同じ位置が望ましいが、  
  eliminator.js（L53）は Gem.js（L63）より前に読み込まれているため、  
  **Gem.js の直後**（L63 と L64 の間）に挿入するのが最も安全

---

## 7. update 順序維持の確認

### 現在の update() 処理順序（main.js L1126–L1977）

```
1. フェードイン / ステート分岐
2. 経過時間カウント
3. player.update(GAME, entities)
4. HUD visibility sync
5. Phase 3: 星スクロール背景
6. EffectManager.update(entities)
7. デブリ更新 + 衝突判定（debrisVsPlayer, debrisVsEnemy）
8. 爆発更新 + 衝突判定（explosionVsPlayer, explosionVsEnemy）
9. 自機弾更新 + cleanup
10. 敵弾更新 + 衝突判定（enemyBulletVsPlayer, enemyBulletVsMissile）
11. ミサイル更新 + 衝突判定（missileVsEnemy） + cleanup
12. 敵スポーン制御
13. 敵同士の衝突（enemyVsEnemy）
14. 敵更新 + 衝突判定（playerBulletVsEnemy, enemyVsPlayer） + 生存チェック
15. 母艦衝突判定（bulletVsMothership, missileVsMothership, playerVsMothership）
16. ★ Phase 6: ジェム回収（gemPickup）  ← ここが移植対象
17. ミッション達成リマインダー
18. 着艦判定
19. HP警告通信
20. HP0セーフガード
21. エンジントレイル更新
22. HUDManager.update()
```

### 移植後

**Phase 6 の位置（16番目）に `CollisionManager.handleGemPickup()` を呼び出す。**  
前後の処理順序は一切変更しない。

> [!IMPORTANT]
> `handleGemPickup()` 内部のループ順序（逆順 for + splice）も完全維持する。
> `g.update(player)` は `handleGemPickup()` 内で呼び出すため、  
> Gem の移動更新タイミングも現状と完全に同一である。

---

## 8. cleanup 順序維持の確認

### Gem の cleanup は `handleGemPickup()` 内で完結

- 現在: `entities.gems.splice(i, 1)` は Gem ループ（L1806）内で即時実行
- 移植後: `handleGemPickup()` 内で同一タイミングで `splice(i, 1)` を実行

### 他エンティティの cleanup には影響なし

| エンティティ | cleanup 位置 | 影響 |
|-------------|-------------|------|
| Debris | main.js デブリループ内 splice | 変更なし |
| Explosion | main.js 爆発ループ内 splice | 変更なし |
| Bullet | main.js 弾ループ内 splice | 変更なし |
| EnemyBullet | main.js 敵弾ループ内 splice | 変更なし |
| Missile | main.js ミサイルループ内 splice | 変更なし |
| Enemy | eliminator.processEntityDeath 内 splice | 変更なし |
| Gem | **handleGemPickup() 内 splice** | **移植（同一タイミング）** |

---

## 9. リスク分析

### 低リスク

| リスク | 内容 | 対策 |
|--------|------|------|
| グローバル参照の欠落 | `CONFIG` が CollisionManager.js のロード時点で未定義 | index.html の読み込み順で config.js が先にロードされていることを確認済み（L34） |
| `checkLevelUp` の未定義 | 引数として渡し忘れ | main.js 側の呼び出しで明示的に渡す設計 |
| `playerStats` の未定義 | 引数として渡し忘れ | main.js 側の呼び出しで明示的に渡す設計 |

### 極低リスク

| リスク | 内容 | 対策 |
|--------|------|------|
| 読み込み順エラー | `CollisionManager` が main.js より後に読み込まれる | index.html のスクリプト順序を明確に指定 |
| 変数名衝突 | `CollisionManager` が既存グローバルと衝突 | プロジェクト内に同名変数がないことを確認済み |

### 注意点

| 項目 | 内容 |
|------|------|
| `g.update(player)` の位置 | **必ず `handleGemPickup()` 内**で呼び出すこと。外部に分離すると Gem の移動と回収判定の間に他の処理が挟まり、挙動が変わるリスクがある |
| Gem.js のコメント更新 | Gem.js L16–17 に「CollisionManager フェーズ（Step 8）での移動を前提に、回収判定・cleanup は main.js に残す」とあるが、移植完了後にこのコメントを更新する必要がある |

---

## 10. 実装後の確認項目

### 自動確認

- [ ] ブラウザでゲームが起動すること（コンソールエラーなし）
- [ ] 敵機を撃破して Gem がドロップすること
- [ ] Gem が吸引範囲に入ったらプレイヤーに向かって加速すること
- [ ] Gem が回収されたら消滅すること（splice 正常動作）
- [ ] EXP Gem 回収時に playerStats.exp が加算されること
- [ ] HEAL Gem 回収時に playerStats.hp が回復すること（maxHp を超えないこと）
- [ ] BIG_EXP Gem 回収時に EXP が大量加算されること
- [ ] レベルアップ閾値を超えた場合に `checkLevelUp()` が正常に動作すること
- [ ] 母艦を撃破して大量の Gem が生成された場合も正常に動作すること

### 手動確認（プレイテスト）

- [ ] 敵撃破 → Gem 飛び出し → 吸引 → 回収 のフローが体感として変化していないこと
- [ ] HP 回復アイテムの回復量が変化していないこと
- [ ] レベルアップストックの増加タイミングが変化していないこと
- [ ] 大量の Gem が同時に存在してもフレーム落ちや回収漏れがないこと

### コード確認

- [ ] `CollisionManager.js` の行数が 40 行以下であること（単一責務）
- [ ] main.js の該当箇所が 1 行の呼び出しに置換されていること
- [ ] index.html のスクリプト読み込み順が正しいこと
- [ ] changelog.js にエントリが追加されていること
- [ ] Gem.js のコメント（L7–17）が更新されていること

---

## 11. Sonnet 向け実装手順

### Step 8-1: CollisionManager.js の新規作成

```
ファイル: js/systems/CollisionManager.js
操作: 新規作成
内容: セクション 3.1 の handleGemPickup() を含む CollisionManager オブジェクトを定義
```

### Step 8-2: main.js の修正

```
ファイル: js/main.js
操作: L1785–L1808 の削除 + 置換
削除対象:
  - L1785 コメント行: // --- Phase 6: 成長要素 (ジェム回収) ---
  - L1786–L1807 Gem 回収ループ全体
置換後:
  - // --- Phase 6: 成長要素 (ジェム回収) ---
  - CollisionManager.handleGemPickup(entities, player, playerStats, checkLevelUp);
```

### Step 8-3: index.html の修正

```
ファイル: index.html
操作: L63 (Gem.js) の直後に1行追加
追加行: <script src="js/systems/CollisionManager.js"></script>
```

### Step 8-4: Gem.js のコメント更新

```
ファイル: js/classes/Gem.js
操作: L7–17 のコメントブロックを更新
変更内容:
  - 「main.js に残存」→「CollisionManager.handleGemPickup() に移植済み」
  - 「CollisionManager フェーズ（Step 8）での移動を前提に」→ 削除または完了記述に変更
```

### Step 8-5: changelog.js の更新

```
ファイル: js/changelog.js
操作: 先頭に v0.5.39 エントリを追加
内容:
  - version: "v0.5.39"
  - description: "Refactoring: Phase 4 Step 8 - CollisionManager 分離。handleGemPickup() を新設。"
  - details:
    - 【リファクタリング】js/systems/CollisionManager.js を新規作成。handleGemPickup(entities, player, playerStats, checkLevelUp) を実装
    - 【リファクタリング】main.js L1785–L1808 の Gem 回収ループ → CollisionManager.handleGemPickup() の1行呼び出しに置換
    - 【変更なし】update 順序・cleanup 順序・Gem 吸引挙動・EXP/HP 加算ロジック・checkLevelUp() 呼び出しタイミングは変更なし
    - 【変更なし】drawEffects.js / EffectManager / eliminator.js / Gem.update() は変更なし
```

### 実装順序の厳守事項

1. **Step 8-1 → Step 8-3 → Step 8-2** の順序で実装すること  
   （CollisionManager.js 作成 → index.html で読み込み追加 → main.js の既存コード置換）
2. Step 8-2 で main.js を修正する前に、必ず Step 8-1 と Step 8-3 が完了していること
3. Step 8-4, Step 8-5 は Step 8-2 の後で実施

---

> [!IMPORTANT]
> **本計画書は実装計画のみ。コード変更は一切行わないこと。**
> 
> 本計画書の承認後、Sonnet が Step 8-1 から順番に実装を行う。
