import { COULEURS } from "../../components/Layout";

function CarteStat({ titre, valeur, sousTexte, couleur }) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flex: 1 }}>
      <p style={{ fontSize: "11px", fontWeight: "700", color: COULEURS.gris, textTransform: "uppercase", margin: 0 }}>{titre}</p>
      <p style={{ fontSize: "28px", fontWeight: "800", color: COULEURS.texte, margin: "8px 0 4px" }}>{valeur}</p>
      {sousTexte && <p style={{ fontSize: "12px", color: couleur || COULEURS.gris, margin: 0, fontWeight: "600" }}>{sousTexte}</p>}
    </div>
  );
}

export default function TableauDeBord({ role }) {
  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <p style={{ fontSize: "12px", opacity: 0.8, margin: 0 }}>Espace de travail {role.charAt(0) + role.slice(1).toLowerCase()}</p>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "8px 0" }}>Tableau de bord LAKOLI</h1>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <CarteStat titre="Total élèves" valeur="—" sousTexte="À connecter à l'API" />
        <CarteStat titre="Enseignants actifs" valeur="—" sousTexte="À connecter à l'API" />
        <CarteStat titre="Paiements à jour" valeur="—" couleur={COULEURS.vert} />
        <CarteStat titre="Paiements en retard" valeur="—" couleur={COULEURS.rouge} />
      </div>

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <p style={{ color: COULEURS.gris, fontSize: "13px" }}>
          Ce tableau de bord sera connecté aux vraies données une fois le module Élèves branché à l'API.
        </p>
      </div>
    </div>
  );
}
