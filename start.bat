@echo off
setlocal EnableExtensions
chcp 65001 >nul

echo ========================================
echo   Запуск браузера Vovanium
echo ========================================
echo.

cd /d "%~dp0"
echo [INFO] Папка проекта: %CD%

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js не найден в PATH.
    echo Установи Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js найден
node --version
call npm.cmd --version
if errorlevel 1 (
    echo [ERROR] npm не найден или работает некорректно.
    echo.
    pause
    exit /b 1
)
echo.

if not exist "node_modules" (
    echo [INFO] Устанавливаем зависимости...
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] npm install завершился с ошибкой.
        echo.
        pause
        exit /b 1
    )
    echo.
)

echo [START] Запуск приложения...
echo.
call npm.cmd start
set "APP_EXIT_CODE=%ERRORLEVEL%"

echo.
if "%APP_EXIT_CODE%"=="0" (
    echo [OK] Браузер закрыт пользователем.
) else (
    echo [ERROR] Приложение завершилось с кодом: %APP_EXIT_CODE%
)
echo.
echo Нажми любую клавишу для выхода...
pause >nul
exit /b %APP_EXIT_CODE%
