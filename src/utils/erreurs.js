// Message affichable d'une erreur d'API : premiere erreur de validation, sinon message du serveur.
export function messageErreurApi(err, defaut) {
  const liste = err.response?.data?.errors;
  return liste ? Object.values(liste).flat()[0] : err.response?.data?.message || defaut;
}
