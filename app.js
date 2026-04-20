let tabs = [];
let activeTabId = -1;
let assistantOpen = false;
let chatHistory = [];

const DEFAULT_URL = "https://www.google.com";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

const STORAGE_KEYS = {
    provider: "vovanium.assistant.provider",
    apiUrl: "vovanium.assistant.apiUrl",
    model: "vovanium.assistant.model",
    apiKey: "vovanium.assistant.apiKey"
};

document.addEventListener("DOMContentLoaded", () => {
    setupControls();
    setupAssistant();
    setupElectronListeners();
    createTab(DEFAULT_URL, "Новая вкладка");
});

function setupControls() {
    document.getElementById("backBtn").addEventListener("click", () => getActiveWebview()?.goBack());
    document.getElementById("forwardBtn").addEventListener("click", () => getActiveWebview()?.goForward());
    document.getElementById("reloadBtn").addEventListener("click", () => getActiveWebview()?.reload());
    document.getElementById("goBtn").addEventListener("click", navigateFromAddressBar);
    document.getElementById("newTabBtn").addEventListener("click", () => createTab(DEFAULT_URL, "Новая вкладка"));
    document.getElementById("assistantBtn").addEventListener("click", toggleAssistant);
    document.getElementById("addressBar").addEventListener("keydown", (event) => {
        if (event.key === "Enter") navigateFromAddressBar();
    });
}

function setupElectronListeners() {
    if (!window.electronAPI) return;
    window.electronAPI.onNewTab(() => createTab(DEFAULT_URL, "Новая вкладка"));
    window.electronAPI.onCloseTab(() => closeTab(activeTabId));
    window.electronAPI.onNavigateBack(() => getActiveWebview()?.goBack());
    window.electronAPI.onNavigateForward(() => getActiveWebview()?.goForward());
    window.electronAPI.onReload(() => getActiveWebview()?.reload());
    window.electronAPI.onNavigate((url) => navigateTo(url));
}

function createTab(url, title) {
    const id = tabs.length;
    tabs.push({ id, title, url, webview: null });

    const tabEl = document.createElement("div");
    tabEl.className = "tab";
    tabEl.dataset.tabId = String(id);
    tabEl.innerHTML = `<span class="tab-title">${title}</span><button class="tab-close">x</button>`;
    tabEl.addEventListener("click", (event) => {
        if (!event.target.classList.contains("tab-close")) switchTab(id);
    });
    tabEl.querySelector(".tab-close").addEventListener("click", (event) => {
        event.stopPropagation();
        closeTab(id);
    });
    document.getElementById("tabsContainer").appendChild(tabEl);

    const webview = document.createElement("webview");
    webview.src = url;
    webview.allowpopups = true;
    webview.useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    webview.addEventListener("did-start-loading", () => updateTabTitle(id, "Загрузка..."));
    webview.addEventListener("page-title-updated", (event) => updateTabTitle(id, event.title || "Новая вкладка"));
    webview.addEventListener("did-navigate", (event) => onTabNavigated(id, event.url));
    webview.addEventListener("did-navigate-in-page", (event) => onTabNavigated(id, event.url));
    webview.addEventListener("did-stop-loading", () => {
        if (id === activeTabId) {
            updateAddressBar(webview.getURL());
            updateNavigationState();
        }
    });

    document.getElementById("webviewContainer").appendChild(webview);
    tabs[id].webview = webview;
    switchTab(id);
}

function switchTab(tabId) {
    if (!tabs[tabId]) return;
    activeTabId = tabId;

    document.querySelectorAll(".tab").forEach((el) => {
        el.classList.toggle("active", Number(el.dataset.tabId) === tabId);
    });

    tabs.forEach((tab, index) => {
        if (tab.webview) tab.webview.classList.toggle("active", index === tabId);
    });

    const active = tabs[tabId];
    updateAddressBar(active.url || active.webview?.getURL() || "");
    updateNavigationState();
}

function closeTab(tabId) {
    if (tabs.length <= 1 || !tabs[tabId]) return;
    tabs[tabId].webview?.remove();
    document.querySelector(`.tab[data-tab-id="${tabId}"]`)?.remove();
    tabs.splice(tabId, 1);

    tabs.forEach((tab, index) => {
        tab.id = index;
        const tabEl = document.querySelectorAll(".tab")[index];
        if (tabEl) tabEl.dataset.tabId = String(index);
    });

    if (activeTabId >= tabs.length) activeTabId = tabs.length - 1;
    switchTab(activeTabId);
}

function updateTabTitle(tabId, title) {
    if (!tabs[tabId]) return;
    tabs[tabId].title = title;
    const titleEl = document.querySelector(`.tab[data-tab-id="${tabId}"] .tab-title`);
    if (titleEl) titleEl.textContent = title;
}

function onTabNavigated(tabId, url) {
    if (!tabs[tabId]) return;
    tabs[tabId].url = url;
    if (tabId === activeTabId) {
        updateAddressBar(url);
        updateNavigationState();
    }
}

function navigateFromAddressBar() {
    navigateTo(document.getElementById("addressBar").value);
}

function navigateTo(value) {
    const webview = getActiveWebview();
    if (!webview || !value?.trim()) return;
    const input = value.trim();
    const target = /^https?:\/\//i.test(input) ? input : `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    webview.src = target;
}

function updateAddressBar(url) {
    document.getElementById("addressBar").value = url || "";
}

function updateNavigationState() {
    const webview = getActiveWebview();
    document.getElementById("backBtn").disabled = !webview || !webview.canGoBack();
    document.getElementById("forwardBtn").disabled = !webview || !webview.canGoForward();
}

function getActiveWebview() {
    return tabs[activeTabId]?.webview || null;
}

function setupAssistant() {
    const panel = document.getElementById("assistantPanel");
    const closeBtn = document.getElementById("closeAssistantBtn");
    const sendBtn = document.getElementById("sendMessageBtn");
    const input = document.getElementById("assistantInput");
    const provider = document.getElementById("assistantProvider");
    const apiUrl = document.getElementById("assistantApiUrl");
    const model = document.getElementById("assistantModel");
    const apiKey = document.getElementById("assistantApiKey");
    const saveBtn = document.getElementById("saveApiSettingsBtn");

    closeBtn.addEventListener("click", () => {
        assistantOpen = false;
        panel.classList.remove("open");
    });

    provider.value = localStorage.getItem(STORAGE_KEYS.provider) || "deepseek";
    apiUrl.value = localStorage.getItem(STORAGE_KEYS.apiUrl) || DEEPSEEK_API_URL;
    model.value = localStorage.getItem(STORAGE_KEYS.model) || DEEPSEEK_MODEL;
    apiKey.value = localStorage.getItem(STORAGE_KEYS.apiKey) || "";
    applyProviderPreset();

    provider.addEventListener("change", applyProviderPreset);
    saveBtn.addEventListener("click", () => {
        localStorage.setItem(STORAGE_KEYS.provider, provider.value);
        localStorage.setItem(STORAGE_KEYS.apiUrl, apiUrl.value.trim());
        localStorage.setItem(STORAGE_KEYS.model, model.value.trim());
        localStorage.setItem(STORAGE_KEYS.apiKey, apiKey.value.trim());
        addAssistantMessage("Настройки сохранены.", "assistant");
    });
    sendBtn.addEventListener("click", sendAssistantMessage);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") sendAssistantMessage();
    });

    function applyProviderPreset() {
        if (provider.value === "deepseek") {
            apiUrl.value = DEEPSEEK_API_URL;
            model.value = DEEPSEEK_MODEL;
            apiUrl.readOnly = true;
            model.readOnly = true;
        } else {
            apiUrl.readOnly = false;
            model.readOnly = false;
        }
    }
}

function toggleAssistant() {
    assistantOpen = !assistantOpen;
    document.getElementById("assistantPanel").classList.toggle("open", assistantOpen);
}

async function sendAssistantMessage() {
    const input = document.getElementById("assistantInput");
    const text = input.value.trim();
    if (!text) return;
    addAssistantMessage(text, "user");
    input.value = "";

    try {
        const answer = await requestApiAnswer(text);
        addAssistantMessage(answer, "assistant");
    } catch (error) {
        addAssistantMessage(`Ошибка API: ${error.message}`, "assistant");
    }
}

async function requestApiAnswer(userText) {
    const apiUrl = localStorage.getItem(STORAGE_KEYS.apiUrl) || DEEPSEEK_API_URL;
    const model = localStorage.getItem(STORAGE_KEYS.model) || DEEPSEEK_MODEL;
    const apiKey = localStorage.getItem(STORAGE_KEYS.apiKey) || "";
    if (!apiKey) throw new Error("не указан API key");

    chatHistory.push({ role: "user", content: userText });
    chatHistory = chatHistory.slice(-12);

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [{ role: "system", content: "Отвечай кратко и по-русски." }, ...chatHistory],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const raw = await response.text();
        throw new Error(parseApiError(response.status, raw));
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("пустой ответ модели");

    chatHistory.push({ role: "assistant", content: answer });
    chatHistory = chatHistory.slice(-12);
    return answer;
}

function parseApiError(status, rawText) {
    try {
        const parsed = JSON.parse(rawText);
        if (parsed?.error?.message) return parsed.error.message;
    } catch (_) {}
    if (status === 401) return "неверный API key";
    if (status === 402) return "недостаточно баланса";
    if (status === 429) return "слишком много запросов";
    if (status >= 500) return "сервер API временно недоступен";
    return `HTTP ${status}`;
}

function addAssistantMessage(text, role) {
    const container = document.getElementById("assistantMessages");
    const message = document.createElement("div");
    message.className = `msg ${role}`;
    message.textContent = text;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
}
