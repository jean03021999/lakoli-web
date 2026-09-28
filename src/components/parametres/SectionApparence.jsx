import { useRef, useState } from "react";
import { LayoutGrid, Eye, RotateCcw, Check, Upload, Type } from "lucide-react";
import { Carte } from "./ui";
import { CATEGORIES_FONDS, FONDS, FOND_PAR_DEFAUT, POLICES, BLEU, cssFond, lireApparence, enregistrerApparence, chargerPolice } from "./outils";

// Taille maximale d'une image personnalisee : elle est gardee dans le stockage du navigateur (~5 Mo).
const TAILLE_MAX_IMAGE = 1.5 * 1024 * 1024;

// Apparence de l'espace de travail (fond de la zone de contenu, police), propre a ce navigateur :
// chaque choix est applique immediatement.
export default function SectionApparence({ onToast }) {
  const [apparence, setApparence] = useState(lireApparence);
  const [categorie, setCategorie] = useState(() => FONDS.find((f) => f.id === apparence.fond)?.categorie || "minimaliste");
  const refFichier = useRef(null);

  const appliquer = (suivante, titre, message) => {
    if (!enregistrerApparence(suivante)) {
      onToast("Choix non enregistré", "Le navigateur refuse de stocker ce réglage (image trop lourde ou stockage bloqué).", "warning");
      return;
    }
    setApparence(suivante);
    if (titre) onToast(titre, message, "info");
  };

  const choisirFond = (fond) => appliquer({ ...apparence, fond: fond.id, image: null }, "Arrière-plan appliqué", `« ${fond.nom} » est votre nouveau fond.`);

  const importerImage = (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    if (fichier.size > TAILLE_MAX_IMAGE) {
      onToast("Image trop volumineuse", "Choisissez une image de 1,5 Mo au maximum.", "warning");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => appliquer({ ...apparence, image: lecteur.result }, "Image appliquée", "Votre image personnelle sert désormais de fond.");
    lecteur.readAsDataURL(fichier);
  };

  const choisirPolice = (police) => {
    chargerPolice(police);
    appliquer({ ...apparence, police }, "Police appliquée", `L'interface utilise désormais ${POLICES[police].libelle}.`);
  };

  const reinitialiser = () => appliquer({ fond: FOND_PAR_DEFAUT, image: null, police: "systeme" }, "Apparence réinitialisée", "Le fond gris LAKOLI et la police système sont rétablis.");

  const fondActuel = FONDS.find((f) => f.id === apparence.fond);

  return (
    <div className="space-y-6">
      <Carte icone={LayoutGrid} titre="Arrière-plan de votre espace de travail" description="Thèmes scolaires, dégradés et paysages de Guinée — appliqués immédiatement">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
          {CATEGORIES_FONDS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategorie(c.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                categorie === c.id ? "bg-blue-50/80 border-[#0C447C] text-[#0C447C]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
              }`}
            >
              {c.libelle}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {FONDS.filter((f) => f.categorie === categorie).map((f) => {
                const choisi = !apparence.image && apparence.fond === f.id;
                return (
                  <button key={f.id} type="button" onClick={() => choisirFond(f)} className="group flex flex-col items-center select-none cursor-pointer">
                    <div
                      style={{ background: f.apercu || f.css, borderColor: choisi ? BLEU : undefined }}
                      className={`relative w-[80px] h-[80px] rounded-xl shadow-md transition-all duration-200 group-hover:scale-105 flex items-center justify-center border-[3px] overflow-hidden ${
                        choisi ? "ring-2 ring-blue-400 ring-offset-2 scale-105" : "border-slate-200"
                      }`}
                    >
                      {choisi && (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#0C447C] text-white shadow-md">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                      {f.badge && !choisi && <span className="absolute top-1 right-1 px-1 rounded text-[8px] font-black uppercase bg-black/60 text-white">{f.badge}</span>}
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center mt-2 line-clamp-1">{f.nom}</span>
                    <span className="text-[10px] text-slate-400 text-center leading-tight line-clamp-1">{f.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Fond personnalisé (photo de l'établissement…)</label>
              <input ref={refFichier} type="file" accept="image/png,image/jpeg,image/webp" onChange={importerImage} className="hidden" />
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={() => refFichier.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  Importer une image (JPG, PNG, WebP · 1,5 Mo max.)
                </button>
                {apparence.image && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Image personnelle utilisée
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Apercu */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Aperçu
            </span>
            <div style={{ width: "200px", height: "130px", background: cssFond(apparence) }} className="relative rounded-xl shadow-md border border-slate-300 overflow-hidden flex mx-auto">
              <div className="relative z-10 w-12 p-1 flex flex-col gap-1" style={{ background: "linear-gradient(180deg, #0C447C, #0a2d5a)" }}>
                <div className="w-full h-2.5 rounded-sm bg-white/80" />
                <div className="w-full h-1 bg-white/30 rounded-sm mt-1" />
                <div className="w-full h-1 bg-white/30 rounded-sm" />
                <div className="w-full h-1 bg-white rounded-sm" />
                <div className="w-full h-1 bg-white/30 rounded-sm" />
              </div>
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="h-3 bg-white/95 border-b border-slate-200" />
                <div className="flex-1 p-2 flex flex-col gap-1.5">
                  <div className="w-full h-4 rounded-sm" style={{ background: "linear-gradient(90deg, #0C447C, #1a6bb5)" }} />
                  <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="bg-white/95 rounded-sm p-1 border border-slate-100"><div className="w-8 h-1 bg-slate-300 rounded-sm" /><div className="w-5 h-2 bg-emerald-400/80 rounded-sm mt-1" /></div>
                    <div className="bg-white/95 rounded-sm p-1 border border-slate-100"><div className="w-7 h-1 bg-slate-300 rounded-sm" /><div className="w-4 h-2 bg-[#0C447C] rounded-sm mt-1 opacity-80" /></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Fond actuel : <strong className="text-slate-800">{apparence.image ? "Image personnelle" : fondActuel?.nom || "Gris LAKOLI"}</strong>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">Ces réglages ne concernent que ce navigateur.</p>
          <button
            type="button"
            onClick={reinitialiser}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser l'apparence
          </button>
        </div>
      </Carte>

      <Carte icone={Type} titre="Police de l'interface" description="Police de caractères de toute l'application sur ce navigateur">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(POLICES).map(([cle, p]) => {
            const choisie = apparence.police === cle;
            return (
              <button
                key={cle}
                type="button"
                onMouseEnter={() => chargerPolice(cle)}
                onClick={() => choisirPolice(cle)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  choisie ? "border-2 border-[#0C447C] bg-[#0C447C]/5" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2 w-full">
                  <span className="text-base font-extrabold" style={{ fontFamily: p.famille || undefined }}>{p.libelle}</span>
                  {choisie && <span className="w-4 h-4 rounded-full bg-[#0C447C] text-white flex items-center justify-center text-[10px]">✓</span>}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{p.description}</p>
              </button>
            );
          })}
        </div>
      </Carte>
    </div>
  );
}
