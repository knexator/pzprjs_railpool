// test/variety.js
//  usage: mocha
// jshint node:true, browser:false, es3:false, esnext:true
/* global describe:false, it:false */

var assert = require('assert');

var testdata = {};
global.ui = {debug:{addDebugData: function(pid,data){ testdata = data;}}};

var pzpr = require('../dist/pzpr.js'); // jshint ignore:line
var puzzle = new pzpr.Puzzle();

var props = ['ques', 'qdir', 'qnum', 'qnum2', 'qchar', 'qans', 'anum', 'line', 'qsub', 'qcmp'];

function bd_freezecopy(bd1){
	var bd2 = {cell:[],cross:[],border:[],excell:[]};
	for(var group in bd2){
		for(var c=0;c<bd1[group].length;c++){
			bd2[group][c] = {};
			for(var a of props){ bd2[group][c][a] = bd1[group][c][a];}
		}
	}
	return bd2;
}
function assert_equal_board(bd1,bd2){
	for(var group in bd2){
		for(var c=0;c<bd1[group].length;c++){
			for(var a of props){ assert.equal(bd2[group][c][a], bd1[group][c][a], group+'['+c+'].'+a);}
		}
	}
}
function execmouse(strs){
	var matches = (strs[1].match(/(left|right)(.*)/)[2]||"").match(/x([0-9]+)/);
	var repeat = matches ? +matches[1] : 1;
	for(var t=0;t<repeat;t++){
		var mv = puzzle.mouse;
		mv.btn.Left  = (strs[1].substr(0,4)==="left");
		mv.btn.Right = (strs[1].substr(0,5)==="right");
		
		mv.moveTo(+strs[2], +strs[3]);
		for(var i=4;i<strs.length-1;i+=2){ /* 奇数個の最後の一つは切り捨て */
			mv.lineTo(+strs[i], +strs[i+1]);
		}
		mv.inputEnd(2);
	}
}
function execinput(str){
	var strs = str.split(/,/);
	switch(strs[0]){
		case 'newboard':
			var urls = [puzzle.pid, strs[1], strs[2]];
			if(puzzle.pid==='tawa'){ urls.push(strs[3]);}
			puzzle.open(urls.join("/"));
			break;
		case 'clear':
			puzzle.clear();
			break;
		case 'ansclear':
			puzzle.ansclear();
			break;
		case 'playmode':
			puzzle.modechange(puzzle.MODE_PLAYER);
			break;
		case 'editmode':
			puzzle.modechange(puzzle.MODE_EDITOR);
			break;
		case 'setconfig':
			if     (strs[2]==="true") { puzzle.setConfig(strs[1], true);}
			else if(strs[2]==="false"){ puzzle.setConfig(strs[1], false);}
			else                      { puzzle.setConfig(strs[1], strs[2]);}
			break;
		case 'key':
			for(var i=1;i<strs.length;i++){
				puzzle.key.keyevent(strs[i],0);
				puzzle.key.keyevent(strs[i],1);
			}
			break;
		case 'cursor':
			puzzle.cursor.init(+strs[1], +strs[2]);
			break;
		case 'mouse':
			execmouse(strs);
			break;
	}
}

for(var pid in pzpr.variety.info){
	require('../tests/script/test_'+pid+'.js');
	puzzle.open(pid);

	describe(puzzle.pid+' test', function(){
		describe('URL', function(){
			puzzle.open(puzzle.pid+'/'+testdata.url);
			var urlstr = puzzle.getURL();
			var expurl = 'http://pzv.jp/p.html?'+pzpr.variety.toURLID(puzzle.pid)+'/'+testdata.url;
			it('pzpr URL', function(){
				assert.equal(urlstr, expurl);
			});
			if(!pzpr.variety.info[pid].exists.kanpen){ return;}
			puzzle.open(puzzle.pid+'/'+testdata.url);
			var kanpen_url = puzzle.getURL(pzpr.parser.URL_KANPEN);
			var current_pid = puzzle.pid;
			it('kanpen URL', function(){
				assert.equal(pzpr.parser.parse(kanpen_url).pid, current_pid);

				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				puzzle.open(kanpen_url, function(){ assert_equal_board(bd,bd2);});
			});
		});
		describe('Answer check', function(){
			for(var testcase of testdata.failcheck){
				it('Check: '+testcase[0], function(){
					puzzle.open(testcase[1]);
					assert.equal(puzzle.check()[0], testcase[0]);
				});
			}
		});
		describe('Input check', function(){
			var inps = testdata.inputs || [];
			if(inps.length===0){ return;}
			var config = puzzle.saveConfig(), testcount = 0;
			for(var n=0;n<inps.length;n++){
				var data = inps[n], action = data.input || [];
				action.forEach((a) => execinput(a));
				if(!!data.result){
					testcount++;
					var filestr = puzzle.getFileData();
					var resultstr = data.result.replace(/\//g,'\n');
					it('execinput '+testcount, function(){
						assert.equal(filestr, resultstr);
					});
				}
			}
			puzzle.modechange(puzzle.MODE_PLAYMODE);
			puzzle.restoreConfig(config);
		});
		describe('File I/O', function(){
			var pid = puzzle.pid;
			it('pzpr file', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				var outputstr = puzzle.getFileData(pzpr.parser.FILE_PZPR);

				puzzle.open(pid+'/1/1');
				puzzle.open(outputstr, function(){ assert_equal_board(bd,bd2);});
			});
			if(!pzpr.variety.info[pid].exists.pencilbox){ return;}
			var ignore_qsub = (pid==='fillomino'||pid==='hashikake'||pid==='heyabon'||pid==='kurodoko'||pid==='shikaku'||pid==='tentaisho');
			it('Kanpen file', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				var outputstr = puzzle.getFileData(pzpr.parser.FILE_PBOX);

				puzzle.open(pid+'/1/1');
				var props_sv = props;
				if(ignore_qsub){ props = ['ques', 'qdir', 'qnum', 'qnum2', 'qchar', 'qans', 'anum', 'line', 'qcmp'];}
				puzzle.open(outputstr, function(){ assert_equal_board(bd,bd2);});
				props = props_sv;
			});
			it('Kanpen XML file', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				var outputstr = puzzle.getFileData(pzpr.parser.FILE_PBOX_XML);

				puzzle.open(pid+'/1/1');
				var props_sv = props;
				if(ignore_qsub){ props = ['ques', 'qdir', 'qnum', 'qnum2', 'qchar', 'qans', 'anum', 'line', 'qcmp'];}
				puzzle.open(outputstr, function(){ assert_equal_board(bd,bd2);});
				props = props_sv;
			});
		});
		describe('Turn', function(){
			var relyonupdn   = (pid==='dosufuwa'||pid==='box'||pid==='cojun'||pid==='shugaku');

			if(puzzle.pid==='tawa'){ return;}
			it('turn right', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<4;i++){
					bd.exec.execadjust('turnr');
					if(!relyonupdn||i===3){ assert.equal(puzzle.check()[0], null);}
				}
				assert_equal_board(bd,bd2);
			});
			it('turn right undo', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<4;i++){
					puzzle.undo();
					if(!relyonupdn||i===3){ assert.equal(puzzle.check()[0], null);}
				}
				assert_equal_board(bd,bd2);
			});
			it('turn left', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<4;i++){
					bd.exec.execadjust('turnl');
					if(!relyonupdn||i===3){ assert.equal(puzzle.check()[0], null);}
				}
				assert_equal_board(bd,bd2);
			});
			it('turn left undo', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<4;i++){
					puzzle.undo();
					if(!relyonupdn||i===3){ assert.equal(puzzle.check()[0], null);}
				}
				assert_equal_board(bd,bd2);
			});
		});
		describe('Flip', function(){
			var relyonupdn   = (pid==='dosufuwa'||pid==='box'||pid==='cojun'||pid==='shugaku');
			var relyonanydir = (pid==='box'||pid==='shugaku');

			it('flipX', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<4;i++){
					bd.exec.execadjust('flipx');
					if(!relyonanydir||i===3){ assert.equal(puzzle.check()[0], null);}
				}
				assert_equal_board(bd,bd2);
			});
			it('flipX undo', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<4;i++){
					puzzle.undo();
					if(!relyonanydir||i===3){ assert.equal(puzzle.check()[0], null);}
				}
				assert_equal_board(bd,bd2);
			});
			if(puzzle.pid==='tawa'){ return;}
			it('flipY', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<4;i++){
					bd.exec.execadjust('flipy');
					if(!relyonupdn||i===3){ assert.equal(puzzle.check()[0], null);}
				}
				assert_equal_board(bd,bd2);
			});
			it('flipY undo', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<4;i++){
					puzzle.undo();
					if(!relyonupdn||i===3){ assert.equal(puzzle.check()[0], null);}
				}
				assert_equal_board(bd,bd2);
			});
		});
		describe('Adjust', function(){
			it('expand/reduce', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				['expandup','expanddn','expandlt','expandrt','reduceup','reducedn','reducelt','reducert']
					.forEach(function(a){ bd.exec.execadjust(a);});

				assert_equal_board(bd,bd2);
				assert.equal(puzzle.check()[0], null);
			});
			it('expand/reduce undo', function(){
				var bd = puzzle.board, bd2 = bd_freezecopy(bd);
				for(var i=0;i<8;i++){ puzzle.undo();}

				assert_equal_board(bd,bd2);
				assert.equal(puzzle.check()[0], null);
			});
		});
	});
}