import { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Plus,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Users,
  Tag,
  FileSpreadsheet,
  School,
  Receipt,
} from "lucide-react";
import { Card, Button, Input, Select, Badge } from "../../components/ui/LakoliDesignSystem";

function getInitiales(nom, prenom) {
  return `${nom?.[0] || ""}${prenom?.[0] || ""}`.toUpperCase();
}

function badgeStatutEcheance(statut) {
  if (statut === "payee") return <Badge variant="blue">Payée</Badge>;
  if (statut === "partiellement_payee") return <Badge variant="outline">Partiellement payée</Badge>;
  if (statut === "en_retard") return <Badge variant="neutral" className="!bg-rose-50 !text-rose-600 !border-rose-100">En retard</Badge>;
  return <Badge variant="neutral">À échoir</Badge>;
}

function formaterGNF(montant) {
  return `${Number(montant).toLocaleString("fr-FR")} GNF`;
}

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
  const [grillesExistantes, setGrillesExistantes] = useState([]);
  const [synchronisationEnCours, setSynchronisationEnCours] = useState(null);

  const [paiement, setPaiement] = useState({ echeance_eleve_id: "", montant: "", moyen_paiement: "especes", date_paiement: "" });

  useEffect(() => {
    api.get("/eleves").then((res) => setEleves(res.data.eleves));
    api.get("/classes").then((res) => setClasses(res.data));
    api.get("/frais/types").then((res) => setTypesFrais(res.data));
    chargerGrilles();
  }, []);

  const chargerGrilles = async () => {
    try {
      const res = await api.get("/frais/grilles");
      setGrillesExistantes(res.data);
    } catch (err) {
      setGrillesExistantes([]);
    }
  };

  const synchroniserGrille = async (id) => {
    setSynchronisationEnCours(id);
    setErreur(""); setSucces("");
    try {
      const res = await api.post(`/frais/grilles/${id}/synchroniser`);
      setSucces(res.data.message);
      chargerGrilles();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la synchronisation.");
    } finally {
      setSynchronisationEnCours(null);
    }
  };

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
      chargerGrilles();
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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #0C447C, #1a5a9e)" }}>
        <div
          className="absolute -top-8 -right-8 h-32 w-32 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <div
          className="absolute -bottom-10 right-16 h-20 w-20 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
          style={{ background: "rgba(255,255,255,0.15)", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
        >
          <Wallet className="h-7 w-7 text-white" />
        </div>
        <div className="relative z-10 min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Frais de Scolarité & Facturation</h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-2xl">
            Suivez les paiements des élèves et gérez les grilles tarifaires de l'établissement.
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setOnglet("suivi")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            onglet === "suivi" ? "bg-white text-[#0C447C] shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          Suivi des paiements
        </button>
        <button
          onClick={() => setOnglet("grilles")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            onglet === "grilles" ? "bg-white text-[#0C447C] shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Grilles tarifaires
        </button>
      </div>

      {erreur && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {erreur}
        </div>
      )}
      {succes && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-600 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {succes}
        </div>
      )}

      {onglet === "suivi" && (
        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="lg:w-72 shrink-0 max-h-[560px] overflow-y-auto p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <div className="h-7 w-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                <Users className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">Élèves ({eleves.length})</p>
            </div>
            <div className="p-2">
              {eleves.map((e) => (
                <div
                  key={e.id}
                  onClick={() => chargerSuivi(e.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer mb-1 transition-colors ${
                    eleveSelectionne === e.id ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      eleveSelectionne === e.id ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {getInitiales(e.nom, e.prenom)}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 m-0 truncate">{e.nom} {e.prenom}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex-1 space-y-4">
            {!suivi && (
              <Card className="flex flex-col items-center justify-center text-center py-14 gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Receipt className="h-6 w-6" />
                </div>
                <p className="text-sm text-slate-400 m-0">Sélectionnez un élève pour voir son suivi de paiement.</p>
              </Card>
            )}
            {suivi && suivi.frais.map((f) => (
              <Card key={f.id} className="p-0 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-[#0C447C]/10 text-[#0C447C] flex items-center justify-center shrink-0">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 m-0">{f.type_frais}</p>
                  </div>
                  <span className="text-xs font-bold text-[#0C447C] bg-blue-50 px-3 py-1.5 rounded-full">
                    {formaterGNF(f.montant_total)}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 px-5">
                  {f.echeances.map((ech) => (
                    <div key={ech.id} className="flex items-center justify-between py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 m-0">{ech.libelle}</p>
                        <p className="text-xs text-slate-400 m-0 mt-0.5">Échéance : {ech.date_limite}</p>
                      </div>
                      <div className="text-right space-y-1.5">
                        {badgeStatutEcheance(ech.statut)}
                        <p className="text-xs text-slate-500 m-0 font-medium">{formaterGNF(ech.montant_paye)} / {formaterGNF(ech.montant)}</p>
                        {ech.solde > 0 && (
                          <button
                            onClick={() => setPaiement({ ...paiement, echeance_eleve_id: ech.id })}
                            className="px-2.5 py-1 rounded-lg border border-blue-200 text-[#2563EB] text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            Enregistrer un paiement
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-2" />
              </Card>
            ))}

            {paiement.echeance_eleve_id && (
              <Card className="p-0 overflow-hidden border-blue-100">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-blue-100 bg-blue-50/60">
                  <div className="h-8 w-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 m-0">Enregistrer un paiement</p>
                </div>
                <form onSubmit={enregistrerPaiement} className="flex flex-wrap items-end gap-3 p-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Montant (GNF)</label>
                    <Input type="number" value={paiement.montant} onChange={(e) => setPaiement({ ...paiement, montant: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Moyen</label>
                    <Select value={paiement.moyen_paiement} onChange={(e) => setPaiement({ ...paiement, moyen_paiement: e.target.value })}>
                      <option value="especes">Espèces</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="virement">Virement</option>
                      <option value="cheque">Chèque</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                    <Input type="date" value={paiement.date_paiement} onChange={(e) => setPaiement({ ...paiement, date_paiement: e.target.value })} required />
                  </div>
                  <Button type="submit" variant="primary">Confirmer</Button>
                </form>
              </Card>
            )}
          </div>
        </div>
      )}

      {onglet === "grilles" && (
        <>
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="h-8 w-8 rounded-lg bg-[#0C447C]/10 text-[#0C447C] flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-900 m-0">
                Grilles tarifaires existantes <span className="text-slate-400 font-semibold">({grillesExistantes.length})</span>
              </p>
            </div>

            {grillesExistantes.length === 0 ? (
              <p className="text-sm text-slate-400 px-5 py-8 text-center">Aucune grille tarifaire n'a encore été créée.</p>
            ) : (
              <div className="divide-y divide-slate-100 px-5">
                {grillesExistantes.map((g) => {
                  const couverture = g.nombre_eleves_classe > 0
                    ? Math.round((g.nombre_eleves_couverts / g.nombre_eleves_classe) * 100)
                    : 100;
                  const complet = g.nombre_eleves_couverts >= g.nombre_eleves_classe;

                  return (
                    <div key={g.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                          <School className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 m-0">
                            {g.classe?.nom || "—"} · {g.type_frais?.nom || "—"}
                          </p>
                          <p className="text-xs text-slate-400 m-0 mt-0.5">
                            {formaterGNF(g.montant)} · {g.echeances?.length || 0} échéance{(g.echeances?.length || 0) > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {complet ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {g.nombre_eleves_couverts}/{g.nombre_eleves_classe} élèves à jour
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {g.nombre_eleves_couverts}/{g.nombre_eleves_classe} élèves ({couverture}%)
                            </span>
                            <button
                              onClick={() => synchroniserGrille(g.id)}
                              disabled={synchronisationEnCours === g.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 text-[#2563EB] text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${synchronisationEnCours === g.id ? "animate-spin" : ""}`} />
                              Synchroniser
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="h-1" />
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-900 m-0">Nouveau type de frais</p>
            </div>
            <form onSubmit={ajouterTypeFrais} className="flex gap-3 p-5">
              <Input
                type="text"
                placeholder="ex: Scolarité, Cantine, Transport..."
                value={nouveauType}
                onChange={(e) => setNouveauType(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" variant="secondary">Ajouter</Button>
            </form>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-900 m-0">Créer une grille tarifaire</p>
            </div>
            <form onSubmit={creerGrille} className="space-y-4 p-5">
              <div className="flex flex-wrap gap-3">
                <Select value={grille.classe_id} onChange={(e) => setGrille({ ...grille, classe_id: e.target.value })} required>
                  <option value="">Classe...</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </Select>
                <Select value={grille.type_frais_id} onChange={(e) => setGrille({ ...grille, type_frais_id: e.target.value })} required>
                  <option value="">Type de frais...</option>
                  {typesFrais.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                </Select>
                <Input
                  type="number"
                  placeholder="Montant total (GNF)"
                  value={grille.montant}
                  onChange={(e) => setGrille({ ...grille, montant: e.target.value })}
                  required
                />
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0">Échéances</p>
                <div className="space-y-2">
                  {echeances.map((ech, i) => (
                    <div key={i} className="flex flex-wrap gap-3">
                      <Input type="text" placeholder="Libellé" value={ech.libelle} onChange={(e) => modifierEcheance(i, "libelle", e.target.value)} required />
                      <Input type="number" placeholder="Montant" value={ech.montant} onChange={(e) => modifierEcheance(i, "montant", e.target.value)} required />
                      <Input type="date" value={ech.date_limite} onChange={(e) => modifierEcheance(i, "date_limite", e.target.value)} required />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={ajouterEcheance}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter une échéance
                </button>
              </div>

              <div>
                <Button type="submit" variant="primary" size="lg">Créer la grille</Button>
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
