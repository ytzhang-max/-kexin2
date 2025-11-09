# 科目二刷题系统

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

一个功能完善、界面美观的在线刷题系统，支持题目管理、错题本、统计分析等功能。

[在线演示](#) 

</div>

---

## 📖 项目简介

科目二刷题系统是一个基于纯前端技术开发的在线学习工具，无需后端服务器，所有数据存储在浏览器本地。系统设计简洁优雅，功能丰富实用，适合各类知识点的学习和复习。

## 🚀 快速开始

### 方法一：直接使用（推荐）

1. 下载项目到本地
2. 用浏览器打开 `kexin2.html`
3. 点击"选择题目文件"，加载题目 TXT 文件
4. 开始刷题！

### 方法二：本地服务器运行

```bash
# 克隆项目
git clone https://github.com/ytzhang-max/-kexin2.git

# 进入目录
cd -kexin2

# 使用任意 HTTP 服务器，例如：
# Python 3
python -m http.server 8000

# 或使用 Live Server 等工具
```

访问 `http://localhost:8000/kexin2.html`

## 📁 项目结构

```
-kexin2-main/
├── assets/
│   ├── styles.css          # 样式文件
│   └── main.js             # 核心逻辑
├── kexin2.html             # 主页面
├── 科目二.txt              # 示例题目文件
└── README.md               # 项目说明
```

## 📝 题目文件格式

题目文件采用 TXT 格式，按以下格式编写：

```
【科目】计算机基础
【认证级别】初级
【标签】数据结构
【题号】001
【题目】以下哪个是线性数据结构？（单选）
A. 树
B. 图
C. 数组
D. 哈希表
【答案】C
【题解】数组是一种线性数据结构，元素按顺序排列。
------------
```

### 支持的字段

| 字段 | 说明 | 必填 |
|------|------|------|
| 【科目】 | 题目所属科目 | 是 |
| 【认证级别】 | 难度级别 | 否 |
| 【标签】 | 题目标签 | 否 |
| 【题号】 | 题目编号（唯一标识） | 是 |
| 【题目】 | 题目内容 | 是 |
| A/B/C/D... | 选项（单选或多选） | 是 |
| 【答案】 | 正确答案 | 是 |
| 【题解】 | 答案解析 | 否 |

**注意**：
- 多选题在题目中标注"多选"字样
- 使用 `------------` 分隔不同题目
- 支持代码块，使用 `` ``` `` 包裹

## 🎨 界面预览

### 刷题模式
- 简洁清晰的题目展示
- 选项点击选择
- 答案检查和解析展示

### 错题本
- 折叠式错题列表
- 显示用户答案和正确答案
- 题解详细展示

### 统计分析
- 总题数、已做题数统计
- 正确率可视化
- 科目分布图表

## 🛠️ 技术栈

- **HTML5** - 页面结构
- **CSS3** - 样式设计
  - CSS变量
  - Flexbox布局
  - 渐变和动画效果
  - 响应式设计
- **原生JavaScript** - 核心逻辑
  - FileReader API（文件读取）
  - LocalStorage（数据持久化）
  - DOM操作

## 🌟 特色亮点

1. **🎯 零依赖**：无需任何框架或库，纯原生实现
2. **📱 响应式设计**：完美支持手机、平板、电脑
3. **🎨 现代化UI**：渐变色、卡片设计、流畅动画
4. **💾 本地存储**：数据保存在浏览器，隐私安全
5. **🔧 易于定制**：代码结构清晰，便于二次开发

## 📊 核心功能说明

### 题目解析
系统会自动解析题目文件，提取各个字段，并支持：
- 多行题目内容
- 代码块语法高亮
- 多行选项内容

### 答题记录
- 自动保存用户选择的答案
- 切换题目时恢复之前的选择
- 统计答题进度和正确率

### 错题管理
- 答错的题目可加入错题本
- 支持从错题本中移除
- 错题本独立搜索功能

### 标签过滤
- 自动提取所有题目标签
- 点击标签快速筛选
- 支持"全部"标签查看所有题目

## 🔄 更新日志

### v2.0.0 (2025-01-09)
- ✨ 重构代码，分离 HTML/CSS/JS
- 🎨 优化界面设计
- 🐛 修复已知问题
- 📝 完善文档说明

### v1.0.0
- 🎉 初始版本发布
- ✅ 基础刷题功能
- ✅ 错题本功能
- ✅ 统计分析功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 作者

**ytzhang-max**

- GitHub: [@ytzhang-max](https://github.com/ytzhang-max)

## 🙏 鸣谢

感谢所有为本项目做出贡献的开发者！

## 📮 联系方式

如有问题或建议，欢迎：
- 提交 [Issue](https://github.com/ytzhang-max/-kexin2/issues)
- 发送邮件至您的邮箱

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by ytzhang-max

</div>



