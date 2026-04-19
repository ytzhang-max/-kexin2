#!/usr/bin/env node
/**
 * 题目格式转换工具：Markdown -> 刷题系统TXT格式
 * 
 * 功能：
 * 1. 将类似 question.md 的格式转换为刷题系统支持的TXT格式
 * 2. 自动处理中文编码问题（使用UTF-8 with BOM）
 * 3. 支持追加到现有题目文件或创建新文件
 * 4. 自动计算题号
 * 
 * 输入格式示例：
 * **题目内容（答案）**（类型）
 * A. 选项A
 * B. 选项B
 * ...
 * ---
 * 
 * 支持代码块（```）和多行题目/选项
 */

const fs = require('fs');
const path = require('path');

// ========== 配置区域 ==========
const config = {
    // 输入文件
    inputFile: 'question.md',
    
    // 输出选项
    outputFile: 'converted_questions.txt',  // 转换后的输出文件
    appendToExisting: true,                 // 是否追加到现有题目文件
    existingFile: '科目二.txt',              // 现有题目文件（用于追加和读取最大题号）
    
    // 默认元数据（所有题目共用）
    subject: '科目二',
    level: '工作级',
    tag: 'C++编程规范',
    
    // 编码选项
    useBOM: true,  // 使用UTF-8 BOM解决中文乱码问题
    
    // 调试选项
    debug: false   // 输出详细解析信息
};

// ========== 核心函数 ==========

/**
 * 获取现有文件中的最大题号
 */
function getMaxQuestionNumber(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return 0;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = content.match(/【题号】(\d+)/g);
        if (!matches || matches.length === 0) {
            return 0;
        }
        const numbers = matches.map(m => parseInt(m.replace('【题号】', '')));
        return Math.max(...numbers);
    } catch (error) {
        console.error('读取现有文件失败:', error.message);
        return 0;
    }
}

/**
 * 解析单个题目块
 */
function parseQuestionBlock(block, blockIndex) {
    const lines = block.split('\n');
    let result = {
        title: '',
        options: [],
        answer: '',
        type: '单选', // 默认
        explanation: '' // 题解留空
    };
    
    // 1. 找到标题行（包含**的行，或者第一个非空行）
    let titleLineIndex = -1;
    let titleLine = '';
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('**')) {
            titleLineIndex = i;
            titleLine = lines[i].trim();
            break;
        }
    }
    
    // 如果没有**，找第一个非空行
    if (titleLineIndex === -1) {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() !== '') {
                titleLineIndex = i;
                titleLine = lines[i].trim();
                break;
            }
        }
    }
    
    if (titleLine === '') {
        if (config.debug) console.warn(`块 ${blockIndex}: 未找到标题行`);
        return result;
    }
    
    // 2. 提取答案和类型
    // 答案格式: （大写字母）如（C）或（BCD）
    const answerMatches = titleLine.match(/（([A-Z]+)）/g);
    if (answerMatches) {
        // 过滤出纯大写字母的答案标记
        const possibleAnswers = answerMatches.filter(m => /^（[A-Z]+）$/.test(m));
        if (possibleAnswers.length > 0) {
            // 取第一个作为答案（通常只有一个）
            const ansMatch = possibleAnswers[0].match(/（([A-Z]+)）/);
            result.answer = ansMatch[1];
        }
    }
    
    // 类型格式: （单选）或（多选）
    const typeMatch = titleLine.match(/（(单选|多选)）/);
    if (typeMatch) {
        result.type = typeMatch[1];
    }
    
    // 3. 提取标题文本（清理标记）
    let titleText = titleLine;
    
    // 移除**标记
    titleText = titleText.replace(/\*\*/g, '');
    
    // 移除答案标记
    if (answerMatches) {
        answerMatches.forEach(match => {
            if (/^（[A-Z]+）$/.test(match)) {
                titleText = titleText.replace(match, '');
            }
        });
    }
    
    // 移除类型标记
    if (typeMatch) {
        titleText = titleText.replace(typeMatch[0], '');
    }
    
    // 清理多余的括号和空格
    titleText = titleText.replace(/\s+（\s*）/g, '（').replace(/\s*）\s+/g, '）');
    titleText = titleText.trim();
    
    // 4. 解析题目内容和选项
    let inCodeBlock = false;
    let codeBlockBuffer = [];
    let currentOption = null;
    let titleContent = titleText;
    let collectingTitle = true;
    
    for (let i = titleLineIndex + 1; i < lines.length; i++) {
        let line = lines[i];
        
        // 处理代码块
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeBlockBuffer = [];
                if (collectingTitle && !currentOption) {
                    titleContent += '\n```';
                } else if (currentOption) {
                    currentOption.text += '\n```';
                }
            } else {
                inCodeBlock = false;
                const codeContent = codeBlockBuffer.join('\n');
                if (collectingTitle && !currentOption) {
                    titleContent += codeContent + '\n```';
                } else if (currentOption) {
                    currentOption.text += codeContent + '\n```';
                }
                codeBlockBuffer = [];
            }
            continue;
        }
        
        if (inCodeBlock) {
            codeBlockBuffer.push(line);
            continue;
        }
        
        // 检查是否选项行（A. 可以没有后续文本）
        const optionMatch = line.match(/^([A-Z])\.\s*(.*)$/);
        if (optionMatch) {
            // 新选项开始
            collectingTitle = false;
            if (currentOption) {
                result.options.push(currentOption);
            }
            currentOption = {
                key: optionMatch[1],
                text: optionMatch[2] || ''  // 允许空文本
            };
        } else if (currentOption && line.trim() !== '') {
            // 选项的延续行
            currentOption.text += '\n' + line;
        } else if (collectingTitle && line.trim() !== '') {
            // 题目内容的延续
            titleContent += '\n' + line;
        }
    }
    
    // 添加最后一个选项
    if (currentOption) {
        result.options.push(currentOption);
    }
    
    // 设置最终标题
    result.title = titleContent;
    
    // 确保题目包含类型标识
    if (result.title && !result.title.includes(`（${result.type}）`)) {
        result.title = `（${result.type}）` + result.title;
    }
    
    if (config.debug) {
        console.log(`块 ${blockIndex}: 解析结果`);
        console.log(`  答案: ${result.answer}, 类型: ${result.type}`);
        console.log(`  选项数: ${result.options.length}`);
        console.log(`  标题预览: ${result.title.substring(0, 60)}...`);
    }
    
    return result;
}

/**
 * 格式化为目标格式
 */
function formatQuestion(question, questionNumber) {
    let output = '';
    
    output += `【科目】${config.subject}\n`;
    output += `【认证级别】${config.level}\n`;
    output += `【标签】${config.tag}\n`;
    output += `【题号】${questionNumber}\n`;
    output += `【题目】${question.title}\n`;
    
    // 选项
    question.options.forEach(option => {
        output += `${option.key}. ${option.text}\n`;
    });
    
    output += `【答案】${question.answer}\n`;
    output += `【题解】\n`;
    output += `------------\n\n`;
    
    return output;
}

/**
 * 清理现有文件中的BOM（如果存在）
 */
function removeBOM(content) {
    return content.replace(/^\uFEFF/, '');
}

/**
 * 添加BOM到内容
 */
function addBOM(content) {
    return config.useBOM ? '\uFEFF' + content : content;
}

/**
 * 主函数
 */
function main() {
    console.log('='.repeat(60));
    console.log('Markdown 到刷题系统TXT格式转换工具');
    console.log('='.repeat(60));
    
    try {
        // 检查输入文件
        const inputPath = path.join(__dirname, config.inputFile);
        if (!fs.existsSync(inputPath)) {
            console.error(`错误: 输入文件不存在: ${config.inputFile}`);
            console.log('请将Markdown格式的题目保存为 question.md');
            process.exit(1);
        }
        
        // 读取输入文件
        const content = fs.readFileSync(inputPath, 'utf-8');
        console.log(`输入文件: ${config.inputFile} (${content.length} 字符)`);
        
        // 分割题目块（支持---分隔符，前后可能有空行）
        const blocks = content.split(/\n---\n/).filter(block => block.trim());
        console.log(`找到 ${blocks.length} 个题目块`);
        
        if (blocks.length === 0) {
            console.error('错误: 未找到有效的题目块，请检查文件格式');
            process.exit(1);
        }
        
        // 解析每个块
        console.log('\n开始解析题目...');
        const questions = [];
        for (let i = 0; i < blocks.length; i++) {
            try {
                const question = parseQuestionBlock(blocks[i], i + 1);
                
                // 验证必要字段
                if (!question.answer) {
                    console.warn(`警告: 第 ${i + 1} 个题目缺少答案，已跳过`);
                    continue;
                }
                if (!question.title || question.title.trim() === '') {
                    console.warn(`警告: 第 ${i + 1} 个题目缺少标题，已跳过`);
                    continue;
                }
                if (question.options.length === 0) {
                    console.warn(`警告: 第 ${i + 1} 个题目没有选项，已跳过`);
                    continue;
                }
                
                questions.push(question);
                console.log(`✓ 第 ${i + 1} 题: ${question.type}, 答案: ${question.answer}, 选项: ${question.options.length}个`);
            } catch (error) {
                console.error(`解析第 ${i + 1} 个题目块时出错:`, error.message);
            }
        }
        
        console.log(`\n解析完成: 成功 ${questions.length}/${blocks.length} 个题目`);
        
        if (questions.length === 0) {
            console.error('错误: 没有成功解析的题目，请检查输入格式');
            process.exit(1);
        }
        
        // 确定起始题号
        let startNumber = 1;
        if (config.appendToExisting) {
            const maxNumber = getMaxQuestionNumber(path.join(__dirname, config.existingFile));
            startNumber = maxNumber + 1;
            console.log(`现有文件最大题号: ${maxNumber}, 新题目从 ${startNumber} 开始`);
        } else {
            console.log(`创建新文件，题号从 ${startNumber} 开始`);
        }
        
        // 格式化输出
        let outputContent = '';
        questions.forEach((question, index) => {
            const questionNumber = startNumber + index;
            outputContent += formatQuestion(question, questionNumber);
        });
        
        // 处理编码
        const finalContent = addBOM(outputContent);
        
        // 保存转换后的文件
        const outputPath = path.join(__dirname, config.outputFile);
        fs.writeFileSync(outputPath, finalContent, 'utf-8');
        console.log(`\n转换完成: ${config.outputFile} (${outputContent.length} 字符)`);
        
        // 追加到现有文件（如果启用）
        if (config.appendToExisting) {
            const existingPath = path.join(__dirname, config.existingFile);
            if (fs.existsSync(existingPath)) {
                try {
                    const existingContent = fs.readFileSync(existingPath, 'utf-8');
                    const cleanExisting = removeBOM(existingContent);
                    const newContent = addBOM(cleanExisting + '\n\n' + outputContent);
                    fs.writeFileSync(existingPath, newContent, 'utf-8');
                    console.log(`已追加到: ${config.existingFile}`);
                    
                    // 统计信息
                    const totalQuestions = getMaxQuestionNumber(existingPath);
                    console.log(`当前总题数: ${totalQuestions}`);
                } catch (error) {
                    console.error(`追加到现有文件失败: ${error.message}`);
                    console.log('已保存转换结果到独立文件');
                }
            } else {
                console.log(`现有文件不存在，创建: ${config.existingFile}`);
                fs.writeFileSync(existingPath, finalContent, 'utf-8');
            }
        }
        
        // 输出统计信息
        console.log('\n' + '='.repeat(60));
        console.log('转换统计:');
        console.log(`  题目数量: ${questions.length}`);
        console.log(`  题号范围: ${startNumber} - ${startNumber + questions.length - 1}`);
        console.log(`  单选题: ${questions.filter(q => q.type === '单选').length}`);
        console.log(`  多选题: ${questions.filter(q => q.type === '多选').length}`);
        console.log(`  输出文件: ${config.outputFile}`);
        if (config.appendToExisting) {
            console.log(`  已追加到: ${config.existingFile}`);
        }
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('转换过程中出错:', error);
        process.exit(1);
    }
}

// ========== 命令行参数处理 ==========
function parseArgs() {
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && args[i + 1]) {
            config.inputFile = args[i + 1];
            i++;
        } else if (args[i] === '--output' && args[i + 1]) {
            config.outputFile = args[i + 1];
            i++;
        } else if (args[i] === '--existing' && args[i + 1]) {
            config.existingFile = args[i + 1];
            i++;
        } else if (args[i] === '--append') {
            config.appendToExisting = true;
        } else if (args[i] === '--no-append') {
            config.appendToExisting = false;
        } else if (args[i] === '--subject' && args[i + 1]) {
            config.subject = args[i + 1];
            i++;
        } else if (args[i] === '--level' && args[i + 1]) {
            config.level = args[i + 1];
            i++;
        } else if (args[i] === '--tag' && args[i + 1]) {
            config.tag = args[i + 1];
            i++;
        } else if (args[i] === '--debug') {
            config.debug = true;
        } else if (args[i] === '--help' || args[i] === '-h') {
            showHelp();
            process.exit(0);
        }
    }
}

function showHelp() {
    console.log(`
Markdown到刷题系统TXT格式转换工具

用法: node md2txt_final.js [选项]

选项:
  --input <文件>     输入Markdown文件 (默认: question.md)
  --output <文件>    输出TXT文件 (默认: converted_questions.txt)
  --existing <文件>  现有题目文件 (默认: 科目二.txt)
  --append           追加到现有文件 (默认: 是)
  --no-append        不追加，创建独立文件
  --subject <科目>   设置科目 (默认: 科目二)
  --level <级别>     设置认证级别 (默认: 工作级)
  --tag <标签>       设置题目标签 (默认: C++编程规范)
  --debug            输出调试信息
  --help, -h         显示此帮助信息

输入格式示例:
  **题目内容（答案）**（类型）
  A. 选项A
  B. 选项B
  ...
  ---

支持代码块(\`\`\`)和多行题目/选项。
`);
}

// ========== 程序入口 ==========
if (require.main === module) {
    parseArgs();
    main();
}

module.exports = {
    parseQuestionBlock,
    formatQuestion,
    config
};