const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

async function chargerDashboard() {
  try {
    const res = await fetch("http://localhost:3000/api/tontines/mes-tontines", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tontines = await res.json();
    //console.log(tontines);

    const adminSection = document.getElementById("adminSection");
    const membreSection = document.getElementById("membreSection");

    tontines.forEach((tontine) => {
      const card = `
  <div class="col-md-4">
    <div class="card shadow-sm h-100">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title d-flex justify-content-between align-items-center">
          ${tontine.nom}
          ${
            tontine.isAdmin ? '<span class="badge bg-success">Admin</span>' : ""
          }
        </h5>
        <p class="card-text mb-4">
          <strong>Montant :</strong> ${tontine.montant} FCFA<br/>
          <strong>Fréquence :</strong> ${tontine.frequence}<br/>
          <strong>Position :</strong> ${tontine.position}
        </p>
        <div class="mt-auto d-flex flex-wrap gap-2">
          <a href="../views/tontine.html?id=${
            tontine.id
          }" class="btn btn-outline-primary btn-sm">Détails</a>
          ${
            tontine.isAdmin
              ? `
              <a href="tirages.html?id=${tontine.id}" class="btn btn-outline-info btn-sm">🎲 Tirages</a>
              <button class="btn btn-outline-success btn-sm" onclick="effectuerTirage(${tontine.id}, this)">🎯 Effectuer un tirage</button>
            `
              : ""
          }
        </div>
      </div>
    </div>
  </div>
`;

      if (tontine.isAdmin) {
        adminSection.innerHTML += card;
      } else {
        membreSection.innerHTML += card;
      }
    });
  } catch (error) {
    console.error("Erreur lors du chargement :", error);
    alert("Erreur de connexion.");
  }
}

chargerDashboard();

// fonction pour effectuer le tirage

async function effectuerTirage(tontineId, button) {
  if (!confirm("Voulez-vous effectuer un tirage maintenant ?")) return;

  button.disabled = true;
  button.textContent = "⏳ Tirage en cours...";

  try {
    const resTon = await fetch(
      "http://localhost:3000/api/tontines/mes-tontines",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const all = await resTon.json();
    const tontine = all.find((t) => t);
    //console.log(tontine.id);
    if (!tontine) return alert("Tontine inaccessible.");

    const res = await fetch(
      `http://localhost:3000/api/tontines/${tontine.id}/effectTirage`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Erreur lors du tirage.");
    }

    alert("✅ Tirage effectué avec succès !");
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Erreur : " + err.message);
    button.disabled = false;
    button.textContent = "🎯 Effectuer un tirage";
  }
}
