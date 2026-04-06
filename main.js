let currentProjectDownloads = [];
const releaseCache = new Map();

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

async function openProjectModal(displayName, desc, repoId, fileNamePattern = null) {
  const overlay = document.getElementById('modal-overlay');
  const changelogEl = document.getElementById('m-changelog');

  backToProjectInfo(false);
  currentProjectDownloads = [];

  document.getElementById('m-title').innerText = displayName;
  document.getElementById('m-desc').innerText = desc;
  document.getElementById('m-github').href = `https://github.com/sagami121/${repoId}`;

  const dlTrigger = document.getElementById('m-dl-trigger');
  dlTrigger.innerText = "読み込み中...";
  dlTrigger.disabled = true;

  changelogEl.innerText = "最新情報を取得しています...";

  const scrollbarWidth = getScrollbarWidth();
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
  document.body.style.overflow = 'hidden';
  overlay.style.display = 'flex';

  try {
    let data;
    if (releaseCache.has(repoId)) {
      data = releaseCache.get(repoId);
    } else {
      const response = await fetch(`https://api.github.com/repos/sagami121/${repoId}/releases/latest`);
      if (!response.ok) throw new Error();
      data = await response.json();
      releaseCache.set(repoId, data);
    }

    if (typeof marked !== 'undefined') {
      let body = data.body || "更新情報はありません。";
      body = body.split(/\r?\n/).map(line => {
        line = line.trim();
        const bulletRegex = /^[・\u30fb•\u2022∙\u2219⋅\u22c5·\u00b7]/;
        return bulletRegex.test(line)
          ? '- ' + line.substring(1).trim()
          : line;
      }).join('\n');
      changelogEl.innerHTML = marked.parse(body);
    } else {
      changelogEl.innerText = data.body || "更新情報はありません。";
    }

    const latestTag = data.tag_name;
    const versionNum = latestTag.replace(/^v/, '');

    if (fileNamePattern) {
      const patterns = Array.isArray(fileNamePattern) ? fileNamePattern : [fileNamePattern];
      patterns.forEach(p => {
        const fileName = p.replace(/{latest}/g, versionNum);
        currentProjectDownloads.push({
          url: `https://github.com/sagami121/${repoId}/releases/download/${latestTag}/${fileName}`,
          name: fileName,
          ext: fileName.split('.').pop().toUpperCase()
        });
      });
    }

    dlTrigger.innerText = "ダウンロード";
    dlTrigger.disabled = false;
  } catch (e) {
    changelogEl.innerText = "情報の取得に失敗しました。";
    dlTrigger.innerText = "ダウンロード不可";
    dlTrigger.disabled = true;
  }
}

function switchToDownloadSelection() {
  if (currentProjectDownloads.length === 0) return;

  const infoArea = document.getElementById('m-content-wrapper');
  const dlArea = document.getElementById('dl-selection-area');
  const optionsCont = document.getElementById('m-dl-options');

  if (currentProjectDownloads.length === 1) {
    window.location.href = currentProjectDownloads[0].url;
    return;
  }
  infoArea.style.display = 'none';

  optionsCont.innerHTML = '';
  currentProjectDownloads.forEach(link => {
    const btn = document.createElement('a');
    btn.href = link.url;
    btn.className = 'btn btn-sub fade-in';
    btn.innerHTML = `<span><b>${link.ext}</b> インストーラー</span>`;
    optionsCont.appendChild(btn);
  });
  dlArea.style.display = 'block';
}

function backToProjectInfo(animated = true) {
  const infoArea = document.getElementById('m-content-wrapper');
  const dlArea = document.getElementById('dl-selection-area');

  dlArea.style.display = 'none';
  infoArea.style.display = 'block';
  if (animated) infoArea.classList.add('fade-in');
  else infoArea.classList.remove('fade-in');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.style.display = 'none';
  document.body.style.overflow = 'auto';
  document.body.style.paddingRight = '0px';
}

function copyDiscord() {
  navigator.clipboard.writeText("sagami121").then(() => {
    const t = document.getElementById("toast");
    t.style.opacity = "1";
    setTimeout(() => t.style.opacity = "0", 2000);
  });
}

let mouseX = 50, mouseY = 50;
let currentX = 50, currentY = 50;

document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 100;
  mouseY = (e.clientY / window.innerHeight) * 100;
});

function animateGlow() {
  currentX += (mouseX - currentX) * 0.1;
  currentY += (mouseY - currentY) * 0.1;
  const glow = document.getElementById('glow');
  if (glow) {
    glow.style.setProperty('--x', currentX + '%');
    glow.style.setProperty('--y', currentY + '%');
  }
  requestAnimationFrame(animateGlow);
}
animateGlow();

async function fetchStars() {
  const repos = ['Audion', 'Aviutl2-AudioEnc', 'Sagami-Youtube-Downloader'];
  const now = Date.now();
  for (const repo of repos) {
    const cacheKey = `star_cache_${repo}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && (now - cached.time < 3600000)) {
      const el = document.getElementById(`star-${repo}`);
      if (el) el.innerText = cached.stars + "★";
      continue;
    }
    try {
      const res = await fetch(`https://api.github.com/repos/sagami121/${repo}`);
      if (!res.ok) continue;
      const data = await res.json();
      const el = document.getElementById(`star-${repo}`);
      if (el && data.stargazers_count !== undefined) {
        el.innerText = data.stargazers_count + "★";
        localStorage.setItem(cacheKey, JSON.stringify({ stars: data.stargazers_count, time: now }));
      }
    } catch (e) { }
  }
}
fetchStars();