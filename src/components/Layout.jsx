import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const COULEURS = {
  navy: "#0C447C",
  navyClair: "#EFF6FF",
  vert: "#059669",
  vertClair: "#D1FAE5",
  rouge: "#DC2626",
  rougeClair: "#FEE2E2",
  gris: "#6B7280",
  grisClair: "#F3F4F6",
  fond: "#F8FAFC",
  texte: "#1F2937",
};

const MODULES = [
  { nom: "Tableau de bord", chemin: "/tableau-de-bord", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"] },
  { nom: "Gestion des Élèves", chemin: "/eleves", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
  { nom: "Gestion des Enseignants", chemin: "/enseignants", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"] },
  { nom: "Gestion des Matières", chemin: "/matieres", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
  { nom: "Emploi du Temps", chemin: "/emploi-du-temps", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"] },
  { nom: "Gestion des Notes", chemin: "/notes", roles: ["DIRECTEUR", "ENSEIGNANT"] },
  { nom: "Bulletins", chemin: "/bulletins", roles: ["DIRECTEUR", "FONDATEUR", "ENSEIGNANT"] },
  { nom: "Frais de Scolarité", chemin: "/frais-scolarite", roles: ["COMPTABLE", "DIRECTEUR", "FONDATEUR"] },
];

export { COULEURS };

export default function Layout({ children, role, setRole }) {
  const navigate = useNavigate();
  const location = useLocation();

  const modulesVisibles = MODULES.filter((m) => m.roles.includes(role));

  const estActif = (chemin) => location.pathname.startsWith(chemin);

  const handleDeconnexion = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("device_token");
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: COULEURS.fond, display: "flex", flexDirection: "column" }}>
      {/* En-tête */}
      <header style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ backgroundColor: COULEURS.navy, borderRadius: "10px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: "bold" }}>
            L
          </div>
          <span style={{ fontWeight: "800", fontSize: "18px", color: COULEURS.texte }}>LAKOLI</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Sélecteur de rôle temporaire, pour démonstration uniquement */}
          <div style={{ display: "flex", backgroundColor: COULEURS.grisClair, borderRadius: "10px", padding: "4px", gap: "4px" }}>
            {["COMPTABLE", "DIRECTEUR", "FONDATEUR", "ENSEIGNANT"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  backgroundColor: role === r ? "#FFFFFF" : "transparent",
                  color: role === r ? COULEURS.texte : COULEURS.gris,
                  boxShadow: role === r ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate("/parametres")}
            style={{ padding: "8px", borderRadius: "8px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: COULEURS.gris }}
            title="Paramètres du compte"
          >
            ⚙️
          </button>

          <button
            onClick={handleDeconnexion}
            style={{ padding: "8px", borderRadius: "8px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: COULEURS.gris }}
            title="Déconnexion"
          >
            🚪
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: "260px", backgroundColor: "#FFFFFF", borderRight: "1px solid #E5E7EB", padding: "16px" }}>
          {modulesVisibles.map((m) => (
            <button
              key={m.chemin}
              onClick={() => navigate(m.chemin)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 16px",
                marginBottom: "4px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                backgroundColor: estActif(m.chemin) ? COULEURS.navyClair : "transparent",
                color: estActif(m.chemin) ? COULEURS.navy : COULEURS.texte,
                borderLeft: estActif(m.chemin) ? `4px solid ${COULEURS.navy}` : "4px solid transparent",
              }}
            >
              {m.nom}
            </button>
          ))}
        </aside>

        {/* Contenu principal */}
        <main style={{ flex: 1, padding: "32px" }}>{children}</main>
      </div>
    </div>
  );
}
