# Vovanium

Браузер на **Electron** (Chromium): вкладки, навигация, поиск из адресной строки и встроенный **AI-ассистент** (OpenAI-совместимый API: DeepSeek и др.).

## Быстрый старт

```bash
npm install
npm start
```

Режим с DevTools:

```bash
npm run dev
```

## Документация

**[DOCUMENTATION.md](DOCUMENTATION.md)** — подробное руководство: архитектура, файлы, AI, IPC, безопасность, типичные проблемы.

## Структура (кратко)

| Файл | Роль |
|------|------|
| `main.js` | Главный процесс Electron, окно, меню |
| `preload.js` | Безопасный API `window.electronAPI` |
| `index.html` | Разметка UI |
| `styles.css` | Стили |
| `app.js` | Логика вкладок, webview, AI |

## Лицензия

MIT (см. `package.json`).
