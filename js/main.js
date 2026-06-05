/**
 * VANGUARDRIFTER - v0.5.00 Implementation
 */

// ==========================================
// 3 Cielo 通信システム
// ==========================================
// import Communication from "./js/classes/communication.js";
const comm = new Communication();

// ==========================================
// 4. ゲーム状態・エンティティ定義
// ==========================================
const GAME = {
    state: 'TITLE', // 最初は 'TITLE'
    controlMode: 'SUBSPACE', // MOUSE_AIM, SUBSPACE
    debugEnemyRespawnEnabled: true,
    width: window.innerWidth,
    height: window.innerHeight,
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false, // 左クリック状態
    isPlayerDying: false,
    credits: 0,
    displayCredits: 0,
    killCount: 0,
    isMissionClear: false,
    damageFlashTimer: 0, // 画面の赤フラッシュ用タイマー
    isResultTriggered: false, // リザルト画面のトリガー用フラグ
    quotaReminderTimer: 0, // ノルマ達成通知用タイマー
    launchSequence: false, // タイトルから出撃する時に true にする
    launchTimer: 0,       // 発進カウントダウン用タイマー
    landingBlockedTimer: 0, // 着艦不可警告の連続再生防止タイマー

    // --- 新規追加パラメータ（20260518_alpha4） ---
    damageTaken: 0, // 累積被弾ダメージ
    operationTime: 0, // プレイ時間（秒数・カウント）
    operationFrameCount: 0, // プレイ時間のフレーム数

    // タイトル画面演出用
    titleShipY: 0,
    titleShipVy: 0,
    titleLaunchTimer: 0,
    fadeAlpha: 0,
    titleSortieTextTimer: 0,
    titleLeftTrailHistory: [],
    titleRightTrailHistory: [],

    // レベルアップ画面用
    levelUpSelectedIndex: 0,
    levelUpCursorX: 0,
    levelUpCursorHoverTimer: 0,
    levelUpState: 'CHOOSING', // 'CHOOSING' or 'DECIDED'
    levelUpDecidedTimer: 0,
    levelUpDecidedIndex: 0,
    levelUpCards: [],
    levelUpNonSelectedY: 0,

    // リザルト画面用
    resultTimer: 0,
    resultShowIndex: 0, // 現在表示中の明細行
    resultSelection: 0, // 0: RETURN TO GARAGE, 1: RETRY MISSION
    resultSelectionBlink: 0,
    resultStampScale: 3,
    resultStampTimer: 0,
    resultShakeTimer: 0,
    resultSieloText: "",
    resultSieloShowCharCount: 0,
    resultSieloTimer: 0,
    resultParams: null
};

// keys and mouse are now managed by InputManager

// ゲーム初期化関数
function resetGame() {
    initGameState(GAME);
    initPlayer(player, playerStats);
    initEntities(entities);
    initMothership(entities, CONFIG);
    initUI();

    comm.play("ミッションは敵撃破10機！あるいは敵母艦の撃破！いってらっしゃい傭兵さん！");
}

// シーン管理オブジェクト
const SceneManager = {
    title: new TitleScene(),
    result: new ResultScene()
};

function initResultScreen(isClear) {
    GAME.state = 'RESULT';
    GAME.isResultTriggered = true;

    const score = GAME.killCount;
    const damageTaken = Math.floor(GAME.damageTaken);
    const operationTime = GAME.operationTime;

    // 経費精算計算
    const baseReward = isClear ? 5000 : 0;
    const bounty = score * 100;
    const timeBonus = isClear ? Math.max(0, 180 - operationTime) * 10 : 0; // 180秒以内なら秒あたり10C

    const revenue = baseReward + bounty + timeBonus;

    const repairCost = damageTaken * 1;
    const emergencyFee = !isClear ? Math.floor(revenue * 0.3) : 0; // 撃墜・途中撤退時は総収入の30%

    const expenses = repairCost + emergencyFee;
    const netProfit = revenue - expenses;

    // 累積クレジットへの反映
    GAME.credits += netProfit;

    // シエロの通信傍受テキスト確定
    let msg = "";
    if (isClear) {
        if (damageTaken === 0) {
            if (operationTime >= 120) {
                msg = "長期戦、お疲れ様です！ 無傷なんてさすがですねー！";
            } else {
                msg = "お疲れ様です。今回は修理費ゼロ、完璧な仕事ですね！";
            }
        } else {
            if (operationTime >= 120 && damageTaken >= 150) {
                msg = "傭兵さん、残業しすぎです！ 待つ方の身にもなってください。修理費はいただきますからね！";
            } else {
                msg = "帰還お疲れ様です！ 機体の修理はしておくので、任せてください。";
            }
        }
    } else {
        if (operationTime <= 30 && netProfit < 0) {
            msg = "……派手にやられましたね。これでは今月は赤字ですよ？ 次は頑張りましょうね！";
        } else {
            msg = "傭兵さん、生きててよかったです！ でも修理費で赤字かも……次は気をつけてくださいね！";
        }
    }

    GAME.resultParams = {
        isClear: isClear,
        score: score,
        damageTaken: damageTaken,
        operationTime: operationTime,
        baseReward: baseReward,
        bounty: bounty,
        timeBonus: timeBonus,
        revenue: revenue,
        repairCost: repairCost,
        emergencyFee: emergencyFee,
        expenses: expenses,
        netProfit: netProfit
    };

    GAME.resultTimer = 0;
    GAME.resultShowIndex = 0;
    GAME.resultStampScale = 3.0;
    GAME.resultStampTimer = 0;
    GAME.resultShakeTimer = 0;

    GAME.resultSieloText = msg;
    GAME.resultSieloShowCharCount = 0;
    GAME.resultSieloTimer = 0;
    GAME.resultSelection = 0;
    GAME.resultSelectionBlink = 0;


    const creditsElem = document.getElementById('credits-panel');
    if (creditsElem) creditsElem.style.display = 'none';
    const cieloElem = document.getElementById('cielo-comm');
    if (cieloElem) cieloElem.style.display = 'none';
    const statsElem = document.getElementById('stats-panel');
    if (statsElem) statsElem.style.display = 'none';
    const countdownElem = document.getElementById('countdown-overlay');
    if (countdownElem) countdownElem.style.display = 'none';
}

// 入力イベント
window.addEventListener("keydown", e => {
    if (GAME.state === "TITLE") return handleTitleInput(e, GAME, player);
    if (GAME.state === "RESULT") return handleResultInput(e, GAME, player);
    if (GAME.state === "LEVEL_UP") return handleLevelUpInput(e, GAME, player);
    if (GAME.commState && GAME.commState !== "INACTIVE") return handleCommInput(e, GAME, player);
    return handlePlayingInput(e, GAME, player, entities);
});
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    GAME.width = canvas.width;
    GAME.height = canvas.height;
});

// ==========================================
// 5 Ship / PlayerShip / EnemyShip クラス定義
// ==========================================

/**
 * 基底クラス: Ship
 * 自機（PlayerShip）と敵機（EnemyShip）の共通プロパティを集約する。
 * ロジック（メソッド）はこのフェーズでは一切含めない。
 */
class Ship {
    constructor({ x = 0, y = 0, vx = 0, vy = 0, hp = 0, maxHp = 0 } = {}) {
        // 位置・速度
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        // 耐久値
        this.hp = hp;
        this.maxHp = maxHp;
        // ダメージフラッシュ
        this.flashTimer = 0;
        // ヒートゲージ
        this.heat = 0;
        this.isOverheated = false;
        this.overheatTimer = 0;
        // 軌跡履歴
        this.trailHistory = [];
    }

    /**
     * 共通物理演算。
     * 呼び出し前に推力・反動等の vx/vy への加算を済ませておくこと。
     * 処理順序は main.js に存在する順序を完全維持する:
     *   摩擦適用 → 速度クランプ → 座標更新
     * @param {number} maxSpeed - このフレームの最高速度上限
     */
    updatePhysics(maxSpeed) {
        // 摩擦（FRICTION）
        this.vx *= CONFIG.FRICTION;
        this.vy *= CONFIG.FRICTION;

        // 速度クランプ（最高速度の超過を防ぐ）
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // 座標更新
        this.x += this.vx;
        this.y += this.vy;
    }

    /**
     * ダメージ処理（HP減少 + フラッシュタイマー設定）
     * @param {number} amount - ダメージ量
     */
    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = CONFIG.FLASH_DURATION;
    }
}

/**
 * 派生クラス: PlayerShip
 * 自機特有のプロパティをコンストラクタで初期化する。
 * ※ hp/maxHp/heat は playerStats オブジェクトで管理されるため、
 *   Ship基底クラスのデフォルト値(0)のまま。
 */
class PlayerShip extends Ship {
    constructor() {
        super({ x: 0, y: -90, vx: 0, vy: 0 });
        // 機体・砲塔の向き
        this.bodyAngle = -Math.PI / 2;
        this.turretAngle = -Math.PI / 2;
        // 射撃関連
        this.missileCooldown = 0;
        this.fireTimer = 0;
        // 着艦シーケンス
        this.isLandingSequence = false;
        this.landingPhase = 'NONE';
        this.landingTimer = 0;
        this.landingForClear = false;
        // トレイル履歴
        this.leftTrailHistory = [];
        this.rightTrailHistory = [];
        this.leftWindTrailHistory = [];
        this.rightWindTrailHistory = [];
        // ブーストゲージ
        this.boostGauge = 80;
        this.boostActiveTimer = 0;
        this.boostCooldownTimer = 0;
        // その他
        this.needsResupplyVisual = false;
        this.prevVx = 0;
        this.prevVy = 0;
        this._hpWarningPlayed = false;
    }

    /**
     * プレイヤー更新: 操作入力 → 物理演算 → 射撃 → ミサイル
     * HUD DOM操作・星スクロール・トレイル更新・衝突判定は main.js に残す。
     * 物理演算は super.updatePhysics(currentMaxSpeed) に委譲する。
     */
    update(GAME, entities) {
        // 加速度（ACC）計算のため、現在の速度を前のフレームの速度として保存
        this.prevVx = this.vx;
        this.prevVy = this.vy;

        // --- Launch Sequence Countdown Update ---
        if (GAME.launchSequence) {
            GAME.launchTimer = (GAME.launchTimer || 0) + 1;

            if (GAME.launchTimer === 1) {
                comm.play("カタパルト接続完了！出撃システム起動！");
            }

            if (GAME.launchTimer > 240) {
                // Launch sequence complete!
                GAME.launchSequence = false;
            } else if (GAME.launchTimer > 180) {
                // GO! boost behavior:
                this.vx = 0;
                this.vy = -12; // Out of dock boost!
                this.bodyAngle = -Math.PI / 2;
                this.turretAngle = -Math.PI / 2;
            }
        }

        // --- Phase 2: 物理と操作 (Drift Physics) ---
        const canControl = !GAME.isPlayerDying && !this.isLandingSequence && !GAME.launchSequence;
        if (canControl) {
            //playerStats.handling = CONFIG.PLAYER_BASE_HANDLING + (playerStats.upgrades.handling - 1) * 0.015;
            playerStats.handling = CONFIG.PLAYER_BASE_HANDLING + (playerStats.upgrades.maneuver || 0) * 0.015;

        }

        // --- ブーストゲージ (SHIFT) ---
        if (!GAME.isPlayerDying && !this.isLandingSequence) {
            if (playerStats.autoRepairCooldown > 0) {
                playerStats.autoRepairCooldown--;
            }

            const boosterLv = playerStats.upgrades.booster || 0;
            const maxBoostGauge = 80 + (boosterLv * 20); // 増量
            const baseCooldown = 360 - (boosterLv * 30); // 使い切り時CD
            const cancelCooldown = 180 - (boosterLv * 15); // 途中解除時CD

            if (this.boostGauge === undefined) {
                this.boostGauge = maxBoostGauge;
                this.boostActiveTimer = 0;
                this.boostCooldownTimer = 0;
            }
            if (this.boostGauge > maxBoostGauge) {
                this.boostGauge = maxBoostGauge;
            }

            const isHoldingShift = (InputManager.isPressed('ShiftLeft') || InputManager.isPressed('ShiftRight')) && !this.isOverheated;
            const canBoost = this.boostGauge > 0 && this.boostCooldownTimer <= 0;
            const isBoosting = isHoldingShift && canBoost;

            if (isBoosting) {
                if (this.boostActiveTimer === 0) {
                    playerStats.heat = Math.min(CONFIG.HEAT_MAX, playerStats.heat + 20); // 使用直後に+20
                    comm.play("ブースト全開ですね！");
                } else if (this.boostActiveTimer % 5 === 0) {
                    playerStats.heat = Math.min(CONFIG.HEAT_MAX, playerStats.heat + 1); // 以後+1/5F
                }

                this.boostGauge--;
                this.boostActiveTimer++;

                if (this.boostGauge <= 0) {
                    // 使い続けた場合のクールダウン
                    this.boostCooldownTimer = baseCooldown;
                    this.boostActiveTimer = 0;
                }
            } else {
                if (this.boostActiveTimer > 0) {
                    // 途中で離した場合のクールダウン
                    this.boostCooldownTimer = cancelCooldown;
                    this.boostActiveTimer = 0;
                }

                if (this.boostCooldownTimer > 0) {
                    this.boostCooldownTimer--;
                } else if (this.boostGauge < maxBoostGauge) {
                    // クールダウン終了後に回復 (1/F)
                    this.boostGauge++;
                }
            }
        }

        if (canControl) {
            const turnLeft = InputManager.isPressed('KeyA') || InputManager.isPressed('ArrowLeft');
            const turnRight = InputManager.isPressed('KeyD') || InputManager.isPressed('ArrowRight');
            const hasManualTurn = turnLeft || turnRight;

            if (turnLeft) {
                this.bodyAngle -= playerStats.handling;
            }
            if (turnRight) {
                this.bodyAngle += playerStats.handling;
            }

            if (GAME.controlMode === 'SUBSPACE') {
                this.turretAngle = this.bodyAngle;
            } else {
                const mouse = InputManager.getMouse();
                const mouseAngle = Math.atan2(mouse.y - GAME.height / 2, mouse.x - GAME.width / 2);
                this.turretAngle = mouseAngle;
            }

            let thrust = 0;
            let moveForward = InputManager.isPressed('KeyW') || InputManager.isPressed('ArrowUp');

            // ブースト押下時に前進が押されてない場合は、押されているものとみなして前進ベクトルを追加
            if (this.boostActiveTimer > 0 && !moveForward) {
                moveForward = true;
            }

            if (moveForward) thrust += playerStats.moveSpeed;

            // ブースト時の速度と加速度の拡張係数
            let boostSpeedMult = 1.0;
            let boostAccelMult = 1.0;

            if (this.boostActiveTimer > 0) {
                boostSpeedMult = 3.0;
                if (this.boostActiveTimer <= 12) {
                    boostAccelMult = 20.0; // 発動直後0.2秒は加速度20倍
                } else {
                    boostAccelMult = 10.0; // その後は加速度10倍
                }
            }

            const currentMaxSpeed = playerStats.maxSpeed * boostSpeedMult;

            if (thrust !== 0) {
                // 現在の機体の向き（bodyAngle）へ推力ベクトルを加算（Subspace Continuum風）
                const accel = thrust * boostAccelMult * 0.12;
                this.vx += Math.cos(this.bodyAngle) * accel;
                this.vy += Math.sin(this.bodyAngle) * accel;
            }

            // 後退（Sキー）時はブレーキおよび微速後退として処理
            if (InputManager.isPressed('KeyS') || InputManager.isPressed('ArrowDown')) {
                this.vx *= 0.95; // 強いブレーキ効果
                this.vy *= 0.95;
                const reverseAccel = playerStats.moveSpeed * 0.3;
                this.vx -= Math.cos(this.bodyAngle) * reverseAccel;
                this.vy -= Math.sin(this.bodyAngle) * reverseAccel;
            }

            // タクティカル・ブレーキ (Limit Burst: maneuver >= 6)
            if (InputManager.isPressed('KeyQ') && (playerStats.upgrades.maneuver || 0) >= 6) {
                this.vx *= 0.7; // 急激な減衰
                this.vy *= 0.7;
                // ブレーキ時に火花を散らす
                if (Math.hypot(this.vx, this.vy) > 1.0 && Math.random() < 0.5) {
                    entities.particles.push(new Particle(
                        this.x + (Math.random() - 0.5) * 20,
                        this.y + (Math.random() - 0.5) * 20,
                        (Math.random() - 0.5) * 4,
                        (Math.random() - 0.5) * 4,
                        1.0, 0.05, 2 + Math.random() * 2, '#f80', 'SPARK'
                    ));
                }
            }

            // 物理演算（摩擦→速度クランプ→座標更新）を基底クラスに委譲
            super.updatePhysics(currentMaxSpeed);
        } else if (GAME.launchSequence) {
            // 発進カウントダウン中（GO! のみ移動する）
            this.x += this.vx;
            this.y += this.vy;
        } else if (this.isLandingSequence) {
            const cat = getCatapultSpec();
            const targetDown = Math.PI / 2;  // +Y方向（先端→根本）
            const targetUp = -Math.PI / 2;   // -Y方向（発進方向）
            const approachSpeed = 0.08;
            const towSpeed = 0.025;
            const rotateSpeed = 0.04;

            this.vx = 0;
            this.vy = 0;

            if (this.landingPhase === 'TIP_LAND') {
                this.x += (cat.tipX - this.x) * approachSpeed;
                this.y += (cat.tipY - this.y) * approachSpeed;
                this.bodyAngle = rotateTowards(this.bodyAngle, targetDown, 0.08);
                this.turretAngle = this.bodyAngle;

                if (Math.abs(this.x - cat.tipX) < 0.6 && Math.abs(this.y - cat.tipY) < 0.6 && Math.abs(normalizeAngle(this.bodyAngle - targetDown)) < 0.04) {
                    this.x = cat.tipX;
                    this.y = cat.tipY;
                    this.bodyAngle = targetDown;
                    this.turretAngle = targetDown;
                    this.leftTrailHistory = [];
                    this.rightTrailHistory = [];
                    if (this.landingForClear) {
                        comm.play("カタパルトロック。格納フェーズ移行。");
                    } else {
                        comm.play("着艦シーケンス開始します");
                    }
                    this.landingPhase = 'TOW_TO_ROOT';
                }
            } else if (this.landingPhase === 'TOW_TO_ROOT') {
                this.x += (cat.rootX - this.x) * towSpeed;
                this.y += (cat.rootY - this.y) * towSpeed;
                this.bodyAngle = targetDown;
                this.turretAngle = targetDown;

                if (Math.abs(this.x - cat.rootX) < 0.6 && Math.abs(this.y - cat.rootY) < 0.6) {
                    this.x = cat.rootX;
                    this.y = cat.rootY;
                    this.landingPhase = 'ROTATE_UP';
                }
            } else if (this.landingPhase === 'ROTATE_UP') {
                this.x = cat.rootX;
                this.y = cat.rootY;
                this.bodyAngle = rotateTowards(this.bodyAngle, targetUp, rotateSpeed);
                this.turretAngle = rotateTowards(this.turretAngle, targetUp, rotateSpeed);

                if (Math.abs(normalizeAngle(this.bodyAngle - targetUp)) < 0.04 && Math.abs(normalizeAngle(this.turretAngle - targetUp)) < 0.04) {
                    this.bodyAngle = targetUp;
                    this.turretAngle = targetUp;
                    if (this.landingForClear) {
                        comm.play("おかえりなさい。お疲れ様でした！");
                        this.landingPhase = 'WAIT_CLEAR';
                        this.landingTimer = 180;
                    } else {
                        // 補給着艦：HPが最大か否かでメッセージ分岐
                        if (playerStats.hp >= playerStats.maxHp) {
                            comm.play("あれ？何しに戻ってきたんですか？");
                            this.needsResupplyVisual = false;
                            this.landingTimer = 60; // 1秒で追い出し
                        } else {
                            comm.play("お疲れ様です。補給は任せてください");
                            playerStats.hp = playerStats.maxHp;
                            this.needsResupplyVisual = true;
                            this.landingTimer = 120; // 修理があるときは2秒
                        }
                        this.landingPhase = 'RESUPPLY';
                    }
                }
            } else if (this.landingPhase === 'RESUPPLY') {
                this.x = cat.rootX;
                this.y = cat.rootY;
                this.bodyAngle = targetUp;
                this.turretAngle = targetUp;
                this.landingTimer--;
                if (this.landingTimer <= 0) {
                    if ((playerStats.levelUpStock || 0) > 0) {
                        // 補給完了後、ストックがあれば全画面レベルアップへ移行
                        playerStats.levelUpStock--;
                        comm.play("溜まったエネルギーを機体に適応させます！");

                        GAME.levelUpCards = [];
                        let available = [...upgradePool].filter(u => {
                            const currentLvl = playerStats.upgrades[u.id] || 0;
                            return currentLvl < u.maxLevel;
                        });
                        for (let i = 0; i < 3 && available.length > 0; i++) {
                            const idx = Math.floor(Math.random() * available.length);
                            GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                        }

                        GAME.state = 'LEVEL_UP';
                        GAME.levelUpState = 'CHOOSING';
                        GAME.levelUpSelectedIndex = 0;
                        GAME.levelUpCursorX = (GAME.width - (260 * 3 + 40 * 2)) / 2 + 130;
                        GAME.levelUpDecidedIndex = -1;
                        GAME.levelUpDecidedTimer = 0;
                        GAME.levelUpCursorHoverTimer = 0;
                        GAME.levelUpNonSelectedY = 0;
                    } else {
                        // 補給完了＆ストックなし→再発艦カウントダウン開始
                        this.isLandingSequence = false;
                        this.landingPhase = 'NONE';
                        this.vx = 0;
                        this.vy = 0;
                        GAME.launchSequence = true;
                        GAME.launchTimer = 0;
                    }
                }
            } else if (this.landingPhase === 'WAIT_CLEAR') {
                this.x = cat.rootX;
                this.y = cat.rootY;
                this.bodyAngle = targetUp;
                this.turretAngle = targetUp;
                this.landingTimer--;
                if (this.landingTimer <= 0 && !GAME.isResultTriggered) {
                    SceneManager.result.init(true);
                }
            }
        }

        // 最も近い敵を探索（自動エイム用）
        let nearestEnemy = null;
        let minDist = Infinity;
        for (let e of entities.enemies) {
            let d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist) {
                minDist = d;
                nearestEnemy = e;
            }
        }

        // (Old particle emitter removed - now handled fully by ribbon trail)

        // --- ヒートゲージ＆自動エイム射撃ロジック ---
        // ヒート管理のため、射撃は「右クリック or スペースキー」を押している間のみ作動（死亡・着艦演出時は撃てない）
        const mouse = InputManager.getMouse();
        const isFiringInput = !GAME.isPlayerDying && !this.isLandingSequence && (InputManager.isPressed('Space') || mouse.rightDown);

        if (this.isOverheated) {
            this.overheatTimer--;
            playerStats.heat -= (CONFIG.HEAT_MAX / CONFIG.HEAT_OVERHEAT_PENALTY); // ペナルティ時間で0まで冷却
            if (this.overheatTimer <= 0) {
                playerStats.heat = 0;
                this.isOverheated = false;
            }
        } else {
            if (!isFiringInput) {
                // 射撃していない時は自然冷却
                playerStats.heat = Math.max(0, playerStats.heat - CONFIG.HEAT_COOL_RATE);
            }
        }

        if (isFiringInput && !this.isOverheated) {
            this.fireTimer++;
            if (this.fireTimer >= playerStats.fireRate) {
                this.fireTimer = 0;
                if ((playerStats.upgrades.fireRate || 0) < 6) {
                    playerStats.heat += CONFIG.HEAT_PER_SHOT;
                }

                if (playerStats.heat >= CONFIG.HEAT_MAX) {
                    playerStats.heat = CONFIG.HEAT_MAX;
                    this.isOverheated = true;
                    this.overheatTimer = CONFIG.HEAT_OVERHEAT_PENALTY;
                }

                const fireAngle = GAME.controlMode === 'SUBSPACE' ? this.bodyAngle : this.turretAngle;
                for (let i = 0; i < playerStats.bulletCount; i++) {
                    const spread = (i - (playerStats.bulletCount - 1) / 2) * CONFIG.BULLET_SPREAD_ANGLE;
                    entities.bullets.push(new Bullet(
                        this.x + Math.cos(fireAngle) * (CONFIG.PLAYER_SIZE_W / 2),
                        this.y + Math.sin(fireAngle) * (CONFIG.PLAYER_SIZE_W / 2),
                        Math.cos(fireAngle + spread) * CONFIG.BULLET_SPEED + this.vx * 0.5,
                        Math.sin(fireAngle + spread) * CONFIG.BULLET_SPEED + this.vy * 0.5,
                        CONFIG.BULLET_LIFE
                    ));
                }
            }
        } else if (!isFiringInput) {
            // 撃っていない間は次弾が即座に出るようにタイマーをリセットしておく
            this.fireTimer = playerStats.fireRate;
        }

        // --- ミサイル発射 (E) ---
        if (!GAME.isPlayerDying && !this.isLandingSequence && (!GAME.commState || GAME.commState === 'INACTIVE') && InputManager.isPressed('KeyE') && this.missileCooldown <= 0 && !this.isOverheated) {
            this.missileCooldown = CONFIG.MISSILE_COOLDOWN;

            // ロックオン処理 (前方90度)
            let target = null;
            let minDistToM = Infinity;
            const fireAngle = GAME.controlMode === 'SUBSPACE' ? this.bodyAngle : this.turretAngle;
            entities.enemies.forEach(e => {
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.hypot(dx, dy);
                const angleToEnemy = Math.atan2(dy, dx);
                // 角度差を計算
                let diff = normalizeAngle(angleToEnemy - fireAngle);
                diff = Math.abs(diff);

                if (diff < Math.PI / 4 && dist < 1200) {
                    if (dist < minDistToM) {
                        minDistToM = dist;
                        target = e;
                    }
                }
            });

            const missileCount = playerStats.missileCount || 1;
            const spreadAngle = 0.2; // ミサイル同士の広がり角（ラジアン）
            const startOffset = -((missileCount - 1) * spreadAngle) / 2;

            const dmgMult = playerStats.missileDamageMult || 1.0;
            const speedMult = playerStats.missileSpeedMult || 1.0;
            const addRange = playerStats.missileAddRange || 0;
            const finalSpeed = CONFIG.MISSILE_SPEED * speedMult;
            const finalLife = Math.floor((1590 + addRange) / finalSpeed);

            for (let i = 0; i < missileCount; i++) {
                const currentAngle = fireAngle + startOffset + (i * spreadAngle);
                entities.missiles.push(new Missile(
                    this.x,
                    this.y,
                    this.vx + Math.cos(currentAngle) * 5,
                    this.vy + Math.sin(currentAngle) * 5,
                    currentAngle,
                    target,
                    finalLife,
                    finalSpeed,
                    CONFIG.MISSILE_TURN_RATE,
                    dmgMult
                ));
            }
            comm.play("ミサイル、いってらっしゃーい！");
        }
        if (this.missileCooldown > 0) this.missileCooldown--;
    }
}

/**
 * 派生クラス: EnemyShip
 * 敵機特有のプロパティをコンストラクタで初期化する。
 * 引数としてスポーン時のパラメータを受け取る。
 */
class EnemyShip extends Ship {
    constructor({
        x, y, vx = 0, vy = 0,
        hp, maxHp,
        personality, spdMult, turnMult, attackMult,
        fireTimer = 0, nextShootInterval = CONFIG.ENEMY_FIRE_RATE,
        isLaunching = true, launchTimer = 60
    }) {
        super({ x, y, vx, vy, hp, maxHp });
        // 性格パラメータ
        this.personality = personality;
        this.spdMult = spdMult;
        this.turnMult = turnMult;
        this.attackMult = attackMult;
        // 射撃関連
        this.fireTimer = fireTimer;
        this.nextShootInterval = nextShootInterval;
        // エイムオフセット
        this.aimOffset = 0;
        this.aimOffsetTimer = 0;
        // ドッグファイト/すれ違い用
        this.offsetX = 0;
        this.offsetY = 0;
        this.dogfightTimer = 0;
        // 機体角度（敵固有: e.angle でアクセスされるため bodyAngle とは別名）
        this.angle = 0;
        // 射出シークエンス
        this.isLaunching = isLaunching;
        this.launchTimer = launchTimer;
    }

    /**
     * 敵機更新: 射出シーケンス → AI行動決定 → 障害物回避 → 物理演算 → エイム → 射撃
     * 衝突判定・生存チェックは main.js に残す。
     * 物理演算は super.updatePhysics(maxSpd) に委譲する。
     * @param {object} player    - プレイヤー（位置・速度の参照）
     * @param {object} entities  - エンティティ群（enemies / enemyBullets / debris / explosions）
     * @param {object} GAME      - ゲーム状態（isPlayerDying 等）
     * @returns {boolean} true = 射出シーケンス中（呼び出し元で continue が必要）
     */
    update(player, entities, GAME) {
        const edx = player.x - this.x;
        const edy = player.y - this.y;
        const distToPlayer = Math.hypot(edx, edy);

        // --- 射出シークエンスの処理 ---
        if (this.isLaunching) {
            this.launchTimer--;
            if (this.launchTimer > 30) {
                // 最初はドック内で待機 (停止状態)
                this.vx = 0;
                this.vy = 0;
                this.angle = Math.PI / 2; // 下向き固定
            } else if (this.launchTimer > 0) {
                // カタパルトから射出開始 (下方向へ加速)
                this.vx = 0;
                this.vy += 0.5;
                this.angle = Math.PI / 2;
                this.x += this.vx;
                this.y += this.vy;
            } else {
                // 射出完了、AIに移行
                this.isLaunching = false;
                this.vy = 8; // 初速ボーナス
            }
            return true; // 射出中は通常のAIロジックをスキップ
        }

        // --- 1. 性格別ターゲット座標の設定 ---
        let targetX = player.x;
        let targetY = player.y;

        if (this.personality === 'RAMMER') {
            // とにかくプレイヤーに直行・体当たり
            targetX = player.x;
            targetY = player.y;
        } else if (this.personality === 'SNIPER') {
            // 一定の遠距離（約350px）を維持する
            const keepDist = 350;
            if (distToPlayer < keepDist - 50) {
                // 近すぎるので離れる方向へ加速
                targetX = this.x - (edx / distToPlayer) * 200;
                targetY = this.y - (edy / distToPlayer) * 200;
            } else if (distToPlayer > keepDist + 50) {
                // 遠すぎるので近づく
                targetX = player.x;
                targetY = player.y;
            } else {
                // 距離がちょうどいい時はプレイヤーの周りを周回移動（横滑り）
                targetX = player.x + (edy / distToPlayer) * keepDist;
                targetY = player.y - (edx / distToPlayer) * keepDist;
            }
        } else if (this.personality === 'DOGFIGHTER') {
            // すれ違いドッグファイト
            // ターゲット位置をプレイヤーから一定オフセットさせ、定期的に更新する
            if (!this.dogfightTimer || this.dogfightTimer <= 0 || distToPlayer < 100) {
                const offsetAngle = Math.random() * Math.PI * 2;
                const offsetDist = 120 + Math.random() * 120; // プレイヤーの周囲120〜240px
                this.offsetX = Math.cos(offsetAngle) * offsetDist;
                this.offsetY = Math.sin(offsetAngle) * offsetDist;
                this.dogfightTimer = 100 + Math.floor(Math.random() * 60); // 定期的に次の通過ポイントを設定
            }
            this.dogfightTimer--;

            targetX = player.x + this.offsetX;
            targetY = player.y + this.offsetY;
        }

        // --- 2. 進行方向の障害物（他の敵・プレイヤー・有害デブリ・爆発）の回避 (Obstacle Avoidance) ---
        let avoidX = 0;
        let avoidY = 0;
        const eSpeed = Math.hypot(this.vx, this.vy);

        const maxSpd = CONFIG.ENEMY_MAX_SPEED * (this.spdMult || 1.0);
        const avoidAccel = CONFIG.ENEMY_ACCEL * (this.turnMult || 1.0); // 障害物回避時の加速度として利用

        if (eSpeed > 0.2) {
            const dirX = this.vx / eSpeed;
            const dirY = this.vy / eSpeed;
            const lookAheadDist = CONFIG.ENEMY_SIZE_W * 2.8; // 約84px先を予測
            const predictX = this.x + dirX * lookAheadDist;
            const predictY = this.y + dirY * lookAheadDist;

            let mostThreatening = null;
            let minThreatDist = lookAheadDist;

            // プレイヤーを障害物として検知 (自爆型RAMMERはプレイヤーを避けない)
            if (!GAME.isPlayerDying && this.personality !== 'RAMMER') {
                const distToPlayer = Math.hypot(player.x - predictX, player.y - predictY);
                if (distToPlayer < CONFIG.ENEMY_SIZE_W * 1.5) {
                    mostThreatening = player;
                    minThreatDist = distToPlayer;
                }
            }

            // 他の敵機を障害物として検知
            entities.enemies.forEach(other => {
                if (other === this) return;
                const distToOther = Math.hypot(other.x - predictX, other.y - predictY);
                if (distToOther < CONFIG.ENEMY_SIZE_W * 1.3) {
                    if (distToOther < minThreatDist) {
                        mostThreatening = other;
                        minThreatDist = distToOther;
                    }
                }
            });

            // 有害デブリを障害物として検知
            entities.debris.forEach(d => {
                if (!d.harmful) return; // 無害な被弾火花は避けない
                const distToDebris = Math.hypot(d.x - predictX, d.y - predictY);
                if (distToDebris < d.size / 2 + CONFIG.ENEMY_SIZE_W * 1.3) {
                    if (distToDebris < minThreatDist) {
                        mostThreatening = d;
                        minThreatDist = distToDebris;
                    }
                }
            });

            // 爆発を危険オブジェとして検知
            entities.explosions.forEach(exp => {
                const distToExplosion = Math.hypot(exp.x - predictX, exp.y - predictY);
                // 爆発の現在半径を取得（事前にupdate計算済みのcurrentScaleを利用）
                const currentRadius = exp.maxRadius * (exp.currentScale || 1.0);

                if (distToExplosion < currentRadius + CONFIG.ENEMY_SIZE_W * 1.5) {
                    // 爆発は他より脅威度が高い（距離を小さく見積もり、優先的に回避させる）
                    const effectiveDist = distToExplosion * 0.4;
                    if (effectiveDist < minThreatDist) {
                        mostThreatening = exp;
                        minThreatDist = effectiveDist;
                    }
                }
            });

            // 回避ステアリング力の計算
            if (mostThreatening) {
                const relX = mostThreatening.x - this.x;
                const relY = mostThreatening.y - this.y;
                const crossProduct = dirX * relY - dirY * relX;

                // 左右に避ける直交ベクトルを生成 (外積の符号と逆向きに操舵)
                const steerSide = crossProduct > 0 ? -1 : 1;
                const steerX = -dirY * steerSide;
                const steerY = dirX * steerSide;

                // 障害物に近づくほど強い回避力を適用
                const avoidForce = (1.0 - minThreatDist / lookAheadDist) * avoidAccel * 2.5;
                avoidX = steerX * avoidForce;
                avoidY = steerY * avoidForce;
            }
        }

        // --- 3. 移動角度と慣性移動 (サブスペース慣性ドリフト推進) ---
        const moveAngle = Math.atan2(targetY - this.y, targetX - this.x);

        // 障害物回避（avoidX, avoidY）のステアリング力を加味した理想の進行ベクトルを計算
        const targetVx = Math.cos(moveAngle) * maxSpd + avoidX;
        const targetVy = Math.sin(moveAngle) * maxSpd + avoidY;

        // 目標への進行角度
        const driveAngle = Math.atan2(targetVy, targetVx);

        // 加速度係数
        const accelForce = CONFIG.ENEMY_ACCEL * (this.spdMult || 1.0);

        // ベクトルへの直接加算による慣性駆動
        this.vx += Math.cos(driveAngle) * accelForce;
        this.vy += Math.sin(driveAngle) * accelForce;

        // 物理演算（摩擦→速度クランプ→座標更新）を基底クラスに委譲
        super.updatePhysics(maxSpd);

        // --- 3. 機体の向き（エイム）と揺らぎの適用 ---
        // 照準角度に数秒ごとに変わる微小な揺らぎ（aimOffset）を加え、射撃が単一線上に重ならないようにする
        if (!this.aimOffsetTimer || this.aimOffsetTimer <= 0) {
            this.aimOffset = (Math.random() - 0.5) * 0.35; // 約±10度以内の揺らぎ
            this.aimOffsetTimer = 30 + Math.floor(Math.random() * 45);
        }
        this.aimOffsetTimer--;

        const targetAimAngle = Math.atan2(edy, edx) + this.aimOffset;
        const eHandling = CONFIG.ENEMY_HANDLING * (this.turnMult || 1.0);
        this.angle = rotateTowards(this.angle, targetAimAngle, eHandling);


        // --- 4. 射撃処理とヒートゲージ管理（揺らぎを持たせる） ---
        if (this.isOverheated) {
            this.overheatTimer--;
            this.heat -= (CONFIG.HEAT_MAX / CONFIG.HEAT_OVERHEAT_PENALTY);
            if (this.overheatTimer <= 0) {
                this.heat = 0;
                this.isOverheated = false;
            }
        } else {
            // プレイヤーが生きており、かつ射程内にいる場合のみ射撃
            if (!GAME.isPlayerDying && distToPlayer < 800) {
                this.fireTimer++;
                // 揺らいだ射撃間隔(nextShootInterval)に達したか判定
                if (this.fireTimer >= this.nextShootInterval) {
                    this.fireTimer = 0;
                    this.heat += CONFIG.HEAT_PER_SHOT;

                    // 次回の射撃間隔をランダムに揺らす（ENEMY_FIRE_RATEの75%〜125%）
                    this.nextShootInterval = CONFIG.ENEMY_FIRE_RATE * (0.75 + Math.random() * 0.5);

                    if (this.heat >= CONFIG.HEAT_MAX) {
                        this.heat = CONFIG.HEAT_MAX;
                        this.isOverheated = true;
                        this.overheatTimer = CONFIG.HEAT_OVERHEAT_PENALTY;
                    }

                    // 敵の弾を発射（照準の揺らぎを反映したthis.angleを使用）
                    entities.enemyBullets.push(new EnemyBullet(
                        this.x + Math.cos(this.angle) * (CONFIG.ENEMY_SIZE_W / 2),
                        this.y + Math.sin(this.angle) * (CONFIG.ENEMY_SIZE_W / 2),
                        Math.cos(this.angle) * CONFIG.ENEMY_BULLET_SPEED + this.vx * 0.5,
                        Math.sin(this.angle) * CONFIG.ENEMY_BULLET_SPEED + this.vy * 0.5,
                        CONFIG.BULLET_LIFE,
                        CONFIG.ENEMY_BULLET_DAMAGE * (this.attackMult || 1.0)
                    ));
                }
            } else {
                this.heat = Math.max(0, this.heat - CONFIG.HEAT_COOL_RATE);
            }
        }

        return false; // 射出シーケンス中ではない
    }
}

const player = new PlayerShip();



const entities = {
    enemies: [],
    bullets: [],
    enemyBullets: [],
    particles: [], // スラスターの軌跡や爆発用
    gems: [],      // 経験値ジェム
    missiles: [],  // プレイヤーのミサイル
    debris: [],    // 破片
    explosions: [], // 爆発
};

// Phase 3: 多重スクロール星背景 (Parallax Starfield)
const stars = [];
CONFIG.STAR_LAYERS.forEach(layer => {
    for (let i = 0; i < layer.count; i++) {
        stars.push({ x: Math.random() * GAME.width, y: Math.random() * GAME.height, layer: layer });
    }
});

// パーティクル（破片）生成関数 (通常被弾用・当たり判定なし)
function spawnDebris(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * CONFIG.DEBRIS_SPEED_MULT + 1.0;
        entities.debris.push(new Debris(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            2 + Math.random() * 2,
            1.0,
            1.0 / 30,
            false
        ));
    }
}

// 有害な破片の生成関数（爆破時に元の機体の慣性を引き継いで飛ぶ・当たり判定あり）
function spawnDeathDebris(x, y, color, baseVx, baseVy) {
    // 数は設定値（DEBRIS_COUNT_MIN〜DEBRIS_COUNT_MAX）のランダム
    const count = CONFIG.DEBRIS_COUNT_MIN + Math.floor(Math.random() * (CONFIG.DEBRIS_COUNT_MAX - CONFIG.DEBRIS_COUNT_MIN + 1));
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * CONFIG.DEBRIS_SPEED_MULT;

        // デブリのサイズは自機サイズ（CONFIG.PLAYER_SIZE_W = 30）の 1/2 〜 1/3
        // すなわち、10px 〜 15px
        const size = CONFIG.PLAYER_SIZE_W / 3 + Math.random() * (CONFIG.PLAYER_SIZE_W / 2 - CONFIG.PLAYER_SIZE_W / 3);

        entities.debris.push(new Debris(
            x, y,
            baseVx * 0.5 + Math.cos(angle) * speed,
            baseVy * 0.5 + Math.sin(angle) * speed,
            color,
            size,
            1.0,
            1.0 / CONFIG.DEBRIS_LIFE,
            true
        ));
    }
}

// 爆発エフェクトの生成関数（敵味方にダメージを与える爆風、またはタイトル用演出）
function spawnExplosion(x, y, isPlayer = false, isFlavor = false, sizeMultiplier = 1.0, durationMultiplier = 1.0, isMissileFlare = false, damageMultiplier = 1.0) {
    let maxRadius = CONFIG.EXPLOSION_RADIUS * sizeMultiplier;
    if (isFlavor) maxRadius *= 0.4;

    let duration = Math.floor(CONFIG.EXPLOSION_DURATION * durationMultiplier);

    // フレア内の円配置用ランダムベクトルとオフセット（中心からズレる割合）
    const angle = Math.random() * Math.PI * 2;
    // 中円は半径が 0.75 なので、最大ズレ量は 0.25
    const offsetMid = Math.random() * 0.25;
    // 小円は半径が 0.5 なので、最大ズレ量は 0.5
    const offsetSmall = Math.random() * 0.5;

    entities.explosions.push(new Explosion(
        x, y, maxRadius, duration, duration,
        new Set(), // 重複ダメージ防止用
        isPlayer, isFlavor, isMissileFlare, damageMultiplier,
        angle, offsetMid, offsetSmall
    ));
}

function clearAllEnemiesInstantly() {
    for (let i = entities.enemies.length - 1; i >= 0; i--) {
        entities.enemies[i].hp = 0;
    }
    entities.enemyBullets.length = 0;
    GAME.killCount = Math.max(GAME.killCount, CONFIG.MISSION_QUOTA);
    GAME.quotaReminderTimer = 0;
}

function getEnemyColor(e) {
    if (e.personality === 'RAMMER') return CONFIG.COLOR_ENEMY_RAMMER;
    if (e.personality === 'SNIPER') return CONFIG.COLOR_ENEMY_SNIPER;
    return CONFIG.COLOR_ENEMY_DOGFIGHTER;
}

// ==========================================
// プレイヤーダメージ一元処理 & Limit Burst (Auto Repair)
// ==========================================
function damagePlayer(amount) {
    if (GAME.isPlayerDying || playerStats.hp <= 0) return;

    playerStats.hp -= amount;
    GAME.damageTaken += amount;
    GAME.damageFlashTimer = CONFIG.FLASH_DURATION;

    // Limit Burst: Auto Repair (hull >= 6)
    if (playerStats.hp <= 0 && (playerStats.upgrades.hull || 0) >= 6) {
        if ((playerStats.autoRepairCooldown || 0) <= 0) {
            playerStats.hp = playerStats.maxHp * 0.5;
            playerStats.autoRepairCooldown = 10800; // 3 minutes at 60 FPS
            comm.play("オートリペア発動！致命傷を回避しました！", "system");
            // エフェクト生成
            for (let i = 0; i < 30; i++) {
                entities.particles.push(new Particle(
                    player.x + (Math.random() - 0.5) * 60,
                    player.y + (Math.random() - 0.5) * 60,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    1.0, 0.02, 6 + Math.random() * 6, '#0f0', 'CROSS'
                ));
            }
            return; // 死亡回避
        }
    }
}

// 自機の爆破・死亡プロセス開始
// triggerPlayerDeath was unified into eliminator.processEntityDeath

// ==========================================
// 3. ゲームループとロジック
// ==========================================
function update() {
    // プレイ中のフェードイン処理
    if (GAME.state === 'PLAYING') {
        if (GAME.fadeAlpha > 0) {
            GAME.fadeAlpha -= 1.0 / 45; // 0.75秒でフェードイン
            if (GAME.fadeAlpha < 0) GAME.fadeAlpha = 0;
        }
    }

    if (GAME.state === 'TITLE') {
        SceneManager.title.update();
        return;
    }
    if (GAME.state === 'LEVEL_UP') {
        updateLevelUpScreen();
        return;
    }
    if (GAME.state === 'RESULT') {
        SceneManager.result.update();
        return;
    }
    if (GAME.state !== 'PLAYING') return;

    // 経過時間カウントアップ
    if (!GAME.launchSequence && !player.isLandingSequence && !GAME.isPlayerDying) {
        GAME.operationFrameCount++;
        if (GAME.operationFrameCount % 60 === 0) {
            GAME.operationTime++;
        }
    }

    // プレイヤー更新（操作入力・物理演算・射撃・ミサイル）
    player.update(GAME, entities);

    // HUD and credits visibility sync
    document.getElementById('credits-panel').style.display = GAME.launchSequence ? 'none' : 'block';
    document.getElementById('stats-panel').style.display = GAME.launchSequence ? 'none' : 'block';
    document.getElementById('cielo-comm').style.display = 'block';

    // --- Phase 3: 多重スクロール背景座標更新 ---
    if (!GAME.isPlayerDying && GAME.state === 'PLAYING') {
        stars.forEach(s => {
            s.x -= player.vx * s.layer.rate;
            s.y -= player.vy * s.layer.rate;
            if (s.x < 0) s.x += GAME.width;
            if (s.x > GAME.width) s.x -= GAME.width;
            if (s.y < 0) s.y += GAME.height;
            if (s.y > GAME.height) s.y -= GAME.height;
        });
    }

    // --- エフェクトの更新 ---
    EffectManager.update(entities);

    // デブリ（破片）の更新と衝突判定
    for (let i = entities.debris.length - 1; i >= 0; i--) {
        let d = entities.debris[i];
        d.update();

        // 有害な破片が移動する際に後ろに煙パーティクル（軌跡）をはき出す
        if (d.harmful && d.life > 0.1 && Math.random() < 0.25) {
            entities.particles.push(new Particle(
                d.x,
                d.y,
                -d.vx * 0.15 + (Math.random() - 0.5) * 0.4,
                -d.vy * 0.15 + (Math.random() - 0.5) * 0.4,
                0.6,
                CONFIG.DEBRIS_SMOKE_DECAY,
                undefined,
                undefined,
                'DEBRIS_SMOKE',
                0.6,
                d.size * 1.5
            ));
        }

        // 有害な爆発破片の当たり判定
        if (d.harmful && d.life > 0.1) {
            // 自機への当たり判定
            if (!GAME.isPlayerDying) {
                const dx = player.x - d.x;
                const dy = player.y - d.y;
                const dist = Math.hypot(dx, dy);
                const minDist = d.size / 2 + CONFIG.COLLISION_ENEMY_PLAYER / 2; // 自機半径とデブリ半径の合計
                if (dist < minDist) {
                    // 重なり解消 (デブリ側を大きく押し戻し、自機は少しだけ押し戻す)
                    const overlap = minDist - dist;
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);

                    d.x -= nx * overlap * 0.8;
                    d.y -= ny * overlap * 0.8;
                    player.x += nx * overlap * 0.2;
                    player.y += ny * overlap * 0.2;

                    // 相対速度による跳ね返り
                    const rvx = player.vx - d.vx;
                    const rvy = player.vy - d.vy;
                    const velAlongNormal = rvx * nx + rvy * ny;

                    if (velAlongNormal < 0) {
                        const crashSpeed = Math.hypot(rvx, rvy);
                        const restitution = CONFIG.COLLISION_RECOIL_RESTITUTION;

                        // 反動を適用 (デブリは大きく跳ね返り、自機はわずかに衝撃を受ける)
                        const dImpulse = (1 + restitution) * crashSpeed * 0.8 + 2.0;
                        const pImpulse = (1 + restitution) * crashSpeed * 0.2 + 0.5;

                        d.vx -= dImpulse * nx;
                        d.vy -= dImpulse * ny;
                        player.vx += pImpulse * nx;
                        player.vy += pImpulse * ny;

                        // 相対速度比例のダメージを適用
                        const damage = CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT;
                        damagePlayer(damage);

                        // 被弾演出
                        GAME.damageFlashTimer = CONFIG.FLASH_DURATION;
                        spawnDebris((player.x + d.x) / 2, (player.y + d.y) / 2, '#0f0', 2);

                        // デブリは衝突により耐久力が削られ、少し寿命が減る
                        d.life -= 0.35;
                    }
                }
            }

            // 敵機への当たり判定
            let hitEnemy = false;
            for (let j = entities.enemies.length - 1; j >= 0; j--) {
                let e = entities.enemies[j];
                const dx = e.x - d.x;
                const dy = e.y - d.y;
                const dist = Math.hypot(dx, dy);
                const minDist = d.size / 2 + CONFIG.ENEMY_SIZE_W / 2;
                if (dist < minDist) {
                    // 重なり解消
                    const overlap = minDist - dist;
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);

                    d.x -= nx * overlap * 0.8;
                    d.y -= ny * overlap * 0.8;
                    e.x += nx * overlap * 0.2;
                    e.y += ny * overlap * 0.2;

                    // 相対速度による跳ね返り
                    const rvx = e.vx - d.vx;
                    const rvy = e.vy - d.vy;
                    const velAlongNormal = rvx * nx + rvy * ny;

                    if (velAlongNormal < 0) {
                        const crashSpeed = Math.hypot(rvx, rvy);
                        const restitution = CONFIG.COLLISION_RECOIL_RESTITUTION;

                        const dImpulse = (1 + restitution) * crashSpeed * 0.8 + 2.0;
                        const eImpulse = (1 + restitution) * crashSpeed * 0.2 + 0.5;

                        d.vx -= dImpulse * nx;
                        d.vy -= dImpulse * ny;
                        e.vx += eImpulse * nx;
                        e.vy += eImpulse * ny;

                        // ダメージ適用
                        const damage = CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT;
                        e.hp -= damage;

                        // 被弾演出
                        e.flashTimer = CONFIG.FLASH_DURATION;
                        let enemyColor = getEnemyColor(e);
                        spawnDebris((e.x + d.x) / 2, (e.y + d.y) / 2, enemyColor, 2);

                        // デブリ寿命消費
                        d.life -= 0.35;
                        hitEnemy = true;
                        break;
                    }
                }
            }

            if (d.life <= 0) {
                entities.debris.splice(i, 1);
                continue;
            }
        }

        if (d.life <= 0) entities.debris.splice(i, 1);
    }

    // 爆発（爆風）の更新と当たり判定
    for (let i = entities.explosions.length - 1; i >= 0; i--) {
        let exp = entities.explosions[i];
        exp.update();

        const progress = 1 - (exp.timer / exp.maxTimer);
        const currentRadius = exp.currentRadius;

        // 爆発ダメージ判定 (最初の膨張フェーズのみダメージ判定を発生させる)
        if (progress > 0.02 && progress < 0.15) {
            // 自機への爆風判定（ミサイルのフレアは自機にダメージを与えない）
            if (!exp.isMissileFlare && !GAME.isPlayerDying && !exp.damagedEntities.has('player')) {
                const distToPlayer = Math.hypot(player.x - exp.x, player.y - exp.y);
                if (distToPlayer < currentRadius + CONFIG.PLAYER_SIZE_W / 2) {
                    const damage = CONFIG.EXPLOSION_DAMAGE * (exp.damageMultiplier || 1.0);
                    damagePlayer(damage);
                    spawnDebris(player.x, player.y, '#0f0', 3);
                    exp.damagedEntities.add('player');
                }
            }

            // 敵機への爆風判定
            for (let j = entities.enemies.length - 1; j >= 0; j--) {
                let e = entities.enemies[j];
                if (!exp.damagedEntities.has(e)) {
                    const distToEnemy = Math.hypot(e.x - exp.x, e.y - exp.y);
                    if (distToEnemy < currentRadius + CONFIG.ENEMY_SIZE_W / 2) {
                        const baseDmg = exp.isMissileFlare ? CONFIG.MISSILE_FLARE_DAMAGE : CONFIG.EXPLOSION_DAMAGE;
                        e.hp -= baseDmg * (exp.damageMultiplier || 1.0);
                        e.flashTimer = CONFIG.FLASH_DURATION;

                        let enemyColor = getEnemyColor(e);
                        spawnDebris(e.x, e.y, enemyColor, 3);
                        exp.damagedEntities.add(e);

                        // HPが0以下の敵は、後段の生存チェックルーチンで一括して死亡処理される
                    }
                }
            }
        }

        if (exp.timer <= 0) {
            // 自機の爆発が完全に消えたらゲームオーバーへ移行
            if (exp.isPlayerExplosion) {
                SceneManager.result.init(false);
            }
            entities.explosions.splice(i, 1);
        }
    }

    // 自機の弾の更新
    for (let i = entities.bullets.length - 1; i >= 0; i--) {
        let b = entities.bullets[i];
        b.update();
        if (b.life <= 0) entities.bullets.splice(i, 1);
    }

    // 敵の弾の更新と自機への衝突判定
    for (let i = entities.enemyBullets.length - 1; i >= 0; i--) {
        let b = entities.enemyBullets[i];
        b.update();

        if (Math.hypot(b.x - player.x, b.y - player.y) < CONFIG.COLLISION_ENEMY_PLAYER) {
            damagePlayer(b.damage || CONFIG.ENEMY_BULLET_DAMAGE);
            entities.enemyBullets.splice(i, 1);

            // 被弾演出（赤フラッシュ＆破片）
            GAME.damageFlashTimer = CONFIG.FLASH_DURATION;
            spawnDebris(player.x, player.y, '#0f0', 3 + Math.floor(Math.random() * 2));

            if (playerStats.hp <= 0) {
                eliminator.processEntityDeath(player, 'PLAYER');
            }
            continue;
        }

        // ミサイル撃墜判定
        let hitMissile = false;
        for (let j = entities.missiles.length - 1; j >= 0; j--) {
            let m = entities.missiles[j];
            if (Math.hypot(b.x - m.x, b.y - m.y) < 10) { // ミサイルの当たり判定
                spawnExplosion(m.x, m.y, false, false, 0.5, 1.0, true, m.damageMult || 1.0);
                entities.missiles.splice(j, 1);
                hitMissile = true;
                break;
            }
        }
        if (hitMissile) {
            entities.enemyBullets.splice(i, 1);
            continue;
        }

        if (b.life <= 0) entities.enemyBullets.splice(i, 1);
    }

    // --- ミサイル (Missiles) ---
    for (let i = entities.missiles.length - 1; i >= 0; i--) {
        let m = entities.missiles[i];
        m.update(entities);

        // 敵との当たり判定
        let hit = false;
        for (let j = entities.enemies.length - 1; j >= 0; j--) {
            let e = entities.enemies[j];
            if (Math.hypot(e.x - m.x, e.y - m.y) < CONFIG.ENEMY_SIZE_W) {
                e.hp -= 30; // 命中時の直接ダメージ
                e.flashTimer = CONFIG.FLASH_DURATION;
                spawnDebris(e.x, e.y, '#fff', 3);
                hit = true;
                // HPが0以下の敵は、後段の生存チェックルーチンで死亡処理される
                break;
            }
        }
        m.life--;
        if (hit || m.life <= 0) {
            spawnExplosion(m.x, m.y, false, false, 0.5, 1.0, true, m.damageMult || 1.0);

            // Limit Burst: Multi-Missile (missileCount >= 6)
            if ((playerStats.upgrades.missile || 0) >= 6 && !m.isSubMunition) {
                for (let k = 0; k < 3; k++) {
                    let target = null;
                    if (entities.enemies.length > 0) {
                        target = entities.enemies[Math.floor(Math.random() * entities.enemies.length)];
                    } else if (entities.enemyMothership && !entities.enemyMothership.isDead) {
                        target = entities.enemyMothership;
                    }
                    entities.missiles.push(new Missile(
                        m.x, m.y,
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 10,
                        Math.random() * Math.PI * 2,
                        target,
                        CONFIG.MISSILE_LIFE * 0.4,
                        CONFIG.MISSILE_SPEED * 1.2,
                        CONFIG.MISSILE_TURN_RATE * 1.5,
                        1.0,
                        true
                    ));
                }
            }

            entities.missiles.splice(i, 1);
        }
    }

    // --- Phase 4: 敵AIと衝突判定 ---
    // 敵のスポーン制御 (母艦からの射出システム)
    if (entities.enemyMothership && !entities.enemyMothership.isDead) {
        let em = entities.enemyMothership;
        if (GAME.debugEnemyRespawnEnabled && entities.enemies.length < CONFIG.ENEMY_MAX_COUNT && player.y <= CONFIG.SPAWN_TRIGGER_Y) {
            em.launchTimer--;
            if (em.launchTimer <= 0) {
                em.launchTimer = 180; // 3秒クールダウン

                // 最初のスポーン時の通信
                if (GAME.killCount === 0 && entities.enemies.length === 0) {
                    const dx = em.x - player.x;
                    const dy = em.y - player.y;
                    let clockAngle = Math.atan2(dy, dx) - player.bodyAngle;
                    while (clockAngle < -Math.PI) clockAngle += Math.PI * 2;
                    while (clockAngle > Math.PI) clockAngle -= Math.PI * 2;
                    let oclock = Math.round((clockAngle + Math.PI / 2) / (Math.PI / 6));
                    if (oclock <= 0) oclock += 12;
                    comm.play(`${oclock}時にターゲット発見ですー！`);
                }

                // 性格の決定（CONFIGの設定確率に基づく）
                const totalChance = CONFIG.ENEMY_CHANCE_RAMMER + CONFIG.ENEMY_CHANCE_SNIPER + CONFIG.ENEMY_CHANCE_DOGFIGHTER;
                const rand = Math.random() * totalChance;
                let personality = 'DOGFIGHTER';
                let spdMult = 1.0;
                let turnMult = 1.0;
                let attackMult = 1.0;

                if (rand < CONFIG.ENEMY_CHANCE_RAMMER) {
                    personality = 'RAMMER';
                    spdMult = 0.90;
                    turnMult = 1.00;
                    attackMult = 0.50;
                } else if (rand < CONFIG.ENEMY_CHANCE_RAMMER + CONFIG.ENEMY_CHANCE_SNIPER) {
                    personality = 'SNIPER';
                    spdMult = 0.75;
                    turnMult = 0.75;
                    attackMult = 1.10;
                } else {
                    personality = 'DOGFIGHTER';
                    spdMult = 0.80;
                    turnMult = 0.90;
                    attackMult = 0.90;
                }

                const enemyMaxHp = CONFIG.ENEMY_BASE_HP + playerStats.level * CONFIG.ENEMY_HP_LEVEL_MULT;

                // カタパルト位置 (母艦中心から少しズレた位置)
                const spawnX = em.x;
                const spawnY = em.y + 80;

                entities.enemies.push(new EnemyShip({
                    x: spawnX,
                    y: spawnY,
                    hp: enemyMaxHp,
                    maxHp: enemyMaxHp,
                    fireTimer: Math.floor(Math.random() * CONFIG.ENEMY_FIRE_RATE), // 射撃タイミングをばらけさせる
                    nextShootInterval: CONFIG.ENEMY_FIRE_RATE * (0.75 + Math.random() * 0.5), // 射撃間隔の揺らぎ初期値
                    personality: personality,
                    spdMult: spdMult,
                    turnMult: turnMult,
                    attackMult: attackMult,
                    isLaunching: true,
                    launchTimer: 60 // 1秒間かけて射出 (自機は240フレームだが敵は短めに)
                }));
            }
        }
    }

    // --- 敵同士の衝突物理判定 (Enemy-Enemy Collision) ---
    for (let i = 0; i < entities.enemies.length; i++) {
        let e1 = entities.enemies[i];
        if (e1.isLaunching) continue;
        for (let j = i + 1; j < entities.enemies.length; j++) {
            let e2 = entities.enemies[j];
            if (e2.isLaunching) continue;
            const dx = e2.x - e1.x;
            const dy = e2.y - e1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = CONFIG.ENEMY_SIZE_W; // 30px
            if (dist < minDist) {
                // 重なり解消
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                e1.x -= nx * overlap * 0.5;
                e1.y -= ny * overlap * 0.5;
                e2.x += nx * overlap * 0.5;
                e2.y += ny * overlap * 0.5;

                // 相対速度による跳ね返り計算
                const rvx = e2.vx - e1.vx;
                const rvy = e2.vy - e1.vy;
                const velAlongNormal = rvx * nx + rvy * ny;

                if (velAlongNormal < 0) {
                    const crashSpeed = Math.hypot(rvx, rvy);
                    const impulse = (1 + CONFIG.COLLISION_RECOIL_RESTITUTION) * crashSpeed * 0.5 + 1.2;

                    e1.vx -= impulse * nx;
                    e1.vy -= impulse * ny;
                    e2.vx += impulse * nx;
                    e2.vy += impulse * ny;

                    // 相対速度に基づくダメージ適用
                    const damage = CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT;
                    e1.hp -= damage;
                    e2.hp -= damage;

                    e1.flashTimer = CONFIG.FLASH_DURATION;
                    e2.flashTimer = CONFIG.FLASH_DURATION;

                    // 接触火花デブリ
                    spawnDebris((e1.x + e2.x) / 2, (e1.y + e2.y) / 2, getEnemyColor(e1), 2);
                    spawnDebris((e1.x + e2.x) / 2, (e1.y + e2.y) / 2, getEnemyColor(e2), 2);
                }
            }
        }
    }

    for (let i = entities.enemies.length - 1; i >= 0; i--) {
        let e = entities.enemies[i];
        if (e.update(player, entities, GAME)) continue;

        if (e.flashTimer > 0) e.flashTimer--;

        // 自機の弾と敵機の衝突判定
        let hit = false;
        for (let j = entities.bullets.length - 1; j >= 0; j--) {
            let b = entities.bullets[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < CONFIG.COLLISION_ENEMY_BULLET) {
                e.hp -= CONFIG.BULLET_DAMAGE;

                // Limit Burst: Scatter Shot (bulletCount >= 6)
                if ((playerStats.upgrades.bulletCount || 0) >= 6 && !b.isScatter) {
                    for (let k = 0; k < 3; k++) {
                        entities.bullets.push(new Bullet(
                            b.x, b.y,
                            (Math.random() - 0.5) * 20,
                            (Math.random() - 0.5) * 20,
                            15,
                            true
                        ));
                    }
                }

                entities.bullets.splice(j, 1);

                // 攻撃ヒット演出（白フラッシュ＆破片）
                e.flashTimer = CONFIG.FLASH_DURATION;

                // 敵の性格色に合わせたデブリを生成
                let enemyColor = CONFIG.COLOR_ENEMY_DOGFIGHTER;
                if (e.personality === 'RAMMER') enemyColor = CONFIG.COLOR_ENEMY_RAMMER;
                if (e.personality === 'SNIPER') enemyColor = CONFIG.COLOR_ENEMY_SNIPER;

                spawnDebris(e.x, e.y, enemyColor, 3 + Math.floor(Math.random() * 2));

                if (e.hp <= 0) {
                    hit = true;
                    break;
                }
            }
        }
        if (hit) continue;

        // 敵機本体と自機の物理衝突判定
        if (!GAME.isPlayerDying) {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const dist = Math.hypot(dx, dy);
            const minDist = CONFIG.COLLISION_ENEMY_PLAYER; // 20px
            if (dist < minDist) {
                // 重なり解消
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                // 自機と敵機を押し離す
                player.x -= nx * overlap * 0.5;
                player.y -= ny * overlap * 0.5;
                e.x += nx * overlap * 0.5;
                e.y += ny * overlap * 0.5;

                // 相対速度による反動
                const rvx = e.vx - player.vx;
                const rvy = e.vy - player.vy;
                const velAlongNormal = rvx * nx + rvy * ny;

                if (velAlongNormal < 0) {
                    const crashSpeed = Math.hypot(rvx, rvy); // 相対速度の大きさ
                    const restitution = CONFIG.COLLISION_RECOIL_RESTITUTION;
                    const impulse = (1 + restitution) * crashSpeed * 0.5 + 2.0; // 自機衝突はより強い反動に

                    player.vx -= impulse * nx;
                    player.vy -= impulse * ny;
                    e.vx += impulse * nx;
                    e.vy += impulse * ny;

                    // ダメージ計算（相対速度比例）
                    const damage = (CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT) * (e.attackMult || 1.0);
                    damagePlayer(damage);
                    e.hp -= damage;

                    GAME.damageFlashTimer = CONFIG.FLASH_DURATION;
                    e.flashTimer = CONFIG.FLASH_DURATION;

                    let enemyColor = getEnemyColor(e);
                    spawnDebris((player.x + e.x) / 2, (player.y + e.y) / 2, '#0f0', 3);
                    spawnDebris((player.x + e.x) / 2, (player.y + e.y) / 2, enemyColor, 3);
                }
            }
        }

        // 生存チェック（衝突等でHPが0になった場合の一括処理）
        if (e.hp <= 0) {
            eliminator.processEntityDeath(e, 'FIGHTER', i);
            continue;
        }
    }

    // --- Phase 5: 敵母艦との衝突判定 (Enemy Mothership Collision) ---
    if (entities.enemyMothership && !entities.enemyMothership.isDead) {
        let em = entities.enemyMothership;
        if (em.flashTimer > 0) em.flashTimer--;

        // vs プレイヤーの弾
        for (let j = entities.bullets.length - 1; j >= 0; j--) {
            let b = entities.bullets[j];
            if (Math.hypot(em.x - b.x, em.y - b.y) < em.radius) {
                em.hp -= CONFIG.BULLET_DAMAGE;

                // Limit Burst: Scatter Shot (bulletCount >= 6)
                if ((playerStats.upgrades.bulletCount || 0) >= 6 && !b.isScatter) {
                    for (let k = 0; k < 3; k++) {
                        entities.bullets.push(new Bullet(
                            b.x, b.y,
                            (Math.random() - 0.5) * 20,
                            (Math.random() - 0.5) * 20,
                            15,
                            true
                        ));
                    }
                }

                entities.bullets.splice(j, 1);
                em.flashTimer = CONFIG.FLASH_DURATION;
                spawnDebris(b.x, b.y, '#555', 3);
            }
        }

        // vs プレイヤーのミサイル
        for (let j = entities.missiles.length - 1; j >= 0; j--) {
            let m = entities.missiles[j];
            if (Math.hypot(em.x - m.x, em.y - m.y) < em.radius) {
                em.hp -= 30; // 命中時の直接ダメージ
                em.flashTimer = CONFIG.FLASH_DURATION;
                spawnDebris(m.x, m.y, '#fff', 3);
                spawnExplosion(m.x, m.y, false, false, 0.5, 1.0, true, m.damageMult || 1.0);

                // Limit Burst: Multi-Missile (missileCount >= 6)
                if ((playerStats.upgrades.missile || 0) >= 6 && !m.isSubMunition) {
                    for (let k = 0; k < 3; k++) {
                        let target = null;
                        if (entities.enemies.length > 0) {
                            target = entities.enemies[Math.floor(Math.random() * entities.enemies.length)];
                        } else if (entities.enemyMothership && !entities.enemyMothership.isDead) {
                            target = entities.enemyMothership;
                        }
                        entities.missiles.push(new Missile(
                            m.x, m.y,
                            (Math.random() - 0.5) * 10,
                            (Math.random() - 0.5) * 10,
                            Math.random() * Math.PI * 2,
                            target,
                            CONFIG.MISSILE_LIFE * 0.4,
                            CONFIG.MISSILE_SPEED * 1.2,
                            CONFIG.MISSILE_TURN_RATE * 1.5,
                            1.0,
                            true
                        ));
                    }
                }

                entities.missiles.splice(j, 1);
            }
        }

        // vs プレイヤー本体（体当たり）
        if (!GAME.isPlayerDying) {
            const dx = em.x - player.x;
            const dy = em.y - player.y;
            const dist = Math.hypot(dx, dy);
            const minDist = em.radius + CONFIG.PLAYER_SIZE_W / 2;
            if (dist < minDist) {
                // 重なり解消
                const overlap = minDist - dist;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                player.x -= nx * overlap;
                player.y -= ny * overlap;

                // 反動とダメージ
                const crashSpeed = Math.hypot(player.vx, player.vy);
                const impulse = (1 + CONFIG.COLLISION_RECOIL_RESTITUTION) * crashSpeed * 0.5 + 2.0;
                player.vx -= impulse * nx;
                player.vy -= impulse * ny;

                const damage = CONFIG.COLLISION_DAMAGE_BASE + crashSpeed * CONFIG.COLLISION_DAMAGE_VEL_MULT;
                damagePlayer(damage);
                em.hp -= Math.max(10, damage * 0.1); // 母艦は巨大なので体当たりダメージ軽減

                GAME.damageFlashTimer = CONFIG.FLASH_DURATION;
                em.flashTimer = CONFIG.FLASH_DURATION;
                spawnDebris((player.x + em.x) / 2, (player.y + em.y) / 2, '#0f0', 3);
                spawnDebris((player.x + em.x) / 2, (player.y + em.y) / 2, '#555', 3);
            }
        }

        if (em.hp <= 0) {
            eliminator.processEntityDeath(em, 'MOTHERSHIP');
        }
    }

    // --- Phase 6: 成長要素 (ジェム回収) ---
    CollisionManager.handleGemPickup(entities, player, playerStats, checkLevelUp);

    // --- ミッション達成リマインダー ---
    if (GAME.killCount >= CONFIG.MISSION_QUOTA && !GAME.isMissionClear && !GAME.isPlayerDying) {
        GAME.quotaReminderTimer = (GAME.quotaReminderTimer || 0) + 1;
        if (GAME.quotaReminderTimer >= 900) {
            comm.play("ミッション達成です、無理せず帰ってきてくださいね");
            GAME.quotaReminderTimer = 0;
        }
    }

    // --- 着艦判定（出撃後は常時有効）---
    if (!player.isLandingSequence && !GAME.isPlayerDying && !GAME.isMissionClear && !GAME.launchSequence) {
        const cat = getCatapultSpec();
        const isTargeted = entities.enemies.length > 0;

        // 着艦不可（ターゲット中）かつ母艦半径200px以内に近づいたら警告
        if (isTargeted) {
            const distToMs = Math.hypot(player.x - CONFIG.MOTHERSHIP_X, player.y - CONFIG.MOTHERSHIP_Y);
            GAME.landingBlockedTimer = (GAME.landingBlockedTimer || 0) - 1;
            if (distToMs <= 200 && GAME.landingBlockedTimer <= 0) {
                comm.play("敵機からターゲット中です！排除しないと着艦できません！");
                GAME.landingBlockedTimer = 300; // 約5秒間は再生しない
            }
        } else {
            GAME.landingBlockedTimer = 0;
        }

        if (!isTargeted && Math.hypot(player.x - cat.tipX, player.y - cat.tipY) <= 50) {
            const isClearLanding = GAME.killCount >= CONFIG.MISSION_QUOTA;
            player.isLandingSequence = true;
            player.landingForClear = isClearLanding;
            if (isClearLanding) GAME.isMissionClear = true;
            player.landingPhase = 'TIP_LAND';
            player.landingTimer = 0;
            player.vx = 0;
            player.vy = 0;
            player.bodyAngle = Math.PI / 2;
            player.turretAngle = Math.PI / 2;
            player.leftTrailHistory = [];
            player.rightTrailHistory = [];
        }
    }



    // HP20%以下の通信
    if (playerStats.hp > 0 && playerStats.hp <= playerStats.maxHp * 0.2 && !player._hpWarningPlayed) {
        player._hpWarningPlayed = true;
        comm.play("フレーム強度低下！無理しないで、帰還してください！");
    } else if (playerStats.hp > playerStats.maxHp * 0.2) {
        player._hpWarningPlayed = false;
    }

    // 万が一の自機HPゼロ判定のセーフガード
    if (playerStats.hp <= 0 && !GAME.isPlayerDying) {
        eliminator.processEntityDeath(player, 'PLAYER');
    }

    // --- Update Engine Trails ---
    if (!GAME.isPlayerDying) {
        const isBoosterActive = GAME.launchSequence || (player.boostActiveTimer > 0);
        const isThrusting = (InputManager.isPressed('KeyW') || InputManager.isPressed('ArrowUp') || InputManager.isPressed('KeyS') || InputManager.isPressed('ArrowDown') ||
            InputManager.isPressed('KeyA') || InputManager.isPressed('ArrowLeft') || InputManager.isPressed('KeyD') || InputManager.isPressed('ArrowRight') ||
            isBoosterActive);

        const length = CONFIG.PLAYER_SIZE_W / 2;
        const width = 5; // Tomcat twin nozzle offset
        const cosA = Math.cos(player.bodyAngle);
        const sinA = Math.sin(player.bodyAngle);

        const leftNozzleX = player.x - (length * cosA) - (width * sinA);
        const leftNozzleY = player.y - (length * sinA) + (width * cosA);
        const rightNozzleX = player.x - (length * cosA) + (width * sinA);
        const rightNozzleY = player.y - (length * sinA) - (width * cosA);

        // --- [追加] 速度感応型 風トレイルの履歴更新 ---
        if (!player.leftWindTrailHistory) player.leftWindTrailHistory = [];
        if (!player.rightWindTrailHistory) player.rightWindTrailHistory = [];

        const currentSpeed = Math.hypot(player.vx, player.vy);

        // 一定速度以上、かつ生存時のみ風トレイルのサンプリングを行う
        if (!GAME.isPlayerDying && currentSpeed >= CONFIG.WIND_TRAIL_MIN_SPEED) {
            // 翼端から発生させる（双発）
            const wingWidth = CONFIG.PLAYER_SIZE_W / 2 + 5;

            player.leftWindTrailHistory.push({
                x: player.x - (wingWidth * sinA),
                y: player.y + (wingWidth * cosA),
                speed: currentSpeed
            });
            player.rightWindTrailHistory.push({
                x: player.x + (wingWidth * sinA),
                y: player.y - (wingWidth * cosA),
                speed: currentSpeed
            });
        } else {
            if (player.leftWindTrailHistory.length > 0) player.leftWindTrailHistory.shift();
            if (player.rightWindTrailHistory.length > 0) player.rightWindTrailHistory.shift();
        }

        if (player.leftWindTrailHistory.length > CONFIG.WIND_TRAIL_MAX_LEN) player.leftWindTrailHistory.shift();
        if (player.rightWindTrailHistory.length > CONFIG.WIND_TRAIL_MAX_LEN) player.rightWindTrailHistory.shift();

        // カタパルト着地〜着艦固定、および発艦カウントダウン中（GO!以前）はトレイルを非表示（履歴を消していく）
        const hideTrail = player.isLandingSequence || (GAME.launchSequence && GAME.launchTimer <= 180);

        if (!hideTrail) {
            if (!player.leftTrailHistory) player.leftTrailHistory = [];
            if (!player.rightTrailHistory) player.rightTrailHistory = [];

            // 物理エンジンの排気ベクトルを合成
            const thrustPower = isThrusting ? (isBoosterActive ? 0.8 : 0.3) : 0;
            const exhaustVx = player.vx + Math.cos(player.bodyAngle + Math.PI) * thrustPower * 10;
            const exhaustVy = player.vy + Math.sin(player.bodyAngle + Math.PI) * thrustPower * 10;

            player.leftTrailHistory.push({ x: leftNozzleX, y: leftNozzleY, vx: exhaustVx, vy: exhaustVy, active: isThrusting, boost: isBoosterActive });
            player.rightTrailHistory.push({ x: rightNozzleX, y: rightNozzleY, vx: exhaustVx, vy: exhaustVy, active: isThrusting, boost: isBoosterActive });

            const maxPlayerTrailLen = 25;
            if (player.leftTrailHistory.length > maxPlayerTrailLen) player.leftTrailHistory.shift();
            if (player.rightTrailHistory.length > maxPlayerTrailLen) player.rightTrailHistory.shift();
        } else {
            if (player.leftTrailHistory && player.leftTrailHistory.length > 0) player.leftTrailHistory.shift();
            if (player.rightTrailHistory && player.rightTrailHistory.length > 0) player.rightTrailHistory.shift();
        }

        // トレイルパーティクルに物理演算（空間摩擦と移動）を適用
        if (player.leftTrailHistory) {
            player.leftTrailHistory.forEach(pt => {
                if (pt.vx !== undefined) {
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.vx *= 0.85;
                    pt.vy *= 0.85;
                }
            });
        }
        if (player.rightTrailHistory) {
            player.rightTrailHistory.forEach(pt => {
                if (pt.vx !== undefined) {
                    pt.x += pt.vx;
                    pt.y += pt.vy;
                    pt.vx *= 0.85;
                    pt.vy *= 0.85;
                }
            });
        }
    } else {
        if (player.leftTrailHistory && player.leftTrailHistory.length > 0) player.leftTrailHistory.shift();
        if (player.rightTrailHistory && player.rightTrailHistory.length > 0) player.rightTrailHistory.shift();
    }

    // Update enemy single-nozzle trails
    entities.enemies.forEach(e => {
        if (!e.trailHistory) e.trailHistory = [];

        const isEnemyThrusting = (Math.hypot(e.vx, e.vy) > 0.3);
        const enemyBackX = e.x - Math.cos(e.angle) * (CONFIG.ENEMY_SIZE_H / 2);
        const enemyBackY = e.y - Math.sin(e.angle) * (CONFIG.ENEMY_SIZE_H / 2);

        e.trailHistory.push({ x: enemyBackX, y: enemyBackY, active: isEnemyThrusting });

        const maxEnemyTrailLen = 12; // Half length of player
        if (e.trailHistory.length > maxEnemyTrailLen) e.trailHistory.shift();
    });

    HUDManager.update(playerStats, GAME);
}

function checkLevelUp() {
    while (playerStats.exp >= playerStats.nextLevelExp) {
        playerStats.level++;
        playerStats.exp -= playerStats.nextLevelExp;
        playerStats.nextLevelExp = Math.floor(playerStats.nextLevelExp * CONFIG.LEVEL_UP_EXP_MULT);
        // 従来のようにゲームを止めず、ストックを増やすだけにする
        playerStats.levelUpStock = (playerStats.levelUpStock || 0) + 1;
    }
}



// ==========================================
// TITLE / LEVEL_UP / RESULT 画面の制御ロジック
// ==========================================

function updateLevelUpScreen() {
    GAME.levelUpCursorHoverTimer++;

    const cardW = 260;
    const gap = 40;
    const totalW = cardW * 3 + gap * 2;
    const startX = (GAME.width - totalW) / 2;
    const targetX = startX + GAME.levelUpSelectedIndex * (cardW + gap) + cardW / 2;
    GAME.levelUpCursorX += (targetX - GAME.levelUpCursorX) * 0.25;

    // マウスによるホバー選択
    if (GAME.levelUpState === 'CHOOSING') {
        const mouse = InputManager.getMouse();
        const startY = GAME.height * 0.35;
        const cardH = 340;
        for (let i = 0; i < 3; i++) {
            const cardX = startX + i * (cardW + gap);
            if (mouse.x >= cardX && mouse.x <= cardX + cardW && mouse.y >= startY && mouse.y <= startY + cardH) {
                if (GAME.levelUpSelectedIndex !== i) {
                    GAME.levelUpSelectedIndex = i;
                }
                if (mouse.leftDown) {
                    mouse.leftDown = false;
                    if (GAME.credits < 0) {
                        GAME.state = 'PLAYING';
                    } else {
                        GAME.levelUpState = 'DECIDED';
                        GAME.levelUpDecidedIndex = GAME.levelUpSelectedIndex;
                        GAME.levelUpDecidedTimer = 45;
                        GAME.levelUpNonSelectedY = 0;
                    }
                }
            }
        }
    }

    if (GAME.levelUpState === 'DECIDED') {
        GAME.levelUpDecidedTimer--;
        GAME.levelUpNonSelectedY += 0.8;

        for (let i = entities.particles.length - 1; i >= 0; i--) {
            let p = entities.particles[i];
            if (p.type === 'LEVEL_UP_HIT_PARTICLE') {
                p.update();
                if (p.life <= 0) entities.particles.splice(i, 1);
            }
        }

        if (GAME.levelUpDecidedTimer === 15) {
            const selectedX = startX + GAME.levelUpDecidedIndex * (cardW + gap) + cardW / 2;
            const cardY = GAME.height * 0.35;
            for (let i = 0; i < 25; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 6;
                entities.particles.push(new Particle(
                    selectedX,
                    cardY + 25,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    1.0,
                    0.025,
                    undefined,
                    undefined,
                    'LEVEL_UP_HIT_PARTICLE'
                ));
            }
        }

        if (GAME.levelUpDecidedTimer <= 0) {
            const upgrade = GAME.levelUpCards[GAME.levelUpDecidedIndex];
            if (upgrade) upgrade.apply();

            if (player.isLandingSequence && player.landingPhase === 'RESUPPLY') {
                if ((playerStats.levelUpStock || 0) > 0) {
                    // まだストックがある場合は続けて開く
                    playerStats.levelUpStock--;
                    GAME.levelUpCards = [];
                    let available = [...upgradePool].filter(u => {
                        const currentLvl = playerStats.upgrades[u.id] || 0;
                        return currentLvl < u.maxLevel;
                    });
                    for (let i = 0; i < 3 && available.length > 0; i++) {
                        const idx = Math.floor(Math.random() * available.length);
                        GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                    }

                    GAME.state = 'LEVEL_UP';
                    GAME.levelUpState = 'CHOOSING';
                    GAME.levelUpSelectedIndex = 0;
                    GAME.levelUpCursorX = (GAME.width - (260 * 3 + 40 * 2)) / 2 + 130;
                    GAME.levelUpDecidedIndex = -1;
                    GAME.levelUpDecidedTimer = 0;
                    GAME.levelUpCursorHoverTimer = 0;
                    GAME.levelUpNonSelectedY = 0;
                } else {
                    // 全て使い切ったら発進
                    comm.play("全調整完了！お気をつけて！");
                    GAME.state = 'PLAYING';
                    player.isLandingSequence = false;
                    player.landingPhase = 'NONE';
                    player.vx = 0;
                    player.vy = 0;
                    GAME.launchSequence = true;
                    GAME.launchTimer = 0;
                }
            } else {
                GAME.state = 'PLAYING';
            }
        }
    }
}



// ==========================================
// 5. 描画フェーズ (Rendering)
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = GAME.width;
canvas.height = GAME.height;

const CommStateManager = {
    handleInput: function (e) {
        if (GAME.commState === 'INACTIVE' || !GAME.commState) {
            if ((playerStats.levelUpStock || 0) > 0) {
                GAME.commState = 'LEVEL_UP';
                GAME.levelUpCards = [];
                let available = [...upgradePool].filter(u => {
                    const currentLvl = playerStats.upgrades[u.id] || 0;
                    return currentLvl < u.maxLevel;
                });
                for (let i = 0; i < 3 && available.length > 0; i++) {
                    const idx = Math.floor(Math.random() * available.length);
                    GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                }
                comm.play("エネルギー蓄積完了。リミット解放の指示を！");
            } else {
                GAME.commState = 'MENU';
                comm.play("こちらAガレージ。通信確立しました、指示を！");
            }
        } else {
            if (GAME.commState === 'MENU' && (playerStats.levelUpStock || 0) > 0) {
                GAME.commState = 'LEVEL_UP';
                GAME.levelUpCards = [];
                let available = [...upgradePool].filter(u => {
                    const currentLvl = playerStats.upgrades[u.id] || 0;
                    return currentLvl < u.maxLevel;
                });
                for (let i = 0; i < 3 && available.length > 0; i++) {
                    const idx = Math.floor(Math.random() * available.length);
                    GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                }
                comm.play("エネルギー蓄積完了。リミット解放の指示を！");
            } else {
                GAME.commState = 'INACTIVE';
                comm.play("了解、指示を待ちます！");
            }
        }
    },
    handleActiveInput: function (e) {
        if (GAME.commState === 'LEVEL_UP') {
            let selectedCardIndex = -1;
            if (e.code === 'KeyQ' && GAME.levelUpCards.length > 0) selectedCardIndex = 0;
            if (e.code === 'KeyE' && GAME.levelUpCards.length > 1) selectedCardIndex = 1;
            if (e.code === 'KeyR' && GAME.levelUpCards.length > 2) selectedCardIndex = 2;

            if (selectedCardIndex !== -1) {
                GAME.levelUpCards[selectedCardIndex].apply();
                playerStats.levelUpStock--;

                if (playerStats.levelUpStock > 0) {
                    // ストックがまだある場合はカードを引き直して継続
                    GAME.levelUpCards = [];
                    let available = [...upgradePool].filter(u => {
                        const currentLvl = playerStats.upgrades[u.id] || 0;
                        return currentLvl < u.maxLevel;
                    });
                    for (let i = 0; i < 3 && available.length > 0; i++) {
                        const idx = Math.floor(Math.random() * available.length);
                        GAME.levelUpCards.push(available.splice(idx, 1)[0]);
                    }
                    comm.play("続けてリミット解放が可能です！指示を！");
                } else {
                    // ストックを使い切った場合は通信を閉じる
                    GAME.commState = 'INACTIVE';
                    comm.play("リミット解除完了！お気をつけて！");
                }
            }
        } else if (GAME.commState === 'MENU') {
            if (e.code === 'KeyF') { comm.play("了解、貴機座標へベクトル合わせます。Aガレージ、前進！"); GAME.commState = 'INACTIVE'; }
            if (e.code === 'KeyR') { comm.play("目標座標を共有しました。Aガレージ火器管制、最大戦力へ！"); GAME.commState = 'INACTIVE'; }
            if (e.code === 'KeyE') { comm.play("了解。退避ルートへ急行します。……無事に帰ってきてくださいね！"); GAME.commState = 'INACTIVE'; }
            if (e.code === 'KeyQ') { comm.play("了解。未探索エリアへレーダーを展開しながら移動します"); GAME.commState = 'INACTIVE'; }
        }
    },
    draw: function (ctx, radarRadius) {
        if ((playerStats.levelUpStock || 0) > 0 && GAME.commState !== 'LEVEL_UP') {
            ctx.save();
            ctx.font = 'bold 12px Courier New';
            ctx.fillStyle = '#0088ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`[ PowerUp Stock ${String(playerStats.levelUpStock).padStart(2, '0')} ]`, 0, 50);
            ctx.fillText(`[    PUSH C KEY   ]`, 0, 65);
            ctx.restore();
        }

        if (GAME.commState === 'MENU') {
            ctx.save();
            ctx.translate(0, radarRadius + 50);
            ctx.fillStyle = 'rgba(0, 20, 50, 0.7)';
            ctx.fillRect(-170, 0, 340, 30);
            ctx.strokeStyle = '#00aaff';
            ctx.strokeRect(-170, 0, 340, 30);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("[F]移動 [R]攻撃 [E]退避 [Q]索敵 [C]閉じる", 0, 15);
            ctx.restore();
        } else if (GAME.commState === 'LEVEL_UP') {
            ctx.save();
            ctx.translate(0, radarRadius + 70);

            const commKeys = ['Q', 'E', 'R'];
            for (let i = 0; i < GAME.levelUpCards.length; i++) {
                const card = GAME.levelUpCards[i];
                const x = -100 + i * 100;
                const iconSize = 64;

                ctx.fillStyle = 'rgba(0, 30, 60, 0.9)';
                ctx.strokeStyle = '#0ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x - iconSize / 2, -iconSize / 2, iconSize, iconSize, 8);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#0ff';
                ctx.font = 'bold 16px Courier New';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText('[' + commKeys[i] + ']', x - iconSize / 2 + 4, -iconSize / 2 + 4);

                if (card.shortName) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px Courier New';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const lines = card.shortName.split('\\n');
                    if (lines.length > 1) {
                        ctx.fillText(lines[0], x, 5);
                        ctx.fillText(lines[1], x, 20);
                    } else {
                        ctx.fillText(card.shortName, x, 10);
                    }
                }
            }
            ctx.restore();
        }
    }
};

function drawGameEntities(ctx) {
    ctx.save();
    ctx.translate(GAME.width / 2 - player.x, GAME.height / 2 - player.y);

    // --- 母艦 (Anchor Garage) 描画 ---
    ctx.save();
    ctx.translate(CONFIG.MOTHERSHIP_X, CONFIG.MOTHERSHIP_Y);
    ctx.rotate(-Math.PI / 2); // 上向き
    ctx.drawImage(SpriteCache.alliedMothership, -150, -100);
    ctx.restore();

    // --- 敵母艦 (Enemy Mothership) 描画 ---
    if (entities.enemyMothership && !entities.enemyMothership.isDead) {
        let em = entities.enemyMothership;
        ctx.save();
        ctx.translate(em.x, em.y);
        ctx.rotate(Math.PI / 2); // 下向き

        const sprite = em.flashTimer > 0 ? SpriteCache.enemyMothershipFlash : SpriteCache.enemyMothership;
        ctx.drawImage(sprite, -150, -100);

        // HPバーの描画
        ctx.save();
        ctx.rotate(-Math.PI / 2); // 画面に対して水平に戻す
        const hpRatio = em.hp / em.maxHp;
        const barW = 100;
        const barH = 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barW / 2, 100, barW, barH); // 機体下部に表示
        ctx.fillStyle = '#f00';
        ctx.fillRect(-barW / 2, 100, barW * hpRatio, barH);
        ctx.restore();

        ctx.restore();
    }

    // --- ランディングエリア表示 ---
    if (!player.isLandingSequence && !GAME.launchSequence && !GAME.isMissionClear && entities.enemies.length === 0) {
        const lcat = getCatapultSpec();
        const landingColor = 'rgba(0, 220, 100, 0.18)';
        const landingStroke = 'rgba(0, 220, 100, 0.55)';
        ctx.save();
        ctx.beginPath();
        ctx.arc(lcat.tipX, lcat.tipY, 50, 0, Math.PI * 2);
        ctx.fillStyle = landingColor;
        ctx.fill();
        ctx.strokeStyle = landingStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = landingStroke;
        ctx.font = 'bold 11px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('LANDING AREA', lcat.tipX, lcat.tipY - 54);
        ctx.restore();
    }

    // --- 補給中のステータス表示 ---
    if (player.isLandingSequence && player.landingPhase === 'RESUPPLY' && player.needsResupplyVisual) {
        ctx.save();
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('REPAIRING & RESUPPLYING...', player.x, player.y - 40);
        // ゲージの簡易表示
        ctx.strokeStyle = '#0ff';
        ctx.strokeRect(player.x - 50, player.y - 30, 100, 6);
        const progress = (120 - player.landingTimer) / 120;
        ctx.fillRect(player.x - 50, player.y - 30, 100 * progress, 6);
        ctx.restore();
    }

    drawEffects(ctx, player, entities, SpriteCache, 'background');

    // 敵機描画
    entities.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);

        // 敵のHPゲージ・ヒートゲージ
        const barW = 30;
        const hpRatio = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barW / 2, 22, barW, 3);
        ctx.fillStyle = hpRatio <= 0.2 ? '#f00' : '#0f0';
        ctx.fillRect(-barW / 2, 22, barW * hpRatio, 3);

        if (e.heat > 0) {
            const heatRatio = Math.max(0, Math.min(1, e.heat / CONFIG.HEAT_MAX));
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(-barW / 2, 26, barW, 3);
            if (e.isOverheated) {
                ctx.fillStyle = '#808080';
            } else if (heatRatio > 0.8) {
                ctx.fillStyle = '#f80';
            } else {
                ctx.fillStyle = '#fff';
            }
            ctx.fillRect(-barW / 2, 26, barW * heatRatio, 3);
        }

        ctx.rotate(e.angle);

        let sprite = SpriteCache.enemyDogfighter;
        if (e.personality === 'RAMMER') sprite = SpriteCache.enemyRammer;
        if (e.personality === 'SNIPER') sprite = SpriteCache.enemySniper;

        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);

        // 攻撃ヒット時の白フラッシュ
        if (e.flashTimer > 0) {
            ctx.globalAlpha = e.flashTimer / CONFIG.FLASH_DURATION;
            ctx.drawImage(SpriteCache.enemyFlash, -SpriteCache.enemyFlash.width / 2, -SpriteCache.enemyFlash.height / 2);
            ctx.globalAlpha = 1.0;
        }
        ctx.restore();
    });

    // 自機描画とマイクロHUD (生存時のみ)
    if (!GAME.isPlayerDying) {
        // 砲塔描画
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.turretAngle);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -3, CONFIG.PLAYER_SIZE_W / 2 - 2, 6);
        ctx.restore();

        // 自機描画 (土台)
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.bodyAngle);
        ctx.drawImage(SpriteCache.player, -SpriteCache.player.width / 2, -SpriteCache.player.height / 2);
        ctx.restore();
    }

    drawEffects(ctx, player, entities, SpriteCache, 'foreground');

    ctx.restore();
}

function draw() {
    drawBackground(ctx, stars, GAME);

    drawGameEntities(ctx);
    drawHUD(ctx, GAME, playerStats, player, entities, CONFIG);
    
    drawOverlay(ctx, GAME);
}

// ==========================================
// 6. メインループ
// ==========================================
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// 初期化して開始
SpriteCache.init();
loop();

