# Railway 部署指南

本指南将帮助你在 Railway 上部署周三教练预约系统。

## 📋 部署前准备

### 1. 准备 Google Sheets API 凭证

确保你已经：
- ✅ 在 Google Cloud Console 创建了项目
- ✅ 启用了 Google Sheets API
- ✅ 创建了服务账号并下载了 `credentials.json`
- ✅ 将服务账号邮箱添加到你的 Google Sheets 编辑权限中

### 2. 获取必要信息

你需要准备以下信息：
- **Google Sheet ID**：从 Sheet URL 中获取
  ```
  https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
  ```
- **credentials.json 文件内容**：整个 JSON 文件的内容

## 🚀 Railway 部署步骤

### 方法一：通过 Railway 网站部署（推荐）

#### 第 1 步：创建 Railway 账户

1. 访问 [Railway.app](https://railway.app/)
2. 点击 "Start a New Project"
3. 使用 GitHub 账户登录

#### 第 2 步：连接 GitHub 仓库

1. 在 Railway 控制台，点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 授权 Railway 访问你的 GitHub
4. 选择 `reservation` 仓库

#### 第 3 步：配置环境变量

在 Railway 项目设置中，添加以下环境变量：

1. **GOOGLE_SHEET_ID**
   ```
   你的 Google Sheet ID
   ```

2. **GOOGLE_CREDENTIALS_JSON**
   ```json
   整个 credentials.json 文件的内容（复制粘贴整个 JSON）
   ```
   
   示例格式：
   ```json
   {"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
   ```

3. **PORT** (可选，Railway 会自动设置)
   ```
   3000
   ```

#### 第 4 步：部署

1. Railway 会自动检测到你的 Node.js 项目
2. 点击 "Deploy" 开始部署
3. 等待构建完成（通常需要 1-3 分钟）

#### 第 5 步：获取访问 URL

1. 在 Railway 项目页面，点击 "Settings"
2. 找到 "Domains" 部分
3. 点击 "Generate Domain" 生成一个公开访问的 URL
4. 你的应用将可以通过类似 `https://your-app.railway.app` 的地址访问

### 方法二：使用 Railway CLI

#### 第 1 步：安装 Railway CLI

```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# 或使用 npm
npm install -g @railway/cli
```

#### 第 2 步：登录 Railway

```bash
railway login
```

#### 第 3 步：初始化项目

在项目目录中运行：

```bash
cd /Users/kenanfr/Documents/GitHub/reservation
railway init
```

#### 第 4 步：设置环境变量

```bash
# 设置 Google Sheet ID
railway variables set GOOGLE_SHEET_ID="你的Sheet ID"

# 设置 Google 凭证（需要转义引号）
railway variables set GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
```

或者使用交互式编辑器：
```bash
railway variables
```

#### 第 5 步：部署

```bash
railway up
```

#### 第 6 步：查看部署状态

```bash
# 查看日志
railway logs

# 打开项目控制台
railway open
```

## 🔧 环境变量配置详解

### GOOGLE_CREDENTIALS_JSON 格式

这个环境变量需要包含完整的 credentials.json 内容。你可以这样获取：

```bash
# 在本地项目目录
cat credentials.json | tr -d '\n'
```

然后复制输出的整行 JSON 字符串到 Railway 环境变量中。

**重要提示**：
- ✅ 确保 JSON 格式正确，没有换行符
- ✅ 私钥中的 `\n` 需要保留
- ✅ 不要在 JSON 外面加额外的引号

### 验证环境变量

部署后，检查日志确认凭证加载成功：

```
📡 使用环境变量中的 Google 凭证
✅ Google Sheets API 已连接
```

## 🐛 常见问题

### 问题 1：部署失败 - "Cannot find module"

**解决方案**：确保 `package.json` 中包含所有依赖
```bash
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### 问题 2：Google Sheets API 连接失败

**解决方案**：
1. 检查 `GOOGLE_CREDENTIALS_JSON` 环境变量格式是否正确
2. 确认服务账号邮箱已添加到 Google Sheets 编辑权限
3. 检查 Railway 日志中的错误信息

### 问题 3：应用启动但无法访问

**解决方案**：
1. 确保在 Railway Settings → Networking 中生成了域名
2. 检查 PORT 环境变量（Railway 会自动设置）
3. 查看 Railway 日志确认应用正常启动

### 问题 4：CORS 错误

**解决方案**：应用已配置 CORS，如果仍有问题，检查：
1. Railway 生成的域名是否正确
2. 前端是否使用了正确的 API 地址

## 📊 监控和维护

### 查看日志

在 Railway 控制台：
1. 进入你的项目
2. 点击 "Deployments"
3. 选择最新的部署
4. 查看实时日志

### 重新部署

每次推送到 GitHub 主分支，Railway 会自动重新部署。

手动重新部署：
```bash
railway up --detach
```

### 回滚部署

在 Railway 控制台：
1. 进入 "Deployments"
2. 找到之前的成功部署
3. 点击 "Redeploy"

## 💰 费用说明

Railway 提供：
- ✅ **免费额度**：每月 $5 的免费使用额度
- ✅ **按需付费**：超出免费额度后按实际使用量计费
- ✅ **休眠策略**：可以设置不活跃时自动休眠以节省费用

对于这个预约系统，免费额度通常足够使用。

## 🔐 安全建议

1. ✅ 不要将 `credentials.json` 提交到 Git
2. ✅ 不要将 `.env` 文件提交到 Git
3. ✅ 定期轮换 Google 服务账号密钥
4. ✅ 限制 Google Sheets 的访问权限
5. ✅ 在 Railway 中使用环境变量管理敏感信息

## 📞 获取帮助

- Railway 文档：https://docs.railway.app/
- Railway Discord：https://discord.gg/railway
- 项目 Issues：https://github.com/yourusername/reservation/issues

## ✅ 部署检查清单

部署前确认：
- [ ] GitHub 仓库已创建并推送代码
- [ ] Google Sheets API 已配置
- [ ] credentials.json 内容已准备好
- [ ] Google Sheet ID 已获取
- [ ] 服务账号已添加到 Sheet 编辑权限

部署后验证：
- [ ] 应用成功启动（查看日志）
- [ ] Google Sheets API 连接成功
- [ ] 可以通过 Railway 域名访问
- [ ] 可以正常预约并同步到 Google Sheets
- [ ] 移动端和桌面端显示正常

---

祝你部署顺利！🎉
