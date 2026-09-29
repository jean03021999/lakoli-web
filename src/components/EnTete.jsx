import { useState, useRef, useEffect, useId } from "react";
import api from "../services/api";
import AvatarUtilisateur from "./AvatarUtilisateur";
import { Menu, Building2, Calendar, Search, Bell, ChevronDown, Settings, LogOut, X, CheckCheck, GraduationCap, Users, School, ArrowRight, Mail } from "lucide-react";

// En-tete de l'application (design "Header & gestion scolaire guineenne") sur donnees reelles :
// etablissement et session (GET /user), recherche globale (eleves, enseignants, classes et
// modules accessibles selon les permissions), etat de connexion reel, notifications calculees
// par Layout et menu du compte.

const MAX_PAR_CATEGORIE = 5;
const CLE_NOTIFS_LUES = "notifications_lues";

const STATUTS_ELEVE = {
  a_jour: { libelle: "À jour", classe: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  en_retard: { libelle: "En retard", classe: "bg-rose-50 text-rose-700 border border-rose-200" },
  partiel: { libelle: "Partiel", classe: "bg-amber-50 text-amber-700 border border-amber-200" },
  a_echoir: { libelle: "À échoir", classe: "bg-slate-50 text-slate-600 border border-slate-200" },
};

function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

// Notifications deja lues : conservees dans ce navigateur (confort personnel, sans importance si perdu).
function lireNotifsLues() {
  try {
    return JSON.parse(localStorage.getItem(CLE_NOTIFS_LUES) || "[]");
  } catch {
    return [];
  }
}

// La cle inclut le titre : "3 eleves en retard" devenant "4 eleves en retard" redevient non lue.
const cleNotif = (n) => `${n.id}:${n.titre}`;

function IconeResultat({ type, className }) {
  if (type === "eleve") return <GraduationCap className={className} />;
  if (type === "enseignant") return <Users className={className} />;
  if (type === "classe") return <School className={className} />;
  return <ArrowRight className={className} />;
}

export default function EnTete({ etablissement, session, utilisateur, libelleRole, enLigne, notifications, eleves, modules, permissions, onMenu, onNaviguer, onDeconnexion }) {
  const [notifsOuvert, setNotifsOuvert] = useState(false);
  const [profilOuvert, setProfilOuvert] = useState(false);
  const [rechercheMobile, setRechercheMobile] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [rechercheActive, setRechercheActive] = useState(false);
  const [notifsLues, setNotifsLues] = useState(lireNotifsLues);
  const [index, setIndex] = useState(null); // { enseignants, classes } charges au premier usage

  const refNotifs = useRef(null);
  const refProfil = useRef(null);
  const refRecherche = useRef(null);
  const refChamp = useRef(null);
  const refChampMobile = useRef(null);
  const idListe = useId();

  const nomUtilisateur = utilisateur?.name || "Utilisateur";
  const nonLues = notifications.filter((n) => !notifsLues.includes(cleNotif(n)));

  // Donnees de recherche chargees a la premiere ouverture (les eleves viennent de Layout).
  const chargerIndex = () => {
    if (index) return;
    setIndex({ enseignants: [], classes: [] });
    Promise.allSettled([
      permissions.includes("enseignants.voir") ? api.get("/enseignants") : Promise.reject(),
      permissions.includes("classes.voir") ? api.get("/classes") : Promise.reject(),
    ]).then(([ens, cls]) =>
      setIndex({
        enseignants: ens.status === "fulfilled" ? ens.value.data.enseignants || [] : [],
        classes: cls.status === "fulfilled" ? cls.value.data || [] : [],
      })
    );
  };

  const ouvrirRecherche = () => {
    chargerIndex();
    if (window.innerWidth >= 1024) {
      refChamp.current?.focus();
      setRechercheActive(true);
    } else {
      setRechercheMobile(true);
    }
  };

  // Resultats : chaque mot saisi doit apparaitre (ordre libre, sans accents).
  const termes = normaliser(recherche).split(/\s+/).filter(Boolean);
  const correspond = (texte) => termes.every((t) => normaliser(texte).includes(t));
  const raccourcis = modules
    .filter((m) => m.chemin !== "/tableau-de-bord")
    .map((m) => ({ id: `m-${m.chemin}`, type: "raccourci", categorie: "Raccourcis", titre: m.nom, sousTitre: "Ouvrir le module", chemin: m.chemin, cible: m.nom }));
  const resultats = termes.length === 0
    ? raccourcis.slice(0, 6)
    : [
        ...(eleves || [])
          .map((e) => ({
            id: `e-${e.id}`,
            type: "eleve",
            categorie: "Élèves",
            titre: `${e.prenom} ${e.nom}`,
            sousTitre: [e.classe || "Non inscrit", e.matricule && `Matricule ${e.matricule}`].filter(Boolean).join(" · "),
            badge: STATUTS_ELEVE[e.statut_paiement],
            chemin: `/eleves/${e.id}`,
            cible: `${e.nom} ${e.prenom} ${e.matricule} ${e.classe || ""}`,
          }))
          .filter((r) => correspond(r.cible))
          .slice(0, MAX_PAR_CATEGORIE),
        ...(index?.enseignants || [])
          .map((e) => ({
            id: `p-${e.id}`,
            type: "enseignant",
            categorie: "Enseignants",
            titre: `${e.prenom} ${e.nom}`,
            sousTitre: [e.matieres?.length ? `Professeur de ${e.matieres.join(", ")}` : "Aucune matière", e.matricule].filter(Boolean).join(" · "),
            chemin: `/enseignants/${e.id}`,
            cible: `${e.nom} ${e.prenom} ${e.matricule} ${(e.matieres || []).join(" ")}`,
          }))
          .filter((r) => correspond(r.cible))
          .slice(0, MAX_PAR_CATEGORIE),
        ...(index?.classes || [])
          .map((c) => ({
            id: `c-${c.id}`,
            type: "classe",
            categorie: "Classes",
            titre: c.nom,
            sousTitre: [`${c.nombre_eleves} élève${c.nombre_eleves > 1 ? "s" : ""}`, c.filiere].filter(Boolean).join(" · "),
            chemin: "/classes",
            cible: `${c.nom} ${c.niveau} ${c.filiere || ""}`,
          }))
          .filter((r) => correspond(r.cible))
          .slice(0, MAX_PAR_CATEGORIE),
        ...raccourcis.filter((r) => correspond(r.cible)).slice(0, 3),
      ];

  const fermerTout = () => {
    setNotifsOuvert(false);
    setProfilOuvert(false);
    setRechercheActive(false);
    setRechercheMobile(false);
  };

  const choisir = (r) => {
    fermerTout();
    setRecherche("");
    refChamp.current?.blur();
    onNaviguer(r.chemin);
  };

  // Ctrl+K / Cmd+K ouvre la recherche, Echap ferme les menus.
  useEffect(() => {
    const clavier = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ouvrirRecherche();
      }
      if (e.key === "Escape") fermerTout();
    };
    window.addEventListener("keydown", clavier);
    return () => window.removeEventListener("keydown", clavier);
  });

  useEffect(() => {
    const clicExterieur = (e) => {
      if (refNotifs.current && !refNotifs.current.contains(e.target)) setNotifsOuvert(false);
      if (refProfil.current && !refProfil.current.contains(e.target)) setProfilOuvert(false);
      if (refRecherche.current && !refRecherche.current.contains(e.target)) setRechercheActive(false);
    };
    document.addEventListener("mousedown", clicExterieur);
    return () => document.removeEventListener("mousedown", clicExterieur);
  }, []);

  useEffect(() => {
    if (rechercheMobile) refChampMobile.current?.focus();
  }, [rechercheMobile]);

  const marquerLues = (liste) => {
    const cles = [...new Set([...notifsLues, ...liste.map(cleNotif)])];
    setNotifsLues(cles);
    try {
      localStorage.setItem(CLE_NOTIFS_LUES, JSON.stringify(cles));
    } catch {
      // stockage indisponible : l'etat "lu" ne vaut que pour cette page
    }
  };

  const listeResultats = (mobile) => {
    if (resultats.length === 0) {
      return (
        <div className="py-6 text-center">
          <Search className="mx-auto h-6 w-6 text-[#cbd5e1] mb-1.5" />
          <p className="text-[12px] font-medium text-[#475569]">Aucun résultat trouvé</p>
          <p className="text-[11px] text-[#94a3b8]">Vérifiez l'orthographe ou essayez un matricule</p>
        </div>
      );
    }
    let categorie = null;
    return resultats.map((r) => {
      const entete = r.categorie !== categorie ? (categorie = r.categorie) : null;
      return (
        <div key={r.id}>
          {entete && <div className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">{entete}</div>}
          <button
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => choisir(r)}
            className={`w-full flex items-center justify-between text-left transition-colors group cursor-pointer ${
              mobile ? "rounded-xl p-2.5 hover:bg-[#f8fafc] border border-transparent hover:border-[#e2e8f0]" : "rounded-lg p-2 hover:bg-[#f8fafc]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`flex shrink-0 items-center justify-center bg-[#eff6ff] text-[#0C447C] group-hover:bg-[#0C447C] group-hover:text-white transition-colors ${mobile ? "h-8 w-8 rounded-lg" : "h-7 w-7 rounded-md"}`}>
                <IconeResultat type={r.type} className={mobile ? "h-4 w-4" : "h-3.5 w-3.5"} />
              </div>
              <div className="min-w-0">
                <p className={`${mobile ? "text-[13px]" : "text-[12px]"} font-semibold text-[#1e293b] group-hover:text-[#0C447C] transition-colors truncate`}>{r.titre}</p>
                <p className="text-[11px] text-[#64748b] truncate">{r.sousTitre}</p>
              </div>
            </div>
            {r.badge && <span className={`shrink-0 ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${r.badge.classe}`}>{r.badge.libelle}</span>}
          </button>
        </div>
      );
    });
  };

  return (
    <>
      <header
        style={{ boxShadow: "0 1px 16px rgba(0, 0, 0, 0.06)" }}
        className="sticky top-0 z-40 h-16 shrink-0 w-full bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] px-3 sm:px-5 lg:px-6"
      >
        <div className="flex h-full items-center justify-between gap-2 sm:gap-4">
          {/* Gauche : menu mobile, logo (quand la barre laterale est masquee), etablissement, session */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={onMenu}
              aria-label="Ouvrir le menu de navigation"
              className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0C447C] transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => onNaviguer("/tableau-de-bord")}
              className="md:hidden flex items-center gap-2 shrink-0 cursor-pointer select-none group"
              title="LAKOLI - Tableau de bord"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0C447C] to-[#1a6bb5] text-white shadow-sm ring-1 ring-black/5 group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-[15px] tracking-tight">L</span>
                <div className="absolute -bottom-0.5 -right-0.5 flex h-2 w-3 overflow-hidden rounded-sm ring-1 ring-white">
                  <div className="w-1/3 bg-[#ce1126]" />
                  <div className="w-1/3 bg-[#fcd116]" />
                  <div className="w-1/3 bg-[#009460]" />
                </div>
              </div>
            </button>

            {etablissement?.nom && (
              <div className="flex items-center gap-1.5 min-w-0">
                {etablissement.logo_url ? (
                  <img src={etablissement.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-md object-contain border border-[#e2e8f0] bg-white" />
                ) : (
                  <div className="hidden sm:flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#eff6ff] text-[#0C447C]">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[12px] sm:text-[13px] font-semibold text-[#1e293b] truncate">{etablissement.nom}</span>
                  {etablissement.ville && (
                    <>
                      <span className="hidden sm:inline text-[#94a3b8] text-xs font-bold select-none">·</span>
                      <span className="hidden sm:inline text-[12px] text-[#64748b] font-medium whitespace-nowrap">{etablissement.ville}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {session && (
              <div className="hidden lg:flex shrink-0 items-center gap-1.5 rounded-full bg-[#eff6ff] border border-[#bfdbfe] py-1 px-2.5">
                <Calendar className="h-3 w-3 text-[#1d4ed8]" />
                <span className="text-[11px] font-semibold text-[#1d4ed8] tracking-tight whitespace-nowrap">{session}</span>
              </div>
            )}
          </div>

          {/* Centre (grand ecran) : recherche globale */}
          <div ref={refRecherche} className="hidden lg:block relative">
            <div
              className={`flex items-center h-9 w-[280px] xl:w-[340px] rounded-[10px] border px-3 transition-all duration-200 ${
                rechercheActive ? "bg-white border-[#0C447C] ring-3 ring-[#0C447C]/10 shadow-sm" : "bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]"
              }`}
            >
              <Search className="h-3.5 w-3.5 text-[#94a3b8] shrink-0 mr-2.5" />
              <input
                ref={refChamp}
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                onFocus={() => {
                  chargerIndex();
                  setRechercheActive(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && resultats[0]) choisir(resultats[0]);
                }}
                placeholder="Rechercher un élève, enseignant..."
                aria-label="Rechercher un élève, un enseignant, une classe"
                role="combobox"
                aria-expanded={rechercheActive}
                aria-controls={idListe}
                aria-autocomplete="list"
                className="w-full bg-transparent text-[12px] text-[#1e293b] placeholder-[#94a3b8] outline-none"
              />
              {recherche ? (
                <button type="button" onClick={() => setRecherche("")} aria-label="Effacer la recherche" className="p-0.5 text-[#94a3b8] hover:text-[#475569] cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="flex items-center gap-0.5 rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#64748b] select-none whitespace-nowrap">
                  Ctrl K
                </span>
              )}
            </div>

            {rechercheActive && (
              <div
                id={idListe}
                role="listbox"
                aria-label="Résultats de recherche"
                className="absolute left-0 right-0 top-full mt-1.5 max-h-[400px] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white p-2 shadow-xl animate-dropdown z-50"
              >
                <div className="space-y-0.5">{listeResultats(false)}</div>
                <div className="mt-2 border-t border-[#e2e8f0] pt-2 px-2 text-[11px] text-[#64748b]">
                  <kbd className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Entrée</kbd> ouvre le premier résultat
                </div>
              </div>
            )}
          </div>

          {/* Droite : connexion, recherche mobile, notifications, profil */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <span
              title={enLigne ? "Connexion au serveur active" : "Aucune connexion internet : les données ne sont plus synchronisées"}
              className={`hidden xl:flex items-center gap-1.5 rounded-full py-1 px-2.5 text-[11px] font-semibold ${
                enLigne ? "bg-[#f0fdf4] border border-[#86efac] text-[#15803d]" : "bg-[#fef2f2] border border-[#fca5a5] text-[#b91c1c]"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {enLigne && <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${enLigne ? "bg-[#10b981]" : "bg-[#ef4444]"}`} />
              </span>
              {enLigne ? "Synchronisé" : "Hors ligne"}
            </span>

            <button
              type="button"
              onClick={ouvrirRecherche}
              aria-label="Rechercher"
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0C447C] transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <div ref={refNotifs} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifsOuvert((o) => !o);
                  setProfilOuvert(false);
                }}
                aria-label={`Notifications (${nonLues.length} non lues)`}
                aria-expanded={notifsOuvert}
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0C447C] transition-all cursor-pointer ${notifsOuvert ? "bg-[#f1f5f9] text-[#0C447C]" : ""}`}
              >
                <Bell className="h-5 w-5" />
                {nonLues.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {nonLues.length}
                  </span>
                )}
              </button>

              {notifsOuvert && (
                <div
                  style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)" }}
                  className="absolute right-0 top-full mt-2 w-[320px] sm:w-[350px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#e2e8f0] bg-white animate-dropdown z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#1e293b]">Notifications</span>
                      {nonLues.length > 0 && (
                        <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold text-[#1d4ed8]">
                          {nonLues.length} nouvelle{nonLues.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {nonLues.length > 0 && (
                      <button
                        type="button"
                        onClick={() => marquerLues(notifications)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#0C447C] hover:text-[#1a6bb5] hover:underline cursor-pointer"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Tout marquer lu
                      </button>
                    )}
                  </div>

                  <div className="max-h-[340px] overflow-y-auto divide-y divide-[#f1f5f9]">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="mx-auto h-7 w-7 text-[#cbd5e1] mb-2" />
                        <p className="text-[12px] font-medium text-[#64748b]">Aucune notification pour le moment</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const lue = notifsLues.includes(cleNotif(n));
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              marquerLues([n]);
                              setNotifsOuvert(false);
                              onNaviguer(n.chemin);
                            }}
                            className={`group relative w-full flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer ${lue ? "bg-white hover:bg-[#f8fafc]" : "bg-[#f8fafc]/80 hover:bg-[#f1f5f9]"}`}
                          >
                            {!lue && <span className="absolute left-1.5 top-5 h-1.5 w-1.5 rounded-full bg-[#0C447C]" />}
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.couleur}`}>
                              <n.icone className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-[13px] leading-snug ${lue ? "font-medium text-[#334155]" : "font-bold text-[#1e293b]"}`}>{n.titre}</span>
                              <span className="mt-0.5 block text-[12px] text-[#64748b] leading-tight">{n.detail}</span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#cbd5e1] group-hover:text-[#0C447C] mt-1 shrink-0" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:block h-6 w-px bg-[#e2e8f0]" />

            {/* Profil */}
            <div ref={refProfil} className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfilOuvert((o) => !o);
                  setNotifsOuvert(false);
                }}
                aria-expanded={profilOuvert}
                aria-label="Menu du compte"
                className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-[#f1f5f9] transition-colors group cursor-pointer"
              >
                <AvatarUtilisateur nom={nomUtilisateur} photoUrl={utilisateur?.photo_url} className="h-8 w-8 rounded-full ring-2 ring-white text-[12px]" />
                <div className="hidden lg:flex flex-col text-left leading-none">
                  <span className="text-[13px] font-semibold text-[#1e293b] group-hover:text-[#0C447C] transition-colors">{nomUtilisateur}</span>
                  <span className="mt-1 text-[11px] text-[#64748b] font-medium">{libelleRole}</span>
                </div>
                <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-[#64748b] transition-transform duration-200 ${profilOuvert ? "rotate-180 text-[#0C447C]" : ""}`} />
              </button>

              {profilOuvert && (
                <div
                  style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)" }}
                  className="absolute right-0 top-full mt-2 w-[250px] rounded-[14px] border border-[#e2e8f0] bg-white p-2 animate-dropdown z-50"
                >
                  <div className="flex items-center gap-3 p-2.5">
                    <AvatarUtilisateur nom={nomUtilisateur} photoUrl={utilisateur?.photo_url} className="h-11 w-11 rounded-full ring-2 ring-slate-100 text-[14px]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1e293b] truncate">{nomUtilisateur}</p>
                      {libelleRole && <span className="inline-block rounded bg-[#eff6ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">{libelleRole}</span>}
                      {utilisateur?.email && (
                        <p className="flex items-center gap-1 text-[11px] text-[#64748b] truncate mt-0.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{utilisateur.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {etablissement?.nom && (
                    <div className="mx-2.5 mb-1 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-2 text-[11px] text-[#475569]">
                      <p className="font-semibold text-[#1e293b] truncate">{etablissement.nom}</p>
                      <p className="text-[#64748b] truncate">{[etablissement.ville, session && `Session ${session}`].filter(Boolean).join(" · ")}</p>
                    </div>
                  )}

                  <div className="my-1.5 h-px bg-[#e2e8f0]" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfilOuvert(false);
                      onNaviguer("/parametres");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc] hover:text-[#0C447C] transition-colors cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-[#64748b]" />
                    Paramètres
                  </button>

                  <div className="my-1.5 h-px bg-[#e2e8f0]" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfilOuvert(false);
                      onDeconnexion();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Recherche plein ecran (petits ecrans) */}
      {rechercheMobile && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col p-3 sm:p-6" onClick={() => setRechercheMobile(false)}>
          <div className="w-full max-w-xl mx-auto rounded-2xl bg-white shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[85vh] animate-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-3.5 border-b border-[#e2e8f0]">
              <Search className="h-4 w-4 text-[#0C447C] shrink-0" />
              <input
                ref={refChampMobile}
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && resultats[0]) choisir(resultats[0]);
                }}
                placeholder="Rechercher un élève, enseignant, classe..."
                className="w-full text-[13px] text-[#1e293b] placeholder-[#94a3b8] outline-none bg-transparent"
              />
              <button type="button" onClick={() => setRechercheMobile(false)} aria-label="Fermer la recherche" className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-3 space-y-1 flex-1">
              {listeResultats(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
