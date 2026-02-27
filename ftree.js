$(document).ready(docMain);

/*
 * Naming for assignment question (b): paths M1->M3, M1->M5, and M1->M5 through S2.
 * Hosts (machines): M1, M2, M3, ... in fixed order (left-to-right by ToR/leaf, then position under that switch).
 * Switches: S1, S2, S3, ... bottom-to-top then left-to-right: ToR/leaf first, then aggregation, then spine.
 * "S2" means the switch with that global index; count paths that include node S2 to answer "how many M1->M5 go through S2".
 */

var conf = new Object();
conf['depth'] = 3;
conf['width'] = 8;
conf['mode'] = 'fat-tree';

var controlVisible = true;

function docMain() {
    formInit();
    updateModeVisibility();
    redraw();
    $(document).keypress(kpress);
}

function kpress(e) {
    if (e.which == 104) { // 'h'
        if (controlVisible) {
            controlVisible = false;
            $("div.control").hide();
        } else {
            controlVisible = true;
            $("div.control").show();
        }
    }
}

function redraw() {
    var mode = conf['mode'] || 'fat-tree';
    if (mode === 'jupiter') {
        drawJupiter();
    } else if (mode === 'dgx') {
        drawDGX();
    } else {
        drawFatTree(conf['depth'], conf['width']);
    }
}

function updateModeVisibility() {
    var mode = conf['mode'] || 'fat-tree';
    var depthInput = document.querySelector("input[name=depth]");
    var widthInput = document.querySelector("input[name=width]");
    if (mode === 'fat-tree') {
        $("li.fat-tree-only").show();
        $("li.fixed-mode-note").hide();
        if (depthInput) { depthInput.disabled = false; }
        if (widthInput) { widthInput.disabled = false; }
    } else {
        $("li.fat-tree-only").show();
        $("li.fixed-mode-note").show();
        if (depthInput) { depthInput.disabled = true; }
        if (widthInput) { widthInput.disabled = true; }
        if (mode === 'jupiter') {
            if (depthInput) { depthInput.value = "3"; }
            if (widthInput) { widthInput.value = "—"; }
        } else if (mode === 'dgx') {
            if (depthInput) { depthInput.value = "2"; }
            if (widthInput) { widthInput.value = "—"; }
        }
    }
}

function drawFatTree(depth, width) {
    var k = Math.floor(width / 2);
    var padg = 18;
    var padi = 16;
    var hline = 90;
    var hhost = 60;

    var podw = 10;
    var podh = 10;
    var hostr = 3;

    var kexp = function (n) { return Math.pow(k, n); };

    d3.select("svg.main").remove();   
    if (kexp(depth - 1) > 1500 || depth <= 0 || k <= 0) {
        return;
    }

    var w = Math.max(1200, kexp(depth - 1) * padg + 280);
    var h = Math.max(700, (2 * depth) * hline);

    var svg = d3.select("body").append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "main")
        .append("g")
        .attr("transform", "translate(" + w/2 + "," + h/2 + ")");

    var linePositions = [];

    function podPositions(d) {
        var ret = [];

        var ngroup = kexp(d);
        var pergroup = kexp(depth - 1 - d);

        var wgroup = pergroup * padg;
        var wgroups = wgroup * (ngroup - 1);
        var offset = -wgroups/2;

        for (var i = 0; i < ngroup; i++) {
            var wpods = pergroup * padi;
            var goffset = wgroup * i - wpods/2;
            
            for (var j = 0; j < pergroup; j++) {
                ret.push(offset + goffset + padi * j);
            }
        }

        return ret
    }

    for (var i = 0; i < depth; i++) {
        linePositions[i] = podPositions(i);
    }

    function drawPods(list, y) {
        for (var j = 0, n = list.length; j < n; j++) {
            svg.append("rect")
                .attr("class", "pod")
                .attr("width", podw)
                .attr("height", podh)
                .attr("x", list[j] - podw/2)
                .attr("y", y - podh/2);
        }
    }

    function drawHost(x, y, dy, dx) {
        svg.append("line")
            .attr("class", "cable")
            .attr("x1", x)
            .attr("y1", y)
            .attr("x2", x + dx)
            .attr("y2", y + dy);

        svg.append("circle")
            .attr("class", "host")
            .attr("cx", x + dx)
            .attr("cy", y + dy)
            .attr("r", hostr);
    }

    function drawHosts(list, y, direction) {
        for (var i = 0; i < list.length; i++) {
            if (k == 1) {
                drawHost(list[i], y, hhost * direction, 0);
            } else if (k == 2) {
                drawHost(list[i], y, hhost * direction, -2);
                drawHost(list[i], y, hhost * direction, +2);
            } else if (k == 3) {
                drawHost(list[i], y, hhost * direction, -4);
                drawHost(list[i], y, hhost * direction, 0);
                drawHost(list[i], y, hhost * direction, +4);
            } else {
                drawHost(list[i], y, hhost * direction, -4);
                drawHost(list[i], y, hhost * direction, 0);
                drawHost(list[i], y, hhost * direction, +4);
            }
        }
    }
    
    function linePods(d, list1, list2, y1, y2) {
        var pergroup = kexp(depth - 1 - d);
        var ngroup = kexp(d);

        var perbundle = pergroup / k;
        
        for (var i = 0; i < ngroup; i++) {
            var offset = pergroup * i;
            for (var j = 0; j < k; j++) {
                var boffset = perbundle * j;
                for (var t = 0; t < perbundle; t++) {
                    var ichild = offset + boffset + t;
                    for (var d = 0; d < k; d++) {
                        var ifather = offset + perbundle * d + t;
                        svg.append("line")
                            .attr("class", "cable")
                            .attr("x1", list1[ifather])
                            .attr("y1", y1)
                            .attr("x2", list2[ichild])
                            .attr("y2", y2);
                    }
                }
            }
        }
    }

    for (var i = 0; i < depth - 1; i++) {
        linePods(i, linePositions[i], linePositions[i + 1], i * hline, (i + 1) * hline);
        linePods(i, linePositions[i], linePositions[i + 1], -i * hline, -(i + 1) * hline);
    }

    drawHosts(linePositions[depth - 1], (depth - 1) * hline, 1);
    drawHosts(linePositions[depth - 1], -(depth - 1) * hline, -1);

    for (var i = 0; i < depth; i++) {
        if (i == 0) {
            drawPods(linePositions[0], 0);
        } else {
            drawPods(linePositions[i], i * hline);
            drawPods(linePositions[i], -i * hline);
        }
    }
}

/*
 * Jupiter: 3-tier Clos (spine -> aggregation -> ToR). Sizes: 8 spine x 1 group, 4 agg x 2 groups, 16 ToR x 2 groups.
 * Hosts: M1..M32 (1 per ToR), left-to-right by ToR index. Switches: S1..S32 ToR, S33..S40 aggregation, S41..S48 spine (one global consecutive order for question (b)).
 */
function drawJupiter() {
    var number_of_spine_blocks_per_group = 8;
    var number_of_spine_groups = 1;
    var number_of_aggregation_blocks_per_group = 4;
    var number_of_aggregation_groups = 2;
    var number_of_ToR_blocks_per_group = 16;
    var number_of_ToR_groups = 2;
    var padg = 18;
    var padi = 16;
    var hline = 90;
    var hhost = 65;
    var podw = 10;
    var podh = 10;
    var hostr = 3;

    d3.select("svg.main").remove();

    function podPositions(blocks_per_group, number_of_groups) {
        var ret = [];
        var wgroup = blocks_per_group * padg;
        var wgroups = wgroup * (number_of_groups - 1);
        var offset = -wgroups / 2;
        for (var i = 0; i < number_of_groups; i++) {
            var wpods = blocks_per_group * padi;
            var goffset = wgroup * i - wpods / 2;
            for (var j = 0; j < blocks_per_group; j++) {
                ret.push(offset + goffset + padi * j);
            }
        }
        return ret;
    }

    var linePositions = [];
    linePositions[0] = podPositions(number_of_spine_blocks_per_group, number_of_spine_groups);
    linePositions[1] = podPositions(number_of_aggregation_blocks_per_group, number_of_aggregation_groups);
    linePositions[2] = podPositions(number_of_ToR_blocks_per_group, number_of_ToR_groups);

    var w = Math.max(1200, number_of_ToR_blocks_per_group * number_of_ToR_groups * padi + 280);
    var h = Math.max(450, 3 * hline + hhost + 100);
    var topMargin = 30;
    var svg = d3.select("body").append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "main")
        .append("g")
        .attr("transform", "translate(" + w / 2 + "," + topMargin + ")");

    function drawPods(list, y) {
        for (var j = 0, n = list.length; j < n; j++) {
            svg.append("rect")
                .attr("class", "pod")
                .attr("width", podw)
                .attr("height", podh)
                .attr("x", list[j] - podw / 2)
                .attr("y", y - podh / 2);
        }
    }

    function drawHost(x, y, dy, label) {
        svg.append("line")
            .attr("class", "cable")
            .attr("x1", x)
            .attr("y1", y)
            .attr("x2", x)
            .attr("y2", y + dy);
        svg.append("circle")
            .attr("class", "host")
            .attr("cx", x)
            .attr("cy", y + dy)
            .attr("r", hostr);
        if (label) {
            svg.append("text").attr("class", "nodelabel")
                .attr("x", x).attr("y", y + dy + hostr + 10)
                .text(label);
        }
    }

    function linePodsSpineToAgg(parent, child, y1, y2) {
        var number_of_parent_groups = parent.length / number_of_aggregation_blocks_per_group;
        for (var i = 0; i < number_of_parent_groups; i++) {
            for (var ii = 0; ii < number_of_aggregation_blocks_per_group; ii++) {
                var parent_node = i * number_of_aggregation_blocks_per_group + ii;
                for (var iii = 0; iii < number_of_aggregation_groups; iii++) {
                    var child_node = ii + iii * number_of_aggregation_blocks_per_group;
                    svg.append("line")
                        .attr("class", "cable")
                        .attr("x1", parent[parent_node])
                        .attr("y1", y1)
                        .attr("x2", child[child_node])
                        .attr("y2", y2);
                }
            }
        }
    }

    function linePodsAggToToR(parent, child, y1, y2) {
        for (var i = 0; i < number_of_aggregation_groups; i++) {
            for (var ii = 0; ii < number_of_aggregation_blocks_per_group; ii++) {
                var parent_node = i * number_of_aggregation_blocks_per_group + ii;
                var child_start = i * number_of_ToR_blocks_per_group;
                for (var iii = 0; iii < number_of_ToR_blocks_per_group; iii++) {
                    var child_node = child_start + iii;
                    svg.append("line")
                        .attr("class", "cable")
                        .attr("x1", parent[parent_node])
                        .attr("y1", y1)
                        .attr("x2", child[child_node])
                        .attr("y2", y2);
                }
            }
        }
    }

    linePodsSpineToAgg(linePositions[0], linePositions[1], 0, 1 * hline);
    linePodsAggToToR(linePositions[1], linePositions[2], 1 * hline, 2 * hline);

    drawPods(linePositions[0], 0);
    drawPods(linePositions[1], 1 * hline);
    drawPods(linePositions[2], 2 * hline);

    for (var i = 0; i < linePositions[0].length; i++) {
        svg.append("text").attr("class", "switchlabel")
            .attr("x", linePositions[0][i]).attr("y", -4)
            .text("S" + (41 + i));
    }
    for (var i = 0; i < linePositions[1].length; i++) {
        svg.append("text").attr("class", "switchlabel")
            .attr("x", linePositions[1][i]).attr("y", 1 * hline - 4)
            .text("S" + (33 + i));
    }
    for (var i = 0; i < linePositions[2].length; i++) {
        svg.append("text").attr("class", "switchlabel")
            .attr("x", linePositions[2][i]).attr("y", 2 * hline - 4)
            .text("S" + (1 + i));
    }
    for (var i = 0; i < linePositions[2].length; i++) {
        drawHost(linePositions[2][i], 2 * hline, hhost, "M" + (i + 1));
    }
}

/*
 * DGX SuperPOD (1 SU scaled): 4 spine, 8 leaf, 16 nodes. Hosts M1..M16 (2 per leaf). Switches S1..S8 leaf, S9..S12 spine (one global order for question (b)).
 */
function drawDGX() {
    var number_of_spine = 4;
    var number_of_leaf = 8;
    var number_of_nodes = 16;
    var padg = 26;
    var padi = 24;
    var hline = 85;
    var hhost = 55;
    var podw = 10;
    var podh = 10;
    var hostr = 4;

    d3.select("svg.main").remove();

    function positions(n) {
        var ret = [];
        var total = n * padi;
        var offset = -total / 2;
        for (var i = 0; i < n; i++) {
            ret.push(offset + padi * i);
        }
        return ret;
    }

    var spinePos = positions(number_of_spine);
    var leafPos = positions(number_of_leaf);
    var nodePos = [];
    var nodesPerLeaf = number_of_nodes / number_of_leaf;
    for (var i = 0; i < number_of_leaf; i++) {
        for (var j = 0; j < nodesPerLeaf; j++) {
            var px = leafPos[i] + (j - (nodesPerLeaf - 1) / 2) * (padi / 2);
            nodePos.push(px);
        }
    }

    var w = Math.max(1000, number_of_leaf * padi + 180);
    var h = Math.max(350, 2 * hline + hhost + 100);
    var topMargin = 30;
    var svg = d3.select("body").append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "main")
        .append("g")
        .attr("transform", "translate(" + w / 2 + "," + topMargin + ")");

    function drawPods(list, y) {
        for (var j = 0, n = list.length; j < n; j++) {
            svg.append("rect")
                .attr("class", "pod")
                .attr("width", podw)
                .attr("height", podh)
                .attr("x", list[j] - podw / 2)
                .attr("y", y - podh / 2);
        }
    }

    function drawNode(x, y, dy, label) {
        svg.append("line")
            .attr("class", "cable")
            .attr("x1", x)
            .attr("y1", y)
            .attr("x2", x)
            .attr("y2", y + dy);
        svg.append("circle")
            .attr("class", "host")
            .attr("cx", x)
            .attr("cy", y + dy)
            .attr("r", hostr);
        if (label) {
            svg.append("text").attr("class", "nodelabel")
                .attr("x", x).attr("y", y + dy + hostr + 10)
                .text(label);
        }
    }

    for (var s = 0; s < number_of_spine; s++) {
        for (var l = 0; l < number_of_leaf; l++) {
            svg.append("line")
                .attr("class", "cable")
                .attr("x1", spinePos[s])
                .attr("y1", 0)
                .attr("x2", leafPos[l])
                .attr("y2", hline);
        }
    }
    for (var l = 0; l < number_of_leaf; l++) {
        for (var n = 0; n < nodesPerLeaf; n++) {
            var idx = l * nodesPerLeaf + n;
            var nx = nodePos[idx];
            svg.append("line")
                .attr("class", "cable")
                .attr("x1", leafPos[l])
                .attr("y1", hline)
                .attr("x2", nx)
                .attr("y2", 2 * hline);
            drawNode(nx, 2 * hline, hhost, "M" + (idx + 1));
        }
    }

    drawPods(spinePos, 0);
    drawPods(leafPos, hline);
    for (var s = 0; s < number_of_spine; s++) {
        svg.append("text").attr("class", "switchlabel")
            .attr("x", spinePos[s]).attr("y", -4)
            .text("S" + (9 + s));
    }
    for (var l = 0; l < number_of_leaf; l++) {
        svg.append("text").attr("class", "switchlabel")
            .attr("x", leafPos[l]).attr("y", hline - 4)
            .text("S" + (1 + l));
    }
}

function updateStat() {
    var mode = conf['mode'] || 'fat-tree';
    var nhost, nswitch, ncable, ntx, nswtx;

    if (mode === 'jupiter') {
        nhost = 32;
        nswitch = 8 + 8 + 32;
        ncable = 64 + 128 + 32;
        ntx = 2 * ncable;
        nswtx = ntx - nhost;
        d3.select("#nhost").html(formatNum(nhost));
        d3.select("#nswitch").html(formatNum(nswitch));
        d3.select("#ncable").html(formatNum(ncable));
        d3.select("#ntx").html(formatNum(ntx));
        d3.select("#nswtx").html(formatNum(nswtx));
        return;
    }
    if (mode === 'dgx') {
        nhost = 16;
        nswitch = 4 + 8;
        ncable = 32 + 16;
        ntx = 2 * ncable;
        nswtx = ntx - nhost;
        d3.select("#nhost").html(formatNum(nhost));
        d3.select("#nswitch").html(formatNum(nswitch));
        d3.select("#ncable").html(formatNum(ncable));
        d3.select("#ntx").html(formatNum(ntx));
        d3.select("#nswtx").html(formatNum(nswtx));
        return;
    }

    var w = Math.floor(conf['width'] / 2);
    var d = conf['depth'];
    if (d == 0 || w == 0) {
        d3.select("#nhost").html("&nbsp;");
        d3.select("#nswitch").html("&nbsp;");
        d3.select("#ncable").html("&nbsp;");
        d3.select("#ntx").html("&nbsp;");
        d3.select("#nswtx").html("&nbsp;");
        return;
    }

    var line = Math.pow(w, d - 1);

    nhost = 2 * line * w;
    nswitch = (2 * d - 1) * line;
    ncable = (2 * d) * w * line;
    ntx = 2 * (2 * d) * w * line;
    nswtx = ntx - nhost;

    d3.select("#nhost").html(formatNum(nhost));
    d3.select("#nswitch").html(formatNum(nswitch));
    d3.select("#ncable").html(formatNum(ncable));
    d3.select("#ntx").html(formatNum(ntx));
    d3.select("#nswtx").html(formatNum(nswtx));
}

function formatNum(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}

function formInit() {
    var form = d3.select("form");

    function confInt() {
        conf[this.name] = parseInt(this.value);
        updateStat();
        redraw();
    }

    function confMode() {
        conf["mode"] = this.value;
        updateModeVisibility();
        updateStat();
        redraw();
    }

    function hook(name, func) {
        var fields = form.selectAll("[name=" + name + "]");
        fields.on("change", func);
        fields.each(func);
    }

    hook("depth", confInt);
    hook("width", confInt);

    var modeSelect = form.selectAll("[name=mode]");
    modeSelect.on("change", confMode);
    if (modeSelect.node()) {
        conf["mode"] = modeSelect.property("value");
    }
}

