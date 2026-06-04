const eliminator = {
    spawnItem: function (x, y, baseVx, baseVy, kind, sprite, exp, heal, sizeMult = 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        entities.gems.push(new Gem(
            x,
            y,
            (baseVx || 0) * 0.35 + Math.cos(angle) * speed,
            (baseVy || 0) * 0.35 + Math.sin(angle) * speed,
            kind,
            exp,
            heal,
            false,                         // locked: 初期状態は未ロック
            CONFIG.GEM_MAGNET_BASE_SPEED,  // speed: 吸引速度初期値
            sprite,
            sizeMult
        ));
    },

    processEntityDeath: function (e, type, index) {
        if (type === 'PLAYER') {
            if (GAME.isPlayerDying) return;
            GAME.isPlayerDying = true;
            e.vx = 0;
            e.vy = 0;

            comm.play("傭兵さん！傭兵さーーん！");

            // 連鎖爆発の起点として自機位置に大爆発を発生（ゲームオーバー用）
            spawnExplosion(e.x, e.y, true);
            spawnDeathDebris(e.x, e.y, '#0f0', e.vx, e.vy);

            // 2秒後にリザルト画面へ移行
            setTimeout(() => {
                SceneManager.result.init(false);
            }, 2000);
            return;
        }

        if (type === 'MOTHERSHIP') {
            e.isDead = true;
            // 大型フレア (サイズ2倍、ダメージ2倍、継続時間5秒)
            spawnExplosion(e.x, e.y, false, false, 2.0, 2.5, false, 2.0);

            // 中フレア2〜3個を少し離れた位置に発生させる
            const numFlares = 2 + Math.floor(Math.random() * 2);
            for (let k = 0; k < numFlares; k++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * e.radius;
                spawnExplosion(e.x + Math.cos(angle) * dist, e.y + Math.sin(angle) * dist);
            }

            // 大爆発と大量のデブリ
            for (let i = 0; i < 5; i++) {
                spawnDeathDebris(e.x, e.y, '#555', e.vx, e.vy);
            }

            // EXP大5個
            for (let k = 0; k < 5; k++) {
                this.spawnItem(e.x, e.y, e.vx, e.vy, 'BIG_EXP', SpriteCache.gemBigExp, CONFIG.GEM_BASE_EXP * CONFIG.BIG_EXP_MULT, 0, CONFIG.BIG_EXP_SIZE_MULT);
            }
            // 回復アイテム2個
            for (let k = 0; k < 2; k++) {
                this.spawnItem(e.x, e.y, e.vx, e.vy, 'HEAL', SpriteCache.gemHeal, 0, CONFIG.HEAL_ITEM_AMOUNT, 1.0);
            }

            comm.play("敵母艦の破壊を確認。作戦完了です！");
            return;
        }

        if (type === 'FIGHTER') {
            let enemyColor = getEnemyColor(e);
            spawnExplosion(e.x, e.y);
            spawnDeathDebris(e.x, e.y, enemyColor, e.vx, e.vy);

            this.spawnItem(e.x, e.y, e.vx, e.vy, 'EXP', SpriteCache.gem, CONFIG.GEM_BASE_EXP, 0, 1.0);
            if (Math.random() < CONFIG.HEAL_ITEM_DROP_CHANCE) {
                this.spawnItem(e.x, e.y, e.vx, e.vy, 'HEAL', SpriteCache.gemHeal, 0, CONFIG.HEAL_ITEM_AMOUNT, 1.0);
            }
            if (Math.random() < CONFIG.BIG_EXP_DROP_CHANCE) {
                this.spawnItem(e.x, e.y, e.vx, e.vy, 'BIG_EXP', SpriteCache.gemBigExp, CONFIG.GEM_BASE_EXP * CONFIG.BIG_EXP_MULT, 0, CONFIG.BIG_EXP_SIZE_MULT);
            }

            GAME.credits += 100;
            GAME.killCount++;

            // 撃破時通信
            if (GAME.killCount === 5) {
                comm.play("敵5機撃破！あと半分ですよ！");
            } else if (GAME.killCount === CONFIG.MISSION_QUOTA) {
                comm.play("ノルマ達成です、無理せず帰ってきてくださいね");
            }

            if (index !== undefined) {
                entities.enemies.splice(index, 1);
            }
            return;
        }
    }
};
