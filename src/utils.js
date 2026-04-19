// 工具函数模块

// 通用渲染函数：处理包含 ``` 代码块的文本
export function renderTextWithCode(container, text) {
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
export function showNotification(message, type = 'success') {
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
export function showLoading(show = true) {
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