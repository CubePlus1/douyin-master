/* ==========================================================================
   🎮 CORE LOGIC: COSMETICS BATTLE ROYALE (app.js)
   ========================================================================== */

// --- 🔊 Web Audio API Retro Synthesizer Class ---
class BleepSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
  }

  // Initialize Audio Context on User Gesture
  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // Keep volume comfortable
    this.masterGain.connect(this.ctx.destination);
  }

  // Synthesis of Speech Blips (Garrulous dialogue sounds)
  playSpeak(pmType) {
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
        // Energetic upward pitch slides
        osc.frequency.exponentialRampToValueAtTime(freq * 1.6, blipTime + 0.06);
      } else if (pmType === 'luxury') {
        // High-society vibrato wobble
        osc.frequency.linearRampToValueAtTime(freq * 0.9, blipTime + 0.03);
        osc.frequency.linearRampToValueAtTime(freq * 1.05, blipTime + 0.06);
      }

      // Envelope
      gain.gain.setValueAtTime(0, blipTime);
      gain.gain.linearRampToValueAtTime(0.15, blipTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, blipTime + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(blipTime);
      osc.stop(blipTime + 0.08);
    }
  }

  // Synthesis of Critical Explosions (Deep sound + frequency slide down)
  playCrit() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Main explosion (sawtooth sliding down)
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.55);

    // Deep sub bass
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.exponentialRampToValueAtTime(12, now + 0.45);

    // Lowpass filter sweep
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.5);

    // Volume Envelope
    gainNode.gain.setValueAtTime(0, now);
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
  }

  // Consumer Coming alarm (Sigh sound + descending electronic chimes)
  playBossComing() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    // 1. Descending chord progression representing sigh/deflating
    const notes = [440, 392, 330, 261]; // A4, G4, E4, C4
    notes.forEach((freq, idx) => {
      const noteTime = now + (idx * 0.18);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });

    // 2. Volume slide down represent deflating pocket money
    const alarmTime = now + 0.72;
    const oscAlarm = this.ctx.createOscillator();
    oscAlarm.type = 'triangle';
    oscAlarm.frequency.setValueAtTime(220, alarmTime);
    oscAlarm.frequency.linearRampToValueAtTime(110, alarmTime + 0.6);

    const gainAlarm = this.ctx.createGain();
    gainAlarm.gain.setValueAtTime(0, alarmTime);
    gainAlarm.gain.linearRampToValueAtTime(0.2, alarmTime + 0.1);
    gainAlarm.gain.exponentialRampToValueAtTime(0.001, alarmTime + 0.6);

    oscAlarm.connect(gainAlarm);
    gainAlarm.connect(this.masterGain);

    oscAlarm.start(alarmTime);
    oscAlarm.stop(alarmTime + 0.6);
  }
}

const synth = new BleepSynth();

// --- 🎬 Cosmetics Story Script Dialogue Sequence ---
const battleScript = [
  {
    speaker: 'system',
    text: '辩论议题公布：谁才是拯救消费者干瘪脸蛋的终极护肤神器？',
    duration: 1800
  },
  {
    speaker: 'luxury',
    type: 'speak',
    text: '当然是本宫！神奇活性精粹注入中... 唤醒每一个高贵细胞！深海极地奢华修复，4000元一罐是跨入名媛圈尊贵的门槛！',
    duration: 3500
  },
  {
    speaker: 'science',
    type: 'speak',
    text: '笑话！海藻精粹不就是海带水加防腐剂？营销概念全是伪科学！唯有10%视黄醇+2%烟酰胺科学配比，分子级靶向渗透才是唯一真理！',
    duration: 3800
  },
  {
    speaker: 'budget',
    type: 'speak',
    text: '你们两个少装了！一个强行割韭菜，一个用猛药刷墙毁脸！看本战神九块九一斤的纯天然绿油油芦荟胶，便宜大碗，闭眼全身涂抹！',
    duration: 3800
  },
  {
    speaker: 'luxury',
    type: 'crit',
    text: '凡夫俗子！这种几块钱的塑料粗制原料也配往脸上抹？看本宫神奇精萃【名媛奢华金钱降维打击】！熏死你们这群便宜货！',
    target: ['science', 'budget'],
    damage: 35,
    duration: 4000
  },
  {
    speaker: 'science',
    type: 'crit',
    text: '无知！伪科学营销终将水解破产！看我的【10%高浓度视黄醇化学强酸轰炸】！让你们的香精和海带水彻底碳化！',
    target: ['luxury', 'budget'],
    damage: 30,
    duration: 4000
  },
  {
    speaker: 'budget',
    type: 'crit',
    text: '都是智商税！看本性价比战神【9块9包邮物理大灌顶狂暴降临】！老子一斤的分量生生把你们两家给彻底淹死！归零！归零！',
    target: ['luxury', 'science'],
    damage: 40,
    duration: 4000
  },
  {
    speaker: 'system',
    text: '三方互怼白热化！皮肤酸碱度失衡！角质层彻底烂脸！分贝指数达到极限！',
    duration: 2000
  },
  {
    speaker: 'boss',
    type: 'boss',
    text: '（等等……消费者揉着发红脱皮的干脸，推开了会议室大门，看着干瘪空落的钱包，叹了一口沉重的大气……）',
    duration: 4000
  },
  {
    speaker: 'luxury',
    type: 'polite',
    text: '小仙女您来啦！其实……我觉得平时用我们家精萃修复，配合平价芦荟胶全身厚敷，加上成分科学调理，才是最划算的护肤闭环呢，您看是吧？💦',
    duration: 4000
  },
  {
    speaker: 'science',
    type: 'polite',
    text: '对对对！消费者说得对！我们科学界也高度赞成把配方做成大协同！我们已经连夜把强酸稀释了100倍，温和不烂脸，求求您看一下我们！💦',
    duration: 4000
  },
  {
    speaker: 'budget',
    type: 'polite',
    text: '没错！消费者就是我们的衣食父母！我们九块九的芦荟胶今天买一送十，保证让您的钱包毫发无伤！求求您支持一下！💦',
    duration: 4000
  },
  {
    speaker: 'system',
    text: '化妆品大乱斗圆满结束！消费者决定不买了，直接用温水洗脸睡觉。战斗平息。',
    duration: 2800
  }
];

// --- 🎮 App State Manager ---
const AppState = {
  // Configs
  isStoryMode: true,
  isPlaying: false,
  scriptIndex: 0,
  scriptTimer: null,
  
  // Cosmetics Stats
  charData: {
    luxury: { hp: 100, budget: 33.3, color: '#d4af37', emoji: ['👑', '✨', '💅', '💰', '💎', '🏺'] },
    science: { hp: 100, budget: 33.3, color: '#00f0ff', emoji: ['🧪', '🧬', '🔬', '💧', '🧐', '⚗️'] },
    budget: { hp: 100, budget: 33.4, color: '#ff7700', emoji: ['🛒', '💪', '🥔', '🔥', '💸', '🍉'] }
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
      
      // Mode buttons
      btnStory: document.getElementById('btn-story'),
      btnFree: document.getElementById('btn-free'),
      btnBoss: document.getElementById('btn-boss'),
      skillsDeck: document.getElementById('skills-deck'),
      
      // Cards
      cardLuxury: document.getElementById('card-luxury'),
      cardScience: document.getElementById('card-science'),
      cardBudget: document.getElementById('card-budget'),
      
      // HP Bar Fills
      fillLuxury: document.getElementById('bar-fill-luxury'),
      fillScience: document.getElementById('bar-fill-science'),
      fillBudget: document.getElementById('bar-fill-budget'),
      
      // HP text values
      hpLuxury: document.getElementById('hp-luxury'),
      hpScience: document.getElementById('hp-science'),
      hpBudget: document.getElementById('hp-budget'),

      // Speech bubbles
      bubbleLuxury: document.getElementById('bubble-luxury'),
      bubbleScience: document.getElementById('bubble-science'),
      bubbleBudget: document.getElementById('bubble-budget'),

      // Tug segments
      tugLuxury: document.getElementById('tug-luxury'),
      tugScience: document.getElementById('tug-science'),
      tugBudget: document.getElementById('tug-budget'),

      // Audio modal
      audioModal: document.getElementById('audio-modal'),
      btnEnter: document.getElementById('btn-enter')
    };
  }
};

// --- 🛠️ Helper Utilities ---

// Write custom entries to combat log terminal
function addLog(message, type = 'system') {
  const container = AppState.elements.combatLog;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.innerText = `[${new Date().toLocaleTimeString('zh-CN', {hour12:false})}] ${message}`;
  
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

// Generate dynamic particles in 640px viewport
function spawnParticles(pmType, count = 10) {
  const container = AppState.elements.particleContainer;
  const pmCard = pmType === 'luxury' ? AppState.elements.cardLuxury :
                 pmType === 'science' ? AppState.elements.cardScience :
                 AppState.elements.cardBudget;
                 
  const rect = pmCard.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // Find avatar visual center
  const isReverse = pmCard.classList.contains('card-reverse');
  const startX = isReverse ? (rect.right - containerRect.left - 50) : (rect.left - containerRect.left + 50);
  const startY = rect.top - containerRect.top + 35;

  const emojis = AppState.charData[pmType].emoji;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.innerText = emojis[Math.floor(Math.random() * emojis.length)];

    // Target random positions flying outward
    const angle = (Math.random() * Math.PI * 2);
    const distance = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 40; // slight upward bias
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

// Update Neon Decibel Light Bars dynamically
function setDecibelValue(db) {
  AppState.elements.decibelValue.innerText = `${db} dB`;
  const bars = AppState.elements.decibelMeter.children;
  const normalizedIndex = Math.min(10, Math.max(1, Math.round((db - 35) / 7.5)));
  
  for (let i = 0; i < 10; i++) {
    const bar = bars[i];
    if (i < normalizedIndex) {
      if (db > 80) {
        bar.style.backgroundColor = '#ff3344'; // Angry Red
        bar.style.boxShadow = '0 0 5px #ff3344';
      } else if (db > 60) {
        bar.style.backgroundColor = '#ffaa00'; // Intense Orange
        bar.style.boxShadow = '0 0 5px #ffaa00';
      } else {
        bar.style.backgroundColor = '#00f0ff'; // Calm Cyan
        bar.style.boxShadow = '0 0 5px #00f0ff';
      }
      bar.style.height = `${8 + i * 1.5}px`;
    } else {
      bar.style.backgroundColor = '#242835';
      bar.style.boxShadow = 'none';
      bar.style.height = `${6}px`;
    }
  }
}

// Update health bars of individual characters
function setHP(pmType, hpValue) {
  const pm = AppState.charData[pmType];
  pm.hp = Math.max(0, Math.min(100, hpValue));
  
  const fillBar = pmType === 'luxury' ? AppState.elements.fillLuxury :
                  pmType === 'science' ? AppState.elements.fillScience :
                  AppState.elements.fillBudget;

  const textLabel = pmType === 'luxury' ? AppState.elements.hpLuxury :
                    pmType === 'science' ? AppState.elements.hpScience :
                    AppState.elements.hpBudget;

  fillBar.style.width = `${pm.hp}%`;
  textLabel.innerText = `HP ${pm.hp}%`;

  if (pm.hp <= 0) {
    setCardState(pmType, 'defeated');
  }
}

// Reset all stats to 100%
function resetAllStats() {
  const pms = ['luxury', 'science', 'budget'];
  pms.forEach(pm => {
    setHP(pm, 100);
    AppState.charData[pm].budget = 33.3;
    setCardState(pm, 'idle');
    hideBubble(pm);
  });
  
  AppState.charData.budget.budget = 33.4;
  updateBudgetTug();
  setDecibelValue(45);
}

// Pull resources dynamically between characters (Tug-of-war)
function updateBudgetTug() {
  const luxury = AppState.elements.tugLuxury;
  const science = AppState.elements.tugScience;
  const budget = AppState.elements.tugBudget;
  
  const total = AppState.charData.luxury.budget + AppState.charData.science.budget + AppState.charData.budget.budget;
  
  const luxPct = (AppState.charData.luxury.budget / total) * 100;
  const sciPct = (AppState.charData.science.budget / total) * 100;
  const budPct = 100 - luxPct - sciPct;

  luxury.style.width = `${luxPct}%`;
  science.style.width = `${sciPct}%`;
  budget.style.width = `${budPct}%`;

  // Decide who is winning
  const values = [
    { name: '贵妇小奢占优 👑', val: luxPct, color: 'var(--color-luxury)' },
    { name: '成分大仙占优 🧪', val: sciPct, color: 'var(--color-science)' },
    { name: '性价比战神占优 🥔', val: budPct, color: '#f97316' }
  ];
  
  values.sort((a,b) => b.val - a.val);
  
  if (Math.abs(values[0].val - values[1].val) < 5) {
    AppState.elements.budgetWinner.innerText = '三方势均力敌 ⚖️';
    AppState.elements.budgetWinner.style.color = 'var(--text-main)';
  } else {
    AppState.elements.budgetWinner.innerText = values[0].name;
    AppState.elements.budgetWinner.style.color = values[0].color;
  }
}

// Adjust resource allocation
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

// Set active CSS state classes
function setCardState(pmType, state) {
  const card = pmType === 'luxury' ? AppState.elements.cardLuxury :
               pmType === 'science' ? AppState.elements.cardScience :
               AppState.elements.cardBudget;

  card.classList.remove('state-idle', 'state-speaking', 'state-angry', 'state-defeated', 'state-polite');
  card.classList.add(`state-${state}`);
}

// Trigger speech bubble pops
function showBubble(pmType, text) {
  const bubble = pmType === 'luxury' ? AppState.elements.bubbleLuxury :
                 pmType === 'science' ? AppState.elements.bubbleScience :
                 AppState.elements.bubbleBudget;

  bubble.querySelector('.bubble-content').innerText = text;
  bubble.classList.remove('hide-bubble');
  bubble.classList.add('show-bubble');
}

function hideBubble(pmType) {
  const bubble = pmType === 'luxury' ? AppState.elements.bubbleLuxury :
                 pmType === 'science' ? AppState.elements.bubbleScience :
                 AppState.elements.bubbleBudget;
  
  bubble.classList.remove('show-bubble');
  bubble.classList.add('hide-bubble');
}

// Trigger full-screen explosive shakes and flashes
function triggerCritVFX() {
  const speedLines = AppState.elements.speedLines;
  const flash = AppState.elements.flashOverlay;

  speedLines.classList.add('active-impact');
  flash.classList.add('active-flash');
  AppState.elements.appContainer.classList.add('state-angry');
  
  setTimeout(() => {
    speedLines.classList.remove('active-impact');
    flash.classList.remove('active-flash');
    AppState.elements.appContainer.classList.remove('state-angry');
  }, 450);
}

// --- 🎬 Story Mode Timeline Controller ---

function stopStoryMode() {
  AppState.isPlaying = false;
  clearTimeout(AppState.scriptTimer);
  AppState.elements.btnStory.classList.remove('active-mode');
}

function startStoryMode() {
  stopStoryMode();
  resetAllStats();
  
  AppState.isStoryMode = true;
  AppState.isPlaying = true;
  AppState.scriptIndex = 0;
  AppState.elements.btnStory.classList.add('active-mode');
  AppState.elements.btnFree.classList.remove('active-mode');
  AppState.elements.skillsDeck.classList.add('inactive-skills');

  addLog('>> 化妆品三界大战自动播放开始！吃瓜群众准备...', 'system');
  playNextScriptStep();
}

function playNextScriptStep() {
  if (!AppState.isPlaying || AppState.scriptIndex >= battleScript.length) {
    stopStoryMode();
    addLog('>> 故事播放完成。三方由于没人购买，暂时握手言和！', 'system');
    return;
  }

  const step = battleScript[AppState.scriptIndex];
  const duration = step.duration || 3000;

  executeScriptAction(step);

  AppState.scriptIndex++;
  AppState.scriptTimer = setTimeout(() => {
    playNextScriptStep();
  }, duration);
}

function executeScriptAction(step) {
  const speaker = step.speaker;
  
  if (speaker !== 'polite') {
    const pms = ['luxury', 'science', 'budget'];
    pms.forEach(pm => {
      if (pm !== speaker) hideBubble(pm);
    });
  }

  if (speaker === 'system') {
    addLog(step.text, 'system');
    setDecibelValue(38);
    return;
  }

  if (speaker === 'boss') {
    addLog(`🚨 警报: ${step.text}`, 'boss');
    setDecibelValue(50);
    
    synth.playBossComing();
    
    const pms = ['luxury', 'science', 'budget'];
    pms.forEach(pm => {
      if (AppState.charData[pm].hp > 0) {
        setCardState(pm, 'polite');
      }
    });
    
    triggerCritVFX();
    return;
  }

  const type = step.type;
  
  if (type === 'speak') {
    setCardState(speaker, 'speaking');
    showBubble(speaker, step.text);
    addLog(`${speaker.toUpperCase()}互怼: "${step.text}"`, speaker);
    
    setDecibelValue(50 + Math.floor(Math.random() * 15));
    synth.playSpeak(speaker);
    spawnParticles(speaker, 4);
    shiftBudget(speaker, 5);

  } else if (type === 'crit') {
    setCardState(speaker, 'angry');
    showBubble(speaker, step.text);
    addLog(`🔥 ${speaker.toUpperCase()}狂暴输出大招: "${step.text}"`, speaker);
    
    synth.playCrit();
    triggerCritVFX();
    spawnParticles(speaker, 15);
    setDecibelValue(95 + Math.floor(Math.random() * 15));
    
    if (step.target) {
      step.target.forEach(tgt => {
        const curHp = AppState.charData[tgt].hp;
        setHP(tgt, curHp - step.damage);
        setCardState(tgt, AppState.charData[tgt].hp <= 0 ? 'defeated' : 'idle');
      });
    }

    shiftBudget(speaker, 18);

  } else if (type === 'polite') {
    setCardState(speaker, 'polite');
    showBubble(speaker, step.text);
    addLog(`${speaker.toUpperCase()}低头谄媚: "${step.text}"`, speaker);
    
    setDecibelValue(42);
    synth.playSpeak(speaker);
    spawnParticles(speaker, 3);
  }
}

// --- ⚡ Free Rant / Manual Mode Actions ---

function handleManualSkill(pmType, skillKey) {
  if (AppState.isStoryMode) return;
  
  const pm = AppState.charData[pmType];
  if (pm.hp <= 0) {
    addLog(`>> [警告] ${pmType.toUpperCase()} 已经彻底自闭 (KO)，无法互怼！`, 'system');
    return;
  }

  // Clear others bubbles
  ['luxury', 'science', 'budget'].forEach(k => {
    if (k !== pmType) hideBubble(k);
    if (AppState.charData[k].hp > 0 && k !== pmType) {
      setCardState(k, 'idle');
    }
  });

  const skillsData = {
    luxury: {
      essence: { text: '“本宫身上这一滴，是深海深处沉睡千年的深海藻魂！一滴就能买你两打！你们是在用凡士林机油抹脸！”', isCrit: true, val: 32 },
      glorious: { text: '“本宫站在这里，就是身份和阶级的象征！4000元一罐是门槛，便宜货少来沾边！”', isCrit: false, val: 12 }
    },
    science: {
      retinol: { text: '“笑话！深海海藻说白了就是高价海带水！看我10%视黄醇+2%烟酰胺科学配比，三天消灭皱纹，数据说话！”', isCrit: true, val: 30 },
      clinical: { text: '“根据《皮肤科学杂志》双盲对照实验，高浓度玻色因抗皱率达45%！拿去，这是我的学术报告！”', isCrit: false, val: 10 }
    },
    budget: {
      shipping: { text: '“我一斤才九块九！还包邮！一罐你顶我三打！你那面霜里99%都是矿脂香精！谁才是真正的智商税？！”', isCrit: true, val: 35 },
      allover: { text: '“本战神便宜大碗，擦脸擦脖子，擦大腿擦脚跟！还能敷头发！你每次只敢牙签挑一点，到底谁在用？！”', isCrit: false, val: 15 }
    }
  };

  const skill = skillsData[pmType][skillKey];
  
  if (skill.isCrit) {
    setCardState(pmType, 'angry');
    showBubble(pmType, skill.text);
    addLog(`🔥 [手动大招] ${pmType.toUpperCase()} 释放了【${skillKey}】: "${skill.text}"`, pmType);
    
    synth.playCrit();
    triggerCritVFX();
    spawnParticles(pmType, 16);
    setDecibelValue(105);
    
    for (let k in AppState.charData) {
      if (k !== pmType) {
        const other = AppState.charData[k];
        setHP(k, other.hp - skill.val);
        if (other.hp > 0) setCardState(k, 'idle');
      }
    }
    
    shiftBudget(pmType, 15);
  } else {
    setCardState(pmType, 'speaking');
    showBubble(pmType, skill.text);
    addLog(`💬 [手动吐槽] ${pmType.toUpperCase()} 释放了【${skillKey}】: "${skill.text}"`, pmType);
    
    synth.playSpeak(pmType);
    spawnParticles(pmType, 5);
    setDecibelValue(68);
    
    shiftBudget(pmType, 6);
  }
}

// Emergency Panic Button (Consumer arrives immediately!)
function triggerBossPanic() {
  stopStoryMode();
  
  AppState.isStoryMode = false;
  AppState.elements.btnFree.classList.add('active-mode');
  AppState.elements.btnStory.classList.remove('active-mode');
  AppState.elements.skillsDeck.classList.remove('inactive-skills');

  synth.playBossComing();
  triggerCritVFX();
  
  addLog('🚨 [紧急避难] 消费者看着干瘪的钱包和发红脱皮的脸，深深叹了一口气！化妆品全员吓坏，拼命降价！', 'boss');
  setDecibelValue(48);

  const pms = ['luxury', 'science', 'budget'];
  const bossSpeeches = {
    luxury: '“小仙女您来啦！其实……我觉得平时用我们家精萃修复，配合平价芦荟胶全身厚敷，加上成分科学调理，才是最划算的护肤闭环呢，您看是吧？💦”',
    science: '“对对对！消费者说得对！我们科学界也高度赞成把配方做成大协同！我们已经连夜把强酸稀释了100倍，温和不烂脸，求求您看一下我们！💦”',
    budget: '“没错！消费者就是我们的衣食父母！我们九块九的芦荟胶今天买一送十，保证让您的钱包毫发无伤！求求您支持一下！💦”'
  };

  pms.forEach(pm => {
    if (AppState.charData[pm].hp > 0) {
      setCardState(pm, 'polite');
      showBubble(pm, bossSpeeches[pm]);
      spawnParticles(pm, 2);
    }
  });

  AppState.charData.luxury.budget = 33.3;
  AppState.charData.science.budget = 33.3;
  AppState.charData.budget.budget = 33.4;
  updateBudgetTug();
}

// --- 🔗 Event Binding & Initialization ---

function bindEvents() {
  const el = AppState.elements;

  // 1. Audio Activation Modal
  el.btnEnter.addEventListener('click', () => {
    synth.init();
    el.audioModal.classList.add('hide-modal');
    addLog('>> 玩家进入了战场。音频合成器已初始化。开始吃瓜！', 'system');
    
    setTimeout(() => {
      startStoryMode();
    }, 400);
  });

  // 2. Mode Switches
  el.btnStory.addEventListener('click', () => {
    if (AppState.isStoryMode && AppState.isPlaying) return;
    startStoryMode();
  });

  el.btnFree.addEventListener('click', () => {
    if (!AppState.isStoryMode) return;
    
    stopStoryMode();
    resetAllStats();
    
    AppState.isStoryMode = false;
    el.btnFree.classList.add('active-mode');
    el.btnStory.classList.remove('active-mode');
    el.skillsDeck.classList.remove('inactive-skills');
    
    addLog('>> 模式切换：【自由互怼模式】。点击下方化妆品技能按钮手动开启撕逼大招！', 'system');
  });

  // 3. Boss Panic Trigger
  el.btnBoss.addEventListener('click', () => {
    triggerBossPanic();
  });

  // 4. Custom Skills Click Handlers
  el.skillsDeck.addEventListener('click', (e) => {
    const btn = e.target.closest('.skill-btn');
    if (!btn) return;
    
    const pm = btn.getAttribute('data-pm');
    const skill = btn.getAttribute('data-skill');
    
    handleManualSkill(pm, skill);
  });

  // 5. Clicking on individual character card (toggles speak in free mode)
  const pms = ['luxury', 'science', 'budget'];
  pms.forEach(pm => {
    const card = pm === 'luxury' ? el.cardLuxury :
                 pm === 'science' ? el.cardScience :
                 el.cardBudget;

    card.addEventListener('click', () => {
      if (AppState.isStoryMode) return;
      if (AppState.charData[pm].hp <= 0) return;

      const skills = pm === 'luxury' ? ['essence', 'glorious'] :
                     pm === 'science' ? ['retinol', 'clinical'] :
                     ['shipping', 'allover'];
      const randomSkill = skills[Math.floor(Math.random() * skills.length)];
      handleManualSkill(pm, randomSkill);
    });
  });
}

// Global Startup trigger
window.addEventListener('DOMContentLoaded', () => {
  AppState.initElements();
  bindEvents();
});
