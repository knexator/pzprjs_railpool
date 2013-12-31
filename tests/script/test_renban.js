/* test_renban.js */

ui.debug.addDebugData('renban', {
	url : '4/4/vmok3g1p5g2h',
	failcheck : [
		['bkDupNum',   "pzprv3/renban/4/4/1 1 1 /1 1 1 /0 1 1 /0 1 1 /1 0 1 0 /0 0 0 0 /1 1 1 0 /1 . . . /. . . . /. . . 5 /. 2 . . /. 3 . . /2 . . . /. 3 . . /. . . . /"],
		['ceEmpty',    "pzprv3/renban/4/4/1 1 1 /1 1 1 /0 1 1 /0 1 1 /1 0 1 0 /0 0 0 0 /1 1 1 0 /1 . . . /. . . . /. . . 5 /. 2 . . /. 3 . . /2 . . . /. 5 . . /4 . . . /"],
		['scDiffLenNe',"pzprv3/renban/4/4/1 1 1 /1 1 1 /0 1 1 /0 1 1 /1 0 1 0 /0 0 0 0 /1 1 1 0 /1 . . . /. . . . /. . . 5 /. 2 . . /. 3 7 . /2 4 8 . /6 5 9 . /3 . 7 . /"],
		[null,         "pzprv3/renban/4/4/1 1 1 /1 1 1 /0 1 1 /0 1 1 /1 0 1 0 /0 0 0 0 /1 1 1 0 /1 . . . /. . . . /. . . 5 /. 2 . . /. 3 7 3 /2 4 8 4 /6 5 9 . /3 . 6 2 /"]
	]
});