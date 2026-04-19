// 核心逻辑模块
import { parseQuestions } from './parser.js';
import { showNotification, showLoading } from './utils.js';



// 文件选择处理
export function handleFileSelect() {
    const file = window.fileInput.files[0];
    if (file) {
        window.fileName.textContent = file.name;
    } else {
        window.fileName.textContent = '未选择文件';
    }
}

// 加载题目文件
export function loadQuestions() {
    const file = window.fileInput.files[0];
    if (!file) {
        showNotification('请先选择题目文件', 'error');
        return;
    }

    showLoading(true);
    showNotification('正在加载题目...', 'success');

    const reader = new FileReader();
    reader.onload = function (e) {
        showLoading(false);
        const content = e.target.result;
        window.questions = parseQuestions(content);
        if (window.questions.length > 0) {
            // 提取所有标签
            window.tags.clear();
            window.questions.forEach(q => {
                if (q.tag) window.tags.add(q.tag);
            });

            // 渲染标签过滤器
            window.renderFilterTags();

            window.showQuestionList();
            window.showCurrentQuestion();
            window.progressInfo.classList.remove('hidden');
            window.updateStatistics();
            showNotification(`已成功加载 ${window.questions.length} 道题目`, 'success');
            
            // 隐藏文件选择提示
            const fileCard = document.getElementById('file-upload-card');
            if (fileCard) {
                fileCard.classList.add('hidden');
            }
        } else {
            showNotification('未找到有效题目，请检查文件格式', 'error');
        }
    };

    reader.readAsText(file, 'UTF-8');
}

// 显示文件选择输入框
export function showFileInput() {
    const fileCard = document.getElementById('file-upload-card');
    if (fileCard) {
        fileCard.classList.remove('hidden');
        console.log('显示文件选择卡片');
    } else {
        console.error('未找到文件选择卡片');
    }
}

// 检查答案
export function checkAnswer() {
    const question = window.questions[window.currentQuestionIndex];
    const correctAnswer = question.answer;
    const userAnswer = window.userAnswers[question.number] || '';

    // 判断是否是多选题
    const isMultiChoice = question.title.includes('多选');

    let isCorrect = false;
    if (isMultiChoice) {
        // 多选题
        const userSelected = Array.isArray(userAnswer) ?
            userAnswer.sort().join('') : userAnswer;
        const correctSelected = correctAnswer.split('').sort().join('');
        isCorrect = userSelected === correctSelected;
    } else {
        // 单选题
        isCorrect = userAnswer === correctAnswer;
    }

    // 显示正确和错误答案
    window.optionsContainer.querySelectorAll('.option').forEach(option => {
        const key = option.dataset.key;
        option.classList.remove('correct', 'incorrect');

        if (correctAnswer.includes(key)) {
            option.classList.add('correct');
        }

        if (Array.isArray(userAnswer)) {
            if (userAnswer.includes(key) && !correctAnswer.includes(key)) {
                option.classList.add('incorrect');
            }
        } else {
            if (userAnswer === key && !correctAnswer.includes(key)) {
                option.classList.add('incorrect');
            }
        }
    });

    // 显示题解
    window.explanationContent.innerHTML = ''; // 清空原有内容
    if (question.explanation) {
        window.renderTextWithCode(window.explanationContent, question.explanation);
    } else {
        window.explanationContent.textContent = '无题解';
    }

    window.explanation.style.display = 'block';

    // 如果答错了，显示加入错题本按钮
    if (!isCorrect && userAnswer !== '') {
        window.addToErrorBtn.classList.remove('hidden');
    } else {
        window.addToErrorBtn.classList.add('hidden');
    }

    // 更新题目列表状态
    window.updateQuestionList();
    window.updateStatistics();
}

// 添加到错题本
export function addToErrorBook() {
    const question = window.questions[window.currentQuestionIndex];
    const userAnswer = window.userAnswers[question.number] || '';
    
    if (!userAnswer) {
        showNotification('请先选择答案', 'error');
        return;
    }
    
    window.errorBook[question.number] = {
        question: question,
        userAnswer: userAnswer,
        timestamp: new Date().toISOString()
    };
    
    window.saveUserDataToLocalStorage();
    window.updateQuestionList();
    window.updateStatistics();
    showNotification('已添加到错题本', 'success');
    window.addToErrorBtn.classList.add('hidden');
}

// 切换收藏状态
export function toggleFavorite() {
    const question = window.questions[window.currentQuestionIndex];
    const questionNumber = question.number;
    
    if (window.favorites[questionNumber]) {
        delete window.favorites[questionNumber];
        showNotification('已取消收藏', 'success');
    } else {
        window.favorites[questionNumber] = {
            question: question,
            timestamp: new Date().toISOString()
        };
        showNotification('已添加到收藏', 'success');
    }
    
    window.saveUserDataToLocalStorage();
    window.updateQuestionList();
    updateFavoriteButton();
}

// 更新收藏按钮状态
export function updateFavoriteButton() {
    const question = window.questions[window.currentQuestionIndex];
    if (!question || !window.toggleFavoriteBtn) return;
    
    const isFavorite = window.favorites[question.number];
    window.toggleFavoriteBtn.innerHTML = isFavorite ? '★ 已收藏' : '☆ 收藏';
    window.toggleFavoriteBtn.classList.toggle('btn-warning', isFavorite);
    window.toggleFavoriteBtn.classList.toggle('btn-secondary', !isFavorite);
    
    // 总是显示收藏按钮
    window.toggleFavoriteBtn.classList.remove('hidden');
}

// 下一题
export function nextQuestion() {
    if (window.questions.length === 0) return;
    
    if (window.currentQuestionIndex < window.questions.length - 1) {
        window.currentQuestionIndex++;
        window.showCurrentQuestion();
    } else {
        showNotification('已经是最后一题了', 'error');
    }
}

// 上一题
export function prevQuestion() {
    if (window.questions.length === 0) return;
    
    if (window.currentQuestionIndex > 0) {
        window.currentQuestionIndex--;
        window.showCurrentQuestion();
    } else {
        showNotification('已经是第一题了', 'error');
    }
}

// 过滤题目
export function filterQuestions() {
    const searchTerm = (window.searchInput.value || '').toLowerCase();
    const filteredQuestions = window.getFilteredQuestions();
    
    window.questionList.innerHTML = '';
    
    filteredQuestions.forEach((question, index) => {
        const originalIndex = window.questions.indexOf(question);
        const item = document.createElement('div');
        item.className = 'question-item';
        item.textContent = originalIndex + 1;
        item.dataset.index = originalIndex;
        
        if (originalIndex === window.currentQuestionIndex) {
            item.classList.add('active');
        }
        
        if (window.userAnswers[question.number]) {
            item.classList.add('answered');
        }
        
        if (window.errorBook[question.number]) {
            item.classList.add('error');
        }
        
        // 标记收藏
        if (window.favorites && window.favorites[question.number]) {
            item.classList.add('favorite');
        }
        
        item.addEventListener('click', () => {
            window.currentQuestionIndex = originalIndex;
            window.showCurrentQuestion();
        });
        
        window.questionList.appendChild(item);
    });
    
    // 如果没有搜索到任何题目
    if (filteredQuestions.length === 0) {
        window.questionList.innerHTML = '<div class="no-results">没有找到匹配的题目</div>';
    }
}

// 获取过滤后的题目
export function getFilteredQuestions() {
    const searchTerm = (window.searchInput.value || '').toLowerCase();
    
    return window.questions.filter(question => {
        // 标签过滤
        if (window.activeTag !== null && question.tag !== window.activeTag) {
            return false;
        }
        
        // 搜索过滤
        if (searchTerm) {
            const hay = (question.title || '') + '|' + (question.tag || '') + '|' + (question.subject || '');
            return hay.toLowerCase().includes(searchTerm);
        }
        
        return true;
    });
}

// 过滤错题本
export function filterErrorBook() {
    window.renderErrorBook();
}

// 过滤收藏夹
export function filterFavorites() {
    if (typeof window.renderFavorites === 'function') {
        window.renderFavorites();
    }
}

// 更新统计信息
export function updateStatistics() {
    if (window.questions.length === 0) {
        window.totalCountEl.textContent = '0';
        window.answeredCountEl.textContent = '0';
        window.correctRateEl.textContent = '0%';
        window.errorCountEl.textContent = '0';
        window.renderSubjectStats({});
        return;
    }
    
    // 总题数
    window.totalCountEl.textContent = window.questions.length;
    
    // 已答题数
    const answeredCount = Object.keys(window.userAnswers).length;
    window.answeredCountEl.textContent = answeredCount;
    
    // 错题数
    const errorCount = Object.keys(window.errorBook).length;
    window.errorCountEl.textContent = errorCount;
    
    // 正确率
    let correctCount = 0;
    window.questions.forEach(question => {
        const userAnswer = window.userAnswers[question.number];
        if (userAnswer) {
            const correctAnswer = question.answer;
            const isMultiChoice = question.title.includes('多选');
            
            if (isMultiChoice) {
                const userSelected = Array.isArray(userAnswer) ? 
                    userAnswer.sort().join('') : userAnswer;
                const correctSelected = correctAnswer.split('').sort().join('');
                if (userSelected === correctSelected) {
                    correctCount++;
                }
            } else {
                if (userAnswer === correctAnswer) {
                    correctCount++;
                }
            }
        }
    });
    
    const correctRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    window.correctRateEl.textContent = `${correctRate}%`;
    
    // 科目统计
    const subjectStats = {};
    window.questions.forEach(question => {
        const subject = question.subject || '未分类';
        if (!subjectStats[subject]) {
            subjectStats[subject] = { total: 0, answered: 0 };
        }
        subjectStats[subject].total++;
        
        if (window.userAnswers[question.number]) {
            subjectStats[subject].answered++;
        }
    });
    
    window.renderSubjectStats(subjectStats);
}