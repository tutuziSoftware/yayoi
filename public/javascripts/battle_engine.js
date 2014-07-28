var battle = {};

if(typeof window === "undefined"){
	//server mode
	module.exports = battle;
}

(function(){

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



})();
