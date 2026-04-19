// 主应用入口
import { renderTextWithCode, showNotification } from './utils.js';
import { loadUserDataFromLocalStorage, saveUserDataToLocalStorage, resetStatistics } from './storage.js';
import { showCurrentQuestion, updateProgressBar, renderFilterTags, renderErrorBook, showQuestionList, updateQuestionList, renderSubjectStats, renderFavorites } from './ui.js';
import { handleFileSelect, loadQuestions, showFileInput, checkAnswer, addToErrorBook, nextQuestion, prevQuestion, filterQuestions, getFilteredQuestions, filterErrorBook, filterFavorites, updateStatistics, toggleFavorite, updateFavoriteButton } from './core.js';

// 全局状态
window.questions = [];
window.currentQuestionIndex = 0;
window.userAnswers = {};
window.errorBook = {};
window.favorites = {};
window.tags = new Set();
window.activeTag = null;

// 导出函数到window对象，供其他模块使用
window.renderTextWithCode = renderTextWithCode;
window.showNotification = showNotification;
window.saveUserDataToLocalStorage = saveUserDataToLocalStorage;
window.updateProgressBar = updateProgressBar;
window.renderFilterTags = renderFilterTags;
window.renderErrorBook = renderErrorBook;
window.showQuestionList = showQuestionList;
window.updateQuestionList = updateQuestionList;
window.renderSubjectStats = renderSubjectStats;
window.renderFavorites = renderFavorites;
window.showFileInput = showFileInput;
window.updateStatistics = updateStatistics;
window.getFilteredQuestions = getFilteredQuestions;
window.toggleFavorite = toggleFavorite;
window.updateFavoriteButton = updateFavoriteButton;



// 键盘快捷键支持
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // 忽略在输入框中的按键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch(e.key) {
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                nextQuestion();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevQuestion();
                break;
            case 'Enter':
                e.preventDefault();
                checkAnswer();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
                e.preventDefault();
                // 选择选项
                const options = document.querySelectorAll('.option');
                const index = parseInt(e.key) - 1;
                if (index < options.length) {
                    options[index].click();
                }
                break;
            case 'e':
                e.preventDefault();
                // 添加到错题本
                if (!window.addToErrorBtn.classList.contains('hidden')) {
                    window.addToErrorBtn.click();
                }
                break;
            case 'Escape':
                e.preventDefault();
                // 清除搜索
                window.searchInput.value = '';
                window.filterQuestions();
                break;
        }
    });
}

// 初始化
function init() {
    // 从本地存储加载数据
    loadUserDataFromLocalStorage();
    
    // 初始化DOM元素引用
    window.fileInput = document.getElementById('file-input');
    window.fileName = document.getElementById('file-name');
    window.loadBtn = document.getElementById('load-btn');
    window.questionContainer = document.getElementById('question-container');
    window.questionSubject = document.getElementById('question-subject');
    window.questionLevel = document.getElementById('question-level');
    window.questionTag = document.getElementById('question-tag');
    window.questionNumber = document.getElementById('question-number');
    window.questionTitle = document.getElementById('question-title');
    window.optionsContainer = document.getElementById('options');
    window.checkBtn = document.getElementById('check-btn');
    window.nextBtn = document.getElementById('next-btn');
    window.prevBtn = document.getElementById('prev-btn');
    window.addToErrorBtn = document.getElementById('add-to-error-btn');
    window.toggleFavoriteBtn = document.getElementById('toggle-favorite-btn');
    window.explanation = document.getElementById('explanation');
    window.explanationContent = document.getElementById('explanation-content');
    window.questionList = document.getElementById('question-list');
    window.progressInfo = document.getElementById('progress-info');
    window.currentQuestionSpan = document.getElementById('current-question');
    window.totalQuestionsSpan = document.getElementById('total-questions');
    window.progressBar = document.getElementById('progress-bar');
    window.searchInput = document.getElementById('search-input');
    window.errorSearchInput = document.getElementById('error-search-input');
    window.filterTags = document.getElementById('filter-tags');
    window.errorBookList = document.getElementById('error-book-list');
    window.mainTabs = document.getElementById('main-tabs');
    window.tabContents = document.querySelectorAll('.tab-content');
    window.totalCountEl = document.getElementById('total-count');
    window.answeredCountEl = document.getElementById('answered-count');
    window.correctRateEl = document.getElementById('correct-rate');
    window.errorCountEl = document.getElementById('error-count');
    window.subjectStatsEl = document.getElementById('subject-stats');
    
    // 事件监听器
    document.getElementById('reset-stats-btn').addEventListener('click', resetStatistics);
    window.fileInput.addEventListener('change', handleFileSelect);
    window.loadBtn.addEventListener('click', loadQuestions);
    window.checkBtn.addEventListener('click', checkAnswer);
    window.nextBtn.addEventListener('click', nextQuestion);
    window.prevBtn.addEventListener('click', prevQuestion);
    window.addToErrorBtn.addEventListener('click', addToErrorBook);
    window.toggleFavoriteBtn.addEventListener('click', toggleFavorite);
    window.searchInput.addEventListener('input', filterQuestions);
    window.errorSearchInput.addEventListener('input', filterErrorBook);
    document.getElementById('favorites-search-input').addEventListener('input', filterFavorites);

    // 设置键盘快捷键
    setupKeyboardShortcuts();

    // 显示文件选择界面
    showFileInput();

    // 标签页切换事件
    window.mainTabs.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            window.mainTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            window.tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-content`).classList.add('active');

            // 如果切换到错题本,重新渲染错题列表
            if (tabId === 'error-book') {
                renderErrorBook();
            } else if (tabId === 'favorites') {
                renderFavorites();
            } else if (tabId === 'statistics') {
                updateStatistics();
            }
        });
    });
}

// 当DOM加载完成时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}