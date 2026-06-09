/**
 * CollisionManager
 * 衝突判定を担当するシステムオブジェクト。
 * Phase 4 Step 8 で新規作成。
 *
 * 現在実装するメソッド:
 *   - handleGemPickup(): Gem 回収判定（EXP/HP加算、checkLevelUp、splice）
 *
 * 将来的に他の衝突カテゴリ（playerBulletVsEnemy, enemyBulletVsPlayer 等）を
 * 追加する足場として機能するが、本 Step では handleGemPickup() のみ実装する。
 */
const CollisionManager = {

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
     * @param {object}   entities      - entities オブジェクト（gems 配列を含む）
     * @param {object}   player        - プレイヤーエンティティ（x, y 参照）
     * @param {object}   playerStats   - playerStats オブジェクト（hp, maxHp, exp 参照・更新）
     * @param {function} checkLevelUp  - レベルアップ判定関数
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

};
