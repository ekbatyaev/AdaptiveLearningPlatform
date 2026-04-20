let currentSubtopic = null;
let currentUser = null;
let currentTopic = null;
let currentTopics = [];
let conversationContext = '';
let shouldAutoScroll = true;
let currentChatMode = 'learning';

const authPage = document.getElementById('auth-page');
const mainApp = document.getElementById('main-app');
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const myTopicsList = document.getElementById('my-topics-list');
const allTopicsList = document.getElementById('all-topics-list');
const typingIndicator = document.getElementById('typing-indicator');
const userInfo = document.getElementById('user-info');
const currentThemeTitle = document.getElementById('current-theme-title');
const currentThemeDescription = document.getElementById('current-theme-description');
const searchInput = document.getElementById('search-topics');
const subtopicsContainer = document.getElementById('subtopics-container');
const subtopicsList = document.getElementById('subtopics-list');
const subtopicsContent = document.getElementById('subtopics-content');
const toggleSubtopicsBtn = document.getElementById('toggle-subtopics-btn');
const themeChip = document.getElementById('theme-chip');
const themeChipText = document.getElementById('theme-chip-text');

const modal = document.getElementById('create-topic-modal');
const addTopicBtn = document.getElementById('add-topic-btn');
const closeModalBtn = document.querySelector('.close-modal');
const cancelBtn = document.querySelector('.cancel-btn');
const createTopicForm = document.getElementById('create-topic-form');

const container = document.querySelector('.container');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const desktopSidebarToggleBtn = document.getElementById('desktop-sidebar-toggle-btn');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const mobileCurrentTheme = document.getElementById('mobile-current-theme');

marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
    setupEventListeners();
    setupScrollTracking();
    checkApiHealth();
});

async function checkApiHealth() {
    const isHealthy = await api.healthCheck();
    if (!isHealthy) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

function setupAuth() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
        });
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            showLoading(true);
            const user = await api.login(username, password);
            currentUser = user;
            await loadUserData();
            showMainApp();
            showNotification(`Добро пожаловать, ${username}!`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            showLoading(false);
        }
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;

        try {
            showLoading(true);
            await api.register(username, password);
            showNotification('Регистрация успешна! Теперь войдите в систему.', 'success');

            document.querySelector('[data-tab="login"]').click();
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = password;
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            showLoading(false);
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        currentUser = null;
        currentTopic = null;
        currentSubtopic = null;
        currentChatMode = 'learning';
        conversationContext = '';
        api.setCredentials(null, null);

        authPage.style.display = 'flex';
        mainApp.style.display = 'none';

        updateThemeChip();
        updateMobileThemeTitle();
        closeSidebar();
        resetDesktopSidebar();

        messagesContainer.innerHTML = `
            <div class="empty-chat-message">
                <i class="fas fa-comment-dots"></i>
                <p>Выберите тему слева, чтобы начать обучение</p>
            </div>
        `;

        showNotification('Вы вышли из системы', 'info');
    });
}

async function loadUserData() {
    try {
        const [userInfoData, myTopics, allTopics] = await Promise.all([
            api.getCurrentUser(),
            api.getMyTopics(),
            api.getAllTopics()
        ]);

        currentUser = userInfoData;
        currentTopics = allTopics;

        displayUserInfo(userInfoData);
        displayMyTopics(myTopics);
        displayAllTopics(allTopics);
        updateMobileThemeTitle();
    } catch (error) {
        showNotification('Ошибка загрузки данных', 'error');
    }
}

function displayUserInfo(user) {
    userInfo.innerHTML = `
        <div class="user-avatar">
            <i class="fas fa-user-circle"></i>
        </div>
        <div class="user-details">
            <span class="username">${escapeHtml(user.username)}</span>
            <span class="achievements">Достижений: ${user.achievements_count || 0}</span>
        </div>
    `;
}

function displayMyTopics(topics) {
    myTopicsList.innerHTML = '';

    if (!topics.length) {
        myTopicsList.innerHTML = '<div class="empty-state">У вас пока нет тем</div>';
        return;
    }

    topics.forEach(topic => {
        myTopicsList.appendChild(createTopicElement(topic, true));
    });

    updateSelectedTopicCard();
}

function displayAllTopics(topics) {
    allTopicsList.innerHTML = '';

    if (!topics.length) {
        allTopicsList.innerHTML = '<div class="empty-state">Тем пока нет</div>';
        return;
    }

    topics.forEach(topic => {
        allTopicsList.appendChild(createTopicElement(topic, false));
    });

    updateSelectedTopicCard();
}

function createTopicElement(topic, isMyTopic) {
    const div = document.createElement('div');
    div.className = 'topic-card';
    div.dataset.topicId = topic.id;

    if (currentTopic && currentTopic.id === topic.id) {
        div.classList.add('selected');
    }

    const createdAt = topic.created_at ? new Date(topic.created_at).toLocaleDateString() : '—';

    div.innerHTML = `
        <div class="topic-header">
            <h4>${escapeHtml(topic.title)}</h4>
            ${isMyTopic ? '<i class="fas fa-star my-topic-icon" title="Моя тема"></i>' : ''}
        </div>

        <p class="topic-description">${escapeHtml(shortenText(topic.description || '', 100))}</p>

        <div class="topic-meta">
            <span><i class="fas fa-user"></i> ${escapeHtml(topic.creator_username || 'Пользователь')}</span>
            <span><i class="fas fa-calendar"></i> ${createdAt}</span>
        </div>

        ${isMyTopic ? `
            <div class="topic-actions">
                <button class="delete-topic" type="button" title="Удалить тему">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        ` : ''}
    `;

    const deleteButton = div.querySelector('.delete-topic');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTopic(topic.id);
        });
    }

    div.addEventListener('click', () => {
        selectTopic(topic);
    });

    return div;
}

async function selectTopic(topic) {
    currentTopic = topic;
    currentSubtopic = null;
    currentChatMode = 'learning';
    conversationContext = '';

    currentThemeTitle.textContent = topic.title;
    currentThemeDescription.textContent = topic.description || '';
    updateThemeChip();
    updateSelectedTopicCard();
    updateMobileThemeTitle();

    messagesContainer.innerHTML = '';
    addAIMessage(`# ${topic.title}\n\n${topic.description || 'Описание отсутствует.'}`);

    let programData = topic.data_json;

    if (typeof programData === 'string') {
        try {
            programData = JSON.parse(programData);
        } catch (e) {
            console.error('Ошибка парсинга JSON:', e);
        }
    }

    displaySubtopics(programData);

    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.placeholder = `Задайте вопрос по теме «${topic.title}»...`;
    userInput.focus();

    if (topic.data_json) {
        const formattedProgram = formatLearningProgram(programData);
        addAIMessage(formattedProgram);
    }

    typingIndicator.style.display = 'flex';
    smartScrollToBottom(true);

    try {
        const response = await api.generateExplanation(
            topic.title,
            topic.description || ''
        );

        let aiResponse = '';
        if (response.answer) {
            aiResponse = response.answer;
        } else if (response.model_response) {
            aiResponse = response.model_response;
        } else if (typeof response === 'string') {
            aiResponse = response;
        } else {
            aiResponse = JSON.stringify(response);
        }

        addAIMessageWithTyping(aiResponse);

        conversationContext = `AI: ${aiResponse}\n`;
    } catch (error) {
        typingIndicator.style.display = 'none';
        showNotification('Ошибка при генерации объяснения', 'error');
        console.error('Generate explanation error:', error);
    }

    if (window.innerWidth <= 860) {
        closeSidebar();
    }
}

function displaySubtopics(dataJson) {
    if (!dataJson || !dataJson.themes || !dataJson.themes.length) {
        subtopicsContainer.style.display = 'none';
        return;
    }

    subtopicsContainer.style.display = 'block';
    subtopicsContent.style.display = 'block';
    toggleSubtopicsBtn.classList.remove('is-collapsed');
    toggleSubtopicsBtn.setAttribute('aria-expanded', 'true');

    const textNode = toggleSubtopicsBtn.querySelector('.toggle-btn-text');
    if (textNode) {
        textNode.textContent = 'Свернуть';
    }

    subtopicsList.innerHTML = '';

    dataJson.themes.forEach((subtopic, index) => {
        const card = document.createElement('article');
        card.className = 'subtopic-item';
        card.dataset.subtopicName = subtopic.name;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        if (currentSubtopic && currentSubtopic.name === subtopic.name) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <div class="subtopic-badge">Подтема ${index + 1}</div>

            <div class="subtopic-main">
                <div class="subtopic-header">
                    <div class="subtopic-title-wrap">
                        <div class="subtopic-name">${escapeHtml(subtopic.name)}</div>
                        <div class="subtopic-select-hint">
                            <i class="fas fa-sparkles"></i>
                            <span>Выбрать для изучения</span>
                        </div>
                    </div>

                    <div class="subtopic-check">
                        <i class="fas fa-check"></i>
                    </div>
                </div>

                <div class="subtopic-description">${escapeHtml(subtopic.description || 'Описание подтемы отсутствует.')}</div>
            </div>

            <div class="subtopic-actions">
                <button class="subtopic-test-btn" type="button">
                    <i class="fas fa-clipboard-check"></i>
                    <span>Пройти тест</span>
                </button>
            </div>
        `;

        const selectHandler = () => selectSubtopic(subtopic);

        card.addEventListener('click', selectHandler);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectHandler();
            }
        });

        const testBtn = card.querySelector('.subtopic-test-btn');
        testBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            takeSubtopicTest(subtopic);
        });

        subtopicsList.appendChild(card);
    });

    updateSelectedSubtopicCard();
}

async function selectSubtopic(subtopic) {
    currentSubtopic = subtopic;
    currentChatMode = 'learning';
    conversationContext = '';
    updateSelectedSubtopicCard();
    updateThemeChip();

    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.placeholder = `Задайте вопрос по подтеме «${subtopic.name}»...`;

    addAIMessage(
        `**${subtopic.name}**\n\n${subtopic.description || 'Описание отсутствует.'}\n\nТеперь я буду ориентироваться именно на эту подтему.`
    );

    typingIndicator.style.display = 'flex';
    smartScrollToBottom(true);

    try {
        const response = await api.generateExplanation(
            subtopic.name,
            subtopic.description || ''
        );

        let aiResponse = '';
        if (response.answer) {
            aiResponse = response.answer;
        } else if (response.model_response) {
            aiResponse = response.model_response;
        } else if (typeof response === 'string') {
            aiResponse = response;
        } else {
            aiResponse = JSON.stringify(response);
        }

        addAIMessageWithTyping(aiResponse);

        conversationContext = `AI: ${aiResponse}\n`;
    } catch (error) {
        typingIndicator.style.display = 'none';
        showNotification('Ошибка при генерации объяснения', 'error');
        console.error('Generate explanation error:', error);
    }

    smartScrollToBottom(true);
}

function formatLearningProgram(data) {
    let markdown = '## 📚 Программа обучения\n\n';

    if (data?.themes && Array.isArray(data.themes)) {
        data.themes.forEach((theme, index) => {
            markdown += `### ${index + 1}. ${theme.name}\n\n`;
            markdown += `${theme.description || ''}\n\n`;
            markdown += `---\n\n`;
        });
    } else if (Array.isArray(data)) {
        data.forEach((item, index) => {
            if (item.name) {
                markdown += `### ${index + 1}. ${item.name}\n\n`;
                if (item.description) {
                    markdown += `${item.description}\n\n`;
                }
                markdown += `---\n\n`;
            }
        });
    } else if (data?.topics && Array.isArray(data.topics)) {
        data.topics.forEach((topic, index) => {
            markdown += `### ${index + 1}. ${topic.title || topic.name}\n\n`;
            markdown += `${topic.description || ''}\n\n`;
            markdown += `---\n\n`;
        });
    } else {
        markdown += '```json\n' + JSON.stringify(data, null, 2) + '\n```';
    }

    return markdown;
}

function formatAIResponse(response) {
    if (
        response.includes('"themes":') ||
        response.includes('"name":') ||
        response.includes('"description":')
    ) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                if (jsonData.themes || Array.isArray(jsonData)) {
                    const formatted = formatLearningProgram(jsonData);
                    response = response.replace(jsonMatch[0], formatted);
                }
            }
        } catch (e) {
            console.error('Ошибка форматирования ответа:', e);
        }
    }

    return response;
}

async function deleteTopic(topicId) {
    if (!confirm('Вы уверены, что хотите удалить эту тему?')) {
        return;
    }

    try {
        await api.deleteTopic(topicId);
        showNotification('Тема удалена', 'success');
        await loadUserData();

        if (currentTopic && currentTopic.id === topicId) {
            currentTopic = null;
            currentSubtopic = null;
            currentChatMode = 'learning';
            conversationContext = '';

            currentThemeTitle.textContent = 'Выберите тему для изучения';
            currentThemeDescription.textContent = '';
            subtopicsContainer.style.display = 'none';

            messagesContainer.innerHTML = `
                <div class="empty-chat-message">
                    <i class="fas fa-comment-dots"></i>
                    <p>Выберите тему слева, чтобы начать обучение</p>
                </div>
            `;

            userInput.disabled = true;
            sendBtn.disabled = true;
            userInput.placeholder = 'Сначала выберите тему...';

            updateThemeChip();
            updateMobileThemeTitle();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {
        const search = e.target.value.trim();
        try {
            const topics = await api.getAllTopics(search);
            displayAllTopics(topics);
        } catch (error) {
            showNotification('Ошибка поиска', 'error');
        }
    }, 300);
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || !currentTopic) {
        return;
    }

    addUserMessage(message);
    userInput.value = '';
    userInput.style.height = 'auto';

    typingIndicator.style.display = 'flex';
    smartScrollToBottom(true);

    try {
        if (conversationContext.length > 5000) {
            conversationContext = conversationContext.slice(-5000);
            const messages = conversationContext.split('\n\n');
            if (messages.length > 10) {
                conversationContext = messages.slice(-10).join('\n\n');
            }
        }

        const themeName = currentSubtopic ? currentSubtopic.name : currentTopic.title;
        const additionalInfo = currentSubtopic ? currentSubtopic.description : currentTopic.description;

        const response = currentChatMode === 'test'
            ? await api.discussTestWithUser(
                themeName,
                message,
                additionalInfo,
                conversationContext
            )
            : await api.chatWithUser(
                themeName,
                message,
                additionalInfo,
                conversationContext
            );

        let aiResponse = '';
        if (response.answer) {
            aiResponse = response.answer;
        } else if (response.model_response) {
            aiResponse = response.model_response;
        } else if (typeof response === 'string') {
            aiResponse = response;
        } else {
            aiResponse = JSON.stringify(response);
        }

        conversationContext += `\nUser: ${message}\nAI: ${aiResponse}\n`;
        addAIMessageWithTyping(aiResponse);
    } catch (error) {
        typingIndicator.style.display = 'none';
        showNotification('Ошибка при получении ответа от AI', 'error');
        console.error('Send message error:', error);
    }
}

async function takeSubtopicTest(subtopic) {
    if (!currentTopic) {
        return;
    }

    typingIndicator.style.display = 'flex';
    smartScrollToBottom(true);

    try {
        addAIMessage(`📝 **Запрашиваю тест по теме:** ${subtopic.name}...`);

        const data = await api.getFinalTest(subtopic.name, subtopic.description);
        const questions = data.test || [];

        typingIndicator.style.display = 'none';

        const combinedQuestions = questions
            .map((q, index) => `${index + 1}. **${q.name}:** ${q.description}`)
            .join('\n\n');

        addAIMessage(
            `## 📋 Тест по теме: ${data.title}\n\n**Описание:** ${data.description}\n\n${combinedQuestions}`
        );

        currentSubtopic = subtopic;
        currentChatMode = 'test';
        conversationContext = '';
        updateSelectedSubtopicCard();
        updateThemeChip();

        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.placeholder = `Введите ответ по тесту «${subtopic.name}»...`;

    } catch (error) {
        typingIndicator.style.display = 'none';
        showNotification('Ошибка при получении теста', 'error');
        console.error('Test error:', error);
    }
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(text)}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    smartScrollToBottom(true);
}

function addAIMessageWithTyping(markdownText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    const formattedText = formatAIResponse(markdownText);
    typeWriterEffect(contentDiv, formattedText);
}

function addAIMessage(markdownText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const formattedText = formatAIResponse(markdownText);
    contentDiv.innerHTML = marked.parse(formattedText);

    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    smartScrollToBottom(true);
}

function typeWriterEffect(element, markdownText, speed = 14) {
    const htmlContent = marked.parse(markdownText);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    let i = 0;

    function type() {
        if (i < plainText.length) {
            const progress = plainText.length ? i / plainText.length : 1;
            const htmlLength = htmlContent.length;
            const charsToShow = Math.max(1, Math.floor(htmlLength * progress));

            element.innerHTML = htmlContent.substring(0, charsToShow);

            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });

            i++;
            smartScrollToBottom();
            setTimeout(type, speed);
        } else {
            element.innerHTML = htmlContent;

            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });

            typingIndicator.style.display = 'none';
            smartScrollToBottom();
        }
    }

    setTimeout(type, 220);
}

function showMainApp() {
    authPage.style.display = 'none';
    mainApp.style.display = 'flex';
}

function setupEventListeners() {
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 860) {
                openSidebar();
            } else {
                toggleDesktopSidebar();
            }
        });
    }

    if (desktopSidebarToggleBtn) {
        desktopSidebarToggleBtn.addEventListener('click', toggleDesktopSidebar);
    }



    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth > 860) {
            closeSidebar();
        }
    });

    toggleSubtopicsBtn.addEventListener('click', () => {
        const isHidden = subtopicsContent.style.display === 'none';

        subtopicsContent.style.display = isHidden ? 'block' : 'none';
        toggleSubtopicsBtn.classList.toggle('is-collapsed', !isHidden);
        toggleSubtopicsBtn.setAttribute('aria-expanded', String(isHidden));

        const textNode = toggleSubtopicsBtn.querySelector('.toggle-btn-text');
        if (textNode) {
            textNode.textContent = isHidden ? 'Свернуть' : 'Показать';
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = `${this.scrollHeight}px`;
    });

    addTopicBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    createTopicForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('topic-title').value.trim();
        const description = document.getElementById('topic-description').value.trim();

        try {
            showLoading(true);
            await api.createTopic(title, description);
            modal.style.display = 'none';
            createTopicForm.reset();
            showNotification('Тема создана!', 'success');
            await loadUserData();
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            showLoading(false);
        }
    });
}

function setupScrollTracking() {
    messagesContainer.addEventListener('scroll', () => {
        shouldAutoScroll = isNearBottom(messagesContainer, 120);
    });
}

function isNearBottom(container, threshold = 80) {
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold;
}

function smartScrollToBottom(force = false) {
    if (force || shouldAutoScroll) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function openSidebar() {
    if (!sidebar || window.innerWidth > 860) {
        return;
    }

    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.classList.add('sidebar-open');
}

function closeSidebar() {
    if (!sidebar) {
        return;
    }

    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
}

function toggleDesktopSidebar() {
    if (window.innerWidth <= 860 || !container) {
        openSidebar();
        return;
    }

    container.classList.toggle('sidebar-collapsed');
}

function resetDesktopSidebar() {
    if (!container) {
        return;
    }
    container.classList.remove('sidebar-collapsed');
}

function updateSelectedTopicCard() {
    document.querySelectorAll('.topic-card').forEach(card => {
        const cardId = Number(card.dataset.topicId);
        card.classList.toggle('selected', !!currentTopic && cardId === currentTopic.id);
    });
}

function updateSelectedSubtopicCard() {
    document.querySelectorAll('.subtopic-item').forEach(card => {
        const isSelected = !!currentSubtopic && card.dataset.subtopicName === currentSubtopic.name;
        card.classList.toggle('selected', isSelected);
    });
}

function updateThemeChip() {
    if (!themeChip || !themeChipText) {
        return;
    }

    if (!currentTopic) {
        themeChip.style.display = 'none';
        return;
    }

    themeChip.style.display = 'inline-flex';
    themeChipText.textContent = currentSubtopic
        ? `${currentTopic.title} → ${currentSubtopic.name}`
        : currentTopic.title;
}

function updateMobileThemeTitle() {
    if (!mobileCurrentTheme) {
        return;
    }

    mobileCurrentTheme.textContent = currentTopic ? currentTopic.title : 'AdaptiveLearning';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

function shortenText(text, maxLength = 100) {
    if (!text) {
        return '';
    }
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success'
            ? 'fa-check-circle'
            : type === 'error'
                ? 'fa-exclamation-circle'
                : 'fa-info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showLoading(show) {
    if (show) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}