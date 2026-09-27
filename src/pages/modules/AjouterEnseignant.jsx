import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, User, FileText } from "lucide-react";
import BadgeContrat from "../../components/enseignants/BadgeContrat";
import { degradeEnseignant, formaterGNF, formaterDate } from "../../components/enseignants/theme";

// Nouveau dossier enseignant en 3 etapes (design "Gestion des enseignants") : identite, contrat,
// confirmation. Envoie POST /enseignants ; le matricule est genere par le serveur.

const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(226,232,240,0.7)" };
const ETAPES = ["Identité", "Contrat", "Confirmation"];

const CONTRATS = [
  { type: "cdi", titre: "Durée indéterminée", texte: "Enseignant permanent, salaire mensuel fixe." },
  { type: "cdd", titre: "Durée déterminée", texte: "Contrat à échéance, avec date de fin prévue." },
  { type: "vacataire", titre: "Vacation", texte: "Intervenant ponctuel, rémunéré à la mission." },
];

const CHAMP = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:bg-white transition-all";

function Champ({ libelle, requis, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {libelle} {requis && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AjouterEnseignant() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(0);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [heuresSup, setHeuresSup] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", date_naissance: "", lieu_naissance: "", diplome: "", telephone: "", email: "",
    type_contrat: "cdi", date_debut_contrat: "", date_fin_contrat: "", salaire_base: "", taux_horaire_heures_sup: "",
  });

  const maj = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const initiales = `${form.prenom[0] || ""}${form.nom[0] || ""}`.toUpperCase() || "?";
  const degrade = degradeEnseignant(`${form.nom}${form.prenom}`);

  const validerEtape = (n) => {
    if (n === 0) {
      if (!form.nom.trim() || !form.prenom.trim() || !form.date_naissance) return "Le nom, le prénom et la date de naissance sont obligatoires.";
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "L'adresse e-mail n'est pas valide.";
    }
    if (n === 1) {
      if (!form.date_debut_contrat || !form.salaire_base) return "La date de début et le salaire de base sont obligatoires.";
      if (Number(form.salaire_base) < 0) return "Le salaire de base ne peut pas être négatif.";
      if (form.date_fin_contrat && form.date_fin_contrat < form.date_debut_contrat) return "La date de fin doit être postérieure à la date de début.";
      if (heuresSup && !form.taux_horaire_heures_sup) return "Indiquez le taux horaire des heures supplémentaires.";
    }
    return "";
  };

  const allerA = (n) => {
    for (let i = 0; i < n; i++) {
      const msg = validerEtape(i);
      if (msg) {
        setErreur(msg);
        setEtape(i);
        return;
      }
    }
    setErreur("");
    setEtape(n);
  };

  const enregistrer = async () => {
    setErreur("");
    setChargement(true);
    try {
      const res = await api.post("/enseignants", {
        ...form,
        date_fin_contrat: form.type_contrat === "cdi" ? null : form.date_fin_contrat || null,
        taux_horaire_heures_sup: heuresSup ? form.taux_horaire_heures_sup : null,
      });
      navigate(res.data?.id ? `/enseignants/${res.data.id}` : "/enseignants");
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement de l'enseignant.");
    } finally {
      setChargement(false);
    }
  };

  const recap = [
    ["Régime du contrat", <BadgeContrat key="c" type={form.type_contrat} taille="sm" />],
    ["Date de prise d'effet", formaterDate(form.date_debut_contrat) || "—"],
    ...(form.type_contrat !== "cdi" ? [["Date de fin prévue", formaterDate(form.date_fin_contrat) || "Non précisée"]] : []),
    ["Salaire de base", formaterGNF(form.salaire_base)],
    ["Heures supplémentaires", heuresSup ? `${formaterGNF(form.taux_horaire_heures_sup)} / h` : "Non prévues"],
    ["Date et lieu de naissance", `${formaterDate(form.date_naissance) || "—"}${form.lieu_naissance ? ` à ${form.lieu_naissance}` : ""}`],
    ["Diplôme", form.diplome || "—"],
    ["E-mail", form.email || "—"],
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate("/enseignants")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Annuler et retourner à la liste
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nouveau dossier enseignant</h1>
        <p className="text-sm text-slate-500">Enregistrement dans le corps enseignant de l'établissement</p>
      </div>

      {/* Etapes */}
      <div className="bg-white p-4" style={STYLE_CARTE}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {ETAPES.map((nom, i) => (
            <div key={nom} className={`flex items-center ${i < ETAPES.length - 1 ? "flex-1" : ""}`}>
              <button
                type="button"
                onClick={() => (i < etape ? setEtape(i) : allerA(i))}
                className={`flex items-center gap-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  etape === i ? "text-[#0C447C]" : etape > i ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                    etape === i ? "bg-[#0C447C] text-white shadow-sm" : etape > i ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {etape > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{nom}</span>
              </button>
              {i < ETAPES.length - 1 && <div className={`flex-1 h-0.5 mx-3 sm:mx-4 ${etape > i ? "bg-emerald-500" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Etape 1 : identite */}
      {etape === 0 && (
        <div className="bg-white p-6 space-y-6" style={STYLE_CARTE}>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#0C447C] flex items-center justify-center"><User className="w-5 h-5" /></span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Identité de l'enseignant</h2>
              <p className="text-xs text-slate-500">Informations personnelles et coordonnées</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0" style={{ background: degrade }}>
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 truncate">{`${form.prenom} ${form.nom}`.trim() || "Nouvel enseignant"}</p>
              <p className="text-xs text-slate-500">Le matricule sera attribué automatiquement à l'enregistrement.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Champ libelle="Nom" requis><input name="nom" value={form.nom} onChange={maj} placeholder="ex : Diallo" className={CHAMP} /></Champ>
            <Champ libelle="Prénom(s)" requis><input name="prenom" value={form.prenom} onChange={maj} placeholder="ex : Mamadou" className={CHAMP} /></Champ>
            <Champ libelle="Date de naissance" requis><input type="date" name="date_naissance" value={form.date_naissance} onChange={maj} className={CHAMP} /></Champ>
            <Champ libelle="Lieu de naissance"><input name="lieu_naissance" value={form.lieu_naissance} onChange={maj} placeholder="ex : Conakry, Kindia, Labé..." className={CHAMP} /></Champ>
            <Champ libelle="Téléphone"><input name="telephone" value={form.telephone} onChange={maj} placeholder="+224 62X XX XX XX" className={CHAMP} /></Champ>
            <Champ libelle="E-mail"><input type="email" name="email" value={form.email} onChange={maj} placeholder="nom@exemple.com" className={CHAMP} /></Champ>
            <div className="md:col-span-2">
              <Champ libelle="Diplôme / spécialité"><input name="diplome" value={form.diplome} onChange={maj} placeholder="ex : Licence en mathématiques" className={CHAMP} /></Champ>
            </div>
          </div>
        </div>
      )}

      {/* Etape 2 : contrat */}
      {etape === 1 && (
        <div className="bg-white p-6 space-y-6" style={STYLE_CARTE}>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><FileText className="w-5 h-5" /></span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Contrat de travail</h2>
              <p className="text-xs text-slate-500">Régime, dates et rémunération</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Régime du contrat <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONTRATS.map((c) => {
                const choisi = form.type_contrat === c.type;
                return (
                  <button
                    type="button"
                    key={c.type}
                    onClick={() => setForm({ ...form, type_contrat: c.type })}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      choisi ? "border-[#0C447C] bg-blue-50/60 shadow-xs" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <BadgeContrat type={c.type} taille="sm" />
                      {choisi && <CheckCircle2 className="w-4 h-4 text-[#0C447C]" />}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.titre}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">{c.texte}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Champ libelle="Date de début" requis><input type="date" name="date_debut_contrat" value={form.date_debut_contrat} onChange={maj} className={CHAMP} /></Champ>
            {form.type_contrat !== "cdi" ? (
              <Champ libelle="Date de fin prévue"><input type="date" name="date_fin_contrat" value={form.date_fin_contrat} onChange={maj} className={CHAMP} /></Champ>
            ) : (
              <div />
            )}
            <Champ libelle="Salaire de base mensuel (GNF)" requis>
              <input type="number" min="0" name="salaire_base" value={form.salaire_base} onChange={maj} placeholder="ex : 2 500 000" className={CHAMP} />
            </Champ>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input type="checkbox" checked={heuresSup} onChange={(e) => setHeuresSup(e.target.checked)} className="accent-[#0C447C] w-4 h-4" />
              Heures supplémentaires rémunérées
            </label>
            {heuresSup && (
              <Champ libelle="Taux horaire des heures supplémentaires (GNF)" requis>
                <input type="number" min="0" name="taux_horaire_heures_sup" value={form.taux_horaire_heures_sup} onChange={maj} placeholder="ex : 25 000" className={CHAMP} />
              </Champ>
            )}
          </div>
        </div>
      )}

      {/* Etape 3 : confirmation */}
      {etape === 2 && (
        <div className="bg-white p-6 space-y-6" style={STYLE_CARTE}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Vérification du dossier</h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Prêt pour l'enregistrement</span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0" style={{ background: degrade }}>
                {initiales}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-extrabold text-slate-900">{form.prenom} {form.nom}</h3>
                  <BadgeContrat type={form.type_contrat} taille="sm" />
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{form.telephone ? `Tél : ${form.telephone}` : "Téléphone non renseigné"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-200">
              {recap.map(([libelle, valeur]) => (
                <div key={libelle}>
                  <span className="text-slate-500 block">{libelle}</span>
                  <span className="font-bold text-slate-800">{valeur}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-slate-700 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0C447C] shrink-0 mt-0.5" />
            <p>
              L'enregistrement crée le dossier de l'enseignant et son contrat actif, et lui attribue automatiquement un matricule. Les classes et matières
              s'ajoutent ensuite depuis le module Affectations.
            </p>
          </div>
        </div>
      )}

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

      <div className="flex items-center justify-between">
        {etape > 0 ? (
          <button
            type="button"
            onClick={() => setEtape(etape - 1)}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {etape === 2 ? "Modifier les informations" : "Précédent"}
          </button>
        ) : (
          <span />
        )}
        {etape < 2 ? (
          <button
            type="button"
            onClick={() => allerA(etape + 1)}
            className="px-6 py-2.5 bg-[#0C447C] hover:bg-[#1a6bb5] text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={enregistrer}
            disabled={chargement}
            className="px-8 py-3 bg-[#0C447C] hover:bg-[#1a6bb5] text-white rounded-xl text-sm font-extrabold transition-all shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-5 h-5" />
            {chargement ? "Enregistrement..." : "Enregistrer l'enseignant"}
          </button>
        )}
      </div>
    </div>
  );
}
