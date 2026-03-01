# Lecturely - AI-Powered Bilingual Live Transcription
[中文版向下滚动 | Scroll down for Chinese version](#-lecturely---ai-驱动的沉浸式双语同传听课神器)

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**Lecturely (Public Edition)** is a high-performance, browser-based live transcription tool designed for English-medium academic environments (e.g., Sino-US universities, international students). Powered by **Deepgram**'s ultra-fast speech recognition and **DeepSeek**'s LLM translation, it delivers ultra-low latency English-to-Chinese bilingual subtitles.

> **Public Edition Note (BYOK)**: This project implements a **Bring Your Own Key (BYOK)** architecture. It runs entirely on the client side. Your API keys and transcription records are 100% stored in your local browser's `localStorage`. Zero server costs, ultimate privacy.

###  Core Features
 **Real-time Bilingual Transcription**: Millisecond-level response with intelligent endpointing and professional terminology retention.
 **Internal Audio Capture**: Bypass microphone noise by natively capturing system/tab audio (perfect for Zoom/online lectures).
 **Virtual File System (VFS)**: Windows-style file explorer for managing your lecture archives (Create, Rename, Delete).
 **Immersive Reader**: Full-screen playback mode with a one-click `.txt` export feature for revision.
 **Ultimate Privacy**: No backend database, no login required. Your data belongs to your hard drive.

### 🛠️ Quick Start (For Users)
1. Get your API Keys: [Deepgram](https://deepgram.com/) (for Speech-to-Text) & [DeepSeek](https://platform.deepseek.com/) (for Translation).
2. Open the deployed [Lecturely Web App](#).
3. Click **"⚙️ 参数设置 (Settings)"** in the top bar.
4. Enter your API Keys in the **Public Edition** section and click Save.
5. Click **"🎙️ 开始新课程 (Start)"** to begin!

---

# 🎙️ Lecturely - AI 驱动的沉浸式双语同传听课神器

**Lecturely (Public Edition)** 是一个专为全英授课环境打造的高性能网课/讲座辅助工具。它结合了 **Deepgram** 的极速语音识别与 **DeepSeek** 的大语言模型翻译能力，能在浏览器端实现超低延迟的“英文语音提取 ---> 实时中英双语字幕”。

> **Public Edition 特别说明**：本项目采用 **BYOK (Bring Your Own Key)** 架构设计，纯前端本地运行。用户的 API 密钥和所有课堂录音档案均 100% 存储在本地浏览器的 `localStorage` 中，绝对保护隐私，且零服务器成本。

### 核心特性
***极速双语同传**：毫秒级响应，支持智能断句与专业词汇保留。
***硬核内录模式**：不仅支持麦克风，更内置“系统音频抓取”，无损内录网课声音，完美屏蔽环境噪音。
***Windows 级资源管理器**：内置虚拟文件系统（VFS），支持创建文件夹、重命名、一键删除。
***沉浸式阅读器**：下课后可随时进入专属回看页面复习，支持一键导出 `.txt`。
***极致隐私安全**：无后端数据库，无账号登录系统，数据只属于本地硬盘。

### 快速上手指南
1. 前往 [Deepgram](https://deepgram.com/) 与 [DeepSeek](https://platform.deepseek.com/) 获取免费的 API 密钥。
2. 打开在线部署的 Lecturely 网页。
3. 点击顶部工具栏的 **“⚙️ 参数设置”**，填入你的两把 Key 并保存。
4. 点击 **“🎙️ 开始新课程”** 即可体验极速同传！

---

##  Author
* **Designed & Built by:** Austin ([@AustinZ132](https://github.com/@AustinZ132))
* **Institution:** Wenzhou-Kean University, Computer Science
* **License:** [MIT License](LICENSE)
