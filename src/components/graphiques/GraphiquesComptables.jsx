import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart2, ArrowUpRight, ArrowDownRight, Filter, TrendingUp, PieChart as IconeDonut, School, UserPlus } from "lucide-react";

// Graphiques du tableau de bord Comptable (design Google AI Studio "Lakoli 5"), alimentes par les
// donnees reelles deja chargees : paiements (GET /frais/paiements), stats par classe et
// repartition des frais. Aucune donnee d'exemple : une source indisponible affiche un message.

const MOIS_COURTS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const MOIS_LONGS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const STYLE_CARTE = { borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };
const STYLE_INFOBULLE = { borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" };
const TICK = { fill: "#94a3b8", fontSize: 11, fontWeight: 500 };

function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

function formaterGNF(montant) {
  return `${Math.round(Number(montant) || 0).toLocaleString("fr-FR")} GNF`;
}

// Montant abrege pour les axes et les centres de graphique : 1,2 M, 850 k, 900.
function abreger(montant) {
  const n = Number(montant) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000).toLocaleString("fr-FR")} k`;
  return n.toLocaleString("fr-FR");
}

// Carte moyenne : lisere degrade en haut, halo decoratif flou et legere elevation au survol.
function Carte({ children, degrade, halo }) {
  return (
    <div
      className="group relative isolate overflow-hidden bg-white p-4 sm:p-5 border border-slate-100 flex flex-col h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(12,68,124,0.12)]"
      style={STYLE_CARTE}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: degrade }} />
      <div
        className="absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-60 pointer-events-none -z-10 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: halo }}
      />
      {children}
    </div>
  );
}

function EnTete({ titre, sousTitre, badge, icone: Icone, degrade, children }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="h-9 w-9 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: degrade, boxShadow: "0 6px 16px rgba(12,68,124,0.22)" }}
        >
          <Icone className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-[#0C447C] tracking-tight">{titre}</h3>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0C447C] border border-blue-200">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{sousTitre}</p>
        </div>
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

const DEGRADES = {
  bleu: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)",
  vert: "linear-gradient(135deg, #059669 0%, #34d399 100%)",
  ambre: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
  violet: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
};

function Selecteur({ options, valeur, onChange }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-[#f0f4f8] rounded-xl border border-slate-200/80">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            valeur === o.valeur ? "bg-white text-[#0C447C] shadow-xs" : "text-slate-500 hover:text-[#0C447C]"
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

function Vide({ texte }) {
  return <div className="flex-1 flex items-center justify-center py-10 text-center text-slate-400 text-xs">{texte}</div>;
}

function Infobulle({ titre, badge, lignes, pied }) {
  return (
    <div className="bg-white p-3.5 border border-slate-100 min-w-[200px]" style={STYLE_INFOBULLE}>
      <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-[#0C447C]">{titre}</span>
        {badge}
      </div>
      <div className="space-y-1.5 text-xs">
        {lignes.map((l) => (
          <div key={l.libelle} className="flex items-center justify-between gap-4">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.couleur }} />
              {l.libelle} :
            </span>
            <span className="font-extrabold" style={{ color: l.couleur }}>{l.valeur}</span>
          </div>
        ))}
      </div>
      {pied && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between gap-4 text-[11px] font-bold">
          <span className="text-slate-400">{pied.libelle}</span>
          <span className="text-[#0C447C]">{pied.valeur}</span>
        </div>
      )}
    </div>
  );
}

function BadgeVariation({ variation }) {
  if (variation === null) return null;
  const positif = variation >= 0;
  const Icone = positif ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
        positif ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      }`}
    >
      <Icone className="w-3 h-3 stroke-[2.5]" />
      {positif ? "+" : ""}
      {variation}%
    </span>
  );
}

// Petit indicateur chiffre en tete de carte.
function MiniStat({ libelle, valeur, unite, couleur, extra }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-slate-50 to-[#f0f4f8] border border-slate-200/60 min-w-0">
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">{libelle}</span>
      <span className="flex items-center gap-1.5 min-w-0">
        <span className={`text-sm font-extrabold truncate ${couleur}`}>
          {valeur}
          {unite && <span className="text-[10px] font-semibold text-slate-400 ml-1">{unite}</span>}
        </span>
        {extra}
      </span>
    </div>
  );
}

// 1. Evolution mensuelle des encaissements (somme des paiements par mois de date_paiement).
function EvolutionEncaissements({ paiements, disponible }) {
  const [periode, setPeriode] = useState(12);

  const donnees = useMemo(() => {
    const maintenant = new Date();
    const mois = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      mois.push({ cle: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, mois: MOIS_COURTS[d.getMonth()], moisComplet: `${MOIS_LONGS[d.getMonth()]} ${d.getFullYear()}`, encaisse: 0, nombre: 0 });
    }
    const index = new Map(mois.map((m) => [m.cle, m]));
    paiements.forEach((p) => {
      const m = index.get((p.date_paiement || "").slice(0, 7));
      if (m) {
        m.encaisse += parseFloat(p.montant) || 0;
        m.nombre += 1;
      }
    });
    return mois.map((m, i) => {
      const precedent = i > 0 ? mois[i - 1].encaisse : 0;
      return { ...m, variation: precedent > 0 ? Math.round(((m.encaisse - precedent) / precedent) * 100) : null };
    });
  }, [paiements]);

  const visibles = donnees.slice(-periode);
  const total = visibles.reduce((s, m) => s + m.encaisse, 0);
  const moyenne = total / visibles.length;
  const meilleur = visibles.reduce((a, b) => (b.encaisse > a.encaisse ? b : a), visibles[0]);
  const dernier = visibles[visibles.length - 1];

  return (
    <Carte degrade={DEGRADES.bleu} halo="#dbeafe">
      <EnTete
        titre="Évolution des encaissements"
        icone={TrendingUp}
        degrade={DEGRADES.bleu}
        sousTitre="Montants encaissés chaque mois"
      >
        <Selecteur
          valeur={periode}
          onChange={setPeriode}
          options={[
            { valeur: 3, libelle: "3 m" },
            { valeur: 6, libelle: "6 m" },
            { valeur: 12, libelle: "12 m" },
          ]}
        />
      </EnTete>

      {!disponible ? (
        <Vide texte="Impossible de charger les paiements." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <MiniStat libelle="Total période" valeur={abreger(total)} unite="GNF" couleur="text-[#0C447C]" />
            <MiniStat
              libelle="Ce mois"
              valeur={abreger(dernier.encaisse)}
              unite="GNF"
              couleur="text-slate-700"
              extra={<BadgeVariation variation={dernier.variation} />}
            />
            <MiniStat libelle="Moyenne / mois" valeur={abreger(moyenne)} unite="GNF" couleur="text-slate-600" />
            <MiniStat libelle="Meilleur mois" valeur={meilleur.encaisse > 0 ? meilleur.moisComplet : "—"} couleur="text-emerald-600" />
          </div>

          <div className="w-full h-[190px] mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibles} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="degradeEncaisse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a6bb5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0C447C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={TICK} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={TICK} tickFormatter={abreger} width={48} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <Infobulle
                        titre={d.moisComplet}
                        badge={<BadgeVariation variation={d.variation} />}
                        lignes={[{ libelle: "Encaissé", valeur: formaterGNF(d.encaisse), couleur: "#0C447C" }]}
                        pied={{ libelle: "Paiements :", valeur: d.nombre }}
                      />
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="encaisse"
                  stroke="#0C447C"
                  strokeWidth={2.5}
                  fill="url(#degradeEncaisse)"
                  animationDuration={1200}
                  dot={{ r: 3, fill: "#ffffff", stroke: "#0C447C", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "#0C447C", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Carte>
  );
}

// 2. Repartition des encaissements par categorie de frais (donut + legende).
function RepartitionFrais({ finances, disponible }) {
  const [actif, setActif] = useState(null);

  const segments = [
    { nom: "Scolarité", valeur: finances.scolarite, couleur: "#0C447C", classe: "text-[#0C447C] bg-blue-50 border-blue-200", desc: "Tranches de scolarité" },
    { nom: "Inscription", valeur: finances.inscriptions, couleur: "#10b981", classe: "text-emerald-600 bg-emerald-50 border-emerald-200", desc: "Nouveaux élèves" },
    { nom: "Réinscription", valeur: finances.reinscriptions, couleur: "#f59e0b", classe: "text-amber-600 bg-amber-50 border-amber-200", desc: "Anciens élèves reconduits" },
    { nom: "Autres", valeur: finances.autres, couleur: "#94a3b8", classe: "text-slate-600 bg-slate-50 border-slate-200", desc: "Autres frais" },
  ];
  const total = segments.reduce((s, x) => s + x.valeur, 0);
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const avecMontant = segments.filter((s) => s.valeur > 0);
  const survol = actif !== null ? segments[actif] : null;

  return (
    <Carte degrade={DEGRADES.vert} halo="#d1fae5">
      <EnTete titre="Répartition des frais" icone={IconeDonut} degrade={DEGRADES.vert} sousTitre="Encaissements par catégorie de recettes" />

      {!disponible ? (
        <Vide texte="Impossible de charger les paiements." />
      ) : total === 0 ? (
        <Vide texte="Aucun encaissement enregistré pour l'instant." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-auto">
            <div className="relative w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={avecMontant}
                    dataKey="valeur"
                    nameKey="nom"
                    innerRadius={54}
                    outerRadius={80}
                    cornerRadius={6}
                    paddingAngle={avecMontant.length > 1 ? 3 : 0}
                    animationDuration={1000}
                    onMouseEnter={(_, i) => setActif(segments.indexOf(avecMontant[i]))}
                    onMouseLeave={() => setActif(null)}
                  >
                    {avecMontant.map((s) => (
                      <Cell
                        key={s.nom}
                        fill={s.couleur}
                        stroke="#ffffff"
                        strokeWidth={survol === s ? 3 : 1.5}
                        style={{ outline: "none", filter: survol === s ? "drop-shadow(0 4px 8px rgba(0,0,0,0.18))" : "none" }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {survol ? survol.nom : "Total encaissé"}
                </span>
                <span className="text-lg font-black text-[#0C447C] leading-none mt-0.5">
                  {abreger(survol ? survol.valeur : total)}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
                  {survol ? `${pct(survol.valeur)}% du total` : "GNF"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              {segments.map((s, i) => (
                <div
                  key={s.nom}
                  onMouseEnter={() => setActif(i)}
                  onMouseLeave={() => setActif(null)}
                  className={`px-2.5 py-1.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 ${
                    actif === i ? "bg-blue-50/70 border-[#0C447C]/40 shadow-xs" : "bg-[#f0f4f8]/50 border-slate-200/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-[4px] shrink-0" style={{ backgroundColor: s.couleur }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-600 leading-tight">{s.nom}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-[#0C447C]">{abreger(s.valeur)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${s.classe}`}>{pct(s.valeur)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Session scolaire en cours
            </span>
            <span className="font-semibold text-[#0C447C]">{formaterGNF(total)} perçus</span>
          </div>
        </>
      )}
    </Carte>
  );
}

// 3. Encaisse / reste a encaisser par classe (barres horizontales empilees).
function StatutParClasse({ classes, disponible }) {
  const [niveau, setNiveau] = useState("tous");
  const niveaux = [...new Set(classes.map((c) => c.niveau).filter(Boolean))];

  const donnees = classes
    .filter((c) => niveau === "tous" || c.niveau === niveau)
    .map((c) => {
      const encaisse = c.montant_encaisse || 0;
      const du = c.montant_total || 0;
      return {
        classe: c.classe,
        encaisse,
        reste: Math.max(du - encaisse, 0),
        du,
        taux: du > 0 ? Math.round((encaisse / du) * 100) : 0,
        eleves: c.nombre_eleves,
        soldes: c.nombre_soldes,
        retard: c.nombre_en_retard,
      };
    });

  return (
    <Carte degrade={DEGRADES.ambre} halo="#fef3c7">
      <EnTete titre="Recouvrement par classe" icone={School} degrade={DEGRADES.ambre} sousTitre="Encaissé et reste à encaisser">
        {niveaux.length > 1 && (
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              className="text-xs font-semibold text-[#0C447C] bg-[#f0f4f8] border border-slate-200/80 rounded-[10px] px-2 py-1 max-w-[120px] focus:outline-none cursor-pointer"
            >
              <option value="tous">Tous</option>
              {niveaux.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </EnTete>

      {!disponible ? (
        <Vide texte="Impossible de calculer le recouvrement par classe." />
      ) : donnees.length === 0 ? (
        <Vide texte="Aucune classe créée pour l'instant." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4 mb-2 text-[11px]">
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="w-3 h-3 rounded-[3px] bg-emerald-500" /> Encaissé
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="w-3 h-3 rounded-[3px] bg-slate-300" /> Reste à encaisser
            </span>
          </div>

          <div className="w-full overflow-y-auto" style={{ height: 210 }}>
          <div style={{ height: Math.max(200, donnees.length * 30 + 20) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={donnees} margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap={8}>
                <defs>
                  <linearGradient id="degradeRecouvre" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" hide axisLine={false} tickLine={false} tick={TICK} tickFormatter={abreger} />
                <YAxis
                  type="category"
                  dataKey="classe"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#0C447C", fontSize: 10, fontWeight: 700 }}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <Infobulle
                        titre={d.classe}
                        badge={
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {d.taux}% recouvré
                          </span>
                        }
                        lignes={[
                          { libelle: "Encaissé", valeur: formaterGNF(d.encaisse), couleur: "#10b981" },
                          { libelle: "Reste", valeur: formaterGNF(d.reste), couleur: "#94a3b8" },
                          { libelle: "Élèves soldés", valeur: `${d.soldes}/${d.eleves}`, couleur: "#0C447C" },
                          { libelle: "En retard", valeur: d.retard, couleur: "#ef4444" },
                        ]}
                        pied={{ libelle: "Total dû :", valeur: formaterGNF(d.du) }}
                      />
                    );
                  }}
                />
                <Bar dataKey="encaisse" stackId="a" fill="url(#degradeRecouvre)" animationDuration={1000} />
                <Bar dataKey="reste" stackId="a" fill="#e2e8f0" radius={[0, 6, 6, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>

          <div className="pt-2.5 mt-auto border-t border-slate-100 flex flex-wrap items-center gap-1.5 max-h-14 overflow-y-auto">
            {donnees.map((d) => (
              <span
                key={d.classe}
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  d.taux >= 90
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : d.taux >= 60
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-rose-50 text-rose-600 border-rose-200"
                }`}
              >
                {d.classe} : {d.taux}%
              </span>
            ))}
          </div>
        </>
      )}
    </Carte>
  );
}

// Lundi (00:00) de la semaine contenant la date.
function debutSemaine(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// 4. Inscriptions et reinscriptions par semaine (8 dernieres semaines), d'apres les paiements
// de frais d'inscription / reinscription (un eleve compte une fois par categorie).
function InscriptionsHebdomadaires({ paiements, disponible }) {
  const donnees = useMemo(() => {
    const lundi = debutSemaine(new Date());
    const semaines = [];
    for (let i = 7; i >= 0; i--) {
      const debut = new Date(lundi);
      debut.setDate(debut.getDate() - i * 7);
      const fin = new Date(debut);
      fin.setDate(fin.getDate() + 6);
      const f = (d) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      semaines.push({ debut, semaine: `S${8 - i}`, libelle: `Semaine du ${f(debut)} au ${f(fin)}`, nouvelles: new Set(), reinscriptions: new Set() });
    }
    paiements.forEach((p) => {
      if (!p.date_paiement) return;
      const nom = normaliser(p.type_frais);
      const categorie = nom.includes("reinscription") ? "reinscriptions" : nom.includes("inscription") ? "nouvelles" : null;
      if (!categorie) return;
      const [a, m, j] = p.date_paiement.slice(0, 10).split("-").map(Number);
      const debut = debutSemaine(new Date(a, m - 1, j)).getTime();
      const s = semaines.find((x) => x.debut.getTime() === debut);
      if (s) s[categorie].add(p.eleve?.id ?? p.id);
    });
    return semaines.map((s) => ({ semaine: s.semaine, libelle: s.libelle, nouvelles: s.nouvelles.size, reinscriptions: s.reinscriptions.size }));
  }, [paiements]);

  const totalNouvelles = donnees.reduce((s, d) => s + d.nouvelles, 0);
  const totalReinscriptions = donnees.reduce((s, d) => s + d.reinscriptions, 0);
  const pic = donnees.reduce((a, b) => (b.nouvelles + b.reinscriptions > a.nouvelles + a.reinscriptions ? b : a), donnees[0]);

  return (
    <Carte degrade={DEGRADES.violet} halo="#ede9fe">
      <EnTete
        titre="Inscriptions & Réinscriptions"
        badge="8 sem."
        icone={UserPlus}
        degrade={DEGRADES.violet}
        sousTitre="Frais d'inscription réglés par semaine"
      />

      {!disponible ? (
        <Vide texte="Impossible de charger les paiements." />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <MiniStat libelle="Nouveaux" valeur={totalNouvelles} couleur="text-[#0C447C]" />
            <MiniStat libelle="Réinscrits" valeur={totalReinscriptions} couleur="text-emerald-600" />
            <MiniStat libelle="Total" valeur={totalNouvelles + totalReinscriptions} unite="élèves" couleur="text-violet-600" />
          </div>

          <div className="w-full h-[190px] mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donnees} margin={{ top: 10, right: 8, left: -24, bottom: 0 }} barGap={3}>
                <defs>
                  <linearGradient id="degradeNouveaux" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a6bb5" />
                    <stop offset="100%" stopColor="#0C447C" />
                  </linearGradient>
                  <linearGradient id="degradeReinscrits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ ...TICK, fontWeight: 700 }} dy={4} />
                <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <Infobulle
                        titre={d.libelle}
                        lignes={[
                          { libelle: "Nouvelles inscriptions", valeur: d.nouvelles, couleur: "#0C447C" },
                          { libelle: "Réinscriptions", valeur: d.reinscriptions, couleur: "#10b981" },
                        ]}
                        pied={{ libelle: "Total semaine :", valeur: `${d.nouvelles + d.reinscriptions} élèves` }}
                      />
                    );
                  }}
                />
                <Bar dataKey="nouvelles" fill="url(#degradeNouveaux)" radius={[5, 5, 0, 0]} barSize={12} animationDuration={1000} />
                <Bar dataKey="reinscriptions" fill="url(#degradeReinscrits)" radius={[5, 5, 0, 0]} barSize={12} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
            {pic.nouvelles + pic.reinscriptions > 0
              ? `Pic : ${pic.libelle.toLowerCase()} (${pic.nouvelles + pic.reinscriptions} élèves)`
              : "Aucune inscription enregistrée sur les 8 dernières semaines."}
          </div>
        </>
      )}
    </Carte>
  );
}

export default function GraphiquesComptables({ paiements, paiementsDisponibles, finances, financesDisponibles, classes, classesDisponibles }) {
  return (
    <section className="space-y-5">
      <div
        className="flex items-center gap-3 p-4 rounded-2xl border border-blue-100"
        style={{ background: "linear-gradient(120deg, #ffffff 0%, #eff6ff 60%, #ecfdf5 100%)", boxShadow: "0 4px 18px rgba(12,68,124,0.06)" }}
      >
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #0C447C 0%, #1a6bb5 100%)" }}
        >
          <BarChart2 className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-[#0C447C] tracking-tight">Analyses & Statistiques</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Données réelles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Pilotage financier calculé à partir des paiements enregistrés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EvolutionEncaissements paiements={paiements} disponible={paiementsDisponibles} />
        <RepartitionFrais finances={finances} disponible={financesDisponibles} />
        <StatutParClasse classes={classes} disponible={classesDisponibles} />
        <InscriptionsHebdomadaires paiements={paiements} disponible={paiementsDisponibles} />
      </div>
    </section>
  );
}
