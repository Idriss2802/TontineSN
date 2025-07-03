document.addEventListener("DOMContentLoaded", async () => {
  // const params = new URLSearchParams(window.location.search);
  // const tontineId = params.get("id");

  // if (!tontineId) {
  //   alert("Aucune tontine spécifiée.");
  //   return;
  // }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Veuillez vous connecter.");
    window.location.href = "login.html";
    return;
  }

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
      `http://localhost:3000/api/tontines/${tontine.id}/agenda`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    //console.log(data);
    const body = document.getElementById("agenda-body");
    body.innerHTML = "";

    if (!data.agenda || data.agenda.length === 0) {
      body.innerHTML = "<tr><td colspan='5'>Aucun cycle planifié.</td></tr>";
      return;
    }

    data.agenda.forEach((item) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${item.cycle}</td>
        <td>${item.date_paiement}</td>
        <td>${item.membre.nom} (${item.membre.email})</td>
        <td><span class="badge text-bg-${getColor(item.statut)}">${
        item.statut
      }</span></td>
        <td>${item.estJourDeTirage ? "🎁" : ""}</td>
      `;

      body.appendChild(tr);
    });
  } catch (error) {
    console.error("Erreur lors du chargement de l’agenda :", error);
    alert("Erreur de chargement.");
  }

  function getColor(statut) {
    switch (statut) {
      case "effectué":
        return "success";
      case "à venir":
        return "info";
      case "en cours":
        return "warning";
      case "en retard":
        return "danger";
      default:
        return "secondary";
    }
  }
});
