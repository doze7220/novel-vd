# PROJECT_FUNCTION_INDEX.md

VANGUARDRIFTER — 全関数インデックス

最終更新: 2026-06-07 (v0.5.40 時点)

---

## 凡例

| 項目 | 説明 |
|-----|------|
| ファイル | js/ 以下の相対パス |
| 関数名 | クラスメソッドは `クラス名#メソッド名` で表記 |
| 行番号 | 1-indexed。定義行（function キーワードまたはメソッド名）の行番号 |
| 引数 | 関数の引数リスト |
| 戻り値 | 明示的な return がある場合のみ記述 |
| 呼び出し元 | 主な呼び出し元ファイル・関数 |

---

## 1. js/main.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| resetGame | L76 | なし | なし | keydown ハンドラ, SceneManager.result.update() | ゲーム全体をリセット。initPlayer / initEntities / initGameState / initUI / initMothership を呼び出す |
| initResultScreen | L92 | isClear | なし | eliminator.processEntityDeath() | リザルト画面を初期化。撃破数・被弾・プレイ時間から経費精算を計算し SceneManager.result.init() を呼ぶ |
| spawnDebris | L1010 | x, y, color, count | なし | main.js（衝突判定各所） | 指定座標に count 個の非有害 Debris を生成し entities.debris に push |
| spawnDeathDebris | L1028 | x, y, color, baseVx, baseVy | なし | eliminator.processEntityDeath() | 死亡演出用の有害 Debris（harmful=true）を生成し entities.debris に push |
| spawnExplosion | L1053 | x, y, isPlayer, isFlavor, sizeMultiplier, durationMultiplier, isMissileFlare, damageMultiplier | なし | main.js（衝突判定各所）, eliminator | 爆発エンティティ（Explosion）を生成し entities.explosions に push |
| clearAllEnemiesInstantly | L1074 | なし | なし | デバッグキー（3キー）handlePlayingInput | entities.enemies を即時全削除するデバッグ関数 |
| getEnemyColor | L1083 | e（EnemyShip） | string（カラーコード） | main.js（衝突判定 / スポーン各所） | 敵機の personality に応じた色コードを返す |
| damagePlayer | L1092 | amount | なし | main.js（debrisVsPlayer, explosionVsPlayer, enemyBulletVsPlayer, enemyVsPlayer, playerVsMothership） | 自機へのダメージを一元処理。damageFlashTimer 設定・damageTaken 加算 |
| update | L1126 | なし | なし | loop() | メインゲームループの更新処理。全エンティティの update・衝突判定・CollisionManager 呼び出しを担う |
| checkLevelUp | L1957 | なし | なし | CollisionManager.handleGemPickup() 経由（引数として渡される） | EXP が閾値を超えた場合にレベルアップ処理を実行。levelUpStock を加算 |
| updateLevelUpScreen | L1973 | なし | なし | update()（LEVEL_UP 状態時） | レベルアップ選択画面の更新処理。マウスホバー・クリック・カード決定演出を管理 |
| drawGameEntities | L2237 | ctx | なし | draw() | カメラ座標変換（自機中心）後に全ゲームエンティティを描画する。drawEffects を layer 別に呼ぶ |
| draw | L2378 | なし | なし | loop() | メイン描画オーケストレーター。背景→エンティティ→HUD→オーバーレイ の順で描画 |
| loop | L2390 | なし | なし | requestAnimationFrame（自己再帰） | requestAnimationFrame ループ。update() → draw() を毎フレーム呼び出す |

---

## 2. js/systems/CollisionManager.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| CollisionManager.handleGemPickup | L19 | entities, player, playerStats, checkLevelUp | なし | update() in main.js（Phase 6 ジェム回収） | Gem 配列を逆順ループ。各 Gem の update(player) 呼び出し後、dist < GEM_COLLECT_RADIUS で回収判定。HEAL なら HP 回復、EXP/BIG_EXP なら EXP 加算 → checkLevelUp() 呼び出し → splice |

---

## 3. js/controllers/ControllerInput.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|—---|
| createControllerInput | L23 | なし | object | Phase 5 Step 2 以降で HumanController.getInput() ・ AIController.getInput() から呼び出す予定（Step 1 は足場のみ） | ControllerInput のデフォルト値を持つオブジェクトを生成して返す。フィールド: turnLeft/turnRight/thrust/brake/tacticalBrake/boost/firePrimary/fireSecondary/aimAngle/driveAngle/drivePower |

---

## 4. js/controllers/HumanController.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| HumanController.getInput | L39 | ship, GAME, playerStats | ControllerInput | Phase 5 Step 2 以降で PlayerShip.update() から呼び出す予定（Step 1 は足場のみ） | InputManager.isPressed() / getMouse() を読み取り、createControllerInput() のオブジェクトに詳めて返す。GAME.controlMode の分岐もここで実施 |

---

## 6. js/classes/Bullet.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| Bullet#constructor | L9 | x, y, vx, vy, life, isScatter=false | — | PlayerShip.update() で new Bullet(...)。Scatter Shot 生成箇所（main.js）でも使用 | 自機弾の初期状態を設定。isScatter は Scatter Shot 二次弾フラグ |
| Bullet#update | L21 | なし | なし | main.js の自機弾ループ（b.update()） | this.x += this.vx; this.y += this.vy; this.life-- のみ。衝突・splice は main.js |

---

## 7. js/classes/EnemyBullet.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| EnemyBullet#constructor | L9 | x, y, vx, vy, life, damage | — | EnemyShip.update() で new EnemyBullet(...) | 敵弾の初期状態を設定。damage は対自機ダメージ量 |
| EnemyBullet#update | L21 | なし | なし | main.js の敵弾ループ（b.update()） | 位置更新（x+=vx, y+=vy）と寿命デクリメント（life--）のみ |

---

## 8. js/classes/Missile.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| Missile#constructor | L9 | x, y, vx, vy, angle, target, life, speed, turnRate, damageMult=1.0, isSubMunition=false | — | PlayerShip.update()。Sub-Munition 生成（main.js 衝突判定内） | ミサイルの初期状態を設定。target は追尾対象エンティティ参照 |
| Missile#update | L31 | entities | なし | main.js のミサイルループ（m.update(entities)） | ターゲットロスト判定→ホーミング角度補正（while 正規化）→加速→speed clamp→座標更新→噴煙パーティクル生成 |

---

## 9. js/classes/Particle.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| Particle#constructor | L14 | x, y, vx, vy, life, decay, size, color, type, maxLife, baseSize | — | main.js（各所）、Missile.update()、updateLevelUpScreen() | パーティクルの初期状態を設定。type で SPARK/CROSS/DEBRIS_SMOKE/SMOKE/LEVEL_UP_HIT_PARTICLE を区別 |
| Particle#update | L39 | なし | なし | EffectManager.update() 内。updateLevelUpScreen() 内（LEVEL_UP_HIT_PARTICLE） | 位置更新（x+=vx, y+=vy）と寿命減衰（life -= decay \|\| CONFIG.PARTICLE_DECAY） |

---

## 10. js/classes/Debris.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| Debris#constructor | L14 | x, y, vx, vy, color, size, life, decay, harmful | — | spawnDebris()、spawnDeathDebris() in main.js | 破片の初期状態を設定。harmful=true のものは自機・敵機へのダメージ判定対象 |
| Debris#update | L32 | なし | なし | main.js のデブリループ（d.update()） | this.x += this.vx; this.y += this.vy; this.life -= this.decay のみ |

---

## 11. js/classes/Explosion.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| Explosion#constructor | L22 | x, y, maxRadius, timer, maxTimer, damagedEntities, isPlayerExplosion, isFlavor, isMissileFlare, damageMultiplier, angle, offsetMid, offsetSmall | — | spawnExplosion() in main.js | 爆発の初期状態を設定。damagedEntities は二重ダメージ防止用 Set |
| Explosion#update | L50 | なし | なし | main.js の爆発ループ（exp.update()） | timer-- → progress 算出（sin ease-out/ease-in）→ shakeX/shakeY 算出 → currentScale/currentRadius 保存。ダメージ・splice は main.js |

---

## 12. js/classes/Gem.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| Gem#constructor | L17 | x, y, vx, vy, kind, exp, heal, locked, speed, sprite, sizeMult | — | eliminator.spawnItem() | Gem エンティティの初期状態を設定。kind は 'EXP' \| 'BIG_EXP' \| 'HEAL' |
| Gem#update | L37 | player | なし | CollisionManager.handleGemPickup() 内（g.update(player)） | dist 計算→EXP_MAGNET_RADIUS 判定→locked フラグ設定→ロック中は加速+プレイヤー方向移動→未ロック中は vx/vy 慣性移動（0.92 減速）。回収判定・splice は CollisionManager |

---

## 13. js/classes/communication.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| Communication#constructor | L2 | なし | — | main.js で `const comm = new Communication()` | シエロ通信 UI の初期化。cielo-comm DOM 要素への参照を保持 |
| Communication#play | L8 | msg, type="normal" | なし | eliminator.js、main.js 各所 | 通信メッセージを表示。タイプライター演出と表示タイマーを制御 |

---

## 11. js/systems/input.js（InputManager オブジェクト）

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| InputManager.isPressed | — | code（KeyboardEvent.code） | boolean | PlayerShip.update(), main.js の handleInput 各所 | 指定キーが現在押下中かどうかを返す |
| InputManager.getMouse | — | なし | {x, y, leftDown} | PlayerShip.update(), updateLevelUpScreen() | 現在のマウス座標と左クリック状態を返す |

---

## 12. js/systems/init.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| initEntities | L1 | entities | なし | resetGame() in main.js | entities の全配列を空にリセット（enemies, bullets, gems 等） |
| initGameState | L12 | GAME | なし | resetGame() in main.js | GAME オブジェクトをリセット（killCount, state, 各種フラグ等） |
| initMothership | L26 | entities, CONFIG | なし | resetGame() in main.js | 敵母艦オブジェクトを初期化し entities.enemyMothership に設定 |
| initPlayer | L37 | player, playerStats | なし | resetGame() in main.js | プレイヤーの座標・速度・各種フラグをリセット |
| initUI | L57 | なし | なし | resetGame() in main.js | DOM の UI パネル（credits, stats 等）を初期表示状態にリセット |

---

## 13. js/systems/effects.js（EffectManager オブジェクト）

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| EffectManager.update | — | entities | なし | update() in main.js（7番目） | entities.particles を逆順ループ。p.update() を呼び出し、life <= 0 で splice |
| EffectManager.draw | — | ctx, entities, layer | なし | drawEffects() in renderers/drawEffects.js | layer('background'/'foreground')に応じてパーティクル・デブリ・爆発を描画 |

---

## 14. js/systems/eliminator.js（eliminator オブジェクト）

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| eliminator.spawnItem | L2 | x, y, baseVx, baseVy, kind, sprite, exp, heal, sizeMult=1 | なし | eliminator.processEntityDeath() | Gem エンティティを new Gem(...) で生成し entities.gems に push |
| eliminator.processEntityDeath | L20 | e, type, index | なし | main.js の各生存チェック（e.hp <= 0 / isPlayerDying 等） | type='PLAYER'\|'MOTHERSHIP'\|'FIGHTER' に応じた死亡処理を実行。デブリ生成・アイテムドロップ・通信・シーン遷移を担当 |

---

## 15. js/systems/hud.js（HUDManager オブジェクト）

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| HUDManager.update | — | playerStats, GAME | なし | update() in main.js（最終行） | クレジット・ステータスパネルの DOM 更新。表示・非表示の切り替えも行う |

---

## 16. js/scenes/TitleScene.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| TitleScene#constructor | — | なし | — | main.js で SceneManager.title として生成 | タイトル画面の内部状態（自機上昇アニメ用変数等）を初期化 |
| TitleScene#update | — | なし | なし | update() in main.js（TITLE 状態時） | タイトル画面の毎フレーム更新。星屑スクロール・flavor 爆発更新・自機上昇演出・フェードアウト遷移を担当 |

---

## 17. js/scenes/ResultScene.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| ResultScene#constructor | — | なし | — | main.js で SceneManager.result として生成 | リザルト画面の内部状態を初期化 |
| ResultScene#init | — | isClear | なし | initResultScreen() in main.js | リザルト画面の初期化。isClear に応じたメッセージ・経費精算データを設定 |
| ResultScene#update | — | なし | なし | update() in main.js（RESULT 状態時） | リザルト画面の毎フレーム更新。明細インターバル表示・スタンプ演出・画面シェイクを管理 |

---

## 18. js/utils/utils.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| normalizeAngle | L8 | angle | number | rotateTowards() | 角度を -π〜π の範囲に正規化して返す |
| rotateTowards | L13 | current, target, maxStep | number | EnemyShip.update() などで砲塔・機首の旋回に使用 | current から target へ最大 maxStep だけ近づけた角度を返す |
| getCatapultSpec | L19 | なし | object（x, y, tipX, tipY 等） | main.js（着艦判定）、drawGameEntities() | 味方母艦カタパルトの座標スペック（先端 tip 座標含む）を返す |
| drawExplosion | L37 | ctx, exp | なし | drawEffects.js（EffectManager.draw） | 爆発エンティティ（Explosion）を Canvas に描画。3重円＋振動演出 |
| formatCoord | L82 | v | string | RadarManager.draw() 内（座標表示） | 座標値を符号付き整数文字列に整形して返す |
| drawCircularText | L88 | ctx, text, radius, startAngle, isBottom=false | なし | RadarManager.draw() 内（円弧テキスト） | 指定半径・角度上に文字を円弧状に配置して描画する |
| drawRibbonTrail | L130 | history, colorBase, maxLen | なし | drawEffects.js（トレイル描画） | エンジントレイルの履歴配列を quadraticCurveTo で滑らかに描画 |

---

## 19. js/systems/handleInput.js

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| handleTitleInput | — | e（KeyboardEvent） | なし | main.js の keydown リスナー（TITLE 状態） | タイトル画面のキー入力処理。任意キーで出撃演出開始 |
| handleResultInput | — | e（KeyboardEvent） | なし | main.js の keydown リスナー（RESULT 状態） | リザルト画面のキー入力処理。RETRY / RETURN 選択 |
| handleLevelUpInput | — | e（KeyboardEvent） | なし | main.js の keydown リスナー（LEVEL_UP 状態） | レベルアップ選択画面のキー入力処理 |
| handlePlayingInput | — | e（KeyboardEvent） | なし | main.js の keydown リスナー（PLAYING 状態） | ゲームプレイ中のキー入力処理（デバッグキー含む） |
| handleCommInput | — | e（KeyboardEvent） | なし | main.js の keydown リスナー（commState がアクティブ時） | 通信メニュー表示中のキー入力処理（F/R/E/Q キー） |

---

## 20. js/systems/radar.js（RadarManager オブジェクト）

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| RadarManager.draw | — | ctx, player, entities, GAME, playerStats | なし | drawHUD() in renderers/drawHUD.js | 自機追従レーダーを描画。ターゲットマーカー・母艦方向・敵方向・資源表示・マイクロHUD・ダイナミックアラートを管理 |

---

## 21. js/systems/map.js（MapManager オブジェクト）

| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 概要 |
|-------|--------|------|--------|----------|------|
| MapManager.draw | — | ctx, player, entities, GAME | なし | drawHUD() in renderers/drawHUD.js | 画面右上ミニマップを描画。自機・母艦・敵機の位置を縮小座標で表示 |

---

## 22. main.js 内インラインオブジェクト

| オブジェクト名 | 定義場所 | 主なメソッド | 概要 |
|--------------|---------|------------|------|
| SceneManager | main.js | .title（TitleScene）, .result（ResultScene） | シーンオブジェクトをラップするコンテナ |
| CommStateManager | main.js | handleInput(e), handleActiveInput(e), draw(ctx, radarRadius) | 通信UI（Comm Menu / Level Up Comm）の状態遷移と描画を担当 |

---

> [!NOTE]
> Ship.js / PlayerShip.js / EnemyShip.js は現在コメントアウト中（index.html で読み込まれていない）。
> PlayerShip / EnemyShip の実体コードは main.js 内に残存しており、将来フェーズで正式分離予定。
