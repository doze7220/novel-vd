/**
 * js/controllers/ControllerInput.js
 *
 * ControllerInput — HumanController / AIController が生成する「仮想入力」データ構造。
 *
 * 役割：
 *   Player / Enemy の入力を統一インターフェースで表現する。
 *   現在ゲームで実際に使用されている入力のみを定義する（未来拡張項目は禁止）。
 *
 * 使用方法：
 *   const input = createControllerInput();
 *   input.thrust = true;
 *   ship.applyControl(input, stats);
 *
 * ※ Step 1（足場構築）時点では、実際の挙動には一切影響しない。
 *    applyControl() / getInput() が呼ばれるのは Step 2 以降。
 */

/**
 * ControllerInput のデフォルト値を持つオブジェクトを生成して返す。
 * @returns {object} ControllerInput
 */
function createControllerInput() {
    return {
        // === 旋回（PlayerShip のみ使用） ===
        // A/← キー: 左旋回
        turnLeft: false,
        // D/→ キー: 右旋回
        turnRight: false,

        // === 推進 ===
        // W/↑ キー（Player）/ AI が常時加速する場合は true（Enemy）
        thrust: false,
        // S/↓ キー: 後退ブレーキ（PlayerShip のみ使用）
        brake: false,
        // Q キー: タクティカル・ブレーキ（maneuver >= 6 時有効、PlayerShip のみ使用）
        tacticalBrake: false,

        // === ブースト（PlayerShip のみ使用） ===
        // Shift キー: ブースト入力
        boost: false,

        // === 射撃 ===
        // Space / 右クリック（Player）/ 射程内時 true（Enemy）
        firePrimary: false,
        // E キー: ミサイル発射（PlayerShip のみ使用）
        fireSecondary: false,

        // === エイム ===
        // Player: マウス角度（MOUSE_AIM）または bodyAngle（SUBSPACE）
        // Enemy: rotateTowards 後の this.angle 相当の目標角度
        aimAngle: 0,

        // === AI 専用フィールド（EnemyShip のみ使用。方式A: driveAngle/drivePower） ===
        // AI 思考が計算した目標方向角度（moveAngle + avoidX/avoidY の合成結果）
        driveAngle: 0,
        // AI 思考が計算した加速度係数（CONFIG.ENEMY_ACCEL * spdMult）
        drivePower: 0,
    };
}
