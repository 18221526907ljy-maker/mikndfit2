@echo off
echo ��ʼ����MindFit��Ŀ�ļ�...
echo.
mkdir css\base
mkdir css\components
mkdir js\core
mkdir js\utils
echo :root { --primary: #4A6157; } > css\base\variables.css
echo * { margin: 0; padding: 0; } > css\base\reset.css
echo .btn { padding: 0.5rem 1rem; } > css\components\buttons.css
echo .card { background: white; } > css\components\cards.css
echo export const CONFIG = { APP_NAME: 'MindFit' }; > js\core\config.js
echo export class Storage { } > js\core\storage.js
echo export function formatDate() { } > js\utils\helpers.js
echo # CSS��ʽ > css\README.md
echo # JavaScriptģ�� > js\README.md
echo.
echo ������ɣ�
pause
