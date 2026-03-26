require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const TIME_ZONE = 'Europe/Paris';
const SHEET_TITLE = 'Sheet1';
const SHEET_HEADERS = ['日期', '时间段', '预约者姓名', '预约时间', '预约码'];
const SCHEDULE_PATH = path.join(__dirname, 'schedule.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let sheets;

async function initGoogleSheets() {
  try {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json';
    const authConfig = {
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    };

    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      console.log('📡 使用环境变量中的 Google 凭证');
    } else {
      authConfig.keyFile = credentialsPath;
      console.log('📁 使用本地文件中的 Google 凭证');
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets API 已连接');
  } catch (error) {
    console.error('⚠️ Google Sheets API 连接失败:', error.message);
    console.log('📝 请确保已配置 credentials.json 和 .env 文件');
  }
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

function isValidDateString(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function readSchedule() {
  try {
    const rawContent = fs.readFileSync(SCHEDULE_PATH, 'utf8');
    const parsed = JSON.parse(rawContent);

    return {
      dates: normalizeStringArray(parsed.dates).filter(isValidDateString),
      timeSlots: normalizeStringArray(parsed.timeSlots)
    };
  } catch (error) {
    console.error('读取排期配置失败:', error.message);
    return {
      dates: [],
      timeSlots: []
    };
  }
}

function getTimeZoneDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function getFutureDates(schedule) {
  const today = getTimeZoneDateString();
  return schedule.dates.filter((date) => date >= today);
}

function getOwnerCodesFromQuery(ownerCodes) {
  if (Array.isArray(ownerCodes)) {
    return [...new Set(ownerCodes.map((value) => String(value).trim()).filter(Boolean))];
  }

  if (typeof ownerCodes === 'string') {
    return ownerCodes
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

function generateOwnerCode() {
  return crypto.randomBytes(18).toString('base64url');
}

async function getSheetRows() {
  if (!sheets) {
    return [];
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TITLE}!A:E`
  });

  return response.data.values || [];
}

async function getReservationsFromSheet(date) {
  if (!sheets) {
    return [];
  }

  try {
    const rows = await getSheetRows();

    return rows
      .slice(1)
      .map((row, index) => ({
        rowIndex: index + 2,
        date: row[0] || '',
        timeSlot: row[1] || '',
        name: row[2] || '',
        createdAt: row[3] || '',
        ownerCode: row[4] || ''
      }))
      .filter((row) => row.date === date);
  } catch (error) {
    console.error('获取预约数据失败:', error.message);
    return [];
  }
}

async function addReservationToSheet(date, timeSlot, name, ownerCode) {
  if (!sheets) {
    throw new Error('Google Sheets 未配置');
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: TIME_ZONE });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_TITLE}!A:E`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[date, timeSlot, name, timestamp, ownerCode]]
    }
  });
}

async function getSheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(sheetId,title)'
  });

  const matchedSheet = response.data.sheets?.find(
    (sheet) => sheet.properties?.title === SHEET_TITLE
  );

  return matchedSheet?.properties?.sheetId ?? response.data.sheets?.[0]?.properties?.sheetId;
}

async function deleteReservationFromSheet(rowIndex) {
  if (!sheets) {
    throw new Error('Google Sheets 未配置');
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetId = await getSheetId();

  if (sheetId === undefined) {
    throw new Error('未找到可删除的工作表');
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }
      ]
    }
  });
}

async function ensureSheetHeaders() {
  if (!sheets) {
    return;
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TITLE}!A1:E1`
    });

    const headerRow = response.data.values?.[0] || [];
    const shouldUpdateHeaders =
      headerRow.length === 0 ||
      SHEET_HEADERS.some((header, index) => headerRow[index] !== header);

    if (!shouldUpdateHeaders) {
      return;
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TITLE}!A1:E1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [SHEET_HEADERS]
      }
    });

    console.log('✅ 已检查并更新 Sheet 标题行');
  } catch (error) {
    console.error('检查标题行失败:', error.message);
  }
}

app.get('/api/dates', (req, res) => {
  const schedule = readSchedule();
  const dates = getFutureDates(schedule);

  res.json({
    success: true,
    dates
  });
});

app.get('/api/slots', async (req, res) => {
  try {
    const schedule = readSchedule();
    const futureDates = getFutureDates(schedule);

    if (futureDates.length === 0) {
      return res.json({
        success: true,
        date: null,
        slots: []
      });
    }

    const date = req.query.date || futureDates[0];

    if (!futureDates.includes(date)) {
      return res.status(400).json({
        success: false,
        message: '所选日期不可预约'
      });
    }

    const ownerCodes = getOwnerCodesFromQuery(req.query.ownerCodes);
    const reservations = await getReservationsFromSheet(date);

    const slots = schedule.timeSlots.map((slot) => {
      const reservation = reservations.find((item) => item.timeSlot === slot);

      if (!reservation) {
        return {
          time: slot,
          date,
          isBooked: false,
          label: '可预约',
          canCancel: false
        };
      }

      const isOwner =
        Boolean(reservation.ownerCode) && ownerCodes.includes(reservation.ownerCode);

      return {
        time: slot,
        date,
        isBooked: true,
        label: isOwner ? `${reservation.name}已预约` : '已预约',
        canCancel: isOwner
      };
    });

    res.json({
      success: true,
      date,
      slots
    });
  } catch (error) {
    console.error('获取时段失败:', error.message);
    res.status(500).json({
      success: false,
      message: '获取预约状态失败'
    });
  }
});

app.post('/api/book', async (req, res) => {
  try {
    const schedule = readSchedule();
    const futureDates = getFutureDates(schedule);
    const { date, timeSlot } = req.body;
    const name = String(req.body.name || '').trim();

    if (!date || !timeSlot || !name) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的预约信息'
      });
    }

    if (!futureDates.includes(date)) {
      return res.status(400).json({
        success: false,
        message: '所选日期不可预约'
      });
    }

    if (!schedule.timeSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: '无效的时间段'
      });
    }

    const reservations = await getReservationsFromSheet(date);
    const existingBooking = reservations.find((item) => item.timeSlot === timeSlot);

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: '该时段已被预约'
      });
    }

    const ownerCode = generateOwnerCode();
    await addReservationToSheet(date, timeSlot, name, ownerCode);

    res.json({
      success: true,
      message: '预约成功！',
      ownerCode
    });
  } catch (error) {
    console.error('预约失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || '预约失败，请稍后重试'
    });
  }
});

app.post('/api/cancel', async (req, res) => {
  try {
    const date = String(req.body.date || '').trim();
    const timeSlot = String(req.body.timeSlot || '').trim();
    const ownerCode = String(req.body.ownerCode || '').trim();

    if (!date || !timeSlot || !ownerCode) {
      return res.status(400).json({
        success: false,
        message: '缺少取消预约所需信息'
      });
    }

    const reservations = await getReservationsFromSheet(date);
    const reservation = reservations.find((item) => item.timeSlot === timeSlot);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: '未找到对应的预约记录'
      });
    }

    if (!reservation.ownerCode || reservation.ownerCode !== ownerCode) {
      return res.status(403).json({
        success: false,
        message: '您无权取消该预约'
      });
    }

    await deleteReservationFromSheet(reservation.rowIndex);

    res.json({
      success: true,
      message: '预约已取消'
    });
  } catch (error) {
    console.error('取消预约失败:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || '取消预约失败，请稍后重试'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  const schedule = readSchedule();
  const futureDates = getFutureDates(schedule);

  console.log('\n🙏 牧师教练预约系统已启动');
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`🕒 系统时区: ${TIME_ZONE}`);
  console.log(`📅 已配置日期: ${schedule.dates.length} 个，当前可预约日期: ${futureDates.length} 个\n`);

  await initGoogleSheets();
  await ensureSheetHeaders();
});
