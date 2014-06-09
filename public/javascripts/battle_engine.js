var battle = {};

if(typeof window === "undefined"){
	//server mode
	module.exports = battle;
}

(function(){


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
		if(this.card.cardType == "creature") $scope.field.i.creatures.push(this.card);
		if(this.card.cardType == "enchantField") $scope.field.i.enchantFields.push(this.card);
		
		if(this.card.doEnterBattlefield) this.card.doEnterBattlefield($scope.field);
		if(this.card.doUpkeep) $scope.field.i.upkeeps.push(this.card);
	}
	
	//クライアントサイドのみ。カードを唱えた事をクローンフィールドへ伝える。
	if($scope.socket) $scope.socket.emit("play", this.card.id);
};

/**
 * マナコストの支払いを行います。
 */
function doManaCost($scope, that){
	//マナコストの支払い
	if($scope.field.i.mana >= that.card.manaCost){
		$scope.field.i.mana -= that.card.manaCost;
		$scope.field.i.hands.splice(that.$index, 1);
		return true;
	}
	
	return false;
}



})();
