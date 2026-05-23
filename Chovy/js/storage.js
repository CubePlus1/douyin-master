/**
 * Chovy Storage - localStorage user profile abstraction (Defensive & Robust)
 */

const ChovyStorage = (() => {
  const PROFILE_KEY = 'chovy_profile';
  const HISTORY_KEY = 'chovy_session_history';
  const FACE_PROFILE_KEY = 'chovy_face_profile';

  function getProfile() {
    let profile = null;
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        profile = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse profile:', e);
    }

    if (!profile) {
      profile = createDefaultProfile();
    } else {
      // Robustly migrate/repair any missing nested fields
      profile.version = 2;
      if (!profile.sessions) profile.sessions = [];
      if (!profile.preferences) {
        profile.preferences = {};
      }

      const prefs = profile.preferences;
      if (!prefs.brand_affinity) prefs.brand_affinity = {};
      if (!prefs.category_affinity) prefs.category_affinity = {};
      if (!prefs.scene_affinity) prefs.scene_affinity = {};
      if (!prefs.price_sensitivity) {
        prefs.price_sensitivity = { 'premium': 0, 'mid': 0, 'budget': 0 };
      } else {
        if (prefs.price_sensitivity.premium === undefined) prefs.price_sensitivity.premium = 0;
        if (prefs.price_sensitivity.mid === undefined) prefs.price_sensitivity.mid = 0;
        if (prefs.price_sensitivity.budget === undefined) prefs.price_sensitivity.budget = 0;
      }
      if (prefs.total_sessions === undefined) prefs.total_sessions = 0;
      if (prefs.total_choices === undefined) prefs.total_choices = 0;
    }

    return profile;
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  }

  function createDefaultProfile() {
    return {
      version: 2,
      sessions: [],
      preferences: {
        brand_affinity: {},
        category_affinity: {},
        price_sensitivity: { 'premium': 0, 'mid': 0, 'budget': 0 },
        scene_affinity: {},
        total_sessions: 0,
        total_choices: 0
      }
    };
  }

  function recordSession(sessionData) {
    const profile = getProfile();
    const session = {
      id: 'session_' + Date.now(),
      video: sessionData.video,
      rounds: sessionData.rounds,
      champion_id: sessionData.champion_id,
      champion_name: sessionData.champion_name,
      champion_brand: sessionData.champion_brand,
      timestamp: Math.floor(Date.now() / 1000)
    };
    profile.sessions.push(session);
    profile.preferences.total_sessions++;
    saveProfile(profile);
    return session;
  }

  function recordChoice(product) {
    if (!product) return;
    const profile = getProfile();
    const prefs = profile.preferences;

    // Brand
    if (product.brand) {
      if (!prefs.brand_affinity[product.brand]) prefs.brand_affinity[product.brand] = 0;
      prefs.brand_affinity[product.brand]++;
    }

    // Category (from video context)
    const video = ChovyAppState.get('currentVideo');
    if (video && video.category) {
      if (!prefs.category_affinity[video.category]) prefs.category_affinity[video.category] = 0;
      prefs.category_affinity[video.category]++;
    } else {
      // Fallback
      if (!prefs.category_affinity['口红']) prefs.category_affinity['口红'] = 0;
      prefs.category_affinity['口红']++;
    }

    // Price sensitivity
    const priceNum = product.price_num || extractPrice(product.price);
    if (priceNum >= 300) {
      prefs.price_sensitivity.premium++;
    } else if (priceNum >= 200) {
      prefs.price_sensitivity.mid++;
    } else {
      prefs.price_sensitivity.budget++;
    }

    // Scene affinity based on product characteristics or fallbacks
    const scene = (product.details && product.details.suitable) || '日常通勤';
    if (!prefs.scene_affinity[scene]) prefs.scene_affinity[scene] = 0;
    prefs.scene_affinity[scene]++;

    prefs.total_choices++;
    saveProfile(profile);
  }

  function extractPrice(priceStr) {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;
    const match = priceStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  function generateInsight(winner, loser) {
    const insights = [];

    const wPrice = extractPrice(winner.price);
    const lPrice = extractPrice(loser.price);
    if (Math.abs(wPrice - lPrice) > 50) {
      if (wPrice > lPrice) {
        insights.push('看来品质对你来说比价格更重要');
      } else {
        insights.push('你很注重性价比，明智之选');
      }
    }

    if (winner.details && loser.details &&
        winner.details.texture !== loser.details.texture) {
      insights.push(`你更偏好「${winner.details.texture}」质地`);
    }

    if (winner.brand !== loser.brand) {
      insights.push(`你对${winner.brand}有好感？这个品牌确实很有特色`);
    }

    if (insights.length > 0) {
      return insights[Math.floor(Math.random() * insights.length)];
    }
    return '这个选择很有品味！';
  }

  function getSessionHistory() {
    const profile = getProfile();
    return profile.sessions.slice().reverse();
  }

  function getTopPreferences() {
    const profile = getProfile();
    const prefs = profile.preferences;

    const topBrand = getTopKey(prefs.brand_affinity);
    const topCategory = getTopKey(prefs.category_affinity);
    const topPrice = getTopKey(prefs.price_sensitivity);

    return { topBrand, topCategory, topPrice, total: prefs.total_choices };
  }

  function getTopKey(obj) {
    if (!obj) return null;
    let maxKey = null;
    let maxVal = -1;
    for (const [k, v] of Object.entries(obj)) {
      if (v > maxVal) { maxVal = v; maxKey = k; }
    }
    return maxKey && maxVal > 0 ? maxKey : null;
  }

  function clearAll() {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(FACE_PROFILE_KEY);
  }

  // ─── Face Profile ────────────────────────────────────

  function saveFaceProfile(profile) {
    try {
      localStorage.setItem(FACE_PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save face profile:', e);
    }
  }

  function getFaceProfile() {
    try {
      const raw = localStorage.getItem(FACE_PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse face profile:', e);
    }
    return {
      skin_tone: 'natural',
      skin_type: 'combination',
      style_pref: 'daily',
      undertone: 'neutral'
    };
  }

  function clearFaceProfile() {
    localStorage.removeItem(FACE_PROFILE_KEY);
  }

  return {
    getProfile, saveProfile, recordSession, recordChoice,
    generateInsight, getSessionHistory, getTopPreferences,
    extractPrice, clearAll,
    saveFaceProfile, getFaceProfile, clearFaceProfile
  };
})();
