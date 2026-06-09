/**
 * js/controllers/HumanController.js
 *
 * HumanController — InputManager の生入力を ControllerInput に変換するコントローラー。
 *
 * 役割：
 *   キーボード・マウス入力（InputManager）を読み取り、
 *   ControllerInput 形式のオブジェクトにまとめて返す。
 *
 * 制約：
 *   - InputManager の入力マッピングは変更しない
 *   - GAME.controlMode（SUBSPACE / MOUSE_AIM）の分岐もここで処理する
 *   - playerStats.handling / moveSpeed 等は参照のみ（変更しない）
 *
 * 使用方法（Step 2 以降で PlayerShip.update() が呼ぶ）：
 *   const input = HumanController.getInput(ship, GAME, playerStats);
 *   ship.applyControl(input, playerStats);
 *
 * ※ Step 1（足場構築）時点では、この getInput() は誰も呼んでいない。
 *    PlayerShip.update() の入力処理は現行コードのまま維持される。
 */
const HumanController = {
    /**
     * InputManager からフレームごとの入力を読み取り、ControllerInput を返す。
     * @param {object} ship         - PlayerShip インスタンス（boostActiveTimer 等の参照用）
     * @param {object} GAME         - ゲーム状態オブジェクト（controlMode, height, width 等）
     * @param {object} playerStats  - プレイヤー成長データ（upgrades.maneuver 等）
     * @returns {object}            - createControllerInput() で生成したオブジェクト
     */
    getInput: function(ship, GAME, playerStats) {
        const input = createControllerInput();

        const mouse = InputManager.getMouse();

        // --- 旋回 ---
        input.turnLeft  = InputManager.isPressed('KeyA') || InputManager.isPressed('ArrowLeft');
        input.turnRight = InputManager.isPressed('KeyD') || InputManager.isPressed('ArrowRight');

        // --- 推進 ---
        input.thrust = InputManager.isPressed('KeyW') || InputManager.isPressed('ArrowUp');
        input.brake  = InputManager.isPressed('KeyS') || InputManager.isPressed('ArrowDown');

        // タクティカル・ブレーキ（Q キー、maneuver >= 6 の場合のみ有効）
        input.tacticalBrake = InputManager.isPressed('KeyQ') &&
            ((playerStats.upgrades.maneuver || 0) >= 6);

        // --- ブースト ---
        // ブースト中に前進未入力でも前進扱いにする処理は PlayerShip 側で維持する
        input.boost = InputManager.isPressed('ShiftLeft') || InputManager.isPressed('ShiftRight');

        // --- 射撃 ---
        input.firePrimary   = InputManager.isPressed('Space') || mouse.rightDown;
        input.fireSecondary = InputManager.isPressed('KeyE');

        // --- エイム角度 ---
        // controlMode に応じた砲塔角度の目標値を計算する
        if (GAME.controlMode === 'MOUSE_AIM') {
            // マウス位置から画面中心への角度
            input.aimAngle = Math.atan2(
                mouse.y - GAME.height / 2,
                mouse.x - GAME.width  / 2
            );
        } else {
            // SUBSPACE: 機体角度（bodyAngle）に追従する。
            // 実際の bodyAngle は applyControl() 内で this.bodyAngle を参照すれば良いため、
            // ここでは 0 を入れておき、Step 2 の実装で適切に設定する。
            input.aimAngle = 0;
        }

        return input;
    },
};
