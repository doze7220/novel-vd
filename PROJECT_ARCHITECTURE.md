# PROJECT_ARCHITECTURE.md

VANGUARDRIFTER — コードアーキテクチャ概覧

最終更新: 2026-06-04 (v0.5.38 時点)

---

## 1. プロジェクト概要

VANGUARDRIFTER は宇宙空間を舞台にした 2D シューティングゲームである。

- ランタイム: ブラウザ（Vanilla HTML + JavaScript + Canvas 2D API）
- フレームワーク: 未使用（素の JS）
- エントリーポイント: index.html
- 駆動: requestAnimationFrame による loop() → update() → draw() の毎フレーム呼び出し

### ゲームの状態機械（GAME.state）

TITLE → PLAYING → LEVEL_UP → PLAYING → RESULT → TITLE

---

## 2. ファイル構成一覧

```
vanguardrifter/
├── index.html                     # エントリーポイント・スクリプト読み込み順定義
├── style.css                      # スタイルシート
├── js/
│   ├── changelog.js               # 全バージョン変更履歴
│   ├── main.js                    # ゲームメインループ・オーケストレーター（約2422行）
│   ├── data/
│   │   ├── config.js              # CONFIG オブジェクト（全ゲームパラメータ定数）
│   │   ├── constants.js           # CONSTANTS オブジェクト（現在は空）
│   │   ├── stats.js               # playerStats オブジェクト定義
│   │   └── upgradePool.js         # upgradePool 配列（アップグレード定義）
│   ├── classes/
│   │   ├── Ship.js                # Ship 基底クラス（現在はほぼスタブ）
│   │   ├── PlayerShip.js          # PlayerShip クラス（自機）
│   │   ├── EnemyShip.js           # EnemyShip クラス（敵機）
│   │   ├── Bullet.js              # Bullet クラス（自機弾）
│   │   ├── EnemyBullet.js         # EnemyBullet クラス（敵弾）
│   │   ├── Missile.js             # Missile クラス（自機ミサイル）
│   │   ├── Particle.js            # Particle クラス（視覚エフェクト）
│   │   ├── Debris.js              # Debris クラス（破片）
│   │   ├── Explosion.js           # Explosion クラス（爆発）
│   │   ├── Gem.js                 # Gem クラス（経験値・回復アイテム）
│   │   └── communication.js       # Communication クラス（シエロ通信UI）
│   ├── systems/
│   │   ├── input.js               # InputManager（キーボード・マウス入力管理）
│   │   ├── handleInput.js         # ゲーム状態別入力ハンドラ群
│   │   ├── init.js                # 初期化関数群（initEntities, initPlayer 等）
│   │   ├── effects.js             # EffectManager（パーティクル更新・描画）
│   │   ├── hud.js                 # HUDManager（HUD更新・マイクロHUD描画）
│   │   ├── eliminator.js          # eliminator（エンティティ死亡処理・アイテム生成）
│   │   ├── radar.js               # RadarManager（レーダー描画）
│   │   └── map.js                 # MapManager（ミニマップ描画）
│   ├── renderers/
│   │   ├── drawBackground.js      # drawBackground()（星背景描画）
│   │   ├── drawEffects.js         # drawEffects()（Gem・弾・ミサイル・トレイル描画）
│   │   ├── drawHUD.js             # drawHUD()（レーダー・レベルアップ画面・HUD描画）
│   │   └── drawOverlay.js         # drawOverlay()（タイトル・リザルト・フェード描画）
│   ├── scenes/
│   │   ├── TitleScene.js          # TitleScene クラス（タイトル画面更新）
│   │   └── ResultScene.js         # ResultScene クラス（リザルト画面更新）
│   └── utils/
│       ├── utils.js               # 汎用ユーティリティ関数
│       └── asset.js               # SpriteCache（スプライト生成・キャッシュ）
└── documents/                     # 設計仕様書群（ゲームプレイには影響しない）
```

---

## 3. 各ファイルの責務

### data/

| ファイル | 責務 |
|---------|------|
| config.js | 全ゲームパラメータを CONFIG オブジェクトとして定義。物理・射撃・敵・アイテム・UI 設定を一元管理 |
| constants.js | 予約済み。現在は空の CONSTANTS オブジェクトのみ |
| stats.js | playerStats オブジェクト定義。プレイヤーの成長・強化状態を保持 |
| upgradePool.js | アップグレード選択肢の定義配列。id / apply() / maxLevel を持つ |

### classes/

| ファイル | 責務 |
|---------|------|
| Ship.js | 基底クラス。現状はほぼスタブ（constructor のみ）。将来的に updatePhysics() 等を持つ予定 |
| PlayerShip.js | 自機クラス。操作ロジック・発射・物理演算・着艦シーケンスを update() に持つ |
| EnemyShip.js | 敵機クラス。AI ロジック（RAMMER/SNIPER/DOGFIGHTER）・射撃・物理演算を update() に持つ |
| Bullet.js | 自機弾エンティティ。update() は位置更新と寿命デクリメントのみ |
| EnemyBullet.js | 敵弾エンティティ。update() は位置更新と寿命デクリメントのみ |
| Missile.js | 自機ミサイル。update() にホーミング・物理演算・噴煙パーティクル生成を持つ |
| Particle.js | 視覚エフェクト用パーティクル。update() は位置更新と寿命減衰のみ |
| Debris.js | 破片エンティティ。update() は位置更新と寿命減衰のみ |
| Explosion.js | 爆発エンティティ。update() はタイマー・scale/shake 計算・currentRadius 算出のみ |
| Gem.js | 経験値・回復アイテム。update(player) は吸引処理・移動処理のみ。回収判定は main.js に残存 |
| communication.js | Communication クラス。シエロとの通信UIを管理 |

### systems/

| ファイル | 責務 |
|---------|------|
| input.js | InputManager。キーボード押下状態・マウス座標の管理 |
| handleInput.js | ゲーム状態別キー入力ハンドラ（handleTitleInput / handlePlayingInput 等） |
| init.js | initEntities / initPlayer / initGameState / initMothership / initUI を定義 |
| effects.js | EffectManager。パーティクルの毎フレーム更新（update）と描画（draw）を管理 |
| hud.js | HUDManager。ステータスパネル・クレジット表示の DOM 更新と、マイクロHUD の Canvas 描画 |
| eliminator.js | eliminator オブジェクト。エンティティ死亡処理（processEntityDeath）とアイテム生成（spawnItem）を担当 |
| radar.js | RadarManager。自機追従レーダーの Canvas 描画 |
| map.js | MapManager。画面右上ミニマップの Canvas 描画 |

### renderers/

| ファイル | 責務 |
|---------|------|
| drawBackground.js | drawBackground()。黒背景と視差スクロール星屑を描画 |
| drawEffects.js | drawEffects()。Gem・弾・ミサイル・エンジントレイルの描画。EffectManager.draw() を呼び出す |
| drawHUD.js | drawHUD()。レーダー・ミニマップ・通信UI・レベルアップ画面などを描画 |
| drawOverlay.js | drawOverlay()。タイトル画面・リザルト画面・フェード・フラッシュを描画 |

### scenes/

| ファイル | 責務 |
|---------|------|
| TitleScene.js | TitleScene クラス。タイトル画面の update() を担当（星屑・flavor 爆発・自機上昇演出） |
| ResultScene.js | ResultScene クラス。リザルト画面の update() と init() を担当 |

### utils/

| ファイル | 責務 |
|---------|------|
| utils.js | 汎用ユーティリティ関数（getCatapultSpec 等） |
| asset.js | SpriteCache オブジェクト。全スプライトを Canvas で生成・キャッシュ |

---

## 4. クラス一覧

| クラス | ファイル | 種別 |
|-------|---------|------|
| Ship | classes/Ship.js | 基底クラス（スタブ） |
| PlayerShip | classes/PlayerShip.js | エンティティ |
| EnemyShip | classes/EnemyShip.js | エンティティ |
| Bullet | classes/Bullet.js | エンティティ |
| EnemyBullet | classes/EnemyBullet.js | エンティティ |
| Missile | classes/Missile.js | エンティティ |
| Particle | classes/Particle.js | エンティティ |
| Debris | classes/Debris.js | エンティティ |
| Explosion | classes/Explosion.js | エンティティ |
| Gem | classes/Gem.js | エンティティ |
| Communication | classes/communication.js | システム |
| TitleScene | scenes/TitleScene.js | シーン |
| ResultScene | scenes/ResultScene.js | シーン |

---

## 5. 各クラスの主要メソッド

### Ship
- constructor(): 共通プロパティを置く（現状は空）

### PlayerShip（extends Ship）
- constructor(): 自機プロパティ全初期化
- update(GAME, entities): 操作入力・物理演算・射撃・ミサイル発射・着艦シーケンス

### EnemyShip（extends Ship）
- constructor(params): 敵機プロパティ初期化
- update(player, entities, GAME): AI ロジック・射撃・物理演算。射出シーケンス中は true を返す

### Bullet
- constructor(x, y, vx, vy, life, isScatter): 初期化
- update(): this.x += this.vx; this.y += this.vy; this.life--

### EnemyBullet
- constructor(x, y, vx, vy, life, damage): 初期化
- update(): 位置更新・寿命デクリメント

### Missile
- constructor(x, y, vx, vy, angle, target, life, speed, turnRate, damageMult, isSubMunition): 初期化
- update(entities): ターゲットロスト判定 → ホーミング角度補正 → 加速 → 速度クランプ → 座標更新 → 噴煙生成

### Particle
- constructor(x, y, vx, vy, life, decay, size, color, type, maxLife, baseSize): 初期化
- update(): 位置更新・寿命減衰（decay または CONFIG.PARTICLE_DECAY を使用）

### Debris
- constructor(x, y, vx, vy, color, size, life, decay, harmful): 初期化
- update(): this.x += this.vx; this.y += this.vy; this.life -= this.decay

### Explosion
- constructor(x, y, maxRadius, timer, maxTimer, damagedEntities, isPlayerExplosion, isFlavor, isMissileFlare, damageMultiplier, angle, offsetMid, offsetSmall): 初期化
- update(): timer-- → progress 算出 → scale/shake 計算 → currentRadius 保存

### Gem
- constructor(x, y, vx, vy, kind, exp, heal, locked, speed, sprite, sizeMult): 初期化
- update(player): dist 計算 → EXP_MAGNET_RADIUS 判定 → locked 設定 → 吸引加速または慣性移動

### Communication
- play(text): 通信メッセージ表示

### TitleScene
- update(): タイトル画面の毎フレーム更新（星屑スクロール・自機上昇演出・flavor 爆発）

### ResultScene
- init(isClear): リザルト画面初期化（経費精算計算）
- update(): リザルト画面の毎フレーム更新（明細表示・スタンプ演出）

---

## 6. Entity 一覧

### グローバル entities オブジェクトのプロパティ

| プロパティ | 型 | 内容 |
|-----------|-----|------|
| entities.enemies | EnemyShip[] | 敵機リスト |
| entities.bullets | Bullet[] | 自機弾リスト |
| entities.enemyBullets | EnemyBullet[] | 敵弾リスト |
| entities.particles | Particle[] | パーティクルリスト |
| entities.gems | Gem[] | 経験値・回復アイテムリスト |
| entities.missiles | Missile[] | 自機ミサイルリスト |
| entities.debris | Debris[] | 破片リスト |
| entities.explosions | Explosion[] | 爆発リスト |
| entities.enemyMothership | object | 敵母艦（単体オブジェクト）|

### シングルトンエンティティ

| 変数 | 型 | 内容 |
|-----|-----|------|
| player | PlayerShip | 自機（単体） |
| playerStats | object | 自機成長データ（stats.js で定義） |
| GAME | object | ゲーム状態全般（main.js で定義） |
| CONFIG | object | 全ゲームパラメータ（config.js で定義） |
| comm | Communication | シエロ通信UI（main.js で生成） |
| stars | array | 視差スクロール星屑配列（main.js で生成） |

---

## 7. Update 順序（絶対変更禁止）

update() 関数（main.js L1126）の処理順序を以下に示す。

1. フェードイン処理（GAME.fadeAlpha 更新）
2. ゲーム状態分岐（TITLE / LEVEL_UP / RESULT は早期リターン）
3. 経過時間カウント（GAME.operationFrameCount / operationTime）
4. player.update(GAME, entities) — 自機更新
5. HUD DOM visibility 同期
6. 星スクロール背景更新（stars.forEach）
7. EffectManager.update(entities) — パーティクル更新・cleanup
8. デブリループ（逆順）
   - d.update()
   - harmful デブリ → 煙パーティクル生成
   - harmful デブリ vs 自機: 衝突判定 + ダメージ
   - harmful デブリ vs 敵機: 衝突判定 + ダメージ
   - d.life <= 0 → splice
9. 爆発ループ（逆順）
   - exp.update()
   - progress 0.02〜0.15: 爆風 vs 自機・爆風 vs 敵機
   - exp.timer <= 0 → ゲームオーバー遷移チェック + splice
10. 自機弾ループ（逆順）
    - b.update()
    - b.life <= 0 → splice
11. 敵弾ループ（逆順）
    - b.update()
    - 敵弾 vs 自機: ダメージ + splice
    - 敵弾 vs ミサイル: 撃墜 + splice
    - b.life <= 0 → splice
12. ミサイルループ（逆順）
    - m.update(entities)
    - ミサイル vs 敵機: ダメージ + hit フラグ
    - m.life--
    - hit または m.life <= 0 → spawnExplosion + Sub-Munition生成 + splice
13. 敵スポーン制御（enemyMothership からのカタパルト射出）
14. 敵同士の衝突（enemyVsEnemy）
    - 重なり解消 + impulse + ダメージ + flashTimer
15. 敵ループ（逆順）
    - e.update(player, entities, GAME) — 射出シーケンス中は continue
    - e.flashTimer--
    - 自機弾 vs 敵機: ダメージ + Scatter Shot + splice + flashTimer
    - 敵機本体 vs 自機: 重なり解消 + impulse + ダメージ（双方）
    - e.hp <= 0 → eliminator.processEntityDeath(e, 'FIGHTER', i)
16. 敵母艦衝突判定
    - em.flashTimer--
    - 自機弾 vs 敵母艦: ダメージ + Scatter Shot + splice
    - ミサイル vs 敵母艦: ダメージ + Sub-Munition + splice
    - 自機本体 vs 敵母艦: 重なり解消 + impulse + ダメージ
    - em.hp <= 0 → eliminator.processEntityDeath(em, 'MOTHERSHIP')
17. ★ Gem ループ（逆順）— Phase 6（CollisionManager 移植対象）
    - g.update(player) — 吸引・移動
    - dist 再計算
    - dist < GEM_COLLECT_RADIUS → HP回復 or EXP加算 + checkLevelUp() + splice
18. ミッション達成リマインダー更新
19. 着艦判定
20. HP 20%以下の通信
21. HP ゼロのセーフガード
22. エンジントレイル更新（自機・敵機）
23. HUDManager.update(playerStats, GAME)

---

## 8. Draw 順序

draw() 関数（main.js L2400）の描画順序を以下に示す。

1. drawBackground(ctx, stars, GAME) — 黒背景・星屑
2. drawGameEntities(ctx) — ワールド座標変換（自機中心）
   a. 味方母艦スプライト
   b. 敵母艦スプライト + HP バー
   c. ランディングエリア表示
   d. 補給中ステータス表示
   e. drawEffects(ctx, player, entities, SpriteCache, 'background')
      - Gem 描画
      - パーティクル・デブリ描画（EffectManager.draw background）
      - 敵弾・自機弾・ミサイル描画
      - 自機・敵機エンジントレイル描画
   f. 敵機スプライト + HP ゲージ + ヒートゲージ + フラッシュ
   g. 砲塔描画
   h. 自機スプライト（生存時のみ）
   i. drawEffects(ctx, player, entities, SpriteCache, 'foreground')
      - 爆発描画（EffectManager.draw foreground）
3. drawHUD(ctx, GAME, playerStats, player, entities, CONFIG) — HUD 全般
4. drawOverlay(ctx, GAME) — タイトル・リザルト・フェード・フラッシュ

---

## 9. Collision 一覧（判定種別と処理順）

衝突判定は update() 内でインライン実装されている。順序は変更禁止。

| 順序 | カテゴリ | 詳細 |
|-----|---------|------|
| 1 | debrisVsPlayer | harmful デブリ → 自機: 押し返し + impulse + ダメージ |
| 2 | debrisVsEnemy | harmful デブリ → 敵機: 押し返し + impulse + ダメージ |
| 3 | explosionVsPlayer | 爆風 → 自機: ダメージ（progress 0.02〜0.15）|
| 4 | explosionVsEnemy | 爆風 → 敵機: ダメージ（progress 0.02〜0.15）|
| 5 | enemyBulletVsPlayer | 敵弾 → 自機: ダメージ + splice |
| 6 | enemyBulletVsMissile | 敵弾 → ミサイル: 撃墜 + spawnExplosion |
| 7 | missileVsEnemy | ミサイル → 敵機: ダメージ + spawnExplosion |
| 8 | enemyVsEnemy | 敵機同士: 重なり解消 + impulse + ダメージ |
| 9 | playerBulletVsEnemy | 自機弾 → 敵機: ダメージ + Scatter Shot |
| 10 | enemyVsPlayer | 敵機本体 → 自機: 重なり解消 + impulse + ダメージ |
| 11 | playerBulletVsMothership | 自機弾 → 敵母艦: ダメージ + Scatter Shot |
| 12 | missileVsMothership | ミサイル → 敵母艦: ダメージ + Sub-Munition |
| 13 | playerVsMothership | 自機本体 → 敵母艦: 押し返し + impulse + ダメージ |
| 14 | gemPickup | Gem → 自機: EXP加算 / HP回復 + splice ★ CollisionManager 移植予定 |

---

## 10. Cleanup 順序（配列からの削除順）

各エンティティの cleanup（splice）は以下の順序で実行される。順序は変更禁止。

| 順序 | エンティティ | タイミング |
|-----|------------|---------|
| 1 | Particle | EffectManager.update() 内（update() 冒頭） |
| 2 | Debris | d.life <= 0 時点（デブリループ内） |
| 3 | Explosion | exp.timer <= 0 時点（爆発ループ内） |
| 4 | Bullet（敵弾に当たったもの） | enemyBulletVsPlayer 判定直後 |
| 5 | EnemyBullet（自機に当たったもの） | 同上 |
| 6 | Missile（撃墜分） | enemyBulletVsMissile 判定直後 |
| 7 | EnemyBullet（ミサイルに当たったもの） | 同上 |
| 8 | Missile（期限・命中分） | missileVsEnemy 判定後 |
| 9 | Bullet（有効期限切れ） | Bullet ループ末尾 |
| 10 | EnemyBullet（有効期限切れ） | EnemyBullet ループ末尾 |
| 11 | Bullet（敵母艦命中分） | playerBulletVsMothership 判定直後 |
| 12 | Missile（敵母艦命中分） | missileVsMothership 判定直後 |
| 13 | Enemy | eliminator.processEntityDeath() → splice |
| 14 | Gem | gemPickup 判定直後（dist < GEM_COLLECT_RADIUS） |

回収判定 / cleanup は main.js（Step 8 移植予定）
吸引・移動は Gem.update()

---

## 11. Game State 一覧

| 状態 | 説明 |
|-----|------|
| TITLE | タイトル画面。SceneManager.title.update() に委譲 |
| PLAYING | ゲームプレイ中。メインの update() + draw() が全実行される |
| LEVEL_UP | レベルアップ選択中。updateLevelUpScreen() に委譲 |
| RESULT | リザルト画面。SceneManager.result.update() に委譲 |

---

## 12. main.js 残存責務

Phase 4 完了後も以下が main.js に残存している（意図的）。

### グローバル定義・初期化

- GAME オブジェクト定義
- entities オブジェクト定義（配列群）
- player インスタンス生成（new PlayerShip()）
- stars 配列生成（視差スクロール用）
- SceneManager オブジェクト定義
- 入力イベントリスナー登録（keydown / resize）

### ヘルパー関数

- resetGame(): ゲームリセット（initXxx を呼び出す）
- initResultScreen(isClear): リザルト画面の初期化
- spawnDebris(x, y, color, count): 通常破片生成
- spawnDeathDebris(x, y, color, baseVx, baseVy): 有害破片生成
- spawnExplosion(x, y, ...params): 爆発エンティティ生成
- clearAllEnemiesInstantly(): デバッグ用敵全滅
- getEnemyColor(e): 敵機カラー取得
- damagePlayer(amount): プレイヤーへのダメージ一元処理
- checkLevelUp(): レベルアップ判定

### 衝突判定（インライン）

- debrisVsPlayer / debrisVsEnemy
- explosionVsPlayer / explosionVsEnemy
- enemyBulletVsPlayer / enemyBulletVsMissile
- missileVsEnemy（衝突・爆発）
- playerBulletVsEnemy（ヒット・Scatter Shot）
- enemyVsPlayer（体当たり）
- playerBulletVsMothership / missileVsMothership / playerVsMothership
- gemPickup（★ Step 8 で CollisionManager へ移植予定）

### update() / draw()

- update(): ゲームループのオーケストレーター
- draw(): 描画オーケストレーター
- drawGameEntities(ctx): エンティティ描画
- updateLevelUpScreen(): レベルアップ画面更新
- loop(): requestAnimationFrame ループ

---

## 13. 今後の分離候補

| 候補 | 概要 | 優先度 |
|-----|------|--------|
| CollisionManager.handleGemPickup() | Step 8 で実施予定（計画書: 20260525_order4_refactoring_phase4_Step8_implementationPlan.md） | 最高（次のStep） |
| CollisionManager.playerBulletVsEnemy() | Gem 移植後の次フェーズ候補 | 中 |
| CollisionManager.enemyBulletVsPlayer() | 同上 | 中 |
| CollisionManager.explosionVsEnemy() | 同上 | 中 |
| CollisionManager.debrisVsPlayer() | 同上 | 中 |
| CollisionManager.missileVsEnemy() | 同上 | 中 |
| CollisionManager.enemyVsEnemy() | 同上 | 中 |
| CollisionManager.playerVsMothership() | 同上 | 中 |

---

## 14. 注意事項

### リファクタリング共通ルール（変更禁止事項）

1. update() の処理順序を変更しない
2. draw() の描画順・blend順・layer順を変更しない
3. collision 判定順序を変更しない
4. cleanup（splice）の順序を変更しない
5. entity は自身を即時削除しない（self destroy 禁止）
6. constructor 内で副作用を発生させない
7. 汎用 collision system（ECS 風の二重ループ）は作らない
8. EventEmitter 化しない
9. deltaTime ベースに変更しない
10. requestAnimationFrame 構造を変更しない
11. 描画系ファイル（drawXXX.js）を触らない
12. HUDManager / MapManager / RadarManager / EffectManager を触らない

### Explosion に関する注意

- TitleScene.update() は Explosion.update() を使わず独自の timer/scale 計算を行っている
- isFlavor フラグが true の爆発は、TitleScene.update() が直接 exp.timer-- する

### Gem に関する注意

- Gem.update(player) は吸引・移動のみを担当
- 回収判定（dist < GEM_COLLECT_RADIUS）・EXP 加算・HP 回復・checkLevelUp() はまだ main.js 内に残存
- Step 8（CollisionManager）で移植予定

### Missile に関する注意

- Sub-Munition（isSubMunition = true）の生成は main.js 衝突判定内で行われる
- Missile.update() は Sub-Munition を生成しない（副作用禁止原則に従う）

### index.html 読み込み順

スクリプトの読み込み順は依存関係を反映している。
classes/ → systems/ → renderers/ → main.js の順に読み込まれる。
CollisionManager.js を追加する場合は Gem.js の直後（classes/ の後）に配置すること。
