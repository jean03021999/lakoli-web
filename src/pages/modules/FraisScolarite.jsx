import { useState, useEffect } from "react";
import api from "../../services/api";
import { COULEURS } from "../../components/Layout";

export default function FraisScolarite() {
  const [onglet, setOnglet] = useState("suivi");
  const [eleves, setEleves] = useState([]);
  const [eleveSelectionne, setEleveSelectionne] = useState(null);
  const [suivi, setSuivi] = useState(null);
  const [classes, setClasses] = useState([]);
  const [typesFrais, setTypesFrais] = useState([]);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const [nouveauType, setNouveauType] = useState("");
  const [grille, setGrille] = useState({ classe_id: "", type_frais_id: "", montant: "" });
  const [echeances, setEcheances] = useState([{ libelle: "Trimestre 1", montant: "", date_limite: "" }]);

  const [paiement, setPaiement] = useState({ echeance_eleve_id: "", montant: "", moyen_paiement: "especes", date_paiement: "" });

  useEffect(() => {
    api.get("/eleves").then((res) => setEleves(res.data.eleves));
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/frais/types").then((res) => setTypesFrais(res.data));
  }, []);

  const chargerSuivi = async (eleveId) => {
    setEleveSelectionne(eleveId);
    setErreur(""); setSucces("");
    try {
      const res = await api.get(`/frais/eleves/${eleveId}`);
      setSuivi(res.data);
    } catch (err) {
      setErreur("Impossible de charger le suivi de cet élève.");
    }
  };

  const ajouterTypeFrais = async (e) => {
    e.preventDefault();
    try {
      await api.post("/frais/types", { nom: nouveauType });
      setNouveauType("");
      const res = await api.get("/frais/types");
      setTypesFrais(res.data);
    } catch (err) { setErreur("Erreur lors de l'ajout du type de frais."); }
  };

  const ajouterEcheance = () => setEcheances([...echeances, { libelle: "", montant: "", date_limite: "" }]);
  const modifierEcheance = (i, champ, valeur) => {
    const copie = [...echeances];
    copie[i][champ] = valeur;
    setEcheances(copie);
  };

  const creerGrille = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      await api.post("/frais/grilles", { ...grille, echeances });
      setSucces("Grille tarifaire créée et appliquée aux élèves de la classe.");
      setGrille({ classe_id: "", type_frais_id: "", montant: "" });
      setEcheances([{ libelle: "Trimestre 1", montant: "", date_limite: "" }]);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la création de la grille.");
    }
  };

  const enregistrerPaiement = async (e) => {
    e.preventDefault();
    setErreur(""); setSucces("");
    try {
      await api.post("/frais/paiements", paiement);
      setSucces("Paiement enregistré avec succès.");
      chargerSuivi(eleveSelectionne);
      setPaiement({ echeance_eleve_id: "", montant: "", moyen_paiement: "especes", date_paiement: "" });
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement du paiement.");
    }
  };

  const badgeStatutEcheance = (statut) => {
    if (statut === "payee") return { texte: "Payée", couleur: COULEURS.vert, fond: COULEURS.vertClair };
    if (statut === "partiellement_payee") return { texte: "Partiellement payée", couleur: "#D97706", fond: "#FEF3C7" };
    if (statut === "en_retard") return { texte: "En retard", couleur: COULEURS.rouge, fond: COULEURS.rougeClair };
    return { texte: "À échoir", couleur: COULEURS.gris, fond: COULEURS.grisClair };
  };

  const carte = { backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" };
  const champStyle = { padding: "10px 14px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "13px", color: COULEURS.texte, backgroundColor: "#FFFFFF" };

  return (
    <div>
      <div style={{ backgroundColor: COULEURS.navy, borderRadius: "16px", padding: "24px", color: "#FFFFFF", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>Frais de Scolarité & Facturation</h1>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #E5E7EB" }}>
        <button onClick={() => setOnglet("suivi")} style={{ padding: "10px 16px", border: "none", borderBottom: onglet === "suivi" ? `2px solid ${COULEURS.navy}` : "2px solid transparent", backgroundColor: "transparent", color: onglet === "suivi" ? COULEURS.navy : COULEURS.gris, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
          Suivi des paiements
        </button>
        <button onClick={() => setOnglet("grilles")} style={{ padding: "10px 16px", border: "none", borderBottom: onglet === "grilles" ? `2px solid ${COULEURS.navy}` : "2px solid transparent", backgroundColor: "transparent", color: onglet === "grilles" ? COULEURS.navy : COULEURS.gris, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
          Grilles tarifaires
        </button>
      </div>

      {erreur && <p style={{ color: COULEURS.rouge, fontSize: "13px" }}>{erreur}</p>}
      {succes && <p style={{ color: COULEURS.vert, fontSize: "13px" }}>{succes}</p>}

      {onglet === "suivi" && (
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ ...carte, width: "280px", maxHeight: "500px", overflowY: "auto" }}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: COULEURS.gris, marginBottom: "12px", textTransform: "uppercase" }}>Élèves</p>
            {eleves.map((e) => (
              <div key={e.id} onClick={() => chargerSuivi(e.id)} style={{ padding: "10px", borderRadius: "8px", cursor: "pointer", backgroundColor: eleveSelectionne === e.id ? COULEURS.navyClair : "transparent", marginBottom: "4px" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: COULEURS.texte }}>{e.nom} {e.prenom}</p>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {!suivi && <div style={carte}><p style={{ color: COULEURS.gris, fontSize: "13px" }}>Sélectionnez un élève pour voir son suivi de paiement.</p></div>}
            {suivi && suivi.frais.map((f) => (
              <div key={f.id} style={carte}>
                <p style={{ fontSize: "14px", fontWeight: "700", color: COULEURS.texte, marginBottom: "12px" }}>{f.type_frais} — Total: {f.montant_total} GNF</p>
                {f.echeances.map((ech) => {
                  const badge = badgeStatutEcheance(ech.statut);
                  return (
                    <div key={ech.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "13px", color: COULEURS.texte }}>{ech.libelle}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: COULEURS.gris }}>Échéance: {ech.date_limite}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ backgroundColor: badge.fond, color: badge.couleur, padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>{badge.texte}</span>
                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: COULEURS.gris }}>{ech.montant_paye} / {ech.montant} GNF</p>
                        {ech.solde > 0 && (
                          <button onClick={() => setPaiement({ ...paiement, echeance_eleve_id: ech.id })} style={{ marginTop: "4px", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                            Enregistrer un paiement
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {paiement.echeance_eleve_id && (
              <div style={{ ...carte, backgroundColor: COULEURS.navyClair }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.texte, marginBottom: "12px" }}>Enregistrer un paiement</p>
                <form onSubmit={enregistrerPaiement} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Montant (GNF)</label>
                    <input type="number" value={paiement.montant} onChange={(e) => setPaiement({ ...paiement, montant: e.target.value })} style={champStyle} required />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Moyen</label>
                    <select value={paiement.moyen_paiement} onChange={(e) => setPaiement({ ...paiement, moyen_paiement: e.target.value })} style={champStyle}>
                      <option value="especes">Espèces</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="virement">Virement</option>
                      <option value="cheque">Chèque</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: COULEURS.gris, display: "block", marginBottom: "4px" }}>Date</label>
                    <input type="date" value={paiement.date_paiement} onChange={(e) => setPaiement({ ...paiement, date_paiement: e.target.value })} style={champStyle} required />
                  </div>
                  <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.vert, color: "#FFFFFF", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                    Confirmer
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {onglet === "grilles" && (
        <>
          <div style={carte}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "12px", textTransform: "uppercase" }}>Nouveau type de frais</p>
            <form onSubmit={ajouterTypeFrais} style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="ex: Scolarité, Cantine, Transport..." value={nouveauType} onChange={(e) => setNouveauType(e.target.value)} style={{ ...champStyle, flex: 1 }} required />
              <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: `2px solid ${COULEURS.navy}`, backgroundColor: "#FFFFFF", color: COULEURS.navy, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>Ajouter</button>
            </form>
          </div>

          <div style={carte}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: COULEURS.gris, marginBottom: "16px", textTransform: "uppercase" }}>Créer une grille tarifaire</p>
            <form onSubmit={creerGrille}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <select value={grille.classe_id} onChange={(e) => setGrille({ ...grille, classe_id: e.target.value })} style={champStyle} required>
                  <option value="">Classe...</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                <select value={grille.type_frais_id} onChange={(e) => setGrille({ ...grille, type_frais_id: e.target.value })} style={champStyle} required>
                  <option value="">Type de frais...</option>
                  {typesFrais.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                </select>
                <input type="number" placeholder="Montant total (GNF)" value={grille.montant} onChange={(e) => setGrille({ ...grille, montant: e.target.value })} style={champStyle} required />
              </div>

              <p style={{ fontSize: "12px", fontWeight: "700", color: COULEURS.gris, marginBottom: "8px" }}>Échéances</p>
              {echeances.map((ech, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                  <input type="text" placeholder="Libellé" value={ech.libelle} onChange={(e) => modifierEcheance(i, "libelle", e.target.value)} style={champStyle} required />
                  <input type="number" placeholder="Montant" value={ech.montant} onChange={(e) => modifierEcheance(i, "montant", e.target.value)} style={champStyle} required />
                  <input type="date" value={ech.date_limite} onChange={(e) => modifierEcheance(i, "date_limite", e.target.value)} style={champStyle} required />
                </div>
              ))}
              <button type="button" onClick={ajouterEcheance} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px dashed #D1D5DB", backgroundColor: "#FFFFFF", color: COULEURS.gris, fontSize: "12px", cursor: "pointer", marginBottom: "16px" }}>
                + Ajouter une échéance
              </button>
              <br />
              <button type="submit" style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: COULEURS.navy, color: "#FFFFFF", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                Créer la grille
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
