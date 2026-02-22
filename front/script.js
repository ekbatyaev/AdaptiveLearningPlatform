// Данные тем из JSON
const themesData = {
    "themes": [
        {
            "name": "Основы синтаксиса Python",
            "description": "Изучение основных синтаксических конструкций языка Python, включая переменные, операторы, условные операторы и циклы. Приобретение навыков написания простых программ."
        },
        {
            "name": "Работа с типами данных в Python",
            "description": "Изучение различных типов данных в Python (числа, строки, списки, кортежи, словари) и операций с ними. Приобретение навыков преобразования типов и работы с коллекциями данных."
        },
        {
            "name": "Функции и модули в Python",
            "description": "Изучение функций в Python, включая аргументы, параметры и возвращаемые значения. Ознакомление с модулями и библиотеками, такими как import и использование функций из сторонних библиотек."
        },
        {
            "name": "Работа со списками и кортежами",
            "description": "Изучение списков и кортежей в Python, их создание, изменение и обработка. Приобретение навыков работы с элементами коллекций, срезами и методами для работы со списками и кортежами."
        },
        {
            "name": "Словари и множества в Python",
            "description": "Изучение словарей и множеств в Python, их создание и работа с элементами. Приобретение навыков использования этих структур данных для решения задач, включая поиск, добавление и удаление элементов."
        },
        {
            "name": "Основы объектно-ориентированного программирования в Python",
            "description": "Введение в объектно-ориентированное программирование (ООП) в Python. Изучение классов, объектов, наследования и полиморфизма. Приобретение навыков создания собственных классов и использования ООП для решения задач."
        },
        {
            "name": "Работа с файлами в Python",
            "description": "Изучение чтения данных из файлов и записи данных в файлы. Ознакомление с методами работы с текстовыми и бинарными файлами. Приобретение навыков обработки файлов различных форматов."
        },
        {
            "name": "Исключения и обработка ошибок в Python",
            "description": "Изучение исключений в Python и их обработки. Ознакомление с блоками try-except и другими механизмами обработки ошибок. Приобретение навыков написания устойчивых к ошибкам программ."
        },
        {
            "name": "Введение в библиотеки и фреймворки для Python",
            "description": "Ознакомление с популярными библиотеками и фреймворками для Python, такими как NumPy, Pandas, Matplotlib и другие. Приобретение навыков работы с этими инструментами для решения различных задач."
        },
        {
            "name": "Основы работы с библиотекой NumPy",
            "description": "Изучение основ работы с библиотекой NumPy для научных вычислений. Ознакомление с массивами, функциями для работы с массивами и их применением в решении математических задач."
        }
    ]
};

// Пример ответов с Markdown
const mockAIResponses = {
    "синтаксис": `# Основы синтаксиса Python

Python известен своим чистым и читаемым синтаксисом. Вот основные элементы:

## 1. Переменные и типы данных

В Python не нужно явно объявлять тип переменной:

\`\`\`python
# Числа
age = 25
price = 19.99

# Строки
name = "Анна"
greeting = 'Привет, мир!'

# Логические значения
is_active = True
is_completed = False
\`\`\`

## 2. Условные операторы

\`\`\`python
temperature = 22

if temperature > 30:
    print("Жарко")
elif temperature > 20:
    print("Тепло")
else:
    print("Прохладно")
\`\`\`

## 3. Циклы

**Цикл for:**
\`\`\`python
for i in range(5):
    print(f"Итерация {i}")
\`\`\`

**Цикл while:**
\`\`\`python
count = 0
while count < 3:
    print(f"Счет: {count}")
    count += 1
\`\`\`

## 4. Функции

\`\`\`python
def greet(name):
    """Приветствует пользователя по имени"""
    return f"Привет, {name}!"

message = greet("Мария")
print(message)  # Привет, Мария!
\`\`\`

## 🎯 Практические советы

1. **Отступы имеют значение** - в Python они заменяют фигурные скобки
2. **Используйте осмысленные имена переменных**
3. **Комментируйте сложные части кода**
4. **Следуйте PEP 8** - руководству по стилю Python

> **Совет:** Начните с простых программ и постепенно усложняйте задачи.`

};

// DOM элементы
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const themesList = document.getElementById('themes-list');
const typingIndicator = document.getElementById('typing-indicator');
const quickButtons = document.querySelectorAll('.quick-btn');

// Настройка автовысоты для textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

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

// Загрузка тем
function loadThemes() {
    themesData.themes.forEach(theme => {
        const themeCard = document.createElement('div');
        themeCard.className = 'theme-card';
        themeCard.innerHTML = `
            <h3>${theme.name}</h3>
            <p>${theme.description}</p>
        `;
        themeCard.addEventListener('click', () => {
            userInput.value = `Расскажи подробнее о теме: ${theme.name}`;
            sendMessage();
        });
        themesList.appendChild(themeCard);
    });
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

// Добавление сообщения AI
function addAIMessage(markdownText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    
    // Преобразуем Markdown в HTML
    const htmlContent = marked.parse(markdownText);
    contentDiv.innerHTML = htmlContent;
    
    // Подсветка синтаксиса
    contentDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    scrollToBottom();
}

// Добавление сообщения AI с анимацией печатания
function addAIMessageWithTyping(markdownText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    messageDiv.appendChild(contentDiv);
    
    messagesContainer.appendChild(messageDiv);
    
    // Начинаем анимацию печатания
    typeWriterEffect(contentDiv, markdownText);
}

// Эффект печатания
function typeWriterEffect(element, markdownText, speed = 20) {
    typingIndicator.style.display = 'flex';
    
    // Сначала преобразуем Markdown в HTML
    const htmlContent = marked.parse(markdownText);
    
    // Создаем временный элемент для извлечения текста
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    let i = 0;
    let currentHtml = '';
    
    function type() {
        if (i < plainText.length) {
            // Показываем пропорциональную часть HTML
            const progress = i / plainText.length;
            const htmlLength = htmlContent.length;
            const charsToShow = Math.floor(htmlLength * progress);
            
            currentHtml = htmlContent.substring(0, charsToShow);
            element.innerHTML = currentHtml;
            
            // Подсвечиваем код, если он есть
            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            i++;
            setTimeout(type, speed);
        } else {
            // Показываем полный HTML
            element.innerHTML = htmlContent;
            element.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            typingIndicator.style.display = 'none';
            scrollToBottom();
        }
        
        scrollToBottom();
    }
    
    // Небольшая задержка перед началом печатания
    setTimeout(() => {
        type();
    }, 300);
}

// Прокрутка вниз
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Имитация ответа AI
function simulateAIResponse(userMessage) {
    // Показываем индикатор печатания
    typingIndicator.style.display = 'flex';
    
    setTimeout(() => {
        let response = `Привет! Я помогу вам изучить Python. 

## Что я могу:
- **Объяснить синтаксис Python**
- **Показать примеры кода**
- **Составить план обучения**
- **Ответить на вопросы по темам слева**

### Попробуйте:
1. Выберите тему из списка слева
2. Нажмите на кнопки быстрого доступа
3. Задайте свой вопрос

**Удачи в изучении Python!** 🐍`;

        // Проверяем ключевые слова
        for (const [keyword, aiResponse] of Object.entries(mockAIResponses)) {
            if (userMessage.toLowerCase().includes(keyword.toLowerCase())) {
                response = aiResponse;
                break;
            }
        }
        
        addAIMessageWithTyping(response);
    }, 1000);
}

// Отправка сообщения
function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    addUserMessage(message);
    userInput.value = '';
    userInput.style.height = 'auto';
    
    simulateAIResponse(message);
}

// Обработчики событий
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const topic = btn.dataset.topic;
        userInput.value = `Расскажи про ${topic}`;
        sendMessage();
    });
});

// Добавление приветственного сообщения
function addWelcomeMessage() {
    const welcomeMessage = `# 👋 Добро пожаловать в учебный помощник!

Я здесь, чтобы помочь вам изучить Python и составить персонализированный план обучения.

## 🎯 Как это работает:
1. **Выберите тему** из списка слева
2. **Задайте вопрос** в поле ввода
3. **Получите подробный ответ** с примерами кода и рекомендациями

## 📚 Доступные темы:
- Основы синтаксиса Python
- Работа с типами данных
- Функции и модули
- Объектно-ориентированное программирование
- И многое другое...

> **Совет:** Начните с кнопок быстрого доступа ниже, чтобы увидеть примеры ответов.

**Готовы начать?** Задайте свой первый вопрос!`;
    
    addAIMessage(welcomeMessage);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadThemes();
    addWelcomeMessage();
    userInput.focus();
});

// Информация для разработки
console.log('Интерфейс готов к работе!');
console.log('Для подключения к бэкенду замените simulateAIResponse на реальные API-вызовы.');