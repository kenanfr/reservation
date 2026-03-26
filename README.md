# 周三教练预约系统

一个简洁高效的在线预约系统，用于管理周三牧师教练时段的预约。

## 🚀 快速部署

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/reservation)

### 部署指南（选择适合你的）

- � **[3分钟快速开始](./QUICKSTART.md)** - 最简单的部署方式
- �📖 **[完整部署指南](./DEPLOYMENT.md)** - 详细的步骤说明和故障排除
- ✅ **[部署检查清单](./DEPLOYMENT-CHECKLIST.md)** - 逐步检查确保成功部署

## 功能特点

- 📅 **日期选择**：仅显示 `schedule.json` 中配置且未过期的日期
- ⏰ **时段管理**：每天 6 个时段（09:00-10:30, 11:00-12:30, 14:00-15:30, 16:00-17:30, 18:00-19:30, 20:00-21:30）
- 🔄 **实时同步**：预约数据自动同步到 Google Sheets
- 🎨 **现代界面**：使用玻璃态设计和流畅动画
- 📱 **响应式设计**：完美支持移动端和桌面端

## 技术栈

- **前端**：原生 HTML/CSS/JavaScript
- **后端**：Node.js + Express
- **数据存储**：Google Sheets API
- **认证**：Google OAuth 2.0

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- Google Cloud Platform 账户
- Google Sheets API 凭证

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/reservation.git
cd reservation
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入以下信息：
```env
PORT=3000
SPREADSHEET_ID=your_google_spreadsheet_id
CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

4. 配置 Google Sheets API

- 在 [Google Cloud Console](https://console.cloud.google.com/) 创建项目
- 启用 Google Sheets API
- 创建服务账号并下载 credentials.json
- 将 credentials.json 放在项目根目录
- 将服务账号邮箱添加到 Google Sheets 的编辑权限中

5. 启动服务器
```bash
npm start
```

访问 `http://localhost:3000` 开始使用。

## 使用说明

1. 打开网站后，选择想要预约的日期
2. 查看该日期的可用时段（显示为蓝色）
3. 点击可用时段，填写姓名
4. 确认预约后，数据将自动保存到 Google Sheets
5. 如果是您当前浏览器预约的时段，会显示为“您的姓名已预约”，并可点击取消

## 项目结构

```
reservation/
├── public/
│   ├── index.html      # 前端页面
│   ├── styles.css      # 样式文件
│   └── app.js          # 前端逻辑
├── schedule.json       # 自定义可预约日期与 6 个时段配置
├── server.js           # 后端服务器
├── credentials.json    # Google API 凭证（不提交到 git）
├── .env                # 环境变量（不提交到 git）
├── .env.example        # 环境变量示例
└── package.json        # 项目配置
```

## Google Sheets 格式

系统需要一个包含以下列的 Google Sheets：
- 日期
- 时段
- 姓名
- 预约时间
- 预约码

## 许可证

MIT License

## 联系方式

如需帮助或有任何问题，请联系项目维护者。
