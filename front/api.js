// Конфигурация API
const API_BASE_URL = 'http://127.0.0.1:8000';

// Класс для работы с API
class ApiClient {
    constructor() {
        this.username = null;
        this.password = null;
    }

    // Установка учетных данных
    setCredentials(username, password) {
        this.username = username;
        this.password = password;
    }

    // Получение заголовков для авторизации
    getHeaders() {
        if (!this.username || !this.password) {
            return {};
        }
        return {
            'username': this.username,
            'password': this.password,
            'Content-Type': 'application/json'
        };
    }

    // Регистрация пользователя
    async register(username, password) {
        const response = await fetch(`${API_BASE_URL}/user_register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка регистрации');
        }

        return await response.json();
    }

    // Вход пользователя
    async login(username, password) {
        const response = await fetch(`${API_BASE_URL}/user_login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка входа');
        }

        const userData = await response.json();
        this.setCredentials(username, password);
        return userData;
    }

    // Получение информации о себе
    async getCurrentUser() {
        const response = await fetch(`${API_BASE_URL}/users/info`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Ошибка получения информации о пользователе');
        }

        return await response.json();
    }

    // Получение всех тем
    async getAllTopics(search = '') {
        let url = `${API_BASE_URL}/topics`;
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Ошибка получения тем');
        }

        return await response.json();
    }

    // Получение своих тем
    async getMyTopics() {
        const response = await fetch(`${API_BASE_URL}/users/me/topics`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Ошибка получения своих тем');
        }

        return await response.json();
    }

    // Создание темы
    async createTopic(title, description) {
        const response = await fetch(`${API_BASE_URL}/create_topic`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ 
                title, 
                description,
                data_json: {} 
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка создания темы');
        }

        return await response.json();
    }

    // Получение темы по ID
    async getTopicById(topicId) {
        const response = await fetch(`${API_BASE_URL}/topics/get_info_${topicId}`);
        
        if (!response.ok) {
            throw new Error('Ошибка получения темы');
        }

        return await response.json();
    }

    // Обучение с AI
    async learnWithAI(themeName, userRequest, additionalInfo = '', oldContext = '') {
        const response = await fetch(`${API_BASE_URL}/theme_learning`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                username: this.username,
                password: this.password,
                user_request: userRequest,
                theme_name: themeName,
                additional_info: additionalInfo,
                old_context: oldContext
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка при обращении к AI');
        }

        return await response.json();
    }

    // Получение финального теста
    async getFinalTest(title, description) {
        const response = await fetch(`${API_BASE_URL}/get_final_theme_test`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                username: this.username,
                password: this.password,
                title,
                description
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка получения теста');
        }

        return await response.json();
    }

    // Удаление темы
    async deleteTopic(topicId) {
        const response = await fetch(`${API_BASE_URL}/topics/delete_${topicId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка удаления темы');
        }

        return await response.json();
    }

    // Обновление темы
    async updateTopic(topicId, title, description) {
        const response = await fetch(`${API_BASE_URL}/topics/update_${topicId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ title, description })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка обновления темы');
        }

        return await response.json();
    }

    // Получение статистики
    async getStats() {
        const response = await fetch(`${API_BASE_URL}/stats`);
        
        if (!response.ok) {
            throw new Error('Ошибка получения статистики');
        }

        return await response.json();
    }

    // Проверка здоровья API
    async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Создаем глобальный экземпляр API клиента
const api = new ApiClient();