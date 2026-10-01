import { useEffect, useMemo, useState } from "react";
import { Search, Printer, MessageCircle, Phone, CheckCheck, X, AlertTriangle, Clock, BellRing, Users, Loader2, History } from "lucide-react";
import api from "../../services/api";
import { STYLE_CARTE, formaterGNF, formaterDateCourte, normaliser, telechargerCsv } from "../../components/frais/configFrais";
import { messageErreurApi } from "../../utils/erreurs";
import { imprimerDocument, genererLettresRelanceHtml, formaterDate, civiliteParent, formaterTelephone } from "../../utils/impression";
import { completerEtablissement } from "../../utils/etablissementCourant";

// Relances des impayes (GET /frais/relances) : familles en retard et echeances proches, contacts
// des parents, message WhatsApp / SMS pret a envoyer, lettres imprimables et suivi des relances.

const CANAUX = { lettre: "Lettre", whatsapp: "WhatsApp", sms: "SMS", appel: "Appel" };
const LIENS = { pere: "Père", mere: "Mère", tuteur: "Tuteur" };

// Numero guineen au format international pour WhatsApp (620 00 00 00 -> 224620000000).
function numeroInternational(telephone) {
  let n = String(telephone || "").replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  if (n.length === 9 && n.startsWith("6")) n = `224${n}`;
  return n.length >= 11 ? n : "";
}

// Message WhatsApp / SMS, courtois, adresse au parent contacte (Monsieur / Madame selon le lien).
function messageRelance(ligne, contact, etablissement) {
  const ecole = completerEtablissement(etablissement);
  const nomEcole = ecole.nom || "L'établissement";
  const civ = civiliteParent(contact);
  const montant = formaterGNF(ligne.montant_du);
  const enfant = `${ligne.prenom} ${ligne.nom}`;
  const lignes = [`Bonjour ${civ.salutation},`, "", "Nous espérons que vous vous portez bien.", ""];
  if (ligne.motif === "retard") {
    lignes.push(
      `Nous nous permettons de vous informer respectueusement que, sauf erreur de notre part, la scolarité de votre enfant ${enfant} (${ligne.classe || ""}) présente un reste à payer de ${montant} depuis le ${formaterDate(ligne.date_limite)} (${ligne.echeance}).`,
      "",
      "Nous vous serions très reconnaissants de bien vouloir passer à la caisse de l'établissement afin de régulariser cette situation dès que possible. En cas de difficulté, n'hésitez pas à nous contacter : nous restons à votre écoute."
    );
  } else {
    lignes.push(
      `Nous nous permettons de vous rappeler respectueusement que l'échéance « ${ligne.echeance} » de la scolarité de votre enfant ${enfant} (${ligne.classe || ""}), d'un montant de ${montant}, arrive à terme le ${formaterDate(ligne.date_limite)}.`,
      "",
      "Nous vous serions reconnaissants de bien vouloir effectuer ce règlement à la caisse de l'établissement avant cette date."
    );
  }
  lignes.push(
    "",
    "Si le paiement a déjà été effectué, veuillez ne pas tenir compte de ce message, avec nos remerciements.",
    ...(ecole.whatsapp_relance ? ["", `Pour toute question, vous pouvez nous écrire ou nous appeler sur ce numéro WhatsApp : ${formaterTelephone(ecole.whatsapp_relance)}.`] : []),
    "",
    "Avec nos salutations respectueuses,",
    `Le service de comptabilité — ${nomEcole}`,
    ...(ecole.telephone ? [`Tél. ${formaterTelephone(ecole.telephone)}`] : [])
  );
  return lignes.join("\n");
}

export default function Relances({ etablissement = null, permissions = [] }) {
  const peutRelancer = permissions.includes("frais.paiement.enregistrer");
  const [donnees, setDonnees] = useState({ lignes: [], relances_7_jours: 0 });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [onglet, setOnglet] = useState("retard");
  const [horizon, setHorizon] = useState(15);
  const [recherche, setRecherche] = useState("");
  const [classe, setClasse] = useState("toutes");
  const [nonRelances, setNonRelances] = useState(false);
  const [selection, setSelection] = useState(() => new Set());
  const [envoi, setEnvoi] = useState(false);
  const [rechargement, setRechargement] = useState(0);
  const [historique, setHistorique] = useState(null); // { ligne, relances }
  const [toutesClasses, setToutesClasses] = useState([]);

  // Toutes les classes de l'etablissement (ordre pedagogique), meme sans famille a relancer.
  useEffect(() => {
    api.get("/classes").then((res) => setToutesClasses(res.data)).catch(() => setToutesClasses([]));
  }, []);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    api.get("/frais/relances", { params: { horizon } })
      .then((res) => {
        if (annule) return;
        setDonnees(res.data);
        setErreur("");
        // Premier affichage : l'onglet qui a du contenu.
        setOnglet((o) => (o === "retard" && !res.data.lignes.some((l) => l.motif === "retard") && res.data.lignes.some((l) => l.motif === "rappel") ? "rappel" : o));
      })
      .catch((err) => { if (!annule) setErreur(messageErreurApi(err, "Impossible de charger les relances.")); })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, [horizon, rechargement]);

  const lignes = donnees.lignes;
  const enRetard = lignes.filter((l) => l.motif === "retard");
  const rappels = lignes.filter((l) => l.motif === "rappel");
  // Nombre de familles de l'onglet courant par classe (affiche dans le menu des classes).
  const parClasse = useMemo(() => {
    const n = {};
    lignes.filter((l) => l.motif === onglet).forEach((l) => { n[l.classe_id] = (n[l.classe_id] || 0) + 1; });
    return n;
  }, [lignes, onglet]);
  const ilYASeptJours = Date.now() - 7 * 86400000;

  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const affichees = useMemo(
    () =>
      lignes.filter((l) => {
        if (l.motif !== onglet) return false;
        if (classe !== "toutes" && String(l.classe_id) !== classe) return false;
        if (nonRelances && l.derniere_relance && new Date(l.derniere_relance.date.replace(" ", "T")).getTime() > ilYASeptJours) return false;
        const cible = normaliser(`${l.nom} ${l.prenom} ${l.matricule} ${l.classe || ""} ${l.contacts.map((c) => `${c.nom} ${c.telephone}`).join(" ")}`);
        return termes.every((t) => cible.includes(t));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lignes, onglet, classe, nonRelances, recherche]
  );
  const choisies = affichees.filter((l) => selection.has(l.eleve_id));
  const toutCoche = affichees.length > 0 && choisies.length === affichees.length;

  const basculer = (id) => setSelection((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const basculerTout = () => setSelection(toutCoche ? new Set() : new Set(affichees.map((l) => l.eleve_id)));

  const enregistrer = async (liste, canal) => {
    if (!peutRelancer || liste.length === 0) return;
    setEnvoi(true);
    try {
      const res = await api.post("/frais/relances", {
        canal,
        relances: liste.map((l) => ({ eleve_id: l.eleve_id, montant_du: l.montant_du, motif: l.motif })),
      });
      setMessage(res.data.message);
      setSelection(new Set());
      setRechargement((n) => n + 1);
    } catch (err) {
      setErreur(messageErreurApi(err, "Enregistrement de la relance impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  const imprimerLettres = (liste) => {
    const html = genererLettresRelanceHtml({ etablissement: etablissement?.nom, lignes: liste });
    if (!imprimerDocument(liste.length > 1 ? `Lettres de relance (${liste.length})` : `Relance ${liste[0].prenom} ${liste[0].nom}`, html)) {
      setErreur("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
      return;
    }
    enregistrer(liste, "lettre");
  };

  const whatsapp = (ligne, contact) => {
    const numero = numeroInternational(contact?.telephone);
    if (!numero) {
      setErreur("Numéro de téléphone du parent manquant ou invalide.");
      return;
    }
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(messageRelance(ligne, contact, etablissement?.nom))}`, "_blank", "noopener");
    enregistrer([ligne], "whatsapp");
  };

  const voirHistorique = async (ligne) => {
    setHistorique({ ligne, relances: null });
    try {
      const res = await api.get(`/frais/relances/eleve/${ligne.eleve_id}`);
      setHistorique({ ligne, relances: res.data });
    } catch {
      setHistorique({ ligne, relances: [] });
    }
  };

  const exporter = () =>
    telechargerCsv(
      `relances-${onglet}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Élève", "Matricule", "Classe", "Échéance", "Date limite", "Montant dû (GNF)", "Reste année (GNF)", "Parent", "Téléphone", "Relances", "Dernière relance"],
      affichees.map((l) => [
        `${l.prenom} ${l.nom}`, l.matricule, l.classe || "", l.echeance || "", formaterDateCourte(l.date_limite), Math.round(l.montant_du), Math.round(l.reste_annee),
        l.contacts[0]?.nom || "", l.contacts[0]?.telephone || "", l.nombre_relances,
        l.derniere_relance ? `${formaterDateCourte(l.derniere_relance.date)} (${CANAUX[l.derniere_relance.canal]})` : "",
      ])
    );

  const somme = (l) => l.reduce((t, x) => t + x.montant_du, 0);
  const cartes = [
    { libelle: "Familles en retard", valeur: enRetard.length, detail: `${formaterGNF(somme(enRetard))} échus`, icone: AlertTriangle, couleur: "text-rose-600", fond: "bg-rose-50", bord: "border-rose-100" },
    { libelle: "Montant échu impayé", valeur: formaterGNF(somme(enRetard)), detail: "Échéances dépassées", icone: BellRing, couleur: "text-amber-700", fond: "bg-amber-50", bord: "border-amber-100" },
    { libelle: `Échéances sous ${horizon} jours`, valeur: rappels.length, detail: `${formaterGNF(somme(rappels))} à encaisser`, icone: Clock, couleur: "text-[#0C447C]", fond: "bg-blue-50", bord: "border-blue-100" },
    { libelle: "Relances (7 jours)", valeur: donnees.relances_7_jours, detail: "Lettres, messages et appels", icone: CheckCheck, couleur: "text-emerald-600", fond: "bg-emerald-50", bord: "border-emerald-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs" style={{ background: "#0C447C" }}>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Relances des impayés</h1>
          <p className="text-xs text-white/80 mt-0.5">Familles en retard et échéances proches · Lettres, WhatsApp et suivi des relances</p>
        </div>
        <button onClick={exporter} disabled={affichees.length === 0} className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 cursor-pointer disabled:opacity-50">
          Exporter Excel
        </button>
      </div>

      {message && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {message}
          <button onClick={() => setMessage("")} className="text-emerald-500 cursor-pointer" aria-label="Fermer"><X className="w-4 h-4" /></button>
        </div>
      )}
      {erreur && (
        <div className="flex items-center justify-between gap-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
          {erreur}
          <button onClick={() => setErreur("")} className="text-rose-400 cursor-pointer" aria-label="Fermer"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {cartes.map((c) => {
          const Icone = c.icone;
          return (
            <div key={c.libelle} className={`bg-white p-4 border ${c.bord}`} style={STYLE_CARTE}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${c.couleur}`}>{c.libelle}</span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.fond} ${c.couleur}`}><Icone className="w-4 h-4" /></span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">{chargement ? "…" : c.valeur}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{c.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/60 rounded-xl w-fit">
        {[["retard", `En retard (${enRetard.length})`], ["rappel", `Échéances proches (${rappels.length})`]].map(([cle, lib]) => (
          <button key={cle} onClick={() => { setOnglet(cle); setSelection(new Set()); }} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${onglet === cle ? "bg-white text-[#0C447C] shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>{lib}</button>
        ))}
      </div>

      <div className="bg-white p-4 flex flex-wrap items-center justify-between gap-3 border border-slate-100" style={STYLE_CARTE}>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Élève, matricule, parent, téléphone…" className="w-64 bg-slate-50 border border-slate-200 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-[#0C447C]" />
          </div>
          <select value={classe} onChange={(e) => setClasse(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none">
            <option value="toutes">Toutes les classes</option>
            {toutesClasses.map((c) => <option key={c.id} value={String(c.id)}>{c.nom} ({parClasse[c.id] || 0})</option>)}
          </select>
          {onglet === "rappel" && (
            <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-2.5 py-2 text-slate-700 focus:outline-none">
              {[7, 15, 30, 60].map((h) => <option key={h} value={h}>Échéance dans {h} jours</option>)}
            </select>
          )}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
            <input type="checkbox" checked={nonRelances} onChange={(e) => setNonRelances(e.target.checked)} className="accent-[#0C447C]" />
            Pas relancées depuis 7 jours
          </label>
        </div>
        {peutRelancer && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{choisies.length} sélectionnée{choisies.length > 1 ? "s" : ""}</span>
            <button onClick={() => imprimerLettres(choisies)} disabled={envoi || choisies.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0C447C] hover:bg-[#093663] text-white text-xs font-bold cursor-pointer disabled:opacity-40">
              <Printer className="w-3.5 h-3.5" /> Imprimer les lettres
            </button>
            <button onClick={() => enregistrer(choisies, "appel")} disabled={envoi || choisies.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-40" title="Noter que ces familles ont été appelées">
              <Phone className="w-3.5 h-3.5" /> Marquer appelées
            </button>
          </div>
        )}
      </div>

      <div className="bg-white overflow-hidden border border-slate-100" style={STYLE_CARTE}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {peutRelancer && <th className="py-3 pl-4 w-8"><input type="checkbox" checked={toutCoche} onChange={basculerTout} className="accent-[#0C447C]" aria-label="Tout sélectionner" /></th>}
                <th className="py-3 px-4">Élève</th>
                <th className="py-3 px-3">Échéance</th>
                <th className="py-3 px-3 text-right">Montant dû</th>
                <th className="py-3 px-3">Parent à contacter</th>
                <th className="py-3 px-3">Dernière relance</th>
                <th className="py-3 px-4 text-right">Relancer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {chargement ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline" /> Calcul des impayés…</td></tr>
              ) : affichees.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                  {classe !== "toutes" && !parClasse[classe]
                    ? `Aucune famille de cette classe ${onglet === "retard" ? "en retard de paiement" : `avec une échéance dans les ${horizon} prochains jours`}.`
                    : onglet === "retard" ? (enRetard.length === 0 ? "Aucune famille en retard de paiement. 🎉" : "Aucune famille ne correspond aux filtres.") : (rappels.length === 0 ? `Aucune échéance à venir dans les ${horizon} prochains jours.` : "Aucune famille ne correspond aux filtres.")}
                </td></tr>
              ) : (
                affichees.map((l) => {
                  const parent = l.contacts[0];
                  return (
                    <tr key={l.eleve_id} className={selection.has(l.eleve_id) ? "bg-blue-50/50" : "hover:bg-slate-50/70"}>
                      {peutRelancer && <td className="py-3 pl-4"><input type="checkbox" checked={selection.has(l.eleve_id)} onChange={() => basculer(l.eleve_id)} className="accent-[#0C447C]" aria-label={`Sélectionner ${l.prenom} ${l.nom}`} /></td>}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{l.prenom} {l.nom}</p>
                        <p className="text-[10px] text-slate-400">{l.matricule} · {l.classe || "—"}</p>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-700">{l.echeance}{l.nombre_echeances > 1 ? ` +${l.nombre_echeances - 1}` : ""}</p>
                        <p className={`text-[10px] font-bold ${l.motif === "retard" ? "text-rose-600" : "text-[#0C447C]"}`}>
                          {formaterDateCourte(l.date_limite)} · {l.jours < 0 ? `retard de ${-l.jours} j` : l.jours === 0 ? "aujourd'hui" : `dans ${l.jours} j`}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <p className={`font-extrabold tabular-nums ${l.motif === "retard" ? "text-rose-600" : "text-slate-900"}`}>{formaterGNF(l.montant_du)}</p>
                        <p className="text-[10px] text-slate-400 tabular-nums">reste année {formaterGNF(l.reste_annee)}</p>
                      </td>
                      <td className="py-3 px-3">
                        {parent ? (
                          <>
                            <p className="font-semibold text-slate-700">{parent.nom || "—"} <span className="text-[10px] font-normal text-slate-400">{LIENS[parent.lien] || parent.lien}</span></p>
                            <p className="text-[11px] text-slate-500 tabular-nums">{l.contacts.map((c) => c.telephone).filter(Boolean).join(" · ") || "Pas de téléphone"}</p>
                          </>
                        ) : <span className="text-slate-400">Aucun contact</span>}
                      </td>
                      <td className="py-3 px-3">
                        {l.derniere_relance ? (
                          <button onClick={() => voirHistorique(l)} className="text-left hover:underline cursor-pointer">
                            <p className="font-semibold text-slate-700">{formaterDateCourte(l.derniere_relance.date)} · {CANAUX[l.derniere_relance.canal]}</p>
                            <p className="text-[10px] text-slate-400">{l.nombre_relances} relance{l.nombre_relances > 1 ? "s" : ""}{l.derniere_relance.par ? ` · ${l.derniere_relance.par}` : ""}</p>
                          </button>
                        ) : <span className="text-slate-400">Jamais</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {peutRelancer && (
                            <>
                              <button onClick={() => whatsapp(l, l.contacts.find((c) => numeroInternational(c.telephone)))} disabled={envoi} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer" title="Envoyer le message WhatsApp au parent"><MessageCircle className="w-4 h-4" /></button>
                              <button onClick={() => imprimerLettres([l])} disabled={envoi} className="p-1.5 rounded-lg text-slate-500 hover:text-[#0C447C] hover:bg-blue-50 cursor-pointer" title="Imprimer la lettre"><Printer className="w-4 h-4" /></button>
                            </>
                          )}
                          {parent?.telephone && <a href={`tel:${parent.telephone}`} className="p-1.5 rounded-lg text-slate-500 hover:text-[#0C447C] hover:bg-blue-50" title={`Appeler ${parent.telephone}`}><Phone className="w-4 h-4" /></a>}
                          <button onClick={() => voirHistorique(l)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer" title="Historique des relances"><History className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs">
          <span className="text-slate-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {affichees.length} famille{affichees.length > 1 ? "s" : ""}</span>
          <span className="font-extrabold text-rose-600 tabular-nums">Total : {formaterGNF(somme(affichees))}</span>
        </div>
      </div>

      {historique && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => setHistorique(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Relances de {historique.ligne.prenom} {historique.ligne.nom}</h3>
                <p className="text-xs text-slate-500">{historique.ligne.classe} · {historique.ligne.matricule}</p>
              </div>
              <button onClick={() => setHistorique(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Fermer"><X className="w-5 h-5" /></button>
            </div>
            {historique.relances === null ? (
              <p className="text-xs text-slate-400"><Loader2 className="w-4 h-4 animate-spin inline" /> Chargement…</p>
            ) : historique.relances.length === 0 ? (
              <p className="text-xs text-slate-500">Cette famille n'a encore jamais été relancée.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {historique.relances.map((r) => (
                  <li key={r.id} className="py-2.5 text-xs flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{formaterDateCourte(r.date)} à {r.date.slice(11, 16)} · {CANAUX[r.canal]}</p>
                      <p className="text-[10px] text-slate-400">{r.motif === "retard" ? "Retard" : "Rappel"}{r.par ? ` · par ${r.par}` : ""}{r.note ? ` · ${r.note}` : ""}</p>
                    </div>
                    <span className="font-bold tabular-nums text-slate-700">{formaterGNF(r.montant_du)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
