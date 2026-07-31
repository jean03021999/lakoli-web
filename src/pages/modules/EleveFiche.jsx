import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function EleveFiche() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eleve, setEleve] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const charger = async () => {
      try {
        const response = await api.get(`/eleves/${id}`);
        setEleve(response.data);
      } catch (err) {
        setErreur(err.response?.data?.message || "Impossible de charger la fiche.");
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [id]);

  if (chargement) return <p style={{ color: COULEURS.gris }}>Chargement...</p>;
  if (erreur) return <p style={{ color: COULEURS.rouge }}>{erreur}</p>;
  if (!eleve) return null;

  const filiationParType = (type) => eleve.filiations?.find((f) => f.type_lien === type);
  const pere = filiationParType("pere");
  const mere = filiationParType("mere");
  const tuteur = filiationParType("tuteur");

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" };
  const label = { fontSize: "11px", color: COULEURS.gris, textTransform: "uppercase", fontWeight: "700", margin: 0 };
  const valeur = { fontSize: "14px", color: COULEURS.texte, margin: "4px 0 0", fontWeight: "600" };

  return (
    <div>
      <button onClick={() => navigate("/eleves")} style={{ background: "none", border: "none", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer", marginBottom: "16px", padding: 0 }}>
        ← Retour à la liste
      </button>

      {/* Identité */}
      <div style={carte}>
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "12px", backgroundColor: COULEURS.navyClair, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", color: COULEURS.navy, flexShrink: 0 }}>
            {eleve.nom?.[0]}{eleve.prenom?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: COULEURS.texte }}>{eleve.nom} {eleve.prenom}</h2>
            <p style={{ margin: "4px 0 16px", fontSize: "13px", color: COULEURS.gris }}>{eleve.matricule}</p>
            <div style={{ display: "flex", gap: "32px" }}>
              <div>
                <p style={label}>Date de naissance</p>
                <p style={valeur}>{eleve.date_naissance}</p>
              </div>
              <div>
                <p style={label}>Lieu de naissance</p>
                <p style={valeur}>{eleve.lieu_naissance || "—"}</p>
              </div>
              <div>
                <p style={label}>Classe</p>
                <p style={valeur}>{eleve.classe?.nom || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filiation */}
      <div style={carte}>
        <p style={{ ...label, marginBottom: "16px" }}>Filiation</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {[
            { titre: "Père", data: pere },
            { titre: "Mère", data: mere },
            { titre: "Tuteur", data: tuteur },
          ].map(({ titre, data }) => (
            <div key={titre} style={{ backgroundColor: COULEURS.grisClair, borderRadius: "10px", padding: "14px" }}>
              <p style={{ ...label, marginBottom: "6px" }}>{titre}</p>
              {data ? (
                <>
                  <p style={valeur}>{data.nom_complet}</p>
                  <p style={{ fontSize: "12px", color: COULEURS.gris, margin: "2px 0 0" }}>{data.telephone || "—"}</p>
                </>
              ) : (
                <p style={{ fontSize: "13px", color: COULEURS.gris, fontStyle: "italic", margin: 0 }}>Non renseigné</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historique paiement */}
      <div style={carte}>
        <p style={{ ...label, marginBottom: "16px" }}>Historique paiement</p>
        {eleve.frais_eleves?.length > 0 ? (
          eleve.frais_eleves.map((frais) =>
            frais.echeances?.map((ech) => (
              <div key={ech.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: "13px", color: COULEURS.texte }}>{ech.libelle}</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: ech.paiements?.length > 0 ? COULEURS.vert : COULEURS.rouge }}>
                  {ech.paiements?.reduce((s, p) => s + parseFloat(p.montant), 0) || 0} / {ech.montant} GNF
                </span>
              </div>
            ))
          )
        ) : (
          <p style={{ fontSize: "13px", color: COULEURS.gris }}>Aucun frais enregistré pour cet élève.</p>
        )}
      </div>
    </div>
  );
}
