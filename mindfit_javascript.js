/*****************
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
  const pad = (n) => (n 