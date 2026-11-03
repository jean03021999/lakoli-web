import { useState } from "react";
import { ArrowLeft, AlertTriangle, FileSpreadsheet } from "lucide-react";
import api from "../../../services/api";
import SelecteurClasses from "./SelecteurClasses";
import BlocFraisEntree from "./BlocFraisEntree";
import BlocScolarite from "./BlocScolarite";
import BlocAutresFrais from "./BlocAutresFrais";
import RecapitulatifFiche from "./RecapitulatifFiche";
import ModalConfirmationModif from "./ModalConfirmationModif";
import { MOIS_SCOLAIRES, lignesPourMode, appliquerMontants, nouvelleCle } from "./outilsFiche";

// Formulaire unique d'une fiche tarifaire : classes, frais d'entree, scolarite, autres frais.
// POST /frais/fiches (creation) ou PUT /frais/fiches/{id} ; un 409 du serveur (des eleves ont deja
// paye sur un tarif modifie) ouvre la confirmation, puis renvoie avec `confirmer`.

function etatInitial(initiale, session) {
  if (!initiale) {
    const lignes = lignesPourMode("trimestre", [], session, []);
    return {
      nom: "",
      classesIds: [],
      inscription: 0,
      reinscription: 0,
      scolarite: { mode: "trimestre", mois: [], modeSaisie: "echeance", montantSaisi: 0, echeances: appliquerMontants(lignes, "echeance", 0) },
      autresFrais: [],
    };
  }
  const mode = initiale.mode_paiement || "personnalise";
  // Classe sans aucun tarif : echeancier par defaut du mode, montants a saisir.
  const source = initiale.echeances?.length ? initiale.echeances : appliquerMontants(lignesPourMode(mode, initiale.mois || [], session, []), "echeance", 0);
  const echeances = source.map((e) => ({
    cle: nouvelleCle(),
    libelle: e.libelle,
    montant: Math.round(Number(e.montant) || 0),
    date_limite: String(e.date_limite || "").slice(0, 10),
    // En mode mois, chaque ligne retrouve son mois (pour le decocher si on la retire).
    mois: mode === "mois" ? MOIS_SCOLAIRES.find((m) => m.num === Number(String(e.date_limite).slice(5, 7)))?.id : undefined,
  }));
  return {
    nom: initiale.nom || "",
    classesIds: initiale.classes_ids || [],
    inscription: Math.round(Number(initiale.frais_inscription) || 0),
    reinscription: Math.round(Number(initiale.frais_reinscription) || 0),
    scolarite: {
      mode,
      mois: initiale.mois || [],
      modeSaisie: initiale.mode_saisie || "echeance",
      montantSaisi: Math.round(Number(initiale.montant_saisi ?? echeances[0]?.montant) || 0),
      echeances,
    },
    autresFrais: (initiale.autres_frais || []).map((f) => ({ ...f, montant: Math.round(Number(f.montant) || 0), cle: nouvelleCle() })),
  };
}

const CARTE = "bg-white rounded-2xl border border-slate-200/90 p-6";

function Section({ numero, titre, sousTitre, facultatif, children }) {
  return (
    <section className={CARTE}>
      <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${facultatif ? "bg-slate-200 text-slate-700" : "bg-[#0C447C] text-white"}`}>{numero}</span>
        <div>
          <h3 className="text-base font-extrabold text-slate-900">{titre}</h3>
          <p className="text-xs text-slate-500">{sousTitre}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function FicheTarifaireForm({ initiale, fiches, classes, session, onAnnuler, onEnregistree }) {
  const enModification = Boolean(initiale?.id);
  const [etat, setEtat] = useState(() => etatInitial(initiale, session));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const maj = (modif) => setEtat((e) => ({ ...e, ...modif }));
  const { nom, classesIds, inscription, reinscription, scolarite, autresFrais } = etat;
  const echeances = scolarite.echeances;

  const manquants = [
    !nom.trim() && "Le nom de la fiche (ex. « Maternelle », « Collège »)",
    classesIds.length === 0 && "Au moins une classe",
    inscription <= 0 && "Le montant de l'inscription (nouvel élève)",
    reinscription <= 0 && "Le montant de la réinscription (ancien élève)",
    echeances.length === 0 && "Au moins une échéance de scolarité",
    echeances.some((e) => !e.montant || e.montant <= 0) && "Un montant pour chaque échéance",
    echeances.some((e) => !e.libelle.trim()) && "Un libellé pour chaque échéance",
    echeances.some((e) => !e.date_limite) && "Une date limite pour chaque échéance",
    autresFrais.some((f) => !f.libelle.trim()) && "Le libellé de chaque autre frais",
    autresFrais.some((f) => !f.montant || f.montant <= 0) && "Le montant de chaque autre frais",
  ].filter(Boolean);

  const charge = (confirmer) => ({
    nom: nom.trim(),
    classes_ids: classesIds,
    frais_inscription: inscription,
    frais_reinscription: reinscription,
    mode_paiement: scolarite.mode,
    mode_saisie: scolarite.modeSaisie,
    montant_saisi: scolarite.montantSaisi,
    mois: scolarite.mode === "mois" ? scolarite.mois : [],
    echeances: echeances.map((e) => ({ libelle: e.libelle.trim(), montant: e.montant, date_limite: e.date_limite })),
    autres_frais: autresFrais.map((f) => ({ libelle: f.libelle.trim(), montant: f.montant, obligatoire: f.obligatoire, periodicite: f.periodicite })),
    confirmer,
  });

  const enregistrer = async (confirmer = false) => {
    setEnvoi(true);
    setErreur("");
    try {
      const res = enModification ? await api.put(`/frais/fiches/${initiale.id}`, charge(confirmer)) : await api.post("/frais/fiches", charge(confirmer));
      setConfirmation(null);
      onEnregistree(res.data.message);
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 409 && d?.confirmation_requise) {
        setConfirmation({ eleves: d.eleves_ayant_paye });
      } else {
        setConfirmation(null);
        setErreur(d?.errors ? Object.values(d.errors).flat()[0] : d?.message || "Erreur lors de l'enregistrement de la fiche.");
      }
      setEnvoi(false);
    }
  };

  const nomsClasses = classes.filter((c) => classesIds.includes(c.id)).map((c) => c.nom);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onAnnuler} className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer" title="Revenir à la liste des fiches">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{enModification ? `Modifier la fiche : ${initiale.nom}` : "Nouvelle fiche tarifaire"}</h2>
              {session && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#0C447C]">Session {session}</span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Un seul formulaire pour l'inscription, la réinscription, la scolarité et les autres frais.</p>
          </div>
        </div>
        <button type="button" onClick={onAnnuler} className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 cursor-pointer">
          Annuler et fermer
        </button>
      </div>

      {enModification && initiale.eleves_ayant_paye > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500 text-amber-950 flex items-start gap-3.5">
          <span className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></span>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-sm text-amber-900">Paiements déjà perçus ({initiale.eleves_ayant_paye} élève{initiale.eleves_ayant_paye > 1 ? "s" : ""})</h4>
            <p className="leading-relaxed font-medium">
              Des élèves ont déjà payé sur cette fiche. Ils garderont leur échéancier ; si vous changez un montant ou une échéance,
              une confirmation (saisie de CONFIRMER) vous sera demandée avant l'enregistrement.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8 min-w-0">
          <div className={CARTE}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0C447C] flex items-center justify-center"><FileSpreadsheet className="w-4 h-4" /></span>
              <label htmlFor="nom-fiche" className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Nom de la fiche tarifaire *</label>
            </div>
            <input
              id="nom-fiche"
              value={nom}
              onChange={(e) => maj({ nom: e.target.value })}
              maxLength={100}
              placeholder="Ex. Maternelle, Primaire 1, Collège, Lycée…"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#0C447C] focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-2">Un nom clair pour retrouver ce barème dans la liste des fiches.</p>
          </div>

          <Section numero={1} titre="Classes concernées *" sousTitre="Regroupées par cycle">
            <SelecteurClasses classes={classes} selection={classesIds} onChange={(ids) => maj({ classesIds: ids })} fiches={fiches} ficheId={initiale?.id} />
          </Section>

          <Section numero={2} titre="Frais d'entrée *" sousTitre="Payés une seule fois à la rentrée">
            <BlocFraisEntree inscription={inscription} reinscription={reinscription} onInscription={(v) => maj({ inscription: v })} onReinscription={(v) => maj({ reinscription: v })} />
          </Section>

          <Section numero={3} titre="Scolarité annuelle *" sousTitre="Cadence, mois facturés et échéancier modifiable">
            <BlocScolarite etat={scolarite} session={session} onChange={(modif) => setEtat((e) => ({ ...e, scolarite: { ...e.scolarite, ...modif } }))} />
          </Section>

          <Section numero={4} titre="Autres frais (facultatif)" sousTitre="Tenue, cantine, transport, examens…" facultatif>
            <BlocAutresFrais autresFrais={autresFrais} onChange={(liste) => maj({ autresFrais: liste })} />
          </Section>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-4">
          <RecapitulatifFiche
            session={session}
            classesNoms={nomsClasses}
            inscription={inscription}
            reinscription={reinscription}
            echeances={echeances}
            autresFrais={autresFrais}
            manquants={manquants}
            onEnregistrer={() => enregistrer(false)}
            envoi={envoi && !confirmation}
            enModification={enModification}
            elevesAyantPaye={initiale?.eleves_ayant_paye || 0}
            erreur={erreur}
          />
        </div>
      </div>

      {confirmation && (
        <ModalConfirmationModif
          nomFiche={initiale?.nom || nom}
          elevesAyantPaye={confirmation.eleves}
          avant={initiale || { frais_inscription: inscription, frais_reinscription: reinscription, echeances }}
          apres={{ frais_inscription: inscription, frais_reinscription: reinscription, echeances }}
          onConfirmer={() => enregistrer(true)}
          onAnnuler={() => setConfirmation(null)}
          envoi={envoi}
        />
      )}
    </div>
  );
}
