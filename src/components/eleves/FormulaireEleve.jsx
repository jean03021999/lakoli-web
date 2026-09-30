import { useEffect, useState } from "react";
import { User, Users, GraduationCap, AlertTriangle, Save, X, Loader2 } from "lucide-react";
import api from "../../services/api";

// Mode edition de la fiche eleve (design "Fiche et modification eleve") : identite, classe et
// filiation, sur PUT /eleves/{id}. Un changement de classe demande de choisir entre une correction
// de saisie et un vrai changement (motif obligatoire, garde dans l'historique de l'eleve).

const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };
const CHAMP =
  "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 transition border-slate-200 focus:ring-[#0C447C]/15 focus:border-[#0C447C]";
const CHAMP_ERREUR = "border-rose-300 focus:ring-rose-200 focus:border-rose-500";

function Libelle({ children, requis }) {
  return (
    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
      {children} {requis && <span className="text-rose-500">*</span>}
    </label>
  );
}

function versFormulaire(eleve) {
  const f = (type) => eleve.filiations?.find((x) => x.type_lien === type);
  return {
    nom: eleve.nom || "",
    prenom: eleve.prenom || "",
    date_naissance: String(eleve.date_naissance || "").slice(0, 10),
    lieu_naissance: eleve.lieu_naissance || "",
    classe_id: eleve.inscription_active?.classe_id ? String(eleve.inscription_active.classe_id) : "",
    pere_nom: f("pere")?.nom_complet || "",
    pere_telephone: f("pere")?.telephone || "",
    mere_nom: f("mere")?.nom_complet || "",
    mere_telephone: f("mere")?.telephone || "",
    tuteur_nom: f("tuteur")?.nom_complet || "",
    tuteur_telephone: f("tuteur")?.telephone || "",
    tuteur_lien: f("tuteur")?.lien_avec_eleve || "",
  };
}

export default function FormulaireEleve({ eleve, onAnnuler, onEnregistre }) {
  const [form, setForm] = useState(() => versFormulaire(eleve));
  const [classes, setClasses] = useState([]);
  const [modeClasse, setModeClasse] = useState("correction");
  const [motif, setMotif] = useState("");
  const [erreurs, setErreurs] = useState({});
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    api.get("/classes").then((res) => setClasses(res.data)).catch(() => setClasses([]));
  }, []);

  const maj = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (erreurs[name]) setErreurs((x) => ({ ...x, [name]: null }));
  };

  const classeActuelle = eleve.inscription_active?.classe;
  const classeChangee = Boolean(form.classe_id) && String(eleve.inscription_active?.classe_id || "") !== String(form.classe_id);
  const nouvelleClasse = classes.find((c) => String(c.id) === String(form.classe_id));

  const enregistrer = async (e) => {
    e.preventDefault();
    const manquants = {};
    if (!form.nom.trim()) manquants.nom = "Le nom est obligatoire.";
    if (!form.prenom.trim()) manquants.prenom = "Le prénom est obligatoire.";
    if (!form.date_naissance) manquants.date_naissance = "La date de naissance est obligatoire.";
    if (classeChangee && modeClasse === "changement" && !motif.trim()) manquants.motif = "Indiquez le motif du changement de classe.";
    setErreurs(manquants);
    if (Object.keys(manquants).length) return;

    setEnvoi(true);
    setErreur("");
    try {
      const { classe_id, ...reste } = form;
      const donnees = { ...reste, nom: form.nom.trim(), prenom: form.prenom.trim() };
      // La classe n'est envoyee que si elle change (sinon le serveur n'y touche pas).
      if (classeChangee) {
        donnees.classe_id = Number(classe_id);
        if (modeClasse === "correction") donnees.correction = true;
        else donnees.motif = motif.trim();
      }
      const res = await api.put(`/eleves/${eleve.id}`, donnees);
      onEnregistre(res.data?.message ? `Élève mis à jour · ${res.data.message.replace(/effectuee/, "effectuée")}` : "Élève mis à jour avec succès");
    } catch (err) {
      const liste = err.response?.data?.errors;
      setErreur(liste ? Object.values(liste).flat()[0] : err.response?.data?.message || "Erreur lors de l'enregistrement.");
      setEnvoi(false);
    }
  };

  const champ = (nom) => `${CHAMP} ${erreurs[nom] ? CHAMP_ERREUR : ""}`;

  return (
    <form onSubmit={enregistrer} className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border-l-4 border-[#0C447C] text-[#0C447C]">
        <GraduationCap className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <p className="font-bold">Modification de la fiche de l'élève</p>
          <p className="text-blue-800/80 mt-0.5">Les paiements et l'échéancier ne sont pas modifiés ici : ils se gèrent dans Frais de scolarité.</p>
        </div>
      </div>

      {erreur && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {erreur}
        </div>
      )}

      {/* Identite et classe */}
      <div className="bg-white p-5 sm:p-6 border border-slate-100/80 space-y-5" style={STYLE_CARTE}>
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0C447C]"><User className="w-4 h-4" /></span>
          <div>
            <h3 className="text-sm font-bold text-[#0C447C]">Identité & classe</h3>
            <p className="text-xs text-slate-500">Informations personnelles et classe d'affectation</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Libelle requis>Nom de famille</Libelle>
            <input name="nom" value={form.nom} onChange={maj} className={champ("nom")} />
            {erreurs.nom && <p className="mt-1 text-xs text-rose-600">{erreurs.nom}</p>}
          </div>
          <div>
            <Libelle requis>Prénom(s)</Libelle>
            <input name="prenom" value={form.prenom} onChange={maj} className={champ("prenom")} />
            {erreurs.prenom && <p className="mt-1 text-xs text-rose-600">{erreurs.prenom}</p>}
          </div>
          <div>
            <Libelle requis>Date de naissance</Libelle>
            <input type="date" name="date_naissance" value={form.date_naissance} onChange={maj} className={champ("date_naissance")} />
            {erreurs.date_naissance && <p className="mt-1 text-xs text-rose-600">{erreurs.date_naissance}</p>}
          </div>
          <div>
            <Libelle>Lieu de naissance</Libelle>
            <input name="lieu_naissance" value={form.lieu_naissance} onChange={maj} placeholder="Ex : Conakry" className={CHAMP} />
          </div>
          <div className="sm:col-span-2">
            <Libelle>Classe</Libelle>
            <select name="classe_id" value={form.classe_id} onChange={maj} className={CHAMP}>
              {!form.classe_id && <option value="">— Aucune classe —</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}{c.filiere ? ` · ${c.filiere}` : ""}</option>
              ))}
            </select>
          </div>
        </div>

        {classeChangee && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
            <p className="text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                L'élève passe de <strong>{classeActuelle?.nom || "aucune classe"}</strong> à <strong>{nouvelleClasse?.nom || "…"}</strong>. De quoi s'agit-il ?
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "correction", titre: "Correction de saisie", texte: "L'élève avait été inscrit dans la mauvaise classe. Rien n'est gardé dans l'historique." },
                { id: "changement", titre: "Changement de classe", texte: "L'élève change réellement de classe en cours d'année. Motif obligatoire, gardé dans l'historique." },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModeClasse(m.id)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${modeClasse === m.id ? "border-[#0C447C] bg-white ring-1 ring-[#0C447C]" : "border-amber-200 bg-white/60 hover:bg-white"}`}
                >
                  <p className="text-xs font-bold text-slate-900">{m.titre}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{m.texte}</p>
                </button>
              ))}
            </div>
            {modeClasse === "changement" && (
              <div>
                <Libelle requis>Motif du changement</Libelle>
                <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex : Réorientation en série scientifique" className={champ("motif")} />
                {erreurs.motif && <p className="mt-1 text-xs text-rose-600">{erreurs.motif}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filiation */}
      <div className="bg-white p-5 sm:p-6 border border-slate-100/80 space-y-5" style={STYLE_CARTE}>
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0C447C]"><Users className="w-4 h-4" /></span>
          <div>
            <h3 className="text-sm font-bold text-[#0C447C]">Filiation & responsables légaux</h3>
            <p className="text-xs text-slate-500">Laisser un nom vide retire ce responsable de la fiche</p>
          </div>
        </div>
        {[
          { cle: "pere", titre: "Père" },
          { cle: "mere", titre: "Mère" },
          { cle: "tuteur", titre: "Tuteur (optionnel)" },
        ].map((r) => (
          <div key={r.cle} className={`grid grid-cols-1 ${r.cle === "tuteur" ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3 p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/60`}>
            <div>
              <Libelle>{r.titre} · nom complet</Libelle>
              <input name={`${r.cle}_nom`} value={form[`${r.cle}_nom`]} onChange={maj} className={CHAMP} />
            </div>
            <div>
              <Libelle>{r.titre} · téléphone</Libelle>
              <input type="tel" name={`${r.cle}_telephone`} value={form[`${r.cle}_telephone`]} onChange={maj} placeholder="+224 6XX XX XX XX" className={CHAMP} />
            </div>
            {r.cle === "tuteur" && (
              <div>
                <Libelle>Lien de parenté</Libelle>
                <input name="tuteur_lien" value={form.tuteur_lien} onChange={maj} placeholder="Ex : Oncle, Tante…" className={CHAMP} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
        <button
          type="button"
          onClick={onAnnuler}
          disabled={envoi}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Annuler
        </button>
        <button
          type="submit"
          disabled={envoi}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#0C447C] rounded-xl hover:bg-[#1a6bb5] shadow-sm cursor-pointer disabled:opacity-50"
        >
          {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {envoi ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
