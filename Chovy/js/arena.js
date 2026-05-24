/**
 * Chovy Cosmetics Battle Royale AVG - arena.js
 * Integrates interactive combat animation, audio synthesizer, and decision recommendations.
 */

const ChovyArena = (() => {

  // --- 🔊 Web Audio API Retro Synthesizer Class ---
  class BleepSynth {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
    }

    // Initialize Audio Context on User Gesture
    init() {
      if (this.ctx) return;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // Keep volume comfortable
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.warn('Web Audio synthesis initialization failed:', e);
      }
    }

    // Synthesis of Speech Blips (Garrulous dialogue sounds)
    playSpeak(pmType) {
      try {
        if (!this.ctx || this.ctx.state === 'suspended') return;

        let baseFreq, waveType, pitchShift;
        
        switch (pmType) {
          case 'luxury':
            baseFreq = 520;       // High-pitched, aristocratic tone
            waveType = 'triangle'; // Elegant wave
            pitchShift = 80;
            break;
          case 'science':
            baseFreq = 260;       // Nerd-like monotone buzzer
            waveType = 'square';   // Sharp analytical wave
            pitchShift = 20;
            break;
          case 'budget':
            baseFreq = 185;       // High-energy low-mid shouting
            waveType = 'sawtooth'; // Loud energetic wave
            pitchShift = 100;
            break;
          case 'boss':
            baseFreq = 330;
            waveType = 'sine';
            pitchShift = 60;
            break;
          default:
            baseFreq = 300;
            waveType = 'sine';
            pitchShift = 100;
        }

        const now = this.ctx.currentTime;
        
        // Create quick sequence of 3 retro blips to simulate "syllables"
        for (let i = 0; i < 3; i++) {
          const blipTime = now + (i * 0.08);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = waveType;
          // Slightly randomize frequency to simulate voice inflections
          const freq = baseFreq + (Math.random() * pitchShift - (pitchShift / 2));
          osc.frequency.setValueAtTime(freq, blipTime);

          // Pitch sweep
          if (pmType === 'budget') {
            osc.frequency.exponentialRampToValueAtTime(freq * 1.6, blipTime + 0.06);
          } else if (pmType === 'luxury') {
            osc.frequency.linearRampToValueAtTime(freq * 0.9, blipTime + 0.03);
            osc.frequency.linearRampToValueAtTime(freq * 1.05, blipTime + 0.06);
          }

          // Envelope
          gain.gain.setValueAtTime(0.0001, blipTime);
          gain.gain.linearRampToValueAtTime(0.15, blipTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, blipTime + 0.07);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(blipTime);
          osc.stop(blipTime + 0.08);
        }
      } catch (e) {
        console.warn('Web Audio playSpeak bypassed due to sandbox/hardware limits:', e);
      }
    }

    // Synthesis of Critical Explosions
    playCrit() {
      try {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.55);

        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(80, now);
        subOsc.frequency.exponentialRampToValueAtTime(12, now + 0.45);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.5);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.35, now + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + 0.6);
        subOsc.stop(now + 0.6);
      } catch (e) {
        console.warn('Web Audio playCrit bypassed due to sandbox/hardware limits:', e);
      }
    }

    // Consumer panic chime
    playBossComing() {
      try {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        const now = this.ctx.currentTime;

        const notes = [440, 392, 330, 261]; // A4, G4, E4, C4
        notes.forEach((freq, idx) => {
          const noteTime = now + (idx * 0.18);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);
          
          gain.gain.setValueAtTime(0.0001, noteTime);
          gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.16);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.18);
        });

        const alarmTime = now + 0.72;
        const oscAlarm = this.ctx.createOscillator();
        oscAlarm.type = 'triangle';
        oscAlarm.frequency.setValueAtTime(220, alarmTime);
        oscAlarm.frequency.linearRampToValueAtTime(110, alarmTime + 0.6);

        const gainAlarm = this.ctx.createGain();
        gainAlarm.gain.setValueAtTime(0.0001, alarmTime);
        gainAlarm.gain.linearRampToValueAtTime(0.2, alarmTime + 0.1);
        gainAlarm.gain.exponentialRampToValueAtTime(0.001, alarmTime + 0.6);

        oscAlarm.connect(gainAlarm);
        gainAlarm.connect(this.masterGain);

        oscAlarm.start(alarmTime);
        oscAlarm.stop(alarmTime + 0.6);
      } catch (e) {
        console.warn('Web Audio playBossComing bypassed due to sandbox/hardware limits:', e);
      }
    }

    // Triumphant Fanfare for the Winner (Arpeggio sweep)
    playVictoryFanfare() {
      try {
        if (!this.ctx || this.ctx.state === 'suspended') return;
        const now = this.ctx.currentTime;

        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
        
        notes.forEach((freq, idx) => {
          const noteTime = now + (idx * 0.1);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          const duration = idx === notes.length - 1 ? 1.0 : 0.25;

          gain.gain.setValueAtTime(0.0001, noteTime);
          gain.gain.linearRampToValueAtTime(0.22, noteTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration - 0.02);

          osc.connect(gain);
          gain.connect(this.masterGain);
          
          osc.start(noteTime);
          osc.stop(noteTime + duration);
        });
      } catch (e) {
        console.warn('Web Audio playVictoryFanfare bypassed due to sandbox/hardware limits:', e);
      }
    }
  }

  const synth = new BleepSynth();

  // --- 🎬 Cosmetics Story Script Dialogue Sequence ---
  const battleScript = [
    {
      speaker: 'system',
      text: '混油皮日常通勤，谁最能撑到下班？【点击屏幕/按 ＞ 推进】',
    },
    {
      speaker: 'luxury', // 持妆女骑士
      type: 'speak',
      text: '“混油皮还想通勤不脱妆？先把‘便宜随便买’ and ‘轻薄到消失’放一边吧。”',
    },
    {
      speaker: 'budget', // 性价比甜妹
      type: 'speak',
      text: '“哟，四五百的底气就是足。你是持妆，不是自动变美，卡粉的时候怎么不说？”',
    },
    {
      speaker: 'science', // 轻薄策略师
      type: 'speak',
      text: '“你们两个都太极端。一个像在脸上刷墙，一个下午可能氧化成黄昏滤镜。”',
    },
    {
      speaker: 'luxury', // 持妆女骑士
      type: 'crit',
      text: '“我刷墙？我至少下午还在脸上。你轻薄是轻薄，出油以后还剩几分体面？！”',
      target: ['science'],
      damage: 30,
    },
    {
      speaker: 'science', // 轻薄策略师
      type: 'crit',
      text: '“体面不等于厚重！用户说了不要太厚，你别装没看见。懂不懂克制的艺术？”',
      target: ['luxury'],
      damage: 25,
    },
    {
      speaker: 'budget', // 性价比甜妹
      type: 'crit',
      text: '“她也没说要花五百啊！通勤粉底而已，又不是买房，拿两三瓶换着用不香吗？”',
      target: ['luxury', 'science'],
      damage: 35,
    },
    {
      speaker: 'luxury', // 持妆女骑士
      type: 'speak',
      text: '“便宜不是免死金牌。下午暗沉、鼻翼斑驳脱妆，省下的钱拿去买补妆气垫吗？”',
    },
    {
      speaker: 'budget', // 性价比甜妹
      type: 'speak',
      text: '“我适合预算有限的人，至少试错不心疼。你色号买错，才是真的肉疼！”',
    },
    {
      speaker: 'science', // 轻薄策略师
      type: 'speak',
      text: '“贵不代表闭眼入。她要的是混油皮通勤稳定，不是品牌虚荣崇拜。”',
    },
    {
      speaker: 'luxury', // 持妆女骑士
      type: 'victory',
      text: '“所以结论更清楚了：想稳，选我；想自然，选她；想省钱，选她。但今天她最怕的是下午脱妆崩脸！”',
    }
  ];

  // --- 🎮 App State Manager ---
  const AppState = {
    scriptIndex: 0,
    isFinished: false,
    isActive: false,
    userDecided: false,
    chosenWinner: null,
    
    // Cosmetics Stats
    charData: {
      luxury: { hp: 100, budget: 33.3, color: '#d4af37', emoji: ['🛡️', '⚔️', '👑', '✨', '💎', '💄'] },
      science: { hp: 100, budget: 33.3, color: '#00f0ff', emoji: ['👓', '🎓', '⚖️', '🔬', '🧠', '🌿'] },
      budget: { hp: 100, budget: 33.4, color: '#ff7700', emoji: ['🧮', '💖', '🛍️', '🎓', '💸', '🎀'] }
    },

    // DOM Elements cache
    elements: {},

    initElements() {
      this.elements = {
        appContainer: document.getElementById('app-container'),
        decibelMeter: document.getElementById('decibel-meter'),
        decibelValue: document.getElementById('decibel-value'),
        speedLines: document.getElementById('speed-lines'),
        flashOverlay: document.getElementById('flash-overlay'),
        combatLog: document.getElementById('combat-log'),
        budgetWinner: document.getElementById('budget-winner'),
        particleContainer: document.getElementById('particle-container'),
        
        // Interactive Choice Checkpoint Elements
        dialogueChoicesContainer: document.getElementById('dialogue-choices-container'),
        btnDecideLuxury: document.getElementById('btn-decide-luxury'),
        btnDecideBudget: document.getElementById('btn-decide-budget'),

        // Control buttons & Dialogue Elements
        btnBoss: document.getElementById('btn-boss'),
        dialogueTrigger: document.getElementById('dialogue-trigger-area'),
        dialogueText: document.getElementById('dialogue-text'),
        speakerNameBadge: document.getElementById('dialogue-speaker-name'),
        nextBtn: document.getElementById('next-btn'),
        
        // Top Cards side-by-side
        cardLuxury: document.getElementById('card-luxury'),
        cardScience: document.getElementById('card-science'),
        cardBudget: document.getElementById('card-budget'),
        
        // Victory elements
        goldMedal: document.getElementById('gold-medal'),
        spotlightBeam: document.getElementById('spotlight-beam'),
        
        // HP Bar Fills
        fillLuxury: document.getElementById('bar-fill-luxury'),
        fillScience: document.getElementById('bar-fill-science'),
        fillBudget: document.getElementById('bar-fill-budget'),
        
        // HP text labels
        hpLuxury: document.getElementById('hp-luxury'),
        hpScience: document.getElementById('hp-science'),
        hpBudget: document.getElementById('hp-budget'),

        // Bottom Active Speaker Elements
        speakerAvatarContainer: document.getElementById('speaker-avatar-container'),
        speakerAvatarImg: document.getElementById('speaker-avatar-img'),
        speakerRoleLabel: document.getElementById('speaker-role-label'),

        // Tug segments
        tugLuxury: document.getElementById('tug-luxury'),
        tugScience: document.getElementById('tug-science'),
        tugBudget: document.getElementById('tug-budget'),

        // AVG Results Panel Elements
        avgResultsPanel: document.getElementById('avg-results-panel'),
        resRadialFill: document.getElementById('res-radial-fill'),
        resScoreText: document.getElementById('res-score-text'),
        resProductName: document.getElementById('res-product-name'),
        resPriceRange: document.getElementById('res-price-range'),
        resVerdict: document.getElementById('res-verdict'),
        resReasonsContainer: document.getElementById('res-reasons-container'),
        resRisksContainer: document.getElementById('res-risks-container'),
        btnRestartResults: document.getElementById('btn-restart-results')
      };
    }
  };

  // ⚖️ Preference Inquiry Checkpoint Managers
  function showDecisionOverlay() {
    const el = AppState.elements;
    if (el.dialogueChoicesContainer) {
      el.dialogueChoicesContainer.classList.remove('hide-choices');
    }
    if (el.nextBtn) {
      el.nextBtn.style.display = 'none';
    }
    if (el.speakerAvatarImg) {
      el.speakerAvatarImg.src = 'logo.jpg';
    }
    if (el.speakerRoleLabel) {
      el.speakerRoleLabel.innerText = '决策公证官';
    }
    if (el.speakerNameBadge) {
      el.speakerNameBadge.innerText = '决策公证官判定';
      el.speakerNameBadge.className = 'dialogue-speaker-badge bg-boss-badge';
    }
    if (el.dialogueText) {
      el.dialogueText.innerText = '战况激烈！请问您在此次通勤底妆中，更倾向于哪种核心消费选择？您的决定将直接影响大乱斗优胜推荐！';
    }
    addLog('⚖️ 偏好意向询问已唤起：性价比 🆚 高端？请公证官做出您的核心抉择...', 'system');
  }

  function hideDecisionOverlay() {
    const el = AppState.elements;
    if (el.dialogueChoicesContainer) {
      el.dialogueChoicesContainer.classList.add('hide-choices');
    }
    if (el.nextBtn) {
      el.nextBtn.style.display = '';
    }
  }

  function handleDecision(chosen) {
    AppState.userDecided = true;
    AppState.chosenWinner = chosen;
    hideDecisionOverlay();

    // Chiptune crit sounds & blast VFX
    synth.playCrit();
    triggerCritVFX();
    spawnParticles(chosen, 20);

    // Apply structural visual changes to reflect influence
    const pms = ['luxury', 'science', 'budget'];
    pms.forEach(pm => {
      if (pm === chosen) {
        setHP(pm, 100);
      } else {
        const curHp = AppState.charData[pm].hp;
        setHP(pm, Math.max(25, curHp - 25)); // others take collateral damage!
      }
    });

    // Shift tug budget segment heavily towards chosen
    AppState.charData[chosen].budget = 60;
    pms.forEach(pm => {
      if (pm !== chosen) {
        AppState.charData[pm].budget = 20;
      }
    });
    updateBudgetTug();

    // Log the choice
    const chosenName = chosen === 'luxury' ? '轻奢高端品质' : '极致性价比';
    addLog(`🏆 决策公证官选择了偏好【${chosenName}】！大乱斗优胜天平已定！`, 'system');

    // Dynamically update Step 10 speaker and victory dialogue
    const stepTen = battleScript[10];
    if (chosen === 'budget') {
      stepTen.speaker = 'budget';
      stepTen.text = '“通勤带妆才几个小时？省下几百大洋买咖啡大餐不香吗？性价比甜妹才是唯一的真香定律，绝对试错零心疼！”';
    } else {
      stepTen.speaker = 'luxury';
      stepTen.text = '“所以结论更清楚了：想稳选我，想自然选她，想省钱选她。但今天她最怕的就是下午脱妆崩脸，持妆才是唯一王道！”';
    }

    // Automatically resume story index 7 narrative
    executeAVGStep();
  }

  // --- 🛠️ Helper Utilities ---

  // Write custom entries to combat log terminal (console fallback)
  function addLog(message, type = 'system') {
    console.log(`[${type}] ${message}`);
    const container = AppState.elements.combatLog;
    if (!container) return;
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerText = `[${new Date().toLocaleTimeString('zh-CN', {hour12:false})}] ${message}`;
    
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  // Generate dynamic particles in Chovy viewport
  function spawnParticles(pmType, count = 10) {
    const container = AppState.elements.particleContainer;
    if (!container) return;

    const pmCard = pmType === 'luxury' ? AppState.elements.cardLuxury :
                   pmType === 'science' ? AppState.elements.cardScience :
                   AppState.elements.cardBudget;
                   
    if (!pmCard) return;
                   
    const rect = pmCard.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const startX = rect.left - containerRect.left + (rect.width / 2);
    const startY = rect.top - containerRect.top + (rect.height / 2);

    const emojis = AppState.charData[pmType].emoji;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.innerText = emojis[Math.floor(Math.random() * emojis.length)];

      const angle = (Math.random() * Math.PI * 2);
      const distance = 60 + Math.random() * 100;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance + 50; // slide downwards bias
      const rotation = Math.random() * 360 - 180;

      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
      particle.style.setProperty('--dx', `${dx}px`);
      particle.style.setProperty('--dy', `${dy}px`);
      particle.style.setProperty('--dr', `${rotation}deg`);

      container.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
  }

  // Update Decibel Meter Light Bars dynamically
  function setDecibelValue(db) {
    if (!AppState.elements.decibelValue || !AppState.elements.decibelMeter) return;
    AppState.elements.decibelValue.innerText = `${db} dB`;
    const bars = AppState.elements.decibelMeter.children;
    const normalizedIndex = Math.min(5, Math.max(1, Math.round((db - 35) / 15)));
    
    for (let i = 0; i < 5; i++) {
      const bar = bars[i];
      if (!bar) continue;
      if (i < normalizedIndex) {
        if (db > 80) {
          bar.style.backgroundColor = '#ff3366'; // Angry Red
          bar.style.boxShadow = '0 0 5px #ff3366';
        } else if (db > 60) {
          bar.style.backgroundColor = '#ffaa00'; // Intense Orange
          bar.style.boxShadow = '0 0 5px #ffaa00';
        } else {
          bar.style.backgroundColor = '#00f0ff'; // Calm Cyan
          bar.style.boxShadow = '0 0 5px #00f0ff';
        }
        bar.style.height = `${8 + i * 2}px`;
      } else {
        bar.style.backgroundColor = '#1a1c29';
        bar.style.boxShadow = 'none';
        bar.style.height = `5px`;
      }
    }
  }

  // Update health bars of top tiny rows
  function setHP(pmType, hpValue) {
    const pm = AppState.charData[pmType];
    pm.hp = Math.max(0, Math.min(100, hpValue));
    
    const fillBar = pmType === 'luxury' ? AppState.elements.fillLuxury :
                    pmType === 'science' ? AppState.elements.fillScience :
                    AppState.elements.fillBudget;

    const textLabel = pmType === 'luxury' ? AppState.elements.hpLuxury :
                      pmType === 'science' ? AppState.elements.hpScience :
                      AppState.elements.hpBudget;

    if (fillBar) {
      fillBar.style.width = `${pm.hp}%`;
    }
    if (textLabel) {
      textLabel.innerText = `HP ${pm.hp}%`;
    }

    if (pm.hp <= 0) {
      setCardState(pmType, 'defeated');
    }
  }

  // Pull budget resources dynamically
  function updateBudgetTug() {
    const luxury = AppState.elements.tugLuxury;
    const science = AppState.elements.tugScience;
    const budget = AppState.elements.tugBudget;
    
    if (!luxury || !science || !budget) return;
    
    const total = AppState.charData.luxury.budget + AppState.charData.science.budget + AppState.charData.budget.budget;
    
    const luxPct = (AppState.charData.luxury.budget / total) * 100;
    const sciPct = (AppState.charData.science.budget / total) * 100;
    const budPct = 100 - luxPct - sciPct;

    luxury.style.width = `${luxPct}%`;
    science.style.width = `${sciPct}%`;
    budget.style.width = `${budPct}%`;

    const values = [
      { name: '贵妇小奢占优 👑', val: luxPct, color: 'var(--color-luxury)' },
      { name: '成分大仙占优 🧪', val: sciPct, color: 'var(--color-science)' },
      { name: '性价比战神占优 🥔', val: budPct, color: '#f97316' }
    ];
    
    values.sort((a,b) => b.val - a.val);
    
    const budgetWinner = AppState.elements.budgetWinner;
    if (budgetWinner) {
      if (Math.abs(values[0].val - values[1].val) < 5) {
        budgetWinner.innerText = '三方势均力敌 ⚖️';
        budgetWinner.style.color = 'var(--text-main)';
      } else {
        budgetWinner.innerText = values[0].name;
        budgetWinner.style.color = values[0].color;
      }
    }
  }

  function shiftBudget(activePm, takeFromOthersAmount) {
    const active = AppState.charData[activePm];
    if (active.hp <= 0) return;

    const others = [];
    for (let key in AppState.charData) {
      if (key !== activePm && AppState.charData[key].hp > 0) {
        others.push(AppState.charData[key]);
      }
    }

    if (others.length === 0) return;

    const portion = takeFromOthersAmount / others.length;
    let actuallyTaken = 0;

    others.forEach(other => {
      const toTake = Math.min(other.budget, portion);
      other.budget -= toTake;
      actuallyTaken += toTake;
    });

    active.budget += actuallyTaken;
    updateBudgetTug();
  }

  // Adjust small card active state classes at the top
  function setCardState(pmType, state) {
    const card = pmType === 'luxury' ? AppState.elements.cardLuxury :
                 (pmType === 'science' || pmType === 'boss') ? AppState.elements.cardScience :
                 pmType === 'budget' ? AppState.elements.cardBudget :
                 null;
                 
    if (!card) return;

    card.classList.remove('state-idle', 'state-speaking', 'state-angry', 'state-defeated', 'state-polite', 'state-greyed', 'victory-active');
    
    if (state === 'greyed') {
      card.classList.add('state-greyed');
    } else if (state === 'victory') {
      card.classList.add('victory-active');
    } else {
      card.classList.add(`state-${state}`);
    }
  }

  // Trigger full-screen explosive shakes and flashes
  function triggerCritVFX() {
    const speedLines = AppState.elements.speedLines;
    const flash = AppState.elements.flashOverlay;
    const container = AppState.elements.appContainer;

    if (speedLines) speedLines.classList.add('active-impact');
    if (flash) flash.classList.add('active-flash');
    if (container) container.classList.add('state-angry');
    
    setTimeout(() => {
      if (speedLines) speedLines.classList.remove('active-impact');
      if (flash) flash.classList.remove('active-flash');
      if (container) container.classList.remove('state-angry');
    }, 450);
  }

  // --- 🏆 Detailed Recommendation Data Dictionary ---
  const productRecData = {
    luxury: {
      name: "兰蔻持妆清透粉底液 (持妆女骑士)",
      score: 94,
      price: "¥420 - ¥520 (高端持妆)",
      verdict: "最适合作为本次需求下的通勤主力粉底液。它在持妆、控油、抗暗沉三个核心维度上更贴近您的混油皮需求。虽然价格较高，但极大地降低了下午暗沉、斑驳脱妆的风险。",
      reasons: [
        { title: "卓越持妆控油", desc: "采用成熟的成膜控油技术，大汗淋漓下也能维持完美底妆，极度适合混油皮 8 小时通勤场景。" },
        { title: "强效防暗沉性能", desc: "专研防暗沉抗氧化成分，带妆到下班依然清爽不发黄、不发灰，告别下午黄昏滤镜。" },
        { title: "遮瑕与自然度平衡", desc: "能够修饰 80% 以上面部痘印和毛孔瑕疵，哑光雾面高级感拉满，无需额外大面积叠加遮瑕。" }
      ],
      risks: [
        "价格偏高，干皮或秋冬局部干燥起皮区域需要做好充足保湿，否则鼻翼会有卡粉风险。",
        "妆感略明显，如果追求水光奶油肌或裸妆效果可能偏向哑光质感。"
      ]
    },
    science: {
      name: "雅诗兰黛轻润持妆粉底液 (轻薄策略师)",
      score: 87,
      price: "¥390 - ¥480 (中高端轻薄)",
      verdict: "适合更重视自然清透妆效、不喜欢厚重假面感的用户。它的核心优势在于极其服帖自然，宛若无妆，但对于高强度、长时间的混油通勤，控油能力略低。",
      reasons: [
        { title: "极速隐形无面具感", desc: "轻润清透质地，上脸上手即融，打造无懈可击的剥壳鸡蛋般天生奶油肌底妆。" },
        { title: "持久锁水不紧绷", desc: "添加保湿油脂，在干燥的空调房里带妆一整天，眼周、嘴角也绝不会拔干卡粉起皮。" },
        { title: "温和修护融肤度高", desc: "高度贴合肌肤纹理，自然透光，修饰面部毛孔的同时维持高水准 of 融肤舒适感。" }
      ],
      risks: [
        "控油和成膜速度略逊于强控油粉底，在高温暴汗或佩戴口罩时有小概率蹭妆或脱妆。",
        "遮瑕度为中等，对深色痘印、深色眼圈需要额外配合局部专业遮瑕膏。"
      ]
    },
    budget: {
      name: "橘朵空气柔焦粉底液 (性价比甜妹)",
      score: 78,
      price: "¥120 - ¥160 (平价入门)",
      verdict: "非常适合学生党、新手试错，或短途带妆、拍照上镜。然而在长达 8 小时、追求极低暗沉的混油通勤场景下，下午暗沉风险较高，不推荐高强度使用。",
      reasons: [
        { title: "极致杀手级性价比 (¥120+)", desc: "试错成本极低，只要百元出头就能提供非常优秀的日系柔焦毛孔雾面妆效。" },
        { title: "新手友好粉感轻", desc: "延展性非常好，徒手就能轻松抹开，配方温和不易闷痘，特别适合新手试妆上手。" },
        { title: "短时间毛孔完美柔焦", desc: "刚上脸时拥有极强的磨皮雾面妆效，拍照上镜、出门约会 3-4 小时视觉效果极佳。" }
      ],
      risks: [
        "持妆度一般，出油多时容易在 4 小时后脱妆斑驳，必须随身带粉饼或气垫高频补妆。",
        "防暗沉控油力较弱，下午可能发生明显氧化偏黄风险，建议选亮半个色号。"
      ]
    }
  };

  // --- 🏆 Dynamic Scorecard Populator ---
  function showAVGResults(productType) {
    const data = productRecData[productType];
    if (!data) return;

    const el = AppState.elements;
    if (el.resProductName) el.resProductName.innerText = data.name;
    if (el.resPriceRange) el.resPriceRange.innerText = data.price;
    if (el.resVerdict) el.resVerdict.innerText = data.verdict;
    if (el.resScoreText) el.resScoreText.innerText = `${data.score}%`;

    // Radial progress SVG: stroke-dasharray="220"
    if (el.resRadialFill) {
      const offset = 220 * (1 - data.score / 100);
      el.resRadialFill.style.strokeDashoffset = offset;

      // Change progress ring color based on product theme
      let themeColor = 'var(--accent-cyan)';
      if (productType === 'science') themeColor = 'var(--accent-science)';
      if (productType === 'budget') themeColor = 'var(--accent-orange)';
      el.resRadialFill.style.stroke = themeColor;
    }

    // Render Reason List
    if (el.resReasonsContainer) {
      el.resReasonsContainer.innerHTML = '';
      data.reasons.forEach(r => {
        const item = document.createElement('div');
        item.className = `avg-reason-item theme-${productType}`;
        item.innerHTML = `
          <span class="avg-reason-title">✔️ ${r.title}</span>
          <span class="avg-reason-desc">${r.desc}</span>
        `;
        el.resReasonsContainer.appendChild(item);
      });
    }

    // Render Risk Warning Bullets
    if (el.resRisksContainer) {
      el.resRisksContainer.innerHTML = '';
      data.risks.forEach(risk => {
        const li = document.createElement('li');
        li.innerText = risk;
        el.resRisksContainer.appendChild(li);
      });
    }
  }

  // Reset Entire Game to Initial State 0
  function resetAllShowStats() {
    AppState.userDecided = false;
    AppState.chosenWinner = null;
    hideDecisionOverlay();

    const pms = ['luxury', 'science', 'budget'];
    pms.forEach(pm => {
      setHP(pm, 100);
      AppState.charData[pm].budget = 33.3;
      setCardState(pm, 'idle');
    });
    setCardState('boss', 'idle');
    
    AppState.charData.budget.budget = 33.4;
    updateBudgetTug();
    setDecibelValue(45);
    
    // Hide Gold Medal / Spotlight
    if (AppState.elements.cardLuxury) {
      AppState.elements.cardLuxury.classList.remove('victory-active');
    }
    if (AppState.elements.cardScience) {
      AppState.elements.cardScience.classList.remove('state-greyed');
    }
    if (AppState.elements.cardBudget) {
      AppState.elements.cardBudget.classList.remove('state-greyed');
    }
    
    // Reset Bottom Showcase Elements and hide results scorecard panel
    if (AppState.elements.speakerAvatarContainer) {
      AppState.elements.speakerAvatarContainer.parentElement.style.display = '';
      AppState.elements.speakerAvatarContainer.className = 'large-avatar-glow bg-luxury-shadow';
    }
    if (AppState.elements.dialogueTrigger) {
      AppState.elements.dialogueTrigger.parentElement.style.display = '';
    }
    if (AppState.elements.avgResultsPanel) {
      AppState.elements.avgResultsPanel.classList.add('hide-panel');
    }

    if (AppState.elements.speakerAvatarImg) {
      AppState.elements.speakerAvatarImg.src = 'asdf001.jpg?v=6';
    }
    if (AppState.elements.speakerRoleLabel) {
      AppState.elements.speakerRoleLabel.innerText = '持妆女骑士';
    }
    
    // Reset Dialogue Badge & Arrow
    if (AppState.elements.speakerNameBadge) {
      AppState.elements.speakerNameBadge.className = 'dialogue-speaker-badge bg-luxury-badge';
      AppState.elements.speakerNameBadge.innerText = '系统公证';
    }
    if (AppState.elements.nextBtn) {
      AppState.elements.nextBtn.className = 'next-arrow-btn';
      AppState.elements.nextBtn.innerHTML = '<span class="next-icon">&gt;</span>';
    }
    
    AppState.scriptIndex = 0;
    AppState.isFinished = false;
    
    // Play step 0
    executeAVGStep();
  }

  // --- 🎭 AVG Click Advance Logic System ---

  function executeAVGStep() {
    if (AppState.isFinished) {
      // Finished, block screen clicks from looping/restarting the game
      return;
    }

    // ⚖️ Checkpoint: Ask user for biased decision before the battle intensifies
    if (AppState.scriptIndex === 7 && !AppState.userDecided) {
      showDecisionOverlay();
      return; // pause story progression
    }

    const step = battleScript[AppState.scriptIndex];
    const speaker = step.speaker;

    // 1. Reset all tiny cards speaking highlights at top
    const pms = ['luxury', 'science', 'budget', 'boss'];
    pms.forEach(pm => {
      if (pm === 'boss' || AppState.charData[pm].hp > 0) {
        setCardState(pm, 'idle');
      }
    });

    // 2. Adjust System/Consumer messages or active speakers
    if (speaker === 'system') {
      // System message
      if (AppState.elements.speakerRoleLabel) AppState.elements.speakerRoleLabel.innerText = '广播公证';
      if (AppState.elements.speakerNameBadge) {
        AppState.elements.speakerNameBadge.innerText = '系统';
        AppState.elements.speakerNameBadge.className = 'dialogue-speaker-badge bg-boss-badge'; // red badge
      }
      
      // Maintain active display avatar but dim it slightly
      if (AppState.elements.speakerAvatarContainer) {
        AppState.elements.speakerAvatarContainer.className = 'large-avatar-glow';
      }
      
      // Text and Audio
      if (AppState.elements.dialogueText) AppState.elements.dialogueText.innerText = step.text;
      setDecibelValue(35);
      synth.playSpeak('boss');
      addLog(step.text, 'system');

    } else if (speaker === 'boss') {
      // Consumer Panic arrives!
      if (AppState.elements.speakerRoleLabel) AppState.elements.speakerRoleLabel.innerText = '消费者（混油通勤党）';
      if (AppState.elements.speakerNameBadge) {
        AppState.elements.speakerNameBadge.innerText = '消费者';
        AppState.elements.speakerNameBadge.className = 'dialogue-speaker-badge bg-boss-badge';
      }
      
      // Update large speaker container to warning red shadow
      if (AppState.elements.speakerAvatarContainer) {
        AppState.elements.speakerAvatarContainer.className = 'large-avatar-glow bg-boss-shadow state-speaking-heavy';
      }
      if (AppState.elements.speakerAvatarImg) {
        AppState.elements.speakerAvatarImg.src = 'asdf002.png?v=6';
      }
      
      // Put top cards into humble sweat polite state!
      pms.forEach(pm => {
        if (pm !== 'boss' && AppState.charData[pm].hp > 0) {
          setCardState(pm, 'polite');
        }
      });

      // VFX & Sound
      if (AppState.elements.dialogueText) AppState.elements.dialogueText.innerText = step.text;
      addLog(`🚨 消费者降临: ${step.text}`, 'boss');
      synth.playBossComing();
      triggerCritVFX();
      setDecibelValue(48);

    } else {
      // Active cosmetics speakers (luxury, science, budget)
      const type = step.type;
      
      // Update Large Speaker Display
      if (AppState.elements.speakerRoleLabel) {
        AppState.elements.speakerRoleLabel.innerText = speaker === 'luxury' ? '持妆女骑士' : speaker === 'science' ? '轻薄策略师' : '性价比甜妹';
      }
      if (AppState.elements.speakerAvatarImg) {
        AppState.elements.speakerAvatarImg.src = speaker === 'luxury' ? 'asdf001.jpg?v=6' :
                                                 speaker === 'science' ? 'asdf002.png?v=6' :
                                                 'asdf003.png?v=6';
      }
      if (AppState.elements.speakerAvatarContainer) {
        AppState.elements.speakerAvatarContainer.className = `large-avatar-glow bg-${speaker}-shadow state-speaking-heavy`;
      }
      
      // Update Dialogue Box Name Badge
      if (AppState.elements.speakerNameBadge) {
        AppState.elements.speakerNameBadge.innerText = speaker === 'luxury' ? '持妆女骑士 🛡️' : speaker === 'science' ? '轻薄策略师 👓' : '性价比甜妹 🧮';
        AppState.elements.speakerNameBadge.className = `dialogue-speaker-badge bg-${speaker}-badge`;
      }

      // Dialogue Body Text
      if (AppState.elements.dialogueText) AppState.elements.dialogueText.innerText = step.text;
      addLog(`${speaker.toUpperCase()}发言: ${step.text}`, speaker);

      if (type === 'speak') {
        // Normal Speech
        setCardState(speaker, 'speaking');
        synth.playSpeak(speaker);
        spawnParticles(speaker, 4);
        setDecibelValue(50 + Math.floor(Math.random() * 15));
        shiftBudget(speaker, 5);

      } else if (type === 'crit') {
        // Angry Crit Attack
        setCardState(speaker, 'angry');
        if (AppState.elements.speakerAvatarContainer) {
          AppState.elements.speakerAvatarContainer.className = `large-avatar-glow bg-${speaker}-shadow state-angry-heavy`;
        }
        
        synth.playCrit();
        triggerCritVFX();
        spawnParticles(speaker, 16);
        setDecibelValue(95 + Math.floor(Math.random() * 10));

        // Damage Infliction
        if (step.target) {
          step.target.forEach(tgt => {
            const curHp = AppState.charData[tgt].hp;
            setHP(tgt, curHp - step.damage);
            if (AppState.charData[tgt].hp > 0) {
              setCardState(tgt, 'idle');
            }
          });
        }
        shiftBudget(speaker, 18);

      } else if (type === 'polite') {
        // Humble sweet talk to Consumer
        setCardState(speaker, 'polite');
        synth.playSpeak(speaker);
        spawnParticles(speaker, 2);
        setDecibelValue(42);

      } else if (type === 'victory') {
        // 🏆 Climax Victory Step for Left "Luxury" Column!
        addLog('🥇 判定揭晓：持妆女骑士大获全胜！', 'system');
        synth.playVictoryFanfare();
        triggerCritVFX();

        // Spotlight & Medal activation on left column
        setCardState('luxury', 'victory');

        // Grey out/dim center & right columns!
        setCardState('science', 'greyed');
        setCardState('budget', 'greyed');

        // Massive victory visual feedback on display
        if (AppState.elements.speakerAvatarContainer) {
          AppState.elements.speakerAvatarContainer.className = 'large-avatar-glow bg-luxury-shadow state-speaking-heavy';
        }
        spawnParticles('luxury', 25);
        
        // Expand luxury budget segment to massive portion
        AppState.charData.luxury.budget = 70;
        AppState.charData.science.budget = 15;
        AppState.charData.budget.budget = 15;
        updateBudgetTug();
        setDecibelValue(88);

        // Show final recommendation results inside the lower 2/3 stage directly!
        setTimeout(() => {
          // Hide normal dialogue speaker avatar and bubble
          if (AppState.elements.speakerAvatarContainer) {
            AppState.elements.speakerAvatarContainer.parentElement.style.display = 'none';
          }
          if (AppState.elements.dialogueTrigger) {
            AppState.elements.dialogueTrigger.parentElement.style.display = 'none';
          }
          
          // Show results panel and populate with the luxury winner's data
          if (AppState.elements.avgResultsPanel) {
            AppState.elements.avgResultsPanel.classList.remove('hide-panel');
          }
          showAVGResults('luxury');
        }, 1800); // Elegant delay after the spotlight and victory sweep!
      }
    }

    // Handle final index transitions
    AppState.scriptIndex++;
    
    if (AppState.scriptIndex >= battleScript.length) {
      // Change next button arrow to retry loop icon
      if (AppState.elements.nextBtn) {
        AppState.elements.nextBtn.className = 'next-arrow-btn state-reset';
        AppState.elements.nextBtn.innerHTML = '<span class="next-icon">🔄</span>';
      }
      AppState.isFinished = true;
    }
  }

  // Top Alert Panic (jump directly to climax victory)
  function triggerBossPanic() {
    if (AppState.isFinished) return;
    
    // Set index to the final victory step
    AppState.scriptIndex = battleScript.length - 1;
    executeAVGStep();
  }

  // --- 🔗 Event Binding & Initialization ---

  function gestureInit() {
    synth.init();
  }

  function bindEvents() {
    const el = AppState.elements;

    // 1. Click anywhere on the entire view-comic container to advance (AVG standard experience)
    const viewComic = document.getElementById('view-comic');
    if (viewComic) {
      viewComic.addEventListener('click', (e) => {
        if (!AppState.isActive) return;

        // If clicking next arrow button, let nextBtn handler handle it
        if (e.target.closest('#next-btn')) return;
        // If clicking header panic button, let its handler handle it
        if (e.target.closest('#btn-boss')) return;
        // If clicking choices container, ignore
        if (e.target.closest('#dialogue-choices-container')) return;
        // If clicking anywhere inside results actions, ignore
        if (e.target.closest('#btn-restart-results') || e.target.closest('#btn-exit-debate') || e.target.closest('#btn-buy-back')) return;
        // If clicking anywhere inside results-card, ignore
        if (e.target.closest('#results-card')) return;
        
        gestureInit();
        executeAVGStep();
      });
    }

    // 2. Click next arrow button to advance
    if (el.nextBtn) {
      el.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop event bubbling completely!
        gestureInit();
        executeAVGStep();
      });
    }

    // ⚖️ Preference Checkpoint Button Bindings
    if (el.dialogueChoicesContainer) {
      el.dialogueChoicesContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    if (el.btnDecideLuxury) {
      el.btnDecideLuxury.addEventListener('click', (e) => {
        e.stopPropagation();
        gestureInit();
        handleDecision('luxury');
      });
    }
    if (el.btnDecideBudget) {
      el.btnDecideBudget.addEventListener('click', (e) => {
        e.stopPropagation();
        gestureInit();
        handleDecision('budget');
      });
    }

    // 3. Header Consumer Panic Button
    if (el.btnBoss) {
      el.btnBoss.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop propagation to prevent advancing story index
        gestureInit();
        triggerBossPanic();
      });
    }

    // 4. Results Card Exit & Restart Binding
    const btnBuyBack = document.getElementById('btn-buy-back');
    if (btnBuyBack) {
      btnBuyBack.addEventListener('click', (e) => {
        e.stopPropagation();
        gestureInit();
        AppState.isActive = false;
        const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        window.location.href = isLocalhost ? 'http://localhost:5178/shop/detail' : '../#/shop/detail';
      });
    }

    const btnExitDebate = document.getElementById('btn-exit-debate');
    if (btnExitDebate) {
      btnExitDebate.addEventListener('click', (e) => {
        e.stopPropagation();
        gestureInit();
        AppState.isActive = false;
        ChovyRouter.navigate('/home');
      });
    }

    // Restart from bottom Results panel restart button
    const btnRestartResults = el.btnRestartResults;
    if (btnRestartResults) {
      btnRestartResults.addEventListener('click', (e) => {
        e.stopPropagation();
        gestureInit();
        resetAllShowStats();
      });
    }

    // --- 🏆 AVG Interactive Finished Card Clicks ---
    const bindCardClick = (pmType) => {
      const cardEl = pmType === 'luxury' ? el.cardLuxury :
                     pmType === 'science' ? el.cardScience :
                     el.cardBudget;
      
      if (cardEl) {
        cardEl.addEventListener('click', (e) => {
          e.stopPropagation(); // Stop click from propagating to advance AVG step
          gestureInit();
          
          if (AppState.isFinished) {
            // Finished: normal review logic
            synth.playSpeak(pmType);
            
            const pms = ['luxury', 'science', 'budget'];
            pms.forEach(pm => {
              if (pm === pmType) {
                setCardState(pm, 'idle');
                if (pm === 'luxury') {
                  setCardState(pm, 'victory');
                }
              } else {
                setCardState(pm, 'greyed');
              }
            });
            
            showAVGResults(pmType);
          }
        });
      }
    };
    
    bindCardClick('luxury');
    bindCardClick('science');
    bindCardClick('budget');
  }

  function init() {
    AppState.initElements();
    bindEvents();
  }

  function startArena() {
    AppState.isActive = true;
    resetAllShowStats();
  }

  return { init, startArena };
})();
