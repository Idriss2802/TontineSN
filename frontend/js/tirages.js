document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tontineId = urlParams.get("id");

  if (!tontineId) {
    alert("ID de tontine manquant.");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Non connecté.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:3000/api/tontines/${tontineId}/tirages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Erreur lors du chargement des tirages.");
    }

    const data = await res.json();
    const container = document.getElementById("tirages-container");

    if (data.tirages.length === 0) {
      container.innerHTML = "<p>Aucun tirage effectué pour cette tontine.</p>";
    } else {
      data.tirages.forEach((t) => {
        const card = document.createElement("div");
        card.className = "col-12 col-md-6";
        card.innerHTML = `
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title">🎁 Montant gagné : ${
                t.montant_gagne
              } FCFA</h5>
              <p class="card-text">
                Gagnant : <strong>${t.gagnant.nom}</strong><br/>
                Email : ${t.gagnant.email}<br/>
                Date du tirage : ${new Date(t.date_tirage).toLocaleDateString()}
              </p>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error(error);
    alert("Erreur lors du chargement.");
  }
});
