
(function(){
  // â”€â”€ Tab switching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function switchTab(name) {
    document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-tab') === name); });
    var panel = document.getElementById('tab-' + name);
    if (panel) panel.classList.add('active');
    try { localStorage.setItem('lm-tab', name); } catch(e) {}
    // rebuild charts when a chart tab becomes visible (setTimeout gives browser a tick to apply display:block)
    setTimeout(function(){
      if(typeof Chart === 'undefined') return;
      if(name === 'overview' && typeof buildCharts === 'function') buildCharts();
      else if(name === 'queues' && typeof buildQueueCharts === 'function') buildQueueCharts();
      else if(name === 'governance'   && typeof buildGovernanceCharts   === 'function') buildGovernanceCharts();
      else if(name === 'people'       && typeof buildPeopleCharts       === 'function') buildPeopleCharts();
      else if(name === 'performance'  && typeof buildPerformanceCharts  === 'function') buildPerformanceCharts();
    }, 0);
  }
  // Expose globally so onclick attributes on buttons always work regardless of event-listener state
  window.switchTab = switchTab;
  // Event delegation on nav â€” resilient to DOM re-renders that strip per-element listeners
  var tabNav = document.getElementById('tab-nav');
  if (tabNav) {
    tabNav.addEventListener('click', function(e) {
      var btn = e.target;
      while (btn && btn !== tabNav) {
        if (btn.classList && btn.classList.contains('tab-btn')) { switchTab(btn.getAttribute('data-tab')); return; }
        btn = btn.parentNode;
      }
    });
  }
  var activeTab = 'overview';
  try { activeTab = localStorage.getItem('lm-tab') || 'overview'; } catch(e) {}
  switchTab(activeTab);
  // When Chart.js (async) finishes loading, build charts for whichever tab is visible
  window._chartReady = function(){
    var btn = document.querySelector('.tab-btn.active');
    var tab = (btn && btn.getAttribute('data-tab')) || 'overview';
    setTimeout(function(){
      if(typeof Chart === 'undefined') return;
      if(tab === 'overview' && typeof buildCharts === 'function') buildCharts();
      else if(tab === 'queues' && typeof buildQueueCharts === 'function') buildQueueCharts();
      else if(tab === 'governance' && typeof buildGovernanceCharts === 'function') buildGovernanceCharts();
      else if(tab === 'people' && typeof buildPeopleCharts === 'function') buildPeopleCharts();
      else if(tab === 'performance' && typeof buildPerformanceCharts === 'function') buildPerformanceCharts();
    }, 0);
  };

  // â”€â”€ Keyboard shortcuts (press 1-9 to jump to tabs) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var TAB_ORDER = ['overview','queues','activity','governance','people','performance','crm','sera-chat','settings'];
  document.addEventListener('keydown', function(e){
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    var idx = parseInt(e.key, 10);
    if(idx >= 1 && idx <= TAB_ORDER.length){ e.preventDefault(); switchTab(TAB_ORDER[idx - 1]); }
  });

  // â”€â”€ Activity feed search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var actSearch = document.getElementById('act-search');
  if(actSearch){
    actSearch.addEventListener('input', function(){
      var q = this.value.trim().toLowerCase();
      document.querySelectorAll('.act-row').forEach(function(row){
        row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  // â”€â”€ Roles directory search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var rdSearch = document.getElementById('rd-search');
  if(rdSearch){
    rdSearch.addEventListener('input', function(){
      var q = this.value.trim().toLowerCase();
      document.querySelectorAll('.rd-circle-section').forEach(function(section){
        var rows = section.querySelectorAll('tbody tr');
        var any = false;
        rows.forEach(function(row){
          var show = !q || row.textContent.toLowerCase().includes(q);
          row.style.display = show ? '' : 'none';
          if(show) any = true;
        });
        section.style.display = (!q || any) ? '' : 'none';
        if(q && any) section.setAttribute('open', '');
        else if(!q) section.removeAttribute('open');
      });
    });
  }

  // â”€â”€ Theme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var saved = 'dark';
  try { saved = localStorage.getItem('lm-theme') || 'dark'; } catch(e) {}
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-btn').textContent = saved === 'dark' ? 'Light' : 'Dark';

  // Hit /logout with bogus credentials so the browser discards its cached Basic Auth credentials,
  // then navigate to / which re-triggers the login prompt.
  window.signOut = function(){
    fetch('/logout', { headers: { 'Authorization': 'Basic ' + btoa('logout:logout') } })
      .finally(function(){ window.location.href = '/'; });
  };

  window.toggleTheme = function(){
    var cur  = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('lm-theme', next); } catch(e) {}
    document.getElementById('theme-btn').textContent = next === 'dark' ? 'Light' : 'Dark';
    var activeT = 'overview';
    try { activeT = localStorage.getItem('lm-tab') || 'overview'; } catch(e) {}
    if(activeT === 'overview') buildCharts();
    else if(activeT === 'queues') buildQueueCharts();
    else if(activeT === 'governance')  buildGovernanceCharts();
    else if(activeT === 'people')      buildPeopleCharts();
    else if(activeT === 'performance') buildPerformanceCharts();
  };

  // â”€â”€ Counter animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function animateCounters(){
    document.querySelectorAll('.counter').forEach(function(el){
      var target = parseInt(el.getAttribute('data-target') || '0', 10);
      if(target === 0){ el.textContent = '0'; return; }
      var start = performance.now();
      var dur   = Math.min(1800, 400 + target * 0.4);
      function tick(now){
        var p = Math.min((now - start) / dur, 1);
        var ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(ease * target).toLocaleString();
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // â”€â”€ Charts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var activityData  = JSON.parse(document.getElementById('activity-data').textContent);
  var typeDataRaw   = JSON.parse(document.getElementById('type-data').textContent);
  var queueDataRaw  = JSON.parse(document.getElementById('queue-data').textContent);
  var communityRaw  = JSON.parse(document.getElementById('community-data').textContent);
  var policyRaw     = JSON.parse(document.getElementById('policy-data').textContent);
  var perfDataRaw   = JSON.parse(document.getElementById('perf-data').textContent);
  var peopleDataRaw = JSON.parse(document.getElementById('people-data').textContent);
  var actChart, typeChart, queueChart, communityChart, policyPieChart, velocityChart, priorityChart, taskStatusChart;
  var influenceChart, tagChart, relChart, peopleTimelineChart;

  function isDark(){ return document.documentElement.getAttribute('data-theme') !== 'light'; }

  function chartColors(){
    var dark = isDark();
    return {
      bar:        dark ? 'rgba(99,102,241,0.75)' : 'rgba(79,70,229,0.75)',
      barHover:   dark ? '#6366f1' : '#4f46e5',
      grid:       dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
      tick:       dark ? '#6b7a96' : '#64748b',
      donut:      ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899'],
      legendText: dark ? '#9ca3af' : '#64748b',
    };
  }

  function buildCharts(){
    var c  = chartColors();
    var dark = isDark();
    Chart.defaults.color = c.tick;

    // Activity bar chart
    var actCtx = document.getElementById('activityChart');
    if(actCtx){
      if(actChart) actChart.destroy();
      actChart = new Chart(actCtx, {
        type: 'bar',
        data: {
          labels: activityData.map(function(d){ return d.label; }),
          datasets:[{
            label: (window.AMORA_UI||{}).chartActivityLabel || 'Items processed',
            data: activityData.map(function(d){ return d.count; }),
            backgroundColor: c.bar,
            hoverBackgroundColor: c.barHover,
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:false } },
          scales:{
            y:{ beginAtZero:true, ticks:{ color:c.tick, precision:0 }, grid:{ color:c.grid }, border:{ display:false } },
            x:{ ticks:{ color:c.tick }, grid:{ display:false }, border:{ display:false } }
          }
        }
      });
    }

    // Type doughnut chart
    var typeCtx = document.getElementById('typeChart');
    if(typeCtx){
      if(typeChart) typeChart.destroy();
      var labels = (window.AMORA_UI||{}).chartTypeLabels || ['Recordings','Transcripts','Notes','Operational','Forwarded'];
      var vals   = [typeDataRaw.recordings, typeDataRaw.transcripts, typeDataRaw.notes, typeDataRaw.operational, typeDataRaw.forwarded];
      typeChart = new Chart(typeCtx, {
        type: 'doughnut',
        data:{
          labels: labels,
          datasets:[{ data: vals, backgroundColor: c.donut, borderWidth:0, hoverOffset:4 }]
        },
        options:{
          responsive:true, maintainAspectRatio:false, cutout:'62%',
          plugins:{ legend:{ position:'bottom', labels:{ color:c.legendText, padding:10, font:{ size:11 }, boxWidth:12 } } }
        }
      });
    }
  }

  function buildQueueCharts(){
    var c = chartColors();
    Chart.defaults.color = c.tick;
    var qCtx = document.getElementById('queueChart');
    if(!qCtx) return;
    if(queueChart) queueChart.destroy();
    var colors = queueDataRaw.values.map(function(v){ return v === 0 ? 'rgba(107,122,150,0.3)' : v >= 10 ? 'rgba(239,68,68,0.75)' : 'rgba(245,158,11,0.75)'; });
    queueChart = new Chart(qCtx, {
      type: 'bar',
      data: {
        labels: queueDataRaw.labels,
        datasets: [{ data: queueDataRaw.values, backgroundColor: colors, borderRadius: 6, borderSkipped: false }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx){ return ' ' + ctx.raw + ((window.AMORA_UI||{}).chartQueuePending || ' pending'); } } } },
        scales: {
          x: { grid: { color: c.grid }, ticks: { color: c.tick, stepSize: 1 }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: c.tick, font: { size: 11 } } },
        },
      },
    });
  }

  function buildGovernanceCharts(){
    var c = chartColors();
    Chart.defaults.color = c.tick;

    var comCtx = document.getElementById('communityChart');
    if(comCtx){
      if(communityChart) communityChart.destroy();
      communityChart = new Chart(comCtx, {
        type: 'bar',
        data: {
          labels: (window.AMORA_UI||{}).chartCommunityLabels || ['Profiles','Meetings','Circles','Tasks','Decisions'],
          datasets: [{ data: [communityRaw.profiles, communityRaw.meetings, communityRaw.circles, communityRaw.tasks, communityRaw.decisions, communityRaw.kb], backgroundColor: ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899'], borderRadius: 6, borderSkipped: false }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx){ return ' ' + ctx.raw.toLocaleString(); } } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: c.tick, font: { size: 11 } } },
            y: { grid: { color: c.grid }, ticks: { color: c.tick } },
          },
        },
      });
    }

    var polCtx = document.getElementById('policyPieChart');
    if(polCtx && (policyRaw.active + policyRaw.draft + policyRaw.other) > 0){
      if(policyPieChart) policyPieChart.destroy();
      policyPieChart = new Chart(polCtx, {
        type: 'doughnut',
        data: {
          labels: ['Active','Draft','Other'],
          datasets: [{ data: [policyRaw.active, policyRaw.draft, policyRaw.other], backgroundColor: ['#10b981','#f59e0b','#6b7a96'], borderWidth: 0, hoverOffset: 6 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: c.legendText, padding: 16, font: { size: 11 } } },
            tooltip: { callbacks: { label: function(ctx){ return ' ' + ctx.label + ': ' + ctx.raw; } } },
            title: { display: true, text: (window.AMORA_UI||{}).chartPolicyTitle || 'Policy Status', color: c.tick, font: { size: 12 }, padding: { bottom: 8 } },
          },
          cutout: '60%',
        },
      });
    }
  }

  function buildPeopleCharts(){
    var c = chartColors();
    Chart.defaults.color = c.tick;
    var PALETTE = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#ef4444','#14b8a6','#f97316','#a855f7','#06b6d4','#84cc16'];
    function hexRgba(hex, a){ var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return 'rgba('+r+','+g+','+b+','+a+')'; }

    // â”€â”€ Influence Map (bubble chart) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    var bubCtx = document.getElementById('influenceChart');
    if(bubCtx && peopleDataRaw.bubbles.length > 0){
      if(influenceChart) influenceChart.destroy();
      influenceChart = new Chart(bubCtx, {
        type: 'bubble',
        data: {
          datasets: peopleDataRaw.bubbles.map(function(p, i){
            var col = PALETTE[i % PALETTE.length];
            return {
              label: p.label,
              data: [{ x: p.x, y: p.y, r: p.r, roles: p.roles, score: p.score }],
              backgroundColor: hexRgba(col, 0.55),
              borderColor: hexRgba(col, 0.9),
              borderWidth: 1.5,
            };
          }),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(ctx){
                  var d = ctx.raw;
                  return ctx.dataset.label + '  |  ' + d.y + ' tasks done Â· ' + d.x + ' meetings Â· ' + d.roles + ' roles  â†’  Score ' + d.score;
                }
              }
            }
          },
          scales: {
            x: { beginAtZero: true, title: { display: true, text: (window.AMORA_UI||{}).chartInfluenceX || 'Meetings Organized', color: c.tick, font: { size: 11 } }, grid: { color: c.grid }, ticks: { color: c.tick, precision: 0 }, border: { display: false } },
            y: { beginAtZero: true, title: { display: true, text: (window.AMORA_UI||{}).chartInfluenceY || 'Tasks Completed', color: c.tick, font: { size: 11 } }, grid: { color: c.grid }, ticks: { color: c.tick, precision: 0 }, border: { display: false } },
          }
        }
      });
    }

    // â”€â”€ Skills / Tags horizontal bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    var tagCtx = document.getElementById('tagChart');
    if(tagCtx && peopleDataRaw.tags.labels.length > 0){
      if(tagChart) tagChart.destroy();
      tagChart = new Chart(tagCtx, {
        type: 'bar',
        data: {
          labels: peopleDataRaw.tags.labels,
          datasets: [{ data: peopleDataRaw.tags.values, backgroundColor: peopleDataRaw.tags.labels.map(function(_,i){ return hexRgba(PALETTE[i%PALETTE.length], 0.75); }), borderRadius: 5, borderSkipped: false }],
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx){ return ' ' + ctx.raw + ((window.AMORA_UI||{}).chartInfluencePeople || ' people'); } } } },
          scales: {
            x: { beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.tick, precision: 0 } },
            y: { grid: { display: false }, ticks: { color: c.tick, font: { size: 11 } } },
          },
        },
      });
    }

    // â”€â”€ Relationship to Amora donut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    var relCtx = document.getElementById('relChart');
    if(relCtx && peopleDataRaw.relationships.labels.length > 0){
      if(relChart) relChart.destroy();
      relChart = new Chart(relCtx, {
        type: 'doughnut',
        data: {
          labels: peopleDataRaw.relationships.labels,
          datasets: [{ data: peopleDataRaw.relationships.values, backgroundColor: PALETTE, borderWidth: 0, hoverOffset: 8 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '55%',
          plugins: { legend: { position: 'right', labels: { color: c.legendText, padding: 10, font: { size: 11 }, boxWidth: 12 } } },
        },
      });
    }

    // â”€â”€ Growth timeline line chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    var tlCtx = document.getElementById('peopleTimelineChart');
    if(tlCtx){
      if(peopleTimelineChart) peopleTimelineChart.destroy();
      peopleTimelineChart = new Chart(tlCtx, {
        type: 'line',
        data: {
          labels: peopleDataRaw.timeline.labels,
          datasets: [{
            data: peopleDataRaw.timeline.values,
            borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.12)',
            borderWidth: 2.5, fill: true, tension: 0.35,
            pointBackgroundColor: '#6366f1', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx){ return ' ' + ctx.raw + ((window.AMORA_UI||{}).chartPeopleGrowthSuffix || ' new profiles'); } } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: c.tick } },
            y: { beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.tick, precision: 0 }, border: { display: false } },
          },
        },
      });
    }
  }

  function buildPerformanceCharts(){
    var c = chartColors();
    Chart.defaults.color = c.tick;

    // Velocity grouped bar (created vs completed per week)
    var velCtx = document.getElementById('velocityChart');
    if(velCtx){
      if(velocityChart) velocityChart.destroy();
      velocityChart = new Chart(velCtx, {
        type: 'bar',
        data: {
          labels: perfDataRaw.velocity.map(function(v){ return v.weekLabel; }),
          datasets: [
            { label: (window.AMORA_UI||{}).chartVelocityCreated || 'Created',   data: perfDataRaw.velocity.map(function(v){ return v.created; }),   backgroundColor: 'rgba(99,102,241,0.75)', borderRadius: 4, borderSkipped: false },
            { label: (window.AMORA_UI||{}).chartVelocityCompleted || 'Completed', data: perfDataRaw.velocity.map(function(v){ return v.completed; }), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 4, borderSkipped: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: c.tick, font: { size: 11 } } },
            y: { beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.tick, precision: 0 }, border: { display: false } },
          },
        },
      });
    }

    // Priority horizontal bar
    var prioCtx = document.getElementById('priorityChart');
    if(prioCtx && (perfDataRaw.priority.high + perfDataRaw.priority.medium + perfDataRaw.priority.low) > 0){
      if(priorityChart) priorityChart.destroy();
      priorityChart = new Chart(prioCtx, {
        type: 'bar',
        data: {
          labels: (window.AMORA_UI||{}).chartPriorityLabels || ['High','Medium','Low'],
          datasets: [{ data: [perfDataRaw.priority.high, perfDataRaw.priority.medium, perfDataRaw.priority.low], backgroundColor: ['rgba(239,68,68,0.75)','rgba(245,158,11,0.75)','rgba(16,185,129,0.75)'], borderRadius: 5, borderSkipped: false }],
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.tick, precision: 0 } },
            y: { grid: { display: false }, ticks: { color: c.tick } },
          },
        },
      });
    }

    // Status doughnut
    var stCtx = document.getElementById('taskStatusChart');
    var stTotal = perfDataRaw.status.open + perfDataRaw.status.inProgress + perfDataRaw.status.done + perfDataRaw.status.cancelled + perfDataRaw.status.needsOwner;
    if(stCtx && stTotal > 0){
      if(taskStatusChart) taskStatusChart.destroy();
      taskStatusChart = new Chart(stCtx, {
        type: 'doughnut',
        data: {
          labels: (window.AMORA_UI||{}).chartStatusLabels || ['Open','In Progress','Done','Cancelled','Needs Owner'],
          datasets: [{ data: [perfDataRaw.status.open, perfDataRaw.status.inProgress, perfDataRaw.status.done, perfDataRaw.status.cancelled, perfDataRaw.status.needsOwner], backgroundColor: ['#6366f1','#f59e0b','#10b981','#6b7a96','#ef4444'], borderWidth: 0, hoverOffset: 6 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'bottom', labels: { color: c.legendText, padding: 10, font: { size: 10 }, boxWidth: 10 } } },
        },
      });
    }
  }

  // Chart.js is loaded async â€” _chartReady fires when it arrives and builds the visible tab's charts.
  // If Chart.js somehow loaded synchronously (cached), build immediately.
  if(typeof Chart !== 'undefined'){
    var initTab = 'overview';
    try { initTab = localStorage.getItem('lm-tab') || 'overview'; } catch(e) {}
    setTimeout(function(){
      if(initTab === 'overview') buildCharts();
      else if(initTab === 'queues') buildQueueCharts();
      else if(initTab === 'governance')  buildGovernanceCharts();
      else if(initTab === 'people')      buildPeopleCharts();
      else if(initTab === 'performance') buildPerformanceCharts();
    }, 0);
  }

  animateCounters();

  // â”€â”€ Sera tips rotation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var seraTips = JSON.parse(document.getElementById("sera-tips-data").textContent);
  var seraCurrent = 0;
  var seraTimer;

  function badgeClass(badge) {
    if (badge === 'Did You Know?' || badge === '¿Sabías que...?') return 'didyouknow';
    if (badge === 'Pro Tip' || badge === 'Consejo Pro') return 'protip';
    if (badge === 'About Sera') return 'aboutsera';
    if (badge === 'Teal Pillar') return 'tealpillar';
    return 'tip';
  }

  window.showTip = function(idx) {
    clearInterval(seraTimer);
    seraCurrent = ((idx % seraTips.length) + seraTips.length) % seraTips.length;
    var tipEl   = document.getElementById('sera-tip');
    var badgeEl = document.getElementById('sera-badge');
    var dots    = document.querySelectorAll('.sera-dot');
    if (!tipEl || !badgeEl) return;
    tipEl.classList.remove('visible');
    setTimeout(function() {
      var t = seraTips[seraCurrent];
      badgeEl.textContent  = t.badge;
      badgeEl.className    = 'sera-badge ' + badgeClass(t.badge);
      tipEl.innerHTML      = t.text;
      tipEl.classList.add('visible');
      dots.forEach(function(d, i) { d.classList.toggle('active', i === seraCurrent); });
    }, 200);
    seraTimer = setInterval(function() { window.showTip(seraCurrent + 1); }, 22000);
  };

  window.showTip(Math.floor(Math.random() * seraTips.length));

  // â”€â”€ Sera Chat (threaded) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  (function() {
    var THREADS_KEY = 'sera-threads-v1';
    var ACTIVE_KEY  = 'sera-active-v1';
    var threads = [];
    var activeId = null;
    var pendingAttachments = [];
    var _activeController = null;
    var _sidebarCollapsed = false;

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function mkId() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    }

    function loadState() {
      try { threads = JSON.parse(localStorage.getItem(THREADS_KEY) || '[]'); } catch(e) { threads = []; }
      try { activeId = localStorage.getItem(ACTIVE_KEY) || null; } catch(e) { activeId = null; }
      if (activeId && !threads.find(function(t){ return t.id === activeId; })) activeId = null;
      try { _sidebarCollapsed = localStorage.getItem('sera-sidebar-collapsed') === '1'; } catch(e) { _sidebarCollapsed = false; }
    }

    function saveState() {
      try {
        localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
        if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
        else localStorage.removeItem(ACTIVE_KEY);
      } catch(e) {}
    }

    function getThread() {
      return activeId ? threads.find(function(t){ return t.id === activeId; }) : null;
    }

    function fmtDate(ts) {
      return new Date(ts).toLocaleDateString('en-US', { month:'short', day:'numeric' });
    }

    function parseMarkdown(text) {
      if (!text) return '';
      var saved = [];
      var TICK = '`';
      // Protect fenced code blocks (use RegExp ctor â€” backtick in regex literal closes template)
      var FENCED = new RegExp(TICK+'{3}[\w]*\n?([\s\S]*?)'+TICK+'{3}', 'g');
      text = text.replace(FENCED, function(_, body) {
        var safe = body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        saved.push('<pre class="md-pre"><code class="md-code-block">' + safe.trimEnd() + '</code></pre>');
        return '!BLK' + (saved.length-1) + '!';
      });
      // Protect inline code
      var INLINE = new RegExp(TICK+'([^'+TICK+'\n]+)'+TICK, 'g');
      text = text.replace(INLINE, function(_, body) {
        var safe = body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        saved.push('<code class="md-code">' + safe + '</code>');
        return '!BLK' + (saved.length-1) + '!';
      });
      // Escape remaining HTML
      text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      // Inline: links [text](url) — before bold/italic so brackets aren't eaten
      text = text.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\n]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      // Inline: bold then italic (single-line to avoid cross-paragraph greediness)
      text = text.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
      text = text.replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
      // Process blocks (double newline = new block)
      var blocks = text.split(/\n{2,}/);
      var html = blocks.map(function(block) {
        block = block.trim();
        if (!block) return '';
        if (/^!BLK\d+!$/.test(block)) return block;
        if (/^### /.test(block)) return '<h4 class="md-h3">' + block.slice(4) + '</h4>';
        if (/^## /.test(block)) return '<h3 class="md-h2">' + block.slice(3) + '</h3>';
        if (/^# /.test(block)) return '<h2 class="md-h1">' + block.slice(2) + '</h2>';
        var lines = block.split('\n');
        var isUl = lines.every(function(l){return !l.trim()||/^[*\-] /.test(l);}) && lines.some(function(l){return /^[*\-] /.test(l);});
        var isOl = lines.every(function(l){return !l.trim()||/^\d+\. /.test(l);}) && lines.some(function(l){return /^\d+\. /.test(l);});
        if (isUl) return '<ul class="md-ul">' + lines.filter(function(l){return l.trim();}).map(function(l){return '<li class="md-li">'+l.replace(/^[*\-] /,'')+'</li>';}).join('') + '</ul>';
        if (isOl) return '<ol class="md-ol">' + lines.filter(function(l){return l.trim();}).map(function(l){return '<li class="md-li">'+l.replace(/^\d+\. /,'')+'</li>';}).join('') + '</ol>';
        return '<p class="md-p">' + block.replace(/\n/g,'<br>') + '</p>';
      }).join('');
      // Restore saved blocks
      html = html.replace(/!BLK(\d+)!/g, function(_,i){return saved[+i];});
      return html;
    }

    function buildBubbleHtml(textHtml, sources) {
      var html = textHtml;
      if (sources && sources.length > 0) {
        var count = sources.length;
        var label = count === 1 ? '1 source' : count + ' sources';
        html += '<details class="chat-sources"><summary>' + label + '</summary><div class="chat-sources-list">';
        sources.forEach(function(s) {
          html += '<a class="chat-source-link" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a>';
        });
        html += '</div></details>';
      }
      return html;
    }

    function makeAvatar(role) {
      var el = document.createElement('div');
      el.className = 'chat-avatar' + (role === 'user' ? ' user-icon' : '');
      if (role === 'sera') {
        el.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)';
      }
      el.textContent = role === 'sera' ? 'S' : 'A';
      return el;
    }

    function makeMsgEl(role, bubbleHtml, msgIdx) {
      var div = document.createElement('div');
      div.className = 'chat-msg ' + role;
      div.appendChild(makeAvatar(role));
      if (role === 'user' && typeof msgIdx === 'number') {
        var wrap = document.createElement('div');
        wrap.className = 'chat-bubble-wrap';
        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerHTML = bubbleHtml;
        var editBtn = document.createElement('button');
        editBtn.className = 'chat-edit-btn';
        editBtn.setAttribute('data-msg-idx', String(msgIdx));
        editBtn.textContent = 'Edit';
        wrap.appendChild(bubble);
        wrap.appendChild(editBtn);
        div.appendChild(wrap);
      } else {
        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerHTML = bubbleHtml;
        div.appendChild(bubble);
      }
      return div;
    }

    function startEdit(msgDiv, msgIdx) {
      var thread = getThread();
      if (!thread) return;
      var msg = thread.messages[msgIdx];
      if (!msg || msg.role !== 'user') return;
      var wrap = msgDiv.querySelector('.chat-bubble-wrap');
      if (!wrap) return;
      var plainText = bubbleToText(msg.bubbleHtml);
      wrap.innerHTML = '';
      var form = document.createElement('div');
      form.className = 'chat-edit-form';
      var ta = document.createElement('textarea');
      ta.className = 'chat-edit-textarea';
      ta.value = plainText;
      ta.rows = 3;
      var actions = document.createElement('div');
      actions.className = 'chat-edit-actions';
      var sendBtn = document.createElement('button');
      sendBtn.className = 'chat-edit-send';
      sendBtn.textContent = 'Send';
      var cancelBtn = document.createElement('button');
      cancelBtn.className = 'chat-edit-cancel-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', function() { renderMessages(); });
      sendBtn.addEventListener('click', function() {
        var newText = ta.value.trim();
        if (!newText) return;
        thread.messages = thread.messages.slice(0, msgIdx);
        saveState();
        renderMessages();
        var chatInput = document.getElementById('chat-input');
        if (chatInput) {
          chatInput.value = newText;
          chatInput.style.height = 'auto';
          chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        }
        sendQuestion();
      });
      ta.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
        if (e.key === 'Escape') { cancelBtn.click(); }
      });
      actions.appendChild(cancelBtn);
      actions.appendChild(sendBtn);
      form.appendChild(ta);
      form.appendChild(actions);
      wrap.appendChild(form);
      ta.focus();
      ta.selectionStart = ta.selectionEnd = ta.value.length;
    }

    function applySidebar() {
      var sidebar = document.getElementById('chat-sidebar');
      var toggleBtn = document.getElementById('chat-sidebar-toggle');
      if (!sidebar) return;
      if (_sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        if (toggleBtn) toggleBtn.innerHTML = '&#8250;';
      } else {
        sidebar.classList.remove('collapsed');
        if (toggleBtn) toggleBtn.innerHTML = '&#8249;';
      }
    }

    function renderMessages() {
      var msgs = document.getElementById('chat-messages');
      var tokEl = document.getElementById('chat-tokens');
      if (!msgs) return;
      msgs.innerHTML = '';
      var thread = getThread();
      if (!thread || thread.messages.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'chat-empty';
        var emptyText = (window.AMORA_UI && window.AMORA_UI.chatEmpty) ? window.AMORA_UI.chatEmpty : "Ask Sera anything about Amora's history, decisions, people, governance, or meetings.";
        empty.innerHTML = '<div class="chat-empty-icon">&#x1F9E0;</div><div class="chat-empty-text">' + emptyText + '</div>';
        msgs.appendChild(empty);
        if (tokEl) tokEl.textContent = '';
        return;
      }
      thread.messages.forEach(function(m, idx) {
        msgs.appendChild(makeMsgEl(m.role, m.bubbleHtml, m.role === 'user' ? idx : undefined));
      });
      msgs.scrollTop = msgs.scrollHeight;
      if (tokEl) tokEl.textContent = thread.totalTokens > 0 ? 'Session tokens: ' + thread.totalTokens.toLocaleString() : '';
    }

    function renderSidebar() {
      var list = document.getElementById('chat-thread-list');
      if (!list) return;
      list.innerHTML = '';
      if (threads.length === 0) {
        list.innerHTML = '<div style="padding:10px;font-size:11px;color:var(--muted);font-style:italic">No chats yet</div>';
        return;
      }
      threads.forEach(function(t) {
        var item = document.createElement('div');
        item.className = 'chat-thread-item' + (t.id === activeId ? ' active' : '');

        var userCount = t.messages.filter(function(m){ return m.role === 'user'; }).length;
        var meta = fmtDate(t.createdAt) + (userCount > 0 ? ' Â· ' + userCount + (userCount === 1 ? ' msg' : ' msgs') : '');

        item.innerHTML =
          '<div class="chat-thread-title">' + esc(t.title) + '</div>' +
          '<div class="chat-thread-meta">' + esc(meta) + '</div>' +
          '<button class="chat-thread-del" title="Delete">&times;</button>';

        item.querySelector('.chat-thread-del').addEventListener('click', function(e) {
          e.stopPropagation();
          deleteThread(t.id);
        });

        item.addEventListener('click', function(e) {
          if (e.target.classList.contains('chat-thread-del')) return;
          activeId = t.id;
          saveState();
          renderSidebar();
          renderMessages();
        });

        list.appendChild(item);
      });
    }

    function createThread() {
      var t = { id: mkId(), title: 'New chat', messages: [], totalTokens: 0, createdAt: Date.now() };
      threads.unshift(t);
      activeId = t.id;
      saveState();
      renderSidebar();
      renderMessages();
      var inp = document.getElementById('chat-input');
      if (inp) inp.focus();
    }

    function deleteThread(id) {
      if (!confirm('Delete this chat?')) return;
      threads = threads.filter(function(t){ return t.id !== id; });
      if (activeId === id) activeId = threads.length > 0 ? threads[0].id : null;
      saveState();
      renderSidebar();
      renderMessages();
    }

    function appendMessage(role, bubbleHtml, tokens) {
      if (!activeId) createThread();
      var thread = getThread();
      if (!thread) return;
      thread.messages.push({ role: role, bubbleHtml: bubbleHtml });
      if (tokens) thread.totalTokens += tokens;
      if (role === 'user' && thread.messages.filter(function(m){ return m.role === 'user'; }).length === 1) {
        var tmp = document.createElement('div');
        tmp.innerHTML = bubbleHtml;
        thread.title = (tmp.textContent || '').slice(0, 48).trim() || 'Chat';
      }
      saveState();
      var msgs = document.getElementById('chat-messages');
      var empty = msgs && msgs.querySelector('.chat-empty');
      if (empty) empty.remove();
      if (msgs) {
        var msgIdx = role === 'user' ? thread.messages.length - 1 : undefined;
        msgs.appendChild(makeMsgEl(role, bubbleHtml, msgIdx));
        msgs.scrollTop = msgs.scrollHeight;
      }
      var tokEl = document.getElementById('chat-tokens');
      if (tokEl && thread.totalTokens > 0) tokEl.textContent = 'Session tokens: ' + thread.totalTokens.toLocaleString();
      renderSidebar();
    }

    function showThinking(label) {
      var msgs = document.getElementById('chat-messages');
      if (!msgs) return;
      var existing = document.getElementById('chat-thinking-row');
      if (existing) {
        var lbl = existing.querySelector('.chat-thinking-label');
        if (lbl) lbl.textContent = label || 'Sera is thinking...';
        return;
      }
      var div = document.createElement('div');
      div.className = 'chat-msg sera'; div.id = 'chat-thinking-row';
      var think = document.createElement('div');
      think.className = 'chat-thinking chat-thinking-active';
      think.innerHTML = '<div class="chat-thinking-dots"><span></span><span></span><span></span></div><span class="chat-thinking-label">' + (label || 'Sera is thinking...') + '</span>';
      div.appendChild(makeAvatar('sera'));
      div.appendChild(think);
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function hideThinking() {
      var row = document.getElementById('chat-thinking-row');
      if (row) row.remove();
    }

    // Extract plain text from a message's bubbleHtml (strips HTML tags and sources block)
    function bubbleToText(bubbleHtml) {
      var tmp = document.createElement('div');
      // Remove the sources <details> block before extracting text
      var clean = bubbleHtml.replace(/<details[\s\S]*?<\/details>/gi, '');
      tmp.innerHTML = clean;
      return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    }

    function buildHistory() {
      var thread = getThread();
      if (!thread) return [];
      // Collect last 8 turns (4 exchanges) as plain-text history for API context
      var turns = [];
      var msgs = thread.messages.slice(-8);
      for (var i = 0; i < msgs.length; i++) {
        var m = msgs[i];
        var content = bubbleToText(m.bubbleHtml);
        if (!content) continue;
        turns.push({ role: m.role === 'user' ? 'user' : 'assistant', content: content });
      }
      return turns;
    }

    function renderAttachmentStrip() {
      var strip = document.getElementById('chat-attach-strip');
      if (!strip) return;
      if (pendingAttachments.length === 0) {
        strip.style.display = 'none';
        strip.innerHTML = '';
        return;
      }
      strip.style.display = 'flex';
      var html = '';
      for (var i = 0; i < pendingAttachments.length; i++) {
        var a = pendingAttachments[i];
        var rmBtn = '<button class="chat-attach-remove" data-idx="' + i + '" title="Remove">×</button>';
        if (a.type === 'image') {
          html += '<div class="chat-attach-thumb"><img src="' + a.previewUrl + '" alt="">' + rmBtn + '</div>';
        } else {
          var shortName = a.name.length > 11 ? a.name.slice(0, 9) + '..' : a.name;
          html += '<div class="chat-attach-thumb"><div class="chat-attach-thumb-text"><span style="font-size:20px;opacity:.5">&#128196;</span>' + esc(shortName) + '</div>' + rmBtn + '</div>';
        }
      }
      strip.innerHTML = html;
    }

    function processFiles(files) {
      var ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      var ALLOWED_TEXT_EXTS = ['.txt', '.md', '.csv', '.json'];
      Array.prototype.forEach.call(files, function(file) {
        var isImage = ALLOWED_IMAGE.indexOf(file.type) !== -1;
        var fname = file.name || '';
        var dotIdx = fname.lastIndexOf('.');
        var ext = dotIdx !== -1 ? fname.slice(dotIdx).toLowerCase() : '';
        var isText = !isImage && (file.type === 'text/plain' || file.type === 'text/markdown' || ALLOWED_TEXT_EXTS.indexOf(ext) !== -1);
        if (!isImage && !isText) return;
        var reader = new FileReader();
        if (isImage) {
          reader.onload = function(e) {
            var dataUrl = e.target.result;
            var comma = dataUrl.indexOf(',');
            var meta = dataUrl.slice(0, comma);   // e.g. "data:image/png;base64"
            var data = dataUrl.slice(comma + 1);
            var mediaType = meta.split(':')[1].split(';')[0];
            pendingAttachments.push({ type: 'image', mediaType: mediaType, data: data, name: fname || 'image', previewUrl: dataUrl });
            renderAttachmentStrip();
          };
          reader.readAsDataURL(file);
        } else {
          reader.onload = function(e) {
            pendingAttachments.push({ type: 'text', name: fname || 'file.txt', textContent: e.target.result });
            renderAttachmentStrip();
          };
          reader.readAsText(file);
        }
      });
    }

    function sendQuestion() {
      var input = document.getElementById('chat-input');
      var sendBtn = document.getElementById('chat-send');
      var cancelBtn = document.getElementById('chat-cancel-btn');
      if (!input || !sendBtn || sendBtn.disabled) return;
      var q = input.value.trim();
      if (!q && pendingAttachments.length === 0) return;
      if (!activeId) createThread();
      var history = buildHistory();

      // Collect attachments: text files appended to question text, images sent to API
      var imageAttachments = [];
      var imagePreviews = [];
      var questionText = q;
      pendingAttachments.forEach(function(a) {
        if (a.type === 'image') {
          imageAttachments.push({ mediaType: a.mediaType, data: a.data });
          imagePreviews.push(a.previewUrl);
        } else {
          questionText += (questionText ? '\n\n' : '') + '[Attached: ' + a.name + ']\n' + a.textContent;
        }
      });
      pendingAttachments = [];
      renderAttachmentStrip();

      input.value = ''; input.style.height = '';
      sendBtn.disabled = true;
      if (cancelBtn) cancelBtn.style.display = '';

      // User bubble shows typed text + image thumbnails (not raw file content)
      var displayLabel = q || (imageAttachments.length > 0 ? '[image]' : '[file]');
      var userHtml = q ? esc(q).replace(/\n/g, '<br>') : '';
      if (imagePreviews.length > 0) {
        userHtml += '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:7px">';
        imagePreviews.forEach(function(url) {
          userHtml += '<img src="' + url + '" style="max-width:90px;max-height:90px;border-radius:5px;object-fit:cover" alt="">';
        });
        userHtml += '</div>';
      }
      appendMessage('user', userHtml || esc(displayLabel), 0);
      showThinking();

      var accText = '';
      var bubbleEl = null;
      var needsSeparator = false;
      var capturedSources = [];
      var capturedTokens = 0;
      var capturedThreadId = activeId;
      var controller = new AbortController();
      _activeController = controller;

      function cleanup(focusInput) {
        _activeController = null;
        sendBtn.disabled = false;
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (focusInput) { var inp = document.getElementById('chat-input'); if (inp) inp.focus(); }
      }

      function finalize() {
        var finalHtml = buildBubbleHtml(parseMarkdown(accText), capturedSources);
        if (bubbleEl) bubbleEl.innerHTML = finalHtml;
        if (activeId === capturedThreadId) {
          var thread = getThread();
          if (thread && bubbleEl) {
            thread.messages.push({ role: 'sera', bubbleHtml: finalHtml });
            if (capturedTokens) thread.totalTokens += capturedTokens;
            saveState();
            renderSidebar();
            var tokEl = document.getElementById('chat-tokens');
            if (tokEl && thread.totalTokens > 0) tokEl.textContent = 'Session tokens: ' + thread.totalTokens.toLocaleString();
          }
        }
        cleanup(true);
      }

      var reqBody = { question: questionText || displayLabel, history: history };
      if (imageAttachments.length > 0) reqBody.images = imageAttachments;

      fetch('/sera/ask-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
        signal: controller.signal,
      })
      .then(function(r) {
        if (!r.ok || !r.body) throw new Error('HTTP ' + r.status);
        var reader = r.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        function processLine(line) {
          if (!line || line === 'data: [DONE]') return;
          if (!line.startsWith('data: ')) return;
          var data;
          try { data = JSON.parse(line.slice(6)); } catch(e) { return; }

          if (data.type === 'text') {
            hideThinking();
            var msgs = document.getElementById('chat-messages');
            if (!bubbleEl) {
              var msgEl = makeMsgEl('sera', '');
              bubbleEl = msgEl.querySelector('.chat-bubble');
              if (msgs) { msgs.appendChild(msgEl); msgs.scrollTop = msgs.scrollHeight; }
            }
            if (needsSeparator) {
              if (accText && !accText.endsWith('\n\n')) accText += '\n\n';
              needsSeparator = false;
            }
            accText += data.delta;
            if (bubbleEl) {
              bubbleEl.innerHTML = parseMarkdown(accText);
              if (msgs && msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 120) {
                msgs.scrollTop = msgs.scrollHeight;
              }
            }
          } else if (data.type === 'thinking') {
            if (bubbleEl && accText) needsSeparator = true;
            showThinking(data.label || 'Working...');
          } else if (data.type === 'sources') {
            capturedSources = data.sources || [];
          } else if (data.type === 'tokens') {
            capturedTokens = data.count || 0;
          } else if (data.type === 'error') {
            hideThinking();
            appendMessage('sera', '<span style="color:var(--red)">' + esc(data.message || 'Error') + '</span>', 0);
            cleanup(true);
          }
        }

        function pump() {
          return reader.read().then(function(result) {
            if (result.done) {
              if (buffer) processLine(buffer.trim());
              finalize();
              return;
            }
            buffer += decoder.decode(result.value, { stream: true });
            var lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (var i = 0; i < lines.length; i++) processLine(lines[i].trim());
            return pump();
          });
        }
        return pump();
      })
      .catch(function(err) {
        hideThinking();
        if (err && err.name === 'AbortError') {
          // User cancelled — preserve any partial response
          if (accText) finalize();
          else cleanup(false);
        } else {
          appendMessage('sera', '<span style="color:var(--red)">Could not reach Sera. Check server logs.</span>', 0);
          cleanup(true);
        }
      });
    }

    // Init
    loadState();
    applySidebar();
    if (threads.length === 0) createThread();
    else { renderSidebar(); renderMessages(); }

    var newBtn = document.getElementById('chat-new-btn');
    if (newBtn) newBtn.addEventListener('click', createThread);

    var sidebarToggleEl = document.getElementById('chat-sidebar-toggle');
    if (sidebarToggleEl) {
      sidebarToggleEl.addEventListener('click', function() {
        _sidebarCollapsed = !_sidebarCollapsed;
        try { localStorage.setItem('sera-sidebar-collapsed', _sidebarCollapsed ? '1' : '0'); } catch(e) {}
        applySidebar();
      });
    }

    var chatMsgsEl = document.getElementById('chat-messages');
    if (chatMsgsEl) {
      chatMsgsEl.addEventListener('click', function(e) {
        var btn = e.target;
        while (btn && btn !== chatMsgsEl) {
          if (btn.classList && btn.classList.contains('chat-edit-btn')) {
            var idx = parseInt(btn.getAttribute('data-msg-idx'), 10);
            if (!isNaN(idx)) {
              var msgDiv = btn.parentNode && btn.parentNode.parentNode;
              if (msgDiv && msgDiv.classList && msgDiv.classList.contains('chat-msg')) startEdit(msgDiv, idx);
            }
            return;
          }
          btn = btn.parentNode;
        }
      });
    }

    var sendBtnEl = document.getElementById('chat-send');
    if (sendBtnEl) sendBtnEl.addEventListener('click', sendQuestion);

    // Cancel button — aborts the active stream
    var cancelBtnEl = document.getElementById('chat-cancel-btn');
    if (cancelBtnEl) {
      cancelBtnEl.addEventListener('click', function() {
        if (_activeController) { _activeController.abort(); }
      });
    }

    var chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', function(e) {
        // Escape cancels a running stream
        if (e.key === 'Escape' && _activeController) { e.preventDefault(); _activeController.abort(); return; }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(); }
      });
      chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
      // Intercept image paste from clipboard
      chatInput.addEventListener('paste', function(e) {
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (var i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image/') === 0) {
            var f = items[i].getAsFile();
            if (f) { e.preventDefault(); processFiles([f]); }
          }
        }
      });
    }

    // + button opens file picker
    var attachBtnEl = document.getElementById('chat-attach-btn');
    var fileInputEl = document.getElementById('chat-file-input');
    if (attachBtnEl && fileInputEl) {
      attachBtnEl.addEventListener('click', function() { fileInputEl.click(); });
      fileInputEl.addEventListener('change', function() {
        if (fileInputEl.files && fileInputEl.files.length > 0) {
          processFiles(fileInputEl.files);
          fileInputEl.value = ''; // reset so same file can be re-selected
        }
      });
    }

    // Drag-and-drop onto chat main area
    var chatMain = document.querySelector('.chat-main');
    var dropOverlayEl = document.getElementById('chat-drop-overlay');
    if (chatMain) {
      chatMain.addEventListener('dragover', function(e) {
        e.preventDefault(); e.stopPropagation();
        if (dropOverlayEl) dropOverlayEl.style.display = 'flex';
      });
      chatMain.addEventListener('dragleave', function(e) {
        if (!chatMain.contains(e.relatedTarget)) {
          if (dropOverlayEl) dropOverlayEl.style.display = 'none';
        }
      });
      chatMain.addEventListener('drop', function(e) {
        e.preventDefault(); e.stopPropagation();
        if (dropOverlayEl) dropOverlayEl.style.display = 'none';
        var files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) processFiles(files);
      });
    }

    // Attachment strip — delegated click for remove buttons
    var attachStripEl = document.getElementById('chat-attach-strip');
    if (attachStripEl) {
      attachStripEl.addEventListener('click', function(e) {
        var btn = e.target;
        while (btn && btn !== attachStripEl) {
          if (btn.classList && btn.classList.contains('chat-attach-remove')) {
            var idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (!isNaN(idx)) { pendingAttachments.splice(idx, 1); renderAttachmentStrip(); }
            return;
          }
          btn = btn.parentNode;
        }
      });
    }
  })();

  // â”€â”€ Next-poll countdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  (function() {
    var els = [document.getElementById('next-poll-hdr'), document.getElementById('next-poll-footer')];
    var atStr = (els[1] || els[0]) && (els[1] || els[0]).getAttribute('data-at');
    if (!atStr) return;
    var target = new Date(atStr).getTime();
    function tick() {
      var diff = Math.round((target - Date.now()) / 1000);
      var label;
      if (diff <= 0) {
        label = 'now';
      } else if (diff < 60) {
        label = 'in ' + diff + 's';
      } else {
        var m = Math.floor(diff / 60), s = diff % 60;
        label = 'in ' + m + 'm ' + (s > 0 ? s + 's' : '');
      }
      els.forEach(function(el){ if (el) el.textContent = label; });
      if (diff > 0) setTimeout(tick, 1000);
    }
    tick();
  })();

})();

// ── Governing Purpose Statement editor ────────────────────────────────────────
function saveGPS() {
  var text = (document.getElementById('gps-text') || {}).value || '';
  var status = document.getElementById('gps-status');
  if (!text.trim()) {
    if (status) { status.textContent = 'Cannot be empty.'; status.style.color = 'var(--red)'; }
    return;
  }
  if (status) { status.textContent = 'Saving...'; status.style.color = 'var(--muted)'; }
  fetch('/settings/gps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'gps=' + encodeURIComponent(text.trim()),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      if (status) { status.textContent = 'Saved.'; status.style.color = 'var(--green)'; }
      setTimeout(function() { window.location.reload(); }, 800);
    } else {
      if (status) { status.textContent = 'Error: ' + (d.error || 'unknown'); status.style.color = 'var(--red)'; }
    }
  }).catch(function() {
    if (status) { status.textContent = 'Network error.'; status.style.color = 'var(--red)'; }
  });
}

function savePurposeTest() {
  var text = (document.getElementById('pt-text') || {}).value || '';
  var status = document.getElementById('pt-status');
  if (!text.trim()) {
    if (status) { status.textContent = 'Cannot be empty.'; status.style.color = 'var(--red)'; }
    return;
  }
  if (status) { status.textContent = 'Saving...'; status.style.color = 'var(--muted)'; }
  fetch('/settings/purpose-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'pt=' + encodeURIComponent(text.trim()),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      if (status) { status.textContent = 'Saved.'; status.style.color = 'var(--green)'; }
      setTimeout(function() { window.location.reload(); }, 800);
    } else {
      if (status) { status.textContent = 'Error: ' + (d.error || 'unknown'); status.style.color = 'var(--red)'; }
    }
  }).catch(function() {
    if (status) { status.textContent = 'Network error.'; status.style.color = 'var(--red)'; }
  });
}

function saveLanguage() {
  var select = document.getElementById('lang-select');
  var lang = select ? select.value : '';
  var status = document.getElementById('lang-status');
  if (!lang) return;
  if (status) { status.textContent = 'Saving...'; status.style.color = 'var(--muted)'; }
  fetch('/settings/language', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'language=' + encodeURIComponent(lang),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      if (status) { status.textContent = 'Saved. Worker syncing within 2 min.'; status.style.color = 'var(--muted)'; }
      setTimeout(function() { if (status) { status.textContent = 'Active.'; status.style.color = 'var(--green)'; } }, 120000);
    } else {
      if (status) { status.textContent = 'Error: ' + (d.error || 'unknown'); status.style.color = 'var(--red)'; }
    }
  }).catch(function() {
    if (status) { status.textContent = 'Network error.'; status.style.color = 'var(--red)'; }
  });
}

function saveCorrectionMode() {
  var select = document.getElementById('correction-mode-select');
  var mode = select ? select.value : '';
  var status = document.getElementById('correction-mode-status');
  if (!mode) return;
  if (status) { status.textContent = 'Saving...'; status.style.color = 'var(--muted)'; }
  fetch('/settings/correction-mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'mode=' + encodeURIComponent(mode),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      if (status) { status.textContent = 'Saved. Worker syncing within 2 min.'; status.style.color = 'var(--muted)'; }
      setTimeout(function() { if (status) { status.textContent = 'Active.'; status.style.color = 'var(--green)'; } }, 120000);
    } else {
      if (status) { status.textContent = 'Error: ' + (d.error || 'unknown'); status.style.color = 'var(--red)'; }
    }
  }).catch(function() {
    if (status) { status.textContent = 'Network error.'; status.style.color = 'var(--red)'; }
  });
}

function saveDbPermissions() {
  var status = document.getElementById('db-perm-status');
  var checkboxes = document.querySelectorAll('.db-perm');
  var permissions = {};
  checkboxes.forEach(function(cb) {
    var key = cb.getAttribute('data-key');
    var op = cb.getAttribute('data-op');
    if (!key || !op) return;
    if (!permissions[key]) permissions[key] = { create: true, update: true };
    permissions[key][op] = cb.checked;
  });
  if (status) { status.textContent = 'Saving...'; status.style.color = 'var(--muted)'; }
  fetch('/settings/db-permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(permissions),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      if (status) {
        var secs = 120;
        status.style.color = 'var(--muted)';
        var tick = setInterval(function() {
          secs--;
          if (!status) { clearInterval(tick); return; }
          if (secs <= 0) {
            clearInterval(tick);
            status.textContent = 'Active on all services.';
            status.style.color = 'var(--green)';
          } else {
            status.textContent = 'Saved. Worker syncing... (' + secs + 's)';
          }
        }, 1000);
      }
    } else {
      if (status) { status.textContent = 'Error: ' + (d.error || 'unknown'); status.style.color = 'var(--red)'; }
    }
  }).catch(function() {
    if (status) { status.textContent = 'Network error.'; status.style.color = 'var(--red)'; }
  });
}

// Global helper: fill the Sera chat with a question and optionally auto-send it.
// Called by collapse pattern "Ask Sera for guidance" buttons.
window.askSera = function(question, autoSend) {
  var inp = document.getElementById('chat-input');
  if (!inp) return;
  // Switch to Sera chat tab if visible
  if (typeof window.switchTab === 'function') window.switchTab('sera-chat');
  inp.value = question;
  inp.style.height = 'auto';
  inp.style.height = Math.min(inp.scrollHeight, 140) + 'px';
  inp.focus();
  if (autoSend) {
    var sendBtn = document.getElementById('chat-send');
    if (sendBtn && !sendBtn.disabled) setTimeout(function() { sendBtn.click(); }, 100);
  }
};
