import { useRef, useState } from "react";
import { Building2, GraduationCap, MapPin, Upload, X, Phone, Mail, FileCheck2, Sparkles } from "lucide-react";
import api from "../../services/api";
import { Carte, Champ, AvecIcone, BoutonEnregistrer, BandeauLectureSeule } from "./ui";
import { CHAMP, REGIONS_GUINEE, messageErreur } from "./outils";

const TYPES = [
  { valeur: "ecole_privee", libelle: "Privé", icone: "🏛️" },
  { valeur: "ecole_publique", libelle: "Public", icone: "🏫" },
  { valeur: "universite", libelle: "Université", icone: "🎓" },
  { valeur: "centre_formation", libelle: "Formation", icone: "🛠️" },
];

const CYCLES = [
  { id: "maternelle", libelle: "Maternelle", icone: "🧸", description: "Petite, moyenne et grande section" },
  { id: "primaire", libelle: "Primaire", icone: "🎒", description: "Du CP1 à la 6e année (CEE)" },
  { id: "college", libelle: "Collège", icone: "📚", description: "De la 7e à la 10e année (BEPC)" },
  { id: "lycee", libelle: "Lycée", icone: "🎓", description: "11e, 12e et Terminale (BAC)" },
];

const CHAMPS_FORMULAIRE = [
  "nom", "type", "ville", "quartier", "region", "prefecture", "coordonnees_gps", "adresse",
  "telephone", "telephone_secondaire", "whatsapp_relance", "email", "cycles", "capacite_accueil", "agrement", "slogan",
];

function versFormulaire(e) {
  return Object.fromEntries(CHAMPS_FORMULAIRE.map((c) => [c, c === "cycles" ? e[c] || [] : e[c] ?? ""]));
}

export default function SectionEtablissement({ etablissement, effectif, peutAdministrer, onMaj, onToast }) {
  const [form, setForm] = useState(() => versFormulaire(etablissement));
  const [envoiLogo, setEnvoiLogo] = useState(false);
  const refFichier = useRef(null);
  const lecture = !peutAdministrer;

  const maj = (champ, valeur) => setForm((f) => ({ ...f, [champ]: valeur }));
  const basculerCycle = (id) => maj("cycles", form.cycles.includes(id) ? form.cycles.filter((c) => c !== id) : [...form.cycles, id]);
  const prefectures = REGIONS_GUINEE[form.region] || [];

  const enregistrer = async () => {
    if (!form.nom.trim()) {
      onToast("Nom requis", "Indiquez le nom de l'établissement.", "warning");
      throw new Error();
    }
    try {
      const donnees = Object.fromEntries(Object.entries(form).map(([c, v]) => [c, v === "" ? null : v]));
      const res = await api.put("/parametres/etablissement", donnees);
      onMaj(res.data);
      setForm(versFormulaire(res.data));
      onToast("Établissement mis à jour", "Les informations officielles ont été enregistrées.");
    } catch (err) {
      onToast("Enregistrement impossible", messageErreur(err, "Erreur lors de l'enregistrement."), "warning");
      throw err;
    }
  };

  const envoyerLogo = async (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    if (fichier.size > 2 * 1024 * 1024) {
      onToast("Image trop lourde", "Le logo ne doit pas dépasser 2 Mo.", "warning");
      return;
    }
    const donnees = new FormData();
    donnees.append("logo", fichier);
    setEnvoiLogo(true);
    try {
      const res = await api.post("/parametres/etablissement/logo", donnees);
      onMaj(res.data);
      onToast("Logo enregistré", "Le nouveau logo de l'établissement est en place.");
    } catch (err) {
      onToast("Logo refusé", messageErreur(err, "Impossible d'enregistrer ce logo."), "warning");
    } finally {
      setEnvoiLogo(false);
    }
  };

  const supprimerLogo = async () => {
    if (!window.confirm("Supprimer le logo de l'établissement ?")) return;
    try {
      const res = await api.delete("/parametres/etablissement/logo");
      onMaj(res.data);
      onToast("Logo supprimé", "L'établissement n'a plus de logo.", "info");
    } catch (err) {
      onToast("Suppression impossible", messageErreur(err, "Erreur lors de la suppression."), "warning");
    }
  };

  return (
    <div className="space-y-6">
      {lecture && <BandeauLectureSeule>Consultation seule : seule la direction (Fondateur, Directeur, Proviseur) peut modifier la fiche de l'établissement.</BandeauLectureSeule>}

      <Carte icone={Building2} titre="Informations générales" description="Identité officielle et coordonnées de contact de l'établissement">
        <div className="space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Logo officiel de l'établissement</label>
            <div className="flex items-center gap-5">
              <input ref={refFichier} type="file" accept="image/png,image/jpeg,image/webp" onChange={envoyerLogo} className="hidden" />
              {etablissement.logo_url ? (
                <div className="relative group w-[100px] h-[100px] rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm shrink-0 bg-white">
                  <img src={etablissement.logo_url} alt="Logo de l'établissement" className="w-full h-full object-contain" />
                  {!lecture && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" onClick={() => refFichier.current?.click()} className="p-1.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer" title="Changer">
                        <Upload className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={supprimerLogo} className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 cursor-pointer" title="Supprimer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={lecture || envoiLogo}
                  onClick={() => refFichier.current?.click()}
                  className="w-[100px] h-[100px] rounded-xl border-2 border-dashed border-slate-300 enabled:hover:border-blue-500 bg-slate-50 enabled:hover:bg-blue-50/50 flex flex-col items-center justify-center shrink-0 text-slate-400 enabled:hover:text-blue-600 transition-all enabled:cursor-pointer disabled:cursor-not-allowed"
                >
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[11px] font-medium">{envoiLogo ? "Envoi..." : "Importer"}</span>
                </button>
              )}
              <div className="space-y-1">
                <p className="text-xs text-slate-600">Formats acceptés : PNG, JPG ou WebP (2 Mo maximum).</p>
                <p className="text-xs text-slate-400">Image carrée de préférence, sur fond clair ou transparent.</p>
                {!lecture && (
                  <button type="button" onClick={() => refFichier.current?.click()} className="text-xs font-semibold text-blue-700 hover:underline pt-1 cursor-pointer">
                    {envoiLogo ? "Envoi en cours..." : "Choisir un fichier..."}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <Champ libelle="Nom de l'établissement" requis className="md:col-span-6">
              <input type="text" value={form.nom} disabled={lecture} onChange={(e) => maj("nom", e.target.value)} className={`${CHAMP} font-medium`} />
            </Champ>
            <Champ libelle="Type d'établissement" requis className="md:col-span-6">
              <div className="grid grid-cols-4 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.valeur}
                    type="button"
                    disabled={lecture}
                    onClick={() => maj("type", t.valeur)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 disabled:cursor-not-allowed ${
                      form.type === t.valeur ? "border-2 border-[#0C447C] bg-[#0C447C]/5 text-[#0C447C] font-bold" : "border-slate-200 bg-slate-50 enabled:hover:bg-slate-100 text-slate-600 font-medium enabled:cursor-pointer"
                    }`}
                  >
                    <span className="text-base">{t.icone}</span>
                    <span className="text-[11px] truncate w-full">{t.libelle}</span>
                  </button>
                ))}
              </div>
            </Champ>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Champ libelle="Ville / commune urbaine">
              <input type="text" value={form.ville} disabled={lecture} onChange={(e) => maj("ville", e.target.value)} placeholder="Ex : Conakry" className={CHAMP} />
            </Champ>
            <Champ libelle="Quartier / district">
              <input type="text" value={form.quartier} disabled={lecture} onChange={(e) => maj("quartier", e.target.value)} placeholder="Ex : Kipé Dadia" className={CHAMP} />
            </Champ>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Champ libelle="Téléphone principal (+224)">
              <AvecIcone icone={Phone}>
                <input type="tel" value={form.telephone} disabled={lecture} onChange={(e) => maj("telephone", e.target.value)} placeholder="+224 622 00 00 00" className={`${CHAMP} pl-10`} />
              </AvecIcone>
            </Champ>
            <Champ libelle="Téléphone secondaire (optionnel)">
              <AvecIcone icone={Phone}>
                <input type="tel" value={form.telephone_secondaire} disabled={lecture} onChange={(e) => maj("telephone_secondaire", e.target.value)} placeholder="+224 664 00 00 00" className={`${CHAMP} pl-10`} />
              </AvecIcone>
            </Champ>
            <Champ libelle="WhatsApp de la comptabilité (relances)">
              <AvecIcone icone={Phone}>
                <input type="tel" value={form.whatsapp_relance} disabled={lecture} onChange={(e) => maj("whatsapp_relance", e.target.value)} placeholder="+224 621 00 00 00" className={`${CHAMP} pl-10`} />
              </AvecIcone>
              <p className="mt-1 text-[11px] text-slate-400">Indiqué aux parents dans les messages et lettres de relance.</p>
            </Champ>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Champ libelle="E-mail officiel de la direction">
              <AvecIcone icone={Mail}>
                <input type="email" value={form.email} disabled={lecture} onChange={(e) => maj("email", e.target.value)} placeholder="contact@etablissement.gn" className={`${CHAMP} pl-10`} />
              </AvecIcone>
            </Champ>
            <Champ libelle="Adresse postale complète">
              <input type="text" value={form.adresse} disabled={lecture} onChange={(e) => maj("adresse", e.target.value)} placeholder="Ex : Kipé Dadia, commune de Ratoma, BP 1420" className={CHAMP} />
            </Champ>
          </div>
        </div>
      </Carte>

      <Carte icone={GraduationCap} titre="Informations académiques" description="Cycles d'enseignement, agrément ministériel et capacité d'accueil">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Cycles d'enseignement dispensés</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CYCLES.map((c) => {
                const coche = form.cycles.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={lecture}
                    onClick={() => basculerCycle(c.id)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all disabled:cursor-not-allowed ${
                      coche ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-500/30" : "border-slate-200 bg-slate-50 enabled:hover:bg-slate-100 text-slate-600 enabled:cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 w-full">
                      <span className="text-xl">{c.icone}</span>
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${coche ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"}`}>{coche && "✓"}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{c.libelle}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{c.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Champ libelle="Capacité d'accueil (élèves)" aide="Au-delà de 90 %, une alerte s'affiche dans la cloche de l'en-tête.">
              <input type="number" min="0" value={form.capacite_accueil} disabled={lecture} onChange={(e) => maj("capacite_accueil", e.target.value)} placeholder="Ex : 1200" className={CHAMP} />
              {Number(form.capacite_accueil) > 0 && typeof effectif === "number" && (() => {
                const pct = Math.round((effectif / Number(form.capacite_accueil)) * 100);
                const couleur = pct > 100 ? "bg-rose-500" : pct >= 90 ? "bg-amber-500" : "bg-emerald-500";
                return (
                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Effectif actuel : {effectif.toLocaleString("fr-FR")} élèves</span>
                      <span className={pct > 100 ? "text-rose-600" : pct >= 90 ? "text-amber-600" : "text-emerald-600"}>{pct} %</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${couleur}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })()}
            </Champ>
            <Champ libelle="N° d'agrément ministériel" aide="Référence de l'autorisation d'ouverture délivrée par le ministère.">
              <AvecIcone icone={FileCheck2}>
                <input type="text" value={form.agrement} disabled={lecture} onChange={(e) => maj("agrement", e.target.value)} placeholder="Ex : MEPU-A/CAB/DNEP/2021/N°0482" className={`${CHAMP} pl-10 font-mono`} />
              </AvecIcone>
            </Champ>
          </div>

          <Champ libelle={<span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" />Devise / slogan de l'établissement</span>}>
            <textarea rows={2} value={form.slogan} disabled={lecture} onChange={(e) => maj("slogan", e.target.value)} placeholder="Ex : Discipline — Rigueur — Excellence" className={CHAMP} />
          </Champ>
        </div>
      </Carte>

      <Carte icone={MapPin} titre="Localisation (République de Guinée)" description="Découpage administratif et coordonnées cartographiques">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Champ libelle="Région administrative">
            <select value={form.region} disabled={lecture} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value, prefecture: REGIONS_GUINEE[e.target.value]?.[0] || "" }))} className={`${CHAMP} font-medium`}>
              <option value="">— Choisir —</option>
              {Object.keys(REGIONS_GUINEE).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Champ>
          <Champ libelle="Préfecture / commune">
            <select value={form.prefecture} disabled={lecture || !form.region} onChange={(e) => maj("prefecture", e.target.value)} className={`${CHAMP} font-medium`}>
              {!form.region && <option value="">— Choisir la région —</option>}
              {prefectures.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Champ>
          <Champ libelle="Coordonnées GPS (optionnel)">
            <input type="text" value={form.coordonnees_gps} disabled={lecture} onChange={(e) => maj("coordonnees_gps", e.target.value)} placeholder="Ex : 9.5847° N, 13.6265° W" className={`${CHAMP} font-mono`} />
          </Champ>
        </div>
      </Carte>

      {!lecture && (
        <div className="flex justify-end pt-2">
          <BoutonEnregistrer libelle="Enregistrer l'établissement" libelleOk="Informations enregistrées" onEnregistrer={enregistrer} />
        </div>
      )}
    </div>
  );
}
