/**
 * Chovy Profile View - Premium & Rich AI Content with Personalized Suggestion Engine
 * Upgraded to General User Portrait and Custom SVG Radar Chart
 */

const ChovyProfile = (() => {
  function init() {
    setupClearButton();
  }

  function showProfile() {
    const metrics = getPortraitMetrics();
    renderStats();
    renderRadarChart(metrics);
    renderAIInsight();
    renderPreferences();
    renderHistory();
  }

  function getPortraitMetrics() {
    const profile = ChovyStorage.getProfile();
    const prefs = profile.preferences;
    const history = ChovyStorage.getSessionHistory();

    const sessions = prefs.total_sessions || 0;
    const choices = prefs.total_choices || 0;

    // Default premium values if no data
    if (!choices || choices === 0) {
      return {
        rationality: 82,
        quality: 75,
        critical: 88,
        agility: 65,
        curiosity: 90,
        realism: 70
      };
    }

    // Dynamic calculations
    // 1. Rationality (决策理性): based on choices & session depth
    const avgRounds = sessions > 0 ? (choices / sessions) : 1;
    let rationality = Math.min(60 + (choices * 3) + (avgRounds * 5), 96);
    rationality = Math.max(45, Math.round(rationality));

    // 2. Quality (品质生活): ratio of premium choices
    const premiumCount = prefs.price_sensitivity?.premium || 0;
    const midCount = prefs.price_sensitivity?.mid || 0;
    const budgetCount = prefs.price_sensitivity?.budget || 0;
    const totalPrices = premiumCount + midCount + budgetCount;
    let qualityRatio = totalPrices > 0 ? (premiumCount * 1.0 + midCount * 0.5) / totalPrices : 0.6;
    let quality = Math.min(50 + (qualityRatio * 45), 95);
    quality = Math.max(40, Math.round(quality));

    // 3. Critical Thinking (独立思考): deep debate evaluation
    let critical = Math.min(65 + (sessions * 4) + (avgRounds * 4), 98);
    critical = Math.max(50, Math.round(critical));

    // 4. Decisiveness (敏捷决策): inverse of high rounds (very high rounds = analysis paralysis, fast is decisive)
    let agility = 95 - Math.min((avgRounds - 1) * 8, 45);
    agility = Math.max(40, Math.round(agility));

    // 5. Tech & AI Curiosity (极客探索): distinct categories & brands
    const distinctBrands = Object.keys(prefs.brand_affinity || {}).length;
    const distinctCategories = Object.keys(prefs.category_affinity || {}).length;
    let curiosity = Math.min(55 + (distinctBrands * 8) + (distinctCategories * 10), 96);
    curiosity = Math.max(45, Math.round(curiosity));

    // 6. Practical Realism (场景实用): scene affinity towards commuting/practicality
    let practicalCount = 0;
    Object.entries(prefs.scene_affinity || {}).forEach(([k, v]) => {
      const lowerK = k.toLowerCase();
      if (lowerK.includes('通勤') || lowerK.includes('日常') || lowerK.includes('实用') || lowerK.includes('户外') || lowerK.includes('上班')) {
        practicalCount += v;
      }
    });
    const practicalRatio = choices > 0 ? (practicalCount / choices) : 0.5;
    let realism = Math.min(55 + (practicalRatio * 40), 94);
    realism = Math.max(45, Math.round(realism));

    return { rationality, quality, critical, agility, curiosity, realism };
  }

  function renderStats() {
    const profile = ChovyStorage.getProfile();
    const prefs = profile.preferences;
    const history = ChovyStorage.getSessionHistory();

    const elSessions = document.getElementById('statSessions');
    const elChoices = document.getElementById('statChoices');
    const elChampions = document.getElementById('statChampions');

    if (elSessions) elSessions.textContent = prefs.total_sessions || 0;
    if (elChoices) elChoices.textContent = prefs.total_choices || 0;
    if (elChampions) {
      // Calculate number of unique champion products in history
      const uniqueChamps = new Set(history.map(h => h.champion_name).filter(Boolean));
      elChampions.textContent = uniqueChamps.size || history.length || 0;
    }
  }

  function renderRadarChart(metrics) {
    const container = document.getElementById('radarChartContainer');
    if (!container) return;

    const data = [
      { label: '决策理性', value: metrics.rationality },
      { label: '品质追求', value: metrics.quality },
      { label: '场景实用', value: metrics.realism },
      { label: '独立思考', value: metrics.critical },
      { label: '敏捷决策', value: metrics.agility },
      { label: '极客探索', value: metrics.curiosity }
    ];

    const size = 260;
    const radius = 80;
    const center = size / 2;
    const totalAxes = data.length;
    const angleStep = (Math.PI * 2) / totalAxes;

    // Build concentric grids (hexagons)
    let gridHTML = '';
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    levels.forEach(level => {
      const r = radius * level;
      const points = [];
      for (let i = 0; i < totalAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      gridHTML += `<polygon points="${points.join(' ')}" fill="none" stroke="var(--glass-border)" stroke-width="1" />`;
    });

    // Build axes web lines & labels
    let webHTML = '';
    let labelsHTML = '';
    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      
      // Line
      const lx = center + radius * Math.cos(angle);
      const ly = center + radius * Math.sin(angle);
      webHTML += `<line x1="${center}" y1="${center}" x2="${lx}" y2="${ly}" stroke="var(--glass-border)" stroke-dasharray="2,2" stroke-width="1" />`;

      // Label positioning
      const labelDist = radius + 22;
      const tx = center + labelDist * Math.cos(angle);
      let ty = center + labelDist * Math.sin(angle);

      // Label alignment settings
      let textAnchor = 'middle';
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      if (cosA > 0.2) {
        textAnchor = 'start';
      } else if (cosA < -0.2) {
        textAnchor = 'end';
      }

      if (Math.abs(sinA) < 0.1) {
        ty += 4; // slight center adjust
      } else if (sinA > 0.8) {
        ty += 5; // bottom push
      } else if (sinA < -0.8) {
        ty -= 2; // top push
      }

      labelsHTML += `
        <text x="${tx}" y="${ty}" text-anchor="${textAnchor}" fill="var(--text-primary)" font-size="11" font-weight="600" class="radar-label">
          ${data[i].label}
          <tspan x="${tx}" dy="12" fill="var(--accent-crimson)" font-size="9" font-weight="800">${data[i].value}%</tspan>
        </text>
      `;
    }

    // Build data polygon
    const polygonPoints = [];
    data.forEach((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * (d.value / 100);
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      polygonPoints.push(`${x},${y}`);
    });

    // Dots at each vertex
    let dotsHTML = '';
    data.forEach((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius * (d.value / 100);
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      dotsHTML += `
        <circle cx="${x}" cy="${y}" r="4" fill="var(--accent-cyan)" stroke="var(--accent-crimson)" stroke-width="1.5" class="radar-dot">
          <title>${d.label}: ${d.value}%</title>
        </circle>
      `;
    });

    const svg = `
      <svg width="100%" height="260" viewBox="0 0 ${size} ${size}" class="radar-svg" style="overflow: visible;">
        <!-- Glowing background filter -->
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="var(--accent-crimson)" stop-opacity="0.15" />
            <stop offset="100%" stop-color="var(--bg-obsidian)" stop-opacity="0" />
          </radialGradient>
        </defs>
        
        <!-- Background Glow -->
        <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#radarGlow)" />
        
        <!-- Hexagon Grids -->
        ${gridHTML}
        
        <!-- Radial Web Lines -->
        ${webHTML}
        
        <!-- Data Polygon -->
        <polygon points="${polygonPoints.join(' ')}" fill="oklch(0.68 0.18 355 / 0.15)" stroke="var(--accent-crimson)" stroke-width="2.5" class="radar-polygon" />
        
        <!-- Data Dots -->
        ${dotsHTML}
        
        <!-- Labels -->
        ${labelsHTML}
      </svg>
    `;

    container.innerHTML = svg;
  }

  function renderAIInsight() {
    const cloud = document.getElementById('profileTagCloud');
    const insightContent = document.getElementById('aiInsightContent');
    if (!cloud || !insightContent) return;

    const profile = ChovyStorage.getProfile();
    const prefs = profile.preferences;
    const metrics = getPortraitMetrics();

    // Check if user has done any real sessions
    if (!prefs.total_choices || prefs.total_choices === 0) {
      cloud.innerHTML = `
        <span class="profile-tag">理性思辨者</span>
        <span class="profile-tag">轻奢生活家</span>
        <span class="profile-tag">科技探索极客</span>
      `;
      insightContent.innerHTML = "您在决策时展现出<strong>高度理性的思辨特质</strong>。面对海量博主的观点冲突（如“控油神器”与“拔干闷痘”），您能够保持独立思考，通过多轮交叉对比剔除情绪化带货噪音。您在品质预算上追求高感体验，同时极其注重日常通勤等实际场景的普适适配。建议多利用‘刀盾’的AI辩论系统，获取更精准的科学选品配比。";
      return;
    }

    // Dynamic tags based on scores!
    const tags = [];
    if (metrics.rationality > 80) tags.push("硬核理性派");
    else tags.push("温和务实家");

    if (metrics.quality > 80) tags.push("质感臻选官");
    else if (metrics.realism > 75) tags.push("极致实用党");
    else tags.push("平衡决策者");

    if (metrics.critical > 85) tags.push("辩证思考达人");
    else tags.push("高效信息流者");

    cloud.innerHTML = tags.map(t => `<span class="profile-tag">${t}</span>`).join('');

    // Generate dynamic professional-looking insight prose!
    let intro = `分析了您的 <strong>${prefs.total_sessions}</strong> 次深度对决及 <strong>${prefs.total_choices}</strong> 个决策样本后，Chovy AI 为您出具认知画像：<br/><br/>`;
    
    let rationalityPart = metrics.rationality > 80 
      ? `您的<strong>决策理性度 (${metrics.rationality}%)</strong> 处于极高水平。您擅长过滤营销话术，通过结构化对比剖析产品本质。`
      : `您的决策风格高效利落，能够快速在大牌与平价产品间捕捉符合自己日常实际需求的核心要点。`;

    let criticalPart = metrics.critical > 85
      ? ` 并且，您具备极佳的<strong>独立思考力 (${metrics.critical}%)</strong>，博主间的观点对决激发了您的探索求知欲，促使您更偏好具有硬核实测支撑的数据。`
      : ` 决策过程中，您倾向于直接听取多方论证的最核心结论，节省宝贵的筛选精力。`;

    let qualityPart = "";
    if (metrics.quality > 80) {
      qualityPart = " 您在生活品质上追求奢华与极致，更看重产品的质感、经典设计与核心成分，是典型的‘高品质生活家’。";
    } else if (metrics.realism > 75) {
      qualityPart = " 您极度关注实际的适用性与性价比。在喧嚣的带货中，您总能精准筛选出最耐用、在各种日常通勤场景中表现最稳健的‘六边形战士’产品。";
    } else {
      qualityPart = " 您的消费态度非常均衡理智，主张‘只买对的，不买贵的’，让每一次选择都恰到好处。";
    }

    let summaryPart = "<br/><br/>建议您后续继续使用 Chovy 辩论，我们将会不断校准您的画像星图，并为您过滤更多无谓的决策内耗。";

    insightContent.innerHTML = `${intro}${rationalityPart}${criticalPart}${qualityPart}${summaryPart}`;
  }

  function renderPreferences() {
    const grid = document.getElementById('prefsGrid');
    if (!grid) return;

    const metrics = getPortraitMetrics();

    const cards = [
      {
        label: '决策理性度',
        value: `${metrics.rationality}%`,
        desc: '逻辑严密，多角度交叉评估参数',
        percent: metrics.rationality,
        color: 'var(--accent-cyan)'
      },
      {
        label: '品质追求度',
        value: `${metrics.quality}%`,
        desc: '偏好高精质感与轻奢尖端体验',
        percent: metrics.quality,
        color: 'var(--accent-crimson)'
      },
      {
        label: '独立思考度',
        value: `${metrics.critical}%`,
        desc: '无惧博主冲突，深度辩证分析',
        percent: metrics.critical,
        color: 'var(--accent-orange)'
      },
      {
        label: '敏捷决策度',
        value: `${metrics.agility}%`,
        desc: '快速排除干扰，精准捕获痛点',
        percent: metrics.agility,
        color: 'var(--accent-cyan)'
      },
      {
        label: '极客探索度',
        value: `${metrics.curiosity}%`,
        desc: '热衷尝试AI分析与前沿话题',
        percent: metrics.curiosity,
        color: 'var(--accent-crimson)'
      },
      {
        label: '场景实用度',
        value: `${metrics.realism}%`,
        desc: '偏好高性价比与通勤多场景适配',
        percent: metrics.realism,
        color: 'var(--accent-orange)'
      }
    ];

    grid.innerHTML = cards.map(c => `
      <div class="pref-card">
        <div class="pref-card-header">
          <div class="pref-card-label">${c.label}</div>
          <div class="pref-card-value" style="color: ${c.color}">${c.value}</div>
        </div>
        <div class="pref-card-desc">${c.desc}</div>
        <div class="pref-bar-container">
          <div class="pref-bar">
            <div class="pref-bar-fill" style="width: ${c.percent}%; background: linear-gradient(90deg, ${c.color}, var(--accent-crimson));"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderHistory() {
    const list = document.getElementById('profileHistoryList');
    const empty = document.getElementById('emptyHistory');
    if (!list) return;

    const history = ChovyStorage.getSessionHistory();

    if (history.length === 0) {
      if (empty) empty.style.display = 'block';
      list.innerHTML = '';
      return;
    }

    if (empty) empty.style.display = 'none';
    list.innerHTML = history.map(s => {
      const time = formatTime(s.timestamp);
      return `
        <div class="history-item">
          <div class="history-item-icon" style="color: var(--accent-crimson); background: var(--bg-obsidian);"><span class="material-icons-outlined">psychology</span></div>
          <div class="history-item-info">
            <div class="history-item-name" style="font-weight: 700;">${s.champion_name || '已选定优选产品'}</div>
            <div class="history-item-time">${time} · 深度对比 ${s.rounds?.length || 0} 轮 · 🏆 决策优选</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setupClearButton() {
    const btn = document.getElementById('clearDataBtn');
    if (btn) {
      // Re-bind to prevent double events
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有偏好和决策历史数据吗？此操作不可撤销。')) {
          ChovyStorage.clearAll();
          showProfile();
        }
      });
    }
  }

  function formatTime(timestamp) {
    const d = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    return Math.floor(diff / 86400) + '天前';
  }

  return { init, showProfile };
})();
