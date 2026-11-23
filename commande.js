"use strict";

/* =====================================================
   commande.js : calcul du prix, validation du formulaire
   Chargé avec <script src="js/commande.js" defer>
   ===================================================== */

// ---------- Données (tableau d'objets) ----------
const CATALOGUE = [
  { id: "robe", nom: "Robe", prix: 85 },
  { id: "chemise", nom: "Chemise", prix: 60 },
  { id: "pantalon", nom: "Pantalon", prix: 90 },
  { id: "veste", nom: "Veste / Costume", prix: 250 },
  { id: "enfant", nom: "Ensemble enfant", prix: 40 },
  { id: "accessoire", nom: "Accessoire", prix: 30 },
];

const SEUIL_CONSEIL = 500;   // au-delà : une conseillère appelle le client
const MAX_PRECISIONS = 200;  // même valeur que maxlength dans le HTML

// false = TP sans serveur : on affiche la commande dans la console.
// true  = on envoie vraiment le formulaire à traitement.php.
const ENVOYER_AU_SERVEUR = false;

// ---------- Sélection des éléments ----------
const form = document.querySelector("#form-commande");
const message = document.querySelector("#message");
const compteur = document.querySelector("#compteur");
const conseil = document.querySelector("#conseil");

const sortie = {
  unitaire: document.querySelector("#r-unitaire"),
  sousTotal: document.querySelector("#r-sous-total"),
  remise: document.querySelector("#r-remise"),
  total: document.querySelector("#r-total"),
};

// Date du jour au format AAAA-MM-JJ (même format que input type="date")
const dateMin = new Date().toLocaleDateString("fr-CA");
form.elements.date.min = dateMin;

// ---------- Prix ----------
function formaterPrix(montant, dev = "DT") {
  if (typeof montant !== "number" || isNaN(montant)) {
    return "—";
  }
  return montant.toFixed(2).replace(".", ",") + " " + dev;
}

// Remise par paliers : on teste du plus grand au plus petit
function remise(total) {
  if (total >= 200) return 0.15;
  if (total >= 100) return 0.10;
  if (total >= 50) return 0.05;
  return 0;
}

// Renvoie null tant que l'article ou la quantité sont invalides
function calculer() {
  const article = CATALOGUE.find(a => a.id === form.elements.article.value);
  const quantite = Number(form.elements.quantite.value);

  if (!article || !Number.isInteger(quantite) || quantite < 1) {
    return null;
  }

  const sousTotal = article.prix * quantite;
  const taux = remise(sousTotal);
  const montantRemise = sousTotal * taux;

  return {
    article,
    quantite,
    sousTotal,
    taux,
    montantRemise,
    total: sousTotal - montantRemise,
  };
}

function majRecap() {
  const calcul = calculer();

  if (calcul === null) {
    sortie.unitaire.textContent = "—";
    sortie.sousTotal.textContent = "—";
    sortie.remise.textContent = "—";
    sortie.total.textContent = "—";
    conseil.hidden = true;
    return;
  }

  sortie.unitaire.textContent = formaterPrix(calcul.article.prix);
  sortie.sousTotal.textContent = formaterPrix(calcul.sousTotal);
  sortie.remise.textContent = calcul.taux === 0
    ? "Aucune"
    : `${Math.round(calcul.taux * 100)} % (− ${formaterPrix(calcul.montantRemise)})`;
  sortie.total.textContent = formaterPrix(calcul.total);
  conseil.hidden = calcul.total < SEUIL_CONSEIL;
}

// ---------- Compteur de caractères ----------
function majCompteur() {
  const n = form.elements.precisions.value.length;
  compteur.textContent = `${n} / ${MAX_PRECISIONS}`;
  compteur.classList.toggle("limite", n >= MAX_PRECISIONS);
}

// ---------- Validation ----------
// Chaque règle renvoie "" si la valeur est bonne, sinon le message d'erreur
const REGLES = {
  nom: v => v.trim().length >= 2 ? "" : "Le nom doit contenir au moins 2 caractères.",
  prenom: v => v.trim().length >= 2 ? "" : "Le prénom doit contenir au moins 2 caractères.",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
    ? "" : "Adresse e-mail invalide (ex : vous@exemple.tn).",
  telephone: v => /^\+216[0-9]{8}$/.test(v.replace(/\s/g, ""))
    ? "" : "+216 suivi de 8 chiffres (ex : +21620123456).",
  cod: v => /^[0-9]{4}$/.test(v.trim()) ? "" : "Le code postal contient 4 chiffres.",
  adr: v => v.trim().length >= 8 ? "" : "Indiquez une adresse complète (8 caractères minimum).",
  article: v => v !== "" ? "" : "Choisissez un type d'article.",
  taille: v => v !== "" ? "" : "Choisissez une taille.",
  quantite: v => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 20 ? "" : "Quantité : un nombre entier entre 1 et 20.";
  },
  date: v => {
    if (v === "") return "Choisissez une date de livraison.";
    if (v < dateMin) return "La date ne peut pas être dans le passé.";
    return "";
  },
};

// Un groupe de radios : la valeur est celle du bouton coché
function lireValeur(champ) {
  return champ.type === "radio" ? form.elements[champ.name].value : champ.value;
}

function afficherErreur(champ, texte) {
  const zone = document.querySelector(`#err-${champ.name}`);
  if (zone) {
    zone.textContent = texte;
  }
  champ.classList.toggle("invalide", texte !== "");
  champ.setAttribute("aria-invalid", texte !== "");
}

function verifier(champ) {
  const regle = REGLES[champ.name];
  if (!regle) return true;

  const texte = regle(lireValeur(champ));
  afficherErreur(champ, texte);
  return texte === "";
}

// ---------- Réinitialisation ----------
function reinitialiser() {
  document.querySelectorAll(".erreur").forEach(zone => { zone.textContent = ""; });
  document.querySelectorAll(".invalide").forEach(c => c.classList.remove("invalide"));
  message.textContent = "";
  message.classList.remove("succes", "echec");
  majRecap();
  majCompteur();
}

// ---------- Événements ----------
// À la sortie d'un champ (focusout remonte jusqu'au formulaire, blur non)
form.addEventListener("focusout", e => {
  if (e.target.type !== "radio") {
    verifier(e.target);
  }
});

// Pendant la saisie : on efface l'erreur dès que le champ est corrigé,
// et on recalcule le récapitulatif
form.addEventListener("input", e => {
  const zone = document.querySelector(`#err-${e.target.name}`);
  if (zone && zone.textContent !== "") {
    verifier(e.target);
  }
  majRecap();
});

form.elements.precisions.addEventListener("input", majCompteur);

form.addEventListener("reset", () => {
  // le reset vide les champs après l'événement : on attend la fin
  setTimeout(reinitialiser, 0);
});

form.addEventListener("submit", e => {
  e.preventDefault();
  message.classList.remove("succes", "echec");

  // On vérifie TOUS les champs, pour afficher tous les messages
  const champs = [...form.elements].filter(c => REGLES[c.name]);
  const invalides = champs.filter(c => !verifier(c));

  if (invalides.length > 0) {
    const nb = new Set(invalides.map(c => c.name)).size;
    message.textContent = `Veuillez corriger ${nb} champ${nb > 1 ? "s" : ""} avant d'envoyer.`;
    message.classList.add("echec");
    invalides[0].focus();
    return;
  }

  if (ENVOYER_AU_SERVEUR) {
    form.submit();
    return;
  }

  // TP sans serveur : on regroupe les données vérifiées et on les affiche
  const data = new FormData(form);
  const donnees = Object.fromEntries(data);
  delete donnees["couleurs[]"];
  delete donnees["options[]"];
  delete donnees.photo;

  const commande = {
    ...donnees,
    couleurs: data.getAll("couleurs[]"),
    options: data.getAll("options[]"),
    photo: data.get("photo").name || null,
    total: calculer()?.total,
  };

  console.log("Commande vérifiée :", commande);
  message.textContent = "Merci ! Votre commande a été vérifiée.";
  message.classList.add("succes");
});

// ---------- État initial ----------
majRecap();
majCompteur();
