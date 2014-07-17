/**
 * カードをデータに復調する時、Objectのアクセッサなどはfield情報をクロージャから取得する手法は通用しない為、
 * グローバルに置くようにする。
 */
var field;
var enemyField;

function fieldController($scope, $http){
	$http({
		"method":"get",
		"url":"http://localhost:3000/battle/api/id"
	}).success(function(id){
		console.log(id);
		if(id.result) main(id.value);
	});
	
	function main(url){
		var socket = io.connect(url);
		
		/*
		 * shuffle->
		 * 			<-first draw
		 * hand to mana(任意)->
		 * play(任意)->
		 * activated ability(任意)->
		 * attack step(必須)->
		 * 			<-enemy turn
		 * 			<-
		 * 			<-
		 * 			<-enemy turn end
		 * 			<-untap step
		 * 			<-upkeep step
		 * 			<-draw step
		 * ...
		 *
		 * shuffleを二人が送信すると、first drawが二人に送信される。
		 * first draw後からturnとenemy turnが発生する
		 */
		socket.on("connect", function(){
			console.log("connect");
		
			socket.emit("shuffle", navigator.userAgent);
		
			socket.on("first draw", function(field){
				console.log("first draw");
				$scope.field = field;
				$scope.$apply();
			});
			
			socket.on('enemy', function(enemyField){
				console.log('enemy hand to mana');
				console.log(enemyField);
				$scope.enemyField = enemyField;
				$scope.$apply();
			});
			
			socket.on('block step', function(enemyField){
				console.log('block step');
				$scope.enemyField = enemyField;
				$scope.$apply();

				//TODO ブロックステップ開始時の処理をここに置く
				$scope.isBlockStep = true;

				socket.emit('clone field?');
			});

			socket.on('untap step', function(field){
				$scope.field = field;
				$scope.$apply();
			});

			socket.on('clone field!', function(field){
				$scope.field = field;
				$scope.$apply();
			});
		});
	
		$scope.socket = socket;
	
		//敵を含むすべての場のルート
		field = $scope.field = {
			"life":20,
			"mana":0,
			"creatures":{},
			"enchantFields":[],
			"upkeeps":[],
			"deck":[
				{},{},{}
			],
			"hands":[],
			'turn':'enemy turn',
			/**
			 * 場と手札にあるカードをIDで探索出来るよう再構築します。
			 */
			reload:function(){
				//場と手札にあるカードをIDで探索出来るデータ構造です。
				//{カードID:カードオブジェクト, ...}
				this.cards = {};
			
				["creatures", "hands", "enchantFields"].forEach(function(undeck){
					this["i"][undeck].forEach(function(card){
						this.cards[card.id] = card;
					}, this);
				}, this);
			
				["creatures", "enchantFields"].forEach(function(undeck){
					this["enemy"][undeck].forEach(function(card){
						this.cards[card.id] = card;
					}, this);
				}, this);
			}
		};

		enemyField = $scope.enemyField = {
			"life":20,
			"mana":0,
			"creatures":[],
			"enchantFields":[],
			"upkeeps":[],
			"deck":[
				{},{},{}
			],
			"hands":[]
		}
		
		/**
		 * カードを手札から捨て、マナに変換します。
		 */
		$scope.doManaCostDiscard = function(){
			if(this.card.doManaCostDiscard){
				this.card.doManaCostDiscard($scope.field);
			}else{
				$scope.field.mana++;
			}

			$scope.field.hands.splice(this.$index, 1);
			
			socket.emit("hand to mana", this.card.id);
		};

		/**
		 * カードを場に出します。
		 */
		$scope.doEnterBattlefield = function(){
			battle.doEnterBattlefield.call(this, $scope);
		};
	
		/**
		 * タップを行います。
		 */
		$scope.doTap = function(){
			if(!this.card.tap){
				this.card.tap = true;
				if(this.card.doTap) this.card.doTap($scope.field);
			}
		
			socket.emit("activated ability", this.card.id);
		};
	
		$scope.doAttack = function(){
			this.card.isAttack = !this.card.isAttack;
		};
	
		/**
		 * 呪文を唱えます。
		 */
		$scope.doCast = function(){
			//対象を取る場合、対象選択モードへ移行
			if("targetLength" in this.card && !$scope.castCard) {
				$scope.targets = [];
				$scope.castCard = this.card
				return;
			}
		
			if(doManaCost(this)){
				delete $scope.castCard;
				if(this.card.doCast) this.card.doCast($scope.field, $scope.targets);
			}
		
			socket.emit("play", this.card.id);
		};
	
		/**
		 * 対象に指定します。
		 */
		$scope.doTargetSelected = function(){
			//memo:this.cardだと密結合かもしれない。
			$scope.targets.push(this.card);
		};
	
		/**
		 * ブロックステップに関する関数群です。
		 */
		(function(){
			$scope.block = [];
			$scope.enemyAttacker = {};
			var selectBlocker;
		
			/**
			 * ブロック対象を決定します。
			 */
			$scope.selectAttacker = function(creature){
				$scope.block.push({
					"attacker":creature
				});
			};
		
			/**
			 * ブロックを行うクリーチャーを決定します。
			 */
			$scope.selectBlocker = function(creature){
				$scope.block[$scope.block.length - 1].blocker = creature;
			};
		
			/**
			 * ブロック判定を行います。
			 */
			$scope.doBlockStep = function(){
				var blockerQueue = [];
			
				//戦闘
				$scope.block.forEach(function(pair){
					//アタッカーとブロッカーが紐づいていない場合、処理を飛ばす
					if(pair.attacker === void 0 || pair.blocker === void 0) return;

					var attacker = pair.attacker;
					var blocker = pair.blocker;
				
					blocker.toughness -= attacker.power;
				
					if(blocker.toughness >= 1){
						attacker.toughness -= blocker.power;
					}
				});
			
				//戦闘後、タフネスが0になったクリーチャーを墓地に送る
				$scope.block.forEach(function(pair){
					if(pair.attacker === void 0 || pair.blocker === void 0) return;

					var attacker = pair.attacker;
					var blocker = pair.blocker;
				
					if(blocker.toughness <= 0){
						doCreatureDestroy(blocker);
					}
				
					if(attacker.toughness <= 0){
						doCreatureDestroy(attacker);
					}
				});
			
				//TODO ブロックしなかったクリーチャーはプレイヤーにダメージを与える
			
				//ブロックステップの終了
				$scope.isBlockStep = false;
				socket.emit('block step');
				socket.emit('untap step');
			};
		})();
	
		//テスト用？
		$scope.turnStart = function(){
			//アンタップステップ
			$scope.field.creatures.forEach(function(creature){
				creature.tap = false;
			});
			$scope.field.enchantFields.forEach(function(enchantField){
				enchantField.tap = false;
			});
		
			//ドローステップ
			field.hands.push(field.i.deck.shift());
		
			//アップキープステップ
			field.upkeeps.forEach(function(card){
				card.doUpkeep($scope.field);
			});
		
			//メインステップ以降はユーザの操作
			//攻撃・終了ステップは別メソッドで
		};
	
		/**
		 * 自分のターンを終了します
		 */
		$scope.turnEnd = function(){
			var creatures = Object.keys($scope.field.creatures).filter(function(key){
				return $scope.field.creatures[key].isAttack;
			}).map(function(key){
				return $scope.field.creatures[key].id;
			});

			console.log(creatures);

			socket.emit("attack step", creatures);
		};
	
		$scope.testEnemyAttack = function(){
			$scope.field.creatures[0].isAttack = true;
		};
	
		/**
		 * マナコストの支払いを行います。
		 */
		function doManaCost(that){
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
		function doCreatureDestroy(targetCreature){
			[field, enemyField].forEach(function(field){
				field.creatures.some(function(creature, index){
					if(creature == targetCreature) {
						field[player].creatures.splice(index, 1);
						if(creature.doLeaveBattlefield) creature.doLeaveBattlefield(field);
						return true;
					}
				});
			});
		}
	}
}


angular.module('yayoi', []).directive('enemyTurn', function(){
	return function(scope, iElement, iAttrs){
		if(scope.field === void 0 || scope.field.turn === 'enemy turn'){
			$('button', iElement).attr('disabled', true);
		}else if(scope.field.turn === 'my turn'){
			$('button', iElement).attr('disabled', false);
		}
	};
});
