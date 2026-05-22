/* ============================================================
   CROSS-FILTER — connects map, scatter, race, stream
   ============================================================ */
var CF = {
    selectedCountry: null,
    selectedRegion:  null,

    // Called when user clicks a country on the map
    selectCountry: function(countryName, region) {
        CF.selectedCountry = countryName;
        CF.selectedRegion  = region;
        CF._highlightScatter(countryName);
        CF._pulseRaceBar(countryName);
        CF._showCFBadge(countryName, region);
    },

    clearSelection: function() {
        CF.selectedCountry = null;
        CF.selectedRegion  = null;
        CF._resetScatter();
        CF._resetRace();
        CF._hideCFBadge();
    },

    // Highlight matching dot in scatter
    _highlightScatter: function(name) {
        var svg = document.querySelector('#scatter-chart svg');
        if (!svg) return;
        svg.querySelectorAll('.sdot2').forEach(function(el) {
            var d = el.__data__;
            if (!d) return;
            var match = d.team.toLowerCase() === name.toLowerCase() ||
                        d.team.toLowerCase().includes(name.toLowerCase().split(' ')[0]);
            el.setAttribute('opacity', match ? '1' : '0.12');
            if (match) {
                el.setAttribute('r', parseFloat(el.getAttribute('r')) * 1.5);
                el.setAttribute('stroke', '#f5c842');
                el.setAttribute('stroke-width', '2.5');
            }
        });
    },

    _resetScatter: function() {
        var svg = document.querySelector('#scatter-chart svg');
        if (!svg) return;
        svg.querySelectorAll('.sdot2').forEach(function(el) {
            var d = el.__data__;
            if (!d) return;
            el.setAttribute('opacity', '0.85');
            el.setAttribute('stroke', 'rgba(0,0,0,0.4)');
            el.setAttribute('stroke-width', '1.2');
            // restore radius from data
            if (window.DATA) {
                var t = window.DATA.top_teams.find(function(tt){ return tt.team === d.team; });
                if (t) {
                    var rScale = d3.scaleSqrt()
                        .domain([0, d3.max(window.DATA.top_teams, function(tt){ return tt.goals_for; })])
                        .range([5,22]);
                    el.setAttribute('r', rScale(t.goals_for));
                }
            }
        });
    },

    // Flash the matching bar in race chart
    _pulseRaceBar: function(name) {
        var svg = document.querySelector('#race-chart svg');
        if (!svg) return;
        svg.querySelectorAll('.rbar').forEach(function(el) {
            var d = el.__data__;
            if (!d) return;
            var match = d.team.toLowerCase() === name.toLowerCase() ||
                        d.team.toLowerCase().includes(name.toLowerCase().split(' ')[0]);
            el.setAttribute('opacity', match ? '1' : '0.18');
        });
        svg.querySelectorAll('.rlabel,.rval,.rrank').forEach(function(el) {
            var d = el.__data__;
            if (!d) return;
            var match = d.team && (d.team.toLowerCase() === name.toLowerCase() ||
                        d.team.toLowerCase().includes(name.toLowerCase().split(' ')[0]));
            el.setAttribute('opacity', match ? '1' : '0.18');
        });
    },

    _resetRace: function() {
        var svg = document.querySelector('#race-chart svg');
        if (!svg) return;
        svg.querySelectorAll('.rbar,.rlabel,.rval,.rrank').forEach(function(el) {
            el.setAttribute('opacity', '1');
        });
    },

    _showCFBadge: function(name, region) {
        var badge = document.getElementById('cf-badge');
        if (!badge) return;
        badge.textContent = 'Filtering: ' + name + (region ? ' · ' + region : '') + '  ✕';
        badge.style.display = 'flex';
        badge.onclick = function() { CF.clearSelection(); };
    },
    _hideCFBadge: function() {
        var badge = document.getElementById('cf-badge');
        if (badge) badge.style.display = 'none';
    }
};
