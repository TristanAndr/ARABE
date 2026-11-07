import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  LEXICON,
  WBW_TEXTS,
  type VerseWord,
  type WbwText,
  type WbwVerse,
} from "../../data/wordByWord";
import { surahName } from "../../data/surahs";
import { pointsFor, scoreOf } from "../../revision/game";
import { useSpeech } from "../../revision/speech";
import {
  buildWordSession,
  fullRange,
  MASTERED,
  RANGE_MIN_VERSES,
  retryQuestion,
  textKeys,
  textRange,
  useMastery,
  useVerseRange,
  type Mastery,
  type VerseRange,
  type WordQuestion,
} from "../../revision/wordQuiz";
import { Burst, GameBar, GameEnd } from "../revision/Game";
import { PageTabs } from "../revision/PageTabs";
import { SpeakButton } from "../revision/SpeakButton";
import practice from "../revision/Practice.module.css";
import revision from "../revision/Revision.module.css";
import styles from "./WordByWord.module.css";

export type WbwTextId = WbwText["id"];

type Tab = "cours" | "jeu";

const TABS = [
  ["cours", "Le cours"],
  ["jeu", "S’entraîner"],
] as const;

interface Props {
  textId: WbwTextId;
  onText: (id: WbwTextId) => void;
}

export function WordByWordView({ textId, onText }: Props) {
  const speech = useSpeech();
  const canSpeak = speech !== "indisponible";
  const [tab, setTab] = useState<Tab>("cours");
  const { mastery, record } = useMastery();
  const text = WBW_TEXTS.find((t) => t.id === textId)!;
  const keys = useMemo(() => textKeys(text), [text]);
  const known = keys.filter((k) => (mastery[k] ?? 0) >= MASTERED).length;

  return (
    <article className={revision.sheet} aria-labelledby="page-title">
      <header>
        <h1 id="page-title" className={revision.title}>
          Mot à mot
          <span className={`arabic ${revision.titleAr}`} lang="ar" dir="rtl">
            كَلِمَةً كَلِمَةً
          </span>
        </h1>
      </header>

      <nav
        className={`${revision.categories} ${styles.texts}`}
        aria-label="Textes"
      >
        {WBW_TEXTS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={revision.category}
            aria-pressed={t.id === textId}
            onClick={() => onText(t.id)}
          >
            <span className={revision.categoryEmoji} aria-hidden="true">
              {t.emoji}
            </span>
            <span className={revision.categoryName}>{t.title}</span>
          </button>
        ))}
      </nav>

      <div className={styles.gauge}>
        <span className={styles.gaugeText}>
          <strong>{known}</strong> / {keys.length} mots acquis
        </span>
        <span className={styles.gaugeTrack} aria-hidden="true">
          <span
            className={styles.gaugeFill}
            style={{ width: `${(100 * known) / keys.length}%` }}
          />
        </span>
      </div>

      <PageTabs tabs={TABS} value={tab} onChange={setTab} />

      <div key={text.id}>
        {tab === "cours" ? (
          <Lesson text={text} mastery={mastery} canSpeak={canSpeak} />
        ) : (
          <WordGame
            text={text}
            mastery={mastery}
            onAnswer={record}
            canSpeak={canSpeak}
          />
        )}
      </div>
    </article>
  );
}

/** Référence affichée : sourate et verset, ou partie du tashahhud. */
const verseRef = (v: WbwVerse) =>
  v.surah
    ? `${surahName(v.surah)} · ${v.surah}:${v.ayah}`
    : `Tashahhud · partie ${v.id.split(":")[1]}`;

/** Nom du bloc pour les lecteurs d'écran (et les tests). */
const verseLabel = (v: WbwVerse) =>
  v.surah ? `Verset ${v.id}` : `Tashahhud, partie ${v.id.split(":")[1]}`;

/** Le cours : chaque verset mot par mot ; un mot touché montre son découpage. */
function Lesson({
  text,
  mastery,
  canSpeak,
}: {
  text: WbwText;
  mastery: Mastery;
  canSpeak: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className={styles.lesson}>
      {text.verses.map((verse) => {
        const id = verse.id;
        const selected = open?.startsWith(id + ":")
          ? verse.words[Number(open.slice(id.length + 1))]
          : undefined;
        return (
          <section
            key={id}
            className={styles.verse}
            aria-label={verseLabel(verse)}
          >
            <p className={styles.verseRef}>
              <span>{verseRef(verse)}</span>
              {canSpeak && (
                <SpeakButton
                  text={verse.words.map((w) => w.ar).join(" ")}
                  label={`Écouter : ${verseLabel(verse).toLowerCase()}`}
                />
              )}
            </p>
            <ol className={styles.words} dir="rtl">
              {verse.words.map((w, i) => {
                const wid = `${id}:${i}`;
                const lemma = LEXICON[w.key]!;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      className={styles.word}
                      aria-expanded={open === wid}
                      data-known={
                        (mastery[w.key] ?? 0) >= MASTERED || undefined
                      }
                      onClick={() => setOpen(open === wid ? null : wid)}
                    >
                      <span className={`arabic ${styles.wordAr}`} lang="ar">
                        {w.ar}
                      </span>
                      <span className={styles.wordTr} dir="ltr">
                        {w.tr}
                      </span>
                      <span className={styles.wordFr} dir="ltr">
                        {lemma.fr}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {selected && <WordDetail word={selected} canSpeak={canSpeak} />}
            <p className={styles.verseFr}>{verse.fr}</p>
          </section>
        );
      })}
    </div>
  );
}

const KIND_LABELS = {
  nom: "nom",
  verbe: "verbe",
  pronom: "pronom",
  particule: "particule",
} as const;

function WordDetail({
  word,
  canSpeak,
}: {
  word: VerseWord;
  canSpeak: boolean;
}) {
  const lemma = LEXICON[word.key]!;
  return (
    <div className={styles.detail} role="status">
      <p className={styles.detailHead}>
        <span className={`arabic ${styles.detailAr}`} lang="ar" dir="rtl">
          {word.ar}
        </span>
        {canSpeak && (
          <SpeakButton text={word.ar} label={`Écouter ${word.ar}`} />
        )}
        <span className={styles.detailFr}>
          {lemma.fr}{" "}
          <span className={styles.kind}>· {KIND_LABELS[lemma.kind]}</span>
        </span>
      </p>
      {lemma.parts && (
        <ol className={styles.parts} dir="rtl">
          {lemma.parts.map(([ar, fr], i) => (
            <li key={i}>
              {i > 0 && (
                <span className={styles.plus} aria-hidden="true">
                  +
                </span>
              )}
              <span className={`arabic ${styles.partAr}`} lang="ar">
                {ar}
              </span>
              <span className={styles.partFr} dir="ltr">
                {fr}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Le verset du jeu, le mot demandé surligné. */
function VerseWithTarget({ verse, index }: { verse: WbwVerse; index: number }) {
  return (
    <p className={`arabic ${styles.gameVerse}`} lang="ar" dir="rtl">
      {verse.words.map((w, i) => (
        <span key={i}>
          {i > 0 && " "}
          {i === index ? (
            <mark className={styles.target}>{w.ar}</mark>
          ) : (
            <span className={styles.dim}>{w.ar}</span>
          )}
        </span>
      ))}
    </p>
  );
}

function WordGame({
  text,
  mastery,
  onAnswer,
  canSpeak,
}: {
  text: WbwText;
  mastery: Mastery;
  onAnswer: (key: string, correct: boolean) => void;
  canSpeak: boolean;
}) {
  const [range, setRange] = useVerseRange(text);
  const pool = useMemo(() => textRange(text, range), [text, range]);
  const [questions, setQuestions] = useState<WordQuestion[]>(() =>
    buildWordSession(pool, mastery),
  );
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<boolean[]>([]);
  const [choice, setChoice] = useState("");

  const question = questions[index];
  const outcome = outcomes[index];
  const answered = outcome !== undefined;
  const correctCount = outcomes.filter(Boolean).length;
  const missed = new Set(
    questions.filter((_, i) => outcomes[i] === false).map((q) => q.key),
  ).size;

  const firstField = useRef<HTMLInputElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) return;
    if (answered) nextButton.current?.focus();
    else firstField.current?.focus();
  }, [answered, index, questions]);

  function restart(from: WbwText = pool) {
    started.current = true;
    setQuestions(buildWordSession(from, mastery));
    setIndex(0);
    setOutcomes([]);
    setChoice("");
  }

  function validate() {
    if (!question || answered || !choice) return;
    started.current = true;
    const correct = choice === question.key;
    setOutcomes((o) => [...o, correct]);
    onAnswer(question.key, correct);
    // Un mot raté revient une fois en fin de série.
    if (!correct && !question.retry)
      setQuestions((qs) => [...qs, retryQuestion(pool, question.key)]);
  }

  function next() {
    started.current = true;
    setIndex((i) => i + 1);
    setChoice("");
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (answered) next();
    else validate();
  }

  function onKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter" || e.target instanceof HTMLButtonElement) return;
    e.preventDefault();
    submit();
  }

  const word =
    question && question.occurrence.verse.words[question.occurrence.index]!;
  const lemma = question && LEXICON[question.key]!;

  return (
    <section className={practice.practice} aria-labelledby="practice-title">
      <h2 id="practice-title" className="visually-hidden">
        Entraînement
      </h2>

      {text.verses.length >= RANGE_MIN_VERSES && (
        <RangePicker
          text={text}
          range={range}
          onChange={(next) => {
            setRange(next);
            restart(textRange(text, next));
          }}
        />
      )}

      <GameBar results={outcomes} total={questions.length} />

      <div className={practice.status} aria-live="polite">
        <span>
          {question ? (
            <>
              Question {index + 1} <span className={practice.muted}>sur</span>{" "}
              {questions.length}
            </>
          ) : (
            "Série terminée"
          )}
        </span>
        <span>
          Correctes : <strong>{correctCount}</strong> / {outcomes.length}
        </span>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => restart()}
        >
          Recommencer
        </button>
      </div>

      {question && word && lemma ? (
        <form
          className={practice.form}
          onSubmit={submit}
          onKeyDown={onKeyDown}
          noValidate
        >
          <Burst trigger={outcome ? index : null} />
          <div className={practice.prompt}>
            <p className={practice.promptLabel}>
              {question.retry
                ? "On le revoit : que veut dire ce mot ?"
                : "Que veut dire ce mot ?"}
            </p>
            <VerseWithTarget
              verse={question.occurrence.verse}
              index={question.occurrence.index}
            />
            <p className={styles.gameRef}>
              {verseRef(question.occurrence.verse)}
              {canSpeak && (
                <SpeakButton text={word.ar} label="Écouter le mot" />
              )}
            </p>
          </div>

          <fieldset className={`${practice.options} ${styles.gameOptions}`}>
            <legend className="visually-hidden">Réponses proposées</legend>
            {question.options.map((key, i) => (
              <label
                key={key}
                className={practice.option}
                data-state={optionState(
                  outcome,
                  key === choice,
                  key === question.key,
                )}
              >
                <input
                  ref={i === 0 ? firstField : undefined}
                  type="radio"
                  name="sens"
                  value={key}
                  checked={choice === key}
                  disabled={answered}
                  onChange={() => setChoice(key)}
                />
                <span className={practice.optionFr}>{LEXICON[key]!.fr}</span>
              </label>
            ))}
          </fieldset>

          {answered && (
            <div
              className={practice.outcome}
              role="status"
              aria-label="Résultat"
            >
              <p className={outcome ? practice.right : practice.wrong}>
                {outcome ? "Juste. 🎉" : "Pas tout à fait. 🙈"}
                {outcome && (
                  <span className={practice.earned}>
                    +{pointsFor(scoreOf(outcomes.slice(0, index + 1)).combo)}{" "}
                    pts
                  </span>
                )}
              </p>
              <WordDetail word={word} canSpeak={canSpeak} />
              <p className={styles.outcomeVerse}>
                {question.occurrence.verse.fr}
              </p>
            </div>
          )}

          <div className={practice.actions}>
            {answered ? (
              <button
                ref={nextButton}
                type="button"
                className="btn btn-secondary"
                onClick={next}
              >
                {index + 1 < questions.length
                  ? "Question suivante"
                  : "Voir le résultat"}
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!choice}
              >
                Valider
              </button>
            )}
            <kbd>Entrée</kbd>
          </div>
        </form>
      ) : (
        <GameEnd
          results={outcomes}
          total={outcomes.length}
          detail={
            missed === 0
              ? "Tous les mots sont justes."
              : `${missed} mot${missed > 1 ? "s" : ""} à revoir dans le cours.`
          }
          onAgain={() => restart()}
        />
      )}
    </section>
  );
}

/** Choix des versets travaillés : « du verset 1 au verset 12 ». */
function RangePicker({
  text,
  range,
  onChange,
}: {
  text: WbwText;
  range: VerseRange;
  onChange: (r: VerseRange) => void;
}) {
  const unit = text.verses[0]?.surah ? "verset" : "partie";
  const numbers = text.verses.map((_, i) => i + 1);
  const words = textKeys(textRange(text, range)).length;
  const full = fullRange(text);
  const isFull = range.from === full.from && range.to === full.to;
  return (
    <div
      className={styles.range}
      role="group"
      aria-label={`${unit === "verset" ? "Versets" : "Parties"} travaillés`}
    >
      <label className={styles.rangeField}>
        Du {unit}
        <span className={styles.select}>
          <select
            value={range.from}
            onChange={(e) => {
              const from = Number(e.target.value);
              onChange({ from, to: Math.max(from, range.to) });
            }}
          >
            {numbers.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </span>
      </label>
      <label className={styles.rangeField}>
        au {unit}
        <span className={styles.select}>
          <select
            value={range.to}
            onChange={(e) => {
              const to = Number(e.target.value);
              onChange({ from: Math.min(range.from, to), to });
            }}
          >
            {numbers.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </span>
      </label>
      <span className={styles.rangeCount}>
        {words} mot{words > 1 ? "s" : ""}
      </span>
      {!isFull && (
        <button
          type="button"
          className="btn btn-link"
          onClick={() => onChange(full)}
        >
          Tout le texte
        </button>
      )}
    </div>
  );
}

function optionState(
  outcome: boolean | undefined,
  chosen: boolean,
  right: boolean,
): string | undefined {
  if (outcome === undefined) return chosen ? "chosen" : undefined;
  if (right) return "right";
  if (chosen) return "wrong";
  return undefined;
}
