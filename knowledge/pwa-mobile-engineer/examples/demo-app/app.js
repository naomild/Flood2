// Page script: register the SW, load the forecast, show its age, wire install UX.
// The demo fetches /mock-open-meteo/forecast.json; the real app fetches api.open-meteo.com.
const WEATHER_URL = "/mock-open-meteo/forecast.json";
const status = document.getElementById("status");
const today = document.getElementById("today");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((e) => console.error(`Registration failed with ${e}`));
}

async function load() {
  try {
    const res = await fetch(WEATHER_URL);
    const data = await res.json();
    const fetchedAt = Number(res.headers.get("x-flood-fetched-at")) || Date.now();
    const fromCache = res.headers.get("x-flood-source") === "cache";
    const d = data.daily;
    today.textContent = `${d.precipitation_sum[1].toFixed(1)} in of rain expected (${d.precipitation_probability_max[1]}% chance)`;
    const time = new Date(fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
    status.textContent = fromCache ? `Offline · Updated ${time}` : `Updated ${time}`;
  } catch {
    status.textContent = "Unable to load the forecast. Connect to the internet and try again.";
  }
}
load();

// Android / Chromium install (web.dev pattern)
let deferredPrompt;
const installBtn = document.getElementById("install");
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; installBtn.hidden = false; });
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

// iPhone: no beforeinstallprompt — show a one-time hint in the browser, never when installed.
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
let dismissed = false;
try { dismissed = localStorage.getItem("ios-hint-dismissed") === "1"; } catch {}
if (isIOS && !standalone && !dismissed) document.getElementById("ios-hint").hidden = false;
