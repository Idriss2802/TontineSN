const token = localStorage.getItem("token");
const tontineId = new URLSearchParams(window.location.search).get("id");
if (!token || !tontineId) window.location.href = "login.html";

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

const api = "http://localhost:3000/api/tontines";
const form = document.getElementById("formModifier");
const messageBox = document.getElementById("message");
const cancelBtn = document.getElementById("cancelBtn");

async function chargerTontine() {
  try {
    const res = await fetch(`${api}/mes-tontines`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tontines = await res.json();
    const tontine = tontines.find((t) => t.id == tontineId && t.isAdmin);

    if (!tontine) {
      alert("Accès refusé ou vous n'êtes pas administrateur.");
      return (window.location.href = "dashboard.html");
    }

    document.getElementById("nom").value = tontine.nom;
    document.getElementById("description").value = tontine.description || "";
    document.getElementById("montant").value = tontine.montant;
    document.getElementById("frequence").value =
      tontine.frequence.toLowerCase();
    document.getElementById("nb_max_membres").value =
      tontine.nb_max_membres || 10;
    document.getElementById("date_debut").value =
      tontine.date_debut?.split("T")[0];

    cancelBtn.href = `tontine.html?id=${tontine.id}`;
  } catch (err) {
    console.error(err);
    alert("Erreur lors du chargement.");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageBox.innerHTML = "";

  const payload = {
    nom: document.getElementById("nom").value.trim(),
    description: document.getElementById("description").value.trim(),
    montant: parseInt(document.getElementById("montant").value),
    frequence: document.getElementById("frequence").value,
    nb_max_membres: parseInt(document.getElementById("nb_max_membres").value),
    date_debut: document.getElementById("date_debut").value,
  };

  try {
    const res = await fetch(`${api}/${tontineId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
    messageBox.innerHTML = `<div class="alert alert-danger">Erreur lors de la modification.</div>`;
  }
});

chargerTontine();
