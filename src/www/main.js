const getEntries = async () => {
  const response = await fetch("/api/v1/entries");
  const data = await response.json();
  return data.entries;
};

const createCell = (value) => {
  const cell = document.createElement("td");
  cell.innerText = value;
  return cell;
};

const renderEntries = (entries) => {
  const tableBody = document.getElementById("debts-table-body");
  [...tableBody.children].map((child) => tableBody.removeChild(child));
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  sortedEntries.map((entry) => {
    const row = document.createElement("tr");
    row.append(
      createCell(new Date(entry.date).toLocaleDateString()),
      createCell(entry.collector),
      createCell(`${entry.amount / 100} kr`),
      createCell(entry.description)
    );
    tableBody.append(row);
  });
};

const submitForm = async () => {
  const collector = document.querySelector(
    'input[name="collector"]:checked'
  ).value;
  const description = document.querySelector('input[name="description"]').value;
  const share = parseInt(
    document.querySelector('input[name="share"]').value,
    10
  );
  const total = parseInt(
    document.querySelector('input[name="amount"]').value,
    10
  );
  const amount = share * total;
  const data = { collector, description, amount };
  await fetch("/api/v1/entries", {
    method: "POST",
    body: JSON.stringify(data),
  });
  document.getElementById("form").reset();
};

const getCollector = (entries) => {
  const asaDebts = entries
    .filter((entry) => entry.collector === "Åsa")
    .map((entry) => entry.amount)
    .reduce((total, amount) => total + amount, 0);
  const erikDebts = entries
    .filter((entry) => entry.collector === "Erik")
    .map((entry) => entry.amount)
    .reduce((total, amount) => total + amount, 0);
  if (asaDebts - erikDebts > 0) {
    return { collector: "Asa", amount: asaDebts - erikDebts };
  } else {
    return { collector: "Erik", amount: asaDebts - erikDebts };
  }
};

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  submitForm();
  const entries = await getEntries();
  renderEntries(entries);
});

const run = async () => {
  const entries = await getEntries();
  renderEntries(entries);
  const collector = getCollector(entries);
  console.log({ collector });
};
run();
