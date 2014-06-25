function controller($scope, $http){
	$scope.players = [];
	
	var standardFloor = io.connect("ws://localhost:3000/standard_floor");
	standardFloor.on("connect", function(){
		standardFloor.on("players", function(users){
			console.log('players');
			console.log(users);
			$scope.players = users;
			$scope.$apply();
		});
		
		standardFloor.on('start', function(){
			console.log('start');
		});
	});
	
	var heartbeat = io.connect("/standard_floor/heartbeat");
	heartbeat.on("connect", function(){
		heartbeat.on('heartbeat', function(status){
			console.log('heartbeat:'+status);
			if(status == 'battle'){
				location.href = '/battle';
			}
		});
	});
	
	$scope.start = function(){
		standardFloor.emit('start');
	};
}
