@echo off
chcp 65001 >nul
echo ========================================
echo   Запуск браузера Vovanium
echo ========================================
echo.

REM Переходим в директорию скрипта
cd /d "%~dp0"

REM Добавляем Node.js в PATH если нужно
set "PATH=%PATH%;C:\Program Files\nodejs\"
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\nodejs\"

REM Проверяем наличие Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Node.js не найден в PATH!
    echo.
    echo Пожалуйста:
    echo 1. Установите Node.js с https://nodejs.org/
    echo 2. Перезапустите командную строку
    echo.
    echo Проверяем стандартные пути...
    if exist "C:\Program Files\nodejs\node.exe" (
        echo [OK] Node.js найден в: C:\Program Files\nodejs\
        set "PATH=%PATH%;C:\Program Files\nodejs\"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        echo [OK] Node.js найден в: %LOCALAPPDATA%\Programs\nodejs\
        set "PATH=%PATH%;%LOCALAPPDATA%\Programs\nodejs\"
    ) else (
        echo [ОШИБКА] Node.js не установлен!
        echo.
        echo Установите Node.js с https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Node.js найден
node --version
npm --version
echo.

REM Проверяем наличие node_modules
if not exist "node_modules" (
    echo [УСТАНОВКА] Устанавливаем зависимости...
    echo Это может занять несколько минут...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ОШИБКА] Не удалось установить зависимости!
        echo Проверьте подключение к интернету и попробуйте снова.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Зависимости установлены!
    echo.
)

echo [ЗАПУСК] Запускаем браузер Vovanium...
echo Если появится окно браузера - все работает!
echo Для выхода закройте окно браузера или нажмите Ctrl+C здесь.
echo.
echo ========================================
echo.

REM Запускаем приложение
call npm start

REM Если дошли сюда, значит приложение завершилось
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo [ОШИБКА] Браузер завершился с ошибкой!
    echo Код ошибки: %ERRORLEVEL%
    echo ========================================
    echo.
    echo Возможные причины:
    echo 1. Ошибка в коде приложения
    echo 2. Отсутствуют необходимые файлы
    echo 3. Проблема с Electron
    echo.
    echo Проверьте сообщения об ошибках выше.
    echo.
) else (
    echo.
    echo [OK] Браузер закрыт пользователем.
    echo.
)

echo Нажмите любую клавишу для выхода...
pause >nul
