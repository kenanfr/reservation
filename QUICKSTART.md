# 🚀 Railway 部署快速开始

## 3 分钟快速部署指南

### 📋 准备工作（5 分钟）

1. **确保你有以下信息：**
   - ✅ Google Sheet ID（从 Sheet URL 获取）
   - ✅ credentials.json 文件内容

2. **运行准备脚本：**
   ```bash
   ./prepare-railway.sh
   ```
   
   这会生成 `railway-env.txt` 文件，包含所有需要的环境变量。

3. **确认预约排期配置：**
   - 打开 `schedule.json`
   - 填写你要开放的日期
   - 确认系统当前使用的是 6 个预约时段

### 🌐 方法一：网页部署（最简单）

1. **访问 Railway**
   
   👉 https://railway.app/

2. **登录并创建项目**
   - 使用 GitHub 登录
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的 `reservation` 仓库

3. **配置环境变量**
   - 进入 Settings → Variables
   - 打开 `railway-env.txt` 文件
   - 复制粘贴环境变量：
     - `GOOGLE_SHEET_ID`
     - `GOOGLE_CREDENTIALS_JSON`

4. **生成域名**
   - 进入 Settings → Networking
   - 点击 "Generate Domain"
   - 复制 URL（例如：`https://your-app.railway.app`）

5. **完成！**
   - 访问生成的 URL
   - 开始使用预约系统

### 💻 方法二：CLI 部署（推荐开发者）

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 准备环境变量
./prepare-railway.sh

# 5. 设置环境变量（从 railway-env.txt 复制）
railway variables

# 6. 部署
railway up

# 7. 查看日志
railway logs

# 8. 打开项目
railway open
```

### ✅ 验证部署

访问你的 Railway URL，检查：
- [ ] 页面正常加载
- [ ] 可以选择日期
- [ ] 可以预约时段
- [ ] 当前只显示 `schedule.json` 中的未来日期
- [ ] 数据同步到 Google Sheets
- [ ] 自己预约后显示“姓名已预约”，并可点击取消

### 🐛 遇到问题？

**常见问题快速修复：**

1. **Google Sheets 连接失败**
   ```
   检查：服务账号是否有 Sheet 编辑权限
   ```

2. **环境变量格式错误**
   ```bash
   # 重新生成环境变量
   ./prepare-railway.sh
   ```

3. **部署失败**
   ```
   查看 Railway 日志中的错误信息
   ```

### 📚 更多帮助

- 📖 [完整部署指南](./DEPLOYMENT.md)
- ✅ [部署检查清单](./DEPLOYMENT-CHECKLIST.md)
- 🌐 [Railway 文档](https://docs.railway.app/)

---

**就这么简单！** 🎉

如果遇到任何问题，请查看完整的 [DEPLOYMENT.md](./DEPLOYMENT.md) 文档。
