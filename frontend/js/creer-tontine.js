const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

document.getElementById("tontineForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    nom: document.getElementById("nom").value,
    description: document.getElementById("description").value,
    montant: document.getElementById("montant").value,
    frequence: document.getElementById("frequence").value,
    nb_max_membres: document.getElementById("nb_max_membres").value,
    date_debut: document.getElementById("date_debut").value,
  };

  try {
    const res = await fetch("http://localhost:3000/api/tontines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    const msgBox = document.getElementById("message");

    if (res.ok) {
      msgBox.innerHTML = `<div class="alert alert-success">Tontine créée avec succès ! 🎉</div>`;
      document.getElementById("tontineForm").reset();
      window.location.href = "dashboard.html";
    } else {
      msgBox.innerHTML = `<div class="alert alert-danger">${
        result.message || "Erreur inconnue."
      }</div>`;
    }
  } catch (error) {
    console.error(error);
    document.getElementById("message").innerHTML =
      '<div class="alert alert-danger">Erreur réseau ou serveur.</div>';
  }
});
