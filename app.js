let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

const formatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR"
});

function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function normaliseOldTransactions() {
  transactions = transactions.map(item => {
    const isoDate = item.isoDate || item.date || new Date().toISOString();
    return {
      id: item.id || crypto.randomUUID(),
      type: item.type,
      amount: Number(item.amount) || 0,
      isoDate,
      activity: item.activity || item.what || "",
      notes: item.notes || "",
      displayDate: item.displayDate || formatDate(isoDate)
    };
  });
  save();
}

function amountValue(item) {
  return item.type === "win" ? item.amount : -item.amount;
}

function getTotal() {
  return transactions.reduce((sum, item) => sum + amountValue(item), 0);
}

function getWins() {
  return transactions.filter(item => item.type === "win").reduce((sum, item) => sum + item.amount, 0);
}

function getLosses() {
  return transactions.filter(item => item.type === "loss").reduce((sum, item) => sum + item.amount, 0);
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeeklyTotal() {
  const start = getStartOfWeek(new Date());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return transactions
    .filter(item => {
      const itemDate = new Date(item.isoDate);
      return itemDate >= start && itemDate < end;
    })
    .reduce((sum, item) => sum + amountValue(item), 0);
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("el-GR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMoneyStatus(value, moneyEl, statusEl, positiveText, negativeText, neutralText) {
  moneyEl.textContent = formatter.format(value);
  moneyEl.className = value > 0 ? "positive" : value < 0 ? "negative" : "";

  if (value > 0) {
    statusEl.textContent = positiveText;
    statusEl.style.background = "#14532d";
  } else if (value < 0) {
    statusEl.textContent = negativeText;
    statusEl.style.background = "#7f1d1d";
  } else {
    statusEl.textContent = neutralText;
    statusEl.style.background = "#2d3748";
  }
}

function render() {
  const total = getTotal();
  setMoneyStatus(
    total,
    document.getElementById("total"),
    document.getElementById("status"),
    "Είσαι κερδισμένος",
    "Είσαι χαμένος",
    "Ουδέτερο"
  );

  const weeklyTotal = getWeeklyTotal();
  setMoneyStatus(
    weeklyTotal,
    document.getElementById("weeklyTotal"),
    document.getElementById("weeklyStatus"),
    "Αυτή την εβδομάδα: Κέρδη",
    "Αυτή την εβδομάδα: Χασούρα",
    "Αυτή την εβδομάδα: Ουδέτερο"
  );

  document.getElementById("totalWins").textContent = formatter.format(getWins());
  document.getElementById("totalLosses").textContent = formatter.format(getLosses());

  const sorted = transactions.slice().sort((a, b) => new Date(a.isoDate) - new Date(b.isoDate));
  const last = sorted[sorted.length - 1];
  document.getElementById("lastPlayed").textContent = last ? `${formatDate(last.isoDate)}${last.activity ? " — " + last.activity : ""}` : "-";

  const history = document.getElementById("history");
  if (transactions.length === 0) {
    history.innerHTML = "<p style='color:#9aa4b2'>Δεν υπάρχει ακόμα ιστορικό.</p>";
    return;
  }

  history.innerHTML = transactions
    .slice()
    .sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate))
    .map(item => `
      <div class="historyItem">
        <div class="historyText">
          <strong class="${item.type === "win" ? "plus" : "minus"}">
            ${item.type === "win" ? "+ Κέρδη" : "- Χαμένα"}
          </strong>
          <br>
          <small>${formatDate(item.isoDate)}</small>
          ${item.activity ? `<p class="activity">${escapeHtml(item.activity)}</p>` : ""}
          ${item.notes ? `<p class="notes">${escapeHtml(item.notes)}</p>` : ""}
        </div>
        <strong class="${item.type === "win" ? "plus" : "minus"}">
          ${item.type === "win" ? "+" : "-"}${formatter.format(item.amount)}
        </strong>
      </div>
    `)
    .join("");
}

function addTransaction(type) {
  const amountInput = document.getElementById("amount");
  const dateInput = document.getElementById("playedAt");
  const activityInput = document.getElementById("activity");
  const notesInput = document.getElementById("notes");
  const amount = Number(amountInput.value);

  if (!amount || amount <= 0) {
    alert("Βάλε σωστό ποσό.");
    return;
  }

  const playedDate = dateInput.value ? new Date(dateInput.value) : new Date();

  if (Number.isNaN(playedDate.getTime())) {
    alert("Βάλε σωστή ημερομηνία.");
    return;
  }

  transactions.push({
    id: crypto.randomUUID(),
    type,
    amount,
    isoDate: playedDate.toISOString(),
    displayDate: formatDate(playedDate.toISOString()),
    activity: activityInput.value.trim(),
    notes: notesInput.value.trim()
  });

  amountInput.value = "";
  dateInput.value = "";
  activityInput.value = "";
  notesInput.value = "";
  save();
  render();
}

function resetAll() {
  const ok = confirm("Θέλεις σίγουρα να μηδενίσεις τα πάντα;");
  if (!ok) return;

  transactions = [];
  save();
  render();
}

normaliseOldTransactions();
render();
