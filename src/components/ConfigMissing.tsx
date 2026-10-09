import { Header } from './Header'
import appStyles from '../App.module.css'
import styles from '../auth/Auth.module.css'

/** Affiché quand le build n'a pas reçu la configuration Supabase (plutôt qu'un écran blanc). */
export function ConfigMissing({ detail }: { detail?: string }) {
  return (
    <div className={appStyles.shell}>
      <Header />
      <main className={appStyles.main}>
        <section className={styles.state}>
          <h1 className={styles.title}>Configuration manquante</h1>
          <p className={styles.stateText} role="alert">
            {detail ??
              'L’application n’est pas reliée à Supabase : les variables VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY sont absentes du build.'}
          </p>
          <p className={styles.stateText}>
            En local : copier <code>.env.example</code> vers <code>.env.local</code>, le compléter, puis relancer{' '}
            <code>npm run dev</code>. Pour le site publié : renseigner ces deux valeurs dans les variables GitHub
            Actions du dépôt, puis relancer le déploiement (voir le README).
          </p>
        </section>
      </main>
    </div>
  )
}
