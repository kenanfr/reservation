const slotsContainer = document.getElementById('slots-container');
const dateSelect = document.getElementById('date-select');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const modalTime = document.getElementById('modal-time');
const bookingForm = document.getElementById('booking-form');
const cancelView = document.getElementById('cancel-view');
const cancelMessage = document.getElementById('cancel-message');
const cancelCloseBtn = document.getElementById('cancel-close-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const selectedSlotInput = document.getElementById('selected-slot');
const selectedDateInput = document.getElementById('selected-date');
const submitBtn = document.getElementById('submit-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

const STORAGE_KEY = 'reservation-owner-codes';

let currentDate = '';
let slots = [];
let availableDates = [];
let activeSlot = null;
let toastTimer;

document.addEventListener('DOMContentLoaded', () => {
  loadDates();
  setupEventListeners();
});

function setupEventListeners() {
  modalClose.addEventListener('click', closeModal);
  cancelCloseBtn.addEventListener('click', closeModal);
  confirmCancelBtn.addEventListener('click', handleCancellation);
  bookingForm.addEventListener('submit', handleBooking);

  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

  dateSelect.addEventListener('change', (event) => {
    if (event.target.value) {
      loadSlots(event.target.value);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
}

function getStorageKey(date, timeSlot) {
  return `${date}__${timeSlot}`;
}

function getStoredOwnerCodes() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('读取本地预约码失败:', error);
    return {};
  }
}

function saveStoredOwnerCodes(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setStoredOwnerCode(date, timeSlot, ownerCode) {
  const codes = getStoredOwnerCodes();
  codes[getStorageKey(date, timeSlot)] = ownerCode;
  saveStoredOwnerCodes(codes);
}

function getStoredOwnerCode(date, timeSlot) {
  const codes = getStoredOwnerCodes();
  return codes[getStorageKey(date, timeSlot)] || '';
}

function removeStoredOwnerCode(date, timeSlot) {
  const codes = getStoredOwnerCodes();
  delete codes[getStorageKey(date, timeSlot)];
  saveStoredOwnerCodes(codes);
}

function getOwnerCodesForDate(date) {
  const prefix = `${date}__`;
  const codes = getStoredOwnerCodes();

  return Object.entries(codes)
    .filter(([key, value]) => key.startsWith(prefix) && value)
    .map(([, value]) => value);
}

async function loadDates() {
  try {
    const response = await fetch('/api/dates');
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || '无法加载日期列表');
    }

    availableDates = data.dates || [];

    if (availableDates.length === 0) {
      showNoDatesState();
      return;
    }

    populateDateSelector();
    await loadSlots(availableDates[0]);
  } catch (error) {
    console.error('Error loading dates:', error);
    renderStatusPanel('无法加载日期列表', {
      isError: true,
      buttonText: '重试',
      onClick: loadDates
    });
  }
}

function populateDateSelector() {
  dateSelect.disabled = false;
  dateSelect.innerHTML = '';

  availableDates.forEach((dateStr) => {
    const option = document.createElement('option');
    option.value = dateStr;
    option.textContent = formatDateLong(dateStr);
    dateSelect.appendChild(option);
  });
}

function createDisplayDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatDateLong(dateStr) {
  return createDisplayDate(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
}

function formatDateShort(dateStr) {
  const date = createDisplayDate(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

async function loadSlots(date) {
  currentDate = date;
  dateSelect.value = date;

  slotsContainer.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>正在加载时段...</p>
    </div>
  `;

  const params = new URLSearchParams({ date });
  getOwnerCodesForDate(date).forEach((code) => params.append('ownerCodes', code));

  try {
    const response = await fetch(`/api/slots?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || '加载预约信息失败');
    }

    slots = data.slots || [];
    renderSlots();
  } catch (error) {
    console.error('Error loading slots:', error);
    renderStatusPanel(error.message || '无法连接服务器', {
      isError: true,
      buttonText: '重试',
      onClick: () => loadSlots(date)
    });
  }
}

function renderSlots() {
  if (slots.length === 0) {
    renderStatusPanel('当前日期暂无可预约时段');
    return;
  }

  slotsContainer.innerHTML = '';

  slots.forEach((slot) => {
    const card = document.createElement('div');
    const cardClasses = ['slot-card'];

    if (slot.isBooked) {
      cardClasses.push('booked');
    }

    if (slot.canCancel) {
      cardClasses.push('mine');
    }

    card.className = cardClasses.join(' ');
    card.innerHTML = `
      <div class="slot-info">
        <div class="slot-time-icon">${slot.canCancel ? '🔓' : slot.isBooked ? '🔒' : '🕐'}</div>
        <span class="slot-time">${slot.time}</span>
      </div>
      <span class="slot-status ${slot.isBooked ? 'booked' : 'available'}${slot.canCancel ? ' mine' : ''}">
        ${slot.label}
      </span>
    `;

    if (!slot.isBooked) {
      card.addEventListener('click', () => openBookingModal(slot));
    } else if (slot.canCancel) {
      card.addEventListener('click', () => openCancelModal(slot));
    }

    slotsContainer.appendChild(card);
  });
}

function openBookingModal(slot) {
  activeSlot = slot;
  modalTitle.textContent = '预约教练';
  modalTime.textContent = `${formatDateShort(slot.date)} ${slot.time}`;

  bookingForm.reset();
  selectedSlotInput.value = slot.time;
  selectedDateInput.value = slot.date;
  bookingForm.classList.remove('hidden');
  cancelView.classList.add('hidden');

  openModal();

  setTimeout(() => {
    document.getElementById('name').focus();
  }, 100);
}

function openCancelModal(slot) {
  activeSlot = slot;
  modalTitle.textContent = '取消预约';
  modalTime.textContent = `${formatDateShort(slot.date)} ${slot.time}`;
  cancelMessage.textContent = `您已预约 ${formatDateShort(slot.date)} ${slot.time}，确认取消吗？`;

  bookingForm.classList.add('hidden');
  cancelView.classList.remove('hidden');
  openModal();
}

function openModal() {
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  bookingForm.classList.remove('hidden');
  cancelView.classList.add('hidden');
  setBookingLoading(false);
  setCancelLoading(false);
  activeSlot = null;
}

async function handleBooking(event) {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const timeSlot = selectedSlotInput.value;
  const date = selectedDateInput.value;

  if (!name) {
    showToast('请填写您的姓名', true);
    return;
  }

  setBookingLoading(true);

  try {
    const response = await fetch('/api/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date, timeSlot, name })
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || '预约失败，请重试');
    }

    if (data.ownerCode) {
      setStoredOwnerCode(date, timeSlot, data.ownerCode);
    }

    closeModal();
    showToast('预约成功！期待与您的会面');
    await loadSlots(currentDate);
  } catch (error) {
    console.error('Booking error:', error);
    showToast(error.message || '网络错误，请稍后重试', true);
  } finally {
    setBookingLoading(false);
  }
}

async function handleCancellation() {
  if (!activeSlot) {
    return;
  }

  const ownerCode = getStoredOwnerCode(activeSlot.date, activeSlot.time);

  if (!ownerCode) {
    showToast('未找到当前浏览器保存的预约码', true);
    closeModal();
    return;
  }

  setCancelLoading(true);

  try {
    const response = await fetch('/api/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: activeSlot.date,
        timeSlot: activeSlot.time,
        ownerCode
      })
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || '取消预约失败');
    }

    removeStoredOwnerCode(activeSlot.date, activeSlot.time);
    closeModal();
    showToast('预约已取消');
    await loadSlots(currentDate);
  } catch (error) {
    console.error('Cancellation error:', error);
    showToast(error.message || '取消预约失败，请稍后重试', true);
  } finally {
    setCancelLoading(false);
  }
}

function setBookingLoading(loading) {
  submitBtn.disabled = loading;
  document.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
  document.querySelector('.btn-loading').style.display = loading ? 'flex' : 'none';
}

function setCancelLoading(loading) {
  confirmCancelBtn.disabled = loading;
  confirmCancelBtn.textContent = loading ? '取消中...' : '确认取消预约';
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toast.className = `toast${isError ? ' error' : ''}`;

  setTimeout(() => toast.classList.add('show'), 10);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function renderStatusPanel(message, options = {}) {
  const { isError = false, buttonText = '', onClick = null } = options;

  slotsContainer.innerHTML = `
    <div class="loading">
      <p class="${isError ? 'status-error' : 'status-text'}">${message}</p>
      ${
        buttonText
          ? `<button type="button" class="state-btn" id="state-action-btn">${buttonText}</button>`
          : ''
      }
    </div>
  `;

  if (buttonText && typeof onClick === 'function') {
    document.getElementById('state-action-btn').addEventListener('click', onClick);
  }
}

function showNoDatesState() {
  dateSelect.disabled = true;
  dateSelect.innerHTML = '<option value="">暂无可预约日期</option>';
  renderStatusPanel('当前没有可预约日期，请先在 schedule.json 中配置未来日期');
}
