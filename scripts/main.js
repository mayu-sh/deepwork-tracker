import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// ─── Firebase 設定 ───
const firebaseConfig = {
  apiKey: "AIzaSyA7-4XNyskePOErHQheuCn0tkKWQ4GjIMs",
  authDomain: "awesome-project-of-mss.firebaseapp.com",
  projectId: "awesome-project-of-mss",
  storageBucket: "awesome-project-of-mss.firebasestorage.app",
  messagingSenderId: "163734017895",
  appId: "1:163734017895:web:8d5f38042b621fa77c41c2"
};

// ─── Firebase 初期化 ───
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── 初期値 ───
let goalYou = 600;
let goalFriend = 600;
let nickYou = "You";
let nickFriend = "Friend";

// ─── 今週の月曜日を取得 ───
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

// ─── 勉強分数追加 ───
export async function addStudyTime() {
  const person = document.getElementById("person").value;
  const minutes = Number(document.getElementById("minutes").value);
  if (!minutes) return;
  const date = new Date().toISOString().split("T")[0];

  await addDoc(collection(db, "study"), {
    person,
    minutes,
    date,
    weekStart: getWeekStart()
  });

  document.getElementById("minutes").value = "";
  loadData();
}

// ─── 目標更新 ───
export function updateGoals() {
  goalYou = Number(document.getElementById("goalYou").value) || goalYou;
  goalFriend = Number(document.getElementById("goalFriend").value) || goalFriend;
  renderCharts(window.cachedData);
}

// ─── ニックネーム更新 ───
export function updateNicknames() {
  nickYou = document.getElementById("nickYou").value || nickYou;
  nickFriend = document.getElementById("nickFriend").value || nickFriend;
  document.getElementById("labelYou").innerText = `${nickYou}: ${document.getElementById("totalYou").innerText} min`;
  document.getElementById("labelFriend").innerText = `${nickFriend}: ${document.getElementById("totalFriend").innerText} min`;
}

// ─── データ取得 ───
async function loadData() {
  const snapshot = await getDocs(collection(db, "study"));
  const weekStart = getWeekStart();

  let data = { you: [], friend: [] };
  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.weekStart === weekStart) data[d.person].push(d);
  });

  window.cachedData = data;
  renderCharts(data);
}

// ─── 曜日ごとの累積計算 ───
function cumulativeByDay(entries) {
  const totals = Array(7).fill(0);
  entries.forEach(e => {
    const date = new Date(e.date);
    const index = (date.getDay() + 6) % 7;
    totals[index] += e.minutes;
  });
  for (let i = 1; i < 7; i++) totals[i] += totals[i-1];
  return totals;
}

// ─── グラフ描画 ───
function renderCharts(data) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const youData = cumulativeByDay(data.you);
  const friendData = cumulativeByDay(data.friend);

  document.getElementById("totalYou").innerText = youData[6];
  document.getElementById("totalFriend").innerText = friendData[6];

  document.getElementById("labelYou").innerText = `${nickYou}: ${youData[6]} min`;
  document.getElementById("labelFriend").innerText = `${nickFriend}: ${friendData[6]} min`;

  if (youData[6] >= goalYou) confetti();
  if (friendData[6] >= goalFriend) confetti();

  const ctxYou = document.getElementById("chartYou").getContext("2d");
  const ctxFriend = document.getElementById("chartFriend").getContext("2d");

  if (window.chartYou) window.chartYou.destroy();
  if (window.chartFriend) window.chartFriend.destroy();

  window.chartYou = new Chart(ctxYou, { type: "bar",
    data: { labels: days, datasets: [{ data: youData, backgroundColor: gradient(ctxYou) }] },
    options: { scales: { y: { beginAtZero: true } } }
  });

  window.chartFriend = new Chart(ctxFriend, { type: "bar",
    data: { labels: days, datasets: [{ data: friendData, backgroundColor: gradient(ctxFriend) }] },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

function gradient(ctx) {
  const grad = ctx.createLinearGradient(0,0,0,400);
  grad.addColorStop(0,"#4facfe");
  grad.addColorStop(1,"#00f2fe");
  return grad;
}

// 初回ロード
loadData();
