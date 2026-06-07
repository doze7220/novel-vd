# 作業指示書：20260524_order4_refactoring_phase4(v0.5.06)

## 役割
あなたは優秀なフロントエンドエンジニアです。  
提供したソースコードに対し、以下の「リファクタリング作業・第四段階（最終フェーズ）」を行ってください。

---

# 目的

メインループ（update, draw）に残存している各種エンティティ（弾、ミサイル、破片、爆発、アイテム）の処理をすべてクラス化する。

さらに、肥大化の最大の原因である「当たり判定（衝突処理）」を専用のマネージャークラス（またはモジュール）へ分離し、メインループを極限までクリーンアップする。

ただし、本フェーズの目的は「ゲーム挙動を変更すること」ではなく、既存コードを責務単位へ整理・移植することである。

【絶対原則】ゲームの見た目、操作感、敵の思考ロジック、機能は 1px も変更してはならない（完全互換）。

---

# 最重要

## CollisionManager は「汎用衝突システム」を作ることを目的としない

現在 main.js に存在する衝突判定の：

- 判定順
- 処理順
- ダメージ適用順
- impulse 適用順
- entity 削除タイミング

を完全維持したまま、コードを関数・クラスへ移動することのみを目的とする。

※AIへの出力指示※
作業量が膨大になるため、まずは「Step 1 と Step 2（各種エンティティのクラス化と特殊挙動の移植）」のみを実行し、コードを出力してください。 そこで一度出力を停止し、私が「続けて」と合図してから Step 3 以降の Collision 分離に進むこと。

---

# 1. 現状の前提（重要）

- main.js は既に司令塔として整理済み
- 描画処理は drawBackground / drawEffects / drawHUD / drawOverlay に分離済み
- UI 系（HUDManager / MapManager / RadarManager）は既に分離済み
- EffectManager（パーティクル管理）は既に分離済み
- Ship / PlayerShip / EnemyShip は既に存在する
- main.js には entity update / collision / cleanup が残っている

---

# 2. 実装方針（AI-IDE が誤解しないための境界）

- 描画系（drawXXX.js）は触らない
- HUDManager / MapManager / RadarManager / EffectManager は触らない
- main.js の orchestration 構造は維持する
- update() の順序は変更しない
- draw() の描画順・layer順・blend順は変更しない
- cleanup 順序は変更しない
- 衝突判定順序は変更しない
- 汎用 collision system を作らない
- ECS 化しない
- EventEmitter 化しない
- deltaTime ベースへ変更しない
- requestAnimationFrame 構造を変更しない
- GameManager 化しない
- architecture rewrite を行わない

---

# 3. 更新順序固定（超重要）

現在 main.js に存在する update 順序を完全維持すること。

特に以下を変更しないこと：

- entity update 順
- collision 判定順
- cleanup 順
- remove/filter 順
- explosion update 順
- particle update 順
- score 加算タイミング
- shake 発生タイミング
- chain explosion 発生順

ゲーム挙動は update 順序に依存しているため、
「見た目が同じ」ではなく「処理順そのもの」を維持すること。

---

# 4. 物理演算について

各エンティティの物理更新は、
現在 main.js に存在する：

- 位置更新順
- friction 適用順
- clamp 適用順

を完全維持すること。

必ずしも Ship 継承へ統合する必要はない。

「継承統一」ではなく、
「処理順・計算式統一」を目的とする。

---

# 5. CollisionManager の設計制限（重要）

CollisionManager は、
現在 main.js に存在するカテゴリ単位で分割すること。

例：

- playerBulletVsEnemy
- enemyBulletVsPlayer
- explosionVsEnemy
- enemyVsEnemy
- debrisVsPlayer
- gemPickup

など。

単一の汎用 collision loop に統合しないこと。

以下のような generic collision architecture は禁止：

for (const a of entities)
for (const b of entities)

---

# 6. Entity Lifecycle の制限

Entity は自身を即時削除しないこと。

entity の remove / cleanup タイミングは、
現在 main.js に存在する順序を完全維持すること。

以下は禁止：

- self destroy
- constructor 内 remove
- update 中 splice
- update 中 filter

cleanup は main.js 側または cleanup phase 側で行うこと。

---

# 7. constructor の副作用禁止

Entity constructor 内で副作用を発生させないこと。

禁止例：

- damage
- score 加算
- shake
- chain explosion
- entity remove
- state 遷移

Explosion / Debris / Particle は
「状態データの生成」のみを行うこと。

副作用は update phase / collision phase 側で処理すること。

---

# 8. 実装ステップと要件

## ✔ Step 1：残存エンティティのクラス化

以下を専用クラスへ移行する：

- Bullet
- EnemyBullet
- Missile
- Particle
- Debris
- Explosion
- Gem

各クラスへ：

- update()
- draw()

を実装する。

---

## ✔ Step 2：Missile / Gem 特殊挙動

Missile：
- ホーミング
- target tracking
- turn 制御

Gem：
- magnet 吸引
- player tracking

を既存挙動そのままで移植する。

---

# ✔ Step 3：Collision の分離

main.js の collision 群を、
CollisionManager または独立関数群へ分離する。

ただし、
「構造の変更」ではなく
「コード移植」を目的とする。

---

# ✔ Step 4：main.js の最終整理

main.js の update() は：

- entity update 呼び出し
- collision 呼び出し
- cleanup 呼び出し
- GAME.state 制御

のみを担当する構造へ整理する。

---

# ✔ Step 5：draw() の整理

draw() は：

- 背景描画
- entity draw 呼び出し
- overlay / HUD 呼び出し

のみを担当する。

描画順・blend順・layer順は完全維持すること。

---

# ✔ Step 6：差分形式で提示

AI-IDE が誤解しないように：

- どのコードを削除したか
- どこへ移植したか
- どこを置換したか

を差分形式で提示すること。

---

# 9. 完了条件

- update() が orchestration layer として整理されている
- draw() が orchestration layer として整理されている
- collision がカテゴリ単位で分離されている
- cleanup 順序が維持されている
- 連鎖爆発・shake・impulse が完全互換
- gem 吸引・missile homing が完全互換
- 当たり判定サイズ・反発・damage timing が完全一致
- update 順序によるゲーム感覚が完全維持されている
- 描画順・blend順・layer順が完全一致している