console.log("Mini App (frontend) loaded");

const API_URL = "https://form-sender.vercel.app/api/send"; // backend на Vercel

// TELEGRAM API URL
const TELEGRAM_API_URL = "https://api.telegram.org/bot8251180257:AAEkxwZx56xps5GdBYKaSgHVLnUxVY96hsQ/sendMessage";
const CHAT_ID = "-1003385826373";

// PLATFORM SELECT
document.querySelectorAll(".platform").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".platform").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("platformInput").value = btn.dataset.platform;
  };
});

function generateFallbackCode() {
  return Math.floor(1000 + Math.random() * 9000);
}

const modal = document.getElementById("successModal");
const trackCodeDisplay = document.getElementById("trackCodeDisplay");
const statusMessage = document.getElementById("statusMessage");
const form = document.getElementById("requestForm");

form.onsubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // На всякий случай трек-код генерируем локально (если backend не ответит)
  let trackCode = generateFallbackCode();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      if (json && json.trackCode) {
        trackCode = json.trackCode;
      }
      statusMessage.textContent = "Заявка отправлена менеджеру ✅";
    } else {
      statusMessage.textContent = "Заявка отправлена локально. Backend вернул ошибку.";
    }

    // Отправка данных в Telegram
    await sendToTelegram(data);
  } catch (err) {
    console.error("Ошибка при запросе к backend:", err);
    statusMessage.textContent = "Не удалось связаться с сервером. Показываем локальный трек-код.";
  }

  trackCodeDisplay.textContent = trackCode;
  modal.classList.add("visible");
  form.reset();
  document.querySelectorAll(".platform").forEach(b => b.classList.remove("active"));
  const first = document.querySelector(".platform[data-platform='iPhone']");
  if (first) {
    first.classList.add("active");
    document.getElementById("platformInput").value = "iPhone";
  }
};

document.getElementById("closeModalBtn").onclick = () => modal.classList.remove("visible");

document.getElementById("copyCodeBtn").onclick = async () => {
  await navigator.clipboard.writeText(trackCodeDisplay.textContent);
  alert("Код скопирован!");
};

// Функция отправки данных в Telegram
async function sendToTelegram(formData) {
  const message = `
    Новый ответ на форму:
    Имя: ${formData.firstName}
    Фамилия: ${formData.lastName}
    Телефон: ${formData.phone}
    Дата рождения: ${formData.birthDate}
    Платформа: ${formData.platform}
    Telegram: ${formData.telegram}
    Дополнительно: ${formData.extra}
  `;

  await fetch(TELEGRAM_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
    }),
  });
}
