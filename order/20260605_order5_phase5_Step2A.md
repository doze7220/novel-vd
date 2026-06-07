Step1の結果を確認しました。

Step1は承認します。

ControllerInput.js
HumanController.js
Ship.applyControl()

の足場構築は完了しており、
ゲーム挙動への影響も確認できました。

---

# 今回の作業指示

Step2は実施せず、

**Step2Aのみ実施してください。**

Step2B以降は実施しないでください。

---

# Step2A の目的

目的は

「InputManager → ControllerInput」

への入力経路移行のみです。

この段階では、

PlayerShip の物理処理を applyControl() へ移動しません。

EnemyShip は一切変更しません。

---

# 実施範囲

PlayerShip.update() 内の

* InputManager.isPressed(...)
* InputManager.getMouse()

による直接入力取得を、

HumanController.getInput()

経由へ置換してください。

---

# 実施対象

以下を ControllerInput 経由へ変更してください。

* turnLeft
* turnRight
* thrust
* brake
* tacticalBrake
* boost
* firePrimary
* fireSecondary
* aimAngle

---

# 重要な実装条件

HumanController は

「生入力取得のみ」

を担当してください。

Ship状態は参照しないでください。

---

## boost の扱い

現在:

```javascript
const isHoldingShift =
    (InputManager.isPressed('ShiftLeft') ||
     InputManager.isPressed('ShiftRight'))
    && !this.isOverheated;
```

HumanController では

```javascript
input.boost
```

に Shift 入力のみを格納してください。

その後、

PlayerShip.update()

側で

```javascript
if (this.isOverheated) {
    input.boost = false;
}
```

相当の補正を行い、

現在と同一挙動を維持してください。

---

## thrust の扱い

現在:

```javascript
let moveForward = ...
if (this.boostActiveTimer > 0 && !moveForward) {
    moveForward = true;
}
```

この仕様を維持してください。

HumanController は生入力のみ返し、

PlayerShip.update()

側で

```javascript
if (this.boostActiveTimer > 0 && !input.thrust) {
    input.thrust = true;
}
```

相当の補正を行ってください。

---

# 禁止事項

以下は禁止します。

* applyControl() 実装
* applyControl() 呼び出し
* vx/vy 処理移動
* bodyAngle 処理移動
* updatePhysics() 変更
* EnemyShip 変更
* AIController 作成
* USE_UNIFIED_CONTROLLER 導入
* 入力仕様変更
* ブースト仕様変更
* オーバーヒート仕様変更

---

# 成功条件

PlayerShip.update() に

```javascript
const input =
    HumanController.getInput(
        this,
        GAME,
        playerStats
    );
```

が導入されること。

ただし、

以下の処理は現在位置に維持すること。

* bodyAngle 操作
* vx/vy 操作
* ブースト処理
* updatePhysics()
* 射撃処理
* ミサイル処理

つまり、

入力取得経路のみ変更し、

物理処理は1行も移動しないこと。

---

# 完了後の報告

以下を提示してください。

* 変更ファイル一覧
* 差分
* InputManager 呼び出し削減箇所一覧
* 残存する InputManager 呼び出し一覧
* Step2B で applyControl() へ移動予定の処理一覧

---

# 最重要

今回の変更は

「入力取得経路の置換」

のみを目的とします。

ゲーム挙動、
移動感覚、
ドリフト、
ブースト、
オーバーヒート、
射撃、
着艦、
発艦、

すべて完全互換を維持してください。

物理挙動の変更は禁止です。
