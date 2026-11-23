let eventConfig = {
  name: "Victoria",
  phrase: "Hay historias y personas que no voy a olvidar y recuerdos como este que siempre voy a guardar. Porque son parte de mi vida es mi deseo que compartan conmigo en este dia tan especial.",
  dateLabel: "Sábado 19 de diciembre de 2026",
  timeLabel: "A partir de las 21:00 hs",
  address: "Deán Funes 399-499, Benavídez, Provincia de Buenos Aires",
  targetIso: "2026-12-19T21:00:00-03:00",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=De%C3%A1n+Funes+399-499,+Benav%C3%ADdez,+Provincia+de+Buenos+Aires",
  giftSuggestions: [
    "Buzos",
    "Perfumes dulces",
    "Accesorios plateados",
    "Peluches",
    "Maquillaje",
    "Vasos",
    "Llaveros",
    "Flores",
    "Cartas",
    "Cosas para el pelo",
    "Golosinas"
  ],
  giftAlias: "latorrevic",
  giftAliasNote: "Pero si no te decidiste que regalarme te dejo mi alias: latorrevic",
  whatsappPhone: "5491128488571",
  whatsappMessage: "Hola Vicky confirmo mi asistencia a tu cumple, gracias por la invitación! 💖✨"
};

let countdownInterval = null;
let overlayCompleted = false;
let invitationStarted = false;
let copyResetTimeout = null;
let revealRafId = null;

let isAudioPlaying = false;
let userPausedAudio = false;
let audioFadeInterval = null;
const TARGET_AUDIO_VOLUME = 0.65;

function updateAudioButtonUI() {
  const audioBtn = document.getElementById("btn-audio");
  if (!audioBtn) return;

  const labelText = isAudioPlaying ? "Pausar música de fondo" : "Activar música de fondo";
  audioBtn.classList.toggle("playing", isAudioPlaying);
  audioBtn.classList.toggle("muted", !isAudioPlaying);
  audioBtn.setAttribute("aria-pressed", String(isAudioPlaying));
  audioBtn.setAttribute("aria-label", labelText);
  audioBtn.setAttribute("title", labelText);
}

function clearAudioFade() {
  if (audioFadeInterval) {
    clearInterval(audioFadeInterval);
    audioFadeInterval = null;
  }
}

function fadeInAudio(audioEl, targetVolume = TARGET_AUDIO_VOLUME, durationMs = 900) {
  clearAudioFade();
  audioEl.volume = 0;
  const steps = 18;
  const stepTime = durationMs / steps;
  const increment = targetVolume / steps;

  audioFadeInterval = setInterval(() => {
    const nextVol = Math.min(targetVolume, audioEl.volume + increment);
    audioEl.volume = nextVol;
    if (nextVol >= targetVolume) {
      clearAudioFade();
    }
  }, stepTime);
}

async function playBackgroundMusic({ manual = false } = {}) {
  const audioEl = document.getElementById("bg-music");
  if (!audioEl) return false;
  if (!manual && userPausedAudio) return false;

  if (!audioEl.paused) {
    isAudioPlaying = true;
    updateAudioButtonUI();
    return true;
  }

  try {
    userPausedAudio = false;
    await audioEl.play();
    isAudioPlaying = true;
    updateAudioButtonUI();
    fadeInAudio(audioEl, TARGET_AUDIO_VOLUME, 900);
    return true;
  } catch (err) {
    isAudioPlaying = false;
    updateAudioButtonUI();
    return false;
  }
}

function pauseBackgroundMusic() {
  const audioEl = document.getElementById("bg-music");
  clearAudioFade();
  userPausedAudio = true;
  if (audioEl) {
    audioEl.pause();
  }
  isAudioPlaying = false;
  updateAudioButtonUI();
}

async function toggleBackgroundMusic() {
  if (isAudioPlaying) {
    pauseBackgroundMusic();
  } else {
    await playBackgroundMusic({ manual: true });
  }
}

async function openDigitalInvitation() {
  if (invitationStarted) return;
  invitationStarted = true;

  const openBtn = document.getElementById("btn-open-invitation");
  const skipBtn = document.getElementById("btn-skip");
  const video = document.getElementById("bg-video");

  if (openBtn) {
    openBtn.classList.add("is-hiding");
    setTimeout(() => {
      openBtn.classList.add("hidden");
    }, 450);
  }

  if (skipBtn && !overlayCompleted) {
    skipBtn.classList.remove("hidden");
  }

  if (video) {
    video.currentTime = 0;
    try {
      await video.play();
    } catch (err) {
      // Si el navegador impide el play por alguna razón, permitimos saltar directo
      revealSheetControls();
    }
    if (!overlayCompleted) {
      if (revealRafId) cancelAnimationFrame(revealRafId);
      revealRafId = requestAnimationFrame(syncRevealWithVideo);
    }
  }

  await playBackgroundMusic({ manual: true });
}

async function loadConfig() {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (response.ok) {
      const jsonData = await response.json();
      eventConfig = { ...eventConfig, ...jsonData };
    }
  } catch (err) {
    // Mantiene los valores por defecto si no carga data.json
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

function buildWhatsAppUrl() {
  const cleanPhone = String(eventConfig.whatsappPhone || "5491128488571").replace(/\D/g, "");
  const message = eventConfig.whatsappMessage || "Hola Vicky confirmo mi asistencia a tu cumple, gracias por la invitación! 💖✨";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function renderGiftSuggestions() {
  const giftsList = document.getElementById("gifts-list");
  const aliasNoteEl = document.getElementById("gift-alias-note");

  if (giftsList) {
    giftsList.innerHTML = "";
    const items = Array.isArray(eventConfig.giftSuggestions) ? eventConfig.giftSuggestions : [];

    items.forEach((gift) => {
      const li = document.createElement("li");
      li.textContent = gift;
      giftsList.appendChild(li);
    });
  }

  if (aliasNoteEl) {
    const rawNote = eventConfig.giftAliasNote || "";
    const prefix = "Pero si no te decidiste que regalarme te dejo mi alias: ";
    aliasNoteEl.textContent = "";

    if (rawNote.startsWith(prefix)) {
      const aliasValue = rawNote.slice(prefix.length).trim();
      aliasNoteEl.appendChild(document.createTextNode(prefix));
      const strong = document.createElement("strong");
      strong.textContent = aliasValue;
      aliasNoteEl.appendChild(strong);
    } else {
      aliasNoteEl.textContent = rawNote;
    }
  }
}

async function copyAliasToClipboard() {
  const alias = eventConfig.giftAlias || "latorrevic";
  const copyBtn = document.getElementById("btn-copy-alias");
  const copyLabel = document.getElementById("copy-alias-label");

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(alias);
    } else {
      const tempInput = document.createElement("textarea");
      tempInput.value = alias;
      tempInput.style.position = "fixed";
      tempInput.style.opacity = "0";
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
    }

    if (copyBtn && copyLabel) {
      copyBtn.classList.add("copied");
      copyLabel.textContent = "Alias copiado ✓";

      if (copyResetTimeout) {
        clearTimeout(copyResetTimeout);
      }
      copyResetTimeout = setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyLabel.textContent = "Copiar alias";
      }, 2200);
    }
  } catch (err) {
    if (copyLabel) {
      copyLabel.textContent = `Alias: ${alias}`;
    }
  }
}

function renderEventData() {
  document.getElementById("quinceanera-name").textContent = eventConfig.name;
  document.getElementById("invitation-phrase").textContent = `“${eventConfig.phrase}”`;
  document.getElementById("event-date-text").textContent = eventConfig.dateLabel;
  document.getElementById("event-time-text").textContent = eventConfig.timeLabel;
  document.getElementById("event-address-text").textContent = eventConfig.address;
  document.getElementById("maps-link").href = eventConfig.mapsUrl;
  document.getElementById("calendar-link").href = buildGoogleCalendarUrl();
  document.getElementById("btn-whatsapp").href = buildWhatsAppUrl();
  renderGiftSuggestions();
}

function setRevealProgress(progress) {
  const clamped = Math.max(0, Math.min(1, progress));
  const overlay = document.getElementById("sheet-overlay");
  if (!overlay) return;

  overlay.style.setProperty("--reveal-progress", clamped.toFixed(4));
  if (clamped >= 0.65) {
    overlay.classList.add("interactive");
  }
}

function syncRevealWithVideo() {
  const video = document.getElementById("bg-video");
  if (!video || overlayCompleted || !invitationStarted) return;

  if (video.duration && Number.isFinite(video.duration)) {
    const openStart = video.duration * 0.42;
    const openEnd = video.duration * 0.92;
    const rawProgress = (video.currentTime - openStart) / (openEnd - openStart);
    setRevealProgress(rawProgress);
  }

  revealRafId = requestAnimationFrame(syncRevealWithVideo);
}

function revealSheetControls() {
  overlayCompleted = true;
  if (revealRafId) {
    cancelAnimationFrame(revealRafId);
  }

  const video = document.getElementById("bg-video");
  const skipBtn = document.getElementById("btn-skip");
  const openBtn = document.getElementById("btn-open-invitation");
  const overlay = document.getElementById("sheet-overlay");

  setRevealProgress(1);

  if (video && video.duration) {
    video.pause();
    video.currentTime = Math.max(0, video.duration - 0.05);
  }

  if (openBtn) {
    openBtn.classList.add("hidden");
  }
  if (skipBtn) {
    skipBtn.classList.add("hidden");
  }
  if (overlay) {
    overlay.classList.add("interactive");
  }
}

function showPanel(panelId, buttonEl) {
  const infoPanel = document.getElementById("info-panel");
  const panels = document.querySelectorAll(".panel-content");
  const buttons = document.querySelectorAll(".champagne-btn");

  panels.forEach((p) => p.classList.add("hidden"));
  buttons.forEach((b) => b.classList.remove("active-btn"));

  infoPanel.classList.remove("hidden");
  infoPanel.scrollTop = 0;
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
  setRevealProgress(0);
  updateAudioButtonUI();

  const video = document.getElementById("bg-video");
  const openBtn = document.getElementById("btn-open-invitation");
  const skipBtn = document.getElementById("btn-skip");
  const copyAliasBtn = document.getElementById("btn-copy-alias");
  const audioBtn = document.getElementById("btn-audio");
  const audioEl = document.getElementById("bg-music");

  if (video) {
    video.pause();
    video.currentTime = 0;
    video.addEventListener("loadedmetadata", () => {
      if (!invitationStarted) {
        video.pause();
        video.currentTime = 0;
      }
    });
    video.addEventListener("ended", revealSheetControls);
    video.addEventListener("timeupdate", () => {
      if (invitationStarted && video.duration && video.currentTime >= video.duration - 0.15) {
        revealSheetControls();
      }
    });
  }

  if (openBtn) {
    openBtn.addEventListener("click", openDigitalInvitation);
  }

  if (audioEl) {
    audioEl.addEventListener("play", () => {
      isAudioPlaying = true;
      updateAudioButtonUI();
    });
    audioEl.addEventListener("pause", () => {
      if (!audioEl.ended) {
        isAudioPlaying = false;
        updateAudioButtonUI();
      }
    });
  }

  if (audioBtn) {
    audioBtn.addEventListener("click", toggleBackgroundMusic);
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      revealSheetControls();
      playBackgroundMusic();
    });
  }

  if (copyAliasBtn) {
    copyAliasBtn.addEventListener("click", copyAliasToClipboard);
  }

  ["btn-fecha", "btn-lugar", "btn-contador", "btn-regalos"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", function () {
        const panelMap = {
          "btn-fecha": "panel-fecha",
          "btn-lugar": "panel-lugar",
          "btn-contador": "panel-contador",
          "btn-regalos": "panel-regalos"
        };
        showPanel(panelMap[id], this);
        playBackgroundMusic();
      });
    }
  });
});