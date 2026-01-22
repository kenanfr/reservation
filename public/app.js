// DOM Elements
const slotsContainer = document.getElementById('slots-container');
const dateSelect = document.getElementById('date-select');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalTime = document.getElementById('modal-time');
const bookingForm = document.getElementById('booking-form');
const selectedSlotInput = document.getElementById('selected-slot');
const selectedDateInput = document.getElementById('selected-date');
const submitBtn = document.getElementById('submit-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// State
let currentDate = '';
let slots = [];
let availableDates = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDates();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    bookingForm.addEventListener('submit', handleBooking);

    // Date selector change
    dateSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            currentDate = e.target.value;
            loadSlots(currentDate);
        }
    });

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
}

// Load available dates
async function loadDates() {
    try {
        const response = await fetch('/api/dates');
        const data = await response.json();

        if (data.success && data.dates.length > 0) {
            availableDates = data.dates;
            populateDateSelector();
            // Load slots for the first date
            loadSlots(availableDates[0]);
        } else {
            showError('暂无可预约日期');
        }
    } catch (error) {
        console.error('Error loading dates:', error);
        showError('无法加载日期列表');
    }
}

// Populate date selector
function populateDateSelector() {
    dateSelect.innerHTML = '';

    availableDates.forEach(dateStr => {
        const option = document.createElement('option');
        option.value = dateStr;
        option.textContent = formatDateLong(dateStr);
        dateSelect.appendChild(option);
    });
}

// Format date long (for selector)
function formatDateLong(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    };
    return date.toLocaleDateString('zh-CN', options);
}

// Load time slots from API
async function loadSlots(date) {
    currentDate = date;
    dateSelect.value = date;

    // Show loading
    slotsContainer.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>正在加载时段...</p>
    </div>
  `;

    try {
        const response = await fetch(`/api/slots?date=${date}`);
        const data = await response.json();

        if (data.success) {
            slots = data.slots;
            renderSlots();
        } else {
            showError('加载预约信息失败');
        }
    } catch (error) {
        console.error('Error loading slots:', error);
        showError('无法连接服务器');
    }
}

// Render time slots
function renderSlots() {
    slotsContainer.innerHTML = '';

    slots.forEach((slot) => {
        const card = document.createElement('div');
        card.className = `slot-card${slot.isBooked ? ' booked' : ''}`;

        card.innerHTML = `
      <div class="slot-info">
        <div class="slot-time-icon">🕐</div>
        <span class="slot-time">${slot.time}</span>
      </div>
      <span class="slot-status ${slot.isBooked ? 'booked' : 'available'}">
        ${slot.isBooked ? '已预约' : '可预约'}
      </span>
    `;

        if (!slot.isBooked) {
            card.addEventListener('click', () => openModal(slot));
        }

        slotsContainer.appendChild(card);
    });
}

// Open booking modal
function openModal(slot) {
    selectedSlotInput.value = slot.time;
    selectedDateInput.value = slot.date;
    modalTime.textContent = `${formatDateShort(slot.date)} ${slot.time}`;

    // Reset form
    bookingForm.reset();
    selectedSlotInput.value = slot.time;
    selectedDateInput.value = slot.date;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus on name input
    setTimeout(() => {
        document.getElementById('name').focus();
    }, 100);
}

// Close modal
function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Format date short
function formatDateShort(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// Handle booking submission
async function handleBooking(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const timeSlot = selectedSlotInput.value;
    const date = selectedDateInput.value;

    if (!name) {
        showToast('请填写您的姓名', true);
        return;
    }

    // Show loading state
    setLoading(true);

    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date, timeSlot, name })
        });

        const data = await response.json();

        if (data.success) {
            closeModal();
            showToast('预约成功！期待与您的会面 🙏');

            // Reload slots to reflect changes
            await loadSlots();
        } else {
            showToast(data.message || '预约失败，请重试', true);
        }
    } catch (error) {
        console.error('Booking error:', error);
        showToast('网络错误，请稍后重试', true);
    } finally {
        setLoading(false);
    }
}

// Set loading state
function setLoading(loading) {
    submitBtn.disabled = loading;
    document.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
    document.querySelector('.btn-loading').style.display = loading ? 'flex' : 'none';
}

// Show toast notification
function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toast.className = `toast${isError ? ' error' : ''}`;

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show error in slots container
function showError(message) {
    slotsContainer.innerHTML = `
    <div class="loading">
      <p style="color: var(--error);">⚠️ ${message}</p>
      <button onclick="loadSlots()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer;">
        重试
      </button>
    </div>
  `;
}
