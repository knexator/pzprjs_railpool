//
// パズル固有スクリプト部 黒マスはどこだ版 kurodoko.js v3.2.4
//
Puzzles.kurodoko = function(){ };
Puzzles.kurodoko.prototype = {
	setting : function(){
		// グローバル変数の初期設定
		if(!k.qcols){ k.qcols = 9;}	// 盤面の横幅
		if(!k.qrows){ k.qrows = 9;}	// 盤面の縦幅
		k.irowake = 0;			// 0:色分け設定無し 1:色分けしない 2:色分けする

		k.iscross      = 0;		// 1:Crossが操作可能なパズル
		k.isborder     = 0;		// 1:Border/Lineが操作可能なパズル
		k.isextendcell = 0;		// 1:上・左側にセルを用意するパズル 2:四方にセルを用意するパズル

		k.isoutsidecross  = 0;	// 1:外枠上にCrossの配置があるパズル
		k.isoutsideborder = 0;	// 1:盤面の外枠上にborderのIDを用意する
		k.isLineCross     = 0;	// 1:線が交差するパズル
		k.isCenterLine    = 0;	// 1:マスの真ん中を通る線を回答として入力するパズル
		k.isborderAsLine  = 0;	// 1:境界線をlineとして扱う

		k.dispzero      = 0;	// 1:0を表示するかどうか
		k.isDispHatena  = 0;	// 1:qnumが-2のときに？を表示する
		k.isAnsNumber   = 0;	// 1:回答に数字を入力するパズル
		k.isArrowNumber = 0;	// 1:矢印つき数字を入力するパズル
		k.isOneNumber   = 0;	// 1:部屋の問題の数字が1つだけ入るパズル
		k.isDispNumUL   = 0;	// 1:数字をマス目の左上に表示するパズル(0はマスの中央)
		k.NumberWithMB  = 0;	// 1:回答の数字と○×が入るパズル

		k.BlackCell     = 1;	// 1:黒マスを入力するパズル
		k.NumberIsWhite = 1;	// 1:数字のあるマスが黒マスにならないパズル
		k.RBBlackCell   = 1;	// 1:連黒分断禁のパズル

		k.ispzprv3ONLY  = 1;	// 1:ぱずぷれv3にしかないパズル
		k.isKanpenExist = 1;	// 1:pencilbox/カンペンにあるパズル

		//k.def_csize = 36;
		//k.def_psize = 24;
		k.area = { bcell:0, wcell:1, number:0};	// areaオブジェクトで領域を生成する

		base.setTitle("黒どこ(黒マスはどこだ)","Kurodoko");
		base.setExpression("　左クリックで黒マスが、右クリックで白マス確定マスが入力できます。",
						   " Left Click to input black cells, Right Click to input determined white cells.");
		base.setFloatbgcolor("rgb(127, 191, 0)");

		enc.pidKanpen = 'kurodoko';
	},
	menufix : function(){
		menu.addUseToFlags();
		menu.addRedBlockRBToFlags();
	},

	//---------------------------------------------------------
	//入力系関数オーバーライド
	input_init : function(){
		// マウス入力系
		mv.mousedown = function(){
			if(kc.isZ ^ pp.getVal('dispred')){ this.dispRed();}
			else if(k.editmode){
				if(!kp.enabled()){ this.inputqnum();}
				else{ kp.display();}
			}
			else if(k.playmode) this.inputcell();
		};
		mv.mouseup = function(){ };
		mv.mousemove = function(){
			if(k.playmode) this.inputcell();
		};

		// キーボード入力系
		kc.keyinput = function(ca){
			if(ca=='z' && !this.keyPressed){ this.isZ=true; return;}
			if(k.playmode){ return;}
			if(this.moveTCell(ca)){ return;}
			this.key_inputqnum(ca);
		};
		kc.keyup = function(ca){ if(ca=='z'){ this.isZ=false;}};
		kc.isZ = false;

		if(k.EDITOR){
			kp.generate(0, true, false, '');
			kp.kpinput = function(ca){
				kc.key_inputqnum(ca);
			};
		}

		bd.nummaxfunc = function(cc){ return k.qcols+k.qrows-1;};
	},

	//---------------------------------------------------------
	//画像表示系関数オーバーライド
	graphic_init : function(){
		pc.gridcolor = pc.gridcolor_DLIGHT;
		pc.bcolor = pc.bcolor_GREEN;
		pc.setBGCellColorFunc('qsub1');

		pc.fontsizeratio = 0.85;
		pc.circleratio = [0.42, 0.42];

		pc.paint = function(x1,y1,x2,y2){
			this.flushCanvas(x1,y1,x2,y2);
		//	this.flushCanvasAll();

			this.drawBGCells(x1,y1,x2,y2);
			this.drawGrid(x1,y1,x2,y2);
			this.drawBlackCells(x1,y1,x2,y2);

			this.drawCircledNumbers(x1,y1,x2,y2);

			this.drawChassis(x1,y1,x2,y2);

			this.drawTarget(x1,y1,x2,y2);
		};
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	encode_init : function(){
		enc.pzlimport = function(type){
			this.decodeNumber16();
		};
		enc.pzlexport = function(type){
			this.encodeNumber16();
		};

		enc.decodeKanpen = function(){
			fio.decodeCellQnum_kanpen();
		}
		enc.encodeKanpen = function(){
			fio.encodeCellQnum_kanpen();
		};

		//---------------------------------------------------------
		fio.decodeData = function(){
			this.decodeCellQnum();
			this.decodeCellAns();
		};
		fio.encodeData = function(){
			this.encodeCellQnum();
			this.encodeCellAns();
		};

		fio.kanpenOpen = function(){
			this.decodeCellQnumAns_kanpen();
		};
		fio.kanpenSave = function(){
			this.encodeCellQnumAns_kanpen();
		};
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	answer_init : function(){
		ans.checkAns = function(){

			if( !this.checkSideCell(function(c1,c2){ return (bd.isBlack(c1) && bd.isBlack(c2));}) ){
				this.setAlert('黒マスがタテヨコに連続しています。','Black cells are adjacent.'); return false;
			}

			if( !this.checkOneArea( area.getWCellInfo() ) ){
				this.setAlert('白マスが分断されています。','White cells are devided.'); return false;
			}

			if( !this.checkCellNumber() ){
				this.setAlert('数字と黒マスにぶつかるまでの4方向のマスの合計が違います。','The number and the sum of the coutinuous white cells of four direction is different.'); return false;
			}

			return true;
		};

		ans.checkCellNumber = function(){
			var result = true;
			for(var cc=0;cc<bd.cellmax;cc++){
				if(bd.QnC(cc)<0){ continue;}

				var tx, ty, list = [cc];
				tx = bd.cell[cc].cx-1; ty = bd.cell[cc].cy;
				while(tx>=0)     { var c=bd.cnum(tx,ty); if(bd.isWhite(c)){ list.push(c); tx--;} else{ break;} }
				tx = bd.cell[cc].cx+1; ty = bd.cell[cc].cy;
				while(tx<k.qcols){ var c=bd.cnum(tx,ty); if(bd.isWhite(c)){ list.push(c); tx++;} else{ break;} }
				tx = bd.cell[cc].cx; ty = bd.cell[cc].cy-1;
				while(ty>=0)     { var c=bd.cnum(tx,ty); if(bd.isWhite(c)){ list.push(c); ty--;} else{ break;} }
				tx = bd.cell[cc].cx; ty = bd.cell[cc].cy+1;
				while(ty<k.qrows){ var c=bd.cnum(tx,ty); if(bd.isWhite(c)){ list.push(c); ty++;} else{ break;} }

				if(bd.QnC(cc)!=list.length){
					if(this.inAutoCheck){ return false;}
					bd.sErC(list,1);
					result = false;
				}
			}
			return result;
		};
	}
};
