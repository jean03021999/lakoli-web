import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Copy, CheckCircle2, Users, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import api from "../../../services/api";
import { formaterGNF } from "../configFrais";
import FicheTarifaireForm from "./FicheTarifaireForm";
import { CYCLES, cycleDeClasse, LIBELLES_MODE, total } from "./outilsFiche";

// Fiches tarifaires de la session active (GET /frais/fiches) : cartes des fiches, classes encore
// sans fiche, et formulaire de creation / modification.
export default function FichesTarifaires({ classes, peutCreer, onMessage, onModifiees }) {
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState("");
  const [edition, setEdition] = useState(null); // { initiale } quand le formulaire est ouvert

  const charger = async () => {
    try {
      const res = await api.get("/frais/fiches");
      setDonnees(res.data);
      setErreur("");
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible de charger les fiches tarifaires.");
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const fiches = donnees?.fiches || [];
  const session = donnees?.session?.libelle || "";
  const tarifsSansFiche = donnees?.tarifs_sans_fiche || {};

  const nomsClasses = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.nom])), [classes]);
  const couvertes = useMemo(() => new Set(fiches.flatMap((f) => f.classes_ids)), [fiches]);
  const sansFiche = classes.filter((c) => !couvertes.has(c.id));
  const sansAucunTarif = sansFiche.filter((c) => !tarifsSansFiche[c.id]?.echeances?.length);
  const sansFicheParCycle = CYCLES.map((cy) => ({ ...cy, classes: sansFiche.filter((c) => cycleDeClasse(c) === cy.id) })).filter((cy) => cy.classes.length > 0);

  // Nouvelle fiche pour des classes sans fiche : montants repris des tarifs actuels de la premiere
  // qui en a (grilles creees avant les fiches), pour ne rien ressaisir.
  const creerPour = (ids) => {
    const source = ids.find((id) => tarifsSansFiche[id]?.echeances?.length);
    const t = source ? tarifsSansFiche[source] : null;
    setEdition({
      initiale: t
        ? {
            nom: "",
            classes_ids: ids,
            frais_inscription: t.frais_inscription,
            frais_reinscription: t.frais_reinscription,
            mode_paiement: t.echeances.length === 3 ? "trimestre" : "personnalise",
            mode_saisie: "echeance",
            echeances: t.echeances,
            autres_frais: [],
            origine: nomsClasses[source],
          }
        : { classes_ids: ids, nom: "", mode_paiement: "trimestre", mode_saisie: "echeance", echeances: [], autres_frais: [] },
    });
  };

  if (edition) {
    return (
      <div className="space-y-4">
        {edition.initiale?.origine && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#0C447C]">
            Montants repris des tarifs actuels de <strong>{edition.initiale.origine}</strong>. Vérifiez-les : à l'enregistrement, ils s'appliquent à toutes les classes cochées.
          </div>
        )}
        <FicheTarifaireForm
          initiale={edition.initiale}
          fiches={fiches}
          classes={classes}
          session={session}
          onAnnuler={() => setEdition(null)}
          onEnregistree={async (message) => {
            setEdition(null);
            onMessage("succes", message);
            await Promise.all([charger(), onModifiees()]);
          }}
        />
      </div>
    );
  }

  if (!donnees) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-sm text-slate-500">
        {erreur || (
          <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement des fiches tarifaires…</span>
        )}
      </div>
    );
  }

  if (!donnees.session) {
    return <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-sm text-slate-600">Aucune année scolaire active : activez-la dans Paramètres › Session scolaire.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Fiches tarifaires — Session {session}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0C447C] text-xs font-bold">
              {fiches.length} configurée{fiches.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Une seule fiche par groupe de classes : inscription, réinscription, échéancier de scolarité et autres frais.</p>
        </div>
        {peutCreer && (
          <button type="button" onClick={() => setEdition({ initiale: null })} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0C447C] hover:bg-[#0a3866] text-white text-xs font-bold cursor-pointer shrink-0">
            <Plus className="w-4 h-4 stroke-[3]" /> Nouvelle fiche
          </button>
        )}
      </div>

      {fiches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {fiches.map((f) => {
            const scolarite = total(f.echeances);
            const libelleMode = f.mode_paiement === "mois" ? `${f.echeances.length} mensualités` : f.mode_paiement === "trimestre" ? `${f.echeances.length} trimestres` : `${f.echeances.length} échéances`;
            const payes = f.eleves_ayant_paye > 0;
            return (
              <div key={f.id} className={`rounded-2xl border bg-white flex flex-col justify-between overflow-hidden ${payes ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200/90"}`}>
                <div>
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{f.nom}</h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{LIBELLES_MODE[f.mode_paiement]}</span>
                    </div>
                    {payes ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200 mb-3">
                        <Users className="w-3.5 h-3.5 text-amber-700" /> {f.eleves_ayant_paye} élève{f.eleves_ayant_paye > 1 ? "s ont" : " a"} déjà payé
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 mb-3">Aucun paiement enregistré pour l'instant</div>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Classes couvertes ({f.classes_ids.length})</span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {f.classes_ids.map((id) => (
                        <span key={id} className="text-[11px] font-medium bg-blue-50/80 text-[#0C447C] px-2 py-0.5 rounded border border-blue-100">{nomsClasses[id] || `Classe ${id}`}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 bg-slate-50/40 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between"><span className="text-slate-600">Inscription (nouveau) :</span><span className="font-bold text-slate-900 tabular-nums">{formaterGNF(f.frais_inscription)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-600">Réinscription (ancien) :</span><span className="font-bold text-slate-900 tabular-nums">{formaterGNF(f.frais_reinscription)}</span></div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-800">Scolarité annuelle :</span>
                      <div className="text-right">
                        <div className="font-extrabold text-[#0C447C] text-sm tabular-nums">{formaterGNF(scolarite)}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{libelleMode}</div>
                      </div>
                    </div>
                    {f.autres_frais.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                        <span>Autres frais ({f.autres_frais.length}) :</span>
                        <span className="font-semibold text-slate-700 text-right">{f.autres_frais.map((a) => a.libelle).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
                {peutCreer && (
                  <div className="p-3 bg-white border-t border-slate-100 grid grid-cols-2 gap-1 text-[11px]">
                    <button type="button" onClick={() => setEdition({ initiale: f })} className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-slate-700 hover:text-[#0C447C] hover:bg-blue-50 font-semibold cursor-pointer" title="Modifier les montants, classes ou échéances">
                      <Pencil className="w-3.5 h-3.5" /> Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setEdition({ initiale: { ...f, id: undefined, nom: `${f.nom} (copie)`, classes_ids: [], eleves_ayant_paye: 0 } })}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-slate-700 hover:text-[#0C447C] hover:bg-blue-50 font-semibold cursor-pointer"
                      title="Créer une fiche identique pour d'autres classes"
                    >
                      <Copy className="w-3.5 h-3.5" /> Dupliquer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={`rounded-2xl border-2 p-6 ${sansFiche.length ? "border-amber-300 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/50"}`}>
        {sansFiche.length === 0 ? (
          <div className="py-2 text-center text-xs text-emerald-700 font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Toutes les classes de l'établissement ont une fiche tarifaire.
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-amber-200">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0"><ShieldAlert className="w-5 h-5" /></span>
                <div>
                  <h3 className="text-base font-extrabold text-amber-950">Classes sans fiche tarifaire ({sansFiche.length})</h3>
                  <p className="text-xs text-amber-900 font-medium mt-0.5">
                    {sansAucunTarif.length > 0 && `${sansAucunTarif.length} sans aucun tarif : leurs inscriptions sont impossibles. `}
                    {sansFiche.length > sansAucunTarif.length && "Les autres gardent leurs tarifs actuels ; créez-leur une fiche, leurs montants sont repris."}
                  </p>
                </div>
              </div>
              {peutCreer && (
                <button type="button" onClick={() => creerPour(sansFiche.map((c) => c.id))} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shrink-0">
                  <Plus className="w-4 h-4 stroke-[3]" /> Créer une fiche pour ces classes
                </button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {sansFicheParCycle.map((cy) => (
                <div key={cy.id} className="bg-white/80 p-3.5 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950 mb-2">
                    <span>{cy.nom}</span>
                    <span className="text-[11px] text-amber-700">{cy.classes.length} classe{cy.classes.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-1">
                    {cy.classes.map((c) => {
                      const aTarif = tarifsSansFiche[c.id]?.echeances?.length > 0;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={!peutCreer}
                          onClick={() => creerPour([c.id])}
                          title={`Créer une fiche pour ${c.nom}`}
                          className="w-full text-left p-1.5 rounded-lg bg-amber-100/50 hover:bg-amber-200/80 text-[11px] text-amber-950 font-medium flex items-center justify-between gap-2 group cursor-pointer disabled:cursor-default"
                        >
                          <span className="truncate">{c.nom}</span>
                          <span className="flex items-center gap-1 shrink-0">
                            <span className={`text-[10px] px-1.5 rounded ${aTarif ? "bg-white text-slate-600" : "bg-rose-100 text-rose-700"}`}>{aTarif ? "tarifs actuels" : "aucun tarif"}</span>
                            <ArrowRight className="w-3 h-3 text-amber-600 opacity-0 group-hover:opacity-100" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {peutCreer && <p className="mt-3 text-[11px] text-amber-800 italic">Astuce : cliquez sur une classe pour ouvrir le formulaire pré-rempli pour elle.</p>}
          </>
        )}
      </div>
    </div>
  );
}
