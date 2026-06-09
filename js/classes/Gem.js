/**
 * Gem クラス
 * 経験値・回復アイテム（ジェム）エンティティ。
 * constructor: 初期プロパティを設定。
 * update(player): 吸引処理・移動処理のみを担当。
 *
 * 【update() で行わないこと（CollisionManager に移植済み）】
 *   - dist < GEM_COLLECT_RADIUS による回収判定
 *   - EXP 加算 / HP 回復
 *   - checkLevelUp() 呼び出し
 *   - SE 再生
 *   - パーティクル演出
 *   - entities.gems.splice (cleanup)
 *
 * ※ draw() は実装しない（drawEffects.js / EffectManager を変更しない）。
 * ※ Phase 4 Step 8 完了: 回収判定・cleanup は
 *    CollisionManager.handleGemPickup() に移植済み。
 */
class Gem {
    /**
     * @param {number}       x        - X座標
     * @param {number}       y        - Y座標
     * @param {number}       vx       - X速度（飛び出し初速）
     * @param {number}       vy       - Y速度（飛び出し初速）
     * @param {string}       kind     - アイテム種別 ('EXP' | 'BIG_EXP' | 'HEAL')
     * @param {number}       exp      - 獲得EXP量
     * @param {number}       heal     - 回復HP量
     * @param {boolean}      locked   - 吸引ロック状態（初期値: false）
     * @param {number}       speed    - 吸引速度（初期値: CONFIG.GEM_MAGNET_BASE_SPEED）
     * @param {object}       sprite   - 描画スプライト参照
     * @param {number}       sizeMult - 描画サイズ倍率
     */
    constructor(x, y, vx, vy, kind, exp, heal, locked, speed, sprite, sizeMult) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.kind = kind;
        this.exp = exp;
        this.heal = heal;
        this.locked = locked;
        this.speed = speed;
        this.sprite = sprite;
        this.sizeMult = sizeMult;
    }

    /**
     * 毎フレーム呼び出し。吸引処理と移動処理のみを行う。
     * 回収判定（dist < GEM_COLLECT_RADIUS）・EXP加算・splice は行わない。
     *
     * 処理順序（変更禁止）:
     *   1. プレイヤーとの距離計算
     *   2. MAGNET_RANGE 判定 → locked フラグ設定
     *   3. ロック中: 加速 + プレイヤー方向へ移動
     *   4. 未ロック: vx/vy による慣性移動 + 減速（0.92）
     *
     * 元コード: main.js L1788–L1810（距離計算 + 吸引 + 移動部分のみ）
     * 回収判定（L1812–L1820）は main.js に残存。
     *
     * @param {object} player - プレイヤーエンティティ（x, y 参照）
     */
    update(player) {
        const gdx = player.x - this.x;
        const gdy = player.y - this.y;
        const dist = Math.hypot(gdx, gdy);

        // 一度吸引範囲に入ったらロックオン状態になり、加速度がついて必ず回収できる
        if (dist < CONFIG.EXP_MAGNET_RADIUS) {
            this.locked = true;
        }

        if (this.locked) {
            this.speed += CONFIG.GEM_MAGNET_ACCEL; // 加速度を加算
            const safeDist = Math.max(dist, 0.0001);
            this.x += (gdx / safeDist) * this.speed;
            this.y += (gdy / safeDist) * this.speed;
        } else {
            // 敵撃破時の飛び出し＆減速挙動 (デブリと同様に)
            if (this.vx !== undefined && this.vy !== undefined) {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.92; // 毎フレーム 8% 減速
                this.vy *= 0.92;
            }
        }
    }
}
