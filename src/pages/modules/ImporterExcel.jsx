import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft,
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui/LakoliDesignSystem";

const ETAPES = ["Importer le fichier", "Vérifier les données", "Confirmation"];
const LIGNES_PAR_PAGE = 10;

function Stepper({ etapeActive }) {
  return (
    <div className="flex items-center mb-6">
      {ETAPES.map((nom, i) => (
        <div key={nom} className={`flex items-center ${i < ETAPES.length - 1 ? "flex-1" : ""}`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                i <= etapeActive ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < etapeActive ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs font-bold whitespace-nowrap ${i <= etapeActive ? "text-slate-900" : "text-slate-400"}`}>
              {nom}
            </span>
          </div>
          {i < ETAPES.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${i < etapeActive ? "bg-[#2563EB]" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function badgeStatut(statut) {
  if (statut === "ok") return <Badge variant="blue" icon={CheckCircle2}>Valide</Badge>;
  if (statut === "doublon") return <Badge variant="outline">Doublon</Badge>;
  return <Badge variant="neutral" className="!bg-rose-50 !text-rose-600 !border-rose-100">Erreur</Badge>;
}

export default function ImporterExcel() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [fichier, setFichier] = useState(null);
  const [survole, setSurvole] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [importEnCours, setImportEnCours] = useState(false);
  const [termine, setTermine] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [page, setPage] = useState(1);

  const etapeActive = termine !== null ? 2 : resultat ? 1 : 0;

  const formatTaille = (octets) => {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const selectionnerFichier = (f) => {
    if (!f) return;
    const extension = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension)) {
      setErreur("Format non supporté. Utilisez un fichier .xlsx, .xls ou .csv.");
      return;
    }
    setErreur("");
    setFichier(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setSurvole(false);
    selectionnerFichier(e.dataTransfer.files[0]);
  };

  const telechargerModele = async () => {
    try {
      const response = await api.get("/eleves/import/modele", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = "modele_import_eleves_lakoli.xlsx";
      lien.click();
    } catch (err) {
      setErreur("Impossible de télécharger le modèle.");
    }
  };

  const handleAnalyser = async () => {
    if (!fichier) return;
    setErreur("");
    setAnalyseEnCours(true);
    setResultat(null);
    const formData = new FormData();
    formData.append("fichier", fichier);
    try {
      const response = await api.post("/eleves/import/analyser", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultat(response.data);
      setPage(1);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'analyse du fichier.");
    } finally {
      setAnalyseEnCours(false);
    }
  };

  const handleImporter = async () => {
    const lignesValides = resultat.lignes.filter((l) => l.statut === "ok");
    setImportEnCours(true);
    try {
      const response = await api.post("/eleves/import/executer", { lignes: lignesValides });
      setTermine(response.data.importes);
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'import.");
    } finally {
      setImportEnCours(false);
    }
  };

  const recommencer = () => {
    setFichier(null);
    setResultat(null);
    setTermine(null);
    setErreur("");
    setFiltreStatut("tous");
    setPage(1);
  };

  const lignesFiltrees = resultat ? resultat.lignes.filter((l) => filtreStatut === "tous" || l.statut === filtreStatut) : [];
  const totalPages = Math.ceil(lignesFiltrees.length / LIGNES_PAR_PAGE) || 1;
  const lignesPage = lignesFiltrees.slice((page - 1) * LIGNES_PAR_PAGE, page * LIGNES_PAR_PAGE);

  if (termine !== null) {
    return (
      <div className="space-y-6">
        <Stepper etapeActive={2} />
        <Card className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Import terminé</h2>
          <p className="text-base font-bold text-emerald-600 mb-1">{termine} élève(s) importé(s) avec succès</p>
          {resultat && (resultat.stats.doublons > 0 || resultat.stats.erreurs > 0) && (
            <p className="text-sm text-slate-400 mb-6">
              {resultat.stats.doublons > 0 && `${resultat.stats.doublons} doublon(s) ignoré(s)`}
              {resultat.stats.doublons > 0 && resultat.stats.erreurs > 0 && " · "}
              {resultat.stats.erreurs > 0 && `${resultat.stats.erreurs} ligne(s) rejetée(s)`}
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="primary" onClick={() => navigate("/eleves")}>Voir les élèves importés</Button>
            <Button variant="secondary" onClick={recommencer}>Nouvel import</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/eleves")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Retour à la liste
      </button>

      <h2 className="text-xl font-bold text-slate-900">Importer des élèves depuis Excel</h2>

      <Stepper etapeActive={etapeActive} />

      {!resultat && (
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-slate-500">
              Colonnes reconnues automatiquement : Nom, Prénom, Matricule, Classe, Date de naissance, Lieu de naissance, filiation. La photo n'est pas importée depuis Excel.
            </p>
            <Button variant="secondary" size="sm" icon={Download} onClick={telechargerModele} className="whitespace-nowrap">
              Modèle Excel
            </Button>
          </div>

          {!fichier ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setSurvole(true); }}
              onDragLeave={() => setSurvole(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                survole ? "border-[#2563EB] bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100/50"
              }`}
            >
              <UploadCloud className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800 mb-1">Glissez-déposez votre fichier Excel ici</p>
              <p className="text-xs text-slate-400 mb-4">ou</p>
              <Button
                type="button"
                variant="primary"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                Parcourir les fichiers
              </Button>
              <p className="text-[11px] text-slate-400 mt-4">
                Formats acceptés : .xlsx, .xls, .csv — Taille maximale : 10 Mo
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => selectionnerFichier(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="h-11 w-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{fichier.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatTaille(fichier.size)} · Prêt à analyser</p>
              </div>
              <button
                onClick={() => { setFichier(null); setErreur(""); }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Remplacer
              </button>
            </div>
          )}

          {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

          {fichier && (
            <Button variant="primary" size="lg" disabled={analyseEnCours} onClick={handleAnalyser} className="w-full">
              {analyseEnCours ? "Analyse en cours..." : "Analyser le fichier →"}
            </Button>
          )}
        </Card>
      )}

      {resultat && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setFiltreStatut("tous")}
              className={`bg-white rounded-xl p-4 text-left border-2 transition-colors ${filtreStatut === "tous" ? "border-[#2563EB]" : "border-transparent"} shadow-xs`}
            >
              <p className="text-2xl font-extrabold text-slate-900">{resultat.stats.total}</p>
              <p className="text-xs text-slate-400">Total analysées</p>
            </button>
            <button
              onClick={() => setFiltreStatut("ok")}
              className={`bg-emerald-50 rounded-xl p-4 text-left border-2 transition-colors ${filtreStatut === "ok" ? "border-emerald-500" : "border-transparent"} shadow-xs`}
            >
              <p className="text-2xl font-extrabold text-emerald-600">{resultat.stats.valides}</p>
              <p className="text-xs text-emerald-600">Valides</p>
            </button>
            <button
              onClick={() => setFiltreStatut("doublon")}
              className={`bg-amber-50 rounded-xl p-4 text-left border-2 transition-colors ${filtreStatut === "doublon" ? "border-amber-500" : "border-transparent"} shadow-xs`}
            >
              <p className="text-2xl font-extrabold text-amber-600">{resultat.stats.doublons}</p>
              <p className="text-xs text-amber-600">Doublons</p>
            </button>
            <button
              onClick={() => setFiltreStatut("erreur")}
              className={`bg-rose-50 rounded-xl p-4 text-left border-2 transition-colors ${filtreStatut === "erreur" ? "border-rose-500" : "border-transparent"} shadow-xs`}
            >
              <p className="text-2xl font-extrabold text-rose-600">{resultat.stats.erreurs}</p>
              <p className="text-xs text-rose-600">Erreurs</p>
            </button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                    <th className="py-3 px-5">Statut</th>
                    <th className="py-3 px-5">Nom</th>
                    <th className="py-3 px-5">Prénom</th>
                    <th className="py-3 px-5">Classe</th>
                    <th className="py-3 px-5">Détail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {lignesPage.map((ligne, i) => (
                    <tr key={i}>
                      <td className="py-3 px-5">{badgeStatut(ligne.statut)}</td>
                      <td className="py-3 px-5 text-slate-800">{ligne.nom}</td>
                      <td className="py-3 px-5 text-slate-800">{ligne.prenom}</td>
                      <td className="py-3 px-5 text-slate-800">{ligne.classe_nom}</td>
                      <td className="py-3 px-5 text-xs text-slate-400">{ligne.message}</td>
                    </tr>
                  ))}
                  {lignesPage.length === 0 && (
                    <tr><td colSpan="5" className="py-8 text-center text-sm text-slate-400">Aucune ligne dans cette catégorie.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 py-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-default"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-500">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer disabled:cursor-default"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="m-5 mt-0 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-semibold text-slate-800 mb-3">
                {resultat.stats.valides} élève(s) seront importés · {resultat.stats.doublons + resultat.stats.erreurs} ligne(s) seront ignorées
              </p>
              <div className="flex gap-3">
                <Button variant="primary" disabled={resultat.stats.valides === 0 || importEnCours} onClick={handleImporter}>
                  {importEnCours ? "Import en cours..." : `Confirmer l'import (${resultat.stats.valides})`}
                </Button>
                <Button variant="secondary" onClick={recommencer}>Recommencer</Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
