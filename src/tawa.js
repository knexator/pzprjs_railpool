//
// パズル固有スクリプト部 たわむれんが版 tawa.js v3.3.0
//
Puzzles.tawa = function(){ };
Puzzles.tawa.prototype = {
	setting : function(){
		// グローバル変数の初期設定
		if(!k.qcols){ k.qcols = 6;}	// 盤面の横幅 本スクリプトでは一番上の段のマスの数を表すこととする.
		if(!k.qrows){ k.qrows = 7;}	// 盤面の縦幅
		k.irowake = 0;			// 0:色分け設定無し 1:色分けしない 2:色分けする

		k.iscross      = 0;		// 1:Crossが操作可能なパズル
		k.isborder     = 0;		// 1:Border/Lineが操作可能なパズル
		k.isextendcell = 0;		// 1:上・左側にセルを用意するパズル 2:四方にセルを用意するパズル

		k.isoutsidecross  = 0;	// 1:外枠上にCrossの配置があるパズル
		k.isoutsideborder = 0;	// 1:盤面の外枠上にborderのIDを用意する
		k.isLineCross     = 0;	// 1:線が交差するパズル
		k.isCenterLine    = 0;	// 1:マスの真ん中を通る線を回答として入力するパズル
		k.isborderAsLine  = 0;	// 1:境界線をlineとして扱う

		k.dispzero      = 1;	// 1:0を表示するかどうか
		k.isDispHatena  = 1;	// 1:qnumが-2のときに？を表示する
		k.isAnsNumber   = 0;	// 1:回答に数字を入力するパズル
		k.isArrowNumber = 0;	// 1:矢印つき数字を入力するパズル
		k.isOneNumber   = 0;	// 1:部屋の問題の数字が1つだけ入るパズル
		k.isDispNumUL   = 0;	// 1:数字をマス目の左上に表示するパズル(0はマスの中央)
		k.NumberWithMB  = 0;	// 1:回答の数字と○×が入るパズル

		k.BlackCell     = 1;	// 1:黒マスを入力するパズル
		k.NumberIsWhite = 1;	// 1:数字のあるマスが黒マスにならないパズル
		k.RBBlackCell   = 0;	// 1:連黒分断禁のパズル

		k.ispzprv3ONLY  = 1;	// 1:ぱずぷれv3にしかないパズル
		k.isKanpenExist = 0;	// 1:pencilbox/カンペンにあるパズル

		//k.def_csize = 36;
		//k.def_psize = 24;
		//k.area = { bcell:0, wcell:0, number:0};	// areaオブジェクトで領域を生成する

		base.setTitle("たわむれんが","Tawamurenga");
		base.setExpression("　左クリックで黒マスが、右クリックで白マス確定マスが入力できます。",
						   " Left Click to input black cells, Right Click to input determined white cells.");
		base.setFloatbgcolor("rgb(64, 64, 64)");
		base.proto = 1;
	},
	menufix : function(){
		menu.addUseToFlags();
		menu.addLabels(ee('pop1_1_cap1x').el, "横幅 (黄色の数)", "Width (Yellows)");
		menu.addLabels(ee('pop1_1_cap2x').el, "高さ",            "Height");
	},

	protoChange : function(){
		this.protofunc = {
			bdinit : Board.prototype.initBoardSize,
			resize_original : base.resize_canvas_only
		};

		Board.prototype.initBoardSize = function(col,row){
			var total = 0;
			if     (this.lap==0){ total = mf(row*0.5)*(2*col-1)+((row%2==1)?col:0);}
			else if(this.lap==3 || this.lap==undefined){ total = mf(row*0.5)*(2*col+1)+((row%2==1)?col:0);}
			else{ total = col*row;}

			this.initGroup(k.CELL, this.cell, total);

			// サイズの変更
			k.qcols = col;
			k.qrows = row;

			// たわむれんが固有処理
			if(!base.initProcess){
				tc.setAlign();
				tc.setTCC(0);
			}

			this.setposAll();
			if(!base.initProcess){ this.allclear();}
		};

		base.resize_canvas_only = function(){
			ee.binder(base, puz.protofunc.resize_original)();

			// Canvasのサイズ変更
			var width  = k.p0.x*2 + k.qcols*k.cwidth + mf(bd.lap==0?0:(bd.lap==3?k.cwidth:k.cwidth/2));
			var height = k.p0.y*2 + k.qrows*k.cheight;
			g.changeSize(width, height);

			var rect = ee('divques').getRect();
			k.cv_oft.x = rect.left;
			k.cv_oft.y = rect.top;
		};

		this.newboard_html_original = document.newboard.innerHTML;
	},
	protoOriginal : function(){
		Board.prototype.initBoardSize = this.protofunc.bdinit;
		base.resize_canvas_only       = this.protofunc.resize_original;
		document.newboard.innerHTML = this.newboard_html_original;

		document.flip.turnl.disabled = false;
		document.flip.turnr.disabled = false;
	},

	//---------------------------------------------------------
	//入力系関数オーバーライド
	input_init : function(){
		// マウス入力系
		mv.mousedown = function(){
			if(k.editmode){
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
			if(k.playmode){ return;}
			if(this.moveTCell(ca)){ return;}
			this.key_inputqnum(ca);
		};
		// xを2倍で渡したい為オーバーライド
		kc.moveTC = function(ca,mv){
			var tcx = tc.cursolx, tcy = tc.cursoly, flag = false;
			if     (ca == k.KEYUP && tcy-mv >= tc.miny){ tc.decTCY(mv); flag = true;}
			else if(ca == k.KEYDN && tcy+mv <= tc.maxy){ tc.incTCY(mv); flag = true;}
			else if(ca == k.KEYLT && tcx-mv >= tc.minx){ tc.decTCX(mv); flag = true;}
			else if(ca == k.KEYRT && tcx+mv <= tc.maxx){ tc.incTCX(mv); flag = true;}

			if(flag){
				pc.paint(tcx-1, (tcy>>1)-1, tcx, tcy>>1);
				pc.paint(tc.cursolx-1, (tc.cursoly>>1)-1, tc.cursolx, tc.cursoly>>1);
				this.tcMoved = true;
			}
			return flag;
		};

		kp.kpgenerate = function(mode){
			this.inputcol('num','knum0','0','0');
			this.inputcol('num','knum1','1','1');
			this.inputcol('num','knum2','2','2');
			this.insertrow();
			this.inputcol('num','knum3','3','3');
			this.inputcol('num','knum4','4','4');
			this.inputcol('num','knum5','5','5');
			this.insertrow();
			this.inputcol('num','knum6','6','6');
			this.inputcol('num','knum.','-','?');
			this.inputcol('num','knum_',' ',' ');
			this.insertrow();
		};

		if(k.EDITOR){
			kp.generate(kp.ORIGINAL, true, false, kp.kpgenerate);
			kp.kpinput = function(ca){
				kc.key_inputqnum(ca);
			};
		}

		this.input_init_menu();
		this.input_init_board();
		this.input_init_menuex();

		bd.maxnum = 6;
	},

	input_init_menu : function(){	// 処理が大きくなったので分割(input_init()から呼ばれる)
		menu.ex.clap = 3;	// bd.lapの初期値(新規作成で選ぶ時用)

		pp.funcs.newboard = function(){
			menu.pop = ee("pop1_1");
			pp.funcs.setimg({0:0,1:2,2:3,3:1}[bd.lap]);
			document.newboard.col.value = (k.qcols+(bd.lap==3?1:0));
			document.newboard.row.value = k.qrows;
			k.enableKey = false;
		};
		pp.funcs.clickimg = function(e){
			pp.funcs.setimg(ee.getSrcElement(e).id.charAt(2));
		};
		pp.funcs.setimg = function(num){
			ee("nb"+menu.ex.clap).parent.style.backgroundColor = '';
			ee("nb"+num).parent.style.backgroundColor = 'red';
			menu.ex.clap = num;
		};

		document.newboard.innerHTML =
			["<span id=\"pop1_1_cap0\">盤面を新規作成します。</span><br>\n",
			 "<input type=\"text\" name=\"col\" value=\"\" size=\"3\" maxlength=\"3\" /> <span id=\"pop1_1_cap1x\">横幅 (黄色の数)</span><br>\n",
			 "<input type=\"text\" name=\"row\" value=\"\" size=\"3\" maxlength=\"3\" /> <span id=\"pop1_1_cap2x\">高さ</span><br>\n",
			 "<table border=\"0\" cellpadding=\"0\" cellspacing=\"2\" style=\"margin-top:4pt;margin-bottom:4pt;\">",
			 "<tr id=\"laps\" style=\"padding-bottom:2px;\">\n",
			 "</tr></table>\n",
			 "<input type=\"button\" name=\"newboard\" value=\"新規作成\" /><input type=\"button\" name=\"cancel\" value=\"キャンセル\" />\n"
			].join('');

		var cw=32, bw=2;

		var img_attr  = {className    : 'clickimg',
						 src          : './src/img/tawa_nb.gif',
						 unselectable : 'on'};
		var img_style = {position : 'absolute', margin   : ""+bw+"px"};
		var EL_NBIMG = ee.addTemplate('','img', img_attr, img_style, {click: ee.ebinder(pp, pp.funcs.clickimg)});

		var div_style = {position : 'relative',
						 display  : 'block',
						 width    : ""+(cw+bw*2)+"px",
						 height   : ""+(cw+bw*2)+"px" };
		var EL_NBDIV = ee.addTemplate('','div', null, div_style, null);

		for(var i=0;i<=3;i++){
			var _img = ee.createEL(EL_NBIMG, 'nb'+i);
			_img.style.left  = "-"+(i*cw)+"px";
			_img.style.clip  = "rect(0px,"+((i+1)*cw)+"px,"+cw+"px,"+(i*cw)+"px)";

			var _div = ee.createEL(EL_NBDIV,'');
			_div.appendChild(_img);

			var _td = _doc.createElement('td');
			_td.appendChild(_div);
			ee('laps').appendEL(_td);
		}
	},
	input_init_board : function(){	// 処理が大きくなったので分割(input_init()から呼ばれる)

		// キー移動範囲のminx,maxx,miny,maxy設定関数オーバーライド
		// このパズルに限って、やたらとtc.maxxが参照されます。。
		tc.getTCC = ee.binder(tc, function(){ return bd.cnum(this.cursolx, this.cursoly>>1);});
		tc.setTCC = function(id){
			if(id<0 || bd.cellmax<=id){ return;}
			this.cursolx = bd.cell[id].cx; this.cursoly = bd.cell[id].cy*2+1;
		};
		tc.incTCY = function(mv){
			this.cursoly+=mv;
			if(this.cursolx==this.minx || (this.cursolx<this.maxx && (this.cursoly>>1)%2==1)){ this.cursolx++;}
			else{ this.cursolx--;}
		};
		tc.decTCY = function(mv){
			this.cursoly-=mv;
			if(this.cursolx==this.maxx || (this.cursolx>this.minx && (this.cursoly>>1)%2==0)){ this.cursolx--;}
			else{ this.cursolx++;}
		};
		tc.setAlign = function(){
			this.minx = 0;
			this.miny = 0;
			this.maxx = (bd.lap==0?2*k.qcols-1:(bd.lap==3?2*k.qcols+1:2*k.qcols))-1;
			this.maxy = 2*k.qrows-1;

			if(bd.cnum(this.cursolx, this.cursoly>>1)==-1){ this.cursolx += (this.cursolx>0?-1:1);}
		};

		// 各セルのcx,cy,px,py変数設定関数
		bd.setposCells = function(){
			this.cellmax = this.cell.length;
			for(var id=0;id<this.cellmax;id++){
				var obj = this.cell[id];
				if(this.lap==0){
					obj.cy = mf((2*id)/(2*k.qcols-1));
					obj.cx = mf((2*id)%(2*k.qcols-1));
				}
				else if(this.lap==1){
					obj.cy = mf(id/k.qcols);
					obj.cx = mf(id%k.qcols)*2+(obj.cy%2==1?1:0);
				}
				else if(this.lap==2){
					obj.cy = mf(id/k.qcols);
					obj.cx = mf(id%k.qcols)*2+(obj.cy%2==0?1:0);
				}
				else if(this.lap==3){
					obj.cy = mf((2*id+1)/(2*k.qcols+1));
					obj.cx = mf((2*id+1)%(2*k.qcols+1));
				}
				obj.px = k.p0.x + mf(obj.cx*k.cwidth/2);
				obj.py = k.p0.y + obj.cy*k.cheight;
			}
		};

		// PositionからのセルID取得
		bd.cnum = function(bx,cy){
			return this.cnum2(bx,cy,k.qcols,k.qrows);
		};
		bd.cnum2 = function(bx,cy,qc,qr){
			if(cy<0||cy>qr-1||bx<0||bx>tc.maxx){ return -1;}
			else if(this.lap==0){
				if((bx+cy)%2==0 && (bx<=tc.maxx || cy%2==0)){ return (bx+cy*(2*qc-1))>>1;}
			}
			else if(this.lap==1){
				if((bx+cy)%2==0 && (bx<=tc.maxx || cy%2==0)){ return (bx>>1)+cy*qc;}
			}
			else if(this.lap==2){
				if((bx+cy)%2==1 && (bx<=tc.maxx || cy%2==1)){ return (bx>>1)+cy*qc;}
			}
			else if(this.lap==3){
				if((bx+cy)%2==1 && (bx<=tc.maxx || cy%2==1)){ return (bx+cy*(2*qc+1))>>1;}
			}
			return -1;
		};

		bd.lap = menu.ex.clap;	// 2段目は => 0:左右引っ込み 1:右のみ出っ張り 2:左のみ出っ張り 3:左右出っ張り
		bd.setLap = function(val){
			bd.lap = val;
			tc.setAlign();
		};
		bd.setLap(bd.lap);

		// マウス入力時のセルID取得系
		mv.cellid = function(){
			var pos = this.cellpos();
			if(this.inputY%k.cheight==0){ return -1;} // 縦方向だけ、ぴったりは無効
			if(pos.x<0 || pos.x>tc.maxx+1 || pos.y<0 || pos.y>k.qrows-1){ return -1;}

			var cand = bd.cnum(pos.x, pos.y);
			cand = (cand!=-1?cand:bd.cnum(pos.x-1, pos.y));
			return cand;
		};
		mv.cellpos = function(){
			return new Pos(mf(this.inputPos.x/(k.cwidth/2)), mf(this.inputPos.y/k.cheight));
		};
	},
	input_init_menuex : function(){	// 処理が大きくなったので分割(input_init()から呼ばれる)

		menu.ex.newboard = function(e){
			if(menu.pop){
				var col = mf(parseInt(document.newboard.col.value));
				var row = mf(parseInt(document.newboard.row.value));
				var slap = {0:0,1:3,2:1,3:2}[this.clap];

				if(col==1 && (slap==0||slap==3)){ menu.popclose(); return;}
				if(slap==3){ col--;}

				if(col>0 && row>0){
					bd.setLap(slap);
					bd.initBoardSize(col,row);

					menu.popclose();

					um.allerase();
					base.resize_canvas();				// Canvasを更新する
				}
			}
		};

		// 盤面の拡大
		menu.ex.expand = function(key){
			// 調節用
			var margin = 0;
			{
				if(key==k.LT){
					k.qcols += {0:0,1:0,2:1,3:1}[bd.lap];
					margin   = mf((k.qrows + {0:0,1:0,2:1,3:1}[bd.lap])/2);
					bd.lap   = {0:2,1:3,2:0,3:1}[bd.lap];
					tc.maxx++;
				}
				else if(key==k.RT){
					k.qcols += {0:0,1:1,2:0,3:1}[bd.lap];
					margin   = mf((k.qrows + {0:0,1:1,2:0,3:1}[bd.lap])/2);
					bd.lap   = {0:1,1:0,2:3,3:2}[bd.lap];
					tc.maxx++;
				}
				else if(key==k.UP){
					k.qrows++;
					tc.maxy+=2;
					if(bd.lap==1||bd.lap==2){ margin = k.qcols;}
					else if(bd.lap==0){ margin = k.qcols-1;}
					else if(bd.lap==3){ margin = k.qcols+1;}

					k.qcols += {0:-1,1:0,2:0,3:1}[bd.lap];
					bd.lap   = {0:3,1:2,2:1,3:0}[bd.lap];
				}
				else if(key==k.DN){
					k.qrows++;
					tc.maxy+=2;
					if(bd.lap==1||bd.lap==2){ margin = k.qcols;}
					else if(bd.lap==0){ margin = k.qcols-1;}
					else if(bd.lap==3){ margin = k.qcols+1;}
				}
			}

			// 本体。
			var func;
			if     (key==k.UP){ func = function(id){ return (bd.cell[id].cy==0);};}
			else if(key==k.DN){ func = function(id){ return (bd.cell[id].cy==k.qrows-1);};}
			else if(key==k.LT){ func = function(id){ return (bd.cell[id].cx<=0);};}
			else if(key==k.RT){ func = function(id){ return (bd.cell[id].cx>=tc.maxx);};}
			this.expandGroup(k.CELL, bd.cell, margin, func);

			bd.setposAll();
			tc.setAlign();
		};
		// 盤面の縮小
		menu.ex.reduce = function(key){
			// 本体。
			var func;
			if     (key==k.UP){ func = function(id){ return (bd.cell[id].cy==0);};}
			else if(key==k.DN){ func = function(id){ return (bd.cell[id].cy==k.qrows-1);};}
			else if(key==k.LT){ func = function(id){ return (bd.cell[id].cx<=0);};}
			else if(key==k.RT){ func = function(id){ return (bd.cell[id].cx>=tc.maxx);};}
			var margin = this.reduceGroup(k.CELL, bd.cell, func);

			// 調節用
			{
				if(key==k.LT){
					k.qcols -= {0:1,1:1,2:0,3:0}[bd.lap];
					bd.lap   = {0:2,1:3,2:0,3:1}[bd.lap];
					tc.maxx--;
				}
				else if(key==k.RT){
					k.qcols -= {0:1,1:0,2:1,3:0}[bd.lap];
					bd.lap   = {0:1,1:0,2:3,3:2}[bd.lap];
					tc.maxx--;
				}
				else if(key==k.UP){
					k.qrows--;
					tc.maxy-=2;
					k.qcols += {0:-1,1:0,2:0,3:1}[bd.lap];
					bd.lap   = {0:3,1:2,2:1,3:0}[bd.lap];
				}
				else if(key==k.DN){
					k.qrows--;
					tc.maxy-=2;
				}
			}

			bd.setposAll();
			tc.setAlign();
		};
		// 回転・反転
		menu.ex.turnflip = function(type,d){
			d.x2 = tc.maxx;
			d.xx = (d.x1+d.x2); d.yy = (d.y1+d.y2);
			if(type==1){ if(k.qrows%2==0){ bd.lap = {0:3,1:2,2:1,3:0}[bd.lap];} }
			else if(type==2){ bd.lap = {0:0,1:2,2:1,3:3}[bd.lap];}

			var func;
			if     (type==1){ func = function(d,id){ return bd.cnum(bd.cell[id].cx, d.yy-bd.cell[id].cy);}; }
			else if(type==2){ func = function(d,id){ return bd.cnum(d.xx-bd.cell[id].cx, bd.cell[id].cy);}; }
			this.turnflipGroup(d, bd.cell, bd.cellmax, func);

			bd.setposAll();
			tc.setAlign();
		};

		document.flip.turnl.disabled = true;
		document.flip.turnr.disabled = true;
	},

	//---------------------------------------------------------
	//画像表示系関数オーバーライド
	graphic_init : function(){
		pc.setBGCellColorFunc('qans1');

		pc.paint = function(x1,y1,x2,y2){
			x1--; x2++;
			this.flushCanvas_tawa(x1+1,y1,x2,y2);
		//	this.flushCanvasAll();

			this.drawBGCells(x1,y1,x2,y2);
			this.drawRDotCells(x1,y1,x2,y2);
			this.drawGrid_tawa(x1,y1,x2,y2);

			this.drawNumbers(x1,y1,x2,y2);

			this.drawTarget_tawa(x1,y1,x2,y2);
		};
		pc.paintAll = function(){ this.paint(0,0,tc.maxx+1,k.qrows); },

		pc.drawGrid_tawa = function(x1,y1,x2,y2){
			if(x1<0){ x1=0;} if(x2>tc.maxx+1){ x2=tc.maxx+1;}
			if(y1<0){ y1=0;} if(y2>k.qrows-1){ y2=k.qrows-1;}

			var lw = mf((k.cwidth/24)>=1?(k.cwidth/24):1);
			var lm = mf((lw-1)/2);
			var headers = ["bdx_", "bdy"];

			g.fillStyle = this.gridcolor;
			var xa = Math.max(x1,0), xb = Math.min(x2+1,tc.maxx+2);
			var ya = Math.max(y1,0), yb = Math.min(y2+1,k.qrows  );
			for(var i=ya;i<=yb;i++){
				if(this.vnop(headers[0]+i,this.NONE)){
					var redx = 0, redw = 0;
					if     ((bd.lap===3 && (i===0||(i===k.qrows&&(i&1)))) || (bd.lap===0 && (i===k.qrows&&!(i&1)))){ redx=1; redw=2;}
					else if((bd.lap===2 && (i===0||(i===k.qrows&&(i&1)))) || (bd.lap===1 && (i===k.qrows&&!(i&1)))){ redx=1; redw=1;}
					else if((bd.lap===1 && (i===0||(i===k.qrows&&(i&1)))) || (bd.lap===2 && (i===k.qrows&&!(i&1)))){ redx=0; redw=1;}
					g.fillRect(mf(k.p0.x+(x1+redx)*k.cwidth/2-lm), mf(k.p0.y+i*k.cheight-lm), (x2-x1+1-redw)*k.cwidth/2+1, lw);
				}
				if(i>k.qrows-1){ break;}

				var xs = xa;
				if((bd.lap===2 || bd.lap===3) ^ ((i&1)!==(xs&1))){ xs++;}
				for(var j=xs;j<=xb;j+=2){
					if(this.vnop([headers[1],i,j].join(""),this.NONE)){
						g.fillRect(mf(k.p0.x+j*k.cwidth/2-lm), mf(k.p0.y+i*k.cheight-lm), lw, k.cheight+1);
					}
				}
			}

			this.vinc();
		};

		pc.drawTarget_tawa = function(x1,y1,x2,y2){
			if(k.playmode){ this.hideTCell(); return;}

			if(tc.cursolx < x1   || x2  +1 < tc.cursolx){ return;}
			if(tc.cursoly < y1*2 || y2*2+2 < tc.cursoly){ return;}

			var px = k.p0.x + mf(tc.cursolx*k.cwidth/2);
			var py = k.p0.y + mf((tc.cursoly-1)*k.cheight/2);
			var w = (k.cwidth<32?2:mf(k.cwidth/16));

			this.vdel(["tc1_","tc2_","tc3_","tc4_"]);
			g.fillStyle = this.targetColor1;
			if(this.vnop("tc1_",this.NONE)){ g.fillRect(px+1,           py+1, k.cwidth-2,  w);}
			if(this.vnop("tc2_",this.NONE)){ g.fillRect(px+1,           py+1, w, k.cheight-2);}
			if(this.vnop("tc3_",this.NONE)){ g.fillRect(px+1, py+k.cheight-w, k.cwidth-2,  w);}
			if(this.vnop("tc4_",this.NONE)){ g.fillRect(px+k.cwidth-w,  py+1, w, k.cheight-2);}

			this.vinc();
		};

		pc.flushCanvas_tawa = function(x1,y1,x2,y2){
			if(g.use.canvas){
				if(x1<=0 && y1<=0 && x2>=tc.maxx+1 && y2>=k.qrows-1){
					this.flushCanvasAll();
				}
				else{
					g.fillStyle = "rgb(255, 255, 255)";
					g.fillRect(k.p0.x+x1*k.cwidth/2, k.p0.y+y1*k.cheight, (x2-x1+1)*k.cwidth/2, (y2-y1+1)*k.cheight);
				}
			}
			else{ this.zidx=1; g.setLayer('layer1');}
		};
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	encode_init : function(){
		enc.pzlimport = function(type){
			this.decodeTawamurenga();
		};
		enc.pzlexport = function(type){
			this.encodeTawamurenga();
		};

		enc.decodeTawamurenga = function(){
			var barray = this.outbstr.split("/");

			bd.setLap(parseInt(barray[0]));
			tc.setAlign();	// tc.maxx等を設定し直す

			bd.initBoardSize(this.uri.cols, this.uri.rows);

			this.outbstr = barray[1];
			this.decodeNumber10();
		};
		enc.encodeTawamurenga = function(){
			this.outbstr = (bd.lap+"/");
			this.encodeNumber10();
		};

		//---------------------------------------------------------
		fio.decodeData = function(){
			bd.setLap(parseInt(this.readLine()));
			var n=0, item = this.getItemList(k.qrows);
			for(var cy=0;cy<k.qrows;cy++){
				for(var bx=0;bx<=tc.maxx;bx++){
					var cc=bd.cnum(bx,cy);
					if(cc==-1){ continue;}
					if     (item[n]=="#"){ bd.setBlack(cc);}
					else if(item[n]=="+"){ bd.sQsC(cc, 1);}
					else if(item[n]=="-"){ bd.sQnC(cc, -2);}
					else if(item[n]!="."){ bd.sQnC(cc, parseInt(item[n]));}
					n++;
				}
			}
		};
		fio.encodeData = function(){
			this.datastr = bd.lap+"/";

			var bstr = "";
			for(var cy=0;cy<k.qrows;cy++){
				for(var bx=0;bx<=tc.maxx;bx++){
					var cc=bd.cnum(bx,cy);
					if(cc==-1){ continue;}
					if     (bd.QnC(cc)==-2){ bstr += "- ";}
					else if(bd.QnC(cc)!=-1){ bstr += (""+bd.QnC(cc).toString()+" ");}
					else if(bd.isBlack(cc)){ bstr += "# ";}
					else if(bd.QsC(cc)== 1){ bstr += "+ ";}
					else{ bstr += ". ";}
				}
				bstr += "/";
			}
			this.datastr += bstr;
		};
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	answer_init : function(){
		ans.checkAns = function(){

			if( !this.checkThreeBlackCells() ){
				this.setAlert('黒マスが横に3マス以上続いています。','Three or more black cells continue horizonally.'); return false;
			}

			if( !this.checkUnderCells() ){
				this.setAlert('黒マスの下に黒マスがありません。','There are no black cells under a black cell..'); return false;
			}

			if( !this.checkNumbers() ){
				this.setAlert('数字の周りに入っている黒マスの数が違います。','The number of black cells around a number is not correct.'); return false;
			}

			return true;
		};

		ans.checkThreeBlackCells = function(){
			var result = true;
			for(var cy=0;cy<k.qrows;cy++){
				var clist = [];
				for(var bx=0;bx<=tc.maxx;bx++){
					var cc = bd.cnum(bx,cy);
					if(cc==-1){ continue;}
					else if(bd.isWhite(cc) || bd.QnC(cc)!=-1){
						if(clist.length>=3){ break;}
						clist=[];
					}
					else{ clist.push(cc);}
				}
				if(clist.length>=3){
					if(this.inAutoCheck){ return false;}
					bd.sErC(clist,1);
					result = false;
				}
			}
			return result;
		};
		ans.checkNumbers = function(){
			var result = true;
			for(var c=0;c<bd.cellmax;c++){
				if(bd.QnC(c)==-1||bd.QnC(c)==-2){ continue;}
				var clist = [];
				clist.push(bd.cnum(bd.cell[c].cx-1,bd.cell[c].cy-1));
				clist.push(bd.cnum(bd.cell[c].cx+1,bd.cell[c].cy-1));
				clist.push(bd.cnum(bd.cell[c].cx-2,bd.cell[c].cy  ));
				clist.push(bd.cnum(bd.cell[c].cx+2,bd.cell[c].cy  ));
				clist.push(bd.cnum(bd.cell[c].cx-1,bd.cell[c].cy+1));
				clist.push(bd.cnum(bd.cell[c].cx+1,bd.cell[c].cy+1));

				var cnt=0;
				for(var i=0;i<clist.length;i++){ if(bd.isBlack(clist[i])){ cnt++;} }

				if(bd.QnC(c)!=cnt){
					if(this.inAutoCheck){ return false;}
					bd.sErC([c],1);
					bd.sErC(clist,1);
					result = false;
				}
			}
			return result;
		};
		ans.checkUnderCells = function(){
			var result = true;
			for(var c=0;c<bd.cellmax;c++){
				if(bd.isWhite(c) || bd.cell[c].cy==k.qrows-1){ continue;}

				if(bd.isWhite(bd.cnum(bd.cell[c].cx-1,bd.cell[c].cy+1)) &&
				   bd.isWhite(bd.cnum(bd.cell[c].cx+1,bd.cell[c].cy+1)))
				{
					if(this.inAutoCheck){ return false;}
					bd.sErC([c],1);
					bd.sErC([bd.cnum(bd.cell[c].cx-1,bd.cell[c].cy+1)],1);
					bd.sErC([bd.cnum(bd.cell[c].cx+1,bd.cell[c].cy+1)],1);
					result = false;
				}
			}
			return result;
		};
	}
};
