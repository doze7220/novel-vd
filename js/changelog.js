const changelog = [
  {
    version: "v0.5.38",
    date: "2026-06-04",
    description: "Refactoring: Phase 4 Step 7 - Gem クラス化。吸引・移動処理を Gem.update(player) に委譲。",
    details: [
      "【リファクタリング】js/classes/Gem.js を新規作成。constructor(x,y,vx,vy,kind,exp,heal,locked,speed,sprite,sizeMult) + update(player) を実装",
      "【リファクタリング】update(player) は距離計算・EXP_MAGNET_RADIUS 判定・locked フラグ設定・吸引加速（GEM_MAGNET_ACCEL）・プレイヤー方向移動・慣性移動（vx/vy 0.92減速）のみ（回収判定・EXP加算・splice は行わない）",
      "【リファクタリング】js/systems/eliminator.js の spawnItem() 内の entities.gems.push({...}) → new Gem(...) に変換",
      "【リファクタリング】main.js Gemループの吸引・移動処理（約20行）→ g.update(player) の1行に置換",
      "【変更なし】回収判定（dist < GEM_COLLECT_RADIUS）・EXP加算・HP回復・checkLevelUp()・entities.gems.splice は main.js Gemループ内に残存（CollisionManager フェーズで移動予定）",
      "【変更なし】drawEffects.js / EffectManager 変更なし。MAGNET_RANGE・吸引係数・距離計算式・vx/vy 計算式・update順序・draw順序は完全維持"
    ]
  },
  {
    version: "v0.5.37",
    date: "2026-05-31",
    description: "Refactoring: Phase 4 Step 6 - Explosion クラス化。タイマー・scale/shake計算・currentRadius算出を Explosion.update() に委譲。",
    details: [
      "【リファクタリング】js/classes/Explosion.js を新規作成。constructor(x,y,maxRadius,timer,maxTimer,damagedEntities,isPlayerExplosion,isFlavor,isMissileFlare,damageMultiplier,angle,offsetMid,offsetSmall) + update() を実装",
      "【リファクタリング】update() は timer--; → progress算出 → scale計算（sin ease-out/ease-in + 維持時震え）→ shakeX/shakeY算出 → currentScale/currentRadius保存 のみ（damage/collision/splice は行わない）",
      "【リファクタリング】spawnExplosion() 内の entities.explosions.push({...}) → new Explosion(...) に変換",
      "【リファクタリング】main.js 爆発更新ループの timer/scale/shake計算（約20行）→ exp.update() の1行 + progress/currentRadius再取得に置換",
      "【変更なし】爆発ダメージ判定（対Player / 対Enemy）・cleanup(splice)・ゲームオーバー遷移は main.js 爆発ループ内に残存。drawEffects.js / EffectManager 変更なし",
      "【保証】explosion timer・scale計算式(sinによるease-out/ease-in)・shake振幅・currentScale/shakeX/shakeYの描画参照・damage判定タイミング(progress 0.02〜0.15)・重複ダメージ防止(damagedEntities Set)・cleanup(timer<=0)・ゲームオーバー遷移(isPlayerExplosion)は変更なし"
    ]
  },
  {
    version: "v0.5.36",
    date: "2026-05-31",
    description: "Refactoring: Phase 4 Step 5 - Debris クラス化。位置更新・寿命減衰を Debris.update() に委譲。",
    details: [
      "【リファクタリング】js/classes/Debris.js を新規作成。constructor(x,y,vx,vy,color,size,life,decay,harmful) + update() を実装",
      "【リファクタリング】update() は d.x += d.vx; d.y += d.vy; d.life -= d.decay; のみ（particle生成・damage・splice は行わない）",
      "【リファクタリング】spawnDebris() 内の entities.debris.push({...}) → new Debris(...) に変換",
      "【リファクタリング】spawnDeathDebris() 内の entities.debris.push({...}) → new Debris(...) に変換",
      "【リファクタリング】main.js デブリ更新ループの d.x/d.y/d.life 更新2行 → d.update() の1行に置換",
      "【変更なし】煙パーティクル生成・衝突判定・cleanup(splice) は main.js デブリループ内に残存。drawEffects.js / EffectManager 変更なし。spawnDebris() / spawnDeathDebris() の責務・シグネチャ変更なし",
      "【保証】デブリ寿命・慣性移動・decay・サイズ・harmful フラグ・発生タイミング・消滅タイミングは変更なし"
    ]
  },
  {
    version: "v0.5.35",
    date: "2026-05-31",
    description: "Refactoring: Phase 4 Step 4 - Particle クラス化。全パーティクル生成箇所を new Particle() に変換し、update() を委譲。",
    details: [
      "【リファクタリング】js/classes/Particle.js を新規作成。constructor(x,y,vx,vy,life,decay,size,color,type,maxLife,baseSize) + update() を実装",
      "【リファクタリング】update() は p.x += p.vx; p.y += p.vy; p.life -= this.decay || CONFIG.PARTICLE_DECAY; のみ（splice/filter は行わない）",
      "【リファクタリング】main.js 内の particles.push({...}) 4箇所 (SPARK/CROSS/DEBRIS_SMOKE/LEVEL_UP_HIT_PARTICLE) を new Particle(...) に変換",
      "【リファクタリング】Missile.js 内の particles.push({...}) 1箇所 (SMOKE) を new Particle(...) に変換",
      "【リファクタリング】EffectManager.update() (effects.js) の p.x/p.y/p.life 更新3行を p.update() の1行に置換",
      "【リファクタリング】updateLevelUpScreen() 内 LEVEL_UP_HIT_PARTICLE 専用ループの p.x/p.y/p.life 更新を p.update() に置換",
      "【変更なし】drawEffects.js を変更しない。cleanup (splice) は全て EffectManager.update() / updateLevelUpScreen() に残存。型名・プロパティ名（type, decay, maxLife, baseSize）変更なし。update順序・particle発生タイミング・alpha減衰・velocity減衰は変更なし"
    ]
  },
  {
    version: "v0.5.34",
    date: "2026-05-31",
    description: "Refactoring: Phase 4 Step 3 - Missile クラス化。ホーミング・物理演算・噴煙生成を Missile.update(entities) に委譲。",
    details: [
      "【リファクタリング】js/classes/Missile.js を新規作成。constructor(x,y,vx,vy,angle,target,life,speed,turnRate,damageMult,isSubMunition) + update(entities) を実装",
      "【リファクタリング】update() にホーミング角度補正（while 正規化含む）・加速度加算・speed clamp・座標更新・噴煙パーティクル生成を移植",
      "【リファクタリング】PlayerShip.update() 内の発射 push → new Missile(...) に変更",
      "【リファクタリング】main.js のミサイル更新ループ（L1440–L1477 相当）を m.update(entities) の1行に置換",
      "【リファクタリング】Sub-Munition 生成箇所（敵機衝突・母艦衝突の2箇所）→ new Missile(..., isSubMunition=true) に変更",
      "【変更なし】衝突判定（対Enemy / 対EnemyMothership）・Sub-Munition 生成条件・cleanup・draw は main.js に残存",
      "【保証】atan2・while 正規化・speed clamp・推力 0.5 の計算式は元コードと完全一致。update 順序・collision 順序・particle 発生タイミングは変更なし"
    ]
  },
  {
    version: "v0.5.33",
    date: "2026-05-31",
    description: "Refactoring: Phase 4 Step 2 - EnemyBullet クラス化。位置更新・寿命デクリメントを EnemyBullet.update() に委譲。",
    details: [
      "【リファクタリング】js/classes/EnemyBullet.js を新規作成。constructor(x,y,vx,vy,life,damage) + update() を実装",
      "【リファクタリング】EnemyShip.update() 内の entities.enemyBullets.push({...}) → new EnemyBullet(...) に変更",
      "【リファクタリング】main.js の敵弾更新ループ内 b.x += b.vx; b.y += b.vy; b.life--; → b.update() に置換",
      "【変更なし】衝突判定（対Player / 対Missile）・cleanup・draw は main.js に残存。damage 量・発射タイミング変更なし"
    ]
  },
  {
    version: "v0.5.32",
    date: "2026-05-31",
    description: "Refactoring: Phase 4 Step 1 - Bullet クラス化。位置更新・寿命デクリメントを Bullet.update() に委譲。",
    details: [
      "【リファクタリング】js/classes/Bullet.js を新規作成。constructor(x,y,vx,vy,life,isScatter=false) + update() を実装",
      "【リファクタリング】PlayerShip.update() 内の entities.bullets.push({...}) → new Bullet(...) に変更",
      "【リファクタリング】main.js の弾更新ループ内 b.x += b.vx; b.y += b.vy; b.life--; → b.update() に置換",
      "【リファクタリング】Scatter Shot 生成箇所 2 箇所（敵機衝突・母艦衝突）→ new Bullet(..., true) に変更",
      "【変更なし】衝突判定・cleanup・draw は main.js に残存。弾速・射程・Scatter Shot 挙動変更なし"
    ]
  },
  {
    version: "v0.5.31",
    date: "2026-05-28",
    description: "Refactoring: Phase 3 Step 3 - EnemyShip.update() を実装し敵AIロジックをカプセル化。",
    details: [
      "【リファクタリング】EnemyShip.update(player, entities, GAME) を追加。射出シーケンス・性格別AI・障害物回避・エイム揺らぎ・ヒートゲージ・射撃処理を完全移植",
      "【リファクタリング】物理演算箇所（推力加算→摩擦→速度クランプ→座標更新）を super.updatePhysics(maxSpd) に委譲",
      "【リファクタリング】main.js の for ループ内 AI ロジックを e.update(player, entities, GAME) の1行に置換。射出シーケンス中は continue で早期スキップ",
      "【変更なし】衝突判定（弾・体当たり）・生存チェック・flashTimer-- は main.js に残存",
      "【保証】steering algorithm / personality / target selection / avoidance timing / firing timing / heat処理順 / launch sequence順 / vx/vy計算式は完全維持"
    ]
  },
  {
    version: "v0.5.30",
    date: "2026-05-27",
    description: "Refactoring: Phase 3 Step 2 - PlayerShip.update() を実装し操作ロジックをカプセル化。",
    details: [
      "【リファクタリング】PlayerShip.prototype.update(GAME, entities) を追加。prevVx/prevVy保存・LaunchSequence・ブーストゲージ・旋回/推力・タクティカルブレーキ・着艦シーケンス・ヒートゲージ・射撃・ミサイル発射を完全移植",
      "【リファクタリング】物理演算箇所（摩擦→速度クランプ→座標更新）を super.updatePhysics(currentMaxSpeed) に委譲",
      "【リファクタリング】main.js の update() 内プレイヤーロジックを player.update(GAME, entities) の1行に置換",
      "【変更なし】HUD DOM操作・星スクロール・トレイル更新・衝突判定は main.js に残存。EnemyShip・描画系・衝突判定は一切変更なし",
      "【保証】処理順序（boost消費順・heat加算順・firing timing・recoil timing・tactical brake・launch/landing sequence順序・particle生成順）は完全維持"
    ]
  },
  {
    version: "v0.5.29",
    date: "2026-05-27",
    description: "Refactoring: Phase 3 Step 1 - Ship 基底クラスに updatePhysics() / takeDamage() を追加。",
    details: [
      "【リファクタリング】Ship クラスに updatePhysics(maxSpeed) を追加。処理順序（摩擦 → 速度クランプ → 座標更新）は main.js 既存実装と完全一致",
      "【リファクタリング】Ship クラスに takeDamage(amount) を追加（HP 減少 + flashTimer 設定）",
      "【変更なし】PlayerShip / EnemyShip / main.js update() / 描画系 / 衝突判定は一切変更なし"
    ]
  },
  {
    version: "v0.5.28",
    date: "2026-05-25",
    description: "Feature: Updated HUD stats panel and implemented Booster System logic.",
    details: [
      "【機能追加】HUDの詳細ステータスパネルに VULCAN / MISSILE の DAMAGE と RANGE を追加表示",
      "【機能追加】HUDに Booster System の強化段階に応じた BOOST CAP. (ブースト容量) を表示するように変更",
      "【表示修正】HUDの ACC 表記を ACCELERATION に修正",
      "【表示修正】HUDの MAX SPEED と ACCELERATION の数値に単位（km/s, G）を追加",
      "【表示修正】HUDにミサイル速度（SPEED）を追加し、ミサイル等の連動ステータスのレベル表記を空白に変更。速度には単位（km/s）を付与",
      "【表示修正】自機の砲塔の長さを調整し、先端から少し短くなるように変更",
      "【不具合修正】Booster System のアップグレード効果（ブーストゲージ増加・CD短縮）が実際のゲームプレイに反映されていなかった不具合を修正",
      "【機能追加】Missile System のアップグレード効果（同時発射数、攻撃力、速度、射程の向上）を正式に実装"
    ]
  },
  {
    version: "v0.5.27",
    date: "2026-05-25",
    description: "Bugfix: Corrected engine and wind trail coordinate logic.",
    details: [
      "【不具合修正】機体回転時に、メインエンジンの光の軌跡（トレイル）の発生座標がズレる問題を修正",
      "【不具合修正】機体回転時に、翼端から発生する風トレイルの座標がズレる問題を修正"
    ]
  },
  {
    version: "v0.5.26",
    date: "2026-05-25",
    description: "Refactoring: Restructured utils directory into renderers and systems.",
    details: [
      "【リファクタリング】`js/utils/` に散在していた描画やシステム関連のファイルを適切なドメインへ再配置",
      "【移動】描画処理群を `js/renderers/` へ移動 (`drawBackground.js`, `drawEffects.js`, `drawHUD.js`, `drawOverlay.js`)",
      "【移動】ゲーム状態管理系を `js/systems/` へ移動 (`handleInput.js`, `init.js`)",
      "【最適化】`utils/` には状態を持たない純粋なユーティリティ (`utils.js`, `asset.js`) のみを残すよう構造を洗練"
    ]
  },
  {
    version: "v0.5.25",
    date: "2026-05-25",
    description: "Refactoring: Restructured js directory into data, systems, and utils.",
    details: [
      "【リファクタリング】`js/` 直下に散在していたファイルを役割ごとに整理・移動",
      "【移動】設定・データ系を `js/data/` へ移動 (`config.js`, `constants.js`, `stats.js`, `upgradePool.js`)",
      "【移動】システム管理・マネージャー系を `js/systems/` へ移動 (`input.js`, `hud.js`, `effects.js`, `eliminator.js`, `radar.js`, `map.js`)",
      "【移動】描画アセット系を `js/utils/` へ移動 (`asset.js`)"
    ]
  },
  {
    version: "v0.5.24",
    date: "2026-05-25",
    description: "Refactoring: Dynamic version rendering on title screen.",
    details: [
      "【UI】`index.html` の `<title>` タグからバージョン表記を削除し、ゲーム名のみに変更",
      "【UI】タイトル画面のバージョン表記（右下）を、ハードコードから `changelog.js` の最新バージョンを動的に読み取って表示する仕様へ変更"
    ]
  },
  {
    version: "v0.5.23",
    date: "2026-05-25",
    description: "Refactoring: Unified multiple input handlers into a single file.",
    details: [
      "【リファクタリング】`js/utils/` 配下に分散していた入力ハンドラ関数（`handleTitleInput`, `handleResultInput`, `handleLevelUpInput`, `handlePlayingInput`, `handleCommInput`）を `handleInput.js` 1ファイルに統合",
      "【最適化】`index.html` のscriptタグの読み込みをさらに削減"
    ]
  },
  {
    version: "v0.5.22",
    date: "2026-05-25",
    description: "Refactoring: Unified multiple init functions into a single file.",
    details: [
      "【リファクタリング】`js/utils/` 配下に分散していた初期化関数（`initPlayer`, `initEntities`, `initGameState`, `initUI`, `initMothership`）を `init.js` 1ファイルに統合",
      "【最適化】`index.html` のscriptタグの読み込みを削減"
    ]
  },
  {
    version: "v0.5.21",
    date: "2026-05-24",
    description: "Refactoring Phase 3 Addendum 3: Dedicated Title and Result opaque backgrounds.",
    details: [
      "【仕様変更】`main.js` から削除した `TITLE`・`RESULT` の早期リターンの代わりとして、`drawOverlay.js` にて画面全体を不透明な色で塗りつぶす仕様に変更し、下層レイヤー（ゲーム内エンティティやHUD）を完全に隠蔽",
      "【追加】タイトル画面専用の独立した星屑背景（`GAME.titleStars`）を追加。色付きで瞬く演出を加え、タイトル画面独自の深みを表現",
      "【修正】直前に追加した `main.js` 内の `drawGameEntities` と `drawHUD` に対する `if` ガードを撤去（下層レイヤーとして正常に機能する構造に回帰）"
    ]
  },
  {
    version: "v0.5.20",
    date: "2026-05-24",
    description: "Hotfix: Prevented game entities and HUD from rendering during TITLE and RESULT scenes.",
    details: [
      "【修正】`main.js` の `draw()` にて、状態が `TITLE` または `RESULT` の時は `drawGameEntities` および `drawHUD` を実行しないよう修正し、意図せずゲーム内UIや自機・母艦が描画されてしまう問題を解消"
    ]
  },
  {
    version: "v0.5.19",
    date: "2026-05-24",
    description: "Refactoring Phase 3 Addendum 2: Integrated TITLE/RESULT rendering into drawOverlay.",
    details: [
      "【リファクタリング】`TitleScene` および `ResultScene` 内の描画処理（`draw()` メソッド）を抽出し、`js/utils/drawOverlay.js` に統合",
      "【最適化】`main.js` の `draw()` 関数内から `TITLE` および `RESULT` ステートの早期リターンを削除し、過去のゲーム画面（エンティティ）が背面レイヤーに描画される仕様へ移行",
      "【整理】不要となった `draw` メソッドを `TitleScene.js` と `ResultScene.js` から削除"
    ]
  },
  {
    version: "v0.5.18",
    date: "2026-05-24",
    description: "Refactoring Phase 3 Addendum: Integrated Level Up Screen into HUD.",
    details: [
      "【リファクタリング】`main.js` に残存していた `drawLevelUpScreen` を `js/utils/drawHUD.js` に統合",
      "【最適化】`draw()` 内での `LEVEL_UP` ステート時の早期リターンを削除し、レベルアップ画面の背景にゲーム画面が透けて見える仕様へ移行",
      "【整理】不要となった `drawLevelUpScreen` 関数を `main.js` から完全削除"
    ]
  },
  {
    version: "v0.5.17",
    date: "2026-05-24",
    description: "Refactoring Phase 4: Separated rendering logic and converted bullets/missiles to sprites.",
    details: [
      "【リファクタリング】`main.js` に肥大化していた描画処理のうち、純粋描画部分を `js/utils/` 配下（`drawBackground.js`, `drawEffects.js`, `drawHUD.js`, `drawOverlay.js`）へ抽出",
      "【最適化】`main.js` の `draw()` を簡略化し、プレイヤーや敵など物理と密結合するエンティティ描画のみを残して整理",
      "【最適化】毎フレーム canvas に直接描画していた自機弾・敵弾・ミサイルを `asset.js` でのキャッシュ化（スプライト）に移行し、描画負荷を低減"
    ]
  },
  {
    version: "v0.5.16",
    date: "2026-05-24",
    description: "Refactoring Phase 3: Extracted keyboard input handling.",
    details: [
      "【リファクタリング】`main.js` に肥大化していた `keydown` の処理をゲーム状態ごとに分離し、専用の入力ハンドラ（`handleTitleInput`, `handleResultInput`, `handleLevelUpInput`, `handlePlayingInput`, `handleCommInput`）へ移動（完全互換維持）",
      "【最適化】`main.js` の `keydown` リスナーを、状態に応じたハンドラへ委譲する薄いディスパッチャに簡略化",
      "【修正】通信モード（GAME.commState がアクティブな状態）において、KeyC（通信終了）および KeyX（視点切替）が処理されず入力が受け付けられなくなる不具合を修正"
    ]
  },
  {
    version: "v0.5.15",
    date: "2026-05-24",
    description: "Bug fix for Cielo undefined & Refactoring Phase 3: RESETGAME.",
    details: [
      "【バグ修正】リファクタリング後に `Cielo.init()` が `main.js` の末尾に残存しており、ゲーム起動時に ReferenceError となる不具合を修正",
      "【リファクタリング】`main.js` に肥大化していた `resetGame()` の内部処理を責務ごとに分割し、`js/utils/` 配下の複数の初期化関数（`initPlayer`, `initEntities`, `initGameState`, `initUI`, `initMothership`）へカプセル化（完全互換維持）"
    ]
  },
  {
    version: "v0.5.14",
    date: "2026-05-24",
    description: "Refactoring Phase 2g: Extracted Cielo communication UI.",
    details: [
      "【リファクタリング】`main.js` に直書きされていた通信UI（Cielo）の処理を抽出し、`js/classes/communication.js` の `Communication` クラスとして分離（カプセル化）",
      "【変更】既存のCielo.play呼び出しを完全に新クラスへ移行（機能の完全互換を維持）"
    ]
  },
  {
    version: "v0.5.13",
    date: "2026-05-24",
    description: "Refactoring Phase 2h: Cached Enemy Mothership rendering.",
    details: [
      "【最適化・リファクタリング】`main.js` にベタ書きされていた敵母艦の複雑な描画（パス描画）を `asset.js` に抽出し、スプライトとしてキャッシュする仕組みに変更。描画負荷を大幅に削減。",
      "【最適化・リファクタリング】同様に味方母艦（Aガレージ）の描画処理もスプライトキャッシュ化。",
      "【クリーンアップ】不要になった旧仕様の敵機噴煙エフェクト（`ENEMY_THRUSTER`）の生成および描画処理を削除。"
    ]
  },
  {
    version: "v0.5.12",
    date: "2026-05-24",
    description: "Fixed enemy physics engine scaling.",
    details: [
      "【バグ修正】敵機の最高速度および加速度が `CONFIG.ENEMY_MAX_SPEED` や `CONFIG.ENEMY_ACCEL` ではなく、自機の速度に依存して計算されていた不具合を修正。CONFIG値が直接反映されるように変更。",
      "【仕様変更】敵機の機首旋回速度が瞬間的（直打ち）だった仕様を修正し、`CONFIG.ENEMY_HANDLING`（新規追加）のパラメータに基づいて段階的に旋回するよう変更"
    ]
  },
  {
    version: "v0.5.11",
    date: "2026-05-24",
    description: "Refactoring Phase 2g: Centralized entity death logic into eliminator.",
    details: [
      "【リファクタリング】`main.js` から各エンティティ（自機、母艦、一般戦闘機）の死亡・撃破ロジックとアイテム生成を抽出し、`js/eliminator.js` に `eliminator` として分離",
      "【仕様変更】すべてのダメージ判定からの直接死亡を廃止し、更新ループの最後で一元的に死亡処理を行う ECS 風のアーキテクチャに変更"
    ]
  },
  {
    version: "v0.5.10",
    date: "2026-05-24",
    description: "Refactoring Phase 2f: Extracted effect updating and drawing logic.",
    details: [
      "【リファクタリング】`main.js` からパーティクルの更新処理と、各種エフェクト（パーティクル、デブリ、爆発）の描画ロジックを抽出し、`js/effects.js` に `EffectManager` として分離（カプセル化）",
      "【バグ修正】弾やミサイルが敵に命中した際、誤ったインデックスで `killEnemy` が呼ばれ、意図しない敵が消滅するバグを修正"
    ]
  },
  {
    version: "v0.5.09",
    date: "2026-05-24",
    description: "Refactoring Phase 2e: Extracted HUD and UI drawing logic.",
    details: [
      "【リファクタリング】`main.js` から HUD (ヘッドアップディスプレイ) の更新と UI の描画ロジックを抽出し、`js/hud.js` に `HUDManager` として分離（カプセル化）",
      "【リファクタリング】`updateHUD()` と `draw()` 内の UI 描画処理を移行"
    ]
  },
  {
    version: "v0.5.08",
    date: "2026-05-24",
    description: "Refactoring Phase 2d: Extracted input management logic.",
    details: [
      "【リファクタリング】`main.js` からキーボード・マウスの入力状態を管理するロジックを抽出し、`js/input.js` に `InputManager` オブジェクトとして分離（カプセル化）"
    ]
  },
  {
    version: "v0.5.07",
    date: "2026-05-24",
    description: "Refactoring Phase 2c: Extracted Title and Result scenes into separate modules.",
    details: [
      "【リファクタリング】`main.js` からタイトル画面のロジック（更新および描画）を抽出し、`js/scenes/TitleScene.js` として分離（カプセル化）",
      "【リファクタリング】`main.js` からリザルト画面のロジック（初期化、更新、描画）を抽出し、`js/scenes/ResultScene.js` として分離（カプセル化）",
      "【システム変更】`main.js` 内に `SceneManager` を導入し、抽出した各シーンクラスのインスタンスを管理・呼び出すように構造を変更"
    ]
  },
  {
    version: "v0.5.06",
    date: "2026-05-24",
    description: "Refactoring Phase 2b: Extracted minimap drawing logic and fixed ACC display bug.",
    details: [
      "【バグ修正】レーダーのACC（加速度/Gフォース）表示が0.0Gのまま更新されない問題を修正（prevVx, prevVyの保存タイミングをupdateループの先頭へ移動）",
      "【リファクタリング】`main.js` から画面右上のミニマップ描画ロジックを抽出し、`js/map.js` に `MapManager` オブジェクトとして分離（将来的な全体マップ拡張へ対応するための構造化）"
    ]
  },
  {
    version: "v0.5.05",
    date: "2026-05-24",
    description: "Refactoring Phase 2a: Extracted radar drawing logic.",
    details: [
      "【リファクタリング】`main.js` からレーダーの描画ロジック（ゲージ、ターゲットマーカー、母艦方向、敵方向、資源表示、マイクロHUD、ダイナミックアラート）を抽出し、`js/radar.js` の `Radar.draw` メソッドへ分離（完全互換維持）"
    ]
  },
  {
    version: "v0.3.12",
    date: "2026-05-23",
    description: "Re-implemented and completed the enemy balance adjustments and level-up communication UI bug fixes after an IDE crash.",
    details: [
      "【バランス】敵の攻撃力パラメータが衝突ダメージに正しく反映されるよう修正（黒:50%、青:90%、紫:110%）",
      "【不具合対応】Cキーによる通信画面遷移のロジックを再構築し、レベルアップストックがある場合のMENUからLEVEL_UPへの切り替えが確実に動作するよう修正"
    ]
  },
  {
    version: "v0.3.11 (Balance & Bug Fix)",
    date: "2026-05-23",
    description: "Adjusted enemy behavior based on player parameters and fixed the level-up comms UI bug.",
    details: [
      "【バランス】敵のパラメータをプレイヤーの基本パラメータを基準とする相対値へ変更",
      "【バランス】黒（突撃）: 速度90%、旋回100%、攻撃力50%",
      "【バランス】青（ドッグファイト）: 速度80%、旋回90%、攻撃力90%",
      "【バランス】紫（狙撃）: 速度75%、旋回75%、攻撃力110%",
      "【不具合対応】upgradePoolにmaxLevelプロパティが存在せず、レベルアップ選択肢の抽選が常に失敗（空配列）していた重大な問題を修正",
      "【不具合対応】Cキーによる通信で、MENU状態からでもレベルアップストックがあればLEVEL_UP画面へ移行できるよう修正",
      "【不具合対応】一度に複数レベルアップするだけの経験値を獲得した際、ストックが1つしか増加しなかった問題を修正（whileループ化）"
    ]
  },
  {
    version: "v0.3.10 (Level Up UI Polish & Title Fade)",
    date: "2026-05-23",
    description: "Refined the level up quick selection UI and title screen transition effects.",
    details: [
      "【UI】レベルアップ簡易選択（通信UI）の表示位置を下げ、現在速度表示と重ならないように修正",
      "【UI】レベルアップ簡易選択のアイコンを正方形の丸角ベクターグラフィックで描画するように変更",
      "【UI】アップグレードの内容をアイコン内に2行のテキスト（[バルカン]/[連射]など）で分かりやすく表示",
      "【操作】レベルアップ簡易選択時のキーバインドを左から[Q][E][R]に変更",
      "【操作】レベルアップ簡易選択中は、Eキーなどの他のゲーム内機能（ミサイル発射等）が発動しないよう排他制御を追加",
      "【演出】タイトル画面で出撃時のブラックフェードアウト中、星背景やタイトル文字・フレア等も同時に暗転するように修正（自機はそのまま上昇）",
      "【デバッグ】5キー：経験値獲得だけでなく、強制的にレベルアップ処理を走らせストックを増加させる仕様へ変更"
    ]
  },
  {
    version: "v0.3.9 (Enemy Mothership & FX Overhaul)",
    date: "2026-05-23",
    description: "Introduced Enemy Mothership, dynamic spawn catapults, and overhauled flare visuals.",
    details: [
      "【エフェクト】フレア（爆発）の描画ロジックを刷新。中心からランダムにズレた位置に中・小の円を重ねて描画するよう改修",
      "【エフェクト】フレアの中・小の円が、常に一番外側の最も大きい円の範囲内に収まるようはみ出し防止ロジックを追加",
      "【ミサイル】ミサイルの移動中に煙パーティクル(SMOKE)を噴出するよう変更",
      "【ミサイル】ミサイルの移動速度を従来の約2/3に低減",
      "【敵母艦】敵母艦（Enemy Mothership）を実装。HP1000、プレイヤー弾/ミサイル/体当たりダメージが有効",
      "【敵母艦】敵母艦撃破時、2倍サイズ・2倍ダメージの大型フレアを5秒間発生させ、さらに中フレアを2〜3個周囲に発生させる演出を追加",
      "【スポーン】敵の出現システムを従来の座標指定から、敵母艦のカタパルトからの射出シークエンスに変更（クールダウン3秒）",
      "【スポーン】敵母艦が破壊された場合、新たな敵機のリスポーンが停止するよう仕様変更",
      "【デバッグ】5キー：経験値(EXP)を次レベルに必要な分まで即座に獲得する機能を追加",
      "【デバッグ】6キー：敵母艦の耐久力を即座に0にして破壊する機能を追加"
    ]
  },
  {
    version: "v0.3.8 (Missile Enhancements & Debug Features)",
    date: "2026-05-23",
    description: "Enhanced missile visuals, added missile explosion flares, randomized title explosions, and added a debug key.",
    details: [
      "【演出】タイトル画面背景の遠景爆発について、サイズと継続時間がランダムに変化するよう仕様を変更。",
      "【描画】ミサイルのグラフィックを白塗りの「▲＋■」を組み合わせた形状へ変更し、視認性を向上。",
      "【システム】ミサイルが敵弾に被弾した際にも撃墜されて爆発（フレア）を発生するよう仕様変更。",
      "【システム】ミサイル着弾時および撃墜時、機体爆発（フレア）の半分のサイズのフレアを発生させる機能を追加。フレア範囲内の敵には個別に設定可能なフレアダメージを与える。",
      "【デバッグ】5キーを押下することで、現在のレベルアップに必要な経験値（EXP）を即座に獲得するデバッグ機能を追加。"
    ]
  },
  {
    version: "v0.3.7 (Level Up Stock & Comm UI Update)",
    date: "2026-05-23",
    description: "Added level up stock system, comm menu, and improved boost acceleration.",
    details: [
      "【システム】レベルアップ時の割り込みUI表示を廃止し、ストック制に変更。自機下にストック数が表示され、CキーでいつでもUIを開きE/R/Fキーでアップグレードを選択可能に。",
      "【システム】ストックを保持したまま母艦へ着艦した場合、補給完了後に全てのストックを消費して全画面カードUIを連続で表示する処理を追加。",
      "【UI】Cキーによる新通信メニュー(Comm Menu)を実装。ストックなし時は移動・攻撃・退避・索敵の指示（ロールプレイ演出）が可能。",
      "【操作】エイムモード（MOUSE_AIM / SUBSPACE）の切り替えキーを C から X へ変更。",
      "【UI】資源レーダーの表示範囲を5000mに延長し、画面内に存在するアイテムも常にマーカーが表示されるよう修正。",
      "【物理】ブースト発動直後(0.2秒間)の加速度を20倍、以降は10倍へと大幅強化。またブースト中は前進キー(W)を押していなくても強制的に前進するよう仕様変更。",
      "【バグ修正】自機回転時におけるバーニアトレイルの発生座標の微細なズレ（PLAYER_SIZE_Wに基づくオフセット）を最終確認および修正。"
    ]
  },
  {
    version: "v0.3.6 (Boost System Overhaul & Resource Radar)",
    date: "2026-05-23",
    description: "Introduced boost gauge, cooldowns, resource radar, and fixed trail display bugs.",
    details: [
      "【システム】ブースト機能を大幅改修。使用直後0.2秒は加速度5倍、その後2倍となるよう調整。ゲージ制（最大80）を導入し、使い切った場合は6秒、途中で離した場合は3秒のクールダウンが発生する仕組みを実装。",
      "【UI】自機周辺のマイクロHUDを更新。現在のEXPゲージの位置にオレンジ色のブーストゲージを配置し、EXPゲージはさらに外側の円弧へ移動。",
      "【UI】資源レーダーを追加。画面外にあるアイテム（経験値、HP回復）の方向を、母艦と同じレーダーシステム上にアイテム色の小さな三角形(▲)で表示。距離2000mまで探知し、遠くなるにつれて透明度が増す仕様。",
      "【演出】タイトル画面で出撃ボタンを押した際、ブラックアウト演出が終了するまで自機が上へブーストし続けるよう変更。戦闘開始時にブラックフェードインを追加。",
      "【演出】自機の風トレイル（スリップストリーム）の色を白に変更し、中央が最も太くなるなめらかなサイン波形状（極細→太い→極細）へ改善。",
      "【バグ修正】リザルト画面からタイトルに戻った直後にトレイルが暴れる不具合を修正。",
      "【バグ修正】自機が回転した際、バーニアトレイルの発生位置がわずかにズレる不具合（ノズル計算時の基準座標の誤り）を修正。"
    ]
  },
  {
    version: "v0.3.5 (Subspace Physics & Alpha 8 Fixes)",
    date: "2026-05-23",
    description: "Adjusted physics to true Subspace Continuum drift, fixed title screen visual glitches, and improved boost fade.",
    details: [
      "【物理】機体の移動物理をAsteroids/Subspace Continuum風の「推力ベクトル純加算＋最高速度クランプ」方式へ刷新。慣性を強く残した自然なドリフト旋回が可能に",
      "【操作】ブースト(SHIFT)の挙動をパルス式からゲージ式(boostRatio)へ変更。押下中は急速にチャージされて速度上限と加速度が引き上がり、離すとゆっくり減衰（フェードアウト）する自然な操作感を実現",
      "【バランス】被弾時の修理費(Repair Cost)計算レートを従来の1/10へ大幅に引き下げ、ゲームバランスを調整",
      "【演出】タイトル画面の遠景爆発を、プレイ中のフレア爆発（3重円＋振動）と共通化し、サイズを縮小して利用するよう描画ロジックをリファクタリング",
      "【バグ修正】タイトル画面表示直後に、プレイヤー機の光跡（トレイル）が画面上端から一気に伸びてしまう初期座標の不具合を修正"
    ]
  },
  {
    version: "v0.3.4 (Dynamic Trail & Physics)",
    date: "2026-05-23",
    description: "Implemented dynamic physical trails, fixed wiper effect, and upgraded to dual wind slipstreams.",
    details: [
      "【物理】トレイル（軌跡）のパーティクルに速度ベクトルと摩擦減衰を持たせる「動的排気物理演算」を実装し、生きたプラズマの挙動を表現",
      "【描画】メイントレイルおよび風トレイルを `quadraticCurveTo` を用いた滑らかな曲線描画に変更し、セグメント毎に太さと透明度が自然に減衰するよう改修",
      "【描画】トレイルを絶対座標系で描画するよう徹底し、機体旋回時に軌跡が振り回されるワイパー現象を解消",
      "【演出】風トレイル（スリップストリーム）を機体中心の1本から両翼端からの双発に変更し、立体感を向上",
      "【バグ修正】風トレイルの透明度計算時に発生し得た変数未定義・ゼロ除算の不具合を修正"
    ]
  },
  {
    version: "v0.3.3 (Stability & Fade Transition)",
    date: "2026-05-20",
    description: "Fix Result freeze, add title player ribbon trail, implement black fade-out/wait/fade-in, and taper trails.",
    details: [
      "【バグ修正】ゲームオーバーおよびリザルト画面に移行した際、HTML上に存在しないDOM要素の非表示処理で例外が発生しフリーズしていた不具合を修正（安全な存在チェックを追加）",
      "【タイトル】タイトル画面のプレイヤー機にも、ツインリボントレイル（スラスターの光の尾）を表示するように変更。静止時も後方に流れるように処理を追加",
      "【演出】タイトル画面からゲーム画面へ遷移する際、従来の白フラッシュを黒フェードアウト（0.75秒）に変更し、さらに1秒の暗転待機時間を経てから、ゲーム画面へフェードイン（0.75秒）して開始する演出を実装",
      "【描画】リボントレイル（自機・敵機）の古い履歴（先端側）が、時間が経つにつれて徐々に細く・薄くなるようセグメント分割描画に変更（先細り仕様）",
      "【バグ修正】タイトル画面表示時に発生していたフリーズ不具合（ローカル関数のスコープ参照エラー）を修正",
      "【UI】タイトル画面で不要なHUD（レベル・HP等）、シエロ通信、バウンティ表示を非表示化",
      "【UI】操作説明（キーバインド表示）に「C:エイム切り替え」の記述を追記",
      "【演出】着艦シーケンス中および発艦カウントダウン中は自機リボントレイルを非表示とし、発艦時（打ち出し後）に点灯するよう修正",
      "【UI】リザルト画面表示時にシエロ通信や船ステータスUIが残ったままになる不具合を修正",
      "【整理】リボントレイル移行に伴い、タイトルやゲーム内に残っていた旧仕様のバーニアパーティクル描画処理を完全に削除"
    ]
  },
  {
    version: "v0.3.2 (Subspace Drift & Vector Stream)",
    date: "2026-05-20",
    description: "Implement SUBSPACE DRIFT PROTOCOL and VECTOR PATH STREAM PROTOCOL for player and enemies.",
    details: [
      "【物理】機体（自機・敵機）の移動物理を「慣性ブレンド方式」に刷新し、ドリフト（横滑り）を伴う重厚な挙動を実現",
      "【描画】リボントレイル（スラスター軌跡）を単一のベクターパス接続による一筆書き描画に最適化し、滑らかな高輝度ラインへ変更",
      "【演出】自機が一定速度を超えた際、進行方向の逆向きへ流れる「風トレイル（スリップストリーム）」が動的に生成される機能を追加",
      "【設定】各種物理パラメータ（摩擦、加速力、最高速度など）をドリフト仕様に合わせて再調整"
    ]
  },
  {
    version: "v0.3.1 (Alpha5 Logo Typography)",
    date: "2026-05-19",
    description: "Title logo typographic refinements: V scale-up and D chromatic aberration.",
    details: [
      "【演出】タイトルロゴ『VANGUARDRIFTER』の頭文字『V』を他の文字より大きく(70px)描画し、ロゴ全体の視覚的重心を強調",
      "【演出】中央の文字『D』をNeon Cyanの位置から左上・右下へ5pxずらしたOrb Magenta／Enemy Redの半透明レイヤーで重ね描きし、慣性ドリフトのアナグリフ(色収差)効果を実装",
      "【演出】V〜Rの各パーツをmeasureTextで幅を計測してleft揃えで順次描画し、文字間隔を正確に維持"
    ]
  },
  {
    version: "v0.3.0 (Outgame & UI Alpha)",
    date: "2026-05-19",
    description: "Title screen, result screen (expense invoice), canvas-based level-up UI, and full keyboard navigation.",
    details: [
      "【タイトル】タイトル画面を実装。3階層の星屑スクロール・遠景爆発フレーバー・PRESS ANY BUTTON点滅表示",
      "【タイトル】任意キー入力でSORTIE INITIATED高速明滅→ホワイトアウトフラッシュ→自機上昇Ease-In出撃演出",
      "【リザルト】経費精算UIを実装。MISSION ACCOMPLISHED / FAILED ヘッダー・明細0.5秒インターバル表示",
      "【リザルト】収入(基本報酬・撃破バウンティ・タイムボーナス)と支出(修理費・緊急回収費)を自動計算・表示",
      "【リザルト】NET PROFITを大きく表示。プラスならNeon Cyan、マイナスならEnemy Redで強調",
      "【リザルト】シエロ通信メッセージをタイプライター演出で表示(条件分岐5種)",
      "【リザルト】決済スタンプ([ SETTLED ] / [ DEBT EXECUTED ])を斜め-15度・3倍→等倍の急縮小アニメーションで押印",
      "【リザルト】スタンプ押印瞬間に画面全体シェイク演出を実装",
      "【リザルト】RETURN TO GARAGE / RETRY MISSION のキーボード＋マウスハイブリッド選択UIを実装",
      "【レベルアップ】DOM要素を廃止しCanvas描画へ完全移行。カード選択・カーソル▼浮遊・決定時ドロップアウト演出",
      "【レベルアップ】決定カードが中央吸込み・非選択カード落下・▼突き刺しパーティクル爆発演出を実装",
      "【UI】ゲーム状態管理をTITLE / PLAYING / LEVEL_UP / RESULTの4ステートマシンに整理",
      "【計測】GAME.damageTaken(累積被弾)とGAME.operationTime(プレイ時間)をリザルト計算に反映"
    ]
  },
  {
    version: "v0.2.3 (Missile Fix)",
    date: "2026-05-19",
    description: "Fixed missile explosions incorrectly triggering game over.",
    details: [
      "【バグ修正】ミサイル着弾時のspawnExplosion呼び出しでisPlayer=trueが誤って渡されており、爆発消滅のタイミングでゲームオーバー(initResultScreen)が発火する不具合を修正",
      "【バグ修正】spawnExplosion(m.x, m.y, true) → spawnExplosion(m.x, m.y, false) に変更"
    ]
  },
  {
    version: "v0.2.2 (Mothership Polish)",
    date: "2026-05-18",
    description: "Visual enhancements to the mothership to increase player attachment.",
    details: [
      "【演出】母艦の中央コアがゆっくりと明滅（鼓動）するように変更",
      "【演出】母艦の外装に居住区の窓明かりを追加し、巨大感と生活感を演出",
      "【演出】補給着艦中、機体の上に『REPAIRING & RESUPPLYING...』と進捗ゲージを表示",
      "【演出】補給中の進捗に合わせてゲージが伸びる視覚的フィードバックを追加",
      "【バグ修正】HP全快で着艦した場合はリペアゲージを表示しないよう修正"
    ]
  },
  {
    version: "v0.2.1 (Landing Guard)",
    date: "2026-05-18",
    description: "Landing area hidden during launch/targeted; landing blocked while enemies remain.",
    details: [
      "【仕様変更】ランディングエリア表示を着艦中・発艦カウントダウン中・敵ターゲット中・クリア後に非表示",
      "【仕様変更】生存敵がいる間は着艦不可に変更",
      "【通信】母艦半径200px以内に近づいた際、敵ターゲット中なら「敵機からターゲット中です！排除しないと着艦できません！」を最大5秒周期で再生",
      "【実装】GAME.landingBlockedTimerを追加し警告メッセージの連続再生を防止"
    ]
  },
  {
    version: "v0.2.0 (Resupply Loop)",
    date: "2026-05-18",
    description: "Always-available landing with HP resupply and relaunch; landing area visual added.",
    details: [
      "【仕様変更】着艦をミッション未クリア時も常時可能にする（補給着艦）",
      "【着艦】補給着艦時：HP全快後カウントダウン再発艦シーケンスを開始",
      "【通信】ミッション未クリア着艦時「着艦シーケンス開始します」（先端ロック時）",
      "【通信】ガレージ固定後、HP最大でない場合「お疲れ様でした。補給は任せてください」",
      "【通信】ガレージ固定後、HP最大の場合「あれ？何しに戻ってきたんですか？ さあ、お仕事が待ってますよ！」",
      "【通信】ミッションクリア着艦時は従来通り（変更なし）",
      "【UI】ランディングエリアを薄いグリーンの半透明円で表示、エリア上部にLANDING AREAラベル",
      "【デバッグ】4キーリセット時にlandingForClearも初期化するよう追加"
    ]
  },
  {
    version: "v0.1.9 (Landing Fix)",
    date: "2026-05-18",
    description: "Fixed landing sequence never triggering due to coordinate system mismatch.",
    details: [
      "【バグ修正】母艦描画の ctx.rotate(-π/2) を考慮せずローカル座標をワールド座標として使用していた根本バグを修正",
      "【バグ修正】getCatapultSpec() をワールド座標(tipX:0,tipY:-230, rootX:0,rootY:-80)を返すように変更",
      "【バグ修正】着艦トリガー判定を正しいワールド座標 Math.hypot(player.x-cat.tipX, player.y-cat.tipY)<=50 に修正",
      "【バグ修正】着艦シーケンス各フェーズの目標座標を新しい cat.tipY/rootY に統一",
      "【デバッグ】4キー（ミッション強制クリア）でisLandingSequence/landingPhase/isResultTriggeredもリセットするよう修正"
    ]
  },
  {
    version: "v0.1.8 (Mission Force Clear)",
    date: "2026-05-18",
    description: "Added a mission force-clear debug key for landing checks.",
    details: [
      "【デバッグ】4キーでミッション条件を強制的に満たし、着艦チェックへ入りやすく変更",
      "【UI】デバッグキーバインド表示に4:ミッション強制クリアを追加"
    ]
  },
  {
    version: "v0.1.7 (Item & Debug Pass)",
    date: "2026-05-18",
    description: "Added heal and big EXP drops plus developer debug actions.",
    details: [
      "【アイテム】HP回復アイテムを追加（EXPと同系統の見た目、オレンジ色、20%で同時出現）",
      "【アイテム】極大EXPを追加（EXPの1.5倍サイズ、黄色い十字星＋白→紫の縁取り）",
      "【アイテム】極大EXPの獲得量を通常EXPの10倍に設定し、倍率をコンフィグ化",
      "【デバッグ】1キーでHP全快、2キーで敵リスポーンON/OFF、3キーで敵即時全滅を追加",
      "【UI】左下のキーバインド表示を更新"
    ]
  },
  {
    version: "v0.1.6 (Docking Feedback)",
    date: "2026-05-18",
    description: "Refined docking feedback timing and stopped inertial star scrolling on death.",
    details: [
      "【着艦】カタパルト先端50px以内で操作を奪う挙動を維持しつつ、先端到達時に着艦メッセージを出すよう調整",
      "【着艦】先端到達時にバーニア噴出光（トレイル）を消去し、着陸したように見せる演出を追加",
      "【着艦】先端→根本→機首反転→3秒待機→MISSION CLEAR の流れを維持",
      "【死亡】ゲームオーバー時に星背景の慣性スクロールを停止するよう修正"
    ]
  },
  {
    version: "v0.1.5 (Alpha 3 Input Pass)",
    date: "2026-05-18",
    description: "Updated the default flight controls, rebound missile fire, and added a visible keybind panel.",
    details: [
      "【操作】後退推力を前進推力の半分に調整",
      "【操作】ミサイル発射をCTRLからEキーへ変更",
      "【操作】バルカン入力を右クリックまたはSpaceに変更",
      "【UI】画面左下にキーバインド表示を追加し、白・左詰め・18pxで表示",
      "【UI】キーバインド文言をW/S,A/D,RClick&Space,E,Shiftで統一"
    ]
  },
  {
    version: "v0.1.4 (Alpha 3 Docking Layout)",
    date: "2026-05-18",
    description: "Adjusted the docking lock area, hid radar UI during landing, and tightened HUD/comms alignment.",
    details: [
      "【操作】デフォルト操作モードをSUBSPACEへ変更",
      "【操作】サブスペースモードではマウス追従を使わず、A/D入力のみで旋回するよう変更",
      "【着艦】カタパルト先端半径50pxで着艦シーケンスを開始するよう拡大",
      "【着艦】着艦シーケンス中はレーダー表示類を非表示に変更",
      "【通信】Cieloメッセージをさらに10px上へ移動",
      "【HUD】レーダー下に飛行速度を表示し、左ステータス表示のカテゴリ/Lv/value揃えを微調整"
    ]
  },
  {
    version: "v0.1.3 (Alpha 3 Docking Polish)",
    date: "2026-05-18",
    description: "Refined the docking sequence, moved comms near the radar, and exposed current flight speed in the HUD.",
    details: [
      "【着艦】カタパルト先端で操作を奪う着艦シーケンスを追加",
      "【着艦】先端着陸→根本まで牽引→機首上向き回転→3秒待機→MISSION CLEAR の段階式に改良",
      "【通信】Cieloメッセージの表示位置を索敵レーダー上部へ移動",
      "【HUD】レーダー下に現在の飛行速度（km/s）を表示する項目を追加",
      "【整備】着艦開始時点で帰還完了扱いとなるようフラグを整理"
    ]
  },
  {
    version: "v0.1.2 (Alpha 3 Control Mode)",
    date: "2026-05-18",
    description: "Added control mode switching, handling scaling, and HUD exposure for flight feel validation.",
    details: [
      "【操作】`C`キーで`MOUSE_AIM` / `SUBSPACE`をリアルタイム切り替え可能に変更",
      "【操作】`HANDLING`ステータスを追加し、旋回速度をアップグレード連動に変更",
      "【操作】マウスエイム時は砲塔追従、サブスペース時は機首固定の射撃モデルに対応",
      "【操作】サブスペースモード中はA/Dによる手動旋回をマウス追従より優先する競合解決を実装",
      "【HUD】右下ステータスパネルに`HANDLING`値と現在の`CTRL MODE`を表示するよう更新",
      "【整備】アルファ焦点仕様を追加し、コア体験の判定基準を明文化"
    ]
  },
  {
    version: "v0.1.1 (Alpha 2 Polish)",
    date: "2026-05-18",
    description: "Visual upgrades for bullets and engine trails, and dynamic boost effects.",
    details: [
      "【バルカン】弾丸の描画を静的円形スプライトから、進行方向に同期した輝く細長い楕円レーザー（白芯＋光彩コア構造）へ刷新",
      "【スラスター】古い円形煙パーティクルを完全廃止し、連続する美しい「リボントレイル（先細りの光の尾）」を実装",
      "【ツインバーニア】自機のスラスターをF-14トムキャット風の「シアンブルーの2本リボン」へ拡張。敵機は性格カラーの1本ショートリボンに",
      "【ブースター】ブーストおよびGO!発艦時に、リボントレイルが瞬時に「太さ2倍の大出力プラズマビーム」へ動的膨張するパルス演出を搭載。キー離脱時は慣性で切り離されて消滅するリアルな挙動を再現",
      "【バランス】自機の移動速度やHP上限の調整、敵のタイプ出現比率のチューニングを実施",
      "【演出】発艦・着艦時の演出追加・調整",
      "【UI】レーダーに母艦方向・距離を追加",
      "【UI】EXPアイテムサイズを2倍に変更",
      "【UI】プレイヤー座標の表示追加"
    ]
  },
  {
    version: "v0.1.0 (Alpha 2)",
    date: "2026-05-18",
    description: "Alpha 2 major update. Added Mothership, Missiles, Booster, and Cielo Navigation.",
    details: [
      "【拠点】マップ中心にAnchor Garage(母艦)を追加。敵を10体倒して帰還でクリア",
      "【操作】機体移動(WASD)と砲塔(マウス)を分離、ツインスティック操作に",
      "【アクション】SHIFTでブースター(熱量消費・慣性抑制)、CTRLで誘導ミサイル発射を追加",
      "【UI】Cielo(シエロ)によるナビゲーション通信演出を追加",
      "【UI】マイクロHUDを(▲)形状に制限し、HP/ヒートを右側、EXPを左側に配置",
      "【UI】クレジット(BOUNTY)表示を左上に追加",
      "【UI】レーダーに砲塔向き(TARGET)アイコンを追加"
    ]
  },
  {
    version: "v0.0.11",
    date: "2026-05-17",
    changes: [
      "UIとHUDの大幅な改修",
      "- 敵の下部に表示されるゲージを2段（上段HP・下段ヒート）に改修し、HPが20%以下の場合は赤色になる仕様を追加",
      "- 自機周囲のマイクロHUDを刷新。右側半円にHP（外側）とヒート（内側）を重ねて配置し、左側半円にEXP（水色）を配置",
      "- 画面右下に自機の各種ステータス（船体・バルカン・スラスター・シールド・母艦など）をリスト表示する専用UIパネルを追加"
    ]
  },
  {
    version: "v0.0.10",
    date: "2026-05-17",
    changes: [
      "レーダーおよびエフェクトのさらなる拡張",
      "- 敵レーダーマーカーの先に敵までの距離を表示（10px=10m換算、999m以上はkm表示に切替）",
      "- 距離のテキストはレーダーの回転に追従せず常に水平を保つように修正",
      "- レーダーの半径を150pxに拡大し、パラメータ化（RADAR_RADIUS）",
      "- スラスター噴射炎のサイズを従来の0.5倍（半径3px）に縮小",
      "- スラスター噴射炎の色をパラメータ化し、自機は白（#fff）、敵機はグレー（#888）に変更"
    ]
  },
  {
    version: "v0.0.9",
    date: "2026-05-17",
    changes: [
      "レーダーUIとエフェクトの改修",
      "- プレイヤー中心半径100pxの真円レーダー（方位を示すヒゲ付き）を追加",
      "- 画面外敵マーカーを画面端からレーダー円の外周を回るように変更",
      "- スラスター噴射炎のパラメータ化（速度・ランダム拡散度）と、進行方向真逆への直線的噴射（ランダムなし）に変更",
      "- デブリの軌跡をパーティクルから、拡大しながらフェードアウトする灰色の半透明な煙に変更"
    ]
  },
  {
    version: "v0.0.8",
    date: "2026-05-17",
    changes: [
      "画面視認性と演出の向上",
      "- 画面外にいる敵の方向と天地を示すインジケーター（赤い▲とベースライン＿）を画面端に表示する機能を実装",
      "- 自機および敵機のスラスター噴射炎（パーティクル）の寿命（DECAY）を調整し、軌跡が従来の5倍長く残るように変更"
    ]
  },
  {
    version: "v0.0.7",
    date: "2026-05-17",
    changes: [
      "爆発演出のアニメ的強化",
      "- 爆発の持続時間を約3秒（180フレーム）に延長",
      "- 爆発が最大サイズを維持している間、ランダムに激しく振動（ビリビリ震える）する「ガンダム風」のアニメーションを実装",
      "- 長時間化に伴い、連続ヒットを防ぐため爆発ダメージの発生タイミングを初期の膨張フェーズのみに限定",
      "- 爆発終了時にフッと消滅（急激にフェードアウト・縮小）する処理を追加",
      "- 長時間滞留する爆発を「危険オブジェ」として定義し、敵AIが自律的に避けてドッグファイトを行うように改修"
    ]
  },
  {
    version: "v0.0.6",
    date: "2026-05-17",
    changes: [
      "物理演算と高度なAIの実装",
      "- 機体（自機・敵機）の物理衝突判定と、相互ノックバック（反動）の実装",
      "- 衝突時の相対速度に比例したダメージシステムの追加",
      "- 敵同士の物理衝突・バウンド・ダメージの実装",
      "- 有害デブリと機体の物理衝突・跳ね返りと、バウンドによるデブリ耐久値減少の実装",
      "- 進行方向の障害物（他の敵・プレイヤー・有害デブリ）を未来予測して避ける、自律操舵AI（Obstacle Avoidance）の実装"
    ]
  },
  {
    version: "v0.0.5",
    date: "2026-05-17",
    changes: [
      "デブリ演出の洗練",
      "- 撃破時の有害デブリ発生数をコンフィグ化（最小3〜最大4）",
      "- 有害デブリの進行方向がわかるように、軌跡（煙パーティクル）を描画する処理を追加",
      "- 通常被弾時の無害な火花が、有害デブリと同じサイズ・寿命になっていた不具合を修正（極小サイズ・0.5秒で消滅するように分離）"
    ]
  },
  {
    version: "v0.0.4",
    date: "2026-05-17",
    changes: [
      "爆発と連鎖システムの実装",
      "- 敵機および自機の撃破時に、ダメージを伴う爆発演出（赤いフラッシュと重なる円）を追加",
      "- 撃破時に元の慣性を引き継いで飛び散る「有害デブリ」の実装",
      "- 爆発と有害デブリのダメージが敵味方問わず発生する仕様を追加し、連鎖爆発（誘爆）を可能にした"
    ]
  },
  {
    version: "v0.0.3",
    date: "2026-05-17",
    changes: [
      "敵AIと挙動の大幅改修",
      "- 敵の移動を「慣性・スラスター移動」に変更",
      "- 敵が自機を狙って射撃を行うようにし、射撃間隔と角度に揺らぎを持たせる処理を追加",
      "- 敵個体ごとにヒートゲージを持たせるように変更",
      "- 敵の出現最大数を設定（初期値：最大10体）",
      "- 敵の性格パターンを3種類追加し、機体色を分別（RAMMER/肉薄: 濃いグレー、DOGFIGHTER/すれ違い: ブルー、SNIPER/遠距離: パープル）"
    ]
  },
  {
    version: "v0.0.2",
    date: "2026-05-17",
    changes: [
      "コアアクションの強化",
      "- バルカン砲の自動エイム（オートエイム）化",
      "- 射撃によるヒートゲージの蓄積と、オーバーヒートの実装",
      "- 自機周辺にHPとヒートゲージを表示するマイクロHUDの実装",
      "- 被弾時および敵への命中時に、画面フラッシュと破片（パーティクル）が飛び散る演出を追加",
      "- EXPジェムの回収に加速度をつけ、逃げ続けても必ず回収できるように改善"
    ]
  },
  {
    version: "v0.0.1",
    date: "2026-05-17",
    changes: [
      "アルファ版プロトタイプ作成",
      "- 自機（ヴァンガードリフター）の慣性移動、スラスター推力、摩擦係数の基本実装",
      "- 画面多重スクロール（背景の星屑）の実装",
      "- 敵のスポーンと基本追従AI、および経験値（EXPジェム）のドロップ・レベルアップの基本ループ構築"
    ]
  }
];

// export default changelog;
