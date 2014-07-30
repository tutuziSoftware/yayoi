var battle = {};

if(typeof window === "undefined"){
	//server mode
	module.exports = battle;
}

(function(){
	/**
	 * ブロックステップを処理します。
	 *
	 * @param field 自分のフィールドです
	 * @param enemyField 相手のフィールドです
	 * @param pairs [
	 * 				{
	 * 					"attacker":{ ... }, //必須値；攻撃するクリーチャー
	 * 					"blocker":{ ... }   //オプション：ブロックするクリーチャー
	 * 				}
	 * 				]
	 */
	battle.doBlockStep = function(field, enemyField, pairs){
		doBlock(field, enemyField, pairs);
		doDirectAttack(field, pairs);
	};

	/**
	 * ブロックを処理します。
	 * @param field
	 * @param enemyField
	 * @param pairs
	 */
	function doBlock(field, enemyField, pairs){
		var blockedPairs = pairs.filter(function(pair){
			//アタッカーとブロッカーが紐づいていない場合、処理を飛ばす
			return pair.attacker !== void 0 && pair.blocker !== void 0;
		});

		//戦闘
		blockedPairs.forEach(function(pair){
			var attacker = pair.attacker;
			var blocker = pair.blocker;

			blocker.toughness -= attacker.power;

			if(blocker.toughness >= 1){
				attacker.toughness -= blocker.power;
			}
		});

		//戦闘後、タフネスが0になったクリーチャーを墓地に送る
		blockedPairs.forEach(function(pair){
			if(pair.attacker === void 0 || pair.blocker === void 0) return;

			var attacker = pair.attacker;
			var blocker = pair.blocker;

			if(blocker.toughness <= 0){
				doCreatureDestroy(field, enemyField, blocker);
			}

			if(attacker.toughness <= 0){
				doCreatureDestroy(field, enemyField, attacker);
			}
		});
	}

	/**
	 * プレイヤーへのダメージを処理します。
	 * @param field
	 * @param pairs
	 */
	function doDirectAttack(field, pairs){
		var unblock = pairs.filter(function(pair){
			return pair.attacker !== void 0 && pair.blocker === void 0;
		});
		unblock.forEach(function(attacker){
			field.life -= attacker.attacker.power;
		});
	}

	/**
	 * アンタップフェイズを行う関数です。
	 *
	 * this(クライアント): $scope
	 * this(サーバ): {field: {} }
	 */
	battle.doUntap = function(){
		if(this.field.turn !== 'my turn') return;

		Object.keys(this.field.creatures).forEach(function(key){
			var creature = this.field.creatures[key];
			creature.tap = false;
			creature.isAttack = false;
		}, this);

		this.field.enchantFields.forEach(function(enchantField){
			enchantField.tap = false;
		});
	};

	/*
	現状：angulerjsで動かしていた「場に出す」「コストを支払う」機能をここにコピペした
	目標：angulerjsでもサーバサイドでも動くよう調整する
	TODO angulerjsでもサーバサイドでも動くよう調整する
	*/
	/**
	 * $scope.field
	 * 		フィールド情報。
	 * $scope.socket
	 * 		socket.io。クライアントサイドでAPI使用時に使う。
	 *
	 * this.card
	 * 		選択したカード。
	 */
	battle.doEnterBattlefield = function($scope){
		//場に出せないカードの場合、はじく
		var cardType = this.card.cardType;
		if(cardType == "mana" || cardType == "sorcery") return;

		//マナコストの支払い
		if(doManaCost($scope, this)){
			if(this.card.cardType == "creature") {
				if($scope.field.creatures === void 0){
					$scope.field.creatures = {};
				}

				$scope.field.creatures[this.card.id] = this.card;
			}
			if(this.card.cardType == "enchantField") $scope.field.enchantFields.push(this.card);

			if(this.card.doEnterBattlefield) this.card.doEnterBattlefield($scope.field);
			if(this.card.doUpkeep) $scope.field.upkeeps.push(this.card);
		}

		//クライアントサイドのみ。カードを唱えた事をクローンフィールドへ伝える。
		if($scope.socket) $scope.socket.emit("play", this.card.id);
	};

	/**
	 * マナコストの支払いを行います。
	 */
	function doManaCost($scope, that){
		//マナコストの支払い
		if($scope.field.mana >= that.card.manaCost){
			$scope.field.mana -= that.card.manaCost;
			$scope.field.hands.splice(that.$index, 1);
			return true;
		}

		return false;
	}

	/**
	 * 1体のクリーチャーを破壊します。
	 */
	function doCreatureDestroy(field, enemyField, targetCreature){
		[field, enemyField].forEach(function(field){
			var destroyCreature = field.creatures[targetCreature.id];

			if(destroyCreature === void 0){
				return;
			}else{
				delete field.creatures[targetCreature.id];
				if(destroyCreature.doLeaveBattlefield) destroyCreature.doLeaveBattlefield(field);
			}
		});
	}
})();
