function controller($scope, $http){
	$scope.players = [];
	$http({
		"method":"post",
		"url":"http://localhost:3000/standard_floor/api"
	}).success(function(players){
		console.log(players);
		$scope.players = players;
	});
}
