//
// パズル固有スクリプト部 シャカシャカ版 shakashaka.js v3.4.0
//

pzpr.createCustoms('shakashaka', {
//---------------------------------------------------------
// マウス入力系
MouseEvent:{
	mouseinput : function(){
		if(this.owner.playmode){
			var use = +this.owner.getConfig('use_tri');
			if(use===1){
				if(this.btn.Left){
					if(this.mousestart){ this.inputTriangle_corner();}
					else if(this.mousemove && this.inputData!==null){
						this.inputMove();
					}
				}
				else if(this.btn.Right){
					if(this.mousestart || this.mousemove){ this.inputDot();}
				}
			}
			else if(use===2){
				if(this.btn.Left){
					if(this.mousestart){
						this.inputTriangle_pull_start();
					}
					else if(this.mousemove && this.inputData===null){
						this.inputTriangle_pull_move();
					}
					else if(this.mousemove && this.inputData!==null){
						this.inputMove();
					}
					else if(this.mouseend && this.notInputted()){
						this.inputTriangle_pull_end();
					}
				}
				else if(this.btn.Right){
					if(this.mousestart || this.mousemove){ this.inputDot();}
				}
			}
			else if(use===3){
				if(this.mousestart){ this.inputTriangle_onebtn();}
			}
		}
		else if(this.owner.editmode){
			if(this.mousestart){ this.inputqnum();}
		}
	},

	inputMove : function(){
		if(this.inputData>=2 && this.inputData<=5){
			this.inputTriangle_drag();
		}
		else if(this.inputData===0 || this.inputData===-1){
			this.inputDot();
		}
	},

	inputTriangle_corner : function(){
		var cell = this.getcell();
		if(cell.isnull || cell.isNum()){ return;}

		this.inputData = this.checkCornerData(cell);
		if(this.inputData===cell.getQans()){ this.inputData = 0;}

		cell.setAnswer(this.inputData);
		this.mouseCell = cell;
		cell.draw();
	},
	checkCornerData : function(cell){
		var dx = this.inputPoint.bx - cell.bx;
		var dy = this.inputPoint.by - cell.by;
		if(dx<=0){ return ((dy<=0)?5:2);}
		else     { return ((dy<=0)?4:3);}
	},

	inputTriangle_pull_start : function(){
		var cell = this.getcell();
		if(cell.isnull || cell.isNum()){ this.mousereset(); return;}

		// 最初はどこのセルをクリックしたか取得するだけ
		this.firstPoint.set(this.inputPoint);
		this.mouseCell = cell;
	},
	inputTriangle_pull_move : function(){
		var cell = this.mouseCell;
		var dx = (this.inputPoint.bx-this.firstPoint.bx);
		var dy = (this.inputPoint.by-this.firstPoint.by);

		// 一定以上動いていたら三角形を入力
		var diff = 0.33;
		if     (dx<=-diff && dy>= diff){ this.inputData = 2;}
		else if(dx<=-diff && dy<=-diff){ this.inputData = 5;}
		else if(dx>= diff && dy>= diff){ this.inputData = 3;}
		else if(dx>= diff && dy<=-diff){ this.inputData = 4;}

		if(this.inputData!==null){
			if(this.inputData===cell.getQans()){ this.inputData = 0;}
			cell.setAnswer(this.inputData);
		}
		cell.draw();
	},
	inputTriangle_pull_end : function(){
		var dx = (this.inputPoint.bx-this.firstPoint.bx);
		var dy = (this.inputPoint.by-this.firstPoint.by);

		// ほとんど動いていなかった場合は・を入力
		if(Math.abs(dx)<=0.1 && Math.abs(dy)<=0.1){
			var cell = this.mouseCell;
			cell.setAnswer(cell.getQsub()!==1?-1:0);
			cell.draw();
		}
	},

	inputTriangle_drag : function(){
		if(this.inputData===null || this.inputData<=0){ return;}

		var cell = this.getcell();
		if(cell.isnull || cell.isNum()){ return;}

		var dbx=cell.bx-this.mouseCell.bx;
		var dby=cell.by-this.mouseCell.by;
		var tri=this.checkCornerData(cell), ret=null, cur=this.inputData;
		if((dbx===2 && dby===2)||(dbx===-2 && dby===-2)){ // 左上・右下
			if(cur===2||cur===4){ ret=cur;}
		}
		else if((dbx===2 && dby===-2)||(dbx===-2 && dby===2)){ // 右上・左下
			if(cur===3||cur===5){ ret=cur;}
		}
		else if(dbx===0 && dby===-2){ // 上下反転(上側)
			if(((cur===2||cur===3)&&(tri!==cur))||((cur===4||cur===5)&&(tri===cur))){
				ret=[null,null,5,4,3,2][cur];
			}
		}
		else if(dbx===0 && dby===2){  // 上下反転(下側)
			if(((cur===4||cur===5)&&(tri!==cur))||((cur===2||cur===3)&&(tri===cur))){
				ret=[null,null,5,4,3,2][cur];
			}
		}
		else if(dbx===-2 && dby===0){ // 左右反転(左側)
			if(((cur===3||cur===4)&&(tri!==cur))||((cur===2||cur===5)&&(tri===cur))){
				ret=[null,null,3,2,5,4][cur];
			}
		}
		else if(dbx===2 && dby===0){  // 左右反転(右側)
			if(((cur===2||cur===5)&&(tri!==cur))||((cur===3||cur===4)&&(tri===cur))){
				ret=[null,null,3,2,5,4][cur];
			}
		}

		if(ret!==null){
			cell.setAnswer(ret);
			this.inputData = ret;
			this.mouseCell = cell;
			cell.draw();
		}
	},
	inputDot : function(){
		var cell = this.getcell();
		if(cell.isnull || cell.isNum()){ return;}

		if(this.inputData===null){ this.inputData = (cell.getQsub()===1?0:-1);}

		cell.setAnswer(this.inputData);
		this.mouseCell = cell;
		cell.draw();
	},

	inputTriangle_onebtn : function(){
		var cell = this.getcell();
		if(cell.isnull || cell.isNum()){ return;}

		var ans = cell.getAnswer();
		if     (this.btn.Left) { this.inputData = [0,2,1,3,4,5,-1][ans+1];}
		else if(this.btn.Right){ this.inputData = [5,-1,1,0,2,3,4][ans+1];}
		cell.setAnswer(this.inputData);
		this.mouseCell = cell;
		cell.draw();
	}
},

//---------------------------------------------------------
// キーボード入力系
KeyEvent:{
	enablemake : true
},

//---------------------------------------------------------
// 盤面管理系
Cell:{
	numberIsWhite : true,

	maxnum : 4,
	minnum : 0,

	getAnswer : function(){
		if(this.isNum()){ return 0;}
		if     (this.qans>0)  { return this.qans;}
		else if(this.qsub===1){ return -1;}
		return 0;
	},
	setAnswer : function(val){
		if(this.isNum()){ return;}
		this.setQans((val>=2&&val<=5)?val:0);
		this.setQsub((val===-1)?1:0);
	},

	isTri : function(){ return this.qans!==0;}
},
Board:{
	getSlopeWareaInfo : function(){
		var winfo = new this.owner.AreaInfo();
		for(var fc=0;fc<this.cellmax;fc++){ winfo.id[fc]=(this.cell[fc].noNum()?0:null);}
		for(var fc=0;fc<this.cellmax;fc++){
			if(!winfo.emptyCell(this.cell[fc])){ continue;}
			winfo.addRoom();

			var stack=[this.cell[fc]];
			while(stack.length>0){
				var cell=stack.pop();
				if(!winfo.emptyCell(cell)){ continue;}
				winfo.addCell(cell);

				var a=cell.getQans(), b, cell2;
				cell2=cell.up(); if(!cell2.isnull){ b=cell2.getQans(); if(winfo.emptyCell(cell2) && (a!==4&&a!==5) && (b!==2&&b!==3)){ stack.push(cell2);} }
				cell2=cell.dn(); if(!cell2.isnull){ b=cell2.getQans(); if(winfo.emptyCell(cell2) && (a!==2&&a!==3) && (b!==4&&b!==5)){ stack.push(cell2);} }
				cell2=cell.lt(); if(!cell2.isnull){ b=cell2.getQans(); if(winfo.emptyCell(cell2) && (a!==2&&a!==5) && (b!==3&&b!==4)){ stack.push(cell2);} }
				cell2=cell.rt(); if(!cell2.isnull){ b=cell2.getQans(); if(winfo.emptyCell(cell2) && (a!==3&&a!==4) && (b!==2&&b!==5)){ stack.push(cell2);} }
			}
		}
		return winfo;
	}
},
BoardExec:{
	adjustBoardData : function(key,d){
		var k = pzpr.consts;
		var trans = [];
		switch(key){
			case k.FLIPY: trans=[0,1,5,4,3,2]; break;	// 上下反転
			case k.FLIPX: trans=[0,1,3,2,5,4]; break;	// 左右反転
			case k.TURNR: trans=[0,1,5,2,3,4]; break;	// 右90°回転
			case k.TURNL: trans=[0,1,3,4,5,2]; break;	// 左90°回転
			default: return;
		}
		var clist = this.owner.board.cell;
		for(var i=0;i<clist.length;i++){
			var cell = clist[i], val = trans[cell.qans];
			if(!!val){ cell.qans=val;}
		}
	}
},

//---------------------------------------------------------
// 画像表示系
Graphic:{
	hideHatena : true,

	initialize : function(){
		this.Common.prototype.initialize.call(this);

		this.gridcolor = this.gridcolor_LIGHT;
		this.fontcolor = this.fontErrcolor = "white";
		this.setCellColorFunc('qnum');
	},
	paint : function(){
		this.drawBGCells();
		this.drawDotCells(false);
		this.drawDashedGrid();
		this.drawBlackCells();
		this.drawNumbers();

		this.drawTriangle();

		this.drawChassis();

		this.drawTarget();
	}
},

//---------------------------------------------------------
// URLエンコード/デコード処理
Encode:{
	decodePzpr : function(type){
		this.decode4Cell();
	},
	encodePzpr : function(type){
		this.encode4Cell();
	},

	decodeKanpen : function(){
		this.owner.fio.decodeCellQnumb();
	},
	encodeKanpen : function(){
		this.owner.fio.encodeCellQnumb();
	}
},
//---------------------------------------------------------
FileIO:{
	decodeData : function(){
		this.decodeCellQnumb();
		this.decodeCellQanssub();
	},
	encodeData : function(){
		this.encodeCellQnumb();
		this.encodeCellQanssub();
	},

	kanpenOpen : function(){
		this.decodeCell( function(obj,ca){
			if     (ca==="5"){ obj.qnum = -2;}
			else if(ca!=="."){ obj.qnum = parseInt(ca);}
		});
		this.decodeCell( function(obj,ca){
			if     (ca==="+"){ obj.qsub = 1;}
			else if(ca!=="."){ obj.qans = parseInt(ca);}
		});
	},
	kanpenSave : function(){
		this.encodeCell( function(obj){
			if     (obj.qnum>=  0){ return (obj.qnum.toString() + " ");}
			else if(obj.qnum===-2){ return "5 ";}
			else                  { return ". ";}
		});
		this.encodeCell( function(obj){
			if     (obj.qsub=== 1){ return "+ ";}
			else if(obj.qans>=  2){ return (obj.qans.toString() + " ");}
			else                  { return ". ";}
		});
	}
},

//---------------------------------------------------------
// 正解判定処理実行部
AnsCheck:{
	checkAns : function(){

		if( !this.checkOverTriangle() ){ return 'nmTriangleGt';}
		if( !this.checkWhiteArea() ){ return 'wcNotRectx';}
		if( !this.checkLessTriangle() ){ return 'nmTriangleLt';}

		return null;
	},

	checkOverTriangle : function(){
		return this.checkDir4Cell(function(cell){ return cell.isTri();},2);
	},
	checkLessTriangle : function(){
		return this.checkDir4Cell(function(cell){ return cell.isTri();},1);
	},

	checkWhiteArea : function(){
		var result = true;
		var winfo = this.owner.board.getSlopeWareaInfo();
		for(var id=1;id<=winfo.max;id++){
			var clist=winfo.room[id].clist, d=clist.getRectSize();
			var cnt = clist.filter(function(cell){ return (cell.getQans()===0)}).length;
			if(d.cols*d.rows!=cnt && !this.isAreaRect_slope(winfo,id)){
				if(this.checkOnly){ return false;}
				clist.seterr(1);
				result = false;
			}
		}
		return result;
	},
	// 斜め領域判定用
	isAreaRect_slope : function(winfo,id){
		var clist = winfo.room[id].clist;
		for(var i=0;i<clist.length;i++){
			var cell = clist[i], a = cell.getQans();
			if( ((a==4||a==5)^(cell.up().isnull||winfo.getRoomID(cell.up())!=id)) ||
				((a==2||a==3)^(cell.dn().isnull||winfo.getRoomID(cell.dn())!=id)) ||
				((a==2||a==5)^(cell.lt().isnull||winfo.getRoomID(cell.lt())!=id)) ||
				((a==3||a==4)^(cell.rt().isnull||winfo.getRoomID(cell.rt())!=id)) )
			{
				return false;
			}
		}
		return true;
	}
},

FailCode:{
	wcNotRectx : ["白マスが長方形(正方形)ではありません。","A mass of white cells is not rectangle."],
	nmTriangleGt : ["数字のまわりにある黒い三角形の数が間違っています。","The number of triangles in four adjacent cells is bigger than it."],
	nmTriangleLt : ["数字のまわりにある黒い三角形の数が間違っています。","The number of triangles in four adjacent cells is smaller than it."]
}
});