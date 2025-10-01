/**
 * MindFit 练习导航管理器
 * 处理所有练习页面的跳转逻辑
 * 版本: 1.0.0
 */

// 练习路由映射
const PRACTICE_ROUTES = {
  // 呼吸练习
  'breathing-4-7-8': 'anxiety_relief.html',
  'breathing-box': 'anxiety_relief.html?type=box-breathing',
  'breathing-alternate': 'anxiety_relief.html?type=alternate',
  
  // 身体觉察
  'body-scan': 'anxiety_relief.html?type=body-scan',
  'progressive-relaxation': 'anxiety_relief.html?type=muscle-relaxation',
  'muscle-relaxation': 'anxiety_relief.html?type=muscle-relaxation',
  
  // 正念练习
  'mindful-eating': 'mindful_eating.html',
  'mindful-breathing': 'anxiety_relief.html?type=mindful',
  'grounding-5-4-3-2-1': 'anxiety_relief.html?type=grounding',
  'grounding': 'anxiety_relief.html?type=grounding',
  
  // 情绪调节
  'emotion-regulation': 'anxiety_relief.html?type=emotion',
  'gratitude-practice': 'anxiety_relief.html?type=gratitude',
  'self-compassion': 'anxiety_relief.html?type=self-compassion'
};

/**
 * 开始练习 - 基础版本
 * @param {string} practiceId - 练习ID
 */
function startPractice(practiceId) {
  console.log('🎯 开始练习:', practiceId);
  
  const route = PRACTICE_ROUTES[practiceId];
  
  if (route) {
    // 记录练习开始
    recordPracticeStart(practiceId);
    
    // 显示提示
    if (typeof showToast === 'function') {
      showToast('正在打开练习页面...');
    }
    
    // 跳转
    setTimeout(() => {
      window.location.href = route;
    }, 300);
  } else {
    console.warn('⚠️ 未找到练习路由:', practiceId);
    if (typeof showToast === 'function') {
      showToast('抱歉，该练习功能正在开发中...');
    } else {
      alert('抱歉，该练习功能正在开发中...');
    }
  }
}

/**
 * 记录练习开始
 * @param {string} practiceId - 练习ID
 */
function recordPracticeStart(practiceId) {
  try {
    // 从全局练习数据中查找
    if (typeof practiceData !== 'undefined') {
      const practice = practiceData.find(p => p.id === practiceId);
      if (practice) {
        sessionStorage.setItem('currentPractice', JSON.stringify({
          id: practiceId,
          title: practice.title,
          startTime: new Date().toISOString(),
          category: practice.category
        }));
      }
    }
  } catch (error) {
    console.error('记录练习开始失败:', error);
  }
}

/**
 * 安全版本 - 带确认检查
 * @param {string} practiceId - 练习ID
 */
function startPracticeSafe(practiceId) {
  try {
    // 检查是否有未完成的练习
    const currentPractice = sessionStorage.getItem('currentPractice');
    if (currentPractice) {
      const practice = JSON.parse(currentPractice);
      const continueText = `你有一个未完成的练习：${practice.title}，是否继续？`;
      
      if (confirm(continueText)) {
        const route = PRACTICE_ROUTES[practice.id];
        if (route) {
          window.location.href = route;
          return;
        }
      } else {
        sessionStorage.removeItem('currentPractice');
      }
    }
    
    // 开始新练习
    startPractice(practiceId);
    
  } catch (error) {
    console.error('启动练习失败:', error);
    if (typeof showToast === 'function') {
      showToast('启动练习时出现错误，请稍后重试');
    }
  }
}

/**
 * 获取练习路由
 * @param {string} practiceId - 练习ID
 * @returns {string|null} 路由URL
 */
function getPracticeRoute(practiceId) {
  return PRACTICE_ROUTES[practiceId] || null;
}

/**
 * 追踪练习导航
 * @param {string} practiceId - 练习ID
 * @param {string} source - 来源页面
 */
function trackPracticeNavigation(practiceId, source = 'practice_list') {
  try {
    const tracking = JSON.parse(sessionStorage.getItem('practiceTracking') || '[]');
    
    tracking.push({
      practiceId,
      source,
      timestamp: Date.now(),
      url: window.location.href
    });
    
    // 只保留最近50条记录
    if (tracking.length > 50) {
      tracking.shift();
    }
    
    sessionStorage.setItem('practiceTracking', JSON.stringify(tracking));
  } catch (error) {
    console.error('追踪失败:', error);
  }
}

/**
 * 完成练习时调用
 * @param {Object} completionData - 完成数据
 */
function completePractice(completionData) {
  try {
    const currentPractice = sessionStorage.getItem('currentPractice');
    if (currentPractice) {
      const practice = JSON.parse(currentPractice);
      
      // 计算时长
      const startTime = new Date(practice.startTime);
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000 / 60); // 分钟
      
      // 保存到数据管理器
      if (typeof dataManager !== 'undefined') {
        dataManager.addPracticeRecord({
          id: practice.id,
          title: practice.title,
          category: practice.category,
          duration: completionData?.duration || duration,
          notes: completionData?.notes || '',
          date: endTime.toISOString()
        });
      }
      
      // 清除当前练习
      sessionStorage.removeItem('currentPractice');
      
      console.log('✅ 练习完成:', practice.title);
    }
  } catch (error) {
    console.error('完成练习记录失败:', error);
  }
}

/**
 * 处理练习页面URL参数
 * 在目标练习页面调用此函数
 */
function handlePracticePageLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  
  if (type) {
    console.log('📍 练习类型:', type);
    return type;
  }
  
  return null;
}

/**
 * 快速启动练习（带推荐逻辑）
 * @param {string} practiceId - 练习ID
 */
function quickStartPractice(practiceId) {
  // 检查用户状态
  const userState = checkUserReadiness();
  
  if (userState.needsWarning) {
    if (confirm(userState.warning + '\n\n确定要继续吗？')) {
      startPractice(practiceId);
    }
  } else {
    startPractice(practiceId);
  }
}

/**
 * 检查用户准备状态
 * @returns {Object} 状态信息
 */
function checkUserReadiness() {
  try {
    // 获取今天的练习时长
    const practices = (typeof dataManager !== 'undefined') 
      ? dataManager.get('practiceHistory', [])
      : [];
    
    const today = new Date().toDateString();
    const todayPractices = practices.filter(p => 
      new Date(p.timestamp || p.date).toDateString() === today
    );
    
    const todayMinutes = todayPractices.reduce((sum, p) => 
      sum + (p.duration || 0), 0
    );
    
    // 如果今天已经练习超过30分钟
    if (todayMinutes > 30) {
      return {
        needsWarning: true,
        warning: '今天已经练习了30分钟，适度休息很重要'
      };
    }
    
    // 检查最后一次练习时间
    if (todayPractices.length > 0) {
      const lastPractice = todayPractices[todayPractices.length - 1];
      const lastTime = new Date(lastPractice.timestamp || lastPractice.date);
      const now = new Date();
      const minutesSince = Math.floor((now - lastTime) / 1000 / 60);
      
      if (minutesSince < 5) {
        return {
          needsWarning: true,
          warning: '刚刚完成练习，建议休息一下再继续'
        };
      }
    }
    
    return { needsWarning: false };
  } catch (error) {
    console.error('检查用户状态失败:', error);
    return { needsWarning: false };
  }
}

// ============================================
// 暴露到全局
// ============================================
window.PracticeNavigation = {
  start: startPractice,
  startSafe: startPracticeSafe,
  quickStart: quickStartPractice,
  getRoute: getPracticeRoute,
  track: trackPracticeNavigation,
  complete: completePractice,
  handlePageLoad: handlePracticePageLoad,
  routes: PRACTICE_ROUTES
};

console.log('🎯 练习导航管理器已加载');
console.log('可用练习数量:', Object.keys(PRACTICE_ROUTES).length);
