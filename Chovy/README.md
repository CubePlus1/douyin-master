# Daodun - 从种草到决策

> AI 驱动的美妆选品辩论系统。粘贴抖音链接，4 个产品在群聊里互相辩论，最终决出冠军。

## 简介

Daodun 是一个模拟「微信群聊辩论」的选品决策工具。用户粘贴一个抖音种草视频链接后，系统自动抽取 4 个候选产品，由 DeepSeek 大模型驱动它们以第一人称互相辩论、反驳、淘汰，最终决出冠军并生成偏好画像。

**核心特点：**

- **LLM 驱动辩论** — 产品们自己发言、互相反驳，像真人微信群聊
- **用户默认旁观** — 不需要操作也能跑完全流程
- **可选轻量反馈** — 点赞/踩微调排序，不阻塞流程
- **自然淘汰** — 由 LLM 基于辩论表现 + 用户反馈决定，非硬编码规则
- **SSE 流式输出** — 聊天气泡逐条出现，体验流畅

## 流程概览

```
粘贴链接 → AI 分析 → 4 产品入群 → 自动辩论（3 轮）→ 逐步淘汰 → 决赛 → 冠军诞生 → 偏好画像
```

| 阶段 | 说明 |
|------|------|
| 入群 | DM 欢迎，4 个产品各自自我介绍 |
| 辩论 | 每轮 4 个产品各发 1-2 句，互相辩论，轮末淘汰 1 个 |
| 决赛 | 最后 2 个深度对线 |
| 揭晓 | 宣布冠军，跳转结果页（含偏好画像） |

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

依赖：`flask`、`flask-cors`、`openai`

### 2. 配置 DeepSeek API（可选）

通过环境变量配置，不配置则自动使用内置 fallback 辩论逻辑：

```bash
# Linux / macOS
export DEEPSEEK_API_KEY="sk-xxxxxxxx"
export DEEPSEEK_MODEL="deepseek-chat"          # 默认值，可不设

# Windows PowerShell
$env:DEEPSEEK_API_KEY="sk-xxxxxxxx"
$env:DEEPSEEK_MODEL="deepseek-chat"
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEEPSEEK_API_KEY` | 内置 key | DeepSeek API 密钥 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 模型名，自动路由到最新可用模型 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/v1` | API 地址（代码内配置） |

### 3. 启动服务

```bash
python server.py
```

服务默认运行在 `http://localhost:5000`。

### 4. 打开浏览器

访问 `http://localhost:5000`，粘贴一个抖音链接或点击示例视频开始体验。

## 项目结构

```
Chovy/
├── server.py              # Flask 后端（API + SSE 流式辩论）
├── index.html             # SPA 入口
├── requirements.txt       # Python 依赖
├── css/
│   └── style.css          # 全局样式（iOS/WeChat 风格）
├── js/
│   ├── app.js             # SPA 编排、全局状态、路由注册
│   ├── router.js          # Hash 路由器
│   ├── storage.js         # localStorage 用户画像管理
│   ├── home.js            # 首页（链接输入 + 历史记录）
│   ├── thinking.js        # AI 分析动画（气泡 + 工具卡片）
│   ├── arena.js           # 辩论群聊（LLM 流式 + 反馈 + 淘汰动画）
│   ├── result.js          # 结果页（冠军展示 + 战报回顾）
│   ├── discover.js        # 发现页
│   └── profile.js         # 个人画像页
└── data/
    ├── videos.json         # 示例视频数据
    ├── battles.json        # 产品数据库（8 个美妆产品）
    ├── ai_messages.json    # Thinking 阶段的 AI 对话模板
    └── dm_questions.json   # 旧版 DM 问题（V2 已不使用）
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/videos` | 获取示例视频列表 |
| POST | `/api/parse` | 解析视频链接（模拟） |
| POST | `/api/thinking-data` | 获取 AI 分析数据 + 4 个候选产品 |
| POST | `/api/battles` | 获取竞技场选手 |
| POST | `/api/result` | 提交选择，获取冠军详情 |
| **POST** | **`/api/arena/stream`** | **SSE 流式辩论端点（V2 核心）** |

### `/api/arena/stream` 请求体

```json
{
  "contestants": [/* 4 个产品完整数据 */],
  "eliminated_ids": ["b004"],
  "user_signals": [
    {"type": "like", "product_id": "b001", "context": "持久度强"},
    {"type": "dislike", "product_id": "b003", "context": "太贵了"}
  ],
  "phase": "debate",
  "round": 2,
  "history": [
    {"speaker": "dm", "text": "第 1 轮辩论开始"},
    {"speaker": "product_a", "text": "持久度方面我最强"}
  ]
}
```

### SSE 响应格式

每条消息以 `data: ` 前缀，JSON Lines 格式：

```
data: {"speaker":"dm","text":"欢迎来到选品辩论赛！"}
data: {"speaker":"product_a","text":"持久度方面，我8小时不脱色！"}
data: {"speaker":"product_b","text":"滋润才是王道！"}
data: {"type":"eliminate","product_id":"b004","exit_line":"好吧，你们继续 😏"}
data: {"type":"champion","product_id":"b001"}
data: [DONE]
```

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python + Flask |
| LLM | DeepSeek V4（通过 OpenAI 兼容 SDK） |
| 前端 | 原生 HTML/CSS/JS SPA |
| 通信 | SSE (Server-Sent Events) |
| 样式 | iOS / WeChat 风格，Material Icons |
| 存储 | localStorage（用户画像） |

## 降级策略

系统设计了完整的 fallback 机制：

| 场景 | 行为 |
|------|------|
| DeepSeek API Key 未配置 | 使用内置 fallback 辩论逻辑 |
| `openai` 包未安装 | 同上，控制台打印警告 |
| API 调用失败 / 超时 | 前端自动降级到本地模拟辩论 |
| 产品数据不足 | 使用内置 4 个默认美妆产品 |

## 设计参考

- iPhone iOS 状态栏 + 圆角手机壳
- 微信群聊气泡样式
- Material Icons Outlined 图标库
- 绿色主色调 (#07c160)
