document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const motdepasse = document.getElementById("motdepasse").value;

  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motdepasse }),
    });

    const data = await res.json();
    //console.log(data);

    if (res.ok) {
      localStorage.setItem("token", data.token);
      // Si tu stockes le nom de l’utilisateur dans localStorage à l’inscription ou après connexion, il s’affichera automatiquement.dans dashboard
      localStorage.setItem("nom", data.user.nom);
      alert("Connexion réussie !");
      // Rediriger vers le tableau de bord ou page principale
      window.location.href = "../views/dashboard.html";
    } else if (
      data.message === "Email non vérifié ou utilisateur introuvable."
    ) {
      // Re-envoyer l'email dans localStorage si nécessaire
      localStorage.setItem("email", email);
      alert(data.message || "Erreur lors de la connexion.");
      window.location.href = "../views/register.html";
      return;
    } else {
      if (data.email !== email) {
        alert(data.message || "Erreur lors de la connexion.");
        console.log("non reconnue", email);
        alert("Veuillez d'abord vérifier votre adresse e-mail.");
        window.location.href = "../views/verify.html";
      }
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau.");
  }
});
