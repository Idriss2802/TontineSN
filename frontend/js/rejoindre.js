const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

document.getElementById("formJoin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = document.getElementById("code").value.trim().toUpperCase();
  const messageBox = document.getElementById("message");

  try {
    // 1. Requête POST pour rejoindre (via code uniquement)
    const res = await fetch("http://localhost:3000/api/tontines/rejoindre", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code_invitation: code }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Réponse non valide :", errorText);
      throw new Error("Échec de la requête : " + res.status);
    }

    const result = await res.json();

    // Stocker l'id si tu veux l'utiliser ailleurs
    if (result.tontine?.id) {
      localStorage.setItem("tontineId", result.tontine.id);
    }

    messageBox.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } catch (err) {
    console.error(err);
    messageBox.innerHTML = `<div class="alert alert-danger">Erreur : ${err.message}</div>`;
  }
});
