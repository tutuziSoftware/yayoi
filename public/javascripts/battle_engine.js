var battle = {};

if(typeof window === "undefined"){
	//server mode
	module.exports = battle;
}

(function(){


//TODO angulerjsでもサーバサイドでも動くよう調整する
battle.doEnterBattlefield = function($scope){
	//場に出せないカードの場合、はじく
	var cardType = this.card.cardType;
	if(cardType == "mana" || cardType == "sorcery") return;
	
	//マナコストの支払い
	if(doManaCost(this)){
		if(this.card.cardType == "creature") $scope.field.i.creatures.push(this.card);
		if(this.card.cardType == "enchantField") $scope.field.i.enchantFields.push(this.card);
		
		if(this.card.doEnterBattlefield) this.card.doEnterBattlefield($scope.field);
		if(this.card.doUpkeep) $scope.field.i.upkeeps.push(this.card);
	}
	
	socket.emit("play", this.card.id);
};

/**
 * マナコストの支払いを行います。
 */
function doManaCost(that){
	//マナコストの支払い
	if($scope.field.i.mana >= that.card.manaCost){
		$scope.field.i.mana -= that.card.manaCost;
		$scope.field.i.hands.splice(that.$index, 1);
		return true;
	}
	
	return false;
}



})();
