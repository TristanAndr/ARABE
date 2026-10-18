import { useMemo, useState } from 'react'
import { DEFAULT_NORMALIZATION } from '../../compare/normalize'
import type { Progress } from '../../state/progress'
import { DEFAULT_SETTINGS, type Settings } from '../../state/settings'
import { PHONEMES, type Phoneme } from '../../translit/phonemes'
import {
  findConflicts,
  formatSpellingList,
  parseSpellingList,
  resolveSpellings,
  type Overrides,
  type ProfileId,
} from '../../translit/profiles'
import { MappingTable } from './MappingTable'
import { ProfileChooser } from './ProfileChooser'
import { RulesSection } from './RulesSection'
import { SessionSection } from './SessionSection'
import { SourcesSection } from './SourcesSection'
import styles from './Settings.module.css'

interface Props {
  settings: Settings
  onSave: (s: Settings) => void
  onClose: () => void
  closeLabel?: string
  progress: Progress
  onRestart: () => void
  onResetStats: () => void
}

type Cells = Partial<Record<Phoneme, string>>

function cellsFrom(overrides: Overrides): Cells {
  const cells: Cells = {}
  for (const p of PHONEMES) {
    const o = overrides[p]
    if (o) cells[p] = formatSpellingList(o)
  }
  return cells
}

/** Lit les cellules saisies : surcharges valides et entrées refusées par phonème. */
function readCells(cells: Cells) {
  const overrides: Overrides = {}
  const invalid: Partial<Record<Phoneme, string[]>> = {}
  for (const p of PHONEMES) {
    const text = cells[p]
    if (!text) continue
    const parsed = parseSpellingList(text)
    if (parsed.spellings.length > 0) overrides[p] = parsed.spellings
    if (parsed.invalid.length > 0) invalid[p] = parsed.invalid
  }
  return { overrides, invalid }
}

export function SettingsView({
  settings,
  onSave,
  onClose,
  closeLabel = "Retour à l'exercice",
  progress,
  onRestart,
  onResetStats,
}: Props) {
  const [draft, setDraft] = useState<Settings>(settings)
  const [cells, setCells] = useState<Cells>(() => cellsFrom(settings.overrides))
  const [savedFlash, setSavedFlash] = useState(false)

  const { overrides, invalid } = useMemo(() => readCells(cells), [cells])
  const next: Settings = { ...draft, overrides }
  const dirty = JSON.stringify(next) !== JSON.stringify(settings)
  const hasInvalid = Object.keys(invalid).length > 0
  const conflicts = findConflicts(resolveSpellings(next), next.normalization.ignoreCase)

  const update = (patch: Partial<Settings>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setSavedFlash(false)
  }

  function editCell(p: Phoneme, text: string) {
    setCells((c) => ({ ...c, [p]: text }))
    setSavedFlash(false)
    // Modifier une correspondance depuis un préréglage crée un profil personnalisé fondé sur lui.
    if (draft.profileId !== 'custom') update({ profileId: 'custom', customBase: draft.profileId })
  }

  function save() {
    if (hasInvalid) return
    onSave(next)
    setDraft(next)
    setCells(cellsFrom(next.overrides))
    setSavedFlash(true)
  }

  function discard() {
    setDraft(settings)
    setCells(cellsFrom(settings.overrides))
  }

  function restoreDefaults() {
    update({
      profileId: DEFAULT_SETTINGS.profileId,
      customBase: DEFAULT_SETTINGS.customBase,
      normalization: DEFAULT_NORMALIZATION,
    })
    setCells({})
  }

  function close() {
    if (dirty && !window.confirm('Quitter sans enregistrer les modifications ?')) return
    onClose()
  }

  const basePreset = draft.profileId === 'custom' ? draft.customBase : draft.profileId

  return (
    <div className={styles.settings}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Paramètres</h1>
        <button type="button" className="btn btn-link" onClick={close}>
          {closeLabel}
        </button>
      </div>

      <ProfileChooser
        profileId={draft.profileId}
        customBase={draft.customBase}
        onProfile={(profileId: ProfileId) => update({ profileId })}
        onBase={(customBase) => update({ customBase })}
      />

      <MappingTable
        base={basePreset}
        cells={cells}
        invalid={invalid}
        onEdit={editCell}
        conflicts={conflicts}
      />

      <RulesSection
        normalization={draft.normalization}
        onChange={(normalization) => update({ normalization })}
      />

      <SessionSection
        order={draft.order}
        theme={draft.theme}
        onOrder={(order) => update({ order })}
        onTheme={(theme) => update({ theme })}
        progress={progress}
        onRestart={onRestart}
        onResetStats={onResetStats}
      />

      <SourcesSection />

      <div className={styles.saveBar}>
        <div className={styles.saveInner}>
          <span className={styles.saveStatus} aria-live="polite">
            {hasInvalid
              ? 'Certaines graphies sont invalides.'
              : dirty
                ? 'Modifications non enregistrées.'
                : savedFlash
                  ? 'Paramètres enregistrés.'
                  : ''}
          </span>
          <div className={styles.saveActions}>
            <button type="button" className="btn btn-link" onClick={restoreDefaults}>
              Restaurer les valeurs par défaut
            </button>
            {dirty && (
              <button type="button" className="btn btn-secondary" onClick={discard}>
                Annuler
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={save} disabled={!dirty || hasInvalid}>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
