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