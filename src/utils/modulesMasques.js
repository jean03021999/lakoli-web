// Modules masques a certains roles, quelles que soient leurs permissions : le Fondateur ne voit ni
// la gestion des eleves, ni celle des enseignants, ni les bulletins (menu, adresses directes,
// recherche et raccourcis). Les donnees restent lisibles par les autres ecrans (frais, caisse...).
const MASQUES_PAR_ROLE = {
  FONDATEUR: ["/eleves", "/enseignants", "/bulletins"],
};

// Vrai si le chemin appartient a un module masque au role : /eleves, /eleves/12, /eleves-ajouter...
export function cheminMasque(role, chemin) {
  return (MASQUES_PAR_ROLE[role] || []).some((p) => chemin === p || chemin.startsWith(p + "/") || chemin.startsWith(p + "-"));
}
