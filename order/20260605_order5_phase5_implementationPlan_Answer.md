計画書を確認しました。

以下の方針を確認してください。

# 決定事項

## 1. AI 操縦モデル

**方式A（driveAngle / drivePower）を採用**

理由：

* 本フェーズの目的は「入力経路統合」であり、「AI操縦モデル変更」ではない
* 現行の敵AI挙動（SNIPER / DOGFIGHTER / RAMMER）を可能な限り維持したい
* AI思考ロジックの変更は本フェーズのスコープ外とする

したがって、

AIController
→ driveAngle / drivePower
→ applyControl()
→ updatePhysics()

の構成で実装してください。

turnLeft / turnRight / thrust への逆変換は行わないでください。

---

## 2. ControllerInput の形式

**オブジェクトリテラルを採用**

---

## 3. HumanController / AIController の形式

**const オブジェクトを採用**

既存コードスタイルとの整合性を優先してください。

---

## 4. Step 6（クラス分離）

**Phase 5 のスコープから除外**

理由：

* Controller Abstraction と File Separation は別問題である
* 不具合発生時の原因切り分けを容易にするため
* 本フェーズは入力経路統合に集中したい

したがって、

Ship / PlayerShip / EnemyShip のファイル分離は実施せず、

別フェーズ（Phase 6 以降）へ延期してください。

---

## 5. angle vs bodyAngle

**名称統一は将来フェーズへ延期**

本フェーズでは動作維持を優先してください。

---

## 6. playerStats 二重管理

**将来フェーズへ延期**

本フェーズでは controller abstraction に必要な最小変更のみ行ってください。

---

# 実装方針

## Phase 5 の最終成功条件

本フェーズ全体の成功条件は：

* HumanController 導入
* AIController 導入
* Ship.applyControl() 導入
* Player / Enemy が ControllerInput を経由する
* updatePhysics() の責務維持
* 挙動互換性の維持
* USE_UNIFIED_CONTROLLER によるロールバック可能性の維持

である。

AI操縦モデル変更、
playerStats統合、
クラス分離、
名称統一は本フェーズの対象外とする。

---

# 今回の作業指示

まずは Step1 のみ実施してください。

Step2以降は実施しないでください。
Step1完了後にレビューを行い、
承認後に次のStepへ進みます。

今回の目的は、まず Controller Abstraction の足場を安全に構築することです。
Step1では新規ファイル追加および既存コードへの非機能的変更のみを許可します。
既存のゲームロジック、物理計算、AI判断、入力処理フローの変更は禁止します。

## 実施範囲

* ControllerInput.js 新規作成
* HumanController.js 新規作成
* Ship.applyControl() の追加（空実装または最小実装）
* index.html の読み込み追加
* changelog 更新

この段階では：

* PlayerShip.update() の挙動変更は行わない
* EnemyShip.update() の挙動変更は行わない
* USE_UNIFIED_CONTROLLER の有効化は行わない
* applyControl() への実際の移行は行わない

つまりゲーム挙動が一切変化しない状態を維持してください。

Step1完了後、

* 変更ファイル一覧
* 差分
* 追加された API
* Step2 で変更予定の箇所

を提示してください。

その内容を確認した上で Step2 に進むか判断します。


# 重要：

今回のコミット／変更は
「ゲーム挙動ゼロ変更」
を必須条件とします。

実行後にプレイ感覚、
移動、
AI挙動、
射撃、
着艦、
発艦に変化が発生してはなりません。

Step1は純粋な足場構築のみを目的としてください。
