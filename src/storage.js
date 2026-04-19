// 存储管理模块

// 从本地存储加载用户数据
export function loadUserDataFromLocalStorage() {
    try {
        const savedAnswers = localStorage.getItem('userAnswers');
        const savedErrorBook = localStorage.getItem('errorBook');
        const savedFavorites = localStorage.getItem('favorites');
        
        if (savedAnswers) {
            window.userAnswers = JSON.parse(savedAnswers);
        } else {
            window.userAnswers = {};
        }
        
        if (savedErrorBook) {
            window.errorBook = JSON.parse(savedErrorBook);
        } else {
            window.errorBook = {};
        }
        
        if (savedFavorites) {
            window.favorites = JSON.parse(savedFavorites);
        } else {
            window.favorites = {};
        }
    } catch (e) {
        console.error('加载本地存储数据失败:', e);
        window.userAnswers = {};
        window.errorBook = {};
        window.favorites = {};
    }
}

// 保存用户数据到本地存储
export function saveUserDataToLocalStorage() {
    try {
        localStorage.setItem('userAnswers', JSON.stringify(window.userAnswers || {}));
        localStorage.setItem('errorBook', JSON.stringify(window.errorBook || {}));
        localStorage.setItem('favorites', JSON.stringify(window.favorites || {}));
    } catch (e) {
        console.error('保存到本地存储失败:', e);
    }
}

// 重置统计数据和错题本
export function resetStatistics() {
    if (confirm('确定要重置所有数据吗？这将清除所有答题记录、错题本和收藏。')) {
        window.userAnswers = {};
        window.errorBook = {};
        window.favorites = {};
        localStorage.removeItem('userAnswers');
        localStorage.removeItem('errorBook');
        localStorage.removeItem('favorites');
        
        // 重新渲染相关UI
        if (typeof window.updateStatistics === 'function') {
            window.updateStatistics();
        }
        if (typeof window.renderErrorBook === 'function') {
            window.renderErrorBook();
        }
        if (typeof window.updateQuestionList === 'function') {
            window.updateQuestionList();
        }
        
        window.showNotification('数据已重置', 'success');
    }
}