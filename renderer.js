// Управление вкладками
let tabs = [];
let activeTabId = 0;

// AI Ассистент "Вованчик"
let assistantOpen = false;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация браузера...');
    initializeBrowser();
    setupEventListeners();
    setupElectronListeners();
    initializeAssistant();
    
    // Тест: проверяем наличие всех элементов ассистента
    setTimeout(() => {
        const assistantBtn = document.getElementById('assistantBtn');
        const assistantPanel = document.getElementById('assistantPanel');
        console.log('Проверка элементов после инициализации:');
        console.log('- Кнопка ассистента:', assistantBtn ? 'найдена' : 'НЕ НАЙДЕНА');
        console.log('- Панель ассистента:', assistantPanel ? 'найдена' : 'НЕ НАЙДЕНА');
        if (assistantPanel) {
            console.log('- Стиль панели:', window.getComputedStyle(assistantPanel).right);
        }
    }, 500);
});

function initializeBrowser() {
    // Создаем первую вкладку
    createNewTab('about:blank', 'Новая вкладка');
}

function setupEventListeners() {
    // Кнопки навигации
    document.getElementById('backBtn').addEventListener('click', () => {
        navigateBack();
    });

    document.getElementById('forwardBtn').addEventListener('click', () => {
        navigateForward();
    });

    document.getElementById('reloadBtn').addEventListener('click', () => {
        reloadCurrentTab();
    });

    // Адресная строка
    const addressBar = document.getElementById('addressBar');
    addressBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            navigateToAddress(addressBar.value);
        }
    });

    document.getElementById('goBtn').addEventListener('click', () => {
        navigateToAddress(addressBar.value);
    });

    // Новая вкладка
    document.getElementById('newTabBtn').addEventListener('click', () => {
        createNewTab('about:blank', 'Новая вкладка');
    });

    // AI Ассистент
    const assistantBtn = document.getElementById('assistantBtn');
    if (assistantBtn) {
        assistantBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Кнопка ассистента нажата из setupEventListeners');
            toggleAssistant();
        });
        console.log('Кнопка ассистента найдена и обработчик добавлен в setupEventListeners');
    } else {
        console.error('Кнопка ассистента НЕ найдена в setupEventListeners!');
    }
}

function setupElectronListeners() {
    if (window.electronAPI) {
        window.electronAPI.onNewTab(() => {
            createNewTab('about:blank', 'Новая вкладка');
        });

        window.electronAPI.onCloseTab(() => {
            closeCurrentTab();
        });

        window.electronAPI.onNavigateBack(() => {
            navigateBack();
        });

        window.electronAPI.onNavigateForward(() => {
            navigateForward();
        });

        window.electronAPI.onReload(() => {
            reloadCurrentTab();
        });

        window.electronAPI.onNavigate((url) => {
            navigateToAddress(url);
        });
    }
}

function createNewTab(url, title) {
    const tabId = tabs.length;
    const tab = {
        id: tabId,
        url: url,
        title: title,
        webview: null
    };

    tabs.push(tab);

    // Создаем элемент вкладки
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.dataset.tabId = tabId;
    tabElement.innerHTML = `
        <span class="tab-title">${title}</span>
        <button class="tab-close">×</button>
    `;

    // Обработчик клика на вкладку
    tabElement.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
            switchToTab(tabId);
        }
    });

    // Обработчик закрытия вкладки
    tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tabId);
    });

    document.getElementById('tabsContainer').appendChild(tabElement);

    // Создаем webview
    const webview = document.createElement('webview');
    webview.id = `webview-${tabId}`;
    webview.src = url;
    webview.style.display = tabId === activeTabId ? 'block' : 'none';
    webview.allowpopups = true;

    // Обработчики событий webview
    webview.addEventListener('did-start-loading', () => {
        updateTabTitle(tabId, 'Загрузка...');
    });

    webview.addEventListener('did-stop-loading', () => {
        const title = webview.getTitle();
        updateTabTitle(tabId, title || 'Новая вкладка');
        updateAddressBar(webview.getURL());
        updateNavigationButtons();
    });

    webview.addEventListener('page-title-updated', (e) => {
        updateTabTitle(tabId, e.title);
    });

    webview.addEventListener('did-navigate', (e) => {
        updateAddressBar(e.url);
        tab.url = e.url;
    });

    webview.addEventListener('did-navigate-in-page', (e) => {
        updateAddressBar(e.url);
        tab.url = e.url;
    });

    document.querySelector('.content-container').appendChild(webview);
    tab.webview = webview;

    switchToTab(tabId);
}

function switchToTab(tabId) {
    activeTabId = tabId;

    // Обновляем визуальное состояние вкладок
    document.querySelectorAll('.tab').forEach((tabEl) => {
        const elTabId = parseInt(tabEl.dataset.tabId);
        if (elTabId === tabId) {
            tabEl.classList.add('active');
        } else {
            tabEl.classList.remove('active');
        }
    });

    // Показываем/скрываем webview
    tabs.forEach((tab, index) => {
        if (tab.webview) {
            tab.webview.style.display = index === tabId ? 'block' : 'none';
        }
    });

    // Обновляем адресную строку и кнопки навигации
    const activeTab = tabs[tabId];
    if (activeTab && activeTab.webview) {
        const url = activeTab.webview.getURL();
        if (url && url !== 'about:blank') {
            updateAddressBar(url);
        }
        updateNavigationButtons();
    }
}

function closeTab(tabId) {
    if (tabs.length <= 1) {
        // Не закрываем последнюю вкладку
        return;
    }

    // Удаляем webview
    const tab = tabs[tabId];
    if (tab && tab.webview) {
        tab.webview.remove();
    }

    // Удаляем элемент вкладки
    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
        tabElement.remove();
    }

    // Удаляем из массива
    tabs.splice(tabId, 1);

    // Обновляем ID вкладок
    tabs.forEach((tab, index) => {
        tab.id = index;
        const tabEl = document.querySelector(`[data-tab-id="${index}"]`);
        if (tabEl) {
            tabEl.dataset.tabId = index;
        }
        if (tab.webview) {
            tab.webview.id = `webview-${index}`;
        }
    });

    // Переключаемся на другую вкладку
    if (activeTabId >= tabs.length) {
        activeTabId = tabs.length - 1;
    }
    switchToTab(activeTabId);
}

function closeCurrentTab() {
    closeTab(activeTabId);
}

function navigateToAddress(address) {
    if (!address) return;

    let url = address.trim();

    // Проверяем, является ли это URL
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
        // Если нет, используем поиск Google
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }

    const activeTab = tabs[activeTabId];
    if (activeTab && activeTab.webview) {
        activeTab.webview.src = url;
    }
}

function navigateBack() {
    const activeTab = tabs[activeTabId];
    if (activeTab && activeTab.webview) {
        activeTab.webview.goBack();
    }
}

function navigateForward() {
    const activeTab = tabs[activeTabId];
    if (activeTab && activeTab.webview) {
        activeTab.webview.goForward();
    }
}

function reloadCurrentTab() {
    const activeTab = tabs[activeTabId];
    if (activeTab && activeTab.webview) {
        activeTab.webview.reload();
    }
}

function updateAddressBar(url) {
    const addressBar = document.getElementById('addressBar');
    if (addressBar && url) {
        addressBar.value = url;
    }
}

function updateTabTitle(tabId, title) {
    const tab = tabs[tabId];
    if (tab) {
        tab.title = title;
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"] .tab-title`);
        if (tabElement) {
            tabElement.textContent = title;
        }
    }
}

function updateNavigationButtons() {
    const activeTab = tabs[activeTabId];
    if (activeTab && activeTab.webview) {
        const webview = activeTab.webview;
        document.getElementById('backBtn').disabled = !webview.canGoBack();
        document.getElementById('forwardBtn').disabled = !webview.canGoForward();
    }
}

// ==================== AI Ассистент "Вованчик" ====================

function initializeAssistant() {
    console.log('Инициализация ассистента...');
    
    const assistantPanel = document.getElementById('assistantPanel');
    const closeBtn = document.getElementById('closeAssistantBtn');
    const input = document.getElementById('assistantInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    const assistantBtn = document.getElementById('assistantBtn');

    console.log('Элементы:', {
        assistantPanel: !!assistantPanel,
        closeBtn: !!closeBtn,
        input: !!input,
        sendBtn: !!sendBtn,
        assistantBtn: !!assistantBtn
    });

    if (!assistantPanel) {
        console.error('Панель ассистента не найдена!');
        return;
    }
    
    if (!closeBtn) {
        console.error('Кнопка закрытия не найдена!');
        return;
    }
    
    if (!input) {
        console.error('Поле ввода не найдено!');
        return;
    }
    
    if (!sendBtn) {
        console.error('Кнопка отправки не найдена!');
        return;
    }

    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Кнопка закрытия нажата');
        toggleAssistant();
    });

    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Кнопка отправки нажата');
        sendMessage();
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    // Убедимся, что кнопка ассистента имеет обработчик
    if (assistantBtn) {
        assistantBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Кнопка ассистента нажата из initializeAssistant');
            toggleAssistant();
        });
    }

    console.log('Ассистент инициализирован успешно');
}

function toggleAssistant() {
    assistantOpen = !assistantOpen;
    const panel = document.getElementById('assistantPanel');
    
    if (!panel) {
        console.error('Панель ассистента не найдена в toggleAssistant');
        return;
    }
    
    console.log('Переключение панели ассистента:', assistantOpen);
    console.log('Текущие классы панели:', panel.className);
    
    if (assistantOpen) {
        panel.classList.add('open');
        panel.style.display = 'flex'; // Добавляем на всякий случай
        console.log('Панель открыта. Новые классы:', panel.className);
        
        const input = document.getElementById('assistantInput');
        if (input) {
            setTimeout(() => {
                input.focus();
                console.log('Фокус установлен на поле ввода');
            }, 300);
        }
    } else {
        panel.classList.remove('open');
        console.log('Панель закрыта. Новые классы:', panel.className);
    }
}

function sendMessage() {
    console.log('sendMessage вызвана');
    
    const input = document.getElementById('assistantInput');
    if (!input) {
        console.error('Поле ввода ассистента не найдено в sendMessage');
        return;
    }
    
    const message = input.value.trim();
    console.log('Введенное сообщение:', message);
    
    if (!message) {
        console.log('Сообщение пустое, выход');
        return;
    }

    // Добавляем сообщение пользователя
    console.log('Добавление сообщения пользователя');
    addMessage(message, 'user');
    input.value = '';

    // Показываем индикатор печати
    console.log('Показ индикатора печати');
    showTypingIndicator();

    // Генерируем ответ с небольшой задержкой для реалистичности
    const delay = 1000 + Math.random() * 1000;
    console.log('Задержка перед ответом:', delay, 'мс');
    
    setTimeout(() => {
        console.log('Генерация ответа');
        hideTypingIndicator();
        const response = generateResponse(message);
        console.log('Сгенерированный ответ:', response);
        addMessage(response, 'assistant');
    }, delay);
}

function addMessage(text, type) {
    console.log('addMessage вызвана:', { text: text.substring(0, 50), type });
    
    const messagesContainer = document.getElementById('assistantMessages');
    if (!messagesContainer) {
        console.error('Контейнер сообщений ассистента не найден');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
            <div class="message-avatar">👤</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">${escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    console.log('Сообщение добавлено в контейнер');
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('assistantMessages');
    if (!messagesContainer) {
        console.error('Контейнер сообщений ассистента не найден');
        return;
    }
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Приветствия
    if (message.includes('привет') || message.includes('здравствуй') || message.includes('добр')) {
        return 'Привет! Рад тебя видеть! Чем могу помочь?';
    }

    // Помощь с навигацией
    if (message.includes('откр') && (message.includes('сайт') || message.includes('страниц'))) {
        const urlMatch = userMessage.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);
        if (urlMatch) {
            navigateToAddress(urlMatch[0]);
            return 'Конечно! Открываю сайт для тебя.';
        }
        return 'Какой сайт ты хочешь открыть? Просто напиши URL или название сайта.';
    }

    if (message.includes('найди') || message.includes('поиск') || message.includes('найти')) {
        const query = userMessage.replace(/(найди|поиск|найти)/i, '').trim();
        if (query) {
            navigateToAddress(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
            return `Ищу информацию о "${query}"...`;
        }
        return 'Что именно ты хочешь найти? Напиши свой запрос.';
    }

    // Работа с вкладками
    if (message.includes('новая вкладк') || message.includes('откр') && message.includes('вкладк')) {
        createNewTab('about:blank', 'Новая вкладка');
        return 'Открыл новую вкладку для тебя!';
    }

    if (message.includes('закр') && message.includes('вкладк')) {
        if (tabs.length > 1) {
            closeCurrentTab();
            return 'Вкладка закрыта!';
        }
        return 'Не могу закрыть последнюю вкладку.';
    }

    // Информация о браузере
    if (message.includes('что ты') || message.includes('кто ты') || message.includes('расскажи о себе')) {
        return 'Я Вованчик - AI помощник браузера Vovanium! Я могу помочь тебе с навигацией, поиском информации, управлением вкладками и многим другим. Просто спроси!';
    }

    // Погода
    if (message.includes('погода')) {
        return 'К сожалению, я пока не могу узнать погоду. Но ты можешь найти эту информацию в поиске! Просто напиши "найди погода в [твой город]".';
    }

    // Время
    if (message.includes('время') || message.includes('который час')) {
        const now = new Date();
        return `Сейчас ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Благодарность
    if (message.includes('спасибо') || message.includes('благодар')) {
        return 'Пожалуйста! Всегда рад помочь! 😊';
    }

    // Пока
    if (message.includes('пока') || message.includes('до свидани') || message.includes('увидимся')) {
        return 'До встречи! Если что-то понадобится - я всегда здесь! 👋';
    }

    // По умолчанию - умный ответ
    if (message.includes('как дела') || message.includes('как поживаешь')) {
        return 'Отлично! Готов помогать тебе с интернет-серфингом. Как дела у тебя?';
    }

    // Если не распознано - предлагаем помощь
    return `Интересный вопрос! Я могу помочь тебе с поиском информации, открытием сайтов, управлением вкладками и другими задачами. Попробуй спросить что-то конкретное, например "найди информацию о JavaScript" или "открой google.com".`;
}
