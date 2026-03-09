// Состояние приложения
let currentSubtopic = null;
let currentUser = null;
let currentTopic = null;
let currentTopics = [];
let conversationContext = '';

// DOM элементы
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

// Модальное окно
const modal = document.getElementById('create-topic-modal');
const addTopicBtn = document.getElementById('add-topic-btn');
const closeModal = document.querySelector('.close-modal');
const cancelBtn = document.querySelector('.cancel-btn');
const createTopicForm = document.getElementById('create-topic-form');

// Настройка marked
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
    setupEventListeners();
    checkApiHealth();
});

// Проверка API
async function checkApiHealth() {
    const isHealthy = await api.healthCheck();
    if (!isHealthy) {
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

// Настройка авторизации
function setupAuth() {
    // Переключение между вкладками
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
        });
    });

    // Обработка формы входа
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
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

    // Обработка формы регистрации
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        try {
            showLoading(true);
            await api.register(username, password);
            showNotification('Регистрация успешна! Теперь войдите в систему.', 'success');
            
            // Переключаем на вкладку входа
            document.querySelector('[data-tab="login"]').click();
            
            // Заполняем поля
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = password;
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            showLoading(false);
        }
    });

    // Выход
    document.getElementById('logout-btn').addEventListener('click', () => {
        currentUser = null;
        api.setCredentials(null, null);
        authPage.style.display = 'flex';
        mainApp.style.display = 'none';
        showNotification('Вы вышли из системы', 'info');
    });
}

// Загрузка данных пользователя
async function loadUserData() {
    try {
        const [userInfo, myTopics, allTopics] = await Promise.all([
            api.getCurrentUser(),
            api.getMyTopics(),
            api.getAllTopics()
        ]);

        currentUser = userInfo;
        currentTopics = allTopics;

        // Отображаем информацию о пользователе
        displayUserInfo(userInfo);
        
        // Отображаем темы
        displayMyTopics(myTopics);
        displayAllTopics(allTopics);
        
    } catch (error) {
        showNotification('Ошибка загрузки данных', 'error');
    }
}

// Отображение информации о пользователе
function displayUserInfo(user) {
    userInfo.innerHTML = `
        <div class="user-avatar">
            <i class="fas fa-user-circle"></i>
        </div>
        <div class="user-details">
            <span class="username">${user.username}</span>
            <span class="achievements">Достижений: ${user.achievements_count || 0}</span>
        </div>
    `;
}

// Отображение моих тем
function displayMyTopics(topics) {
    myTopicsList.innerHTML = '';
    
    if (topics.length === 0) {
        myTopicsList.innerHTML = '<div class="empty-state">У вас пока нет тем. Создайте первую!</div>';
        return;
    }

    topics.forEach(topic => {
        const topicElement = createTopicElement(topic, true);
        myTopicsList.appendChild(topicElement);
    });
}

// Отображение всех тем
function displayAllTopics(topics) {
    allTopicsList.innerHTML = '';
    
    if (topics.length === 0) {
        allTopicsList.innerHTML = '<div class="empty-state">Тем пока нет</div>';
        return;
    }

    topics.forEach(topic => {
        const topicElement = createTopicElement(topic, false);
        allTopicsList.appendChild(topicElement);
    });
}

// Создание элемента темы
function createTopicElement(topic, isMyTopic) {
    const div = document.createElement('div');
    div.className = 'topic-card';
    div.dataset.topicId = topic.id;
    
    div.innerHTML = `
        <div class="topic-header">
            <h4>${topic.title}</h4>
            ${isMyTopic ? '<i class="fas fa-star my-topic-icon" title="Моя тема"></i>' : ''}
        </div>
        <p class="topic-description">${topic.description.substring(0, 100)}${topic.description.length > 100 ? '...' : ''}</p>
        <div class="topic-meta">
            <span class="topic-creator">
                <i class="fas fa-user"></i> ${topic.creator_username || 'Пользователь'}
            </span>
            <span class="topic-date">
                <i class="fas fa-calendar"></i> ${new Date(topic.created_at).toLocaleDateString()}
            </span>
        </div>
        ${isMyTopic ? `
            <div class="topic-actions">
                <button class="delete-topic" onclick="deleteTopic(${topic.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        ` : ''}
    `;
    
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-topic')) {
            selectTopic(topic);
        }
    });
    
    return div;
}

// Выбор темы для изучения
async function selectTopic(topic) {
    currentTopic = topic;
    currentSubtopic = null;
    currentThemeTitle.textContent = topic.title;
    currentThemeDescription.textContent = topic.description;

    // Очищаем чат
    messagesContainer.innerHTML = '';

    // Добавляем приветственное сообщение
    addAIMessage(`# ${topic.title}\n\n${topic.description}\n\nВыберите подтему для изучения:`);

    displaySubtopics(topic.data_json);

    // Активируем ввод
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();

    // Загружаем программу обучения из data_json если есть
    if (topic.data_json) {
        // Проверяем, является ли data_json строкой или объектом
        let programData = topic.data_json;
        if (typeof programData === 'string') {
            try {
                programData = JSON.parse(programData);
            } catch (e) {
                console.error('Ошибка парсинга JSON:', e);
            }
        }

        // Форматируем программу обучения в красивый Markdown
        const formattedProgram = formatLearningProgram(programData);
        addAIMessage(formattedProgram);
    }
}

// функция для отображения подтем
function displaySubtopics(dataJson) {
    const container = document.getElementById('subtopics-container');
    const list = document.getElementById('subtopics-list');
    
    if (!dataJson || !dataJson.themes || dataJson.themes.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    list.innerHTML = '';
    dataJson.themes.forEach((subtopic, index) => {
        const subtopicElement = document.createElement('div');
        subtopicElement.className = 'subtopic-item';
        subtopicElement.innerHTML = `
            <div class="subtopic-header">
                <span class="subtopic-name">${subtopic.name}</span>
                <button class="subtopic-test-btn" data-subtopic-index="${index}">
                    📝 Пройти тест
                </button>
            </div>
            <div class="subtopic-description">${subtopic.description}</div>
        `;
        
        // Клик на название или описание выбирает подтему
        subtopicElement.querySelector('.subtopic-name').addEventListener('click', () => {
            selectSubtopic(subtopic);
        });
        
        subtopicElement.querySelector('.subtopic-description').addEventListener('click', () => {
            selectSubtopic(subtopic);
        });
        
        // Клик на кнопку теста
        subtopicElement.querySelector('.subtopic-test-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            takeSubtopicTest(subtopic);
        });
        
        list.appendChild(subtopicElement);
    });
    
    container.style.display = 'block';
}

// Функция выбора подтемы
function selectSubtopic(subtopic) {
    currentSubtopic = subtopic;
    
    // Добавляем сообщение о выбранной подтеме
    addAIMessage(`✅ **Выбрана подтема:** ${subtopic.name}\n\n${subtopic.description}\n\nТеперь вы можете задавать вопросы по этой теме.`);
    
    // Прокручиваем к чату
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Функция для форматирования программы обучения
function formatLearningProgram(data) {
    let markdown = '## 📚 Программа обучения\n\n';

    // Если данные пришли в формате { themes: [...] }
    if (data.themes && Array.isArray(data.themes)) {
        data.themes.forEach((theme, index) => {
            markdown += `### ${index + 1}. ${theme.name}\n\n`;
            markdown += `${theme.description}\n\n`;

            // Добавляем иконки для визуального разделения
            markdown += `---\n\n`;
        });
    }
    // Если данные пришли как массив
    else if (Array.isArray(data)) {
        data.forEach((item, index) => {
            if (item.name) {
                markdown += `### ${index + 1}. ${item.name}\n\n`;
                if (item.description) {
                    markdown += `${item.description}\n\n`;
                }
                markdown += `---\n\n`;
            }
        });
    }
    // Если данные пришли в другом формате
    else if (data.topics && Array.isArray(data.topics)) {
        data.topics.forEach((topic, index) => {
            markdown += `### ${index + 1}. ${topic.title || topic.name}\n\n`;
            markdown += `${topic.description || ''}\n\n`;
            markdown += `---\n\n`;
        });
    }
    // Если ничего не подошло, показываем как есть, но с форматированием
    else {
        markdown += '```json\n' + JSON.stringify(data, null, 2) + '\n```';
    }

    return markdown;
}

// Также добавим функцию для форматирования ответов AI с подтемами
function formatAIResponse(response) {
    // Проверяем, содержит ли ответ JSON-подобную структуру
    if (response.includes('"themes":') || response.includes('"name":') || response.includes('"description":')) {
        try {
            // Пробуем найти JSON в ответе
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                if (jsonData.themes || Array.isArray(jsonData)) {
                    // Заменяем JSON на отформатированную версию
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

// Обновим функцию addAIMessageWithTyping
function addAIMessageWithTyping(markdownText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);

    // Форматируем текст перед отображением
    const formattedText = formatAIResponse(markdownText);
    typeWriterEffect(contentDiv, formattedText);
}

// Обновим функцию addAIMessage
function addAIMessage(markdownText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Форматируем текст перед отображением
    const formattedText = formatAIResponse(markdownText);
    contentDiv.innerHTML = marked.parse(formattedText);

    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Удаление темы
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
            currentThemeTitle.textContent = 'Выберите тему для изучения';
            currentThemeDescription.textContent = '';
            messagesContainer.innerHTML = '';
            userInput.disabled = true;
            sendBtn.disabled = true;
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Поиск тем
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const search = e.target.value;
        try {
            const topics = await api.getAllTopics(search);
            displayAllTopics(topics);
        } catch (error) {
            showNotification('Ошибка поиска', 'error');
        }
    }, 300);
});

// Отправка сообщения
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || !currentTopic) return;
    
    addUserMessage(message);
    userInput.value = '';
    userInput.style.height = 'auto';
    
    typingIndicator.style.display = 'flex';
    
    try {
        if (conversationContext.length > 5000) {
            conversationContext = conversationContext.slice(-5000);
            const messages = conversationContext.split('\n\n');
            if (messages.length > 10) {
                conversationContext = messages.slice(-10).join('\n\n');
            }
        }
        // Определяем, по какой теме общаемся (подтема или основная тема)
        const themeName = currentSubtopic ? currentSubtopic.name : currentTopic.title;
        const additionalInfo = currentSubtopic ? currentSubtopic.description : currentTopic.description;
        
        console.log('Отправка запроса:', {
            themeName,
            additionalInfo,
            message
        });

        const response = await api.learnWithAI(
            themeName,
            message,
            additionalInfo,
            conversationContext
        );

        console.log('Ответ от API:', response);
        
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

        // Сохраняем контекст для продолжения диалога
        conversationContext += `\nUser: ${message}\nAI: ${aiResponse}\n`;
        
        addAIMessageWithTyping(aiResponse);
    } catch (error) {
        typingIndicator.style.display = 'none';
        showNotification('Ошибка при получении ответа от AI', 'error');
        console.error('Send message error:', error);
    }
}

// Новая функция для прохождения теста по подтеме
async function takeSubtopicTest(subtopic) {
    if (!currentTopic) return;
    
    typingIndicator.style.display = 'flex';
    
    try {
        // Добавляем сообщение о начале теста
        addAIMessage(`📝 **Запрашиваю тест по теме:** ${subtopic.name}...`);
        
        // Вызываем эндпоинт для теста
        const response = await fetch(`${API_BASE_URL}/get_final_theme_test`, {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify({
                username: api.username,
                password: api.password,
                title: subtopic.name,
                description: subtopic.description
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка получения теста');
        }
        
        const data = await response.json();
        
        // Убираем индикатор печатания
        typingIndicator.style.display = 'none';
        
        // Выводим тест в чат
        addAIMessage(`## 📋 Тест: ${subtopic.name}\n\n${data.model_response || data.answer}`);
        
    } catch (error) {
        typingIndicator.style.display = 'none';
        showNotification('Ошибка при получении теста', 'error');
        console.error('Test error:', error);
    }
}

// Добавление сообщения пользователя
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(text)}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Добавление сообщения AI с анимацией
function addAIMessageWithTyping(markdownText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    
    typeWriterEffect(contentDiv, markdownText);
}

// Добавление сообщения AI без анимации
function addAIMessage(markdownText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = marked.parse(markdownText);
    
    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Эффект печатания
function typeWriterEffect(element, markdownText, speed = 20) {
    const htmlContent = marked.parse(markdownText);
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    let i = 0;
    
    function type() {
        if (i < plainText.length) {
            const progress = i / plainText.length;
            const htmlLength = htmlContent.length;
            const charsToShow = Math.floor(htmlLength * progress);
            
            element.innerHTML = htmlContent.substring(0, charsToShow);
            
            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            i++;
            setTimeout(type, speed);
        } else {
            element.innerHTML = htmlContent;
            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            typingIndicator.style.display = 'none';
        }
        
        scrollToBottom();
    }
    
    setTimeout(type, 300);
}

// Показ основного приложения
function showMainApp() {
    authPage.style.display = 'none';
    mainApp.style.display = 'flex';
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Отправка сообщения
    sendBtn.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Модальное окно
    addTopicBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', () => {
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
    
    // Создание темы
    createTopicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('topic-title').value;
        const description = document.getElementById('topic-description').value;
        
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

// Вспомогательные функции
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showLoading(show) {
    // Можно добавить глобальный индикатор загрузки
    if (show) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}