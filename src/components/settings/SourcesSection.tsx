import { CORPUS_SOURCE, EXERCISES } from '../../data/corpus'
import styles from './Settings.module.css'

export function SourcesSection() {
  return (
    <section className={styles.section} aria-labelledby="sources-title">
      <h2 id="sources-title" className={styles.sectionTitle}>
        Sources et licences
      </h2>
      <div className={styles.prose}>
        <p>
          Texte arabe : {CORPUS_SOURCE.name} ({CORPUS_SOURCE.edition}), © 2007-2026 Tanzil Project, licence{' '}
          {CORPUS_SOURCE.license}.{' '}
          <a href={CORPUS_SOURCE.url} target="_blank" rel="noreferrer">
            tanzil.net
          </a>
          . Les {EXERCISES.length} segments proposés en sont des extraits non modifiés, découpés aux limites des mots.
        </p>
        <p>
          Lectures de référence : établies pour la lecture de Ḥafṣ ʿan ʿĀṣim, segment lu à la pause, et recoupées avec la
          translittération publiée par Tanzil. Elles ne remplacent pas l'écoute d'un récitateur ni l'enseignement d'un
          professeur.
        </p>
        <p>
          Polices : Amiri Quran (Khaled Hosny, The Amiri Project), Newsreader (Production Type) et Inter (Rasmus
          Andersson), toutes sous SIL Open Font License 1.1, intégrées localement.
        </p>
      </div>
    </section>
  )
}
