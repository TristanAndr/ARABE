/** Messages d'erreur d'authentification compréhensibles. */
export function authErrorMessage(error: unknown): string {
  const e = (error ?? {}) as { code?: string; name?: string; message?: string; status?: number }
  switch (e.code) {
    case 'invalid_credentials':
      return 'Adresse e-mail ou mot de passe incorrect.'
    case 'email_not_confirmed':
      return 'Adresse e-mail pas encore confirmée : ouvre le lien reçu par e-mail.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Un compte existe déjà avec cette adresse. Connecte-toi ou réinitialise le mot de passe.'
    case 'weak_password':
      return 'Mot de passe trop faible : choisis-en un plus long ou plus varié.'
    case 'same_password':
      return 'Le nouveau mot de passe doit être différent de l’ancien.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Trop de tentatives. Patiente quelques minutes avant de réessayer.'
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Adresse e-mail invalide.'
    case 'signup_disabled':
      return 'La création de compte est désactivée sur ce site.'
    case 'session_not_found':
    case 'session_expired':
    case 'refresh_token_not_found':
      return 'Ta session a expiré. Reconnecte-toi.'
  }
  if (e.name === 'AuthRetryableFetchError' || e.status === 0 || /fetch|network/i.test(e.message ?? '')) {
    return 'Connexion au serveur impossible. Vérifie ta connexion internet.'
  }
  return e.message ? `Erreur : ${e.message}` : 'Une erreur inattendue est survenue.'
}
