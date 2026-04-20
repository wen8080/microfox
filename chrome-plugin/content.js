// RAGFlow 配置
const RAGFLOW_CONFIG = {
  api: "http://localhost:12345/v1/chat/completions",
  key: "your_ragflow_api_key"
};

// 全局状态
let currentMode = null;
let maskDom = null;

// 初始化
window.onload = () => {
  createRobot();
  createPanel();
  bindPageClick();
  console.log("✅ microfox 大屏助手已启动");
};

// 创建悬浮机器人
function createRobot() {
  const robot = document.createElement("div");
  robot.className = "ai-robot";
  robot.innerText = "🤖";
  robot.onclick = togglePanel;
  document.body.appendChild(robot);
}

// 创建控制面板
function createPanel() {
  const panel = document.createElement("div");
  panel.className = "ai-panel";
  panel.id = "ai-panel";
  panel.innerHTML = `
    <button onclick="switchMode('ai-highlight')">🤖 AI助手(高亮)</button>
    <button onclick="switchMode('smart-guide')">🧠 智能助手(讲解)</button>
    <button onclick="switchMode('auto-guide')">🔄 自动讲解</button>
    <button onclick="stopAll()">⏹️ 停止</button>
    <div style="margin-top:8px">
      <input id="userQuestion" placeholder="输入问题" style="width:180px">
      <button onclick="sendQuestion()">提问</button>
    </div>
  `;
  document.body.appendChild(panel);
}

// 显示/隐藏面板
function togglePanel() {
  const panel = document.getElementById("ai-panel");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

// 高亮区域
function highlight(rect) {
  removeMask();
  const mask = document.createElement("div");
  mask.className = "ai-mask";
  const hole = document.createElement("div");
  hole.className = "highlight-hole";
  hole.style.left = rect.x + "px";
  hole.style.top = rect.y + "px";
  hole.style.width = rect.width + "px";
  hole.style.height = rect.height + "px";
  mask.appendChild(hole);
  document.body.appendChild(mask);
  maskDom = mask;
}

// 清除蒙版
function removeMask() {
  if (maskDom) maskDom.remove();
}

// 语音播报
function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  window.speechSynthesis.speak(u);
}

// 绑定页面点击
function bindPageClick() {
  document.addEventListener("click", (e) => {
    if (!currentMode) return;
    const rect = e.target.getBoundingClientRect();
    if (currentMode === "ai-highlight") highlight(rect);
  });
}

// 模式切换
window.switchMode = (mode) => {
  stopAll();
  currentMode = mode;
  const msg = {
    "ai-highlight": "已开启：AI高亮辅助",
    "smart-guide": "已开启：智能讲解+问答",
    "auto-guide": "已开启：全屏自动讲解"
  };
  alert(msg[mode]);
};

// 停止所有
window.stopAll = () => {
  currentMode = null;
  removeMask();
  window.speechSynthesis.cancel();
};

// 提问AI
window.sendQuestion = async () => {
  const q = document.getElementById("userQuestion").value;
  if (!q) return alert("请输入问题");
  alert("AI对接中：" + q);
};