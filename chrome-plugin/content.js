// ====================== 配置 ======================
const RAGFLOW_API = "http://localhost:12345/v1/chat/completions";
const RAGFLOW_KEY = "your_ragflow_api_key";

// ====================== 全局状态 ======================
let currentMode = null; // ai-highlight / smart-guide / auto-guide
let mask = null;
let autoGuideTimer = null;
let isPaused = false;

// ====================== 初始化 UI ======================
window.onload = () => {
  createRobot();
  createPanel();
  bindClick();
  console.log("✅ microfox 大屏助手已加载");
};

// ====================== 1. 精确区域截图（html2canvas） ======================
async function captureArea(dom) {
  const canvas = await html2canvas(dom, { useCORS: true, scale: 1.5 });
  return canvas.toDataURL("image/png");
}

// ====================== 2. 全屏截图（后台API） ======================
async function captureFullScreen() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "capture-visible" }, res => {
      resolve(res.base64);
    });
  });
}

// ====================== 3. 蒙版高亮 ======================
function highlight(rect) {
  removeMask();
  mask = document.createElement("div");
  mask.className = "ai-mask";
  const hole = document.createElement("div");
  hole.className = "highlight-hole";
  Object.assign(hole.style, rect);
  mask.appendChild(hole);
  document.body.appendChild(mask);
}

function removeMask() {
  mask?.remove();
}

// ====================== 4. 语音播报 ======================
function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  window.speechSynthesis.speak(u);
}

// ====================== 5. 调用 RAGFlow AI ======================
async function callAI(fullImg, areaImg, question = "") {
  const res = await fetch(RAGFLOW_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RAGFLOW_KEY}`
    },
    body: JSON.stringify({
      fullImage: fullImg,
      areaImage: areaImg,
      question: question,
      mode: currentMode
    })
  });
  return await res.json();
}

// ====================== 6. 自动讲解漫游逻辑（核心） ======================
async function startAutoGuide() {
  if (currentMode !== "auto-guide") return;
  isPaused = false;

  // 大屏分块（自动识别4个核心区域）
  const blocks = [
    { x: 50, y: 50, width: 400, height: 300, name: "左上总览" },
    { x: 500, y: 50, width: 400, height: 300, name: "右上趋势" },
    { x: 50, y: 360, width: 400, height: 300, name: "左下分布" },
    { x: 500, y: 360, width: 400, height: 300, name: "右下统计" }
  ];

  for (let block of blocks) {
    if (isPaused || currentMode !== "auto-guide") break;

    // 高亮区域
    highlight(block);
    // 截图
    const full = await captureFullScreen();
    const mockDom = { getBoundingClientRect: () => block };
    const area = await captureArea(mockDom);
    // AI讲解
    const ai = await callAI(full, area);
    speak(ai.content);
    // 停留3秒
    await new Promise(r => setTimeout(r, 3000));
  }

  speak("讲解完成");
  removeMask();
}

// ====================== 模式切换 ======================
window.switchMode = (mode) => {
  stopAll();
  currentMode = mode;
  if (mode === "auto-guide") startAutoGuide();
  alert({
    "ai-highlight": "✅ AI助手（高亮）",
    "smart-guide": "✅ 智能助手（讲解+问答）",
    "auto-guide": "✅ 自动讲解（漫游）"
  }[mode]);
};

// ====================== 停止/暂停 ======================
window.stopAll = () => {
  currentMode = null;
  isPaused = true;
  clearTimeout(autoGuideTimer);
  removeMask();
  window.speechSynthesis.cancel();
};

// ====================== 用户提问 ======================
window.askAI = async () => {
  const q = document.getElementById("q").value;
  if (!q) return alert("请输入问题");
  const full = await captureFullScreen();
  const ai = await callAI(full, null, q);
  speak(ai.content);
  alert(ai.content);
};

// ====================== 基础UI/事件 ======================
function createRobot() {
  const r = document.createElement("div");
  r.className = "ai-robot";
  r.innerText = "🤖";
  r.onclick = () => document.getElementById("panel").style.display = "block";
  document.body.appendChild(r);
}

function createPanel() {
  const p = document.createElement("div");
  p.id = "panel";
  p.className = "ai-panel";
  p.innerHTML = `
    <button onclick="switchMode('ai-highlight')">🤖 AI助手</button>
    <button onclick="switchMode('smart-guide')">🧠 智能助手</button>
    <button onclick="switchMode('auto-guide')">🔄 自动讲解</button>
    <button onclick="stopAll()">⏹️ 停止</button>
    <div><input id="q" placeholder="提问AI"><button onclick="askAI()">发送</button></div>
  `;
  document.body.appendChild(p);
}

function bindClick() {
  document.addEventListener("click", (e) => {
    if (currentMode === "ai-highlight") {
      highlight(e.target.getBoundingClientRect());
    }
  });
}