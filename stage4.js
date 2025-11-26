let isAdmin = false;

// ===== Load data from localStorage =====
document.addEventListener("DOMContentLoaded", () => {
  renderTable();
  document.getElementById("blocklistForm").addEventListener("submit", addEntry);
  document.getElementById("searchInput").addEventListener("input", searchTable);
  document.getElementById("csvInput").addEventListener("change", importCSV);
});

// ===== Add new entry =====
function addEntry(e) {
  e.preventDefault();

  const auName = document.getElementById("auName").value.trim();
  const friendCode = document.getElementById("friendCode").value.trim();
  const infraction = document.getElementById("infraction").value.trim();
  const reason = document.getElementById("reason").value.trim();
  const paroleInput = document.getElementById("parole");
  const parole = paroleInput ? paroleInput.value.trim() : "";

  if (!auName || !friendCode || !infraction || !reason) {
    alert("Please fill in all required fields!");
    return;
  }

  const blocklist = JSON.parse(localStorage.getItem("blocklist") || "[]");

  // Prevent duplicate Friend Codes
  if (blocklist.some(item => item.friendCode === friendCode)) {
    alert("Friend code already exists in the blocklist!");
    return;
  }

  const newEntry = { auName, friendCode, infraction, reason, parole };
  blocklist.push(newEntry);
  localStorage.setItem("blocklist", JSON.stringify(blocklist));

  document.getElementById("blocklistForm").reset();
  renderTable();
}

// ===== Render table =====
function renderTable() {
  const tbody = document.querySelector("#blocklistTable tbody");
  tbody.innerHTML = "";

  const blocklist = JSON.parse(localStorage.getItem("blocklist") || "[]");

  blocklist.forEach((entry, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${entry.auName}</td>
      <td>${entry.friendCode}</td>
      <td>${entry.infraction}</td>
      <td>${entry.reason}</td>
      <td class="parole-column">${entry.parole || ""}</td>
      <td class="actions">
        ${isAdmin ? `
          <button class="edit" onclick="editEntry(${index})">Edit</button>
          <button class="delete" onclick="deleteEntry(${index})">Delete</button>
        ` : ""}
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Hide parole column for non-admin
  document.querySelectorAll(".parole-column").forEach(col => {
    col.style.display = isAdmin ? "table-cell" : "none";
  });
}

// ===== Edit entry (admin only) =====
function editEntry(index) {
  const blocklist = JSON.parse(localStorage.getItem("blocklist") || "[]");
  const entry = blocklist[index];

  const newFriendCode = prompt("Edit Friend Code:", entry.friendCode);
  if (newFriendCode === null) return; // cancel

  const newInfraction = prompt("Edit Infraction:", entry.infraction);
  if (newInfraction === null) return;

  const newReason = prompt("Edit Reason:", entry.reason);
  if (newReason === null) return;

  const newParole = prompt("Edit Parole (optional):", entry.parole || "");
  if (newParole === null) return;

  entry.friendCode = newFriendCode.trim();
  entry.infraction = newInfraction.trim();
  entry.reason = newReason.trim();
  entry.parole = newParole.trim();

  blocklist[index] = entry;
  localStorage.setItem("blocklist", JSON.stringify(blocklist));
  renderTable();
}

// ===== Delete entry (admin only) =====
function deleteEntry(index) {
  if (!confirm("Are you sure you want to delete this entry?")) return;

  const blocklist = JSON.parse(localStorage.getItem("blocklist") || "[]");
  blocklist.splice(index, 1);
  localStorage.setItem("blocklist", JSON.stringify(blocklist));
  renderTable();
}

// ===== Clear all (admin only) =====
function clearAll() {
  if (confirm("Clear entire blocklist?")) {
    localStorage.removeItem("blocklist");
    renderTable();
  }
}

// ===== Search function =====
function searchTable() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#blocklistTable tbody tr");

  rows.forEach(row => {
    const name = row.cells[0].textContent.toLowerCase();
    const friendCode = row.cells[1].textContent.toLowerCase();
    row.style.display = (name.includes(query) || friendCode.includes(query)) ? "" : "none";
  });
}

// ===== Admin Login =====
function adminLogin() {
  const password = document.getElementById("adminPassword").value;
  if (password === "blm123") {
    isAdmin = true;
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("logoutSection").style.display = "flex";

    // Show Parole input for admin
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "block");

    renderTable();
  } else {
    alert("Incorrect password!");
  }
}

// ===== Admin Logout =====
function adminLogout() {
  isAdmin = false;
  document.getElementById("loginSection").style.display = "flex";
  document.getElementById("logoutSection").style.display = "none";

  // Hide Parole input for default users
  document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");

  renderTable();
}

// ===== CSV Import =====
/* function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const csvData = e.target.result;
    const rows = csvData.split("\n").map(r => r.trim()).filter(Boolean);

    const blocklist = JSON.parse(localStorage.getItem("blocklist") || "[]");
    const headers = rows[0].split(",").map(h => h.trim());

    rows.slice(1).forEach(row => {
      const values = row.split(",").map(v => v.trim());
      const entry = {};
      headers.forEach((h, i) => entry[h.toLowerCase()] = values[i] || "");

      if (!blocklist.some(b => b.friendCode === entry.friendcode)) {
        blocklist.push({
          auName: entry["au name"] || "",
          friendCode: entry["friendcode"] || "",
          infraction: entry["infraction"] || "",
          reason: entry["reason"] || "",
          parole: entry["parole"] || ""
        });
      }
    });

    localStorage.setItem("blocklist", JSON.stringify(blocklist));
    renderTable();
  };

  reader.readAsText(file);
}

// ===== CSV Export =====
function exportCSV() {
  const blocklist = JSON.parse(localStorage.getItem("blocklist") || "[]");
  if (blocklist.length === 0) {
    alert("No data to export!");
    return;
  }

  const headers = ["AU NAME", "FRIENDCODE", "INFRACTION", "REASON", "PAROLE"];
  const rows = blocklist.map(e => [
    e.auName, e.friendCode, e.infraction, e.reason, e.parole
  ].map(v => `"${v}"`).join(","));

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Copy.csv";
  a.click();
  URL.revokeObjectURL(url);
} */
