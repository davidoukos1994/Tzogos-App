let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

const formatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR"
});

function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
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
      const itemDate = new Date(item.isoDate || item.date);
      return itemDate >= start && itemDate < end;
    })
    .reduce((sum, item) => sum + amountValue(item), 0);
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

  const last = transactions[transactions.length - 1];
  document.getElementById("lastPlayed").textContent = last ? last.displayDate : "-";

  const history = document.getElementById("history");
  if (transactions.length === 0) {
    history.innerHTML = "<p style='color:#9aa4b2'>Δεν υπάρχει ακόμα ιστορικό.</p>";
    return;
  }

  history.innerHTML = transactions
    .slice()
    .reverse()
    .map(item => `
      <div class="historyItem">
        <div>
          <strong class="${item.type === "win" ? "plus" : "minus"}">
            ${item.type === "win" ? "+ Κέρδη" : "- Χαμένα"}
          </strong>
          <br>
          <small>${item.displayDate || item.date}</small>
        </div>
        <strong class="${item.type === "win" ? "plus" : "minus"}">
          ${item.type === "win" ? "+" : "-"}${formatter.format(item.amount)}
        </strong>
      </div>
    `)
    .join("");
}

function addTransaction(type) {
  const input = document.getElementById("amount");
  const amount = Number(input.value);

  if (!amount || amount <= 0) {
    alert("Βάλε σωστό ποσό.");
    return;
  }

  const now = new Date();

  transactions.push({
    type,
    amount,
    isoDate: now.toISOString(),
    displayDate: now.toLocaleString("el-GR")
  });

  input.value = "";
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

render();
