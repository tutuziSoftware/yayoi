/**
 * カードをデータに復調する時、Objectのアクセッサなどはfield情報をクロージャから取得する手法は通用しない為、
 * グローバルに置くようにする。
 */
var field;

function fieldController($scope, $http){
	$http({
		"method":"get",
		"url":"http://localhost:3000/battle/tester/api/id"
	}).success(function(id){
		main(id);
	});
	
	function main(id){
		var socket = io.connect('http://localhost:3000/battle/tester' + id);
		
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
		
			socket.emit("shuffle", "");
		
			socket.on("first draw", function(field){
				console.log("first draw");
				$scope.field = field;
				$scope.$apply();
			});
		});
	
		$http({
			"method":"get",
			"url":"http://localhost:3000/javascripts/cards.js"
		}).success(function(res){
			var cards = eval(res);
		});
	
		$scope.socket = socket;
	
		//敵を含むすべての場のルート
		field = $scope.field = {
			//自分の情報		
			"i":{
				"life":10,
				"mana":0,
				"creatures":[],
				"enchantFields":[],
				"upkeeps":[],
				"deck":[
					{},{},{}
				],
				"hands":[]
			},
			//相手の情報
			"enemy":{
				"creatures":[],
				"enchantFields":[]
			},
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
	
		//テスト用
		(function(){
			var id = 0;
			var addID = function(card){
				card.id = id;
				id++;
			}
		
			$scope.field.i.hands.forEach(addID);
			$scope.field.enemy.creatures.forEach(addID);
		})();
	
		/**
		 * カードを手札から捨て、マナに変換します。
		 */
		$scope.doManaCostDiscard = function(){
			if(this.card.doManaCostDiscard){
				this.card.doManaCostDiscard($scope.field);
			}else{
				$scope.field.i.mana++;
			}

			$scope.field.i.hands.splice(this.$index, 1);
		
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
		
			//TODO ブロックステップ実装前に、カードに一意なIDを振るようにする
		
			/**
			 * ブロックステップを開始します。
			 */
			$scope.startBlockStep = function(){
				$scope.isBlockStep = true;
			};
		
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
					var attacker = pair.attacker;
					var blocker = pair.blocker;
				
					blocker.toughness -= attacker.power;
				
					if(blocker.toughness >= 1){
						attacker.toughness -= blocker.power;
					}
				});
			
				//戦闘後、タフネスが0になったクリーチャーを墓地に送る
				$scope.block.forEach(function(pair){
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
			};
		})();
	
		//テスト用？
		$scope.turnStart = function(){
			//アンタップステップ
			$scope.field.i.creatures.forEach(function(creature){
				creature.tap = false;
			});
			$scope.field.i.enchantFields.forEach(function(enchantField){
				enchantField.tap = false;
			});
		
			//ドローステップ
			field.i.hands.push(field.i.deck.shift());
		
			//アップキープステップ
			field.i.upkeeps.forEach(function(card){
				card.doUpkeep($scope.field);
			});
		
			//メインステップ以降はユーザの操作
			//攻撃・終了ステップは別メソッドで
		};
	
		/**
		 * 自分のターンを終了します
		 */
		$scope.turnEnd = function(){
			var creatures = $scope.field.i.creatures.filter(function(creature){
				return creature.isAttack;
			});
		
			socket.emit("attack step", creatures);
		};
	
		$scope.testEnemyAttack = function(){
			$scope.field.enemy.creatures[0].isAttack = true;
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
	
		/**
		 * 1体のクリーチャーを破壊します。
		 */
		function doCreatureDestroy(targetCreature){
			["i", "enemy"].forEach(function(player){
				field[player].creatures.some(function(creature, index){
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
