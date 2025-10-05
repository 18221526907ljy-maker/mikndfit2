@echo off
chcp 65001 >nul
echo ========================================
echo    MindFit 项目结构创建工具
echo ========================================
echo.

REM 检查是否在Git仓库中
if not exist ".git" (
    echo [错误] 请在MindFit项目根目录运行此脚本！
    echo.
    echo 使用方法：
    echo 1. 克隆仓库: git clone https://github.com/你的用户名/MindFit.git
    echo 2. 进入目录: cd MindFit
    echo 3. 运行脚本: create-structure.bat
    pause
    exit /b 1
)

echo [步骤 1/4] 创建CSS文件夹...
mkdir css\base 2>nul
mkdir css\components 2>nul
mkdir css\layouts 2>nul
mkdir css\pages 2>nul
mkdir css\animations 2>nul
echo ✓ CSS文件夹创建完成

echo.
echo [步骤 2/4] 创建JavaScript文件夹...
mkdir js\core 2>nul
mkdir js\utils 2>nul
mkdir js\components 2>nul
mkdir js\modules 2>nul
mkdir js\modules\practice 2>nul
mkdir js\modules\assessment 2>nul
mkdir js\modules\cbt 2>nul
mkdir js\modules\user 2>nul
echo ✓ JavaScript文件夹创建完成

echo.
echo [步骤 3/4] 创建其他文件夹...
mkdir assets\images 2>nul
mkdir assets\fonts 2>nul
mkdir assets\audio 2>nul
mkdir pages\assessment 2>nul
mkdir pages\practice 2>nul
mkdir pages\tools 2>nul
mkdir pages\records 2>nul
mkdir pages\theory 2>nul
mkdir pages\user 2>nul
mkdir data 2>nul
mkdir docs 2>nul
echo ✓ 其他文件夹创建完成

echo.
echo [步骤 4/4] 创建占位文件和README...

REM 创建CSS目录的README
echo # CSS 样式文件 > css\README.md
echo # CSS基础样式（变量、重置、排版） > css\base\README.md
echo # CSS组件样式（按钮、卡片、表单等） > css\components\README.md
echo # CSS布局样式（导航、页脚、网格） > css\layouts\README.md
echo # 页面特定样式 > css\pages\README.md
echo # CSS动画效果 > css\animations\README.md

REM 创建JS目录的README
echo # JavaScript 模块 > js\README.md
echo # 核心功能（配置、存储、路由） > js\core\README.md
echo # 工具函数（日期、验证、辅助） > js\utils\README.md
echo # UI组件（导航、弹窗、提示） > js\components\README.md
echo # 业务模块 > js\modules\README.md
echo # 练习相关模块 > js\modules\practice\README.md
echo # 测评相关模块 > js\modules\assessment\README.md
echo # CBT工具模块 > js\modules\cbt\README.md
echo # 用户相关模块 > js\modules\user\README.md

REM 创建其他目录的README
echo # 静态资源 > assets\README.md
echo # 图片资源 > assets\images\README.md
echo # 字体文件 > assets\fonts\README.md
echo # 音频文件（引导语音等） > assets\audio\README.md
echo # HTML页面 > pages\README.md
echo # 测评页面 > pages\assessment\README.md
echo # 练习页面 > pages\practice\README.md
echo # CBT工具页面 > pages\tools\README.md
echo # 记录页面 > pages\records\README.md
echo # 理论知识页面 > pages\theory\README.md
echo # 用户中心页面 > pages\user\README.md
echo # JSON数据文件 > data\README.md
echo # 项目文档 > docs\README.md

echo ✓ README文件创建完成

echo.
echo ========================================
echo    文件夹结构创建完成！
echo ========================================
echo.
echo 📁 已创建的文件夹：
echo    ├── css/ (5个子文件夹)
echo    ├── js/ (8个子文件夹)
echo    ├── assets/ (3个子文件夹)
echo    ├── pages/ (6个子文件夹)
echo    ├── data/
echo    └── docs/
echo.
echo 📄 已创建 23 个 README.md 文件
echo.
echo ========================================
echo    下一步操作：
echo ========================================
echo.
echo 1️⃣  查看创建的结构：
echo    dir /s
echo.
echo 2️⃣  提交到GitHub：
echo    git add .
echo    git commit -m "创建项目文件夹结构"
echo    git push origin main
echo.
echo 3️⃣  开始添加文件：
echo    现在可以开始在对应文件夹中添加CSS和JS文件了
echo.
echo ========================================

pause
