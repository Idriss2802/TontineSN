const token = localStorage.getItem("token");
const tontineId = new URLSearchParams(window.location.search).get("id");
if (!token || !tontineId) window.location.href = "login.html";

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

const apiBase = "http://localhost:3000/api/tontines";
const membreSelect = document.getElementById("membreSelect");
const form = document.getElementById("delegationForm");
const messageBox = document.getElementById("message");
const cancelBtn = document.getElementById("cancelBtn");

cancelBtn.href = `tontine.html?id=${tontineId}`;

async function chargerMembres() {
  try {
    const res = await fetch(`${apiBase}/${tontineId}/membres`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const membres = await res.json();

    // Ajouter seulement les membres non-admins
    membres
      .filter((m) => !m.isAdmin)
      .forEach((m) => {
        const option = document.createElement("option");
        option.value = m.User.id;
        option.textContent = `${m.User.nom} (${m.User.email})`;
        membreSelect.appendChild(option);
      });

    if (membreSelect.options.length === 1) {
      membreSelect.disabled = true;
      messageBox.innerHTML = `<div class="alert alert-warning">Aucun membre éligible pour la délégation.</div>`;
      form.querySelector("button[type=submit]").disabled = true;
    }
  } catch (err) {
    console.error(err);
    messageBox.innerHTML = `<div class="alert alert-danger">Erreur lors du chargement des membres.</div>`;
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nouveauAdminId = membreSelect.value;
  messageBox.innerHTML = "";

  try {
    const res = await fetch(`${apiBase}/${tontineId}/deleguer-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nouveauAdminId }),
    });

    const data = await res.json();
    if (res.ok) {
      messageBox.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
      setTimeout(() => {
        window.location.href = `tontine.html?id=${tontineId}`;
      }, 1500);
    } else {
      messageBox.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
    }
  } catch (err) {
    console.error(err);
    messageBox.innerHTML = `<div class="alert alert-danger">Erreur serveur.</div>`;
  }
});

chargerMembres();
