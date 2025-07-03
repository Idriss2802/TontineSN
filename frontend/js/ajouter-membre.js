const token = localStorage.getItem("token");
const urlParams = new URLSearchParams(window.location.search);
const tontineId = urlParams.get("id");
const messageBox = document.getElementById("message");

if (!token || !tontineId) window.location.href = "login.html";

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Vérifier que l'utilisateur est admin
async function verifierAdmin() {
  const res = await fetch("http://localhost:3000/api/tontines/mes-tontines", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tontines = await res.json();
  const t = tontines.find((t) => t.id == tontineId);
  if (!t || !t.isAdmin) {
    alert("Accès interdit. Seul l'admin peut ajouter des membres.");
    window.location.href = "dashboard.html";
  }
}

document.getElementById("ajoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const position = parseInt(document.getElementById("position").value);

  try {
    const res = await fetch(
      `http://localhost:3000/api/tontines/${tontineId}/membres`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, position }),
      }
    );

    const result = await res.json();

    if (res.ok) {
      messageBox.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
      document.getElementById("ajoutForm").reset();
    } else {
      messageBox.innerHTML = `<div class="alert alert-danger">${
        result.message || "Erreur."
      }</div>`;
    }
  } catch (err) {
    console.error(err);
    messageBox.innerHTML = `<div class="alert alert-danger">Erreur serveur.</div>`;
  }
});

verifierAdmin();
