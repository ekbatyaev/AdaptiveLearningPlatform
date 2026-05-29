const API_BASE_URL = 'http://127.0.0.1:8000';

class ApiClient {
    constructor() {
        this.username = null;
        this.password = null;
    }

    setCredentials(username, password) {
        this.username = username;
        this.password = password;
    }

    getHeaders() {
        if (!this.username || !this.password) {
            return {
                'Content-Type': 'application/json'
            };
        }

        return {
            'username': this.username,
            'password': this.password,
            'Content-Type': 'application/json'
        };
    }

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

    async getCurrentUser() {
        const response = await fetch(`${API_BASE_URL}/users/info`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Ошибка получения информации о пользователе');
        }

        return await response.json();
    }

    async updateAchievement(userId, completedCommonThemeId, completedThemeName, score) {
        const response = await fetch(`${API_BASE_URL}/users/update_achievement`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                user_id: userId,
                completed_common_theme_id: completedCommonThemeId,
                completed_theme_name: completedThemeName,
                score: score
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка обновления достижений');
        }

        return await response.json();
    }

    async getAllAchievementsUsers() {
        const response = await fetch(`${API_BASE_URL}/users/all_achievement`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка получения достижений');
        }

        return await response.json();
    }

    async checkThemeAvailability(userId, commonThemeId, themeName) {
        const response = await fetch(`${API_BASE_URL}/users/theme_availability`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                user_id: userId,
                common_theme_id: commonThemeId,
                theme_name: themeName
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка проверки доступности темы');
        }

        return await response.json();
    }


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

    async getMyTopics() {
        const response = await fetch(`${API_BASE_URL}/users/topics`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('Ошибка получения своих тем');
        }

        return await response.json();
    }

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

    async getTopicById(topicId) {
        const response = await fetch(`${API_BASE_URL}/topicsinfo`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({ topicid: topicId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail);
        }

        return await response.json();
    }

  async generateExplanation(themeName, additionalInfo = '') {
        const response = await fetch(`${API_BASE_URL}/generate_explanation`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    theme_name: themeName,
                    additional_info: additionalInfo
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Ошибка при генерации объяснения');
            }

            return await response.json();
        }

        async discussTestWithUser(themeName, userRequest, additionalInfo = '', oldContext = '') {
        const response = await fetch(`${API_BASE_URL}/test_discussing_with_user`, {
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
            throw new Error(error.detail || 'Ошибка при проверке теста');
        }

        return await response.json();
    }

    async chatWithUser(themeName, userRequest, additionalInfo = '', oldContext = '') {
        const response = await fetch(`${API_BASE_URL}/chatting_with_user`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
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

    async getFinalTest(title, description) {
        const response = await fetch(`${API_BASE_URL}/get_final_theme_test`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
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

    async deleteTopic(topicId) {
        const response = await fetch(`${API_BASE_URL}/topics/delete`, {
            method: 'DELETE',
            headers: this.getHeaders(),
            body: JSON.stringify({
                topic_id: topicId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка удаления темы');
        }

        return await response.json();
    }

    async updateTopic(topicId, title, description) {
        const response = await fetch(`${API_BASE_URL}/topics/update`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
                topic_id: topicId,
                title: title,
                description: description
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка обновления темы');
        }

        return await response.json();
    }

    async getStats() {
        const response = await fetch(`${API_BASE_URL}/stats`);

        if (!response.ok) {
            throw new Error('Ошибка получения статистики');
        }

        return await response.json();
    }

    async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

const api = new ApiClient();