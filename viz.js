d = document; // get elements & start by retrieving the subject:
wl = window.location;
subj = d.getElementById("subjsel");
subj.value = wl.search.substr(5) == "" ? "2" : wl.search.substr(5);
subj.oninput = function (e) {
	wl.href = "index.html?sbj=" + subj.value;
};

function loadScript(url, callback) {
	var script = d.createElement("script");
	script.type = "text/javascript";
	script.src = url;
	script.onreadystatechange = callback;
	script.onload = callback;
	d.head.appendChild(script);
}

var plotData = function () {
	const ids = [...Array(ecg.length).keys()];
	const data = [ids, ecg, eda, emg, tmp, acx, acy, acz, rsp];
	const e4ids = new Array(e4bvp.length);
	e4ids[0] = 0.0;
	for (var i = 1; i < e4ids.length; i++) {
		e4ids[i] = e4ids[i - 1] + ecg.length / e4ids.length;
	}
	const e4data = [e4ids, e4bvp, e4acx, e4acy, e4acz, e4eda, e4tmp, e4hr];
	let uSync = uPlot.sync("both");
	// wheel scroll zoom
	const wheelZoomHk = [
		(u) => {
			let rect = u.over.getBoundingClientRect();
			u.over.addEventListener(
				"wheel",
				(e) => {
					e.preventDefault();
					console.log(u);
					let oxRange = u.scales.x.max - u.scales.x.min;
					let nxRange = e.deltaY < 0 ? oxRange * 0.95 : oxRange / 0.95;
					let nxMin =
						u.posToVal(u.cursor.left, "x") -
						(u.cursor.left / rect.width) * nxRange;
					if (nxMin < 0) nxMin = 0;
					let nxMax = nxMin + nxRange;
					if (nxMax > u.data[0][u.data[0].length - 1])
						nxMax = u.data[0][u.data[0].length - 1];
					u.batch(() => {
						uPlot.sync(u.cursor.sync.key).plots.forEach((p) => {
							p.setScale("x", { min: nxMin, max: nxMax });
						});
					});
				},
				{ passive: true },
			);
		},
	];
	const drawClearHk = [
		(u) => {
			for (var i = 0; i < pos.length - 1; i++) {
				if (lbl[i] != "null" && lbl[i] != "") {
					startPos = u.valToPos(pos[i], "x", true);
					width = u.valToPos(pos[i + 1], "x", true) - startPos;
					if (lbl[i].includes("Base")) u.ctx.fillStyle = "#F0FFE0";
					else if (lbl[i].includes("Fun")) u.ctx.fillStyle = "#FFFFE0";
					else if (lbl[i].includes("TSST")) u.ctx.fillStyle = "#FFF0F0";
					else if (lbl[i].includes("Medi")) u.ctx.fillStyle = "#FFF0FF";
					else u.ctx.fillStyle = "#F0F0FF";
					u.ctx.fillRect(startPos, u.bbox.top, width, u.bbox.height + 20);
				}
			}
		},
	];
	const drawHk_top = [
		(u) => {
			u.ctx.textAlign = "center";
			for (var i = 0; i < pos.length - 1; i++) {
				if (lbl[i] != "null" && lbl[i] != "") {
					startPos = u.valToPos(pos[i], "x", true);
					width = u.valToPos(pos[i + 1], "x", true) - startPos;
					u.ctx.fillStyle = "black";
					u.ctx.fillText(lbl[i], startPos + width / 2, u.bbox.height);
				}
			}
			u.ctx.textAlign = "left";
			u.ctx.fillText("respiration", 2, u.valToPos(rsp[0], "y", true));
			u.ctx.fillText("acceleration", 2, u.valToPos(acy[0], "y", true));
			u.ctx.fillText("temperature", 2, u.valToPos(tmp[0], "y", true));
			u.ctx.fillText("EMG", 2, u.valToPos(emg[0], "y", true));
			u.ctx.fillText("EDA", 2, u.valToPos(eda[0], "y", true));
			u.ctx.fillText("ECG", 2, u.valToPos(ecg[0], "y", true));
		},
	];
	const drawHk_btm = [
		(u) => {
			u.ctx.textAlign = "center";
			for (var i = 0; i < pos.length - 1; i++) {
				if (lbl[i] != "null" && lbl[i] != "") {
					startPos = u.valToPos(pos[i], "x", true);
					width = u.valToPos(pos[i + 1], "x", true) - startPos;
					u.ctx.fillStyle = "black";
					u.ctx.fillText(lbl[i], startPos + width / 2, u.bbox.height);
				}
			}
			u.ctx.textAlign = "left";
			u.ctx.fillText("BVP", 2, u.valToPos(e4bvp[0], "y", true));
			u.ctx.fillText("acceleration", 2, u.valToPos(e4acy[0], "y", true));
			u.ctx.fillText("EDA", 2, u.valToPos(e4eda[0], "y", true));
			u.ctx.fillText("temperature", 2, u.valToPos(e4tmp[64], "y", true));
			console.log(e4tmp[5]);
			u.ctx.fillText("HR", 2, u.valToPos(e4hr[0], "y", true));
		},
	];
	const cursorOpts = {
		lock: true,
		sync: { key: "a" },
		y: false,
	};
	let opts = {
		id: "topChart",
		width: window.innerWidth - 9,
		height: 320,
		series: [
			{ fill: false, ticks: { show: false } },
			{ label: "ecg", stroke: "purple" },
			{ label: "eda", stroke: "grey" },
			{ label: "emg", stroke: "blue" },
			{ label: "tmp", stroke: "red" },
			{ label: "acx", stroke: "green" },
			{ label: "acy", stroke: "blue" },
			{ label: "acz", stroke: "red" },
			{ label: "rsp", stroke: "green" },
		],
		cursor: cursorOpts,
		hooks: { draw: drawHk_top, drawClear: drawClearHk, ready: wheelZoomHk },
		axes: [{}, { scale: "readings", side: 1, grid: { show: true } }],
		scales: { auto: false, x: { time: false } },
		legend: { show: false },
	};
	let resp_plot = new uPlot(opts, data, document.body);

	let e4_opts = {
		id: "btmChart",
		width: window.innerWidth - 9,
		height: 320,
		series: [
			{ fill: false, ticks: { show: false } },
			{ label: "bvp", stroke: "purple" },
			{ label: "acx", stroke: "red" },
			{ label: "axy", stroke: "green" },
			{ label: "axz", stroke: "blue" },
			{ label: "eda", stroke: "grey" },
			{ label: "temperature", stroke: "red" },
			{ label: "hr", stroke: "red" },
		],
		cursor: cursorOpts,
		hooks: { draw: drawHk_btm, drawClear: drawClearHk, ready: wheelZoomHk },
		axes: [{}, { scale: "readings", side: 1, grid: { show: true } }],
		scales: { auto: false, x: { time: false } },
		legend: { show: false },
	};
	let e4_plot = new uPlot(e4_opts, e4data, document.body);

	cursorOverride = d.getElementsByClassName("u-cursor-x");
	for (i of [0, 1]) cursorOverride[i].style = "border-right:3px solid #FF2D7D;";

	uSync.sub(resp_plot);
	uSync.sub(e4_plot);

	for (id of ["topChart", "btmChart"])
		d.getElementById(id).style.border = "solid";
	d.body.appendChild(
		d
			.createElement("p")
			.appendChild(
				d.createTextNode(
					"Scroll wheel zooms in and out, double-click resets the plot, click&drag to zoom a selection.",
				),
			),
	);
};

loadScript("dta" + subj.value + ".js", plotData);
