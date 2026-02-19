import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA7-4XNyskePOErHQheuCn0tkKWQ4GjIMs",
  authDomain: "awesome-project-of-mss.firebaseapp.com",
  projectId: "awesome-project-of-mss",
  storageBucket: "awesome-project-of-mss.firebasestorage.app",
  messagingSenderId: "163734017895",
  appId: "1:163734017895:web:8d5f38042b621fa77c41c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State
let goals = { you: 300, friend: 280 };
let nicknames = { you: "Player1", friend: "Player2" };
let totals = { you: 0, friend: 0 };

// Chart objects
let chartYou, chartFriend;

// Helper for cumulative
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

// Load from Firebase
async function loadData() {
  const snapshot = await getDocs(collection(db, "study"));
  const weekStart = getWeekStart();

  let data = { you: [], friend: [] };
  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.weekStart === weekStart) data[d.person].push(d.minutes);
  });

  totals.you = data.you.reduce((a,b)=>a+b,0);
  totals.friend = data.friend.reduce((a,b)=>a+b,0);

  updateCharts();
}

// Add minutes
window.addMinutes = async function(person) {
  const input = prompt(`Enter minutes studied for ${nicknames[person]}:`);
  const minutes = Number(input);
  if (!minutes) return;

  await addDoc(collection(db, "study"), {
    person,
    minutes,
    date: new Date().toISOString().split("T")[0],
    weekStart: getWeekStart()
  });

  await loadData();

  if (totals[person] >= goals[person]) {
    confetti();
  }
}

// Chart rendering
function updateCharts() {
  const ctxYou = document.getElementById("chartYou").getContext("2d");
  const ctxFriend = document.getElementById("chartFriend").getContext("2d");

  if (chartYou) chartYou.destroy();
  if (chartFriend) chartFriend.destroy();

chartYou = new Chart(ctxYou, {
  type: "bar",
  data: {
    labels: ["Deep Work"],
    datasets: [{
      data: [totals.you],
      backgroundColor: "#4facfe"
    }]
  },
  options: {
    indexAxis: 'x',
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(totals.you, goals.you)*1.2
      }
    },
    plugins: {
      annotation: {
        annotations: {
          goalLine: {
            type: 'line',
            yMin: goals.you,
            yMax: goals.you,
            borderColor: 'red',
            borderWidth: 3,
            label: {
              content: 'Goal',
              enabled: true,
              position: 'start'
            }
          }
        }
      }
    }
  },
  plugins: [ChartAnnotation]
});

chartFriend = new Chart(ctxFriend, {
  type: "bar",
  data: {
    labels: ["Deep Work"],
    datasets: [{
      data: [totals.friend],
      backgroundColor: "#4facfe"
    }]
  },
  options: {
    indexAxis: 'x',
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(totals.friend, goals.friend)*1.2
      }
    },
    plugins: {
      annotation: {
        annotations: {
          goalLine: {
            type: 'line',
            yMin: goals.friend,
            yMax: goals.friend,
            borderColor: 'red',
            borderWidth: 3,
            label: {
              content: 'Goal',
              enabled: true,
              position: 'start'
            }
          }
        }
      }
    }
  },
  plugins: [ChartAnnotation]
});


  // Update status
  document.getElementById("statusYou").innerText = (totals.you >= goals.you ? "+" : "-") + Math.abs(totals.you-goals.you) + " min";
  document.getElementById("statusFriend").innerText = (totals.friend >= goals.friend ? "+" : "-") + Math.abs(totals.friend-goals.friend) + " min";

  // Update nicknames
  document.getElementById("nickYou").innerText = nicknames.you;
  document.getElementById("nickFriend").innerText = nicknames.friend;
}

// Settings toggle
window.toggleSettings = function() {
  const panel = document.getElementById("settingsPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

// Update settings
window.updateSettings = function() {
  nicknames.you = document.getElementById("inputNickYou").value || nicknames.you;
  nicknames.friend = document.getElementById("inputNickFriend").value || nicknames.friend;
  goals.you = Number(document.getElementById("inputGoalYou").value) || goals.you;
  goals.friend = Number(document.getElementById("inputGoalFriend").value) || goals.friend;

  updateCharts();
}

// Reset
window.resetStats = async function() {
  const snapshot = await getDocs(collection(db, "study"));
  for (const docSnap of snapshot.docs) {
    const ref = doc(db, "study", docSnap.id);
    await ref.delete();
  }
  totals = { you: 0, friend: 0 };
  updateCharts();
}

// Initial load
loadData();
