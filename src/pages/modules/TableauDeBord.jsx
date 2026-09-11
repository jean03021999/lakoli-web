import { useEffect, useState } from "react";
import { COULEURS } from "../../components/Layout";
import api from "../../services/api";

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
  const [stats, setStats] = useState({
    totalEleves: "—",
    aJour: "—",
    enRetard: "—",
    enseignantsActifs: "—",
    evaluationsAValider: "—",
  });

  useEffect(() => {
    async function charger() {
      const [eleves, enseignants, evaluations] = await Promise.allSettled([
        api.get("/eleves"),
        api.get("/enseignants"),
        api.get("/evaluations", { params: { vue: "direction" } }),
      ]);

      setStats({
        totalEleves: eleves.status === "fulfilled" ? eleves.value.data.stats.total : "—",
        aJour: eleves.status === "fulfilled" ? eleves.value.data.stats.a_jour : "—",
        enRetard: eleves.status === "fulfilled" ? eleves.value.data.stats.en_retard : "—",
        enseignantsActifs: enseignants.status === "fulfilled" ? enseignants.value.data.stats.actifs : "—",
        evaluationsAValider:
          evaluations.status === "fulfilled"
            ? evaluations.value.data.filter((ev) => ev.statut === "soumis").length
            : "—",
      });
    }
    charger();
  }, []);

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <p style={{ fontSize: "12px", opacity: 0.8, margin: 0 }}>Espace de travail {role.charAt(0) + role.slice(1).toLowerCase()}</p>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "8px 0" }}>Tableau de bord LAKOLI</h1>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <CarteStat titre="Total élèves" valeur={stats.totalEleves} />
        <CarteStat titre="Enseignants actifs" valeur={stats.enseignantsActifs} />
        <CarteStat titre="Paiements à jour" valeur={stats.aJour} couleur={COULEURS.vert} />
        <CarteStat titre="Paiements en retard" valeur={stats.enRetard} couleur={COULEURS.rouge} />
        <CarteStat titre="Évaluations à valider" valeur={stats.evaluationsAValider} couleur={COULEURS.navy} />
      </div>

      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <p style={{ color: COULEURS.gris, fontSize: "13px" }}>
          Répartition des bulletins par classe à venir.
        </p>
      </div>
    </div>
  );
}
