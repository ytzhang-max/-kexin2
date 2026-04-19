// UI渲染模块
import { renderTextWithCode } from './utils.js';

// 显示当前题目
export function showCurrentQuestion() {
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
export function updateProgressBar() {
    if (window.questions.length === 0) return;

    const progress = ((window.currentQuestionIndex + 1) / window.questions.length) * 100;
    window.progressBar.style.width = `${progress}%`;
}

// 渲染标签过滤器
export function renderFilterTags() {
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
export function renderErrorBook() {
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
export function showQuestionList() {
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
export function updateQuestionList() {
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
export function renderSubjectStats(stats) {
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
export function renderFavorites() {
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