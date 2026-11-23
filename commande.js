"use strict";

const form = document.querySelector("#form-commande");
const message = document.querySelector("#message");

const d = new Date();

const REGLES = {
  nom: v => v.trim().length >= 2 ? "" : "Le nom doit contenir au moins 2 caractères.",
  prenom: v => v.trim().length >= 2 ? "" : "Le prénom doit contenir au moins 2 caractères.",
  email: v => v.includes("@") && v.includes(".") ? "" : "Adresse e-mail invalide.",
  telephone: v => v.slice(0, 4) === "+216" && v.length === 12 && !Number.isNaN(Number(v.slice(4)))
    ? "" : "+216 suivi de 8 chiffres (ex : +21620123456).",
  cod: v => v.length === 4 && !Number.isNaN(Number(v)) ? "" : "Le code postal contient 4 chiffres.",
  adr: v => v.trim().length >= 8 ? "" : "Indiquez une adresse complète.",
  article: v => v !== "" ? "" : "Choisissez un type d'article.",
  taille: v => v !== "" ? "" : "Choisissez une taille.",
  quantite: v => {
    const n = Number(v);
    return n >= 1 && n <= 20 ? "" : "Quantité : un entier entre 1 et 20.";
  },
  date: v => v !== "" && v >= d ? "" : "Choisissez une date à partir d'aujourd'hui.",
};

function verifier(nom) {
  const texte = REGLES[nom](form.elements[nom].value);
  document.querySelector(`#err-${nom}`).textContent = texte;
  return texte === "";
}

form.addEventListener("submit", e => {
  e.preventDefault(); 

  let valide = true;
  for (const nom in REGLES) {
    if (!verifier(nom)) {
      valide = false; 
    }
  }

  if (valide) {
    message.textContent = "Merci ! Votre commande est valide.";
  } else {
    message.textContent = "Veuillez corriger les erreurs avant d'envoyer.";
  }
});