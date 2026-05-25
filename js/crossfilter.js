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
        CF.showModal(countryName, region);
    },

    clearSelection: function() {
        CF.selectedCountry = null;
        CF.selectedRegion  = null;
        CF.closeModal();
    },

    showModal: function(countryName, region) {
        try {
            // Check if modal elements exist
            var modalOverlay = document.getElementById('country-modal-overlay');
            var modal = document.getElementById('country-modal');
            var modalName = document.getElementById('modal-country-name');
            var modalRegion = document.getElementById('modal-country-region');
            var modalBody = document.getElementById('modal-body');

            if (!modalOverlay || !modal || !modalName || !modalRegion || !modalBody) {
                console.error('Modal elements not found in DOM!');
                return;
            }

        // Get team data
        var teamData = null;
        if (window.DATA && window.DATA.top_teams) {
            // Try exact match first
            teamData = window.DATA.top_teams.find(function(t) {
                return t.team.toLowerCase() === countryName.toLowerCase();
            });

            // If not found, try partial match
            if (!teamData) {
                teamData = window.DATA.top_teams.find(function(t) {
                    return t.team.toLowerCase().includes(countryName.toLowerCase()) ||
                           countryName.toLowerCase().includes(t.team.toLowerCase());
                });
            }
        }

        // Populate modal header
        modalName.textContent = countryName;
        modalRegion.textContent = region || 'Unknown Region';

        // Populate modal body
        var body = document.getElementById('modal-body');
        body.innerHTML = '';

        if (!teamData) {
            // Show basic info even if not in top 30
            var statsHTML = '<p class="modal-info-text">';
            statsHTML += '<span class="modal-info-highlight">' + countryName + '</span> has played in international women\'s football ';
            statsHTML += 'but is not currently ranked in the top 30 teams by total wins in our dataset.';
            statsHTML += '</p>';

            statsHTML += '<h3 class="modal-section-title">About This Team</h3>';
            statsHTML += '<p class="modal-info-text">';
            statsHTML += 'This team has participated in international matches and continues to compete in women\'s football. ';
            statsHTML += 'While detailed statistics are limited to the top 30 teams, you can explore their match history ';
            statsHTML += 'by using the timeline visualization on the main page.';
            statsHTML += '</p>';

            body.innerHTML = statsHTML;
        } else {
            // Stats grid
            var statsHTML = '<div class="modal-stats-grid">';
            statsHTML += CF._makeStatCard('Total Wins', teamData.wins);
            statsHTML += CF._makeStatCard('Win Rate', teamData.win_rate + '%');
            statsHTML += CF._makeStatCard('Matches', teamData.matches);
            statsHTML += CF._makeStatCard('Goals Scored', teamData.goals_for);
            statsHTML += CF._makeStatCard('Goals/Match', teamData.goals_per_match);
            statsHTML += CF._makeStatCard('Goal Diff', teamData.goal_diff >= 0 ? '+' + teamData.goal_diff : teamData.goal_diff);
            statsHTML += '</div>';

            // Performance summary
            statsHTML += '<h3 class="modal-section-title">Performance Summary</h3>';
            statsHTML += '<p class="modal-info-text">';
            statsHTML += '<span class="modal-info-highlight">' + countryName + '</span> has played ';
            statsHTML += '<span class="modal-info-highlight">' + teamData.matches + ' matches</span> ';
            statsHTML += 'in international women\'s football, achieving a win rate of ';
            statsHTML += '<span class="modal-info-highlight">' + teamData.win_rate + '%</span>. ';
            statsHTML += 'The team has scored a total of ';
            statsHTML += '<span class="modal-info-highlight">' + teamData.goals_for + ' goals</span>, ';
            statsHTML += 'averaging <span class="modal-info-highlight">' + teamData.goals_per_match + ' goals per match</span>.';
            statsHTML += '</p>';

            // Historical performance visualization
            statsHTML += '<h3 class="modal-section-title">Historical Performance</h3>';
            statsHTML += '<div class="modal-viz-container" id="modal-viz-timeline"></div>';

            // Ranking info
            var rank = window.DATA.top_teams.findIndex(function(t) { return t.team === countryName; }) + 1;
            if (rank > 0) {
                statsHTML += '<h3 class="modal-section-title">Global Ranking</h3>';
                statsHTML += '<p class="modal-info-text">';
                statsHTML += '<span class="modal-info-highlight">' + countryName + '</span> ranks ';
                statsHTML += '<span class="modal-info-highlight">#' + rank + '</span> out of ' + window.DATA.top_teams.length + ' teams ';
                statsHTML += 'in total wins in our dataset.';
                statsHTML += '</p>';
            }

            body.innerHTML = statsHTML;

            // Draw mini timeline chart
            setTimeout(function() { CF._drawMiniTimeline(countryName); }, 50);
        }

        // Show modal with animations
        modalOverlay.style.display = 'block';
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Add escape key listener
        CF._escapeListener = function(e) {
            if (e.key === 'Escape') CF.closeModal();
        };
        document.addEventListener('keydown', CF._escapeListener);

        } catch(error) {
            console.error('Error in showModal:', error);
        }
    },

    closeModal: function() {
        document.getElementById('country-modal-overlay').style.display = 'none';
        document.getElementById('country-modal').style.display = 'none';
        document.body.style.overflow = ''; // Re-enable scrolling

        // Remove escape key listener
        if (CF._escapeListener) {
            document.removeEventListener('keydown', CF._escapeListener);
            CF._escapeListener = null;
        }
    },

    _makeStatCard: function(label, value) {
        return '<div class="modal-stat-card">' +
               '<div class="modal-stat-label">' + label + '</div>' +
               '<div class="modal-stat-value">' + value + '</div>' +
               '</div>';
    },

    _drawMiniTimeline: function(countryName) {
        var container = document.getElementById('modal-viz-timeline');
        if (!container || !window.RACE_DATA) return;

        container.innerHTML = '';
        var teamData = window.RACE_DATA.data[countryName];
        if (!teamData || teamData.length === 0) {
            container.innerHTML = '<p class="modal-info-text">No historical data available.</p>';
            return;
        }

        var M = {top: 15, right: 15, bottom: 30, left: 40};
        var W = container.clientWidth - M.left - M.right;
        var H = 200 - M.top - M.bottom;

        var svg = d3.select(container).append('svg')
            .attr('width', W + M.left + M.right)
            .attr('height', H + M.top + M.bottom)
            .style('display', 'block');

        var g = svg.append('g').attr('transform', 'translate(' + M.left + ',' + M.top + ')');

        var x = d3.scaleLinear()
            .domain(d3.extent(teamData, function(d) { return d.year; }))
            .range([0, W]);

        var y = d3.scaleLinear()
            .domain([0, d3.max(teamData, function(d) { return d.wins; })])
            .range([H, 0])
            .nice();

        // Grid
        g.append('g').attr('class', 'grid')
            .call(d3.axisLeft(y).ticks(4).tickSize(-W).tickFormat(''))
            .select('.domain').remove();
        g.selectAll('.grid line').style('stroke', 'rgba(255,255,255,0.05)');

        // Area
        var area = d3.area()
            .x(function(d) { return x(d.year); })
            .y0(H)
            .y1(function(d) { return y(d.wins); })
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(teamData)
            .attr('fill', 'rgba(245,200,66,0.2)')
            .attr('d', area);

        // Line
        var line = d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.wins); })
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(teamData)
            .attr('fill', 'none')
            .attr('stroke', '#f5c842')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Axes
        g.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0,' + H + ')')
            .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6))
            .selectAll('text')
            .style('fill', '#b8c4d0')
            .style('font-size', '10px');

        g.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(y).ticks(4))
            .selectAll('text')
            .style('fill', '#b8c4d0')
            .style('font-size', '10px');

        g.selectAll('.axis .domain').style('stroke', 'rgba(255,255,255,0.15)');
        g.selectAll('.axis .tick line').style('stroke', 'rgba(255,255,255,0.1)');

        // Y-axis label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -32)
            .attr('x', -H / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', '#b8c4d0')
            .attr('font-size', '10px')
            .text('Cumulative Wins');
    }
};
