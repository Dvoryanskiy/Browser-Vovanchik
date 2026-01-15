@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск браузера на основе Chromium
echo ========================================
echo.

REM Добавляем Node.js в PATH для текущей сессии
set "PATH=%PATH%;C:\Program Files\nodejs\"
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\nodejs\"

REM Проверка наличия Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Node.js не найден в PATH!
    echo.
    echo Попробуйте:
    echo 1. Перезапустить PowerShell/командную строку
    echo 2. Или добавить Node.js в PATH вручную
    echo    (Обычно: C:\Program Files\nodejs\)
    echo.
    echo Проверка стандартных путей...
    if exist "C:\Program Files\nodejs\node.exe" (
        echo [OK] Node.js найден в: C:\Program Files\nodejs\
        set "PATH=%PATH%;C:\Program Files\nodejs\"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        echo [OK] Node.js найден в: %LOCALAPPDATA%\Programs\nodejs\
        set "PATH=%PATH%;%LOCALAPPDATA%\Programs\nodejs\"
    ) else (
        echo [ОШИБКА] Node.js не установлен!
        echo.
        echo Установите Node.js с сайта: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

REM Проверка версий
echo [OK] Node.js найден
node --version
npm --version
echo.

REM Переход в директорию проекта
cd /d "%~dp0"

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo [ИНФО] Установка зависимостей...
    echo Это может занять несколько минут при первом запуске.
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ОШИБКА] Не удалось установить зависимости!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Зависимости установлены!
    echo.
)

echo [ИНФО] Запуск браузера...
echo.
call npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ОШИБКА] Не удалось запустить браузер!
    echo Проверьте сообщения об ошибках выше.
    echo.
    pause
    exit /b 1
)

pause
