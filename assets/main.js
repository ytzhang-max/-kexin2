// 全局变量
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let errorBook = {};
let tags = new Set();
let activeTag = null;

// DOM元素
const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const loadBtn = document.getElementById('load-btn');
const questionContainer = document.getElementById('question-container');
const questionSubject = document.getElementById('question-subject');
const questionLevel = document.getElementById('question-level');
const questionTag = document.getElementById('question-tag');
const questionNumber = document.getElementById('question-number');
const questionTitle = document.getElementById('question-title');
const optionsContainer = document.getElementById('options');
const checkBtn = document.getElementById('check-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const addToErrorBtn = document.getElementById('add-to-error-btn');
const explanation = document.getElementById('explanation');
const explanationContent = document.getElementById('explanation-content');
const questionList = document.getElementById('question-list');
const progressInfo = document.getElementById('progress-info');
const currentQuestionSpan = document.getElementById('current-question');
const totalQuestionsSpan = document.getElementById('total-questions');
const progressBar = document.getElementById('progress-bar');
const searchInput = document.getElementById('search-input');
const errorSearchInput = document.getElementById('error-search-input');
const filterTags = document.getElementById('filter-tags');
const errorBookList = document.getElementById('error-book-list');
const mainTabs = document.getElementById('main-tabs');
const tabContents = document.querySelectorAll('.tab-content');
const notification = document.getElementById('notification');

// 统计元素
const totalCountEl = document.getElementById('total-count');
const answeredCountEl = document.getElementById('answered-count');
const correctRateEl = document.getElementById('correct-rate');
const errorCountEl = document.getElementById('error-count');
const subjectStatsEl = document.getElementById('subject-stats');

// 初始化
function init() {
    // 从本地存储加载数据
    loadUserDataFromLocalStorage();
    document.getElementById('reset-stats-btn').addEventListener('click', resetStatistics);
    // 事件监听器
    fileInput.addEventListener('change', handleFileSelect);
    loadBtn.addEventListener('click', loadQuestions);
    checkBtn.addEventListener('click', checkAnswer);
    nextBtn.addEventListener('click', nextQuestion);
    prevBtn.addEventListener('click', prevQuestion);
    addToErrorBtn.addEventListener('click', addToErrorBook);
    searchInput.addEventListener('input', filterQuestions);
    errorSearchInput.addEventListener('input', filterErrorBook);

    // 自动加载题目文件
    autoLoadQuestions();

    // 标签页切换事件
    mainTabs.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            mainTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-content`).classList.add('active');

            // 如果切换到错题本,重新渲染错题列表
            if (tabId === 'error-book') {
                renderErrorBook();
            } else if (tabId === 'statistics') {
                updateStatistics();
            }
        });
    });
}

// 文件选择处理
function handleFileSelect() {
    const file = fileInput.files[0];
    if (file) {
        fileName.textContent = file.name;
    } else {
        fileName.textContent = '未选择文件';
    }
}

// 添加重置统计函数
function resetStatistics() {
    if (confirm('确定要重置所有数据吗？这将清除所有答题记录和错题本。')) {
        userAnswers = {};
        errorBook = {};
        localStorage.removeItem('userAnswers');
        localStorage.removeItem('errorBook');
        updateStatistics();
        renderErrorBook();
        showNotification('数据已重置', 'success');
    }
}

// 从本地存储加载用户数据
function loadUserDataFromLocalStorage() {
    const storedAnswers = localStorage.getItem('userAnswers');
    const storedErrorBook = localStorage.getItem('errorBook');

    if (storedAnswers) {
        userAnswers = JSON.parse(storedAnswers);
    }

    if (storedErrorBook) {
        errorBook = JSON.parse(storedErrorBook);
    }
}

// 保存用户数据到本地存储
function saveUserDataToLocalStorage() {
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    localStorage.setItem('errorBook', JSON.stringify(errorBook));
}

// 自动加载题目文件
function autoLoadQuestions() {
    showNotification('正在加载题目...', 'success');
    
    // 使用 XMLHttpRequest 代替 fetch，更好地支持本地文件
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '科目二.txt', true);
    xhr.responseType = 'text';
    
    xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) { // 0 表示本地文件
            const content = xhr.responseText;
            parseQuestions(content);
            if (questions.length > 0) {
                // 提取所有标签
                questions.forEach(q => {
                    if (q.tag) tags.add(q.tag);
                });

                // 渲染标签过滤器
                renderFilterTags();

                showQuestionList();
                showCurrentQuestion();
                progressInfo.classList.remove('hidden');
                updateStatistics();
                showNotification(`已成功加载 ${questions.length} 道题目`, 'success');
                
                // 隐藏文件选择提示
                const fileCard = document.querySelector('.card.hidden');
                if (fileCard) {
                    fileCard.style.display = 'none';
                }
            } else {
                showNotification('未找到有效题目，请检查文件格式', 'error');
                showFileInput();
            }
        } else {
            console.error('加载题目失败，状态码:', xhr.status);
            showNotification('自动加载失败，请手动选择题目文件', 'error');
            showFileInput();
        }
    };
    
    xhr.onerror = function() {
        console.error('加载题目文件时发生错误');
        showNotification('自动加载失败，请手动选择题目文件', 'error');
        showFileInput();
    };
    
    xhr.send();
}

// 显示文件选择输入框
function showFileInput() {
    const fileCard = document.querySelector('.card.hidden');
    if (fileCard) {
        fileCard.classList.remove('hidden');
    }
}

// 读取并解析TXT文件
function loadQuestions() {
    const file = fileInput.files[0];
    if (!file) {
        showNotification('请先选择题目文件', 'error');
        return;
    }

    showNotification('正在加载题目...', 'success');

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        parseQuestions(content);
        if (questions.length > 0) {
            // 提取所有标签
            questions.forEach(q => {
                if (q.tag) tags.add(q.tag);
            });

            // 渲染标签过滤器
            renderFilterTags();

            showQuestionList();
            showCurrentQuestion();
            progressInfo.classList.remove('hidden');
            updateStatistics();
            showNotification(`已成功加载 ${questions.length} 道题目`, 'success');
        } else {
            showNotification('未找到有效题目，请检查文件格式', 'error');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// 解析题目
function parseQuestions(content) {
    questions = [];
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
            console.log(title);
            while (j < lines.length) {
                const nextLine = lines[j].trim();
                // 检查是否进入或退出代码块
                if (nextLine.startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                }
                // 如果遇到下一个标签或题目分隔符，停止读取
                if (nextLine.match(/^[A-Z]\. /) || nextLine.startsWith('【') || nextLine === '------------') {
                    break;
                }
                title += '\n' + lines[j]; // 保留原始行内容
                j++;
            }
            currentQuestion.title = title;
            console.log(currentQuestion);
        } else if (currentQuestion && line.startsWith('【答案】')) {
            currentQuestion.answer = line.replace('【答案】', '').trim();
        } else if (currentQuestion && line.startsWith('【题解】')) {
            currentQuestion.explanation = '';
            inExplanation = true;
        } else if (currentQuestion && line.match(/^[A-Z]\. /)) {
            const key = line[0];
            let text = line.substring(3).trim(); // 提取选项键和初始文本
            let j = i + 1;
            // 继续读取后续行直到遇到下一个选项、答案、题解或题目结束
            while (j < lines.length) {
                const nextLine = lines[j].trim();
                // 检查是否是下一个选项、答案、题解或题目分隔符
                if (nextLine.match(/^[A-Z]\. /) ||
                    nextLine.startsWith('【答案】') ||
                    nextLine.startsWith('【题解】') ||
                    nextLine === '------------') {
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

    totalQuestionsSpan.textContent = questions.length;
    updateProgressBar();
}

// 渲染标签过滤器
function renderFilterTags() {
    filterTags.innerHTML = '<div class="filter-tag active" data-tag="all">全部</div>';

    tags.forEach(tag => {
        const tagEl = document.createElement('div');
        tagEl.className = 'filter-tag';
        tagEl.textContent = tag;
        tagEl.dataset.tag = tag;
        filterTags.appendChild(tagEl);
    });

    // 标签点击事件
    filterTags.querySelectorAll('.filter-tag').forEach(tagEl => {
        tagEl.addEventListener('click', () => {
            filterTags.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            tagEl.classList.add('active');

            activeTag = tagEl.dataset.tag === 'all' ? null : tagEl.dataset.tag;
            filterQuestions();
        });
    });
}

// 显示当前题目
function showCurrentQuestion() {
    if (questions.length === 0) {
        return;
    }

    const question = questions[currentQuestionIndex];
    questionContainer.classList.remove('hidden');
    questionSubject.textContent = `科目: ${question.subject || ''}`;
    questionLevel.textContent = `级别: ${question.level || ''}`;
    questionTag.textContent = question.tag || '';
    questionNumber.textContent = `题号: ${question.number || ''}`;

    // 显示题目标题
    questionTitle.innerHTML = ''; // 清空原有内容
    console.log(question.title);

    // 检查题目是否包含代码块
    if (question.title.includes("```")) {
        // 按代码块分隔符拆分
        console.log(question.title);
        const segments = question.title.split(/```/g);

        segments.forEach((segment, index) => {
            if (index % 2 === 0) {
                // 普通文本
                const textNode = document.createTextNode(segment);
                questionTitle.appendChild(textNode);
            } else {
                // 代码块
                const pre = document.createElement('pre');
                pre.className = 'code-block';
                pre.textContent = segment;
                questionTitle.appendChild(pre);
            }
        });
    } else {
        // 无代码块，直接设置文本
        questionTitle.textContent = question.title || '';
    }


    // 判断是单选还是多选
    const isMultiChoice = question.title.includes('多选');

    // 显示选项
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';

        const optionKey = document.createElement('div');
        optionKey.className = 'option-key';
        optionKey.textContent = option.key;

        const optionText = document.createElement('div');
        optionText.className = 'option-text';

        const pre = document.createElement('pre');
        pre.textContent = option.text; // 确保 option.text 包含 \n
        optionText.appendChild(pre);
        console.log('option.text:', option.text);

        optionElement.appendChild(optionKey);
        optionElement.appendChild(optionText);

        optionElement.dataset.key = option.key;

        // 恢复用户之前的选择
        if (userAnswers[question.number]) {
            if (isMultiChoice) {
                if (Array.isArray(userAnswers[question.number]) &&
                    userAnswers[question.number].includes(option.key)) {
                    optionElement.classList.add('selected');
                }
            } else {
                if (userAnswers[question.number] === option.key) {
                    optionElement.classList.add('selected');
                }
            }
        }

        optionElement.addEventListener('click', () => {
            if (isMultiChoice) {
                optionElement.classList.toggle('selected');
                const selected = Array.from(
                    optionsContainer.querySelectorAll('.option.selected')
                ).map(el => el.dataset.key);
                userAnswers[question.number] = selected;
            } else {
                optionsContainer.querySelectorAll('.option').forEach(
                    el => el.classList.remove('selected')
                );
                optionElement.classList.add('selected');
                userAnswers[question.number] = option.key;
            }
            updateQuestionList();
            saveUserDataToLocalStorage();
            updateStatistics();
        });

        optionsContainer.appendChild(optionElement);
    });

    // 重置答案解释
    explanation.style.display = 'none';

    // 隐藏加入错题本按钮
    addToErrorBtn.classList.add('hidden');

    // 更新题目导航
    updateQuestionList();
    currentQuestionSpan.textContent = currentQuestionIndex + 1;
    updateProgressBar();
}

// 更新进度条
function updateProgressBar() {
    if (questions.length === 0) return;

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// 检查答案
function checkAnswer() {
    const question = questions[currentQuestionIndex];
    const correctAnswer = question.answer;
    const userAnswer = userAnswers[question.number] || '';

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
    optionsContainer.querySelectorAll('.option').forEach(option => {
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
    if (question.explanation) {
        // 处理题解中的代码块
        if (question.explanation.includes('```')) {
            let parts = question.explanation.split('```');
            let html = parts[0];

            for (let i = 1; i < parts.length; i += 2) {
                if (i < parts.length) {
                    html += `<pre>${parts[i]}</pre>`;
                }
                if (i + 1 < parts.length) {
                    html += parts[i + 1];
                }
            }

            explanationContent.innerHTML = html;
        } else {
            explanationContent.textContent = question.explanation;
        }
    } else {
        explanationContent.textContent = '无题解';
    }

    explanation.style.display = 'block';

    // 如果答错了，显示加入错题本按钮
    if (!isCorrect && userAnswer !== '') {
        addToErrorBtn.classList.remove('hidden');
    } else {
        addToErrorBtn.classList.add('hidden');
    }

    // 更新统计信息
    updateStatistics();
}

// 加入错题本
function addToErrorBook() {
    const question = questions[currentQuestionIndex];

    if (!errorBook[question.number]) {
        errorBook[question.number] = {
            question: question,
            userAnswer: userAnswers[question.number]
        };

        saveUserDataToLocalStorage();
        showNotification('已加入错题本', 'success');
        updateQuestionList();
        updateStatistics();
    } else {
        showNotification('该题已在错题本中', 'error');
    }
}

// 渲染错题本
function renderErrorBook() {
    errorBookList.innerHTML = '';

    const errorKeys = Object.keys(errorBook);

    if (errorKeys.length === 0) {
        errorBookList.innerHTML = '<div class="no-errors">错题本为空</div>';
        return;
    }

    const searchTerm = (errorSearchInput.value || '').toLowerCase();

    // helper：把带 ``` 代码块的文本分段渲染为普通文本节点和 <pre> 代码块
    function renderTextWithCode(container, text) {
        if (!text && text !== '') return;
        const parts = String(text).split(/```/g);
        parts.forEach((part, idx) => {
            if (idx % 2 === 0) {
                // 普通文本，保留换行
                const div = document.createElement('div');
                div.style.whiteSpace = 'pre-wrap';
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

    errorKeys.forEach(key => {
        const errorItem = errorBook[key];
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
        btnGoto.dataset.index = questions.findIndex(q => q.number === key);
        btnGoto.textContent = '转到题目';

        btnsDiv.appendChild(btnMaster);
        btnsDiv.appendChild(btnGoto);

        errorContent.appendChild(optionsWrap);
        errorContent.appendChild(explanationWrap);
        errorContent.appendChild(btnsDiv);

        // 切换错题内容显示/隐藏
        errorHeader.addEventListener('click', () => {
            errorContent.classList.toggle('active');
        });

        errorElement.appendChild(errorHeader);
        errorElement.appendChild(errorContent);
        errorBookList.appendChild(errorElement);
    });

    // 绑定按钮事件（使用事件委托或重新查询）
    errorBookList.querySelectorAll('.btn-success').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const key = btn.dataset.key;
            delete errorBook[key];
            saveUserDataToLocalStorage();
            renderErrorBook();
            updateStatistics();
            showNotification('已从错题本移除', 'success');
        });
    });

    errorBookList.querySelectorAll('.btn-secondary').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            if (!isNaN(index) && index >= 0) {
                currentQuestionIndex = index;
                showCurrentQuestion();

                // 切换到刷题模式
                document.querySelector('.tab[data-tab="practice"]').click();
                window.scrollTo(0, 0);
            }
        });
    });
}

// 下一题
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showCurrentQuestion();
    } else {
        showNotification('已经是最后一题了', 'error');
    }
}

// 上一题
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showCurrentQuestion();
    } else {
        showNotification('已经是第一题了', 'error');
    }
}

// 显示题目导航列表
function showQuestionList() {
    questionList.innerHTML = '';

    // 获取过滤后的题目
    const filteredQuestions = getFilteredQuestions();

    filteredQuestions.forEach((question, index) => {
        const originalIndex = questions.findIndex(q => q.number === question.number);
        const item = document.createElement('div');
        item.className = 'question-item';
        item.textContent = originalIndex + 1;

        // 添加工具提示
        item.classList.add('tooltip');
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltiptext';
        tooltip.textContent = question.title.length > 30 ?
            question.title.substring(0, 30) + '...' : question.title;
        item.appendChild(tooltip);

        item.addEventListener('click', () => {
            currentQuestionIndex = originalIndex;
            showCurrentQuestion();
            window.scrollTo(0, 0);
        });

        // 如果在错题本中，添加错题标记
        if (errorBook[question.number]) {
            item.classList.add('error');
        } else if (userAnswers[question.number]) {
            item.classList.add('answered');
        }

        questionList.appendChild(item);
    });

    updateQuestionList();
}

// 更新题目导航状态
function updateQuestionList() {
    const items = questionList.querySelectorAll('.question-item');
    items.forEach((item, index) => {
        item.classList.remove('active');

        // 找出当前项目对应的原始题目索引
        const filteredQuestions = getFilteredQuestions();
        if (index < filteredQuestions.length) {
            const questionNumber = filteredQuestions[index].number;
            const originalIndex = questions.findIndex(q => q.number === questionNumber);

            if (originalIndex === currentQuestionIndex) {
                item.classList.add('active');
            }

            // 更新答题状态
            item.classList.remove('answered', 'error');
            if (errorBook[questionNumber]) {
                item.classList.add('error');
            } else if (userAnswers[questionNumber]) {
                item.classList.add('answered');
            }
        }
    });
}

// 过滤题目
function filterQuestions() {
    const searchTerm = searchInput.value.toLowerCase();

    // 重新渲染题目列表
    showQuestionList();

    // 如果当前题目不在过滤结果中，跳转到第一个过滤结果
    const filteredQuestions = getFilteredQuestions();
    if (filteredQuestions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const isCurrentInFiltered = filteredQuestions.some(
            q => q.number === currentQuestion.number
        );

        if (!isCurrentInFiltered) {
            const firstFilteredIndex = questions.findIndex(
                q => q.number === filteredQuestions[0].number
            );
            currentQuestionIndex = firstFilteredIndex;
            showCurrentQuestion();
        }
    }
}

// 获取过滤后的题目
function getFilteredQuestions() {
    const searchTerm = searchInput.value.toLowerCase();

    return questions.filter(question => {
        // 标签过滤
        if (activeTag && question.tag !== activeTag) {
            return false;
        }

        // 搜索过滤
        if (searchTerm) {
            return (
                question.title.toLowerCase().includes(searchTerm) ||
                question.subject?.toLowerCase().includes(searchTerm) ||
                question.tag?.toLowerCase().includes(searchTerm) ||
                question.number?.toLowerCase().includes(searchTerm)
            );
        }

        return true;
    });
}

// 过滤错题本
function filterErrorBook() {
    renderErrorBook();
}

// 更新统计信息
function updateStatistics() {
    // 计算基本统计
    const totalCount = questions.length;
    const answeredCount = Object.keys(userAnswers).length;
    const errorCount = Object.keys(errorBook).length;

    // 计算正确率
    let correctCount = 0;
    questions.forEach(question => {
        const userAnswer = userAnswers[question.number];
        if (userAnswer) {
            const isMultiChoice = question.title.includes('多选');

            if (isMultiChoice) {
                const userSelected = Array.isArray(userAnswer) ?
                    userAnswer.sort().join('') : userAnswer;
                const correctSelected = question.answer.split('').sort().join('');
                if (userSelected === correctSelected) correctCount++;
            } else {
                if (userAnswer === question.answer) correctCount++;
            }
        }
    });

    const correctRate = answeredCount > 0 ?
        Math.round((correctCount / answeredCount) * 100) : 0;

    // 更新DOM
    totalCountEl.textContent = totalCount;
    answeredCountEl.textContent = answeredCount;
    correctRateEl.textContent = `${correctRate}%`;
    errorCountEl.textContent = errorCount;

    // 计算科目分布
    const subjectStats = {};
    questions.forEach(question => {
        if (!question.subject) return;

        if (!subjectStats[question.subject]) {
            subjectStats[question.subject] = {
                total: 0,
                answered: 0,
                correct: 0
            };
        }

        subjectStats[question.subject].total++;

        const userAnswer = userAnswers[question.number];
        if (userAnswer) {
            subjectStats[question.subject].answered++;

            const isMultiChoice = question.title.includes('多选');
            let isCorrect = false;

            if (isMultiChoice) {
                const userSelected = Array.isArray(userAnswer) ?
                    userAnswer.sort().join('') : userAnswer;
                const correctSelected = question.answer.split('').sort().join('');
                isCorrect = userSelected === correctSelected;
            } else {
                isCorrect = userAnswer === question.answer;
            }

            if (isCorrect) {
                subjectStats[question.subject].correct++;
            }
        }
    });

    // 渲染科目统计
    renderSubjectStats(subjectStats);
}

// 渲染科目统计
function renderSubjectStats(stats) {
    subjectStatsEl.innerHTML = '';

    Object.entries(stats).forEach(([subject, data]) => {
        const rate = data.answered > 0 ?
            Math.round((data.correct / data.answered) * 100) : 0;

        const subjectCard = document.createElement('div');
        subjectCard.className = 'card';
        subjectCard.innerHTML = `
                <h3>${subject}</h3>
                <div class="statistics-container">
                    <div class="statistic-card">
                        <div class="statistic-label">总题数</div>
                        <div class="statistic-value">${data.total}</div>
                    </div>
                    <div class="statistic-card">
                        <div class="statistic-label">已做题数</div>
                        <div class="statistic-value">${data.answered}</div>
                    </div>
                    <div class="statistic-card">
                        <div class="statistic-label">正确率</div>
                        <div class="statistic-value">${rate}%</div>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${(data.answered / data.total) * 100}%"></div>
                </div>
            `;

        subjectStatsEl.appendChild(subjectCard);
    });
}

// 显示通知
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 初始化
init();