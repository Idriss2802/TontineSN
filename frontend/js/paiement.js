const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

let montantAttendu = 0;

async function chargerTontine() {
  try {
    const res = await fetch("http://localhost:3000/api/tontines/mes-tontines", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = await res.json();
    const tontine = all.find((t) => t);
    //console.log(tontine.id);
    if (!tontine) return alert("Tontine inaccessible.");

    montantAttendu = tontine.montant;

    document.getElementById("tontineDetails").innerHTML = `
        <h5>${tontine.nom}</h5>
        <p>${tontine.description}</p>
        <p><strong>Montant à payer :</strong> ${tontine.montant} FCFA</p>
        <p><strong>Fréquence :</strong> ${tontine.frequence}</p>
        <p><strong>Position :</strong> ${tontine.position}</p>
      `;
  } catch (e) {
    console.error(e);
    alert("Erreur lors du chargement.");
  }
}

document
  .getElementById("paiementForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const operateur = document.getElementById("operateur").value;
    const messageBox = document.getElementById("message");
    messageBox.textContent = "";

    try {
      const resTont = await fetch(
        "http://localhost:3000/api/tontines/mes-tontines",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const all = await resTont.json();
      const tontines = all.tontines || all;
      const tontine = tontines.find((t) => t); // juste une tontine pour test
      if (!tontine) return alert("Tontine inaccessible.");

      const res = await fetch(
        `http://localhost:3000/api/tontines/${tontine.id}/paiement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ montant: montantAttendu, operateur }),
        }
      );

      const data = await res.json();
      //console.log(data);

      messageBox.innerHTML = `<div class="alert alert-${
        res.ok ? "success" : "danger"
      }">${data.message}</div>`;
    } catch (err) {
      console.error(err);
      messageBox.innerHTML = `<div class="alert alert-danger">Erreur lors du paiement.</div>`;
    }
  });

chargerTontine();
