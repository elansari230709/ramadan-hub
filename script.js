const map = L.map('map', {
  center: [20, 0], // centre approximatif du globe
  zoom: 2,
  minZoom: 1,
  maxZoom: 7,
  maxBounds: [
    [-90, -180], // Sud-Ouest
    [90, 180]    // Nord-Est
  ]
});

// 2️⃣ Ajouter le fond OpenStreetMap sans répétition horizontale
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  noWrap: true,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
  
// 3️⃣ Marker cliquable pour récupérer lat/lng
let marker;
map.on('click', function(e) {
   const lat = e.latlng.lat;
   const lon = e.latlng.lng;

  if (marker) {
    map.removeLayer(marker);
  }

  marker = L.marker([lat, lon]).addTo(map);
  localStorage.setItem('lat', lat);
  localStorage.setItem('lon', lon);


  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;


  fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "VotreApp/1.0" 
    }
  })
    .then(response => response.json())
    .then(data => {
      const countryCode = data.address.country_code;
      console.log("Country code :", countryCode); 
      console.log("Country name :", data.address.country);
      console.log("City name :", data.address.city || data.address.town || data.address.village || "unknown");
      localStorage.setItem('countryCode', countryCode);
      localStorage.setItem('countryName', data.address.country);
      localStorage.setItem('cityName', data.address.city || data.address.town || data.address.village || "unknown");
    })
    .catch(error => {
      console.log("Country code :", "unknown"); 
      localStorage.setItem('countryCode', "unknown");
    });

});





function parametresOuvrir() {
  const menu = document.getElementById("menu_parametres");
  menu.style.display = "block";
}

function parametresFermer() {
  window.location.reload();
};


const currentPage = window.location.pathname.split("/").pop();
let iftarTimerId = null;

function setCountdownValues(diffMs) {
  const days = String(Math.floor(diffMs / (1000 * 60 * 60 * 24))).padStart(2, "0");
  const hours = String(Math.floor((diffMs / (1000 * 60 * 60)) % 24)).padStart(2, "0");
  const minutes = String(Math.floor((diffMs / (1000 * 60)) % 60)).padStart(2, "0");
  const seconds = String(Math.floor((diffMs / 1000) % 60)).padStart(2, "0");
  document.getElementById("heures").textContent = hours;
  document.getElementById("minutes").textContent = minutes;
  document.getElementById("secondes").textContent = seconds;
}

function getZonedTimeNow(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date());

    const value = {};
    parts.forEach((part) => {
      if (part.type !== 'literal') {
        value[part.type] = part.value;
      }
    });

    return {
      hour: parseInt(value.hour || "0", 10),
      minute: parseInt(value.minute || "0", 10),
      second: parseInt(value.second || "0", 10)
    };
  } catch (_) {
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds()
    };
  }
}

function startIftarCountdown(iftarHour, iftarMinute, timeZone) {
  if (iftarTimerId) {
    clearInterval(iftarTimerId);
  }

  function tick() {
    const now = getZonedTimeNow(timeZone);
    const nowSeconds = (now.hour * 3600) + (now.minute * 60) + now.second;
    const iftarSeconds = (iftarHour * 3600) + (iftarMinute * 60);

    let diffSeconds = iftarSeconds - nowSeconds;
    if (diffSeconds <= 0) {
      diffSeconds += 24 * 3600;
    }

    setCountdownValues(diffSeconds * 1000);
  }

  tick();
  iftarTimerId = setInterval(tick, 1000);
}

const methodesPays = {
  1: ["pk"],                  // University of Islamic Sciences, Karachi
  2: ["us", "ca"],            // Islamic Society of North America
  3: ["GLOBAL"],              // Muslim World League
  4: ["sa"],                  // Umm Al-Qura University, Makkah
  5: ["eg"],                  // Egyptian General Authority of Survey
  7: ["ir"],                  // Institute of Geophysics, Tehran
  8: ["bh", "om" ],      // Gulf Region
  9: ["kw"],                  // Kuwait
  10: ["qa"],                 // Qatar
  11: ["sg"],                 // MUIS, Singapore
  12: ["fr"],                 // UOIF, France
  13: ["tr"],                 // Diyanet, Turkey
  14: ["ru"],                 // Russia
  15: ["GLOBAL"],             // Moonsighting Committee Worldwide
  16: ["ae"],            // Dubai (experimental)
  17: ["my"],                  // JAKIM, Malaysia
  18: ["tn"],                 // Tunisia
  19: ["dz"],                 // Algeria
  20: ["id"],                 // KEMENAG, Indonesia
  21: ["ma"],                 // Morocco
  22: ["pt"],                 // Lisbon, Portugal
  23: ["jo"]                  // Jordan
};

function trouverMethode(paysCode) {
  for (const methode in methodesPays) {
    if (methodesPays[methode].includes(paysCode)) {
      return parseInt(methode); 
    }
  }
  return parseInt(3); 
}

function loadIftarCountdown() {
  const place = document.getElementById("place");
  if (place) {
    const city = localStorage.getItem('cityName');
    const country = localStorage.getItem('countryName');
    if (city && country) {
      place.textContent = city + ", " + country;
    }
  }

  const lat = localStorage.getItem('lat');
  const lon = localStorage.getItem('lon');

  if (!lat || !lon) {
    setCountdownValues(0);
    return;
  }

  const apiKey = 'dLwL5L0ISTPcQHlTbhTlozJDjz3CnpIzktG5D3xGmFTVWjGj';
  const method = trouverMethode(localStorage.getItem('countryCode'));
  const school = '1';
  const url = `https://islamicapi.com/api/v1/prayer-time/?lat=${lat}&lon=${lon}&method=${method}&school=${school}&api_key=${apiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.status !== 'success' || !data.data || !data.data.times || !data.data.times.Maghrib) {
        setCountdownValues(0);
        return;
      }

      const maghrib = data.data.times.Maghrib;
      const parts = maghrib.split(':');
      const hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);
      const timeZone = (data.data.timezone && data.data.timezone.name)
        ? data.data.timezone.name
        : Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        setCountdownValues(0);
        return;
      }

      startIftarCountdown(hour, minute, timeZone);
    })
    .catch(() => {
      setCountdownValues(0);
    });
}

if (currentPage === "accueil.html") {
  loadIftarCountdown();
}

if (currentPage === "prieres.html") {
  document.getElementById("place").textContent = localStorage.getItem('cityName') + ", " + localStorage.getItem('countryName');
  const lat = localStorage.getItem('lat');
  const lon = localStorage.getItem('lon');
  const apiKey = 'dLwL5L0ISTPcQHlTbhTlozJDjz3CnpIzktG5D3xGmFTVWjGj';
  const method = trouverMethode(localStorage.getItem('countryCode'));
  console.log("Méthode de calcul des prières :", method);
  const school = '1';

  const url = `https://islamicapi.com/api/v1/prayer-time/?lat=${lat}&lon=${lon}&method=${method}&school=${school}&api_key=${apiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log('Prayer Times:', data);
      if (data.status === 'success') {
        document.getElementById("Fajr").textContent = data.data.times.Fajr;
        document.getElementById("Dhuhr").textContent = data.data.times.Dhuhr;
        document.getElementById("Asr").textContent = data.data.times.Asr;
        document.getElementById("Maghrib").textContent = data.data.times.Maghrib;
        document.getElementById("Isha").textContent = data.data.times.Isha;
      }
    })
    .catch(error => {
      
    });
}

if (currentPage === "khatma.html") {

  const TOTAL_PAGES = 604;
  const DAYS = 29;

  const khatmaButtons = document.querySelectorAll(".khatma-buttons button");
  const stats = document.querySelectorAll(".stat strong");
  const circleValue = document.querySelector(".circle-khatma span");
  const circleTotal = document.querySelector(".circle-khatma small");
  const addButton = document.querySelector(".primary");
  const resetTodayBtn = document.querySelectorAll(".secondary")[0];
  const resetAllBtn = document.querySelectorAll(".secondary")[1];
  const progressText = document.querySelector(".progress span");
  const percentText = document.querySelector(".percent");
  const fillBar = document.querySelector(".fill");
  const pagesGoal = document.querySelectorAll("li strong");

  let khatmas = parseInt(localStorage.getItem("khatmas")) || 1;
  let pagesRead = parseInt(localStorage.getItem("pagesRead")) || 0;
  let pagesToday = parseInt(localStorage.getItem("pagesToday")) || 0;

  // Daily reset: if stored date is not today, reset pagesToday
  (function setupDailyReset() {
    const todayKey = new Date().toISOString().slice(0,10); // YYYY-MM-DD
    const storedDate = localStorage.getItem('pagesTodayDate');
    if (storedDate !== todayKey) {
      pagesToday = 0;
      localStorage.setItem('pagesToday', '0');
      localStorage.setItem('pagesTodayDate', todayKey);
    }

    // schedule next reset at next midnight (+1s to ensure date rolled)
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const ms = next - now;
    setTimeout(function dailyReset() {
      const newKey = new Date().toISOString().slice(0,10);
      pagesToday = 0;
      localStorage.setItem('pagesToday', '0');
      localStorage.setItem('pagesTodayDate', newKey);
      // update UI if available
      try { if (typeof updateUI === 'function') updateUI(); } catch (e) {}
      // schedule again for following midnight
      const now2 = new Date();
      const next2 = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate() + 1, 0, 0, 1);
      setTimeout(dailyReset, next2 - now2);
    }, ms);
  })();

  function updateUI() {

    const totalPages = TOTAL_PAGES * khatmas;
    const pagesPerDay = Math.ceil(totalPages / DAYS);
    const pagesPerPrayer = Math.ceil(pagesPerDay / 5);
    const remaining = totalPages - pagesRead;
    const percent = ((pagesRead / totalPages) * 100).toFixed(1);

    // Stats
    stats[0].textContent = pagesPerDay;
    stats[1].textContent = pagesPerPrayer;
    stats[2].textContent = pagesRead;
    stats[3].textContent = remaining;

    // Circle
    circleValue.textContent = pagesToday;
    circleTotal.textContent = "/" + pagesPerDay;

    // Progress
    progressText.textContent = `${pagesRead} / ${totalPages} pages`;
    percentText.textContent = percent + "%";
    fillBar.style.width = percent + "%";

    // Active button
    khatmaButtons.forEach((btn, index) => {
      btn.classList.remove("current");
      if (index + 1 === khatmas) {
        btn.classList.add("current");
      }
    });

    pagesGoal.forEach((item) => {
      item.textContent = pagesPerPrayer + " pages";
    });

  }

  // Changer khatmas
  khatmaButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      khatmas = index + 1;
      localStorage.setItem("khatmas", khatmas);
      updateUI();
    });
  });

  // +1 page
  addButton.addEventListener("click", () => {
    const totalPages = TOTAL_PAGES * khatmas;

    if (pagesRead < totalPages) {
      pagesRead++;
      pagesToday++;
      localStorage.setItem("pagesRead", pagesRead);
      localStorage.setItem("pagesToday", pagesToday);
      updateUI();
    }
  });

  // Reset today
  resetTodayBtn.addEventListener("click", () => {
    pagesRead -= pagesToday;
    pagesToday = 0;

    localStorage.setItem("pagesToday", pagesToday);
    localStorage.setItem("pagesRead", pagesRead); 
    updateUI();
  });

  // Reset total
  resetAllBtn.addEventListener("click", () => {
    pagesRead = 0;
    pagesToday = 0;
    localStorage.setItem("pagesRead", 0);
    localStorage.setItem("pagesToday", 0);
    updateUI();
  });

  updateUI();
}

if (currentPage === "dhikr.html") {
  
  let currentCount = 0;
  let currentGoal = 33;
  let selectedDhikr = 0;
  let dhikrList = [
      { arabic: "سُبْحَانَ ٱللَّٰهِ", latin: "SubhanAllah", translation: "Gloire à Allah" },
      { arabic: "ٱلْحَمْدُ لِلَّٰهِ", latin: "Alhamdulillah", translation: "Louange à Allah" },
      { arabic: "ٱللَّٰهُ أَكْبَرُ", latin: "Allahu Akbar", translation: "Allah est le Plus Grand" },
      { arabic: "أَسْتَغْفِرُ ٱللَّٰهَ", latin: "Astaghfirullah", translation: "Je demande pardon à Allah" }
  ];

  // Initialiser quand la page est chargée
  document.addEventListener('DOMContentLoaded', function() {
      initializeDhikr();
      setupEventListeners();
  });

  // Initialiser les éléments
  function initializeDhikr() {
      const circle = document.querySelector('.circle-dhikr');
      const dhikrItems = document.querySelectorAll('.dhikr-item');
      const objectiveItems = document.querySelectorAll('.objective-item');
      
      // Ajouter classes active par défaut
      if(dhikrItems.length > 0) dhikrItems[0].classList.add('active');
      if(objectiveItems.length > 0) objectiveItems[0].classList.add('active');
      
      // Mettre à jour le titre du dhikr
      updateDhikrTitle();
  }

  // Configuration des événements
  function setupEventListeners() {
      // Cercle pour compter
      const circle = document.querySelector('.circle-dhikr');
      if(circle) {
          circle.addEventListener('click', incrementCount);
      }
      
      // Sélection dhikr
      const dhikrItems = document.querySelectorAll('.dhikr-item');
      dhikrItems.forEach((item, index) => {
          item.addEventListener('click', function() {
              selectDhikr(index);
          });
      });
      
      // Réinitialiser
      const resetBtn = document.querySelector('.reset');
      if(resetBtn) {
          resetBtn.addEventListener('click', resetCount);
      }
      
      // Objectifs
      const objectiveItems = document.querySelectorAll('.objective-item');
      objectiveItems.forEach((item) => {
          item.addEventListener('click', function() {
              setGoal(parseInt(this.textContent));
          });
      });
  }

  // Incrémenter le compteur
  function incrementCount() {
    if(currentCount < currentGoal) {
      currentCount++;
      updateDisplay();
    }
  }

  // Sélectionner un dhikr
  function selectDhikr(index) {
      selectedDhikr = index;
      currentCount = 0;
      
      // Mettre à jour la classe active
      const dhikrItems = document.querySelectorAll('.dhikr-item');
      dhikrItems.forEach((item, i) => {
          if(i === index) {
              item.classList.add('active');
          } else {
              item.classList.remove('active');
          }
      });
      
      updateDhikrTitle();
      updateDisplay();
  }

  // Mettre à jour le titre du dhikr
  function updateDhikrTitle() {
      const dhikr = dhikrList[selectedDhikr];
      const arabicTitle = document.querySelector('.dhikr-title .arabic.big');
      const translation = document.querySelector('.dhikr-title .translation');
      
      if(arabicTitle) arabicTitle.textContent = dhikr.arabic;
      if(translation) translation.textContent = dhikr.translation;
  }

  // Réinitialiser le compteur
  function resetCount() {
      currentCount = 0;
      updateDisplay();
  }

  // Définir l'objectif
  function setGoal(goal) {
      currentGoal = goal;
      
      // Mettre à jour la classe active
      const objectiveItems = document.querySelectorAll('.objective-item');
      objectiveItems.forEach((item) => {
          if(parseInt(item.textContent) === goal) {
              item.classList.add('active');
          } else {
              item.classList.remove('active');
          }
      });
      
      updateDisplay();
  }

  // Mettre à jour l'affichage du compteur
  function updateDisplay() {
      const countElement = document.querySelector('.count');
      const goalElement = document.querySelector('.goal');
      const circle = document.querySelector('.circle-dhikr');
      
      if(countElement) {
          countElement.textContent = currentCount;
      }
      if(goalElement) {
          goalElement.textContent = '/ ' + currentGoal;
      }
      
      // Mettre à jour le remplissage du cercle
      if(circle) {
          const percentage = (currentCount / currentGoal) * 100;
          const degrees = (percentage / 100) * 360;
          circle.style.background = `conic-gradient(#facc15 0deg, #facc15 ${degrees}deg, #1e293b ${degrees}deg)`;
      }
  }
}

if (currentPage === "doua.html") {
  const duas = [
    {
      type: "pardon",
      typeLabel: "Pardon",
      source: "Sourate Al-A'raf 7:23",
      arabic: "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
      transliteration: "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal khasireen",
      translation: "Seigneur, nous nous sommes fait du tort a nous-memes. Et si Tu ne nous pardonnes pas et ne nous fais pas misericorde, nous serons certes du nombre des perdants."
    },
    {
      type: "laylat",
      typeLabel: "Laylat al-Qadr",
      source: "Tirmidhi",
      arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
      transliteration: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni",
      translation: "O Allah, Tu es Pardonneur, Tu aimes le pardon, alors pardonne-moi."
    },
    {
      type: "guidance",
      typeLabel: "Guidance",
      source: "Sourate Ta-Ha 20:25-26",
      arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
      transliteration: "Rabbi-shrah li sadri wa yassir li amri",
      translation: "Seigneur, ouvre-moi ma poitrine et facilite ma mission."
    },
    {
      type: "general",
      typeLabel: "General",
      source: "Sourate Al-Baqarah 2:201",
      arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
      translation: "Seigneur, accorde-nous belle part ici-bas, et belle part aussi dans l'au-dela; et protege-nous du chatiment du Feu."
    },
    {
      type: "famille",
      typeLabel: "Famille",
      source: "Sourate Al-Furqan 25:74",
      arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
      transliteration: "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama",
      translation: "Seigneur, fais que nos epouses et nos descendants soient la joie de nos yeux, et fais de nous un exemple pour les pieux."
    },
    {
      type: "reussite",
      typeLabel: "Reussite",
      source: "Sourate Ta-Ha 20:114",
      arabic: "رَبِّ زِدْنِي عِلْمًا",
      transliteration: "Rabbi zidni 'ilma",
      translation: "Seigneur, augmente ma science."
    },
    {
      type: "general",
      typeLabel: "General",
      source: "Sourate Al-Imran 3:173",
      arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
      transliteration: "Hasbunallahu wa ni'mal wakeel",
      translation: "Allah nous suffit, Il est notre meilleur Garant."
    },
    {
      type: "laylat",
      typeLabel: "Laylat al-Qadr",
      source: "Abu Dawud",
      arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ",
      transliteration: "Allahumma inni as'alukal-jannata wa a'udhu bika minan-nar",
      translation: "O Allah, je Te demande le Paradis et je cherche refuge aupres de Toi contre le Feu."
    },
    {
      type: "pardon",
      typeLabel: "Pardon",
      source: "Abu Dawud, Tirmidhi",
      arabic: "أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
      transliteration: "Astaghfirullaha alladhi la ilaha illa huwal hayyul qayyumu wa atubu ilayh",
      translation: "Je demande pardon a Allah, il n'y a de divinite que Lui, le Vivant, l'Immuable, et je me repens a Lui."
    },
    {
      type: "guidance",
      typeLabel: "Guidance",
      source: "Muslim",
      arabic: "اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي",
      transliteration: "Allahumma-hdini wa saddidni",
      translation: "O Allah, guide-moi et dirige-moi vers la voie droite."
    }
  ];

  const listEl = document.getElementById("dua-list");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const randomBtn = document.querySelector(".random-btn");
  let activeType = "all";

  function getFilteredDuas() {
    if (activeType === "all") return duas;
    return duas.filter((dua) => dua.type === activeType);
  }

  function buildDuaCard(dua) {
    const card = document.createElement("article");
    card.className = "dua-card";

    const top = document.createElement("div");
    top.className = "dua-card-top";

    const type = document.createElement("span");
    type.className = "dua-type";
    type.textContent = `Type: ${dua.typeLabel}`;

    const source = document.createElement("span");
    source.className = "dua-source";
    source.textContent = dua.source;

    const arabic = document.createElement("p");
    arabic.className = "dua-arabic";
    arabic.textContent = dua.arabic;

    const transliteration = document.createElement("p");
    transliteration.className = "dua-transliteration";
    transliteration.textContent = dua.transliteration;

    const translation = document.createElement("p");
    translation.className = "dua-translation";
    translation.textContent = `"${dua.translation}"`;

    top.appendChild(type);
    top.appendChild(source);
    card.appendChild(top);
    card.appendChild(arabic);
    card.appendChild(transliteration);
    card.appendChild(translation);
    return card;
  }

  function renderDuas(items) {
    listEl.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "dua-empty";
      empty.textContent = "Aucun dou'a pour ce filtre.";
      listEl.appendChild(empty);
      return;
    }

    items.forEach((dua) => {
      listEl.appendChild(buildDuaCard(dua));
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      activeType = button.dataset.type || "all";
      renderDuas(getFilteredDuas());
    });
  });

  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      const pool = getFilteredDuas();
      if (!pool.length) return;
      const randomIndex = Math.floor(Math.random() * pool.length);
      renderDuas([pool[randomIndex]]);
    });
  }

  renderDuas(duas);
}

if (currentPage === "planning.html") {
  const count = document.querySelector(".count-planning");
  const progressBar = document.querySelector(".progress-planning");
  const progressText = document.querySelector(".progress-text");
  const progressItems = document.querySelectorAll(".button");

  if (count && progressBar && progressText && progressItems.length > 0) {
    const totalItems = progressItems.length;
    const lang = (document.documentElement.lang || "fr").toLowerCase();
    const completedLabel = lang === "en" ? "completed" : (lang === "ar" ? "مكتمل" : "complété");

    let completedCount = 0;

    function updatePlanningUI() {
      count.textContent = `${completedCount}/${totalItems}`;
      const progressPercent = (completedCount / totalItems) * 100;
      progressBar.style.width = `${progressPercent}%`;
      progressText.textContent = `${Math.round(progressPercent)}% ${completedLabel}`;
    }

    progressItems.forEach((item) => {
      item.classList.remove("completed");
      item.style.backgroundColor = "";
      item.style.color = "";

      item.addEventListener("click", () => {
        const isCompleted = item.classList.contains("completed");

        if (isCompleted) {
          item.classList.remove("completed");
          completedCount--;
          item.style.backgroundColor = "";
          item.style.color = "";
        } else {
          item.classList.add("completed");
          completedCount++;
          item.style.backgroundColor = "#4ade80";
          item.style.color = "#ffffff";
        }

        updatePlanningUI();
      });
    });

    updatePlanningUI();
  }
}
