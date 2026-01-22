require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 时间段配置
const TIME_SLOTS = [
  '9:00-10:30',
  '11:00-12:30',
  '14:00-15:30',
  '16:00-17:30',
  '18:00-19:30',
  '20:00-21:30'
];

// Google Sheets 认证
let sheets;
let auth;

async function initGoogleSheets() {
  try {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';

    auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets API 已连接');
  } catch (error) {
    console.error('⚠️ Google Sheets API 连接失败:', error.message);
    console.log('📝 请确保已配置 credentials.json 和 .env 文件');
  }
}

// 获取2026年2月到4月的所有周三
function getWednesdays() {
  const wednesdays = [];
  const startDate = new Date(2026, 1, 1); // 2026年2月1日
  const endDate = new Date(2026, 3, 30);   // 2026年4月30日

  // 找到第一个周三
  let current = new Date(startDate);
  while (current.getDay() !== 3) {
    current.setDate(current.getDate() + 1);
  }

  // 收集所有周三
  while (current <= endDate) {
    wednesdays.push(formatDate(current));
    current.setDate(current.getDate() + 7);
  }

  return wednesdays;
}

// 获取默认显示的周三（最近的未来周三）
function getDefaultWednesday() {
  const today = new Date();
  const wednesdays = getWednesdays();

  const todayStr = formatDate(today);

  // 找到第一个大于等于今天的周三
  for (const wed of wednesdays) {
    if (wed >= todayStr) {
      return wed;
    }
  }

  // 如果没有找到，返回最后一个
  return wednesdays[wednesdays.length - 1] || formatDate(today);
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 从 Google Sheet 获取预约数据
async function getReservationsFromSheet(date) {
  if (!sheets) return [];

  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:D'
    });

    const rows = response.data.values || [];
    // 跳过标题行，筛选指定日期的预约
    return rows.slice(1).filter(row => row[0] === date);
  } catch (error) {
    console.error('获取预约数据失败:', error.message);
    return [];
  }
}

// 添加预约到 Google Sheet
async function addReservationToSheet(date, timeSlot, name) {
  if (!sheets) {
    throw new Error('Google Sheets 未配置');
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[date, timeSlot, name, timestamp]]
    }
  });
}

// 确保 Sheet 有标题行
async function ensureSheetHeaders() {
  if (!sheets) return;

  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:D1'
    });

    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:D1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['日期', '时间段', '预约者姓名', '预约时间']]
        }
      });
      console.log('✅ 已创建 Sheet 标题行');
    }
  } catch (error) {
    console.error('检查标题行失败:', error.message);
  }
}

// API: 获取可预约的日期列表
app.get('/api/dates', (req, res) => {
  const wednesdays = getWednesdays();
  res.json({
    success: true,
    dates: wednesdays
  });
});

// API: 获取时段状态
app.get('/api/slots', async (req, res) => {
  try {
    const date = req.query.date || getDefaultWednesday();
    const reservations = await getReservationsFromSheet(date);

    const slots = TIME_SLOTS.map(slot => {
      const reservation = reservations.find(r => r[1] === slot);
      return {
        time: slot,
        date: date,
        isBooked: !!reservation,
        bookedBy: reservation ? reservation[2] : null
      };
    });

    res.json({
      success: true,
      date: date,
      slots: slots
    });
  } catch (error) {
    console.error('获取时段失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预约状态失败'
    });
  }
});

// API: 创建预约
app.post('/api/book', async (req, res) => {
  try {
    const { date, timeSlot, name } = req.body;

    // 验证输入
    if (!date || !timeSlot || !name) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的预约信息'
      });
    }

    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: '无效的时间段'
      });
    }

    // 检查是否已被预约
    const reservations = await getReservationsFromSheet(date);
    const existingBooking = reservations.find(r => r[1] === timeSlot);

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: '该时段已被预约'
      });
    }

    // 添加预约
    await addReservationToSheet(date, timeSlot, name);

    res.json({
      success: true,
      message: '预约成功！'
    });
  } catch (error) {
    console.error('预约失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '预约失败，请稍后重试'
    });
  }
});

// 所有其他路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`\n🙏 牧师教练预约系统已启动`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`📅 可预约周三: 2026年2月 - 4月\n`);

  await initGoogleSheets();
  await ensureSheetHeaders();
});
