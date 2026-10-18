import { useRef, useState, type Ref } from 'react'
import { formOf, LETTERS, letterAt, POSITIONS, type Letter } from '../../alphabet/letters'
import type { Spellings } from '../../translit/profiles'
import { AlphabetQuiz } from './AlphabetQuiz'
import styles from './Alphabet.module.css'

type Tab = 'lettres' | 'tableau' | 'revision'

interface Props {
  spellings: Spellings
}

export function AlphabetView({ spellings }: Props) {
  const [tab, setTab] = useState<Tab>('lettres')
  const [selected, setSelected] = useState<number | null>(null)
  const detailRef = useRef<HTMLElement>(null)

  function open(index: number) {
    setSelected(index)
    requestAnimationFrame(() => detailRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }))
  }

  return (
    <article className={styles.alphabet} aria-labelledby="alphabet-title">
      <header>
        <p className={styles.kicker}>Fiche · écriture</p>
        <h1 id="alphabet-title" className={styles.title}>
          L’alphabet arabe
          <span className={`arabic ${styles.titleAr}`} lang="ar" dir="rtl">
            حُرُوفُ الهِجَاءِ
          </span>
        </h1>
      </header>

      <div className={styles.tabs} role="group" aria-label="Affichage">
        {(
          [
            ['lettres', 'Lettres'],
            ['tableau', 'Tableau'],
            ['revision', 'S’entraîner'],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            className={styles.tab}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'lettres' && (
        <>
          {selected !== null && (
            <LetterDetail
              ref={detailRef}
              letter={letterAt(selected)}
              spellings={spellings}
              onPrev={selected > 1 ? () => setSelected(selected - 1) : undefined}
              onNext={selected < LETTERS.length ? () => setSelected(selected + 1) : undefined}
              onClose={() => setSelected(null)}
            />
          )}
          <LetterGrid selected={selected} onSelect={open} />
        </>
      )}
      {tab === 'tableau' && <LetterTable />}
      {tab === 'revision' && <AlphabetQuiz />}
    </article>
  )
}

function LetterGrid({ selected, onSelect }: { selected: number | null; onSelect: (index: number) => void }) {
  return (
    <section className={styles.gridSection} aria-label="Les 28 lettres">
      <ol className={styles.grid} dir="rtl" aria-label="Lettres de l’alphabet">
        {LETTERS.map((l) => (
          <li key={l.letter}>
            <button
              type="button"
              className={styles.cell}
              aria-current={selected === l.index ? 'true' : undefined}
              aria-label={l.name}
              onClick={() => onSelect(l.index)}
            >
              <span className={`arabic ${styles.cellLetter}`} lang="ar">
                {l.letter}
              </span>
              <span className={styles.cellName} dir="ltr">
                {l.name}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

interface DetailProps {
  letter: Letter
  spellings: Spellings
  onPrev?: () => void
  onNext?: () => void
  onClose: () => void
  ref: Ref<HTMLElement>
}

function LetterDetail({ letter, spellings, onPrev, onNext, onClose, ref }: DetailProps) {
  const prev = onPrev ? letterAt(letter.index - 1) : null
  const next = onNext ? letterAt(letter.index + 1) : null
  const profile = letter.phoneme ? spellings[letter.phoneme][0] : null
  return (
    <section ref={ref} className={styles.detail} aria-labelledby="letter-title" tabIndex={-1}>
      <div className={styles.detailHead}>
        <p className={styles.detailIndex}>
          Lettre {letter.index} sur 28
        </p>
        <button type="button" className="btn btn-link" onClick={onClose}>
          Fermer
        </button>
      </div>

      <div className={styles.detailMain}>
        <p className={`arabic ${styles.bigLetter}`} lang="ar" dir="rtl">
          {letter.letter}
        </p>
        <div className={styles.identity}>
          <h2 id="letter-title" className={styles.letterName}>
            {letter.name}
            <span className={`arabic ${styles.letterNameAr}`} lang="ar" dir="rtl">
              {letter.nameAr}
            </span>
          </h2>
          <dl className={styles.facts}>
            <div>
              <dt>Prononciation</dt>
              <dd>{letter.sound}</dd>
            </div>
            {letter.hint && (
              <div>
                <dt>Précision</dt>
                <dd>{letter.hint}</dd>
              </div>
            )}
            {profile && (
              <div>
                <dt>Ta transcription</dt>
                <dd>
                  <span className={styles.translit}>{profile}</span>
                  <span className={styles.muted}> (profil de translittération actif)</span>
                </dd>
              </div>
            )}
            <div>
              <dt>Liaison</dt>
              <dd>
                {letter.joinsNext
                  ? 'Se lie à la lettre précédente et à la suivante.'
                  : 'Se lie à la lettre précédente, jamais à la suivante.'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <ol className={styles.forms}>
        {POSITIONS.map((p) => {
          const form = formOf(letter, p.position)
          return (
            <li key={p.position} className={styles.form} data-missing={form === null}>
              <span className={styles.formLabel}>{p.label}</span>
              {form ? (
                <span className={`arabic ${styles.formGlyph}`} lang="ar" dir="rtl">
                  {form}
                </span>
              ) : (
                <span className={styles.formMissing}>
                  <span aria-hidden>—</span>
                  <span className={styles.formMissingText}>n’existe pas</span>
                </span>
              )}
              <span className={styles.formNote}>{form ? p.note : 'ne se lie pas à la suivante'}</span>
            </li>
          )
        })}
      </ol>

      <nav className={styles.pager} aria-label="Lettre précédente ou suivante">
        <button type="button" className="btn btn-secondary" onClick={onPrev} disabled={!onPrev}>
          ← <span className="visually-hidden">Précédente : </span>
          {prev ? prev.name : 'Précédente'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onNext} disabled={!onNext}>
          <span className="visually-hidden">Suivante : </span>
          {next ? next.name : 'Suivante'} →
        </button>
      </nav>
    </section>
  )
}

function LetterTable() {
  return (
    <section className={styles.tableSection} aria-label="Tableau récapitulatif">
      <table className={styles.table}>
        <caption className={styles.caption}>
          Les 28 lettres et leurs formes. « — » : forme inexistante, la lettre ne se liant pas à la suivante.
        </caption>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            {POSITIONS.map((p) => (
              <th key={p.position} scope="col">
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LETTERS.map((l) => (
            <tr key={l.letter} data-letter={l.letter} data-joins={l.joinsNext}>
              <th scope="row">
                <span className={styles.tableName}>{l.name}</span>
                <span className={`arabic ${styles.tableNameAr}`} lang="ar" dir="rtl">
                  {l.nameAr}
                </span>
              </th>
              {POSITIONS.map((p) => {
                const form = formOf(l, p.position)
                return (
                  <td key={p.position}>
                    {form ? (
                      <span className={`arabic ${styles.tableGlyph}`} lang="ar" dir="rtl">
                        {form}
                      </span>
                    ) : (
                      <span className={styles.tableMissing} aria-label="n’existe pas" title="Forme inexistante : ne se lie pas à la lettre suivante">
                        —
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
