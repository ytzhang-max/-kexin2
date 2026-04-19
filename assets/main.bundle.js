// 捆绑版本 - 科目二刷题系统
// 合并所有模块以避免ES6模块在file://协议下的限制
// 生成时间: 2026-04-19T18:26:06.079Z


// ========== src/utils.js ==========
// 工具函数模块

// 通用渲染函数：处理包含 ``` 代码块的文本
function renderTextWithCode(container, text) {
    if (!text && text !== '') return;
    const parts = String(text).split(/```/g);
    parts.forEach((part, idx) => {
        if (idx % 2 === 0) {
            // 普通文本，保留换行
            const div = document.createElement('div');
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-word';
            div.textContent = part;
            container.appendChild(div);
        } else {
            // 代码块
            const pre = document.createElement('pre');
            pre.className = 'code-block';
            pre.textContent = part;
            container.appendChild(pre);
        }
    });
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 显示加载状态
function showLoading(show = true) {
    let loadingOverlay = document.getElementById('loading-overlay');
    
    if (show) {
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(loadingOverlay);
        }
        loadingOverlay.style.display = 'flex';
    } else if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// ========== src/storage.js ==========
// 存储管理模块

// 从本地存储加载用户数据
function loadUserDataFromLocalStorage() {
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
function saveUserDataToLocalStorage() {
    try {
        localStorage.setItem('userAnswers', JSON.stringify(window.userAnswers || {}));
        localStorage.setItem('errorBook', JSON.stringify(window.errorBook || {}));
        localStorage.setItem('favorites', JSON.stringify(window.favorites || {}));
    } catch (e) {
        console.error('保存到本地存储失败:', e);
    }
}

// 重置统计数据和错题本
function resetStatistics() {
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

// ========== src/parser.js ==========
// 题目解析模块

// 解析题目内容
function parseQuestions(content) {
    const questions = [];
    let lines = content.split('\n');
    let currentQuestion = null;
    let inExplanation = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '') {
            continue;
        }

        if (line === '------------') {
            if (currentQuestion && Object.keys(currentQuestion).length > 0) {
                questions.push(currentQuestion);
                currentQuestion = null;
                inExplanation = false;
            }
            continue;
        }

        if (inExplanation && currentQuestion) {
            currentQuestion.explanation += '\n' + line;
            continue;
        }

        if (line.startsWith('【科目】')) {
            currentQuestion = {options: []};
            currentQuestion.subject = line.replace('【科目】', '').trim();
        } else if (currentQuestion && line.startsWith('【认证级别】')) {
            currentQuestion.level = line.replace('【认证级别】', '').trim();
        } else if (currentQuestion && line.startsWith('【标签】')) {
            currentQuestion.tag = line.replace('【标签】', '').trim();
        } else if (currentQuestion && line.startsWith('【题号】')) {
            currentQuestion.number = line.replace('【题号】', '').trim();
        } else if (currentQuestion && line.startsWith('【题目】')) {
            let title = line.replace('【题目】', '').trim();
            let j = i + 1;
            let inCodeBlock = false;
            while (j < lines.length) {
                const nextLine = lines[j].trim();
                // 检查是否进入或退出代码块
                if (nextLine.startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                }
                // 如果遇到下一个标签或题目分隔符，停止读取
                // 但如果在代码块中，继续读取
                if (!inCodeBlock && (nextLine.match(/^[A-Z]\. /) || nextLine.startsWith('【') || nextLine === '------------')) {
                    break;
                }
                title += '\n' + lines[j]; // 保留原始行内容
                j++;
            }
            currentQuestion.title = title;
        } else if (currentQuestion && line.startsWith('【答案】')) {
            currentQuestion.answer = line.replace('【答案】', '').trim();
        } else if (currentQuestion && line.startsWith('【题解】')) {
            currentQuestion.explanation = '';
            inExplanation = true;
        } else if (currentQuestion && line.match(/^[A-Z]\. /)) {
            const key = line[0];
            let text = line.substring(3).trim(); // 提取选项键和初始文本
            let j = i + 1;
            let inOptionCodeBlock = false;
            // 继续读取后续行直到遇到下一个选项、答案、题解或题目结束
            while (j < lines.length) {
                const nextLine = lines[j].trim();
                // 检查是否进入或退出代码块
                if (nextLine.startsWith('```')) {
                    inOptionCodeBlock = !inOptionCodeBlock;
                }
                // 检查是否是下一个选项、答案、题解或题目分隔符
                // 但如果在代码块中，继续读取
                if (!inOptionCodeBlock && (nextLine.match(/^[A-Z]\. /) ||
                    nextLine.startsWith('【答案】') ||
                    nextLine.startsWith('【题解】') ||
                    nextLine === '------------')) {
                    break;
                }
                // 添加到选项文本中，保留原始换行
                text += '\n' + lines[j]; // 使用原始行（包含空格和空行）
                j++;
            }
            // 更新i的值到已处理的位置
            i = j - 1;
            currentQuestion.options.push({key, text});
        }
    }

    // 添加最后一个题目
    if (currentQuestion && Object.keys(currentQuestion).length > 0) {
        questions.push(currentQuestion);
    }

    return questions;
}

// ========== src/ui.js ==========
// UI渲染模块

// 显示当前题目
function showCurrentQuestion() {
    if (window.questions.length === 0) {
        return;
    }

    const question = window.questions[window.currentQuestionIndex];
    window.questionContainer.classList.remove('hidden');
    window.questionSubject.textContent = `科目: ${question.subject || ''}`;
    window.questionLevel.textContent = `级别: ${question.level || ''}`;
    window.questionTag.textContent = question.tag || '';
    window.questionNumber.textContent = `题号: ${question.number || ''}`;

    // 显示题目标题
    window.questionTitle.innerHTML = ''; // 清空原有内容
    renderTextWithCode(window.questionTitle, question.title || '');

    // 判断是单选还是多选
    const isMultiChoice = question.title.includes('多选');

    // 显示选项
    window.optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';

        const optionKey = document.createElement('div');
        optionKey.className = 'option-key';
        optionKey.textContent = option.key;

        const optionText = document.createElement('div');
        optionText.className = 'option-text';

        // 使用renderTextWithCode渲染选项文本，支持代码块
        renderTextWithCode(optionText, option.text || '');

        optionElement.appendChild(optionKey);
        optionElement.appendChild(optionText);

        optionElement.dataset.key = option.key;

        // 恢复用户之前的选择
        if (window.userAnswers[question.number]) {
            if (isMultiChoice) {
                if (Array.isArray(window.userAnswers[question.number]) &&
                    window.userAnswers[question.number].includes(option.key)) {
                    optionElement.classList.add('selected');
                }
            } else {
                if (window.userAnswers[question.number] === option.key) {
                    optionElement.classList.add('selected');
                }
            }
        }

        optionElement.addEventListener('click', () => {
            if (isMultiChoice) {
                optionElement.classList.toggle('selected');
                const selected = Array.from(
                    window.optionsContainer.querySelectorAll('.option.selected')
                ).map(el => el.dataset.key);
                window.userAnswers[question.number] = selected;
            } else {
                window.optionsContainer.querySelectorAll('.option').forEach(
                    el => el.classList.remove('selected')
                );
                optionElement.classList.add('selected');
                window.userAnswers[question.number] = option.key;
            }
            window.updateQuestionList();
            window.saveUserDataToLocalStorage();
            window.updateStatistics();
        });

        window.optionsContainer.appendChild(optionElement);
    });

    // 重置答案解释
    window.explanation.style.display = 'none';

    // 隐藏加入错题本按钮
    window.addToErrorBtn.classList.add('hidden');
    
    // 更新收藏按钮状态
    if (typeof window.updateFavoriteButton === 'function') {
        window.updateFavoriteButton();
    }

    // 更新题目导航
    window.updateQuestionList();
    window.currentQuestionSpan.textContent = window.currentQuestionIndex + 1;
    window.totalQuestionsSpan.textContent = window.questions.length;
    window.updateProgressBar();
}

// 更新进度条
function updateProgressBar() {
    if (window.questions.length === 0) return;

    const progress = ((window.currentQuestionIndex + 1) / window.questions.length) * 100;
    window.progressBar.style.width = `${progress}%`;
}

// 渲染标签过滤器
function renderFilterTags() {
    window.filterTags.innerHTML = '';

    // 添加"全部"标签
    const allTag = document.createElement('div');
    allTag.className = `filter-tag ${window.activeTag === null ? 'active' : ''}`;
    allTag.textContent = '全部';
    allTag.dataset.tag = '';
    allTag.addEventListener('click', () => {
        window.activeTag = null;
        window.renderFilterTags();
        window.filterQuestions();
    });
    window.filterTags.appendChild(allTag);

    // 添加所有标签
    Array.from(window.tags).sort().forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = `filter-tag ${window.activeTag === tag ? 'active' : ''}`;
        tagElement.textContent = tag;
        tagElement.dataset.tag = tag;
        tagElement.addEventListener('click', () => {
            window.activeTag = tag;
            window.renderFilterTags();
            window.filterQuestions();
        });
        window.filterTags.appendChild(tagElement);
    });
}

// 渲染错题本
function renderErrorBook() {
    window.errorBookList.innerHTML = '';

    const errorKeys = Object.keys(window.errorBook);

    if (errorKeys.length === 0) {
        window.errorBookList.innerHTML = '<div class="no-errors">错题本为空</div>';
        return;
    }

    const searchTerm = (window.errorSearchInput.value || '').toLowerCase();

    errorKeys.forEach(key => {
        const errorItem = window.errorBook[key];
        const question = errorItem.question;

        // 搜索过滤
        if (searchTerm) {
            const hay = (question.title || '') + '|' + (question.tag || '') + '|' + (question.subject || '');
            if (!hay.toLowerCase().includes(searchTerm)) return;
        }

        const errorElement = document.createElement('div');
        errorElement.className = 'error-item';

        const errorHeader = document.createElement('div');
        errorHeader.className = 'error-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'error-title';
        renderTextWithCode(titleDiv, question.title || '');
        const tagDiv = document.createElement('div');
        tagDiv.textContent = question.tag || '';

        errorHeader.appendChild(titleDiv);
        errorHeader.appendChild(tagDiv);

        const errorContent = document.createElement('div');
        errorContent.className = 'error-content';

        // 选项列表（用 DOM 构建，避免 innerHTML 注入问题）
        const optionsWrap = document.createElement('div');
        optionsWrap.className = 'options';

        (question.options || []).forEach(option => {
            const optEl = document.createElement('div');
            // 根据答案和用户答案设置 class
            let optClass = 'option';
            if (question.answer && question.answer.includes(option.key)) {
                optClass += ' correct';
            }
            const userAns = errorItem.userAnswer;
            if (Array.isArray(userAns)) {
                if (userAns.includes(option.key) && !(question.answer || '').includes(option.key)) {
                    optClass += ' incorrect';
                }
            } else {
                if (userAns === option.key && !(question.answer || '').includes(option.key)) {
                    optClass += ' incorrect';
                }
            }
            optEl.className = optClass;

            const kDiv = document.createElement('div');
            kDiv.className = 'option-key';
            kDiv.textContent = option.key;

            const tDiv = document.createElement('div');
            tDiv.className = 'option-text';
            renderTextWithCode(tDiv, option.text || '');

            optEl.appendChild(kDiv);
            optEl.appendChild(tDiv);
            optionsWrap.appendChild(optEl);
        });

        // 题解（带代码块）
        const explanationWrap = document.createElement('div');
        explanationWrap.className = 'explanation';
        explanationWrap.style.display = 'block';

        const explanationTitle = document.createElement('div');
        explanationTitle.className = 'explanation-title';
        explanationTitle.textContent = '题解:';

        const explanationContentDiv = document.createElement('div');
        if (question.explanation) {
            renderTextWithCode(explanationContentDiv, question.explanation);
        } else {
            explanationContentDiv.textContent = '无题解';
        }

        explanationWrap.appendChild(explanationTitle);
        explanationWrap.appendChild(explanationContentDiv);

        // 按钮
        const btnsDiv = document.createElement('div');
        btnsDiv.className = 'buttons';

        const btnMaster = document.createElement('button');
        btnMaster.className = 'btn btn-success';
        btnMaster.dataset.key = key;
        btnMaster.textContent = '我已掌握';

        const btnGoto = document.createElement('button');
        btnGoto.className = 'btn btn-secondary';
        btnGoto.dataset.key = key;
        btnGoto.dataset.index = window.questions.findIndex(q => q.number === key);
        btnGoto.textContent = '转到题目';

        btnsDiv.appendChild(btnMaster);
        btnsDiv.appendChild(btnGoto);

        errorContent.appendChild(optionsWrap);
        errorContent.appendChild(explanationWrap);
        errorContent.appendChild(btnsDiv);

        errorElement.appendChild(errorHeader);
        errorElement.appendChild(errorContent);

        // 点击头部展开/收起
        errorHeader.addEventListener('click', () => {
            errorContent.classList.toggle('active');
        });

        // 按钮事件
        btnMaster.addEventListener('click', (e) => {
            e.stopPropagation();
            delete window.errorBook[key];
            window.saveUserDataToLocalStorage();
            window.renderErrorBook();
            window.showNotification('已从错题本移除', 'success');
        });

        btnGoto.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            if (index >= 0 && index < window.questions.length) {
                window.currentQuestionIndex = index;
                window.showCurrentQuestion();
                // 切换到刷题模式
                window.mainTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                window.tabContents.forEach(c => c.classList.remove('active'));
                document.querySelector('.tab[data-tab="practice"]').classList.add('active');
                document.getElementById('practice-content').classList.add('active');
            }
        });

        window.errorBookList.appendChild(errorElement);
    });
}

// 显示题目列表
function showQuestionList() {
    window.questionList.innerHTML = '';
    
    window.questions.forEach((question, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        item.textContent = index + 1;
        item.dataset.index = index;
        
        if (index === window.currentQuestionIndex) {
            item.classList.add('active');
        }
        
        // 标记已回答的题目
        if (window.userAnswers[question.number]) {
            item.classList.add('answered');
        }
        
        // 标记错题
        if (window.errorBook[question.number]) {
            item.classList.add('error');
        }
        
        // 标记收藏
        if (window.favorites && window.favorites[question.number]) {
            item.classList.add('favorite');
        }
        
        item.addEventListener('click', () => {
            window.currentQuestionIndex = index;
            window.showCurrentQuestion();
        });
        
        window.questionList.appendChild(item);
    });
}

// 更新题目列表状态
function updateQuestionList() {
    const items = window.questionList.querySelectorAll('.question-item');
    items.forEach((item) => {
        const index = parseInt(item.dataset.index);
        if (isNaN(index) || index < 0 || index >= window.questions.length) {
            return;
        }
        const question = window.questions[index];
        item.classList.remove('active', 'answered', 'error', 'favorite');
        
        if (index === window.currentQuestionIndex) {
            item.classList.add('active');
        }
        
        if (window.userAnswers[question.number]) {
            item.classList.add('answered');
        }
        
        if (window.errorBook[question.number]) {
            item.classList.add('error');
        }
        
        if (window.favorites && window.favorites[question.number]) {
            item.classList.add('favorite');
        }
    });
}

// 渲染科目统计
function renderSubjectStats(stats) {
    window.subjectStatsEl.innerHTML = '';
    
    Object.entries(stats).forEach(([subject, data]) => {
        const statElement = document.createElement('div');
        statElement.className = 'subject-stat';
        
        const subjectName = document.createElement('div');
        subjectName.className = 'subject-name';
        subjectName.textContent = subject;
        
        const statBar = document.createElement('div');
        statBar.className = 'stat-bar';
        
        const statFill = document.createElement('div');
        statFill.className = 'stat-fill';
        const percentage = data.total > 0 ? Math.round((data.answered / data.total) * 100) : 0;
        statFill.style.width = `${percentage}%`;
        statFill.style.backgroundColor = percentage >= 80 ? 'var(--success-color)' : 
                                         percentage >= 50 ? 'var(--primary-color)' : 
                                         'var(--error-color)';
        
        const statText = document.createElement('div');
        statText.className = 'stat-text';
        statText.textContent = `${data.answered}/${data.total} (${percentage}%)`;
        
        statBar.appendChild(statFill);
        statElement.appendChild(subjectName);
        statElement.appendChild(statBar);
        statElement.appendChild(statText);
        
        window.subjectStatsEl.appendChild(statElement);
    });
}

// 渲染收藏夹
function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;
    
    favoritesList.innerHTML = '';
    
    const favoriteKeys = Object.keys(window.favorites || {});
    
    if (favoriteKeys.length === 0) {
        favoritesList.innerHTML = '<div class="no-errors">收藏夹为空</div>';
        return;
    }
    
    const searchTerm = (document.getElementById('favorites-search-input')?.value || '').toLowerCase();
    
    favoriteKeys.forEach(key => {
        const favoriteItem = window.favorites[key];
        const question = favoriteItem.question;
        
        // 搜索过滤
        if (searchTerm) {
            const hay = (question.title || '') + '|' + (question.tag || '') + '|' + (question.subject || '');
            if (!hay.toLowerCase().includes(searchTerm)) return;
        }
        
        const favoriteElement = document.createElement('div');
        favoriteElement.className = 'error-item';
        
        const favoriteHeader = document.createElement('div');
        favoriteHeader.className = 'error-header';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'error-title';
        renderTextWithCode(titleDiv, question.title || '');
        const tagDiv = document.createElement('div');
        tagDiv.textContent = question.tag || '';
        
        favoriteHeader.appendChild(titleDiv);
        favoriteHeader.appendChild(tagDiv);
        
        const favoriteContent = document.createElement('div');
        favoriteContent.className = 'error-content';
        
        // 选项列表
        const optionsWrap = document.createElement('div');
        optionsWrap.className = 'options';
        
        (question.options || []).forEach(option => {
            const optEl = document.createElement('div');
            optEl.className = 'option';
            
            const kDiv = document.createElement('div');
            kDiv.className = 'option-key';
            kDiv.textContent = option.key;
            
            const tDiv = document.createElement('div');
            tDiv.className = 'option-text';
            renderTextWithCode(tDiv, option.text || '');
            
            optEl.appendChild(kDiv);
            optEl.appendChild(tDiv);
            optionsWrap.appendChild(optEl);
        });
        
        // 题解
        const explanationWrap = document.createElement('div');
        explanationWrap.className = 'explanation';
        explanationWrap.style.display = 'block';
        
        const explanationTitle = document.createElement('div');
        explanationTitle.className = 'explanation-title';
        explanationTitle.textContent = '题解:';
        
        const explanationContentDiv = document.createElement('div');
        if (question.explanation) {
            renderTextWithCode(explanationContentDiv, question.explanation);
        } else {
            explanationContentDiv.textContent = '无题解';
        }
        
        explanationWrap.appendChild(explanationTitle);
        explanationWrap.appendChild(explanationContentDiv);
        
        // 按钮
        const btnsDiv = document.createElement('div');
        btnsDiv.className = 'buttons';
        
        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn btn-error';
        btnRemove.dataset.key = key;
        btnRemove.textContent = '取消收藏';
        
        const btnGoto = document.createElement('button');
        btnGoto.className = 'btn btn-secondary';
        btnGoto.dataset.key = key;
        btnGoto.dataset.index = window.questions.findIndex(q => q.number === key);
        btnGoto.textContent = '转到题目';
        
        btnsDiv.appendChild(btnRemove);
        btnsDiv.appendChild(btnGoto);
        
        favoriteContent.appendChild(optionsWrap);
        favoriteContent.appendChild(explanationWrap);
        favoriteContent.appendChild(btnsDiv);
        
        favoriteElement.appendChild(favoriteHeader);
        favoriteElement.appendChild(favoriteContent);
        
        // 点击头部展开/收起
        favoriteHeader.addEventListener('click', () => {
            favoriteContent.classList.toggle('active');
        });
        
        // 按钮事件
        btnRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            delete window.favorites[key];
            window.saveUserDataToLocalStorage();
            window.renderFavorites();
            window.updateQuestionList();
            window.showNotification('已取消收藏', 'success');
        });
        
        btnGoto.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            if (index >= 0 && index < window.questions.length) {
                window.currentQuestionIndex = index;
                window.showCurrentQuestion();
                // 切换到刷题模式
                window.mainTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                window.tabContents.forEach(c => c.classList.remove('active'));
                document.querySelector('.tab[data-tab="practice"]').classList.add('active');
                document.getElementById('practice-content').classList.add('active');
            }
        });
        
        favoritesList.appendChild(favoriteElement);
    });
}

// ========== src/core.js ==========
// 核心逻辑模块



// 文件选择处理
function handleFileSelect() {
    const file = window.fileInput.files[0];
    if (file) {
        window.fileName.textContent = file.name;
    } else {
        window.fileName.textContent = '未选择文件';
    }
}

// 加载题目文件
function loadQuestions() {
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
function showFileInput() {
    const fileCard = document.getElementById('file-upload-card');
    if (fileCard) {
        fileCard.classList.remove('hidden');
        console.log('显示文件选择卡片');
    } else {
        console.error('未找到文件选择卡片');
    }
}

// 检查答案
function checkAnswer() {
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
function addToErrorBook() {
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
function toggleFavorite() {
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
function updateFavoriteButton() {
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
function nextQuestion() {
    if (window.questions.length === 0) return;
    
    if (window.currentQuestionIndex < window.questions.length - 1) {
        window.currentQuestionIndex++;
        window.showCurrentQuestion();
    } else {
        showNotification('已经是最后一题了', 'error');
    }
}

// 上一题
function prevQuestion() {
    if (window.questions.length === 0) return;
    
    if (window.currentQuestionIndex > 0) {
        window.currentQuestionIndex--;
        window.showCurrentQuestion();
    } else {
        showNotification('已经是第一题了', 'error');
    }
}

// 过滤题目
function filterQuestions() {
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
function getFilteredQuestions() {
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
function filterErrorBook() {
    window.renderErrorBook();
}

// 过滤收藏夹
function filterFavorites() {
    if (typeof window.renderFavorites === 'function') {
        window.renderFavorites();
    }
}

// 更新统计信息
function updateStatistics() {
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

// ========== src/main.js ==========
// 主应用入口

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
