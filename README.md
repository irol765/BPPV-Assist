# BPPV Assist (耳石症复位助手)

[English](#english) | [中文](#chinese)

---

<a name="english"></a>
## 🇬🇧 English

**BPPV Assist** is a progressive web application (PWA) designed to help individuals manage Benign Paroxysmal Positional Vertigo (BPPV). It utilizes AI (Google Gemini Vision) to analyze eye movements for nystagmus and provides interactive 3D visualizations to guide users through repositioning maneuvers (like the Epley maneuver).

### Features
*   **AI Diagnosis:** Uses camera input to analyze nystagmus patterns and identify the affected canal.
*   **3D Guidance:** Real-time 3D simulation of the semicircular canals and otolith movement during maneuvers.
*   **Step-by-Step Treatment:** Guided timers and visual instructions for performing the Epley maneuver.
*   **PWA Support:** Can be installed on iOS and Android devices.

### Deployment Guide (Vercel)

This project is built with React and Vite and is ready for deployment on Vercel.

1.  **Clone the repository.**
2.  **Import to Vercel:** Connect your GitHub repository to Vercel.
3.  **Environment Variables:** You MUST configure the following environment variable in Vercel settings for the AI features to work:
    *   `API_KEY`: Your Google Gemini API Key. (Get one at [aistudio.google.com](https://aistudiocdn.com/aistudio.google.com))
4.  **Deploy:** Click deploy.

### Usage Instructions
1.  **Open the App:** Visit the deployed URL on your mobile device.
2.  **Add to Home Screen (iOS):**
    *   Tap the "Share" button in Safari.
    *   Scroll down and tap "Add to Home Screen".
    *   This ensures the app runs in full-screen mode for the best experience.
3.  **Diagnosis:** Select "AI Diagnosis", point the camera at your eyes, and perform the Dix-Hallpike test.
4.  **Treatment:** Follow the 3D model and timer instructions to perform the repositioning maneuver.

---

<a name="chinese"></a>
## 🇨🇳 Chinese (中文)

**耳石症复位助手 (BPPV Assist)** 是一款旨在帮助良性阵发性位置性眩晕 (BPPV) 患者的渐进式 Web 应用 (PWA)。它利用人工智能 (Google Gemini Vision) 分析眼球震颤，并通过交互式 3D 模拟指导用户进行复位操作（如 Epley 复位法）。

### 功能特点
*   **AI 智能诊断:** 使用摄像头捕捉眼部画面，分析眼震模式，辅助判断受累半规管。
*   **3D 复位指导:** 实时 3D 模拟半规管及耳石在复位过程中的运动轨迹。
*   **分步治疗:** 提供带有计时器和视觉指引的 Epley 复位法详细步骤。
*   **PWA 支持:** 支持添加到 iOS 和 Android 桌面，像原生应用一样使用。

### 部署指南 (Vercel)

本项目基于 React 和 Vite 构建，完全适配 Vercel 部署。

1.  **克隆代码库。**
2.  **导入 Vercel:** 将您的 GitHub 仓库连接到 Vercel。
3.  **配置环境变量:** 为了使用 AI 功能，您必须在 Vercel 的项目设置中配置以下环境变量：
    *   `API_KEY`: 您的 Google Gemini API 密钥。（可在 [aistudio.google.com](https://aistudiocdn.com/aistudio.google.com) 获取）
4.  **点击部署 (Deploy)。**

### 使用说明
1.  **打开应用:** 在手机浏览器中访问部署后的链接。
2.  **添加到主屏幕 (iOS):**
    *   在 Safari 浏览器中点击底部的“分享”按钮。
    *   向下滑动并点击“添加到主屏幕”。
    *   这样可以全屏运行应用，获得最佳体验。
3.  **进行诊断:** 点击“AI 智能诊断”，将摄像头对准眼睛，进行 Dix-Hallpike 诱发试验。
4.  **开始复位:** 根据分析结果，跟随 3D 模型和计时器提示进行复位操作。
