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
  [...tableBody.children].forEach((child) => tableBody.removeChild(child));
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  sortedEntries.forEach((entry) => {
    const row = document.createElement("tr");
    row.append(
      createCell(new Date(entry.date).toLocaleDateString()),
      createCell(entry.collector),
      createCell(`${entry.amount / 100} kr`)
    );
    tableBody.append(row);

    const descriptionRow = document.createElement("tr");
    const description = createCell(entry.description);
    description.setAttribute("colspan", "3");
    descriptionRow.append(description);
    tableBody.append(descriptionRow);
  });
};

const renderCollector = (collector) => {
  const name = document.getElementById("collector-name");
  const debt = document.getElementById("collector-debt");
  name.innerText = collector.name;
  debt.innerText = collector.amount / 100;
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
  const getDebts = (collector, entries) =>
    entries
      .filter((entry) => entry.collector === collector)
      .map((entry) => entry.amount)
      .reduce((total, amount) => total + amount, 0);

  const asaDebts = getDebts("Åsa", entries);
  const erikDebts = getDebts("Erik", entries);

  if (asaDebts - erikDebts > 0) {
    return { name: "Åsa", amount: asaDebts - erikDebts };
  } else {
    return { name: "Erik", amount: asaDebts - erikDebts };
  }
};

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await submitForm();
  run();
});

const run = async () => {
  const entries = await getEntries();
  renderEntries(entries);
  const collector = getCollector(entries);
  renderCollector(collector);
};
run();
