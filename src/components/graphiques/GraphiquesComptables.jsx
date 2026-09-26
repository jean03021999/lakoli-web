import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Sector,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
} from "recharts";
import { BarChart2, TrendingUp, PieChart as IconeDonut, School, UserPlus } from "lucide-react";

// Graphiques du tableau de bord Comptable (pack "lakoli-recharts-components"), alimentes par les
// donnees reelles deja chargees : paiements, repartition des frais, stats par classe et statut de
// paiement de chaque eleve. Aucun objectif ni chiffre invente : les lignes de reference sont des
// moyennes calculees sur les donnees affichees.

const MOIS_COURTS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const MOIS_LONGS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const BLEU = "#0C447C";
const VERT = "#10b981";
const ORANGE = "#f59e0b";
const ROUGE = "#ef4444";
const GRIS = "#cbd5e1";

const STYLE_CARTE = { borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" };
const STYLE_INFOBULLE = { borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", backgroundColor: "#ffffff" };
const TICK = { fill: "#94a3b8", fontSize: 11, fontWeight: 500 };

function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

function formaterGNF(montant) {
  return `${Math.round(Number(montant) || 0).toLocaleString("fr-FR")} GNF`;
}

// Montant abrege pour les axes et les centres : 1,2 M, 850 k, 900.
function abreger(montant) {
  const n = Number(montant) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000).toLocaleString("fr-FR")} k`;
  return n.toLocaleString("fr-FR");
}

function Carte({ children }) {
  return (
    <div className="bg-white p-5 border border-[#e2e8f0] flex flex-col h-full transition-shadow duration-300 hover:shadow-[0_10px_32px_rgba(12,68,124,0.10)]" style={STYLE_CARTE}>
      {children}
    </div>
  );
}

function EnTete({ titre, sousTitre, badge, icone: Icone, couleur, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#f1f5f9]">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${couleur}14`, color: couleur }}>
          <Icone className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[#1e293b] tracking-tight">{titre}</h3>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0C447C] border border-blue-200/60">{badge}</span>
            )}
          </div>
          <p className="text-[12px] text-[#94a3b8] mt-0.5 leading-snug">{sousTitre}</p>
        </div>
      </div>
      {children && <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">{children}</div>}
    </div>
  );
}

function Selecteur({ options, valeur, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[#f1f5f9] rounded-xl border border-slate-200/60">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            valeur === o.valeur ? "bg-[#0C447C] text-white shadow-xs" : "text-[#475569] hover:text-[#1e293b]"
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}

function Pied({ children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 pt-3 mt-auto border-t border-[#f1f5f9] text-xs text-[#475569]">
      {children}
    </div>
  );
}

function Legende({ couleur, libelle, pointille = false, texte }) {
  return (
    <span className="flex items-center gap-1.5">
      {pointille ? (
        <span className="w-4 border-b-2 border-dashed" style={{ borderColor: couleur }} />
      ) : (
        <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: couleur }} />
      )}
      <span className="font-medium" style={texte ? { color: couleur } : undefined}>{libelle}</span>
    </span>
  );
}

function Vide({ texte }) {
  return <div className="flex-1 flex items-center justify-center py-12 text-center text-slate-400 text-xs">{texte}</div>;
}

function Infobulle({ titre, badge, lignes, pied }) {
  return (
    <div className="px-4 py-3 text-xs space-y-1.5 min-w-[200px]" style={STYLE_INFOBULLE}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5">
        <strong className="font-bold text-[13px] text-[#1e293b]">{titre}</strong>
        {badge}
      </div>
      <div className="space-y-1">
        {lignes.map((l) => (
          <div key={l.libelle} className="flex items-center justify-between gap-4">
            <span className="text-[#475569] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.couleur }} />
              {l.libelle} :
            </span>
            <strong className="font-bold" style={{ color: l.couleur }}>{l.valeur}</strong>
          </div>
        ))}
      </div>
      {pied && (
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-4">
          <span className="font-bold text-[#1e293b]">{pied.libelle}</span>
          <strong className="text-sm font-extrabold text-[#0C447C]">{pied.valeur}</strong>
        </div>
      )}
    </div>
  );
}

function BadgeVariation({ variation }) {
  if (variation === null) return null;
  const positif = variation >= 0;
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-full ${positif ? "bg-emerald-50 text-[#10b981]" : "bg-rose-50 text-[#ef4444]"}`}>
      {positif ? "▲ +" : "▼ "}
      {Math.abs(variation)}%
    </span>
  );
}

// Point de courbe a double anneau (blanc cercle bleu + coeur bleu).
function PointDouble({ cx, cy, index }) {
  if (cx === undefined || cy === undefined) return null;
  return (
    <g key={`point-${index}`}>
      <circle cx={cx} cy={cy} r={5} fill="#ffffff" stroke={BLEU} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={2} fill={BLEU} />
    </g>
  );
}

// 1. Evolution mensuelle des encaissements + moyenne de la periode en ligne de reference.
function EvolutionEncaissements({ paiements, disponible }) {
  const [periode, setPeriode] = useState(12);

  const donnees = useMemo(() => {
    // Fin de la fenetre : le mois courant, ou le mois du dernier paiement s'il est posterieur
    // (paiement saisi avec une date a venir), pour que le total concorde avec la repartition.
    const dernier = paiements.reduce((max, p) => ((p.date_paiement || "") > max ? p.date_paiement : max), "");
    const aujourdhui = new Date();
    const [ad, md] = dernier ? dernier.slice(0, 7).split("-").map(Number) : [0, 0];
    const fin = ad * 12 + md - 1 > aujourdhui.getFullYear() * 12 + aujourdhui.getMonth() ? new Date(ad, md - 1, 1) : aujourdhui;
    const mois = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(fin.getFullYear(), fin.getMonth() - i, 1);
      mois.push({
        cle: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        mois: MOIS_COURTS[d.getMonth()],
        moisComplet: `${MOIS_LONGS[d.getMonth()]} ${d.getFullYear()}`,
        encaisse: 0,
        nombre: 0,
      });
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

  return (
    <Carte>
      <EnTete titre="Évolution des encaissements" icone={TrendingUp} couleur={BLEU} sousTitre={`${periode} derniers mois · montants réellement encaissés`}>
        <Selecteur
          valeur={periode}
          onChange={setPeriode}
          options={[
            { valeur: 3, libelle: "3M" },
            { valeur: 6, libelle: "6M" },
            { valeur: 12, libelle: "12M" },
          ]}
        />
      </EnTete>

      {!disponible ? (
        <Vide texte="Impossible de charger les paiements." />
      ) : (
        <>
          <div className="w-full h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibles} margin={{ top: 15, right: 12, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id="degradeEvolution" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLEU} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={BLEU} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mois" tickLine={false} axisLine={false} tick={TICK} dy={6} />
                <YAxis tickLine={false} axisLine={false} tick={TICK} tickFormatter={abreger} width={52} />
                {moyenne > 0 && <ReferenceLine y={moyenne} stroke={VERT} strokeDasharray="6 3" strokeWidth={2} />}
                <Tooltip
                  cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <Infobulle
                        titre={d.moisComplet}
                        badge={<BadgeVariation variation={d.variation} />}
                        lignes={[
                          { libelle: "Encaissé", valeur: formaterGNF(d.encaisse), couleur: BLEU },
                          { libelle: "Moyenne période", valeur: formaterGNF(moyenne), couleur: VERT },
                        ]}
                        pied={{ libelle: "Paiements :", valeur: d.nombre }}
                      />
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="encaisse"
                  stroke={BLEU}
                  strokeWidth={3}
                  fill="url(#degradeEvolution)"
                  dot={PointDouble}
                  activeDot={{ r: 7, fill: BLEU, stroke: "#ffffff", strokeWidth: 3 }}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Pied>
            <div className="flex flex-wrap items-center gap-4">
              <Legende couleur={BLEU} libelle="Encaissements réels" />
              <Legende couleur={VERT} libelle={`Moyenne (${abreger(moyenne)} GNF/mois)`} pointille texte />
            </div>
            <span className="text-[11px] text-[#94a3b8]">
              Total période : <strong className="text-[#0C447C] font-bold">{formaterGNF(total)}</strong>
            </span>
          </Pied>
        </>
      )}
    </Carte>
  );
}

// Part survolee du donut : elargie, coins arrondis, ombre.
function PartActive({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }) {
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={6}
      style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }}
    />
  );
}

// 2. Repartition des encaissements par categorie de frais.
function RepartitionFrais({ finances, disponible }) {
  const [actif, setActif] = useState(null);

  const segments = [
    { nom: "Scolarité", valeur: finances.scolarite, couleur: BLEU, pastille: "bg-blue-50 text-[#0C447C]" },
    { nom: "Inscription", valeur: finances.inscriptions, couleur: VERT, pastille: "bg-emerald-50 text-[#10b981]" },
    { nom: "Réinscription", valeur: finances.reinscriptions, couleur: ORANGE, pastille: "bg-amber-50 text-[#f59e0b]" },
    { nom: "Autres", valeur: finances.autres, couleur: "#94a3b8", pastille: "bg-slate-100 text-slate-600" },
  ];
  const total = segments.reduce((s, x) => s + x.valeur, 0);
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);
  const avecMontant = segments.filter((s) => s.valeur > 0);
  const survol = actif !== null ? segments[actif] : null;

  return (
    <Carte>
      <EnTete titre="Répartition des frais" icone={IconeDonut} couleur={VERT} sousTitre="Ventilation des encaissements par type de frais">
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f1f5f9] text-[#475569] border border-slate-200/60">Session en cours</span>
      </EnTete>

      {!disponible ? (
        <Vide texte="Impossible de charger les paiements." />
      ) : total === 0 ? (
        <Vide texte="Aucun encaissement enregistré pour l'instant." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center flex-1">
          <div className="relative h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const s = payload[0].payload;
                    return (
                      <div className="px-3.5 py-2.5 text-xs space-y-1" style={STYLE_INFOBULLE}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.couleur }} />
                          <strong className="text-[#1e293b] font-bold">{s.nom}</strong>
                        </div>
                        <div className="text-[#0C447C] font-extrabold text-sm">{formaterGNF(s.valeur)}</div>
                        <div className="text-[11px] text-[#94a3b8]">Part : <strong className="text-[#1e293b]">{pct(s.valeur)}%</strong> du total</div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={avecMontant}
                  dataKey="valeur"
                  nameKey="nom"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={avecMontant.length > 1 ? 4 : 0}
                  cornerRadius={6}
                  activeShape={PartActive}
                  onMouseEnter={(_, i) => setActif(segments.indexOf(avecMontant[i]))}
                  onMouseLeave={() => setActif(null)}
                  animationDuration={1000}
                >
                  {avecMontant.map((s) => (
                    <Cell
                      key={s.nom}
                      fill={s.couleur}
                      stroke="#ffffff"
                      strokeWidth={2}
                      style={{ outline: "none", opacity: survol && survol !== s ? 0.35 : 1, transition: "opacity 0.2s" }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-[22px] font-bold text-[#1e293b] leading-tight tracking-tight">{abreger(survol ? survol.valeur : total)}</span>
              <span className="text-[11px] text-[#94a3b8] font-medium leading-none mt-0.5">GNF</span>
              <span className="text-[10px] text-[#94a3b8] uppercase font-semibold tracking-wider mt-1">{survol ? survol.nom : "Total encaissé"}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {segments.map((s, i) => (
              <div
                key={s.nom}
                onMouseEnter={() => setActif(i)}
                onMouseLeave={() => setActif(null)}
                className={`p-2 rounded-xl transition-all cursor-default ${actif === i ? "bg-[#f8fafc] ring-1 ring-slate-200" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: s.couleur }} />
                    <span className="text-[13px] text-[#475569] font-medium">{s.nom}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.pastille}`}>{pct(s.valeur)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-0.5">
                  <span className="text-[11px] text-[#94a3b8]">Montant perçu</span>
                  <span className="font-bold text-[#1e293b] tabular-nums">{formaterGNF(s.valeur)}</span>
                </div>
                <div className="w-full bg-[#f1f5f9] h-[3px] rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct(s.valeur)}%`, backgroundColor: s.couleur }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Carte>
  );
}

// Badge de recouvrement dessine a droite de chaque barre : vert >= 80 %, jaune 50-80 %, rouge < 50 %.
function BadgeRecouvrement({ x, y, payload }) {
  const val = Number(payload.value);
  const [fond, texte, libelle] =
    val >= 80 ? ["#dcfce7", "#15803d", `✓ ${val}%`] : val >= 50 ? ["#fef9c3", "#a16207", `⚡ ${val}%`] : ["#fee2e2", "#dc2626", `⚠ ${val}%`];
  return (
    <g transform={`translate(${x + 6}, ${y})`}>
      <rect x={0} y={-10} width={54} height={20} rx={10} fill={fond} />
      <text x={27} y={4} textAnchor="middle" fill={texte} fontSize={10.5} fontWeight="bold">{libelle}</text>
    </g>
  );
}

const ETATS_CLASSE = [
  { cle: "paye", libelle: "À jour", couleur: VERT },
  { cle: "partiel", libelle: "Partiel", couleur: ORANGE },
  { cle: "retard", libelle: "En retard", couleur: ROUGE },
  { cle: "echoir", libelle: "À échoir", couleur: GRIS },
];

// 3. Statut de paiement des eleves par classe (en % de l'effectif de la classe), avec le taux de
// recouvrement (montant encaisse / montant du) en badge.
function StatutParClasse({ classes, eleves, disponible }) {
  const donnees = useMemo(() => {
    const parClasse = new Map();
    eleves.forEach((e) => {
      if (!e.classe) return;
      if (!parClasse.has(e.classe)) parClasse.set(e.classe, { paye: 0, partiel: 0, retard: 0, echoir: 0, total: 0 });
      const c = parClasse.get(e.classe);
      c.total += 1;
      if (e.statut_paiement === "a_jour") c.paye += 1;
      else if (e.statut_paiement === "partiel") c.partiel += 1;
      else if (e.statut_paiement === "en_retard") c.retard += 1;
      else c.echoir += 1;
    });
    return classes
      .filter((c) => parClasse.has(c.classe))
      .map((c) => {
        const n = parClasse.get(c.classe);
        const p = (v) => Math.round((v / n.total) * 100);
        return {
          classe: c.classe,
          eleves: n.total,
          nombres: n,
          paye: p(n.paye),
          partiel: p(n.partiel),
          retard: p(n.retard),
          echoir: Math.max(0, 100 - p(n.paye) - p(n.partiel) - p(n.retard)),
          recouvrement: c.montant_total > 0 ? Math.min(100, Math.round(((c.montant_encaisse || 0) / c.montant_total) * 100)) : 0,
        };
      });
  }, [classes, eleves]);

  const totalDu = classes.reduce((s, c) => s + (c.montant_total || 0), 0);
  const totalEncaisse = classes.reduce((s, c) => s + (c.montant_encaisse || 0), 0);
  const moyenne = totalDu > 0 ? Math.round((totalEncaisse / totalDu) * 100) : 0;

  return (
    <Carte>
      <EnTete titre="Statut des paiements par classe" icone={School} couleur={ORANGE} sousTitre="Élèves par état de paiement · badge = taux de recouvrement" />

      {!disponible ? (
        <Vide texte="Impossible de calculer le statut par classe." />
      ) : donnees.length === 0 ? (
        <Vide texte="Aucun élève inscrit dans une classe pour l'instant." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-[11px] bg-[#f8fafc] px-2.5 py-1.5 rounded-xl border border-slate-200/60 mb-2 self-start">
            {ETATS_CLASSE.map((e) => (
              <Legende key={e.cle} couleur={e.couleur} libelle={e.libelle} />
            ))}
          </div>
          <div className="w-full overflow-y-auto" style={{ maxHeight: 250 }}>
            <div style={{ height: Math.max(170, donnees.length * 36 + 10) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={donnees} margin={{ top: 5, right: 6, left: 0, bottom: 5 }} barCategoryGap={10}>
                  <CartesianGrid stroke="#f8fafc" horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis yAxisId="gauche" dataKey="classe" type="category" axisLine={false} tickLine={false} width={96} tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }} />
                  <YAxis yAxisId="droite" orientation="right" dataKey="recouvrement" type="category" axisLine={false} tickLine={false} width={64} tick={BadgeRecouvrement} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <Infobulle
                          titre={d.classe}
                          badge={<span className="font-extrabold text-[#0C447C] text-[11px]">Recouvrement : {d.recouvrement}%</span>}
                          lignes={ETATS_CLASSE.map((e) => ({
                            libelle: e.libelle,
                            valeur: `${d.nombres[e.cle]} (${d[e.cle]}%)`,
                            couleur: e.cle === "echoir" ? "#64748b" : e.couleur,
                          }))}
                          pied={{ libelle: "Effectif :", valeur: `${d.eleves} élève${d.eleves > 1 ? "s" : ""}` }}
                        />
                      );
                    }}
                  />
                  {ETATS_CLASSE.map((e, i) => (
                    <Bar
                      key={e.cle}
                      yAxisId="gauche"
                      dataKey={e.cle}
                      stackId="statut"
                      fill={e.couleur}
                      barSize={20}
                      radius={i === ETATS_CLASSE.length - 1 ? [0, 6, 6, 0] : i === 0 ? [6, 0, 0, 6] : 0}
                      animationDuration={1000}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <Pied>
            <span className="text-[11px] text-[#94a3b8]">Seuils : ✓ ≥ 80 % · ⚡ 50-80 % · ⚠ &lt; 50 %</span>
            <span className="text-[11px] font-medium">
              Recouvrement global : <strong className={moyenne >= 80 ? "text-[#10b981]" : moyenne >= 50 ? "text-[#a16207]" : "text-[#dc2626]"}>{moyenne}%</strong>
            </span>
          </Pied>
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

// 4. Inscriptions et reinscriptions par semaine, d'apres les frais d'inscription / reinscription
// payes (un eleve compte une fois par categorie et par semaine). Ligne = moyenne hebdomadaire.
function InscriptionsHebdomadaires({ paiements, disponible }) {
  const [nbSemaines, setNbSemaines] = useState(8);

  const donnees = useMemo(() => {
    const lundi = debutSemaine(new Date());
    const f = (d) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    const semaines = [];
    for (let i = nbSemaines - 1; i >= 0; i--) {
      const debut = new Date(lundi);
      debut.setDate(debut.getDate() - i * 7);
      const fin = new Date(debut);
      fin.setDate(fin.getDate() + 6);
      semaines.push({ debut, semaine: `S${nbSemaines - i}`, libelle: `Du ${f(debut)} au ${f(fin)}`, nouvelles: new Set(), reinscriptions: new Set() });
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
  }, [paiements, nbSemaines]);

  const totalNouvelles = donnees.reduce((s, d) => s + d.nouvelles, 0);
  const totalReinscriptions = donnees.reduce((s, d) => s + d.reinscriptions, 0);
  const cumul = totalNouvelles + totalReinscriptions;
  const moyenne = Math.round((cumul / donnees.length) * 10) / 10;
  const etiquette = (v) => (Number(v) > 0 ? String(v) : "");

  return (
    <Carte>
      <EnTete titre="Inscriptions & Réinscriptions" icone={UserPlus} couleur="#7c3aed" sousTitre="Frais d'inscription réglés, semaine par semaine">
        <Selecteur
          valeur={nbSemaines}
          onChange={setNbSemaines}
          options={[
            { valeur: 4, libelle: "4 sem." },
            { valeur: 8, libelle: "8 sem." },
            { valeur: 12, libelle: "12 sem." },
          ]}
        />
      </EnTete>

      {!disponible ? (
        <Vide texte="Impossible de charger les paiements." />
      ) : (
        <>
          <div className="w-full h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donnees} barGap={2} barCategoryGap="22%" margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="semaine" tickLine={false} axisLine={false} tick={{ ...TICK, fontWeight: 600 }} dy={6} />
                <YAxis tickLine={false} axisLine={false} tick={TICK} allowDecimals={false} />
                {moyenne > 0 && <ReferenceLine y={moyenne} stroke={ROUGE} strokeDasharray="8 4" strokeOpacity={0.6} strokeWidth={1.5} />}
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const totalSemaine = d.nouvelles + d.reinscriptions;
                    return (
                      <Infobulle
                        titre={d.libelle}
                        badge={
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${totalSemaine >= moyenne && totalSemaine > 0 ? "bg-emerald-50 text-[#10b981]" : "bg-amber-50 text-[#f59e0b]"}`}>
                            {totalSemaine >= moyenne && totalSemaine > 0 ? "Au-dessus de la moyenne" : "Sous la moyenne"}
                          </span>
                        }
                        lignes={[
                          { libelle: "Nouvelles inscriptions", valeur: d.nouvelles, couleur: BLEU },
                          { libelle: "Réinscriptions", valeur: d.reinscriptions, couleur: VERT },
                          { libelle: "Moyenne hebdo", valeur: moyenne.toLocaleString("fr-FR"), couleur: ROUGE },
                        ]}
                        pied={{ libelle: "Total semaine :", valeur: `${totalSemaine} élève${totalSemaine > 1 ? "s" : ""}` }}
                      />
                    );
                  }}
                />
                <Bar dataKey="nouvelles" fill={BLEU} radius={[6, 6, 0, 0]} maxBarSize={26} animationDuration={1000}>
                  <LabelList dataKey="nouvelles" position="top" fill={BLEU} fontSize={10} fontWeight={600} formatter={etiquette} />
                </Bar>
                <Bar dataKey="reinscriptions" fill={VERT} radius={[6, 6, 0, 0]} maxBarSize={26} animationDuration={1000}>
                  <LabelList dataKey="reinscriptions" position="top" fill={VERT} fontSize={10} fontWeight={600} formatter={etiquette} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Pied>
            <div className="flex flex-wrap items-center gap-4">
              <Legende couleur={BLEU} libelle={`Nouvelles (${totalNouvelles})`} />
              <Legende couleur={VERT} libelle={`Réinscriptions (${totalReinscriptions})`} />
              <Legende couleur={ROUGE} libelle={`Moyenne (${moyenne.toLocaleString("fr-FR")}/sem.)`} pointille texte />
            </div>
            <span className="text-[11px] text-[#94a3b8]">
              Cumul : <strong className="text-[#0C447C] font-bold">{cumul} élève{cumul > 1 ? "s" : ""}</strong>
            </span>
          </Pied>
        </>
      )}
    </Carte>
  );
}

// Apparition en fondu decale des 4 cartes quand la section entre a l'ecran.
function useVisible() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees[0].isIntersecting) {
          setVisible(true);
          observateur.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observateur.observe(ref.current);
    return () => observateur.disconnect();
  }, []);
  return [ref, visible];
}

export default function GraphiquesComptables({ paiements, paiementsDisponibles, finances, financesDisponibles, classes, classesDisponibles, eleves = [] }) {
  const [ref, visible] = useVisible();
  const apparition = (delai) => ({
    className: `transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`,
    style: { transitionDelay: `${delai}ms` },
  });

  return (
    <section ref={ref} className="space-y-5">
      <div className="flex items-center gap-3 bg-white p-5 rounded-[20px] border border-slate-200/80" style={{ boxShadow: STYLE_CARTE.boxShadow }}>
        <span className="w-11 h-11 rounded-xl bg-[#0C447C] flex items-center justify-center text-white shrink-0">
          <BarChart2 className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[18px] font-bold text-[#1e293b] tracking-tight">Analyses & Statistiques</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#10b981] border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              Données réelles
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">Calculées à partir des paiements enregistrés en caisse et du statut de chaque élève</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div {...apparition(100)}>
          <EvolutionEncaissements paiements={paiements} disponible={paiementsDisponibles} />
        </div>
        <div {...apparition(200)}>
          <RepartitionFrais finances={finances} disponible={financesDisponibles} />
        </div>
        <div {...apparition(300)}>
          <StatutParClasse classes={classes} eleves={eleves} disponible={classesDisponibles} />
        </div>
        <div {...apparition(400)}>
          <InscriptionsHebdomadaires paiements={paiements} disponible={paiementsDisponibles} />
        </div>
      </div>
    </section>
  );
}
