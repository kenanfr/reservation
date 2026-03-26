# Railway 部署快速检查清单

## ✅ 部署前检查

### 1. Google Sheets 配置
- [ ] 已在 Google Cloud Console 创建项目
- [ ] 已启用 Google Sheets API
- [ ] 已创建服务账号
- [ ] 已下载 credentials.json 文件
- [ ] 服务账号邮箱已添加到 Google Sheets 编辑权限

### 2. 本地测试
- [ ] 运行 `npm install` 安装依赖
- [ ] 配置 `.env` 文件
- [ ] 配置 `schedule.json` 中的日期和 6 个时段
- [ ] 运行 `npm start` 测试本地环境
- [ ] 确认可以正常预约并同步到 Google Sheets

### 3. GitHub 准备
- [ ] 代码已推送到 GitHub 仓库
- [ ] `.gitignore` 已配置（不包含敏感文件）
- [ ] README.md 已更新

## 🚀 Railway 部署步骤

### 方法 A：网页部署（推荐新手）

1. **访问 Railway**
   - [ ] 打开 https://railway.app/
   - [ ] 使用 GitHub 账户登录

2. **创建项目**
   - [ ] 点击 "New Project"
   - [ ] 选择 "Deploy from GitHub repo"
   - [ ] 选择 `reservation` 仓库

3. **配置环境变量**
   
   进入 Settings → Variables，添加：
   
   ```
   GOOGLE_SHEET_ID=你的Sheet ID
   ```
   
   ```
   GOOGLE_CREDENTIALS_JSON={"type":"service_account",...完整JSON...}
   ```
   
   💡 提示：运行 `./prepare-railway.sh` 自动生成环境变量

4. **生成域名**
   - [ ] 进入 Settings → Networking
   - [ ] 点击 "Generate Domain"
   - [ ] 复制生成的 URL

5. **验证部署**
   - [ ] 查看 Deployments 确认构建成功
   - [ ] 访问生成的 URL
   - [ ] 测试预约功能

### 方法 B：CLI 部署（推荐开发者）

1. **安装 Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **登录**
   ```bash
   railway login
   ```

3. **初始化项目**
   ```bash
   railway init
   ```

4. **设置环境变量**
   ```bash
   # 运行准备脚本
   ./prepare-railway.sh
   
   # 或手动设置
   railway variables set GOOGLE_SHEET_ID="你的ID"
   railway variables set GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
   ```

5. **部署**
   ```bash
   railway up
   ```

6. **查看状态**
   ```bash
   railway logs
   railway open
   ```

## 🔍 部署后验证

### 检查日志
在 Railway 控制台查看日志，确认：
- [ ] ✅ Google Sheets API 已连接
- [ ] 🙏 牧师教练预约系统已启动
- [ ] 📍 访问地址显示正确
- [ ] 🕒 系统时区显示为 `Europe/Paris`

### 功能测试
- [ ] 访问 Railway 生成的 URL
- [ ] 页面正常加载
- [ ] 只显示 `schedule.json` 中未过期的日期
- [ ] 可以查看时段
- [ ] 可以成功预约
- [ ] 预约数据同步到 Google Sheets
- [ ] 已预约时段显示正确
- [ ] 自己预约后显示“姓名已预约”
- [ ] 点击自己的预约可以取消

### 性能检查
- [ ] 页面加载速度正常（< 3秒）
- [ ] API 响应速度正常（< 1秒）
- [ ] 移动端显示正常
- [ ] 桌面端显示正常

## 🐛 常见问题

### 问题：部署失败
**检查：**
- [ ] package.json 是否完整
- [ ] Node.js 版本是否正确（>= 18.0.0）
- [ ] 查看 Railway 日志错误信息

### 问题：Google Sheets 连接失败
**检查：**
- [ ] GOOGLE_CREDENTIALS_JSON 格式是否正确
- [ ] 服务账号是否有 Sheet 编辑权限
- [ ] GOOGLE_SHEET_ID 是否正确

### 问题：无法访问应用
**检查：**
- [ ] 是否已生成域名
- [ ] 部署状态是否为 "Active"
- [ ] 查看 Railway 日志确认应用启动

## 📊 监控和维护

### 日常检查
- [ ] 每周检查 Railway 日志
- [ ] 监控 Google Sheets API 配额
- [ ] 检查预约数据是否正常同步

### 更新部署
```bash
# 推送代码到 GitHub，Railway 会自动部署
git add .
git commit -m "更新说明"
git push

# 或使用 CLI
railway up
```

### 回滚部署
在 Railway 控制台：
1. 进入 Deployments
2. 找到之前的成功部署
3. 点击 "Redeploy"

## 💰 费用管理

### Railway 免费额度
- 每月 $5 免费额度
- 500 小时执行时间
- 100GB 出站流量

### 节省费用技巧
- [ ] 设置休眠策略（不活跃时自动休眠）
- [ ] 监控使用量
- [ ] 优化 API 调用次数

## 🔐 安全检查

- [ ] credentials.json 未提交到 Git
- [ ] .env 文件未提交到 Git
- [ ] Railway 环境变量已正确配置
- [ ] Google Sheets 访问权限已限制
- [ ] 定期轮换服务账号密钥

## 📞 获取帮助

- 📖 详细文档：[DEPLOYMENT.md](./DEPLOYMENT.md)
- 🌐 Railway 文档：https://docs.railway.app/
- 💬 Railway Discord：https://discord.gg/railway

---

## 🎉 部署成功！

恭喜！你的预约系统已成功部署到 Railway。

**下一步：**
1. 分享 Railway URL 给需要预约的人
2. 监控 Google Sheets 确认数据同步
3. 根据需要调整时段和日期配置
   - 直接修改 `schedule.json`

**记住：**
- 定期检查 Railway 日志
- 监控 Google Sheets API 配额
- 保持 credentials.json 安全

祝使用愉快！🙏
