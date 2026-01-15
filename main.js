const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение промиса:', reason);
});

let mainWindow;

function createWindow() {
  try {
    // Создаем главное окно браузера
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      title: 'Vovanium',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webviewTag: true  // Включаем поддержку webview
      }
    });

    // Загружаем интерфейс браузера
    mainWindow.loadFile('index.html').catch((error) => {
      console.error('Ошибка загрузки index.html:', error);
    });

    // Открываем DevTools только в режиме разработки
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Логируем ошибки рендерера
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Ошибка загрузки:', errorCode, errorDescription, validatedURL);
    });

    mainWindow.webContents.on('crashed', (event, killed) => {
      console.error('Процесс рендерера упал:', killed);
    });
  } catch (error) {
    console.error('Ошибка создания окна:', error);
  }
}

// Создаем меню приложения
function createMenu() {
  const template = [
    {
      label: 'Vovanium',
      submenu: [
        {
          label: 'О Vovanium',
          click: () => {
            // Можно добавить информацию о приложении
          }
        }
      ]
    },
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Новая вкладка',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('new-tab');
          }
        },
        {
          label: 'Закрыть вкладку',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.webContents.send('close-tab');
          }
        },
        { type: 'separator' },
        {
          label: 'Выход',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Навигация',
      submenu: [
        {
          label: 'Назад',
          accelerator: 'Alt+Left',
          click: () => {
            mainWindow.webContents.send('navigate-back');
          }
        },
        {
          label: 'Вперед',
          accelerator: 'Alt+Right',
          click: () => {
            mainWindow.webContents.send('navigate-forward');
          }
        },
        {
          label: 'Обновить',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('reload');
          }
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        {
          label: 'Полный экран',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработка навигации
ipcMain.on('navigate', (event, url) => {
  // Отправляем URL в рендерер для обработки
  event.sender.send('navigate-to', url);
});
