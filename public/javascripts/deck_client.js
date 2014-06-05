function deckController($scope, $http){
	var CARD_SIZE_MAX = 4;
	
	$http({
		"method":"get",
		"url":"http://localhost:3000/javascripts/cards.js"
	}).success(function(cards){
		$scope.cards = eval(cards);
	});
	
	//TODO ここも後でサーバから取得するようにする
	$scope.deck = {};
	
	$scope.add = function(cardName){
		if($scope.deck[cardName] === void 0) $scope.deck[cardName] = 0;
		
		if($scope.deck[cardName] < CARD_SIZE_MAX){
			$scope.deck[cardName]++;
		}else{
			$scope.deck[cardName] = CARD_SIZE_MAX;
		}
	};
	
	$scope.remove = function(cardName){
		if($scope.deck[cardName] === void 0) $scope.deck[cardName] = 0;
		
		if($scope.deck[cardName] > 0){
			$scope.deck[cardName]--;
		}else{
			$scope.deck[cardName] = 0;
		}
	};
	
	$scope.upload = function(){
		$http({
			"method":"post",
			"url":"http://localhost:3000/deck_save",
			"data":$scope.deck
		}).success(function(){
			console.log("upload");
		});
	};
}
