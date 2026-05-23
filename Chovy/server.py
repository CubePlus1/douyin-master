"""
Chovy Backend API - Flask Server
Provides /api/videos, /api/parse, /api/thinking-data, /api/battles, /api/result, /api/arena/stream endpoints
"""
import json
import os
import random
from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS

# DeepSeek API Configuration
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "sk-ad208fc3fd09412f8180b0461a5667c5")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

# OpenAI-compatible client for DeepSeek
try:
    from openai import OpenAI
    deepseek_client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
except ImportError:
    deepseek_client = None
    print("WARNING: openai package not installed. Run: pip install openai")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
CORS(app)

# Load data
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

with open(os.path.join(DATA_DIR, "videos.json"), "r", encoding="utf-8") as f:
    VIDEOS = json.load(f)

with open(os.path.join(DATA_DIR, "battles.json"), "r", encoding="utf-8") as f:
    BATTLES = json.load(f)

PRODUCTS = BATTLES["products"]


@app.route("/")
def serve_index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)


@app.route("/api/videos", methods=["GET"])
def get_videos():
    """Return the list of preset videos."""
    return jsonify({"videos": VIDEOS})


@app.route("/api/parse", methods=["POST"])
def parse_video():
    """
    Receive a URL (any string), return a simulated video parse result.
    Picks a random video from videos.json.
    """
    data = request.get_json() or {}
    url = data.get("url", "")

    video = random.choice(VIDEOS)

    return jsonify({
        "success": True,
        "video": video
    })


@app.route("/api/thinking-data", methods=["POST"])
def get_thinking_data():
    """
    Receive video_id, face_profile, category -> return thinking data + 4 matched contestants.
    """
    data = request.get_json() or {}
    video_id = data.get("video_id", "v001")
    face_profile = data.get("face_profile")
    category = data.get("category", "lipstick")

    video = next((v for v in VIDEOS if v["id"] == video_id), VIDEOS[0])

    # Filter products by category
    available = [p for p in PRODUCTS if p.get("category", "lipstick") == category]
    if len(available) < 4:
        available = PRODUCTS.copy()

    # Score and sort by face profile match
    if face_profile:
        for p in available:
            p["_match_score"] = compute_match_score(p, face_profile)
        available.sort(key=lambda p: p["_match_score"], reverse=True)
    else:
        random.shuffle(available)

    selected = available[:4]

    # Add match scores to response
    for p in selected:
        if face_profile:
            p["match_score"] = p.pop("_match_score", 75)
        else:
            p["match_score"] = random.randint(70, 95)

    return jsonify({
        "video": video,
        "contestants": selected
    })


def compute_match_score(product, face_profile):
    """Compute a 0-100 match score between product and face profile."""
    score = 60  # base score
    details = product.get("details", {})
    skin_tone = face_profile.get("skin_tone", "")
    skin_type = face_profile.get("skin_type", "")
    style_pref = face_profile.get("style_pref", "")
    category = product.get("category", "lipstick")

    if category == "lipstick":
        color_type = details.get("color_type", "")
        texture = details.get("texture", "")
        suitable = details.get("suitable", "")

        # Skin tone ↔ color match
        if skin_tone == "cold_white":
            if any(k in color_type for k in ["正红", "玫红", "蓝调"]):
                score += 15
            if "冷白" in suitable or "所有" in suitable:
                score += 5
        elif skin_tone == "warm_yellow":
            if any(k in color_type for k in ["红棕", "橘", "复古"]):
                score += 15
            if "黄皮" in suitable or "暖皮" in suitable or "所有" in suitable:
                score += 5
        elif skin_tone == "natural":
            if any(k in color_type for k in ["豆沙", "裸色", "粉"]):
                score += 15
            if "自然" in suitable or "所有" in suitable:
                score += 5
        elif skin_tone == "wheat":
            if any(k in color_type for k in ["砖红", "深色", "铁锈"]):
                score += 15
            if "所有" in suitable:
                score += 5

        # Skin type ↔ texture match
        if skin_type == "dry":
            if any(k in texture for k in ["滋润", "水润", "缎光", "奶油"]):
                score += 10
        elif skin_type == "oily":
            if any(k in texture for k in ["哑光", "雾面", "丝绒"]):
                score += 10
        elif skin_type == "combination":
            if any(k in texture for k in ["柔雾", "丝绒", "哑光"]):
                score += 8
        elif skin_type == "neutral":
            score += 5

    elif category == "foundation":
        texture = details.get("texture", "")
        suitable = details.get("suitable", "")
        coverage = details.get("coverage", "")

        # Skin type ↔ foundation texture
        if skin_type == "dry":
            if any(k in texture for k in ["滋润", "水润", "水光", "奶油"]):
                score += 15
            if "干皮" in suitable or "中性" in suitable:
                score += 5
        elif skin_type == "oily":
            if any(k in texture for k in ["哑光", "雾面", "控油"]):
                score += 15
            if "油皮" in suitable or "混合" in suitable:
                score += 5
        elif skin_type == "combination":
            if any(k in texture for k in ["缎光", "哑光", "柔雾"]):
                score += 12
            if "混合" in suitable:
                score += 5
        elif skin_type == "neutral":
            score += 10
            if "所有" in suitable:
                score += 5

        # Style ↔ coverage
        if style_pref == "bold":
            if "高遮瑕" in coverage:
                score += 8
        elif style_pref == "daily":
            if "轻薄" in coverage or "中等" in coverage:
                score += 8
        elif style_pref == "elegant":
            if "中等" in coverage:
                score += 6

    # Style preference bonus
    lasting_num = details.get("lasting_num", 0)
    if style_pref == "daily" and lasting_num >= 8:
        score += 5
    elif style_pref == "bold" and lasting_num >= 6:
        score += 3

    # Cap score
    return min(max(score, 50), 99)


@app.route("/api/battles", methods=["POST"])
def get_battles():
    """
    Receive video_id, return 4 fighters for the arena.
    """
    data = request.get_json() or {}
    video_id = data.get("video_id", "v001")
    category = data.get("category", "lipstick")

    video = next((v for v in VIDEOS if v["id"] == video_id), None)

    # Filter by category
    available = [p for p in PRODUCTS if p.get("category", "lipstick") == category]
    if len(available) < 4:
        available = PRODUCTS.copy()

    random.shuffle(available)
    selected = available[:4]

    return jsonify({
        "category": category,
        "video_id": video_id,
        "fighters": selected
    })


@app.route("/api/result", methods=["POST"])
def get_result():
    """
    Receive user's round choices, return champion details.
    """
    data = request.get_json()
    video_id = data.get("video_id", "v001")
    rounds = data.get("rounds", [])

    champion_id = rounds[-1]["winner_id"] if rounds else None
    champion = next((p for p in PRODUCTS if p["id"] == champion_id), None)

    if not champion:
        return jsonify({"error": "Champion not found"}), 404

    battle_summary = []
    for i, r in enumerate(rounds):
        winner = next((p for p in PRODUCTS if p["id"] == r["winner_id"]), None)
        loser = next((p for p in PRODUCTS if p["id"] == r["loser_id"]), None)
        if winner and loser:
            battle_summary.append({
                "round": i + 1,
                "winner": {"id": winner["id"], "name": winner["name"]},
                "loser": {"id": loser["id"], "name": loser["name"]},
                "reason": winner["argument"]
            })

    reasons = []
    if champion:
        reasons.append(champion["argument"])
        for h in champion["details"].get("highlights", [])[:2]:
            reasons.append(h)

    competitor_ids = set()
    for r in rounds:
        competitor_ids.add(r["winner_id"])
        competitor_ids.add(r["loser_id"])
    competitor_ids.discard(champion_id)

    competitors = []
    for cid in competitor_ids:
        comp = next((p for p in PRODUCTS if p["id"] == cid), None)
        if comp:
            competitors.append({
                "id": comp["id"],
                "name": comp["name"],
                "brand": comp["brand"],
                "price": comp["price"],
                "image": comp["image"],
                "power": comp["power"],
                "source": comp["source"],
                "argument": comp["argument"]
            })

    return jsonify({
        "champion": champion,
        "reasons": reasons,
        "competitors": competitors,
        "battle_summary": battle_summary
    })


def build_arena_system_prompt():
    """Build the system prompt for the debate LLM."""
    return """你是Chovy选品辩论赛的主持人和编剧。你控制一场4个美妆产品在微信群里的辩论。

角色设定：
- 每个产品有自己的性格（基于品牌调性）
- 辩论风格：轻松、有梗、偶尔互相drama，像真人聊天
- 每轮每个产品发言1-2句，共3-5轮
- 每轮结束时，你需要根据辩论表现 + 用户反馈信号，决定淘汰1个产品
- 淘汰时要有戏剧化退群台词
- 最后2个进入决赛，深度对线
- 最终必须决出1个冠军
- 如果提供了用户面部画像，产品发言时要引用用户的肤质/肤色特征来论证自己更适合

输出格式（严格JSON Lines，每条消息单独一行）：
普通消息：{"speaker":"product_a|product_b|product_c|product_d|dm","text":"..."}
淘汰行：{"type":"eliminate","product_id":"b004","exit_line":"..."}
冠军行：{"type":"champion","product_id":"b001"}
反馈提示：{"type":"feedback_prompt","question":"刚说到持妆力，对你来说重要吗？","options":["非常重要","一般般","无所谓"],"context":"持妆力"}

重要规则：
1. 每条消息必须是独立的一行JSON
2. 不要输出任何非JSON内容
3. product_a/b/c/d 对应传入的4个产品顺序
4. 每轮辩论中4个产品都要发言
5. 淘汰理由要基于辩论表现，不能随意
6. 决赛阶段（剩2个）要深度对比，最终必须选出冠军
7. 在辩论中穿插1-2次feedback_prompt，询问用户对某个维度的看法
8. 产品发言中要自然地引用用户画像特征（如"你这种暖黄皮..."）"""


def build_arena_user_message(data):
    """Build the user message with all context for the debate."""
    contestants = data.get("contestants", [])
    eliminated_ids = data.get("eliminated_ids", [])
    user_signals = data.get("user_signals", [])
    phase = data.get("phase", "debate")
    round_num = data.get("round", 1)
    history = data.get("history", [])
    face_profile = data.get("face_profile")

    # Build contestant descriptions (always all 4 for consistent labeling)
    contestant_desc = []
    labels = ["product_a", "product_b", "product_c", "product_d"]
    for i, c in enumerate(contestants):
        label = labels[i] if i < len(labels) else f"product_{i+1}"
        status = " [已退群]" if c.get("id") in eliminated_ids else ""
        desc = (
            f"[{label}]{status} {c.get('brand', '')} {c.get('name', '')}\n"
            f"  价格：{c.get('price', '未知')}\n"
            f"  卖点：{c.get('argument', '')}\n"
            f"  色系：{c.get('details', {}).get('color_type', '未知')}\n"
            f"  质地：{c.get('details', {}).get('texture', '未知')}\n"
            f"  持妆：{c.get('details', {}).get('lasting', '未知')}\n"
            f"  适合：{c.get('details', {}).get('suitable', '未知')}\n"
            f"  亮点：{', '.join(c.get('details', {}).get('highlights', []))}"
        )
        contestant_desc.append(desc)

    # Build signals description
    signals_desc = ""
    if user_signals:
        signals_desc = "\n用户反馈信号：\n"
        for s in user_signals:
            action = "喜欢" if s.get("type") == "like" else "不喜欢"
            signals_desc += f"- {action} {s.get('product_id', '')}: {s.get('context', '')}\n"

    # Build face profile description
    face_desc = ""
    if face_profile:
        skin_tone_labels = {'cold_white': '冷白皮', 'warm_yellow': '暖黄皮', 'natural': '自然肤色', 'wheat': '小麦色'}
        skin_type_labels = {'dry': '干皮', 'oily': '油皮', 'combination': '混合皮', 'neutral': '中性'}
        style_labels = {'daily': '日常通勤', 'elegant': '约会精致', 'bold': '大胆个性'}
        face_desc = f"""
用户面部画像：
- 肤色：{skin_tone_labels.get(face_profile.get('skin_tone', ''), '未知')}
- 肤质：{skin_type_labels.get(face_profile.get('skin_type', ''), '未知')}
- 风格偏好：{style_labels.get(face_profile.get('style_pref', ''), '未知')}
- 色调：{face_profile.get('undertone', '未知')}
请在辩论中引用这些特征来论证产品更适合该用户。"""

    # Build history description
    history_desc = ""
    if history:
        history_desc = "\n已进行的对话历史：\n"
        for h in history:
            history_desc += f"- [{h.get('speaker', '?')}] {h.get('text', '')}\n"

    # Phase-specific instructions
    phase_instructions = {
        "debate": f"当前是辩论阶段第{round_num}轮。请让还在群里的产品各自发言1-2句，互相辩论。本轮结束后淘汰1个产品（用eliminate类型输出）。已退群的产品不能发言。",
        "finale": "当前是决赛阶段。只剩2个产品，请让它们深度对线，互相反驳，最后决出冠军（用champion类型输出）。",
        "eliminate": "请宣布淘汰结果，被淘汰的产品要发表退群感言。"
    }

    phase_inst = phase_instructions.get(phase, phase_instructions["debate"])

    return f"""产品信息（所有4个产品，标注是否已退群）：
{chr(10).join(contestant_desc)}
{face_desc}
{signals_desc}
{history_desc}
当前阶段：{phase}
当前轮次：{round_num}

{phase_inst}

请严格按照JSON Lines格式输出，每行一条消息。已退群的产品不能发言。"""


@app.route("/api/arena/stream", methods=["POST"])
def arena_stream():
    """SSE endpoint for LLM-driven debate streaming."""
    data = request.get_json() or {}

    # If DeepSeek client is not available, return fallback
    if not deepseek_client:
        return Response(
            generate_fallback_debate(data),
            mimetype="text/event-stream"
        )

    contestants = data.get("contestants", [])
    if len(contestants) < 2:
        return jsonify({"error": "Need at least 2 contestants"}), 400

    system_prompt = build_arena_system_prompt()
    user_message = build_arena_user_message(data)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    def generate():
        try:
            stream = deepseek_client.chat.completions.create(
                model=DEEPSEEK_MODEL,
                messages=messages,
                stream=True,
                temperature=0.85,
                max_tokens=2000
            )

            buffer = ""
            for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    buffer += content
                    # Try to extract complete JSON lines
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if line:
                            yield f"data: {line}\n\n"

            # Process remaining buffer
            if buffer.strip():
                yield f"data: {buffer.strip()}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            error_msg = json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False)
            yield f"data: {error_msg}\n\n"
            yield "data: [DONE]\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )


def generate_fallback_debate(data):
    """Fallback debate when DeepSeek API is not available."""
    contestants = data.get("contestants", [])
    eliminated_ids = data.get("eliminated_ids", [])
    phase = data.get("phase", "debate")
    round_num = data.get("round", 1)

    labels = ["product_a", "product_b", "product_c", "product_d"]

    # Filter to active contestants
    active = [c for c in contestants if c.get("id") not in eliminated_ids]

    if phase == "debate":
        # DM intro
        dm_msg = json.dumps({"speaker": "dm", "text": f"欢迎来到选品辩论赛第{round_num}轮！各位选手请发言。"}, ensure_ascii=False)
        yield f"data: {dm_msg}\n\n"

        # Each active product speaks
        fallback_lines = [
            "持久度方面，我表现最出色，谁能比？",
            "持久归持久，滋润才是王道！我质地滋润不卡纹。",
            "两位都别吵了，我的色号才是今年的流行趋势。",
            "流行什么不重要，性价比才是硬道理。"
        ]

        for i, c in enumerate(contestants):
            if c.get("id") in eliminated_ids:
                continue
            label = labels[contestants.index(c)]
            text = fallback_lines[i] if i < len(fallback_lines) else f"我是{c.get('name', '选手')}，我也有话说！"
            msg = json.dumps({"speaker": label, "text": text}, ensure_ascii=False)
            yield f"data: {msg}\n\n"

        # Eliminate the weakest active
        if len(active) > 2:
            weakest = min(active, key=lambda c: c.get("power", 0))
            elim_msg = json.dumps({
                "type": "eliminate",
                "product_id": weakest["id"],
                "exit_line": "好吧，你们继续，我去性价比赛道等你们 😏"
            }, ensure_ascii=False)
            yield f"data: {elim_msg}\n\n"

    elif phase == "finale":
        dm_msg = json.dumps({"speaker": "dm", "text": "决赛开始！最后两位选手，请展示你们的终极实力！"}, ensure_ascii=False)
        yield f"data: {dm_msg}\n\n"

        for i, c in enumerate(active[:2]):
            label = labels[contestants.index(c)]
            text = f"最后的对决了。{c.get('argument', '我才是最佳选择！')}"
            msg = json.dumps({"speaker": label, "text": text}, ensure_ascii=False)
            yield f"data: {msg}\n\n"

        # Champion
        champion = max(active[:2], key=lambda c: c.get("power", 0))
        champ_msg = json.dumps({"type": "champion", "product_id": champion["id"]}, ensure_ascii=False)
        yield f"data: {champ_msg}\n\n"

    yield "data: [DONE]\n\n"


if __name__ == "__main__":
    print("Chovy API Server starting on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
