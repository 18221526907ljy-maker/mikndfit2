
 * MindFit 身心健康管理平台
 * 基础工具 & 存储
 *****************/
const DB_KEY = "mindfit_db_v1";

const defaultDB = () => ({
  records: [],          // 思维记录
  emotions: [],         // 情绪练习完成 {card, ts}
  experiments: [],      // 行为实验
  mindfulness: [],      // 冥想练习 {seconds, ts}
  assessments: [],      // 测评结果
  badges: {},           // 徽章布尔
  streak: { count: 0, lastDate: "" }, // 连续天数
  cachedAudio: false,   // 冥想音频缓存标记
});

const loadDB = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : defaultDB();
  } catch (e) {
    console.error("数据加载失败:", e);
    return defaultDB();
  }
};

const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const fmtTime = (ts) => {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? "0" + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const showToast = (msg) => {
  const wrap = document.getElementById("toast");
  const box = wrap.firstElementChild;
  box.textContent = msg;
  wrap.classList.remove("hidden");
  setTimeout(() => wrap.classList.add("hidden"), 1800);
};

// streak 更新：每天任意操作一次记为活跃
const touchStreak = (db) => {
  const t = todayStr();
  if (db.streak.lastDate === t) return;
  // 判断是否连续
  const last = db.streak.lastDate ? new Date(db.streak.lastDate) : null;
  const y = new Date(t);
  const one = 24 * 60 * 60 * 1000;
  const isConsecutive = last && (y - last) / one === 1;
  db.streak.count = isConsecutive ? (db.streak.count + 1) : 1;
  db.streak.lastDate = t;
};

// 生成/更新结果进度条
function renderGauge(containerId, percent, labelText){
  const box = document.getElementById(containerId) || (()=>{
    const auto = document.createElement('div');
    auto.id = containerId;
    const card = containerId.startsWith('light') ? document.getElementById('lightResult') : document.getElementById('proResult');
    if(card){ card.prepend(auto); }
    return auto;
  })();
  if(!box) return;
  box.innerHTML = `
    <div class="result-gauge-label">
      <span>${labelText || '综合结果'}</span>
      <span>${percent}%</span>
    </div>
    <div class="result-gauge"><div class="bar" style="width:${percent}%;"></div></div>
  `;
}

// 通用：把结果卡里的文字建议复制到剪贴板
function attachCopyAdvice(btnId, adviceContainerId){
  const btn = document.getElementById(btnId);
  if(!btn) return;
  btn.onclick = async ()=>{
    const ul = document.getElementById(adviceContainerId);
    const text = ul ? Array.from(ul.querySelectorAll('li')).map(li=>`• ${li.textContent.trim()}`).join('\n') : '';
    try{
      await navigator.clipboard.writeText(text || '（没有可复制的建议）');
      if(typeof showToast==='function') showToast('已复制到剪贴板'); else alert('已复制到剪贴板');
    }catch(e){ alert('复制失败，请手动选择复制'); }
  };
}

/*****************
 * 页面导航系统
 *****************/
document.addEventListener("DOMContentLoaded", () => {
  const pages = document.querySelectorAll(".page");
  const backBtn = document.getElementById("backBtn");
  const pageTitle = document.getElementById("pageTitle");
  const featureCards = document.querySelectorAll(".feature-card");
  const otherLinks = document.querySelectorAll("[data-target]");
  const navBtns = document.querySelectorAll(".nav-btn");

  let pageHistory = ["homePage"];

  const titleMap = {
    homePage: "MindFit 身心管理",
    assessmentPage: "身心轻测评",
    thoughtRecordPage: "自动思维记录",
    emotionRegulationPage: "情绪调节卡片",
    behaviorExperimentPage: "行为实验指南",
    mindfulnessPage: "冥想/正念练习",
    myRecordsPage: "我的记录",
    myBadgesPage: "我的徽章",
  };

  function navigateTo(id) {
    pages.forEach((p) => p.classList.add("hidden"));
    const target = document.getElementById(id);
    if (!target) return;
    target.classList.remove("hidden");
    pageTitle.textContent = titleMap[id] || "MindFit";
    if (pageHistory[pageHistory.length - 1] !== id) pageHistory.push(id);
    window.scrollTo(0, 0);
    
    // 更新底部导航状态
    navBtns.forEach(btn => {
      btn.classList.remove('text-primary');
      btn.classList.add('text-gray-500');
    });
    
    // 根据页面设置对应的导航按钮为激活状态
    const navMap = {
      homePage: 0,
      emotionRegulationPage: 1,
      myRecordsPage: 2,
      myBadgesPage: 3
    };
    
    const activeNavIndex = navMap[id];
    if (activeNavIndex !== undefined && navBtns[activeNavIndex]) {
      navBtns[activeNavIndex].classList.remove('text-gray-500');
      navBtns[activeNavIndex].classList.add('text-primary');
    }
    
    // 进入页面时渲染
    switch (id) {
      case "homePage":
        renderHome();
        break;
      case "thoughtRecordPage":
        renderTRPreview();
        break;
      case "emotionRegulationPage":
        renderEmotionStats();
        renderEmotionRecs();
        break;
      case "behaviorExperimentPage":
        renderBXList();
        break;
      case "myRecordsPage":
        renderRecordList("all");
        break;
      case "myBadgesPage":
        renderBadges();
        break;
      case "assessmentPage":
        renderAssessment();
        break;
    }
  }

  featureCards.forEach((c) => c.addEventListener("click", () => navigateTo(c.dataset.target)));
  otherLinks.forEach((c) => c.addEventListener("click", () => navigateTo(c.dataset.target)));
  navBtns.forEach((c) => c.addEventListener("click", () => navigateTo(c.dataset.target)));

  backBtn.addEventListener("click", () => {
    if (pageHistory.length > 1) {
      pageHistory.pop();
      navigateTo(pageHistory[pageHistory.length - 1]);
    }
  });

  /*****************
   * 轻测评（9题）
   *****************/
  const QUESTIONS = [
    "照镜子或翻看照片时，我会特别关注自己的某些身体部位",
    "我会把自己和社交媒体上的"完美身材"比较",
    "吃完喜欢的食物后，我会感到后悔或愧疚",
    "如果对自己的外貌不满意，我会情绪低落或心情受到影响",
    "我会给自己制定严格的饮食或运动计划，若未完成会自责",
    "因为担心身材，我会避免拍照或参加社交活动",
    "我觉得类似于"如果我变得更好看，生活会更顺利"这类想法有一定道理",
    "我想摆脱这些焦虑想法，但不知道从哪里开始",
    "如果有简单可操作的心理自助练习（例如思维记录、情绪卡片等），我愿意尝试",
  ];

  function renderAssessment() {
    // BMI 文本
    const h = document.getElementById("heightInput");
    const w = document.getElementById("weightInput");
    const bmiText = document.getElementById("bmiText");
    const updateBMI = () => {
      const hv = parseFloat(h.value) || 0;
      const wv = parseFloat(w.value) || 0;
      if (!hv || !wv) {
        bmiText.textContent = "";
        return;
      }
      const bmi = (wv / Math.pow(hv / 100, 2)).toFixed(1);
      let label = "功能健康角度：关注身体能做什么，而非数字。";
      if (bmi < 18.5) label = "提示：可能偏瘦，注意营养与能量补充。";
      else if (bmi < 24) label = "提示：总体良好，继续保持均衡与觉察。";
      else if (bmi < 28) label = "提示：适度调整饮食与活动，循序渐进。";
      else label = "提示：建议在专业指导下稳步管理与监测。";
      bmiText.innerHTML = `BMI≈<strong>${bmi}</strong>。${label}`;
    };
    h.oninput = updateBMI;
    w.oninput = updateBMI;

    // 渲染 9 题
    const qList = document.getElementById("qList");
    if (!qList.dataset.rendered) {
      qList.innerHTML = QUESTIONS.map((q, i) => {
        return `<div>
            <label class="block text-sm text-gray-700 mb-1">${i + 1}. ${q}</label>
            <input type="range" min="1" max="5" value="3" class="w-full h-2 bg-gray-200 rounded-lg accent-primary assess-item" data-idx="${i}">
            <div class="flex justify-between text-xs text-gray-400"><span>1 从不</span><span>5 总是</span></div>
          </div>`;
      }).join("");
      qList.dataset.rendered = "1";
    }
  }

  document.getElementById("btnAssess").addEventListener("click", () => {
    const db = loadDB();
    const vals = [...document.querySelectorAll(".assess-item")].map((x) => Number(x.value));
    if (vals.length !== QUESTIONS.length) {
      showToast("请完成所有题目");
      return;
    }
    const height = parseFloat(document.getElementById("heightInput").value) || null;
    const weight = parseFloat(document.getElementById("weightInput").value) || null;
    const bodyFeel = document.getElementById("bodyFeel").value || "";

    const total = vals.reduce((a, b) => a + b, 0); // 9~45
    const ts = Date.now();

    // 生成建议
    const advice = [];
    const readiness = vals[8] || 3; // 第9题：准备度

    // 根据总分判定等级
    let level = "";
    if (total >= 36) {
      level = "低焦虑水平";
      advice.push("🌟 你展现出良好的身体觉察和自我接纳能力。建议继续保持每日正念练习，可尝试帮助他人建立身心调节意识。");
    } else if (total >= 27) {
      level = "轻度需要关注";
      advice.push("🌿 你具备一定的身体觉察力。建议每日进行 1 次正念呼吸练习，定期使用思维记录工具观察情绪与身体的关系。");
    } else if (total >= 18) {
      level = "中度需要干预";
      advice.push("🌤 你可能经常体验到身体相关的焦虑。建议每日安排 2 次放松练习，每周至少 1 次完整的思维记录。");
    } else {
      level = "优先干预";
      advice.push("⛈ 你的身心状态可能需要重点关注。建议优先使用情绪调节卡片和 CBT 工具，必要时寻求专业支持。");
    }

    // 根据身体感受给出个性化任务
    if (bodyFeel === "不自信") {
      advice.push("📝 今日小任务：写下 3 条你身体的功能性优点（例如："我的身体让我可以自由行走"、"可以消化食物"、"可以感知温度"），并对身体说一句鼓励的话。");
    } else if (bodyFeel === "紧绷") {
      advice.push("🧘 今日小任务：进行一次 4-2-6 呼吸练习（吸气 4 秒，屏息 2 秒，呼气 6 秒，重复 10 轮），接着做肩颈伸展 5 分钟。");
    } else if (bodyFeel === "疲惫") {
      advice.push("🌙 今日小任务：今晚入睡前，尝试 3 分钟"身体扫描冥想"，并对自己说："今天已经尽力了"。");
    } else {
      advice.push("💚 今日小任务：选择一项你喜欢的身体活动（散步、伸展、深呼吸），专注感受身体的感觉而非外观。");
    }

    advice.push("📚 推荐：了解身体中立性理念，关注身体功能而非外貌，建立更健康的身体认知。");

    db.assessments.push({
      ts,
      score: total,
      level,
      vals,
      height,
      weight,
      bodyFeel,
      advice,
      readiness
    });
    touchStreak(db);
    saveDB(db);
    unlockBadgesIfNeeded(db);
    renderHome();

    // 显示结果
    const box = document.getElementById("lightResult");
    const summary = document.getElementById("lightSummary");
    const ul = document.getElementById("lightAdvice");
    
    summary.innerHTML = `焦虑总分：<b>${total}</b>（9–45）｜分级：<span class="badge-chip">${level}</span>｜准备度：<b>${readiness}</b>/5`;
    ul.innerHTML = advice.map((t) => `<li>${t}</li>`).join("");
    box.classList.remove("hidden");

    // 1) 进度条：把 9~45 分映射为 0~100%
    const percent = Math.round((total - 9) / 36 * 100);
    renderGauge('lightGauge', percent, '轻测评总览');

    // 2) 一键复制建议
    if(!document.getElementById('lightCopy')){
      const tools = document.createElement('div');
      tools.className = 'mt-2';
      tools.innerHTML = `<span id="lightCopy" class="copy-btn"><i class="fa fa-copy mr-1"></i>复制建议</span>`;
      document.getElementById('lightResult').prepend(tools);
    }
    attachCopyAdvice('lightCopy','lightAdvice');

    // 3) 自动滚动到结果
    document.getElementById('lightResult').scrollIntoView({behavior:'smooth', block:'start'});
    
    showToast("测评完成，已为你生成建议");
  });

  /*****************
   * 专业测评（30题）
   *****************/
  document.getElementById("btnProAssess").addEventListener("click", () => {
    // 这里实现30题专业测评
    // 为简化，现在先显示一个模拟结果
    const db = loadDB();
    const mockResult = {
      ts: Date.now(),
      overall: Math.floor(Math.random() * 40) + 60, // 60-100
      bodyImage: Math.floor(Math.random() * 30) + 50,
      anxiety: Math.floor(Math.random() * 25) + 40,
      depression: Math.floor(Math.random() * 20) + 30,
    };

    const plan = [
      "🌱 建议每日进行 10 分钟身体扫描练习，增强身体觉察",
      "📝 每周完成 2-3 次自动思维记录，识别负面认知模式", 
      "🧘 尝试正念饮食练习，培养对身体信号的敏感度",
      "💪 关注身体功能性活动，如散步、伸展、呼吸练习",
      "📖 学习身体中立性理念相关资料，重建健康身体观"
    ];

    db.assessments.push({
      ts: mockResult.ts,
      type: 'professional',
      overall: mockResult.overall,
      dimensions: {
        bodyImage: mockResult.bodyImage,
        anxiety: mockResult.anxiety, 
        depression: mockResult.depression
      },
      plan
    });

    touchStreak(db);
    saveDB(db);
    unlockBadgesIfNeeded(db);

    const box = document.getElementById("proResult");
    const summary = document.getElementById("proSummary");
    const planList = document.getElementById("proPlan");
    
    summary.innerHTML = `综合评分：<b>${mockResult.overall}</b>/100 | 身体形象：${mockResult.bodyImage} | 焦虑：${mockResult.anxiety} | 抑郁：${mockResult.depression}`;
    planList.innerHTML = plan.map((t) => `<li>${t}</li>`).join("");
    box.classList.remove("hidden");

    // 进度条和复制功能
    renderGauge('proGauge', mockResult.overall, '专业测评综合');
    if(!document.getElementById('proCopy')){
      const tools = document.createElement('div');
      tools.className = 'mt-2';
      tools.innerHTML = `<span id="proCopy" class="copy-btn"><i class="fa fa-copy mr-1"></i>复制小计划</span>`;
      document.getElementById('proResult').prepend(tools);
    }
    attachCopyAdvice('proCopy','proPlan');
    document.getElementById('proResult').scrollIntoView({behavior:'smooth', block:'start'});

    showToast("专业测评完成");
  });

  /*****************
   * 自动思维记录
   *****************/
  const btnSaveTR = document.getElementById("btnSaveTR");
  btnSaveTR.addEventListener("click", () => {
    const contextSel = document.getElementById("trContext").value;
    const contextCustom = document.getElementById("trContextCustom").value.trim();
    const thought = document.getElementById("trThought").value.trim();
    const evidence = document.getElementById("trEvidence").value.trim();
    const emotion = Number(document.getElementById("trEmotion").value) || 5;
    const ctx = contextSel.includes("其他") ? (contextCustom || "未填写") : (contextSel || contextCustom);

    if (!thought) return showToast("请先填写当时的想法～");

    const db = loadDB();
    db.records.push({
      ts: Date.now(),
      context: ctx || "未填写",
      thought,
      evidence,
      emotion,
    });
    touchStreak(db);
    saveDB(db);
    unlockBadgesIfNeeded(db);
    renderTRPreview();
    renderHome();
    showToast("已保存到本地记录");
  });

  function renderTRPreview() {
    const db = loadDB();
    const box = document.getElementById("trPreview");
    if (!db.records.length) {
      box.textContent = "暂无记录，保存后会显示预览。";
      return;
    }
    const r = db.records[db.records.length - 1];
    box.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <span class="text-sm text-gray-500">记录时间</span>
        <span class="text-sm font-medium">${fmtTime(r.ts)}</span>
      </div>
      <div class="mb-2"><span class="text-sm text-gray-500 block mb-1">情境</span><p class="text-sm">${r.context}</p></div>
      <div class="mb-2"><span class="text-sm text-gray-500 block mb-1">当时的想法</span><p class="text-sm">${r.thought || "-"}</p></div>
      <div class="mb-2"><span class="text-sm text-gray-500 block mb-1">证据</span><p class="text-sm">${r.evidence || "-"}</p></div>
      <div><span class="text-sm text-gray-500 block mb-1">情绪强度</span>
        <div class="flex items-center">
          <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
            <div class="h-full bg-red-400 rounded-full" style="width:${r.emotion * 10}%"></div>
          </div>
          <span class="text-sm font-medium">${r.emotion} 分</span>
        </div>
      </div>
    `;
  }

  // 导出 CSV（思维记录）
  document.getElementById("btnExportCSV").addEventListener("click", () => {
    const { records } = loadDB();
    if (!records.length) return showToast("暂无数据可导出");
    const header = ["时间", "情境", "想法", "证据", "情绪强度"];
    const rows = records.map((r) => [fmtTime(r.ts), r.context, r.thought.replace(/\n/g, " "), (r.evidence || "").replace(/\n/g, " "), r.emotion]);
    const csv = [header, ...rows].map((r) => r.map((x) => `"${(x + "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindfit_thought_records.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // 打印为 PDF
  document.getElementById("btnPrint").addEventListener("click", () => {
    const win = window.open("", "_blank");
    const { records } = loadDB();
    win.document.write(`<html><head><title>思维记录打印</title></head><body><h2>思维记录</h2>`);
    if (!records.length) {
      win.document.write("<p>暂无记录</p>");
    } else {
      records.forEach((r) => {
        win.document.write(`<div style="margin:12px 0;padding:12px;border:1px solid #eee">
          <div><b>时间：</b>${fmtTime(r.ts)}</div>
          <div><b>情境：</b>${r.context}</div>
          <div><b>想法：</b>${r.thought.replace(/\n/g, "<br/>")}</div>
          <div><b>证据：</b>${(r.evidence || "").replace(/\n/g, "<br/>")}</div>
          <div><b>情绪强度：</b>${r.emotion} 分</div>
        </div>`);
      });
    }
    win.document.write(`</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  });

  /*****************
   * 情绪练习
   *****************/
  document.querySelectorAll(".complete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".emotion-card");
      const cardId = card?.dataset?.card || "unknown";
      const db = loadDB();
      db.emotions.push({ card: cardId, ts: Date.now() });
      touchStreak(db);
      saveDB(db);
      unlockBadgesIfNeeded(db);
      renderEmotionStats();
      renderHome();

      // 视觉标记
      card.classList.add("opacity-60", "completed");
      const sticker = card.querySelector(".done-sticker");
      if (sticker) sticker.classList.remove("hidden");
      btn.innerHTML = "已完成";
      btn.classList.remove("border-primary", "text-primary", "hover:bg-primary", "hover:text-white");
      btn.classList.add("border-gray-300", "text-gray-500", "bg-gray-100");
      showToast("已标记完成！");
    });
  });

  function calcWeekStats(items) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const cnt = items.filter((x) => new Date(x.ts) >= startOfWeek).length;
    return cnt;
  }

  function renderEmotionStats() {
    const db = loadDB();
    const week = calcWeekStats(db.emotions);
    const total = db.emotions.length;
    document.getElementById("statWeek").textContent = `${Math.min(7, week)}/7`;
    document.getElementById("statTotal").textContent = total;
    document.getElementById("statStreak").textContent = db.streak.count;
    document.getElementById("statBar").style.width = `${Math.min(100, (week / 7) * 100)}%`;
  }

  function renderEmotionRecs() {
    const db = loadDB();
    const list = document.getElementById("emotionRecs");
    const lastTR = db.records.slice(-1)[0];
    const high = lastTR && lastTR.emotion >= 7;
    const recs = high
      ? [
          { title: "立刻试试 4-2-6 呼吸", desc: "2 分钟快速稳定情绪", tag: "应急", img: 21 },
          { title: "情绪命名清单", desc: "给情绪一个名字就会变小", tag: "情绪", img: 22 },
        ]
      : [
          { title: "正念饮食入门", desc: "从一颗葡萄干开始", tag: "正念", img: 23 },
          { title: "身体中立 3 步", desc: "关注功能而非外貌", tag: "理念", img: 24 },
        ];
    list.innerHTML = recs
      .map(
        (r) => `<div class="glass-card rounded-xl overflow-hidden card-shadow flex">
          <img src="https://picsum.photos/120/120?random=${r.img}" class="w-24 h-24 object-cover flex-shrink-0" alt="${r.title}">
          <div class="p-3 flex-grow">
            <h4 class="font-medium text-sm mb-1">${r.title}</h4>
            <p class="text-xs text-gray-500 mb-2 line-clamp-2">${r.desc}</p>
            <span class="badge bg-blue-50 text-primary">${r.tag}</span>
          </div>
        </div>`
      )
      .join("");
  }

  /*****************
   * 行为实验
   *****************/
  document.getElementById("btnSaveBX").addEventListener("click", () => {
    const db = loadDB();
    const item = {
      ts: Date.now(),
      belief: document.getElementById("bxBelief").value.trim(),
      steps: [document.getElementById("bxStep1").value.trim(), document.getElementById("bxStep2").value.trim(), document.getElementById("bxStep3").value.trim()].filter(Boolean),
      predict: document.getElementById("bxPredict").value.trim(),
      actual: document.getElementById("bxActual").value.trim(),
      learn: document.getElementById("bxLearn").value.trim(),
    };
    if (!item.belief) return showToast("请先填写担忧信念");
    db.experiments.push(item);
    touchStreak(db);
    saveDB(db);
    unlockBadgesIfNeeded(db);
    renderBXList();
    showToast("实验已保存");
  });

  function renderBXList() {
    const db = loadDB();
    const box = document.getElementById("bxList");
    if (!db.experiments.length) {
      box.innerHTML = `<div class="text-sm text-gray-500">暂无记录</div>`;
      return;
    }
    box.innerHTML = db.experiments
      .slice(-3)
      .reverse()
      .map(
        (e) => `<div class="glass-card rounded-lg p-4 card-shadow">
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium">实验：${e.belief.slice(0, 16)}${e.belief.length > 16 ? "..." : ""}</h4>
          <span class="text-xs text-gray-500">${fmtTime(e.ts)}</span>
        </div>
        <p class="text-sm text-gray-600 line-clamp-2 mb-2">${e.predict ? "预测：" + e.predict : ""}</p>
        <div class="flex justify-between items-center">
          <span class="badge bg-green-50 text-green-600">已保存</span>
        </div>
      </div>`
      )
      .join("");
  }

  /*****************
   * 冥想/正念
   *****************/
  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playPauseBtn");
  const playIcon = document.getElementById("playPauseIcon");
  const seekBar = document.getElementById("seekBar");
  const vol = document.getElementById("volumeBar");
  const cur = document.getElementById("currentTime");
  const total = document.getElementById("totalTime");

  let timerId = null;

  function updateTimeDisplay(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(Math.floor(sec % 60)).padStart(2, "0");
    return `${m}:${s}`;
  }
