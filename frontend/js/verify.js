document.getElementById("verifyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const otp = document.getElementById("otp").value.trim();
  const email = localStorage.getItem("email"); // récupéré à l'inscription

  if (!email) {
    alert("Aucun e-mail trouvé. Veuillez vous inscrire à nouveau.");
    window.location.href = "register.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Vérification réussie ! Vous pouvez maintenant vous connecter.");
      localStorage.removeItem("email"); // nettoyage
      window.location.href = "../views/login.html";
    } else {
      alert(data.message || "Échec de la vérification. Code invalide.");
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau.");
  }
});
