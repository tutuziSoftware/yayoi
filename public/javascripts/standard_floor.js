function controller($scope, $http){
	$scope.players = [];
	
	var socket = io.connect("ws://localhost:3000/standard_floor");
	socket.on("connect", function(){
		socket.on("players", function(users){
			console.log('players');
			console.log(users);
			$scope.players = users;
			$scope.$apply();
		});
	});
}
