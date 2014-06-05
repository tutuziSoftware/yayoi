(function(){
	
	/**
	 * 場にあるクリーチャーによってパワーとタフネスが変化するクリーチャーを生成する為の関数です。
	 *
	 * @param creature クリーチャーカード
	 */
	function createFieldDependCreature(creature){
		//シャローコピー
		var newCreature = Object.keys(creature).reduce(function(newCreature, key){
			newCreature[key] = creature[key];
			return newCreature;
		}, {});
		
		//クリーチャーのサイズ設定
		var creatureSizeSetting = {};
		
		["power", "toughness"].forEach(function(creatureSize){
			if(typeof creature[creatureSize] === "object" && "creatureType" in creature[creatureSize]){
				var creatureType = creature[creatureSize].creatureType;
				var _default = creature[creatureSize]["default"];
				
				creatureSizeSetting[creatureSize] = {
					"get":function(){
						//クリーチャーサイズが場に出ているクリーチャーのクリーチャータイプ総数で増減する場合、
						//そのクリーチャーには_powerと_toughnessというプロパティが追加されます。
						var name = "_"+creatureSize;
						
						if(name in this){
							return this[name] + getCreatureX(field, this, creatureType);
						}else{
							this[name] = _default;
							return this[name];
						}
					},
					"set":function(_){
						this["_"+creatureSize] += _ - this[creatureSize];
					}
				}
			}else{
				//クリーチャータイプが指定されていない場合、default値を普通のpowerとして扱う
				var _default = creature[creatureSize];
				
				creatureSizeSetting[creatureSize] = {
					"get":function(){
						if(name in this){
							return this[name];
						}else{
							this[name] = _default;
							return this[name];
						}
					},
					"set":function(_){
						this["_"+creatureSize] = _;
					}
				}
			}
		}, this);
		
		
		Object.defineProperties(newCreature, creatureSizeSetting);
		
		return newCreature;
	};
	
	/**
	 * 場にあるクリーチャータイプの総数を返します。
	 *
	 * @param field
	 * @param card					自分が場に出ているかどうかを判定する為に使用します
	 * @param creatureType	数えるクリーチャータイプ
	 */
	function getCreatureX(field, card, creatureType){
		//場に出ていない場合、Xの計算を行わない
		if(field.i.creatures.every(function(creature){
			return creature != card;
		}, this)) return 0;
		
		return field.i.creatures.reduce(function(x, creature){
			if(creature.creatureType == creatureType){
				x++;
			}
			
			return x;
		}, 0);
	}
	
	return [
		{
			"name":"灰色熊",
			"cardType":"creature",
			"creatureType":"熊",
			"flavorText":"標準的な自然というものを教えてくれる、かわいい毛玉さ",
			"manaCost":1,
			"power":2,
			"toughness":2
		},
		{
			"name":"機械神",
			"cardType":"creature",
			"creatureType":"機械",
			"flavorText":"人が機械に合わせて動くのだ",
			"manaCost":3,
			"power":5,
			"toughness":5
		},
		{
			"name":"半機",
			"cardType":"creature",
			"creatureType":"機械",
			"flavorText":"彼の口は機械による利便性を説いた。しかし彼の無くした腕は痛みを訴えた。　ーーー機械神",
			"caption":"アップキープ時に、あなたは1点のライフを失う。アップキープ時に、あなたはカードを1枚引く",
			"manaCost":2,
			"power":2,
			"toughness":2,
			"doUpkeep":function (field){
				//アップキープ時に、あなたは1点のライフを失う
				field.i.life--;
		
				//アップキープ時に、あなたはカードを1枚引く
				field.i.hands.push(field.i.deck.shift());
			}
		},
		{
			"name":"次世代半機",
			"cardType":"creature",
			"creatureType":"機人",
			"flavorText":"この世代は機械神に干渉されず、人の奴隷にもならず、共感する者と共に生きた。\n城壁、機械、洞窟のいずれにも属さない者達である。　ーーーナビキ",
			"caption":"アップキープ時に、あなたはカードを1枚引く",
			"manaCost" : 2,
			"power" : 0,
			"toughness" : 1,
			"doUpkeep" : function (field){
				//アップキープ時に、あなたはカードを1枚引く
				field.i.hands.push(field.i.deck.shift());
			}
		},
		//TODO $http読み込み時に関数が存在しない為ここでエラーになると思われる。
		createFieldDependCreature({
			"name":"民兵",
			"cardType":"creature",
			"creatureType":"人",
			"flavorText":"機械から自衛する為に、人々は団結を選んだ。しかし市長はそれを良しとはしなかった。",
			"caption":"あなたの場にあるクリーチャータイプ「人」の総数をXとする。このクリーチャーは0/+Xの修正を受ける。",
			"manaCost" : 1,
			"power" : 1,
			"toughness":{
				"default":1,
				"creatureType":"人"
			}
		}),
		{
			"name":"機械の死",
			"cardType" : "creature",
			"creatureType":"機械",
			"flavorText":"自我もなく、命令は聞かず、ただ漫然と動いている状態。それが、死である　ーーー機械神",
			"caption":"このカードが場離れた時、クリーチャータイプ「機械」の2/2トークンを1つ場に出す",
			"manaCost" :3,
			"power" : 2,
			"toughness" : 2,
			"doLeaveBattlefield":function(field){
				field.i.creatures.push({
					"name":"錯乱した機械",
					"cardType" : "creature",
					"creatureType":"機械",
					"power":2,
					"toughness":2,
				});
			}
		},
		{
			"name":"爆破",
			"cardType":"sorcery",
			"flavorText":"機械の本当の死とは、物理的破壊を意味していない",
			"caption":"クリーチャータイプ「機械」を一体指定する。そのクリーチャーを破壊する。",
			"manaCost" : 1,
			"targetLength" : 1,
			"canTarget" : function(card){
				return "creatureType" in card && card.creatureType == "機械";
			},
			"doCast" : function (field, targetCreatures){
				//対象がクリーチャータイプ「機械」ではない事を確認する
				if(this.canTarget(targetCreatures[0]) == false) return;
		
				//対象の破壊
				doCreatureDestroy(targetCreatures[0]);
			}
		},
		{
			"name":"恐怖",
			"cardType":"sorcery",
			"flavorText":"恐怖を感じない事が機械化であるのなら、優秀な民兵は精神が機械化されているという事だ",
			"caption":"クリーチャータイプ「機械」ではないクリーチャーを一体指定する。そのクリーチャーを破壊する。",
			"manaCost" : 1,
			"targetLength" : 1,
			"canTarget" : function(card){
				return "creatureType" in card && card.creatureType != "機械";
			},
			"doCast" : function (field, targetCreatures){
				//対象がクリーチャータイプ「機械」の場合、何もしない
				if(this.canTarget(targetCreatures[0]) == false) return;
		
				//対象の破壊
				doCreatureDestroy(targetCreatures[0]);
			}
		},
		{
			"name":"市民",
			"cardType" : "creature",
			"creatureType":"人",
			"flavorText":"納税は義務である。　ーーー市長",
			"manaCost" : 0,
			"power" : 1,
			"toughness" : 1
		},
		{
			"name":"ナビキの激怒",
			"cardType":"sorcery",
			"flavorText":"ナビキは自身の境遇と、価値がなくなった孤児を重ねあわせたわけではなかった。ひれ伏すのなら最初から私を讃えよと言いたかったのだ。　ーーー民兵長リリー",
			"manaCost" : 4,
			"doCast" : function (field){
				//すべてのクリーチャーを破壊する
				["i", "enemy"].forEach(function(player){
					field[player].creatures.forEach(function(creature){
						if(creature.doLeaveBattlefield) creature.doLeaveBattlefield(field);
					});
		
					field[player].creatures = [];
				});
			}
		},
		{
			"name":"機械奴隷",
			"cardType" : "creature",
			"creatureType":"機械",
			"flavorText":"機械は人の為に動くのだ",
			"manaCost" : 1,
			"power" : 1,
			"toughness" : 1,
			"doUpkeep" : function (field){
				//アップキープの開始時に、あなたは1点のライフを得る
				field.i.life++;
			}
		},
		{
			"name":"虚像",
			"cardType" : "creature",
			"creatureType" : "影",
			"flavorText":"象、ひかり、焦熱",
			"manaCost" : 1,
			"power" : 2,
			"toughness" : 1,
			"doEnterBattlefield" : function (field){
				//このカードが場に出た時、あなたの場に1/2のトークン・クリーチャーを配置します
				this.token = {
					"name" : "実像",
					"cardType" : "creature",
					"creatureType" : "天使",
					"flavorText":"映写装置が彼女自身とは正反対の人物像を映し出した為、のちの人々は清らかな天使を想像し崇める事が出来た。",
					"manaCost" : 4,
					"power" : 1,
					"toughness" : 2,
				};
		
				field.i.creatures.push(this.token);
			},
			"doLeaveBattlefield" : function(field){
				//このカードが場を離れた時、このカードが配置したトークン・クリーチャーを場から取り除きます。
				field.i.creatures.some(function(creature, i){
					if(this.token == creature){
						field.i.creatures.splice(i, 1);
						return true;
					}
				});
			}
		},
		{
			"name" : "マナ採掘施設",
			"cardType" : "enchantField",
			"flavorText" : "掘っていれば、そのうちでるっさ。 ーーー採掘嬢",
			"manaCost" : 2,
			"doTap" : function (field){
				//このカードをタップする：マナプールに1点のマナを加える。
				field.i.mana++;
			}
		},
		{
			"name" : "妄想の天使",
			"cardType" : "creature",
			"creatureType" : "天使",
			"flavorText" : "心の内に理想を飼っている",
			"manaCost" : 0,
			"power" : 0,
			"toughness" : 1,
			"doEnterBattlefield" : function (field){
				//このカードが場に出た時、あなたはデッキからカードを三枚引く
				[0,1,2].forEach(function(){
					field.i.hands.push(field.i.deck.shift());
				});
			},
			"doLeaveBattlefield" : function (field){
				//このカードが場を離れた時、あなたは全ての手札を捨てる
				field.i.hands = [];
			}
		},
		{
			"name" : "マナ",
			"cardType":"mana",
			"flavorText" : "",
			"manaCost" : 0,
			"doManaCostDiscard" : function (field){
				field.i.mana += 2;
			}
		},
		createFieldDependCreature({
			"name":"民兵長リリー",
			"cardType" : "creature",
			"creatureType":"人",
			"flavorText":"市長の意のままに操れる人物が民兵長として選ばれた。確かに、民兵長は市長の言うままに動いた。最初だけは。",
			"manaCost" : 2,
			"power":{
				"default":1,
				"creatureType":"人"
			},
			"toughness":{
				"default":1,
				"creatureType":"人"
			}
		})
	];
})();
