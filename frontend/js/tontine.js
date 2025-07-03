const token = localStorage.getItem("token");
const tontineId = new URLSearchParams(window.location.search).get("id");
// document.getElementById(
//   "agenda-link"
// ).href = `../views/agenda.html?id=${tontineId}`;
if (!token || !tontineId) window.location.href = "login.html";

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

async function chargerTontine() {
  try {
    // 1. Récupération des tontines où je suis
    const res = await fetch("http://localhost:3000/api/tontines/mes-tontines", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = await res.json();
    const tontine = all.find((t) => t.id == tontineId);
    //console.log(tontine);
    if (!tontine) return alert("Accès refusé.");

    // 2. Affichage infos générales

    const resRecupTont = await fetch(`http://localhost:3000/api/tontines`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tonRecup = await resRecupTont.json();

    const code_invi = tonRecup.tontines || all; // compatibilité
    const code_inviRecup = code_invi.find((t) => t.id == tontineId); // ou un critère adapté
    const code_invitation = code_inviRecup?.code_invitation || "non dispo";

    //console.log(code_inviRecup);

    document.getElementById("tontineInfo").innerHTML = `
        <h5>${tontine.nom}</h5>
        <p>${tontine.description}</p>
        <p><strong>Montant :</strong> ${tontine.montant} FCFA | 
           <strong>Fréquence :</strong> ${tontine.frequence} | 
           <strong>Position :</strong> ${tontine.position}</p>
        <p><span class="badge bg-${tontine.isAdmin ? "success" : "secondary"}">
          ${tontine.isAdmin ? "Administrateur" : "Membre"}
        </span></p>
        ${
          tontine.isAdmin
            ? `<p><strong>Code d’invitation :</strong> <code>${code_invitation}</code></p>`
            : ""
        }
      `;

    // 3. Récupération des membres
    const resM = await fetch(
      `http://localhost:3000/api/tontines/${tontineId}/membres`
    );
    const membres = await resM.json();
    const container = document.getElementById("membres");
    membres.forEach((m) => {
      container.innerHTML += `
          <div class="list-group-item d-flex justify-content-between">
            <div>
              <strong>${m.User.nom}</strong> (${m.User.email})<br/>
              Position : ${m.position} | Statut : ${m.statut}
            </div>
            ${
              m.isAdmin
                ? '<span class="badge bg-success align-self-center">Admin</span>'
                : ""
            }
          </div>
        `;
    });

    // Bouton ajout de membre (admin)
    if (tontine.isAdmin) {
      document.getElementById("btnAddMembre").innerHTML = `
          <a href="ajouter-membre.html?id=${tontine.id}" class="btn btn-primary">+ Ajouter un membre</a>
        `;
    }

    // 4. Paiements
    const resP = await fetch(
      `http://localhost:3000/api/tontines/${
        tontine.isAdmin ? tontineId + "/paiements" : "mes-paiements"
      }`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const paiements = await resP.json();
    const data = tontine.isAdmin
      ? paiements.paiements || paiements
      : paiements.paiements;

    const table = `
        <table class="table table-bordered table-hover">
          <thead>
            <tr>
              ${tontine.isAdmin ? "<th>Membre</th>" : ""}
              <th>Montant</th><th>Cycle</th><th>Opérateur</th><th>Date</th><th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (p) => `
              <tr>
                ${tontine.isAdmin ? `<td>${p.User?.nom || "-"}</td>` : ""}
                <td>${p.montant}</td>
                <td>${p.cycle}</td>
                <td>${p.operateur || "-"}</td>
                <td>${new Date(p.date_paiement).toLocaleDateString()}</td>
                <td><span class="badge bg-info">${p.statut}</span></td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      `;
    document.getElementById("paiements").innerHTML = table;

    // 5. Actions
    let actions = ``;
    if (tontine.isAdmin) {
      actions += `
          <a href="modifier-tontine.html?id=${tontine.id}" class="btn btn-outline-secondary me-2">✏️ Modifier</a>
          <a href="deleguer.html?id=${tontine.id}" class="btn btn-outline-warning me-2">👑 Déléguer</a>
          <a href="paiement.html?id=${tontine.id}" class="btn btn-outline-primary me-2">💰 Payer</a>
          <button onclick="supprimerTontine()" class="btn btn-outline-danger">🗑️ Supprimer</button>
        `;
    } else {
      actions += `
          <button onclick="quitterTontine()" class="btn btn-outline-danger">🚪 Quitter la tontine</button>
          <a href="../views/paiement.html" class="btn btn-primary">Effectuer un paiement</a>
        `;
    }
    document.getElementById("actions").innerHTML = actions;
  } catch (e) {
    console.error(e);
    alert("Erreur lors du chargement de la tontine.");
  }
}

async function quitterTontine() {
  if (!confirm("Confirmez-vous votre départ de la tontine ?")) return;
  const res = await fetch(
    `http://localhost:3000/api/tontines/${tontineId}/quitter`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (res.ok) {
    alert("Vous avez quitté la tontine.");
    window.location.href = "dashboard.html";
  } else {
    const err = await res.json();
    alert(err.message || "Erreur.");
  }
}

async function supprimerTontine() {
  if (!confirm("Supprimer définitivement cette tontine ?")) return;
  const res = await fetch(`http://localhost:3000/api/tontines/${tontineId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    alert("Tontine supprimée.");
    window.location.href = "dashboard.html";
  } else {
    const err = await res.json();
    alert(err.message || "Erreur.");
  }
}

chargerTontine();
