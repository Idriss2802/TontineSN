document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const nom = document.getElementById("nom").value;
    const email = document.getElementById("email").value;
    const telephone = document.getElementById("telephone").value;
    const motdepasse = document.getElementById("motdepasse").value;

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, telephone, motdepasse }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("email", email); // pour vérification OTP
        alert("Inscription réussie ! Vérifiez le code envoyé par email.");
        window.location.href = "../views/verify.html";
      } else {
        if (data.message === "Un compte vérifié existe déjà avec cet email.") {
          alert(
            "Ce compte existe déjà et a été vérifié. Veuillez vous connecter."
          );
          window.location.href = "../views/login.html";
        } else {
          alert(data.message || "Erreur lors de l'inscription.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  });
