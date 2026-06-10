const requests = [
  {
    id: "momo",
    pet: "Momo",
    species: "柴犬",
    owner: "林小姐",
    need: "今晚臨時照護",
    time: "19:00-23:30",
    location: "林口長庚生活圈",
    urgency: "高",
    notes: "怕打雷，需要晚餐後散步 20 分鐘。",
  },
  {
    id: "nini",
    pet: "Nini",
    species: "橘貓",
    owner: "王先生",
    need: "兩日到府餵食",
    time: "週六-週日",
    location: "桃園藝文特區",
    urgency: "中",
    notes: "需拍照回報飲水量，貓砂每日清潔。",
  },
  {
    id: "boba",
    pet: "Boba",
    species: "法鬥",
    owner: "陳小姐",
    need: "出差寄宿",
    time: "3 天 2 夜",
    location: "新北新莊",
    urgency: "中",
    notes: "有皮膚藥，睡前需要擦藥一次。",
  },
];

const caregivers = [
  { name: "阿澄", area: "林口", score: 96, distance: 0.8, tags: "犬隻照護、夜間可接、已驗證", capacity: 2 },
  { name: "Mika", area: "桃園", score: 93, distance: 4.1, tags: "貓咪到府、用藥回報、照片日誌", capacity: 1 },
  { name: "郁庭", area: "新莊", score: 89, distance: 6.4, tags: "寄宿空間、短鼻犬經驗、Hub 交接", capacity: 3 },
  { name: "Kai", area: "龜山", score: 86, distance: 2.7, tags: "散步陪伴、臨時急件、長者飼主協助", capacity: 1 },
];

const hubs = [
  { name: "林口 Hub", x: "28%", y: "36%", status: "可立即交接" },
  { name: "桃園 Hub", x: "62%", y: "30%", status: "今晚 2 位值班" },
  { name: "新莊 Hub", x: "43%", y: "68%", status: "寄宿備援" },
  { name: "板橋 Hub", x: "76%", y: "62%", status: "滿載" },
];

const diary = [
  { time: "18:40", title: "Momo 完成晚餐", body: "飼料 80g 全吃完，飲水正常。照護者已上傳照片。" },
  { time: "17:15", title: "Nini 到府鑰匙確認", body: "Hub 已完成鑰匙封存與交接，明早 09:30 第一次餵食。" },
  { time: "15:20", title: "Boba 用藥提醒", body: "系統已把睡前擦藥加入照護者任務清單。" },
];

let selectedId = requests[0].id;
let mode = "trust";
let extraUpdates = 0;

function selectedRequest() {
  return requests.find((request) => request.id === selectedId) || requests[0];
}

function rankedCaregivers() {
  const request = selectedRequest();
  return [...caregivers].sort((a, b) => {
    if (mode === "nearby") return a.distance - b.distance;
    if (mode === "urgent") return (request.urgency === "高" ? b.capacity - a.capacity : b.score - a.score);
    return b.score - a.score;
  });
}

function renderRequests() {
  const list = document.querySelector("#request-list");
  list.innerHTML = requests.map((request) => `
    <button class="request-card ${request.id === selectedId ? "active" : ""}" type="button" data-id="${request.id}">
      <strong>${request.pet} · ${request.species}</strong>
      <span>${request.owner} / ${request.need}</span>
      <span>${request.time} / ${request.location}</span>
      <small>${request.urgency}急迫</small>
    </button>
  `).join("");

  list.querySelectorAll(".request-card").forEach((button) => {
    button.addEventListener("click", () => {
      selectedId = button.dataset.id;
      render();
    });
  });
}

function renderSelected() {
  const request = selectedRequest();
  document.querySelector("#selected-card").innerHTML = `
    <div>
      <h2>${request.pet} 的${request.need}</h2>
      <p>${request.location} · ${request.time} · ${request.notes}</p>
    </div>
    <div class="urgency">${request.urgency}急迫</div>
  `;
}

function renderMatches() {
  document.querySelector("#match-grid").innerHTML = rankedCaregivers().slice(0, 3).map((caregiver) => `
    <article class="match-card">
      <div class="avatar">${caregiver.name.slice(0, 1)}</div>
      <h3>${caregiver.name}</h3>
      <p>${caregiver.area} · ${caregiver.distance} km · 可接 ${caregiver.capacity} 件</p>
      <p>${caregiver.tags}</p>
      <div class="score-line"><span>PawScore</span><strong>${caregiver.score}</strong></div>
      <div class="mini-track"><div class="mini-fill" style="--value: ${caregiver.score}%"></div></div>
    </article>
  `).join("");
}

function renderScore() {
  const best = rankedCaregivers()[0];
  const score = Math.round((best.score * 0.68) + ((10 - best.distance) * 3.2));
  const clipped = Math.max(62, Math.min(99, score));
  document.querySelector("#metric-score").textContent = clipped;
  document.querySelector("#score-card").innerHTML = `
    <span>最佳媒合：${best.name}</span>
    <strong>${clipped}</strong>
    <p>依距離、照護紀錄、驗證狀態、容量與本次需求風險計算。建議使用 Hub 交接並保留照片日誌。</p>
  `;

  const risks = [
    { title: "信任提示", body: `${best.name} 已完成身份驗證與 ${best.score} 分 PawScore，可優先邀請。` },
    { title: "照護風險", body: selectedRequest().notes },
    { title: "交接建議", body: selectedRequest().urgency === "高" ? "建議使用林口 Hub，降低臨時交接與地址暴露風險。" : "可由飼主選擇到府或 Hub 交接。" },
  ];
  document.querySelector("#risk-list").innerHTML = risks.map((risk) => `
    <article class="risk-item">
      <strong>${risk.title}</strong>
      <p>${risk.body}</p>
    </article>
  `).join("");
}

function renderHubs() {
  document.querySelector("#hub-map").innerHTML = hubs.map((hub) => `
    <div class="hub-pin" style="--x: ${hub.x}; --y: ${hub.y}">
      <strong>${hub.name}</strong>
      <span>${hub.status}</span>
    </div>
  `).join("");
}

function renderDiary() {
  document.querySelector("#diary-feed").innerHTML = diary.map((item) => `
    <article class="diary-item">
      <div class="stamp">${item.time}</div>
      <div>
        <strong>${item.title}</strong>
        <p>${item.body}</p>
      </div>
    </article>
  `).join("");
}

function renderMetrics() {
  document.querySelector("#metric-requests").textContent = requests.length + 9;
  document.querySelector("#metric-hubs").textContent = hubs.length + 2;
  document.querySelector("#metric-updates").textContent = diary.length * 10 + extraUpdates + 6;
}

function render() {
  renderRequests();
  renderSelected();
  renderMatches();
  renderScore();
  renderHubs();
  renderDiary();
  renderMetrics();
}

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    document.querySelectorAll(".segment").forEach((segment) => segment.classList.remove("active"));
    button.classList.add("active");
    render();
  });
});

document.querySelector("#new-request").addEventListener("click", () => {
  requests.unshift({
    id: `case-${Date.now()}`,
    pet: "Lulu",
    species: "米克斯",
    owner: "新增飼主",
    need: "臨時散步陪伴",
    time: "明日 08:00-09:00",
    location: "長庚商圈",
    urgency: "低",
    notes: "第一次使用平台，建議由 Hub 協助確認照護者。",
  });
  selectedId = requests[0].id;
  render();
});

document.querySelector("#dispatch-button").addEventListener("click", () => {
  diary.unshift({
    time: "現在",
    title: `${selectedRequest().pet} 已安排 Hub 交接`,
    body: "系統已通知飼主與共養者，並建立交接照片與確認碼任務。",
  });
  extraUpdates += 3;
  render();
});

document.querySelector("#diary-button").addEventListener("click", () => {
  diary.unshift({
    time: "現在",
    title: `${selectedRequest().pet} 新增照護回報`,
    body: "照護者已完成狀態回報，PawScore 將在飼主確認後更新。",
  });
  extraUpdates += 1;
  render();
});

render();
