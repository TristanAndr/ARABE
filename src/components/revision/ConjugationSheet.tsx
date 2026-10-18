import {
  breakdown,
  formById,
  FORMS,
  grammarLabel,
  MODEL,
  PERSONS,
  verbOf,
} from '../../revision/conjugation'
import { Breakdown, ConjugatedPhrase } from './ConjugatedWord'
import styles from './Revision.module.css'

export const Ar = ({ children }: { children: string }) => (
  <span className={`arabic ${styles.inlineAr}`} lang="ar" dir="rtl">
    {children}
  </span>
)

const Affix = ({ children }: { children: string }) => (
  <span className={`arabic ${styles.inlineAr} ${styles.affix}`} lang="ar" dir="rtl">
    {children}
  </span>
)

/** Le tableau : code couleur, puis les formes groupées par personne. */
export function ConjugationTable() {
  return (
    <div className={styles.tableTab}>
      <Legend />

      {PERSONS.map((p) => (
        <section key={p.person} className={styles.group} aria-labelledby={`person-${p.person}`}>
          <h2 id={`person-${p.person}`} className={styles.groupTitle}>
            {p.label}
            <span className={`arabic ${styles.groupAr}`} lang="ar" dir="rtl">
              {p.arabic}
            </span>
          </h2>
          <table className={styles.table}>
            <thead className="visually-hidden">
              <tr>
                <th scope="col">Pronom et verbe</th>
                <th scope="col">Traduction</th>
                <th scope="col">Découpage</th>
              </tr>
            </thead>
            <tbody>
              {FORMS.filter((f) => f.person === p.person).map((f) => (
                <tr key={f.id} className={styles.row} data-form={f.id}>
                  <td className={styles.arCell}>
                    <ConjugatedPhrase form={f} />
                  </td>
                  <td className={styles.frCell}>
                    <span className={styles.translation}>{f.translation}</span>
                    <span className={styles.grammar}>
                      <span className={styles.gloss}>{f.pronounFr}</span> · {grammarLabel(f)}
                    </span>
                  </td>
                  <td className={styles.splitCell}>
                    <Breakdown form={f} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

    </div>
  )
}

function Legend() {
  return (
    <div className={styles.legend} aria-label="Code couleur">
      <ul>
        <li>
          <span className={`${styles.swatch} ${styles.swatchPronoun}`} aria-hidden /> Pronom personnel
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.swatchStem}`} aria-hidden /> Radical du verbe
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.swatchAffix}`} aria-hidden /> Préfixe et terminaison
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.swatchGloss}`} aria-hidden /> Traduction
        </li>
      </ul>
    </div>
  )
}

const ending = (id: string) => breakdown(formById(id)).ending
const verb = (id: string) => verbOf(formById(id))

/** À retenir : préfixe, terminaison, radical, puis personne, genre et nombre. */
export function ConjugationNotes() {
  return (
    <section className={styles.explain} aria-label="À retenir">

      <div className={styles.points}>
        <div>
          <h3>Un préfixe pour la personne</h3>
          <p>
            Le présent commence par une lettre ajoutée, toujours avec fatha dans ce modèle : <Affix>{formById('1cs').prefix}</Affix> pour «
            je », <Affix>{formById('1cp').prefix}</Affix> pour « nous », <Affix>{formById('2ms').prefix}</Affix> pour « tu », « vous », « elle » et « elles deux »,{' '}
            <Affix>{formById('3ms').prefix}</Affix> pour « il », « ils deux », « ils » et « elles » (trois ou plus).
          </p>
        </div>
        <div>
          <h3>Une terminaison pour le genre et le nombre</h3>
          <p>
            <Affix>{ending('3ms')}</Affix> au singulier et à la 1re personne, <Affix>{ending('3md')}</Affix> au duel,{' '}
            <Affix>{ending('3mp')}</Affix> au pluriel masculin, <Affix>{ending('2fs')}</Affix> pour « tu » au féminin,{' '}
            <Affix>{ending('3fp')}</Affix> au pluriel féminin.
          </p>
        </div>
        <div>
          <h3>Un radical stable</h3>
          <p>
            Entre les deux, <Ar>{MODEL.stem}</Ar> ne change jamais : <Ar>ف</Ar> sans voyelle, fatha sur <Ar>ع</Ar>. Cette fatha est propre au
            modèle <Ar>{MODEL.present}</Ar> ; d'autres verbes ont une autre voyelle à cet endroit (<Ar>يَكْتُبُ</Ar>,{' '}
            <Ar>يَجْلِسُ</Ar>). Elle s'apprend avec chaque verbe et ne se devine pas.
          </p>
        </div>
      </div>

      <dl className={styles.terms}>
        <div>
          <dt>Personne</dt>
          <dd>
            La 1re personne parle (je, nous), la 2e est celle à qui l'on parle (tu, vous), la 3e est celle dont on
            parle (il, elle, ils, elles).
          </dd>
        </div>
        <div>
          <dt>Genre</dt>
          <dd>
            À la 2e et à la 3e personne, l'arabe distingue masculin et féminin, y compris pour « tu » et « vous ».
            Le masculin pluriel vaut aussi pour un groupe mixte. « Je » et « nous » ne marquent pas le genre.
          </dd>
        </div>
        <div>
          <dt>Nombre</dt>
          <dd>
            Singulier (une personne), duel (exactement deux) et pluriel (trois ou plus). Au duel, masculin et
            féminin partagent souvent la même forme : <Ar>{verb('2md')}</Ar> sert pour <Ar>{formById('2md').pronoun}</Ar> (les deux genres)
            et pour <Ar>{formById('3fd').pronoun}</Ar> au féminin.
          </dd>
        </div>
      </dl>

      <p className={styles.caveat}>
        Une même forme peut donc répondre à plusieurs pronoms : <Ar>{verb('2ms')}</Ar> se dit avec <Ar>{formById('2ms').pronoun}</Ar> comme avec{' '}
        <Ar>{formById('3fs').pronoun}</Ar>. C'est le pronom, ou le contexte, qui lève l'ambiguïté. Cette fiche couvre uniquement le présent
        courant (indicatif) des verbes réguliers de ce type.
      </p>
    </section>
  )
}
