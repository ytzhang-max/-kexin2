// 题目解析模块

// 解析题目内容
export function parseQuestions(content) {
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
                const nextLine = lines[j];
                const trimmedNextLine = nextLine.trim();
                
                // 检查是否进入或退出代码块（仅检查trim后的行）
                if (trimmedNextLine.startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                }
                
                // 如果遇到下一个标签或题目分隔符，停止读取
                if (trimmedNextLine.startsWith('【') || trimmedNextLine === '------------') {
                    break;
                }
                
                // 如果遇到选项模式（A. B. C. D.）且不在代码块内部，停止读取题目
                // 匹配英文点号(.)或中文点号(．)，后面可能有空格
                if (trimmedNextLine.match(/^[A-D][\.\．][\s\u3000]*/) && !inCodeBlock) {
                    break;
                }
                
                title += '\n' + nextLine; // 保留原始行内容
                j++;
            }
            currentQuestion.title = title;
            i = j - 1; // 更新索引到已处理的位置
        } else if (currentQuestion && line.startsWith('【答案】')) {
            currentQuestion.answer = line.replace('【答案】', '').trim();
        } else if (currentQuestion && line.startsWith('【题解】')) {
            currentQuestion.explanation = '';
            inExplanation = true;
        } else if (currentQuestion && line.match(/^[A-Z][\.\．][\s\u3000]*/)) {
            const key = line[0];
            // 提取选项键和初始文本，处理"A. "或"A."格式
            const textStart = line.indexOf('.');
            let text = textStart >= 0 ? line.substring(textStart + 1).trim() : '';
            let j = i + 1;
            let inOptionCodeBlock = false;
            // 继续读取后续行直到遇到下一个选项、答案、题解或题目结束
            while (j < lines.length) {
                const nextLine = lines[j];
                const trimmedNextLine = nextLine.trim();
                
                // 检查是否进入或退出代码块
                if (trimmedNextLine.startsWith('```')) {
                    inOptionCodeBlock = !inOptionCodeBlock;
                }
                
                // 检查是否是下一个选项、答案、题解或题目分隔符
                // 即使inOptionCodeBlock为true，这些结构标记也不可能出现在代码块中间
                if (trimmedNextLine.startsWith('【答案】') || trimmedNextLine.startsWith('【题解】') || trimmedNextLine === '------------') {
                    break;
                }
                
                // 检查是否是下一个选项（A. B. C. D.）
                // 如果不在代码块中，遇到下一个选项就停止
                if (trimmedNextLine.match(/^[A-Z][\.\．][\s\u3000]*/) && !inOptionCodeBlock) {
                    break;
                }
                
                // 添加到选项文本中，保留原始换行
                text += '\n' + nextLine; // 使用原始行（包含空格和空行）
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