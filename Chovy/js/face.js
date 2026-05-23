/**
 * Chovy Face View - Photo upload + simulated AI analysis + profile confirmation
 */

const ChovyFace = (() => {
  let currentTemplate = null;
  let uploadedImageData = null;

  // Preset face profile templates
  const TEMPLATES = [
    {
      id: 'cold_white',
      name: '冷白皮',
      skin_tone: 'cold_white',
      skin_type: 'neutral',
      style_pref: 'elegant',
      undertone: 'cool',
      label: '冷白皮 · 中性肤质',
      recommend_colors: '蓝调红、玫红',
      recommend_texture: '丝绒、缎光'
    },
    {
      id: 'warm_yellow',
      name: '暖黄皮',
      skin_tone: 'warm_yellow',
      skin_type: 'combination',
      style_pref: 'daily',
      undertone: 'warm',
      label: '暖黄皮 · 混合肤质',
      recommend_colors: '橘调、红棕',
      recommend_texture: '哑光、柔雾'
    },
    {
      id: 'natural',
      name: '自然肤色',
      skin_tone: 'natural',
      skin_type: 'dry',
      style_pref: 'daily',
      undertone: 'neutral',
      label: '自然肤色 · 干皮',
      recommend_colors: '豆沙、裸色',
      recommend_texture: '水润、滋润'
    },
    {
      id: 'wheat',
      name: '小麦色',
      skin_tone: 'wheat',
      skin_type: 'oily',
      style_pref: 'bold',
      undertone: 'warm',
      label: '小麦色 · 油皮',
      recommend_colors: '砖红、深色',
      recommend_texture: '哑光、持妆'
    }
  ];

  // Dimension options
  const SKIN_TONE_OPTIONS = [
    { value: 'cold_white', label: '冷白皮' },
    { value: 'warm_yellow', label: '暖黄皮' },
    { value: 'natural', label: '自然肤色' },
    { value: 'wheat', label: '小麦色' }
  ];

  const SKIN_TYPE_OPTIONS = [
    { value: 'dry', label: '干皮' },
    { value: 'oily', label: '油皮' },
    { value: 'combination', label: '混合皮' },
    { value: 'neutral', label: '中性' }
  ];

  const STYLE_PREF_OPTIONS = [
    { value: 'daily', label: '日常通勤' },
    { value: 'elegant', label: '约会精致' },
    { value: 'bold', label: '大胆个性' }
  ];

  // Analysis steps
  const ANALYSIS_STEPS = [
    { icon: 'face', text: '检测面部轮廓...' },
    { icon: 'format_color_text', text: '分析唇形特征...' },
    { icon: 'palette', text: '识别肤色基调...' },
    { icon: 'auto_awesome', text: '生成专属画像...' }
  ];

  async function init() {
    // Nothing to init on page load
  }

  function showFaceView() {
    const container = document.getElementById('faceContent');
    if (!container) return;
    uploadedImageData = null;
    currentTemplate = null;
    renderUploadStage(container);
  }

  // ─── Stage 1: Upload ──────────────────────────────────

  function renderUploadStage(container) {
    container.innerHTML = `
      <div class="face-stage face-upload-stage">
        <div class="face-upload-header">
          <span class="material-icons-outlined face-upload-icon">face</span>
          <h2 class="face-title">AI 面部分析</h2>
          <p class="face-subtitle">上传照片，获取个性化美妆推荐</p>
        </div>

        <div class="face-upload-area" id="faceUploadArea">
          <div class="face-upload-placeholder" id="faceUploadPlaceholder">
            <span class="material-icons-outlined">add_a_photo</span>
            <span>点击上传或拖拽照片</span>
          </div>
          <div class="face-preview-wrap" id="facePreviewWrap" style="display:none">
            <img id="facePreviewImg" class="face-preview-img" alt="preview">
          </div>
          <input type="file" id="faceFileInput" accept="image/*" style="display:none">
        </div>

        <button class="btn-primary face-confirm-btn" id="faceUploadConfirm" style="display:none">
          <span class="material-icons-outlined">arrow_forward</span>
          开始分析
        </button>

        <button class="btn-secondary face-skip-btn" id="faceSkipBtn">
          跳过，直接选品
        </button>
      </div>
    `;

    // Setup events
    const uploadArea = document.getElementById('faceUploadArea');
    const fileInput = document.getElementById('faceFileInput');
    const confirmBtn = document.getElementById('faceUploadConfirm');
    const skipBtn = document.getElementById('faceSkipBtn');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('face-upload-dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('face-upload-dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('face-upload-dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) handleFileUpload(file);
    });

    confirmBtn.addEventListener('click', () => {
      renderAnalysisStage(container);
    });

    skipBtn.addEventListener('click', () => {
      // Skip face analysis, go directly to thinking
      goToThinking();
    });
  }

  function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageData = e.target.result;
      const previewWrap = document.getElementById('facePreviewWrap');
      const placeholder = document.getElementById('faceUploadPlaceholder');
      const previewImg = document.getElementById('facePreviewImg');
      const confirmBtn = document.getElementById('faceUploadConfirm');

      if (previewImg) previewImg.src = uploadedImageData;
      if (previewWrap) previewWrap.style.display = '';
      if (placeholder) placeholder.style.display = 'none';
      if (confirmBtn) confirmBtn.style.display = '';
    };
    reader.readAsDataURL(file);
  }

  // ─── Stage 2: Analysis Animation ──────────────────────

  async function renderAnalysisStage(container) {
    container.innerHTML = `
      <div class="face-stage face-analysis-stage">
        <div class="face-analysis-header">
          <div class="face-analysis-avatar">
            <span class="material-icons-outlined">psychology</span>
          </div>
          <h2 class="face-title">AI 面部分析中</h2>
        </div>
        <div class="face-analysis-steps" id="faceAnalysisSteps">
          ${ANALYSIS_STEPS.map((step, i) => `
            <div class="face-analysis-step" data-step="${i}">
              <div class="face-step-icon">
                <span class="material-icons-outlined">${step.icon}</span>
              </div>
              <div class="face-step-text">${step.text}</div>
              <div class="face-step-status">
                <div class="face-step-spinner"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Animate each step
    const steps = document.querySelectorAll('.face-analysis-step');
    for (let i = 0; i < steps.length; i++) {
      await sleep(800 + Math.random() * 400);
      const step = steps[i];
      step.classList.add('face-step-active');
      const status = step.querySelector('.face-step-status');
      if (status) {
        await sleep(600);
        status.innerHTML = '<span class="material-icons-outlined face-step-done">check_circle</span>';
        step.classList.remove('face-step-active');
        step.classList.add('face-step-done-row');
      }
    }

    await sleep(600);

    // Pick a random template
    currentTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];

    // Save to storage
    ChovyStorage.saveFaceProfile({
      skin_tone: currentTemplate.skin_tone,
      skin_type: currentTemplate.skin_type,
      style_pref: currentTemplate.style_pref,
      undertone: currentTemplate.undertone
    });

    renderConfirmStage(container);
  }

  // ─── Stage 3: Profile Confirmation ────────────────────

  function renderConfirmStage(container) {
    const profile = ChovyStorage.getFaceProfile();

    container.innerHTML = `
      <div class="face-stage face-confirm-stage">
        <div class="face-confirm-header">
          <span class="material-icons-outlined face-confirm-icon">verified</span>
          <h2 class="face-title">你的面部画像</h2>
          <p class="face-subtitle">AI 推断结果，你可以微调</p>
        </div>

        <div class="face-dimensions">
          <div class="face-dim-group">
            <div class="face-dim-label">肤色基调</div>
            <div class="face-dim-options" data-dim="skin_tone">
              ${SKIN_TONE_OPTIONS.map(opt => `
                <button class="face-dim-btn${profile.skin_tone === opt.value ? ' selected' : ''}" data-value="${opt.value}">
                  ${opt.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="face-dim-group">
            <div class="face-dim-label">肤质类型</div>
            <div class="face-dim-options" data-dim="skin_type">
              ${SKIN_TYPE_OPTIONS.map(opt => `
                <button class="face-dim-btn${profile.skin_type === opt.value ? ' selected' : ''}" data-value="${opt.value}">
                  ${opt.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="face-dim-group">
            <div class="face-dim-label">偏好风格</div>
            <div class="face-dim-options" data-dim="style_pref">
              ${STYLE_PREF_OPTIONS.map(opt => `
                <button class="face-dim-btn${profile.style_pref === opt.value ? ' selected' : ''}" data-value="${opt.value}">
                  ${opt.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="face-recommend-box">
          <div class="face-recommend-title">
            <span class="material-icons-outlined">auto_awesome</span>
            推荐色系
          </div>
          <div class="face-recommend-text">${currentTemplate.recommend_colors}</div>
          <div class="face-recommend-title" style="margin-top:10px">
            <span class="material-icons-outlined">texture</span>
            推荐质地
          </div>
          <div class="face-recommend-text">${currentTemplate.recommend_texture}</div>
        </div>

        <button class="btn-primary face-confirm-btn" id="faceConfirmBtn">
          <span class="material-icons-outlined">check</span>
          确认画像，开始选品
        </button>
      </div>
    `;

    // Dimension button click handlers
    container.querySelectorAll('.face-dim-options').forEach(group => {
      const dim = group.dataset.dim;
      group.querySelectorAll('.face-dim-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.face-dim-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');

          // Update stored profile
          const fp = ChovyStorage.getFaceProfile() || {};
          fp[dim] = btn.dataset.value;
          // Derive undertone from skin_tone
          if (dim === 'skin_tone') {
            fp.undertone = deriveUndertone(btn.dataset.value);
          }
          ChovyStorage.saveFaceProfile(fp);
        });
      });
    });

    document.getElementById('faceConfirmBtn').addEventListener('click', () => {
      goToThinking();
    });
  }

  function deriveUndertone(skinTone) {
    const map = {
      'cold_white': 'cool',
      'warm_yellow': 'warm',
      'natural': 'neutral',
      'wheat': 'warm'
    };
    return map[skinTone] || 'neutral';
  }

  function goToThinking() {
    const category = ChovyAppState.get('selectedCategory') || 'lipstick';
    ChovyAppState.set('faceProfile', ChovyStorage.getFaceProfile());
    ChovyRouter.navigate('/thinking');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return { init, showFaceView, TEMPLATES };
})();
