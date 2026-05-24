/* ============================================================
   BEYOND THE PITCH — D3 Visualizations v3
   EPFL COM-480 · 2025
   ============================================================ */

// ── Globals ──────────────────────────────────────────────────
var DATA = null, RACE_DATA = null, CHORD_DATA = null, STREAM_DATA = null;
var TIP = null;

// Colours
var C = {
    gold:'#f5c842', gold2:'#e8a828', rose:'#ff4d6d',
    teal:'#3dd6c0', blue:'#4a90e2', muted:'#8888a8',
    dim:'#55557a', text:'#f0f0f5', bg:'#05050a', bg2:'#0c0c14'
};
var REGION_COLOR = {
    'Europe':'#4a90e2','South America':'#ff4d6d','CONCACAF':'#f5c842','N&C America':'#f5c842','N&C America':'#f5c842',
    'Africa':'#ff9f43','N&C America':'#f5c842','Asia':'#3dd6c0','Oceania':'#a29bfe',
    'Non-FIFA':'#636e72','Other':'#636e72'
};
var CHORD_COLORS = ['#f5c842','#ff4d6d','#3dd6c0','#4a90e2','#a29bfe',
                    '#fd79a8','#55efc4','#fdcb6e','#e17055','#74b9ff'];

// ── Tooltip ────────────────────────────────────────────────────
function initTip() {
    TIP = document.getElementById('tooltip');
}
function tip(html, e) {
    if (!TIP) return;
    TIP.innerHTML = html;
    TIP.classList.add('visible');
    var mx = e.clientX, my = e.clientY;
    var lx = mx + 18 + TIP.offsetWidth > window.innerWidth ? mx - TIP.offsetWidth - 10 : mx + 18;
    var ly = Math.max(8, Math.min(my - TIP.offsetHeight / 2, window.innerHeight - TIP.offsetHeight - 8));
    TIP.style.left = lx + 'px';
    TIP.style.top  = ly + 'px';
}
function hideTip() { if (TIP) TIP.classList.remove('visible'); }

// ── Entry point — wait for window.load ────────────────────────
window.addEventListener('load', function () {
    initTip();
    // Small delay lets browser compute layout
    setTimeout(function () {
        try { initData(); } catch(e) { console.error('Init failed:', e); }
    }, 80);
});

function initData() {
    if (window.BUNDLE) {
        DATA        = window.BUNDLE.data;
        RACE_DATA   = window.BUNDLE.race;
        CHORD_DATA  = window.BUNDLE.chord;
        STREAM_DATA = window.BUNDLE.stream;
        initCharts();
    } else {
        // Fallback fetch (needs local server)
        Promise.all([
            fetch('data/processed/data.json').then(function(r){ return r.json(); }),
            fetch('data/processed/race_data.json').then(function(r){ return r.json(); }),
            fetch('data/processed/chord_data.json').then(function(r){ return r.json(); }),
            fetch('data/processed/stream_data.json').then(function(r){ return r.json(); })
        ]).then(function(results) {
            DATA = results[0]; RACE_DATA = results[1];
            CHORD_DATA = results[2]; STREAM_DATA = results[3];
            initCharts();
        }).catch(function(err) { console.error('Data load failed:', err); });
    }
}

function initCharts() {
    if (!DATA || typeof d3 === 'undefined') {
        console.error('D3 or data not available');
        return;
    }
    var draws = [
        drawTimelineGrowth, initRaceChart, drawWorldMap,
        drawChordDiagram, drawStreamgraph, drawEconomicsChart,
        drawBubbleChart, drawRadialClock, drawActivityChart,
        drawTeamsRanking, drawScatterChart, populateTeamSelects
    ];
    draws.forEach(function(fn) {
        try { fn(); } catch(e) { console.error(fn.name + ' failed:', e); }
    });
}

// helper — get element width with sensible fallback
function elW(el, fallback) {
    var w = el ? el.clientWidth : 0;
    return w > 50 ? w : (fallback || 800);
}

/* ============================================================
   1. TIMELINE GROWTH
   ============================================================ */
function drawTimelineGrowth() {
    var el = document.getElementById('timeline-growth');
    if (!el) return;
    el.innerHTML = '';
    var M = {top:20,right:20,bottom:40,left:50};
    var W = elW(el, 540) - M.left - M.right;
    var H = 320 - M.top - M.bottom;

    var svg = d3.select(el).append('svg')
        .attr('width', W + M.left + M.right)
        .attr('height', H + M.top + M.bottom)
        .style('display','block');
    var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

    var cum = 0;
    var series = DATA.timeline.map(function(d) {
        cum += d.count;
        return {year: d.year, count: cum};
    });

    var x = d3.scaleLinear().domain(d3.extent(series, function(d){return d.year;})).range([0,W]);
    var y = d3.scaleLinear().domain([0, d3.max(series, function(d){return d.count;})]).range([H,0]).nice();

    // Gradient
    var defs = g.append('defs');
    var ag = defs.append('linearGradient').attr('id','tlGrad2')
        .attr('x1','0%').attr('x2','0%').attr('y1','0%').attr('y2','100%');
    ag.append('stop').attr('offset','0%').attr('stop-color',C.gold).attr('stop-opacity',0.35);
    ag.append('stop').attr('offset','100%').attr('stop-color',C.gold).attr('stop-opacity',0.02);

    g.append('g').attr('class','grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-W).tickFormat(''))
        .select('.domain').remove();
    g.selectAll('.grid line').style('stroke','rgba(255,255,255,0.05)');

    var area = d3.area().x(function(d){return x(d.year);}).y0(H).y1(function(d){return y(d.count);}).curve(d3.curveMonotoneX);
    g.append('path').datum(series).attr('fill','url(#tlGrad2)').attr('d',area);

    var line = d3.line().x(function(d){return x(d.year);}).y(function(d){return y(d.count);}).curve(d3.curveMonotoneX);
    var path = g.append('path').datum(series)
        .attr('fill','none').attr('stroke',C.gold).attr('stroke-width',2.5).attr('d',line);
    var len = path.node().getTotalLength();
    path.attr('stroke-dasharray',len).attr('stroke-dashoffset',len)
        .transition().duration(2200).ease(d3.easeCubicOut).attr('stroke-dashoffset',0);

    g.selectAll('.pt').data(series).join('circle').attr('class','pt')
        .attr('cx',function(d){return x(d.year);}).attr('cy',function(d){return y(d.count);})
        .attr('r',3).attr('fill',C.gold).attr('opacity',0.7)
        .on('mousemove',function(e,d){ tip('<div class="tt-title">'+d.year+'</div><span class="tt-val">'+d.count+'</span> nations',e); })
        .on('mouseleave',hideTip);

    [{year:1971,label:'Ban lifts',dy:-28},{year:1991,label:'First WC',dy:-28},{year:2015,label:'24 nations',dy:-28}].forEach(function(ev){
        var pt = series.reduce(function(a,b){ return Math.abs(b.year-ev.year)<Math.abs(a.year-ev.year)?b:a; });
        var ex = x(pt.year), ey = y(pt.count);
        g.append('line').attr('x1',ex).attr('y1',ey).attr('x2',ex).attr('y2',ey+ev.dy)
            .attr('stroke','rgba(255,255,255,0.3)').attr('stroke-width',1).attr('stroke-dasharray','3,2');
        g.append('circle').attr('cx',ex).attr('cy',ey).attr('r',6)
            .attr('fill',C.rose).attr('stroke',C.gold).attr('stroke-width',2);
        g.append('text').attr('x',ex).attr('y',ey+ev.dy-6)
            .attr('text-anchor','middle').attr('fill','rgba(255,255,255,0.7)')
            .attr('font-size','10px').text(ev.label);
    });

    g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')')
        .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6));
    g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5));
}

/* ============================================================
   2. BAR CHART RACE
   ============================================================ */
var raceTimer = null, raceYear = 1956, raceRunning = false;

function initRaceChart() {
    if (!RACE_DATA) return;
    raceYear = 1956;
    drawRaceFrame(1956);
}

function drawRaceFrame(year) {
    var el = document.getElementById('race-chart');
    if (!el || !RACE_DATA) return;

    document.getElementById('race-year').textContent = year;

    var teams = RACE_DATA.teams;
    var allData = RACE_DATA.data;

    var frame = teams.map(function(t) {
        var arr = allData[t];
        var entry = arr ? arr.find(function(d){return d.year===year;}) : null;
        return {team: t, wins: entry ? entry.wins : 0};
    }).sort(function(a,b){return b.wins - a.wins;});

    var M = {top:8,right:80,bottom:10,left:155};
    var W = elW(el, 860) - M.left - M.right;
    var n = Math.min(15, frame.length);
    var barH = 24, rowH = 32;
    var svgH = n * rowH + M.top + M.bottom;

    var svg = d3.select(el).select('svg');
    if (svg.empty()) {
        svg = d3.select(el).append('svg').style('display','block');
        svg.append('g').attr('class','race-g').attr('transform','translate('+M.left+','+M.top+')');
    }
    svg.attr('width', W + M.left + M.right).attr('height', svgH);

    var g = svg.select('.race-g');
    var topF = frame.slice(0, n);
    var maxW = Math.max(1, frame[0].wins);
    var xS = d3.scaleLinear().domain([0, maxW]).range([0, W]);
    var dur = 200;

    // Bars
    var bars = g.selectAll('.rbar').data(topF, function(d){return d.team;});
    bars.enter().append('rect').attr('class','rbar')
        .attr('x',0).attr('y',function(d,i){return i*rowH;}).attr('height',barH)
        .attr('fill',function(d){
            var t = DATA.top_teams.find(function(tt){return tt.team===d.team;});
            return REGION_COLOR[t ? t.region : 'Other'] || C.muted;
        })
        .attr('rx',2).attr('width',0)
        .merge(bars).transition().duration(dur)
        .attr('y',function(d,i){return i*rowH;})
        .attr('width',function(d){return xS(d.wins);});
    bars.exit().remove();

    // Labels
    var labs = g.selectAll('.rlabel').data(topF, function(d){return d.team;});
    labs.enter().append('text').attr('class','rlabel')
        .attr('x',-6).attr('text-anchor','end').attr('fill',C.text)
        .attr('font-size','12px').attr('font-family',"'DM Sans',sans-serif").attr('font-weight','500')
        .merge(labs).transition().duration(dur)
        .attr('y',function(d,i){return i*rowH + barH/2 + 4;})
        .text(function(d){return d.team;});
    labs.exit().remove();

    // Values
    var vals = g.selectAll('.rval').data(topF, function(d){return d.team;});
    vals.enter().append('text').attr('class','rval')
        .attr('fill',C.gold).attr('font-size','12px').attr('font-weight','700')
        .attr('font-family',"'Bebas Neue',sans-serif")
        .merge(vals).transition().duration(dur)
        .attr('x',function(d){return xS(d.wins)+5;})
        .attr('y',function(d,i){return i*rowH + barH/2 + 4;})
        .text(function(d){return d.wins;});
    vals.exit().remove();

    // Rank
    var ranks = g.selectAll('.rrank').data(topF, function(d){return d.team;});
    ranks.enter().append('text').attr('class','rrank')
        .attr('fill',C.dim).attr('font-size','10px')
        .attr('font-family',"'DM Sans',sans-serif")
        .merge(ranks).transition().duration(dur)
        .attr('x', -M.left + 4)
        .attr('y',function(d,i){return i*rowH + barH/2 + 4;})
        .text(function(d,i){return '#'+(i+1);});
    ranks.exit().remove();
}

window.toggleRace = function() {
    if (raceRunning) {
        clearInterval(raceTimer); raceRunning = false;
        document.getElementById('race-btn-label').textContent = '▶ Play';
    } else {
        if (raceYear >= 2025) raceYear = 1956;
        raceRunning = true;
        document.getElementById('race-btn-label').textContent = '⏸ Pause';
        var speed = parseInt(document.getElementById('race-speed').value);
        var delay = Math.max(50, Math.round(400 / speed));
        raceTimer = setInterval(function() {
            raceYear++;
            drawRaceFrame(raceYear);
            if (raceYear >= 2025) {
                clearInterval(raceTimer); raceRunning = false;
                document.getElementById('race-btn-label').textContent = '▶ Play';
            }
        }, delay);
    }
};
window.resetRace = function() {
    clearInterval(raceTimer); raceRunning = false; raceYear = 1956;
    document.getElementById('race-btn-label').textContent = '▶ Play';
    drawRaceFrame(1956);
};

/* ============================================================
   3. WORLD MAP
   ============================================================ */
var mapYear = 1991, mapAnimTimer = null, mapAnimRunning = false;
var mapSvg = null, mapProjection = null, mapPath = null;
var teamFirstYear = {}, worldGeoLoaded = false;

function buildTeamFirstYear() {
    var fy = {};
    DATA.timeline.forEach(function(entry) {
        entry.teams.forEach(function(t){ if (!fy[t]) fy[t] = entry.year; });
    });
    return fy;
}

var countryAliases = {
    'unitedstatesofamerica':'unitedstates','usa':'unitedstates',
    'czechia':'czechrepublic','republicofireland':'ireland',
    'ivorycoast':'cotedivoire','eswatini':'swaziland',
    'democraticrepublicofthecongo':'drcongo','northmacedonia':'macedonia',
    'chinesetaipei':'taiwan'
};

function normKey(n) { return (n||'').toLowerCase().replace(/[^a-z]/g,''); }
function resolveCountry(n) { var k = normKey(n); return countryAliases[k]||k; }

function getCountryStatus(geoName, year) {
    var gk = resolveCountry(geoName);
    var keys = Object.keys(teamFirstYear);
    for (var i=0; i<keys.length; i++) {
        var team = keys[i];
        var tk = resolveCountry(team);
        if (tk===gk || (tk.length>3 && gk.includes(tk)) || (gk.length>3 && tk.includes(gk))) {
            var fy = teamFirstYear[team];
            if (fy<=year) return {status: fy===year?'new':'active', team:team, year:fy};
        }
    }
    return {status:'none'};
}

function drawWorldMap() {
    var el = document.getElementById('world-map');
    if (!el) return;
    el.innerHTML = '';
    teamFirstYear = buildTeamFirstYear();

    var W = elW(el, 880);
    var H = 500;

    mapSvg = d3.select(el).append('svg').attr('width',W).attr('height',H).style('display','block');
    mapProjection = d3.geoNaturalEarth1().scale(153 * W / 960).translate([W/2, H/2+10]);
    mapPath = d3.geoPath(mapProjection);

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(function(r){return r.json();})
        .then(function(world) {
            worldGeoLoaded = true;
            window._worldGeo = world;
            renderMapYear(mapYear);
        })
        .catch(function(e) {
            mapSvg.append('text').attr('x',W/2).attr('y',H/2)
                .attr('text-anchor','middle').attr('fill',C.muted).attr('font-size','14px')
                .text('World map requires internet connection to load TopoJSON');
        });
}

function renderMapYear(year) {
    if (!window._worldGeo || !mapSvg) return;
    var countries = topojson.feature(window._worldGeo, window._worldGeo.objects.countries);
    var active = 0;

    mapSvg.selectAll('.country').data(countries.features).join('path').attr('class','country')
        .attr('d', mapPath)
        .attr('fill', function(d) {
            var s = getCountryStatus(d.properties.name||'', year);
            if (s.status==='new') return C.rose;
            if (s.status==='active') { active++; return C.gold+'99'; }
            return 'rgba(255,255,255,0.06)';
        })
        .attr('stroke','rgba(255,255,255,0.1)').attr('stroke-width',0.4)
        .on('click', function(e,d) {
            var s = getCountryStatus(d.properties.name||'', mapYear);
            if (s.status !== 'none' && typeof CF !== 'undefined') {
                var t = window.DATA.top_teams.find(function(tt){
                    return resolveCountry(tt.team) === resolveCountry(s.team||d.properties.name||'');
                });
                CF.selectCountry(s.team || d.properties.name, t ? t.region : null);
            } else if (typeof CF !== 'undefined') {
                CF.clearSelection();
            }
        })
        .on('mousemove', function(e,d) {
            var s = getCountryStatus(d.properties.name||'', year);
            var name = d.properties.name||'Unknown';
            if (s.status!=='none') {
                var ti = DATA.top_teams.find(function(t){return resolveCountry(t.team)===resolveCountry(name);});
                var extra = ti ? '<br><span class="tt-sub">Wins: '+ti.wins+' · WR: '+ti.win_rate+'%</span>' : '';
                tip('<div class="tt-title">'+(s.team||name)+'</div>First match: <span class="tt-val">'+s.year+'</span>'+extra, e);
                document.getElementById('map-hover-info').textContent = (s.team||name)+' · First match: '+s.year;
            } else {
                hideTip();
                document.getElementById('map-hover-info').textContent = name+' · Not in dataset';
            }
        })
        .on('mouseleave', function(){ hideTip(); document.getElementById('map-hover-info').textContent='Hover a country for details'; });

    if (mapSvg.select('.graticule').empty()) {
        mapSvg.insert('path',':first-child').attr('class','graticule')
            .attr('d',mapPath(d3.geoGraticule()()))
            .attr('fill','none').attr('stroke','rgba(255,255,255,0.03)').attr('stroke-width',0.5);
    }

    // Recount active
    var cnt = Object.keys(teamFirstYear).filter(function(t){return teamFirstYear[t]<=year;}).length;
    document.getElementById('map-team-count').textContent = cnt;
    document.getElementById('map-year-label').textContent = year;
    document.getElementById('map-year-slider').value = year;
}

window.updateMapYear = function(yr) {
    mapYear = parseInt(yr);
    renderMapYear(mapYear);
};
window.toggleMapAnimation = function() {
    var btn = document.getElementById('map-play-btn');
    if (mapAnimRunning) {
        clearInterval(mapAnimTimer); mapAnimRunning = false;
        btn.textContent = '▶ Play';
    } else {
        mapAnimRunning = true; btn.textContent = '⏸ Pause';
        if (mapYear>=2025) mapYear=1956;
        mapAnimTimer = setInterval(function() {
            mapYear++;
            renderMapYear(mapYear);
            if (mapYear>=2025){ clearInterval(mapAnimTimer); mapAnimRunning=false; btn.textContent='▶ Play'; }
        }, 120);
    }
};

/* ============================================================
   4. CHORD DIAGRAM
   ============================================================ */
function drawChordDiagram() {
    var el = document.getElementById('chord-chart');
    if (!el || !CHORD_DATA) return;
    el.innerHTML = '';

    var size = Math.min(elW(el, 660), 640);
    var innerR = size*0.36, outerR = innerR + 22;
    var teams = CHORD_DATA.teams, matrix = CHORD_DATA.matrix;

    var svg = d3.select(el).append('svg').attr('width',size).attr('height',size)
        .style('display','block').style('margin','0 auto')
        .append('g').attr('transform','translate('+(size/2)+','+(size/2)+')');

    var colorScale = d3.scaleOrdinal().domain(teams).range(CHORD_COLORS);
    var chord = d3.chord().padAngle(0.04).sortSubgroups(d3.descending)(matrix);
    var arcGen = d3.arc().innerRadius(innerR).outerRadius(outerR);
    var ribbon = d3.ribbon().radius(innerR-1);

    // Ribbons first (behind arcs)
    svg.append('g').selectAll('path').data(chord).join('path')
        .attr('class','chord-ribbon')
        .attr('d', ribbon)
        .attr('fill', function(d){ return colorScale(teams[d.source.index]); })
        .attr('stroke', function(d){ return d3.color(colorScale(teams[d.source.index])).darker(); })
        .attr('opacity', 0.65)
        .on('mousemove', function(e,d) {
            var t1=teams[d.source.index], t2=teams[d.target.index];
            tip('<div class="tt-title">'+t1+' vs '+t2+'</div>'+t1+': <span class="tt-val">'+d.source.value+' wins</span><br>'+t2+': <span class="tt-val">'+d.target.value+' wins</span>',e);
        })
        .on('mouseleave', hideTip);

    // Groups
    var groups = svg.append('g').selectAll('g').data(chord.groups).join('g');
    groups.append('path').attr('d',arcGen)
        .attr('fill',function(d){return colorScale(teams[d.index]);})
        .attr('stroke','rgba(0,0,0,0.3)').attr('opacity',0.9)
        .on('mousemove',function(e,d){
            var total = d3.sum(matrix[d.index]);
            tip('<div class="tt-title">'+teams[d.index]+'</div>Wins vs top rivals: <span class="tt-val">'+total+'</span>',e);
            svg.selectAll('.chord-ribbon').attr('opacity',function(c){
                return (c.source.index===d.index||c.target.index===d.index)?0.9:0.06;
            });
        })
        .on('mouseleave',function(){
            hideTip();
            svg.selectAll('.chord-ribbon').attr('opacity',0.65);
        });

    groups.each(function(d){ d.angle=(d.startAngle+d.endAngle)/2; });
    groups.append('text')
        .attr('dy','0.35em')
        .attr('transform',function(d){
            return 'rotate('+(d.angle*180/Math.PI-90)+') translate('+(outerR+12)+') '+(d.angle>Math.PI?'rotate(180)':'');
        })
        .attr('text-anchor',function(d){return d.angle>Math.PI?'end':'start';})
        .attr('fill',C.text).attr('font-size','10.5px').attr('font-family',"'DM Sans',sans-serif")
        .text(function(d){return teams[d.index];});

    // Legend
    var legEl = document.getElementById('chord-legend');
    if (legEl) {
        legEl.innerHTML = '';
        teams.forEach(function(t,i){
            var div = document.createElement('div');
            div.className = 'chord-leg-item';
            div.innerHTML = '<div class="chord-leg-swatch" style="background:'+CHORD_COLORS[i]+'"></div>'+t;
            legEl.appendChild(div);
        });
    }
}

/* ============================================================
   5. STREAMGRAPH
   ============================================================ */
function drawStreamgraph() {
    var el = document.getElementById('stream-chart');
    if (!el || !STREAM_DATA) return;
    el.innerHTML = '';

    var M = {top:24,right:30,bottom:44,left:58};
    var W = elW(el, 860) - M.left - M.right;
    var H = 380 - M.top - M.bottom;

    var svg = d3.select(el).append('svg')
        .attr('width', W+M.left+M.right).attr('height', H+M.top+M.bottom).style('display','block');
    var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

    var regions = STREAM_DATA.regions;
    var data = STREAM_DATA.data;
    var streamColors = {
        'Europe':        '#4a90e2',
        'N&C America':   '#f5c842',
        'South America': '#ff4d6d',
        'Asia':          '#3dd6c0',
        'Africa':        '#ff9f43',
        'Oceania':       '#a29bfe'
    };

    var x = d3.scaleLinear().domain(d3.extent(data,function(d){return d.year;})).range([0,W]);

    // Use stackOffsetNone (zero baseline) so y-axis is meaningful
    var stack = d3.stack().keys(regions).offset(d3.stackOffsetNone).order(d3.stackOrderDescending);
    var stacked = stack(data);
    var maxY = d3.max(stacked, function(l){ return d3.max(l, function(d){ return d[1]; }); });
    var y = d3.scaleLinear().domain([0, maxY]).range([H, 0]).nice();

    // Grid lines
    g.append('g').attr('class','grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-W).tickFormat(''))
        .selectAll('line').style('stroke','rgba(255,255,255,0.06)');
    g.select('.grid .domain').remove();

    var area = d3.area()
        .x(function(d){return x(d.data.year);})
        .y0(function(d){return y(d[0]);})
        .y1(function(d){return y(d[1]);})
        .curve(d3.curveBasis);

    // Draw regions
    g.selectAll('.spath').data(stacked).join('path').attr('class','spath')
        .attr('d',area)
        .attr('fill',function(d){return streamColors[d.key]||C.muted;})
        .attr('opacity',0.82)
        .on('mousemove',function(e,d){
            var gNode = g.node();
            var yr = Math.round(x.invert(d3.pointer(e,gNode)[0]));
            var pt = data.find(function(r){return r.year===yr;});
            var val = pt ? pt[d.key] : 0;
            var total = pt ? regions.reduce(function(s,r){ return s + (pt[r]||0); }, 0) : 0;
            var pct = total > 0 ? Math.round(val/total*100) : 0;
            tip('<div class="tt-title">'+d.key+'</div>'+yr+': <span class="tt-val">'+val+' wins</span><br><span class="tt-sub">'+pct+'% of all wins that year</span>',e);
            g.selectAll('.spath').attr('opacity',function(dd){return dd.key===d.key?1:0.15;});
        })
        .on('mouseleave',function(){
            hideTip();
            g.selectAll('.spath').attr('opacity',0.82);
        });

    // Axes
    g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')')
        .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8));
    g.append('g').attr('class','axis')
        .call(d3.axisLeft(y).ticks(5));

    // Y-axis label
    g.append('text')
        .attr('transform','rotate(-90)')
        .attr('y', -M.left + 14)
        .attr('x', -H/2)
        .attr('text-anchor','middle')
        .attr('fill','#b8c4d0')
        .attr('font-size','11px')
        .attr('font-family',"'DM Sans',sans-serif")
        .text('Wins per year');

    // Annotation: 1991 WC trigger line
    var x1991 = x(1991);
    g.append('line').attr('x1',x1991).attr('x2',x1991).attr('y1',0).attr('y2',H)
        .attr('stroke','rgba(245,200,66,0.4)').attr('stroke-width',1).attr('stroke-dasharray','4,3');
    g.append('text').attr('x',x1991+4).attr('y',14)
        .attr('fill','rgba(245,200,66,0.7)').attr('font-size','9px').text('1991 WC');

    // Legend
    var legEl = document.getElementById('stream-legend');
    if (legEl) {
        legEl.innerHTML = '';
        regions.forEach(function(r){
            var d2 = document.createElement('div'); d2.className='stream-leg-item';
            d2.innerHTML = '<div class="stream-leg-swatch" style="background:'+streamColors[r]+'"></div>'+r;
            legEl.appendChild(d2);
        });
    }
}

/* ============================================================
   6. ECONOMICS CHART
   ============================================================ */
function drawEconomicsChart() {
    var el = document.getElementById('economics-chart');
    if (!el) return;
    el.innerHTML = '';

    var wc = DATA.world_cup;
    var M = {top:30,right:30,bottom:50,left:60};
    var W = elW(el, 780) - M.left - M.right;
    var H = 360 - M.top - M.bottom;

    var svg = d3.select(el).append('svg')
        .attr('width',W+M.left+M.right).attr('height',H+M.top+M.bottom).style('display','block');
    var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

    var x = d3.scaleBand().domain(wc.map(function(d){return d.year;})).range([0,W]).padding(0.3);
    var y = d3.scaleLinear().domain([0, 1.05e9]).range([H,0]).nice();
    var xo = x.bandwidth()/2;

    var defs = g.append('defs');
    ['men','women'].forEach(function(k,i){
        var gr = defs.append('linearGradient').attr('id','eg2'+k)
            .attr('x1','0%').attr('x2','0%').attr('y1','0%').attr('y2','100%');
        gr.append('stop').attr('offset','0%').attr('stop-color',i===0?C.teal:C.gold).attr('stop-opacity',0.9);
        gr.append('stop').attr('offset','100%').attr('stop-color',i===0?C.teal:C.gold).attr('stop-opacity',0.35);
    });

    g.append('g').attr('class','grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-W).tickFormat(''))
        .select('.domain').remove();
    g.selectAll('.grid line').style('stroke','rgba(255,255,255,0.05)');
    g.selectAll('.grid text').remove();

    g.selectAll('.bmen').data(wc).join('rect').attr('class','bmen')
        .attr('x',function(d){return x(d.year);}).attr('y',function(d){return y(d.men_prize);})
        .attr('width',xo-2).attr('height',function(d){return H-y(d.men_prize);})
        .attr('fill','url(#eg2men)').attr('rx',2)
        .on('mousemove',function(e,d){tip('<div class="tt-title">'+d.year+' Men\'s WC</div>Prize: <span class="tt-val">$'+(d.men_prize/1e6).toFixed(0)+'M</span>',e);})
        .on('mouseleave',hideTip);

    g.selectAll('.bwom').data(wc).join('rect').attr('class','bwom')
        .attr('x',function(d){return x(d.year)+xo+2;})
        .attr('y',function(d){return d.women_prize>0?y(d.women_prize):H-3;})
        .attr('width',xo-2)
        .attr('height',function(d){return d.women_prize>0?H-y(d.women_prize):3;})
        .attr('fill','url(#eg2women)').attr('rx',2)
        .on('mousemove',function(e,d){tip('<div class="tt-title">'+d.year+' Women\'s WC</div>Prize: <span class="tt-val">$'+(d.women_prize>0?(d.women_prize/1e6).toFixed(0)+'M':'0')+'</span><br>Attendance: '+d.attendance.toLocaleString(),e);})
        .on('mouseleave',hideTip);

    wc.filter(function(d){return d.women_prize===0;}).forEach(function(d){
        g.append('text').attr('x',x(d.year)+xo+xo/2).attr('y',H-5)
            .attr('text-anchor','middle').attr('fill',C.rose).attr('font-size','9px').text('$0');
    });

    var last = wc[wc.length-1];
    g.append('text').attr('x',x(last.year)+x.bandwidth()/2).attr('y',y(last.men_prize)-8)
        .attr('text-anchor','middle').attr('fill',C.rose).attr('font-size','11px').attr('font-weight','600')
        .text('89% gap');

    g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')')
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));
    g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5).tickFormat(function(d){return '$'+(d/1e6|0)+'M';}));

    var legG = g.append('g').attr('transform','translate('+(W-180)+','+-20+')');
    [[C.teal,"Men's WC"],[C.gold,"Women's WC"]].forEach(function(item,i){
        legG.append('rect').attr('x',i*92).attr('y',0).attr('width',12).attr('height',10).attr('rx',2).attr('fill',item[0]);
        legG.append('text').attr('x',i*92+16).attr('y',9).attr('fill',C.muted).attr('font-size','11px').text(item[1]);
    });
}

/* ============================================================
   7. BUBBLE CHART — Scorers
   ============================================================ */
function drawBubbleChart() {
    var el = document.getElementById('bubble-chart');
    if (!el) return;
    el.innerHTML = '';

    var W = elW(el, 880), H = 500;
    var scorers = DATA.top_scorers;
    if (!scorers || !scorers.length) return;

    var svg = d3.select(el).append('svg').attr('width',W).attr('height',H).style('display','block');
    var maxG = d3.max(scorers, function(d){return d.goals;});
    var rScale = d3.scaleSqrt().domain([0,maxG]).range([0,55]);
    var colorOrd = d3.scaleOrdinal().domain(scorers.map(function(d){return d.country;})).range(CHORD_COLORS.concat(d3.schemeTableau10));

    var nodes = scorers.map(function(d) {
        return Object.assign({}, d, {
            r: rScale(d.goals) + 9,
            x: W/2 + (Math.random()-0.5)*200,
            y: H/2 + (Math.random()-0.5)*200
        });
    });

    var sim = d3.forceSimulation(nodes)
        .force('x', d3.forceX(W/2).strength(0.05))
        .force('y', d3.forceY(H/2).strength(0.05))
        .force('collide', d3.forceCollide(function(d){return d.r+4;}).strength(0.85))
        .force('charge', d3.forceManyBody().strength(-8));

    var bubbleG = svg.selectAll('.bub').data(nodes).join('g').attr('class','bub');

    bubbleG.append('circle')
        .attr('r',function(d){return d.r;})
        .attr('fill',function(d){return colorOrd(d.country);})
        .attr('opacity',0.84).attr('stroke','rgba(0,0,0,0.3)').attr('stroke-width',1)
        .on('mousemove',function(e,d){
            tip('<div class="tt-title">'+d.scorer+'</div><span class="tt-sub">'+d.country+'</span><br>Goals: <span class="tt-val">'+d.goals+'</span><br>Career: '+d.first_year+'–'+d.last_year+'<br>Penalties: '+d.penalties,e);
        })
        .on('mouseleave',hideTip);

    bubbleG.append('text').attr('text-anchor','middle').attr('dy','0.35em')
        .attr('fill','rgba(255,255,255,0.95)').attr('pointer-events','none')
        .attr('font-size',function(d){return Math.max(7,Math.min(d.r*0.35,13))+'px';})
        .attr('font-family',"'DM Sans',sans-serif").attr('font-weight','600')
        .text(function(d){return d.r>22 ? d.scorer.split(' ').pop() : '';});

    bubbleG.append('text').attr('text-anchor','middle')
        .attr('dy',function(d){return d.r>22?'1.6em':'0.35em';})
        .attr('fill','rgba(245,200,66,0.9)').attr('pointer-events','none')
        .attr('font-size',function(d){return Math.max(7,Math.min(d.r*0.28,12))+'px';})
        .attr('font-family',"'Bebas Neue',sans-serif")
        .text(function(d){return d.r>16?d.goals:'';});

    sim.on('tick', function() {
        bubbleG.attr('transform', function(d) {
            return 'translate('+Math.max(d.r, Math.min(W-d.r, d.x))+','+Math.max(d.r, Math.min(H-d.r, d.y))+')';
        });
    });

    // ── Size legend: "bubble size = goals" ──────────────────
    var legG = svg.append('g').attr('transform','translate('+( W - 130)+','+(H-90)+')');
    legG.append('text').attr('x',0).attr('y',-8)
        .attr('fill','#b8c4d0').attr('font-size','9px')
        .attr('font-family',"'DM Sans',sans-serif")
        .attr('letter-spacing','0.08em')
        .text('BUBBLE SIZE = GOALS');

    [{ g: maxG, label: maxG+' goals', r: rScale(maxG)+9 },
     { g: Math.round(maxG*0.6), label: Math.round(maxG*0.6)+' goals', r: rScale(Math.round(maxG*0.6))+9 },
     { g: Math.round(maxG*0.3), label: Math.round(maxG*0.3)+' goals', r: rScale(Math.round(maxG*0.3))+9 }
    ].forEach(function(item, i) {
        var cx = 28 + i * 42;
        var cy = 28 + (rScale(maxG)+9) - item.r;
        legG.append('circle').attr('cx',cx).attr('cy',cy+item.r).attr('r',item.r)
            .attr('fill','none').attr('stroke','rgba(255,255,255,0.25)').attr('stroke-width',1);
        legG.append('text').attr('x',cx).attr('y',cy+item.r*2+12)
            .attr('text-anchor','middle').attr('fill','#a0a8b8').attr('font-size','8px')
            .text(item.label);
    });

    // ── Country colour legend (top-left) ────────────────────
    var countries = [];
    scorers.forEach(function(d){
        if (countries.indexOf(d.country)===-1) countries.push(d.country);
    });
    var clegG = svg.append('g').attr('transform','translate(12,12)');
    clegG.append('text').attr('x',0).attr('y',0)
        .attr('fill','#b8c4d0').attr('font-size','9px').attr('letter-spacing','0.08em')
        .text('COUNTRY');
    countries.slice(0,8).forEach(function(c, i) {
        var col = colorOrd(c);
        clegG.append('circle').attr('cx',6).attr('cy',14+i*15).attr('r',5)
            .attr('fill',col).attr('opacity',0.85);
        clegG.append('text').attr('x',15).attr('y',18+i*15)
            .attr('fill','#c8ccd8').attr('font-size','9px').text(c);
    });
}

/* ============================================================
   8. RADIAL GOALS CLOCK
   ============================================================ */
function drawRadialClock() {
    var el = document.getElementById('radial-chart');
    if (!el) return;
    el.innerHTML = '';

    var W = elW(el, 400), H = Math.min(W, 400);
    var cx = W/2, cy = H/2;
    var innerR = H*0.17, maxR = H*0.43;
    var bins = DATA.goal_minutes;
    if (!bins) return;

    var svg = d3.select(el).append('svg').attr('width',W).attr('height',H).style('display','block');
    var g = svg.append('g').attr('transform','translate('+cx+','+cy+')');
    var maxCount = d3.max(bins,function(d){return d.count;});
    var rScale = d3.scaleLinear().domain([0,maxCount]).range([innerR,maxR]);
    var sliceAngle = (2*Math.PI)/bins.length;

    [0.25,0.5,0.75,1].forEach(function(t){
        g.append('circle').attr('r',innerR+(maxR-innerR)*t)
            .attr('fill','none').attr('stroke','rgba(255,255,255,0.06)').attr('stroke-width',1);
    });

    var arc = d3.arc()
        .innerRadius(innerR)
        .outerRadius(function(d){return rScale(d.count);})
        .startAngle(function(d,i){return i*sliceAngle - Math.PI/2;})
        .endAngle(function(d,i){return (i+1)*sliceAngle - Math.PI/2;})
        .padAngle(0.01).cornerRadius(2);

    g.selectAll('.rseg').data(bins).join('path').attr('class','rseg')
        .attr('d',arc)
        .attr('fill',function(d){
            if (d.minute_bin>=40 && d.minute_bin<=50) return C.rose;
            if (d.minute_bin>=80) return C.gold;
            return C.teal;
        })
        .attr('opacity',0.82)
        .on('mousemove',function(e,d){ tip('<div class="tt-title">'+d.minute_bin+'–'+(d.minute_bin+4)+'\u2032</div>Goals: <span class="tt-val">'+d.count+'</span>',e); })
        .on('mouseleave',hideTip);

    ['0\u2032','22\u2032','45\u2032','67\u2032','90\u2032'].forEach(function(label,i){
        var angle = (i/5)*2*Math.PI - Math.PI/2;
        g.append('text').attr('x',Math.cos(angle)*(maxR+16)).attr('y',Math.sin(angle)*(maxR+16))
            .attr('text-anchor','middle').attr('dy','0.35em')
            .attr('fill',C.muted).attr('font-size','10px').text(label);
    });
    g.append('text').attr('text-anchor','middle').attr('dy','-0.2em')
        .attr('fill',C.gold).attr('font-family',"'Bebas Neue',sans-serif").attr('font-size','1.2rem').text('GOALS');
    g.append('text').attr('text-anchor','middle').attr('dy','1.2em')
        .attr('fill',C.muted).attr('font-size','9px').text('by minute');
}

/* ============================================================
   9. ACTIVITY CHART
   ============================================================ */
function drawActivityChart() {
    var el = document.getElementById('activity-chart');
    if (!el) return;
    el.innerHTML = '';

    var coverage = DATA.coverage;
    var M = {top:10,right:10,bottom:30,left:40};
    var W = elW(el, 500) - M.left - M.right;
    var H = 170 - M.top - M.bottom;

    var svg = d3.select(el).append('svg')
        .attr('width',W+M.left+M.right).attr('height',H+M.top+M.bottom).style('display','block');
    var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

    var x = d3.scaleBand().domain(coverage.map(function(d){return d.year;})).range([0,W]).padding(0.12);
    var y = d3.scaleLinear().domain([0,d3.max(coverage,function(d){return d.matches;})]).range([H,0]).nice();

    g.selectAll('.abar').data(coverage).join('rect').attr('class','abar')
        .attr('x',function(d){return x(d.year);}).attr('y',function(d){return y(d.matches);})
        .attr('width',x.bandwidth()).attr('height',function(d){return H-y(d.matches);})
        .attr('fill',function(d){return d.has_data?C.gold:'rgba(255,255,255,0.12)';})
        .attr('rx',1)
        .on('mousemove',function(e,d){ tip('<div class="tt-title">'+d.year+'</div>Matches: <span class="tt-val">'+d.matches+'</span><br>Goal data: '+(d.has_data?'✓':'✗ Missing'),e); })
        .on('mouseleave',hideTip);

    g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')')
        .call(d3.axisBottom(x).tickValues(coverage.filter(function(d,i){return i%8===0;}).map(function(d){return d.year;})).tickFormat(d3.format('d')));
    g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(3));
}

/* ============================================================
   10. TEAMS RANKING
   ============================================================ */
var currentFilter = 'all';
window.filterTeams = function(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filt-btn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    drawTeamsRanking();
};

function drawTeamsRanking() {
    var el = document.getElementById('teams-ranking');
    if (!el) return;
    el.innerHTML = '';

    var teams = DATA.top_teams.slice();
    if (currentFilter==='top20') teams = teams.slice(0,20);
    else if (currentFilter==='emerging') {
        teams = teams.filter(function(t){
            return ['Asia','Africa','Oceania'].includes(t.region) ||
                   ['Japan','Australia','Nigeria','South Korea','New Zealand','Colombia','Jamaica'].includes(t.team);
        }).slice(0,15);
    } else { teams = teams.slice(0,25); }

    var M = {top:10,right:80,bottom:10,left:155};
    var W = elW(el, 860) - M.left - M.right;
    var rowH = 28, svgH = teams.length*rowH + 20;

    var svg = d3.select(el).append('svg').attr('width',W+M.left+M.right).attr('height',svgH).style('display','block');
    var g = svg.append('g').attr('transform','translate('+M.left+',10)');

    var maxW = d3.max(teams,function(d){return d.wins;});
    var x = d3.scaleLinear().domain([0,maxW]).range([0,W]);

    g.selectAll('.rkbar').data(teams).join('rect').attr('class','rkbar')
        .attr('y',function(d,i){return i*rowH;}).attr('x',0)
        .attr('width',0).attr('height',rowH-5)
        .attr('fill',function(d){return REGION_COLOR[d.region]||C.muted;}).attr('rx',2)
        .on('mousemove',function(e,d){tip('<div class="tt-title">'+d.team+'</div>Wins: <span class="tt-val">'+d.wins+'</span> · Win rate: '+d.win_rate+'%<br>Goals/match: '+d.goals_per_match,e);})
        .on('mouseleave',hideTip)
        .transition().duration(500).delay(function(d,i){return i*15;})
        .attr('width',function(d){return x(d.wins);});

    g.selectAll('.rkname').data(teams).join('text').attr('class','rkname')
        .attr('x',-8).attr('text-anchor','end')
        .attr('y',function(d,i){return i*rowH+(rowH-5)/2+4;})
        .attr('fill',C.text).attr('font-size','12px').text(function(d){return d.team;});

    g.selectAll('.rkval').data(teams).join('text').attr('class','rkval')
        .attr('y',function(d,i){return i*rowH+(rowH-5)/2+4;})
        .attr('fill',C.gold).attr('font-size','12px').attr('font-weight','700')
        .attr('font-family',"'Bebas Neue',sans-serif")
        .attr('x',0).attr('opacity',0)
        .transition().duration(500).delay(function(d,i){return i*15;})
        .attr('x',function(d){return x(d.wins)+6;}).attr('opacity',1)
        .tween('text',function(d){
            var nd=this; return function(t){nd.textContent=Math.round(d.wins*t);};
        });

    g.selectAll('.rkreg').data(teams).join('text').attr('class','rkreg')
        .attr('x',-M.left+4).attr('y',function(d,i){return i*rowH+(rowH-5)/2+4;})
        .attr('fill',function(d){return REGION_COLOR[d.region]||C.muted;})
        .attr('font-size','9px').attr('font-weight','600')
        .text(function(d){return d.region?d.region.substring(0,5):'';});
}

/* ============================================================
   11. SCATTER CHART — Win Rate vs Experience
   ============================================================ */
function drawScatterChart() {
    var el = document.getElementById('scatter-chart');
    if (!el) return;
    el.innerHTML = '';

    var teams = DATA.top_teams.slice(0,30);
    var M = {top:24,right:30,bottom:50,left:60};
    var W = elW(el, 860) - M.left - M.right;
    var H = 420 - M.top - M.bottom;

    var svg = d3.select(el).append('svg')
        .attr('width',W+M.left+M.right).attr('height',H+M.top+M.bottom).style('display','block');
    var g = svg.append('g').attr('transform','translate('+M.left+','+M.top+')');

    var x = d3.scaleLinear().domain([0, d3.max(teams,function(d){return d.matches;})*1.06]).range([0,W]).nice();
    var y = d3.scaleLinear().domain([20,100]).range([H,0]);
    var r = d3.scaleSqrt().domain([0, d3.max(teams,function(d){return d.goals_for;})]).range([5,22]);

    // Grid
    g.append('g').attr('class','grid').call(d3.axisLeft(y).ticks(5).tickSize(-W).tickFormat(''));
    g.selectAll('.grid line').style('stroke','rgba(255,255,255,0.04)');

    // Quadrant lines
    g.append('line').attr('x1',0).attr('x2',W).attr('y1',y(50)).attr('y2',y(50))
        .attr('stroke','rgba(255,255,255,0.09)').attr('stroke-dasharray','4,3');
    g.append('line').attr('x1',x(200)).attr('x2',x(200)).attr('y1',0).attr('y2',H)
        .attr('stroke','rgba(255,255,255,0.09)').attr('stroke-dasharray','4,3');
    // Quadrant labels
    [['Dominant',W-6,14,'end'],['Rising',4,14,'start'],
     ['Experienced',W-6,H-6,'end'],['Developing',4,H-6,'start']].forEach(function(q){
        g.append('text').attr('x',q[0]).attr('y',q[1]).attr('text-anchor',q[3])
            .attr('fill','rgba(255,255,255,0.1)').attr('font-size','10px').text(q[2]);
    });

    // Dots
    g.selectAll('.sdot2').data(teams).join('circle').attr('class','sdot2')
        .attr('cx',function(d){return x(d.matches);})
        .attr('cy',function(d){return y(d.win_rate);})
        .attr('r',function(d){return r(d.goals_for);})
        .attr('fill',function(d){return REGION_COLOR[d.region]||C.muted;})
        .attr('stroke','rgba(0,0,0,0.4)').attr('stroke-width',1.2).attr('opacity',0.85)
        .on('mousemove',function(e,d){
            tip('<div class="tt-title">'+d.team+'</div>Matches: <span class="tt-val">'+d.matches+'</span><br>Win rate: <span class="tt-val">'+d.win_rate+'%</span><br>Goals: '+d.goals_for,e);
        })
        .on('mouseleave',hideTip);

    // Labels — ALL teams, collision avoided via force simulation on label positions
    var labelData = teams.map(function(d) {
        return {
            team: d,
            tx: x(d.matches) + r(d.goals_for) + 4,
            ty: y(d.win_rate) + 4,
            ox: x(d.matches),
            oy: y(d.win_rate)
        };
    });

    // Simple iterative collision avoidance for labels
    for (var iter=0; iter<40; iter++) {
        for (var i=0; i<labelData.length; i++) {
            for (var j=i+1; j<labelData.length; j++) {
                var dx = labelData[i].tx - labelData[j].tx;
                var dy = labelData[i].ty - labelData[j].ty;
                var dist = Math.sqrt(dx*dx + dy*dy);
                var minDist = 28; // min pixel separation
                if (dist < minDist && dist > 0) {
                    var push = (minDist - dist) / 2;
                    labelData[i].tx += (dx/dist)*push;
                    labelData[i].ty += (dy/dist)*push*0.8;
                    labelData[j].tx -= (dx/dist)*push;
                    labelData[j].ty -= (dy/dist)*push*0.8;
                }
            }
            // Keep within bounds
            labelData[i].tx = Math.max(0, Math.min(W-2, labelData[i].tx));
            labelData[i].ty = Math.max(8, Math.min(H, labelData[i].ty));
        }
    }

    var labG = g.append('g').attr('class','scatter-labels');
    labelData.forEach(function(ld) {
        // Leader line
        var ox = x(ld.team.matches), oy = y(ld.team.win_rate);
        var rr = r(ld.team.goals_for);
        var dx = ld.tx - ox, dy = ld.ty - oy;
        var len = Math.sqrt(dx*dx+dy*dy);
        if (len > rr+6) {
            labG.append('line')
                .attr('x1', ox + dx/len*rr).attr('y1', oy + dy/len*rr)
                .attr('x2', ld.tx-4).attr('y2', ld.ty-2)
                .attr('stroke','rgba(255,255,255,0.15)').attr('stroke-width',0.7);
        }
        labG.append('text')
            .attr('x', ld.tx).attr('y', ld.ty)
            .attr('fill',C.text).attr('font-size','10px')
            .attr('font-family',"'DM Sans',sans-serif")
            .text(ld.team.team);
    });

    g.append('g').attr('class','axis').attr('transform','translate(0,'+H+')').call(d3.axisBottom(x).ticks(6));
    g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5).tickFormat(function(d){return d+'%';}));
    g.append('text').attr('x',W/2).attr('y',H+42).attr('text-anchor','middle')
        .attr('fill',C.muted).attr('font-size','11px').text('Total Matches Played');
    g.append('text').attr('transform','rotate(-90)').attr('y',-46).attr('x',-H/2)
        .attr('text-anchor','middle').attr('fill',C.muted).attr('font-size','11px').text('Win Rate (%)');
}


/* ============================================================
   12. HEAD-TO-HEAD EXPLORER
   ============================================================ */
function populateTeamSelects() {
    var allTeams = DATA.all_teams.filter(function(t){
        return DATA.top_teams.some(function(tt){return tt.team===t;});
    }).sort();

    ['team1-select','team2-select'].forEach(function(id) {
        var sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">— Choose —</option>';
        allTeams.forEach(function(t){
            var opt = document.createElement('option');
            opt.value = t; opt.textContent = t;
            sel.appendChild(opt);
        });
    });

    var s1 = document.getElementById('team1-select');
    var s2 = document.getElementById('team2-select');
    if (s1) s1.value = 'United States';
    if (s2) s2.value = 'Germany';
    updateComparison();
}

window.updateComparison = function() {
    var t1 = document.getElementById('team1-select') ? document.getElementById('team1-select').value : '';
    var t2 = document.getElementById('team2-select') ? document.getElementById('team2-select').value : '';
    if (!t1||!t2||t1===t2) return;

    var team1 = DATA.top_teams.find(function(t){return t.team===t1;});
    var team2 = DATA.top_teams.find(function(t){return t.team===t2;});
    if (!team1||!team2) return;

    var h2hKey = t1+'|'+t2, h2hKeyR = t2+'|'+t1;
    var h2h = DATA.head_to_head[h2hKey]||DATA.head_to_head[h2hKeyR];

    var el = document.getElementById('comparison-result');
    if (!el) return;
    el.innerHTML = '';

    var compDiv = document.createElement('div');
    compDiv.className = 'comp-grid';
    el.appendChild(compDiv);

    function makeCol(team, cls) {
        var col = document.createElement('div');
        col.className = 'comp-stats-col '+cls;
        var alignStyle = cls==='t2' ? ' style="text-align:right"' : '';
        col.innerHTML = '<div class="comp-team-header '+cls+'">'+team.team+'</div>';
        [['Wins',team.wins],['Win Rate',team.win_rate+'%'],['Matches',team.matches],
         ['Goals For',team.goals_for],['Goals/Match',team.goals_per_match]].forEach(function(item){
            col.innerHTML += '<div class="comp-stat-item"><div class="comp-stat-label"'+alignStyle+'>'+item[0]+'</div><div class="comp-stat-val"'+alignStyle+'>'+item[1]+'</div></div>';
        });
        return col;
    }

    compDiv.appendChild(makeCol(team1,'t1'));

    var radarWrap = document.createElement('div');
    radarWrap.className = 'comp-radar-wrap';
    radarWrap.id = 'comp-radar-wrap';
    compDiv.appendChild(radarWrap);
    compDiv.appendChild(makeCol(team2,'t2'));

    drawRadarChart(team1, team2, radarWrap);

    if (h2h) {
        var box = document.createElement('div');
        box.className = 'h2h-box';
        var w1 = DATA.head_to_head[h2hKey] ? h2h.w1 : h2h.w2;
        var w2 = DATA.head_to_head[h2hKey] ? h2h.w2 : h2h.w1;
        box.innerHTML = '<div class="h2h-title">Head-to-Head Record ('+h2h.matches+' matches)</div>'+
            '<div class="h2h-nums">'+
            '<div><div class="h2h-big" style="color:var(--gold)">'+w1+'</div><div class="h2h-label">'+t1+' wins</div></div>'+
            '<div class="h2h-vs">·</div>'+
            '<div><div class="h2h-big" style="color:var(--text-muted)">'+h2h.draws+'</div><div class="h2h-label">Draws</div></div>'+
            '<div class="h2h-vs">·</div>'+
            '<div><div class="h2h-big" style="color:var(--teal)">'+w2+'</div><div class="h2h-label">'+t2+' wins</div></div>'+
            '</div>';
        el.appendChild(box);
    }
};

function drawRadarChart(team1, team2, container) {
    if (!container) return;
    var size = 220, cx = size/2, cy = size/2, R = size*0.36;
    var teams = DATA.top_teams;
    var dims = [
        {key:'win_rate',      label:'Win Rate', max:d3.max(teams,function(d){return d.win_rate;})},
        {key:'goals_per_match',label:'Goals/Match',max:d3.max(teams,function(d){return d.goals_per_match;})},
        {key:'goals_for',     label:'Goals Total',max:d3.max(teams,function(d){return d.goals_for;})},
        {key:'matches',       label:'Experience',max:d3.max(teams,function(d){return d.matches;})},
        {key:'goal_diff',     label:'Goal Diff',max:d3.max(teams,function(d){return d.goal_diff;})}
    ];
    var n = dims.length, angle = (2*Math.PI)/n;

    var svg = d3.select(container).append('svg').attr('width',size).attr('height',size).style('display','block').style('margin','0 auto');
    var g = svg.append('g').attr('transform','translate('+cx+','+cy+')');

    [0.25,0.5,0.75,1].forEach(function(lv){
        var pts = dims.map(function(d,i){
            var a = angle*i-Math.PI/2;
            return [Math.cos(a)*R*lv, Math.sin(a)*R*lv];
        });
        g.append('polygon').attr('points',pts.map(function(p){return p.join(',');}).join(' '))
            .attr('fill','none').attr('stroke','rgba(255,255,255,0.1)').attr('stroke-width',1);
    });

    dims.forEach(function(d,i){
        var a = angle*i-Math.PI/2;
        g.append('line').attr('x1',0).attr('y1',0)
            .attr('x2',Math.cos(a)*R).attr('y2',Math.sin(a)*R)
            .attr('stroke','rgba(255,255,255,0.12)').attr('stroke-width',1);
        g.append('text').attr('x',Math.cos(a)*(R+16)).attr('y',Math.sin(a)*(R+16))
            .attr('text-anchor','middle').attr('dy','0.35em')
            .attr('fill','#b8c4d0').attr('font-size','9px').text(d.label);
    });

    [{team:team1,color:'#f5c842'},{team:team2,color:'#3dd6c0'}].forEach(function(item){
        var pts = dims.map(function(d,i){
            var a = angle*i-Math.PI/2;
            var val = (item.team[d.key]||0)/d.max;
            return [Math.cos(a)*R*val, Math.sin(a)*R*val];
        });
        g.append('polygon').attr('points',pts.map(function(p){return p.join(',');}).join(' '))
            .attr('fill',item.color).attr('fill-opacity',0.15)
            .attr('stroke',item.color).attr('stroke-width',2).attr('stroke-opacity',0.9);
        g.selectAll(null).data(pts).join('circle')
            .attr('cx',function(d){return d[0];}).attr('cy',function(d){return d[1];})
            .attr('r',3).attr('fill',item.color);
    });
}