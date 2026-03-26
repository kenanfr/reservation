# 如何使用 prepare-railway.sh 脚本

## 📋 脚本功能

`prepare-railway.sh` 脚本会自动：
1. ✅ 检查必要的配置文件（`credentials.json` 和 `.env`）
2. ✅ 读取 Google Sheet ID
3. ✅ 将 `credentials.json` 转换为单行 JSON
4. ✅ 生成 `railway-env.txt` 文件，包含所有环境变量

## 🚀 使用方法

### 第 1 步：确保文件存在

在运行脚本前，确保项目根目录有：
- ✅ `credentials.json` - Google 服务账号凭证
- ✅ `.env` - 包含 `GOOGLE_SHEET_ID` 的环境变量文件
- ✅ `schedule.json` - 已配置要开放的日期和 6 个预约时段

### 第 2 步：运行脚本

```bash
cd /Users/kenanfr/Documents/GitHub/reservation
./prepare-railway.sh
```

### 第 3 步：查看输出

脚本会显示：
```
🚀 Railway 部署准备工具
========================

✅ 找到必要的配置文件

📋 检测到的配置：
   Google Sheet ID: 16--6UzDMSm52KNezQqs3M2VPlC-A9dLwvcql62gVn24

🔧 准备环境变量...

✅ 环境变量已准备完成！

📄 配置已保存到: railway-env.txt
```

### 第 4 步：使用生成的文件

打开 `railway-env.txt` 文件：

```bash
cat railway-env.txt
```

你会看到类似这样的内容：

```
# Railway 环境变量配置
# 复制以下内容到 Railway 项目的环境变量设置中

GOOGLE_SHEET_ID=16--6UzDMSm52KNezQqs3M2VPlC-A9dLwvcql62gVn24

GOOGLE_CREDENTIALS_JSON=
{"type":"service_account","project_id":"...","private_key":"..."}
```

## 📋 在 Railway 中使用

### 方法 1：网页界面

1. 登录 Railway.app
2. 进入你的项目
3. 点击 Settings → Variables
4. 打开 `railway-env.txt`
5. 复制每个环境变量的**名称**和**值**
6. 在 Railway 中添加：
   - 变量名：`GOOGLE_SHEET_ID`
   - 变量值：`16--6UzDMSm52KNezQqs3M2VPlC-A9dLwvcql62gVn24`
   
   - 变量名：`GOOGLE_CREDENTIALS_JSON`
   - 变量值：`{"type":"service_account",...}` （整个 JSON）

### 方法 2：Railway CLI

```bash
# 安装 CLI
npm install -g @railway/cli

# 登录
railway login

# 打开变量编辑器
railway variables

# 在编辑器中粘贴 railway-env.txt 的内容
```

## ⚠️ 注意事项

### 1. JSON 格式
- ✅ `GOOGLE_CREDENTIALS_JSON` 必须是**单行** JSON
- ✅ 脚本会自动移除换行符
- ✅ 保留 `\n` 在私钥中（这是正确的）

### 2. 文件安全
- ⚠️ `railway-env.txt` 包含敏感信息
- ⚠️ 已添加到 `.gitignore`，不会提交到 Git
- ⚠️ 使用后建议删除此文件

### 3. 重新生成
如果需要重新生成环境变量：
```bash
./prepare-railway.sh
```
脚本会覆盖旧的 `railway-env.txt` 文件。

## 🐛 故障排除

### 错误：找不到 credentials.json
```
❌ 错误: 找不到 credentials.json 文件
```

**解决方案：**
确保 `credentials.json` 在项目根目录：
```bash
ls -la credentials.json
```

### 错误：找不到 .env 文件
```
⚠️  警告: 找不到 .env 文件
```

**解决方案：**
创建 `.env` 文件：
```bash
cp .env.example .env
# 然后编辑 .env，添加你的 GOOGLE_SHEET_ID
```

### 错误：未找到 GOOGLE_SHEET_ID
```
❌ 错误: .env 文件中未找到 GOOGLE_SHEET_ID
```

**解决方案：**
编辑 `.env` 文件，添加：
```
GOOGLE_SHEET_ID=你的Sheet ID
```

## 📝 示例输出

完整的 `railway-env.txt` 示例：

```
# Railway 环境变量配置
# 复制以下内容到 Railway 项目的环境变量设置中

GOOGLE_SHEET_ID=16--6UzDMSm52KNezQqs3M2VPlC-A9dLwvcql62gVn24

GOOGLE_CREDENTIALS_JSON=
{"type":"service_account","project_id":"pastoral-reservation","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"reservation@pastoral-reservation.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
```

## ✅ 验证

在 Railway 部署后，检查日志应该看到：

```
📡 使用环境变量中的 Google 凭证
✅ Google Sheets API 已连接
🙏 牧师教练预约系统已启动
```

如果看到这些消息，说明环境变量配置成功！

## 🔗 相关文档

- [快速开始指南](./QUICKSTART.md)
- [完整部署指南](./DEPLOYMENT.md)
- [部署检查清单](./DEPLOYMENT-CHECKLIST.md)
- [Railway 总结](./RAILWAY-SUMMARY.md)

---

有问题？查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的故障排除部分。
