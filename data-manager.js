/**
 * MindFit 数据管理器
 * 统一管理所有数据存储，兼容 localStorage 和内存模式
 * 版本: 1.0.0
 */

class MindFitDataManager {
  constructor() {
    this.isLocalStorage = this.checkLocalStorageAvailable();
    
    // 内存存储
    this.memoryStore = {
      practiceHistory: [],
      assessments: [],
      bmiAssessments: [],
      bodyAnxietyAssessments: [],
      mindfulEatingRecords: [],
      userProfile: {},
      settings: {
        theme: 'light',
        notifications: true,
        soundEnabled: true
      }
    };
    
    this.init();
  }
  
  // 检测 localStorage 是否可用
  checkLocalStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('⚠️ localStorage 不可用，使用内存存储模式');
      return false;
    }
  }
  
  // 初始化
  init() {
    if (this.isLocalStorage) {
      this.loadFromLocalStorage();
    } else {
      this.loadFromSessionStorage();
    }
    
    this.showEnvironmentInfo();
  }
  
  // 从 localStorage 加载
  loadFromLocalStorage() {
    try {
      Object.keys(this.memoryStore).forEach(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          this.memoryStore[key] = JSON.parse(stored);
        }
      });
      console.log('✅ 数据已从 localStorage 加载');
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }
  
  // 从 sessionStorage 加载
  loadFromSessionStorage() {
    try {
      const sessionData = sessionStorage.getItem('mindfit_session_data');
      if (sessionData) {
        const data = JSON.parse(sessionData);
        Object.assign(this.memoryStore, data);
        console.log('✅ 数据已从会话存储恢复');
      }
    } catch (error) {
      console.error('恢复会话数据失败:', error);
    }
  }
  
  // 保存到 sessionStorage
  saveToSessionStorage() {
    try {
      sessionStorage.setItem(
        'mindfit_session_data', 
        JSON.stringify(this.memoryStore)
      );
    } catch (error) {
      console.error('保存到会话存储失败:', error);
    }
  }
  
  // 显示环境信息
  showEnvironmentInfo() {
    if (!this.isLocalStorage) {
      const notice = document.createElement('div');
      notice.className = 'fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm z-50';
      notice.innerHTML = `
        <span class="text-yellow-800">
          💡 当前在演示模式下运行，数据仅保存在本次会话中。
          <button onclick="dataManager.exportData()" class="ml-2 text-blue-600 underline">导出数据</button>
        </span>
      `;
      document.body.insertBefore(notice, document.body.firstChild);
      
      setTimeout(() => {
        notice.style.transition = 'opacity 0.5s';
        notice.style.opacity = '0';
        setTimeout(() => notice.remove(), 500);
      }, 10000);
    }
  }
  
  // ===============================
  // 核心 CRUD 操作
  // ===============================
  
  save(key, value) {
    this.memoryStore[key] = value;
    
    if (this.isLocalStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('保存到 localStorage 失败:', error);
      }
    }
    
    this.saveToSessionStorage();
    return true;
  }
  
  get(key, defaultValue = null) {
    return this.memoryStore[key] ?? defaultValue;
  }
  
  remove(key) {
    delete this.memoryStore[key];
    
    if (this.isLocalStorage) {
      localStorage.removeItem(key);
    }
    
    this.saveToSessionStorage();
  }
  
  clear() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      this.memoryStore = {
        practiceHistory: [],
        assessments: [],
        bmiAssessments: [],
        bodyAnxietyAssessments: [],
        mindfulEatingRecords: [],
        userProfile: {},
        settings: {}
      };
      
      if (this.isLocalStorage) {
        localStorage.clear();
      }
      
      sessionStorage.removeItem('mindfit_session_data');
      
      alert('所有数据已清空');
      window.location.reload();
    }
  }
  
  // ===============================
  // 业务方法
  // ===============================
  
  addPracticeRecord(record) {
    const history = this.get('practiceHistory', []);
    history.push({
      id: Date.now(),
      ...record,
      timestamp: new Date().toISOString()
    });
    this.save('practiceHistory', history);
  }
  
  addAssessment(type, result) {
    const key = type === 'bmi' ? 'bmiAssessments' : 
                type === 'anxiety' ? 'bodyAnxietyAssessments' : 
                'assessments';
    
    const assessments = this.get(key, []);
    assessments.push({
      id: Date.now(),
      ...result,
      timestamp: new Date().toISOString()
    });
    this.save(key, assessments);
  }
  
  getStats() {
    const practices = this.get('practiceHistory', []);
    const assessments = this.get('bodyAnxietyAssessments', []);
    
    return {
      totalPractices: practices.length,
      totalMinutes: practices.reduce((sum, p) => sum + (p.duration || 0), 0),
      assessmentsCount: assessments.length,
      lastPractice: practices[practices.length - 1],
      lastAssessment: assessments[assessments.length - 1]
    };
  }
  
  // ===============================
  // 数据导出/导入
  // ===============================
  
  exportData() {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: this.memoryStore
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindfit-data-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    alert('数据已导出！请妥善保存文件。');
  }
  
  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          
          if (imported.version && imported.data) {
            Object.keys(imported.data).forEach(key => {
              if (Array.isArray(imported.data[key])) {
                const existing = this.get(key, []);
                const merged = [...existing, ...imported.data[key]];
                const unique = Array.from(
                  new Map(merged.map(item => [item.id, item])).values()
                );
                this.save(key, unique);
              } else {
                this.save(key, imported.data[key]);
              }
            });
            
            alert('数据导入成功！');
            window.location.reload();
          } else {
            throw new Error('数据格式不正确');
          }
        } catch (error) {
          alert('导入失败：' + error.message);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }
  
  exportToCSV() {
    const practices = this.get('practiceHistory', []);
    
    if (practices.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const headers = ['日期', '练习名称', '分类', '时长(分钟)', '备注'];
    
    const rows = practices.map(p => {
      const date = new Date(p.timestamp || p.date);
      return [
        date.toLocaleDateString('zh-CN'),
        p.title || '',
        p.category || '',
        p.duration || 0,
        p.notes || ''
      ].map(cell => `"${cell}"`).join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindfit-practices-${Date.now()}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

// ============================================
// 全局实例
// ============================================
const dataManager = new MindFitDataManager();
window.dataManager = dataManager;

// ============================================
// 页面卸载时自动备份
// ============================================
window.addEventListener('beforeunload', () => {
  dataManager.saveToSessionStorage();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    dataManager.saveToSessionStorage();
  }
});

// ============================================
// 兼容旧代码的适配层
// ============================================
if (!dataManager.isLocalStorage) {
  const mockLocalStorage = {
    getItem(key) {
      const value = dataManager.get(key);
      return value !== null ? JSON.stringify(value) : null;
    },
    
    setItem(key, value) {
      try {
        dataManager.save(key, JSON.parse(value));
      } catch {
        dataManager.save(key, value);
      }
    },
    
    removeItem(key) {
      dataManager.remove(key);
    },
    
    clear() {
      dataManager.clear();
    },
    
    key(index) {
      return Object.keys(dataManager.memoryStore)[index];
    },
    
    get length() {
      return Object.keys(dataManager.memoryStore).length;
    }
  };
  
  window.storage = mockLocalStorage;
  console.log('💡 使用 window.storage 替代 localStorage');
}

console.log(`
╔══════════════════════════════════════════╗
║   MindFit 数据管理器已初始化            ║
╠══════════════════════════════════════════╣
║ 存储模式: ${dataManager.isLocalStorage ? 'localStorage' : '内存模式'}          ║
║ 可用方法:                                ║
║   • dataManager.save(key, value)         ║
║   • dataManager.get(key, default)        ║
║   • dataManager.exportData()             ║
║   • dataManager.importData()             ║
║   • dataManager.exportToCSV()            ║
╚══════════════════════════════════════════╝
`);
