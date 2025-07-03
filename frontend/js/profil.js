const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Récupération des infos de l'utilisateur
    const resUser = await fetch("http://localhost:3000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await resUser.json();

    document.getElementById("nom").textContent = user.nom;
    document.getElementById("email").textContent = user.email;
    document.getElementById("telephone").textContent = user.telephone;

    // Récupération des tontines
    const resTontines = await fetch(
      "http://localhost:3000/api/tontines/mes-tontines",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const tontines = await resTontines.json();

    const adminList = document.getElementById("tontines-admin");
    const joinedList = document.getElementById("tontines-rejointes");

    tontines.forEach((t) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <span>${t.nom}</span>
        <a href="tontine.html?id=${t.id}" class="btn btn-sm btn-outline-primary">Détails</a>
      `;
      if (t.isAdmin) adminList.appendChild(li);
      else joinedList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("Erreur lors du chargement du profil.");
  }
});
