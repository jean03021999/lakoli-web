import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  GraduationCap,
  Phone,
  Printer,
  CreditCard,
  User,
  Users,
  ShieldCheck,
  FileCheck,
  Clock,
} from "lucide-react";
import { imprimerDocument } from "../../utils/impression";
import { echeancesEleve, genererReleveEleveHtml, titreReleve } from "../../utils/releveEleve";
import { BadgeStatutPaiement, BadgeInscription } from "../../components/eleves/BadgesEleve";
import { initiales } from "../../components/eleves/avatar";

// Fiche eleve (design Lakoli 2) : banniere, identite, filiation, echeancier par frais et totaux.

const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };

function formaterGNF(montant) {
  return `${Math.round(Number(montant) || 0).toLocaleString("fr-FR")} GNF`;
}

function formaterDate(valeur) {
  const m = String(valeur ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

const COULEURS_BARRE = {
  paye: "bg-[#10b981]",
  partiel: "bg-[#f59e0b]",
  en_retard: "bg-[#ef4444]",
  a_echoir: "bg-slate-300",
};

function EnTeteCarte({ icone: Icone, titre, sousTitre, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0C447C] shrink-0">
          <Icone className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#0C447C] tracking-tight">{titre}</h3>
          {sousTitre && <p className="text-xs text-slate-500">{sousTitre}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function LigneInfo({ icone: Icone, libelle, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500 flex items-center gap-2 shrink-0">
        <Icone className="w-3.5 h-3.5 text-slate-400" />
        {libelle}
      </span>
      <span className="font-bold text-slate-800 text-right min-w-0">{children}</span>
    </div>
  );
}

function BlocResponsable({ titre, personne, precision }) {
  return (
    <div className="p-3 bg-[#f8fafc] border border-slate-200/60" style={{ borderRadius: "10px" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase font-bold text-slate-500">{titre}</span>
        {precision && (
          <span className="text-[10px] font-semibold text-[#0C447C] bg-blue-50 px-1.5 rounded">{precision}</span>
        )}
      </div>
      {personne ? (
        <div className="mt-1">
          <p className="text-xs font-bold text-[#0C447C]">{personne.nom_complet}</p>
          {personne.telephone ? (
            <a href={`tel:${personne.telephone}`} className="text-xs text-slate-700 inline-flex items-center gap-1.5 mt-0.5 font-medium hover:underline">
              <Phone className="w-3 h-3 text-[#10b981]" />
              {personne.telephone}
            </a>
          ) : (
            <p className="text-[11px] italic text-slate-400 mt-0.5">Aucun numéro renseigné</p>
          )}
        </div>
      ) : (
        <p className="text-xs italic text-slate-400 mt-1">Non renseigné</p>
      )}
    </div>
  );
}

export default function EleveFiche({ permissions = [] }) {
  const peutImprimer = permissions.includes("frais.voir");
  const { id } = useParams();
  const navigate = useNavigate();
  const [eleve, setEleve] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [erreurImpression, setErreurImpression] = useState("");

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

  if (chargement) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (erreur) return <p className="text-sm text-rose-600">{erreur}</p>;
  if (!eleve) return null;

  const filiation = (type) => eleve.filiations?.find((f) => f.type_lien === type);
  const tuteur = filiation("tuteur");
  const inscription = eleve.inscription_active;
  const classe = inscription?.classe?.nom;
  const inscriptionActive = inscription?.statut === "active";

  const echeances = echeancesEleve(eleve);
  // Echeances regroupees par frais (Inscription, Scolarite...), dans l'ordre du releve.
  const groupes = [];
  echeances.forEach((ech) => {
    let g = groupes.find((x) => x.rubrique === ech.rubrique);
    if (!g) groupes.push((g = { rubrique: ech.rubrique, montant: 0, paye: 0, echeances: [] }));
    g.montant += ech.montant;
    g.paye += ech.paye;
    g.echeances.push(ech);
  });
  const totalDu = groupes.reduce((s, g) => s + g.montant, 0);
  const totalPaye = groupes.reduce((s, g) => s + g.paye, 0);
  const reste = Math.max(0, totalDu - totalPaye);

  const imprimerReleve = () => {
    setErreurImpression("");
    if (!imprimerDocument(titreReleve(eleve), genererReleveEleveHtml(eleve))) {
      setErreurImpression("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/eleves")}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0C447C] hover:text-[#1a6bb5] transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Retour au répertoire des élèves
      </button>

      {/* Banniere */}
      <div
        className="p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(12,68,124,0.18)" }}
      >
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="w-[60px] h-[60px] rounded-2xl bg-white text-[#0C447C] font-black text-xl flex items-center justify-center shadow-lg border-2 border-white/30 shrink-0">
            {initiales(eleve.nom, eleve.prenom)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                <span className="uppercase">{eleve.nom}</span> {eleve.prenom}
              </h1>
              {inscription && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    inscriptionActive ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/30" : "bg-rose-400/20 text-rose-200 border-rose-400/30"
                  }`}
                >
                  Inscription {inscriptionActive ? "active" : inscription.statut}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-white/80">
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded border border-white/15">{eleve.matricule}</span>
              {classe && (
                <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-full font-semibold border border-white/20">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {classe}
                </span>
              )}
              {inscription?.session_scolaire?.libelle && <span>{inscription.session_scolaire.libelle}</span>}
            </div>
          </div>
        </div>

        <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 flex items-center gap-3 self-start sm:self-auto">
          <div>
            <span className="text-[10px] text-white/70 block uppercase font-bold">Total encaissé</span>
            <span className="text-sm font-black tabular-nums">{formaterGNF(totalPaye)}</span>
          </div>
          <BadgeStatutPaiement statut={eleve.statut_paiement} taille="md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche : identite + filiation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 border border-slate-100/80 space-y-4" style={STYLE_CARTE}>
            <EnTeteCarte icone={User} titre="Identité & Inscription" />
            <div className="space-y-3 text-xs">
              <LigneInfo icone={GraduationCap} libelle="Classe actuelle">
                {classe ? (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#0C447C] border border-blue-200">{classe}</span>
                ) : "—"}
              </LigneInfo>
              <LigneInfo icone={Calendar} libelle="Date de naissance">
                {formaterDate(eleve.date_naissance) || <span className="italic font-normal text-slate-400">Non renseignée</span>}
              </LigneInfo>
              <LigneInfo icone={MapPin} libelle="Lieu de naissance">
                {eleve.lieu_naissance || <span className="italic font-normal text-slate-400">Non renseigné</span>}
              </LigneInfo>
              <LigneInfo icone={FileCheck} libelle="Type d'inscription">
                {inscription?.type_inscription && inscription.type_inscription !== "a_determiner" ? (
                  <BadgeInscription type={inscription.type_inscription} />
                ) : (
                  <span className="italic font-normal text-slate-400">À déterminer</span>
                )}
              </LigneInfo>
              <LigneInfo icone={ShieldCheck} libelle="Statut administratif">
                {inscription ? (
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold border ${
                      inscriptionActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {inscriptionActive ? "Active" : inscription.statut}
                  </span>
                ) : "—"}
              </LigneInfo>
            </div>
          </div>

          <div className="bg-white p-5 border border-slate-100/80 space-y-4" style={STYLE_CARTE}>
            <EnTeteCarte icone={Users} titre="Filiation & Responsables légaux" />
            <div className="space-y-3">
              <BlocResponsable titre="Père" personne={filiation("pere")} />
              <BlocResponsable titre="Mère" personne={filiation("mere")} />
              <BlocResponsable titre="Tuteur (optionnel)" personne={tuteur} precision={tuteur?.lien_avec_eleve} />
            </div>
          </div>
        </div>

        {/* Colonne droite : echeancier */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 sm:p-6 border border-slate-100/80 flex flex-col h-full gap-5" style={STYLE_CARTE}>
            <EnTeteCarte icone={CreditCard} titre="Historique des paiements & échéancier" sousTitre="Détail de chaque tranche et état d'encaissement">
              {peutImprimer && (
                <button
                  type="button"
                  onClick={imprimerReleve}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0C447C] hover:bg-[#1a6bb5] transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                  title="Imprimer le relevé de situation comptable (A4)"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Imprimer le relevé A4</span>
                </button>
              )}
            </EnTeteCarte>
            {erreurImpression && <p className="text-xs text-rose-600 -mt-2">{erreurImpression}</p>}

            {groupes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">Aucun frais enregistré</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Aucun frais n'a encore été attribué à cet élève.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupes.map((g) => (
                  <div key={g.rubrique} className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0C447C]" />
                        <h4 className="text-xs sm:text-sm font-bold text-[#0C447C]">{g.rubrique}</h4>
                      </div>
                      <span className="text-xs font-black text-slate-800 tabular-nums">{formaterGNF(g.montant)}</span>
                    </div>

                    <div className="space-y-2.5">
                      {g.echeances.map((ech) => {
                        const pourcentage = ech.montant > 0 ? Math.min(100, Math.round((ech.paye / ech.montant) * 100)) : 0;
                        return (
                          <div key={ech.id} className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800">{ech.libelle}</span>
                                {formaterDate(ech.date_limite) && (
                                  <span className="text-[10px] text-slate-400 block sm:inline sm:ml-2">Échéance : {formaterDate(ech.date_limite)}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                                <span className="font-bold text-xs text-slate-700 font-mono tabular-nums">
                                  {formaterGNF(ech.paye)} / {formaterGNF(ech.montant)}
                                </span>
                                <BadgeStatutPaiement statut={ech.statut} />
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${COULEURS_BARRE[ech.statut]}`}
                                style={{ width: `${ech.statut === "en_retard" ? 100 : pourcentage}%`, opacity: ech.statut === "en_retard" ? 0.35 : 1 }}
                              />
                            </div>
                            {ech.date_paiement && (
                              <p className="text-[10px] text-slate-400">
                                Dernier paiement le {formaterDate(ech.date_paiement)}
                                {ech.moyen && ` · ${ech.moyen}`}
                                {ech.reference && <span className="font-mono"> · {ech.reference}</span>}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto grid grid-cols-3 gap-3 bg-[#f0f4f8]/70 p-4 rounded-xl border border-slate-200/80 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total dû</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 tabular-nums">{formaterGNF(totalDu)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total payé</span>
                <span className="text-sm sm:text-base font-black text-[#10b981] tabular-nums">{formaterGNF(totalPaye)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Reste à payer</span>
                <span className={`text-sm sm:text-base font-black tabular-nums ${reste === 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                  {formaterGNF(reste)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
