let eventConfig = {
  name: "Victoria",
  phrase: "Hay historias y personas que no voy a olvidar y recuerdos como este que siempre voy a guardar. Porque son parte de mi vida es mi deseo que compartan conmigo en este dia tan especial.",
  dateLabel: "Sábado 19 de diciembre de 2026",
  timeLabel: "A partir de las 21:00 hs",
  address: "Deán Funes 399-499, Benavídez, Provincia de Buenos Aires",
  targetIso: "2026-12-19T21:00:00-03:00",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=De%C3%A1n+Funes+399-499,+Benav%C3%ADdez,+Provincia+de+Buenos+Aires"
};

let countdownInterval = null;
let overlayShown = false;

async function loadConfig() {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (response.ok) {
      const jsonData = await response.json();
      eventConfig = { ...eventConfig, ...jsonData };
    }
  } catch (err) {
    // Mantiene los valores por defecto si no carga data.json (por ejemplo, abriendo con file://)
  }
  renderEventData();
}

function buildGoogleCalendarUrl() {
  const start = "20261220T000000Z";
  const end = "20261220T040000Z";
  const title = encodeURIComponent(`Mis 15 Años — ${eventConfig.name}`);
  const location = encodeURIComponent(eventConfig.address);
  const details = encodeURIComponent(eventConfig.phrase);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

function renderEventData() {
  document.getElementById("quinceanera-name").textContent = eventConfig.name;
  document.getElementById("invitation-phrase").textContent = `“${eventConfig.phrase}”`;
  document.getElementById("event-date-text").textContent = eventConfig.dateLabel;
  document.getElementById("event-time-text").textContent = eventConfig.timeLabel;
  document.getElementById("event-address-text").textContent = eventConfig.address;
  document.getElementById("maps-link").href = eventConfig.mapsUrl;
  document.getElementById("calendar-link").href = buildGoogleCalendarUrl();
}

function revealSheetControls() {
  if (overlayShown) return;
  overlayShown = true;

  const video = document.getElementById("bg-video");
  const skipBtn = document.getElementById("btn-skip");
  const overlay = document.getElementById("sheet-overlay");

  if (video && video.duration) {
    video.pause();
    video.currentTime = Math.max(0, video.duration - 0.05);
  }

  if (skipBtn) {
    skipBtn.classList.add("hidden");
  }
  if (overlay) {
    overlay.classList.add("visible");
  }
}

function showPanel(panelId, buttonEl) {
  const infoPanel = document.getElementById("info-panel");
  const panels = document.querySelectorAll(".panel-content");
  const buttons = document.querySelectorAll(".champagne-btn");

  panels.forEach((p) => p.classList.add("hidden"));
  buttons.forEach((b) => b.classList.remove("active-btn"));

  infoPanel.classList.remove("hidden");
  document.getElementById(panelId).classList.remove("hidden");
  buttonEl.classList.add("active-btn");

  if (panelId === "panel-contador") {
    startCountdown();
  }
}

function updateCountdown() {
  const targetTime = new Date(eventConfig.targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, targetTime - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

function startCountdown() {
  updateCountdown();
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdownInterval = setInterval(updateCountdown, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  loadConfig();

  const video = document.getElementById("bg-video");
  const skipBtn = document.getElementById("btn-skip");

  if (video) {
    video.addEventListener("ended", revealSheetControls);
    video.addEventListener("timeupdate", () => {
      if (video.duration && video.currentTime >= video.duration - 0.15) {
        revealSheetControls();
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", revealSheetControls);
  }

  document.getElementById("btn-fecha").addEventListener("click", function () {
    showPanel("panel-fecha", this);
  });

  document.getElementById("btn-lugar").addEventListener("click", function () {
    showPanel("panel-lugar", this);
  });

  document.getElementById("btn-contador").addEventListener("click", function () {
    showPanel("panel-contador", this);
  });
});