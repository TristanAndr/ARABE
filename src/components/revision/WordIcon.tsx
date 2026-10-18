import type { ReactElement } from 'react'
import type { VocabWord } from '../../revision/vocabulary'
import { VEGETABLE_DRAWINGS } from './vegetableDrawings'
import vocab from './Vocabulary.module.css'

/**
 * Petits dessins pour les fruits qu'Unicode n'a pas en emoji, dans le même esprit que les
 * emojis voisins.
 */
const DRAWINGS: Record<string, ReactElement> = {
  grenade: (
    <>
      <path d="M12 8.5 12.6 3l2.4 3 1-4 1 4 2.4-3 .6 5.5Z" fill="#a3172b" />
      <circle cx="16" cy="18.5" r="11" fill="#d7263d" />
      <ellipse cx="11.5" cy="14" rx="3.2" ry="2" fill="#fff" opacity="0.35" transform="rotate(-30 11.5 14)" />
      <circle cx="19.5" cy="21" r="1.3" fill="#ff9aa8" />
      <circle cx="15.5" cy="24" r="1.3" fill="#ff9aa8" />
      <circle cx="21.5" cy="16.5" r="1.3" fill="#ff9aa8" />
    </>
  ),
  figue: (
    <>
      <path d="M16 6.5 17 2" stroke="#5b7f2a" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 6c-2 4-10 7.5-10 15.5a10 10 0 0 0 20 0C26 13.5 18 10 16 6Z" fill="#7b3f8c" />
      <ellipse cx="11.5" cy="19" rx="2.3" ry="4.5" fill="#fff" opacity="0.25" transform="rotate(15 11.5 19)" />
      <path d="M14.5 29.6h3" stroke="#4e2259" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  abricot: (
    <>
      <path d="M16 9.5 16.6 5.5" stroke="#7a4a2e" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 7c2-4.5 7.5-4.5 9-2.5-2 3.2-6 3.8-9 2.5Z" fill="#5aa53a" />
      <circle cx="16" cy="18.5" r="11" fill="#f6a33b" />
      <path d="M16 8.5c-4 6-4 14 0 20.5" stroke="#e07f22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="11" cy="14.5" rx="3" ry="2" fill="#fff" opacity="0.4" transform="rotate(-30 11 14.5)" />
    </>
  ),
}

/** Emoji ou dessin du mot, décoratif : le mot français suffit aux lecteurs d'écran. */
export function WordIcon({ word, className }: { word: VocabWord; className?: string }) {
  const drawing = DRAWINGS[word.id]
  const vegetable = VEGETABLE_DRAWINGS[word.id]
  if (!word.emoji && !drawing && !vegetable) return null
  return (
    <span className={`${vocab.emoji} ${className ?? ''}`} aria-hidden="true">
      {word.emoji ??
        (drawing ? (
          <svg className={vocab.drawing} viewBox="0 0 32 32" width="1em" height="1em" focusable="false">
            {drawing}
          </svg>
        ) : (
          // Dessin statique du support de cours, sans script ni lien.
          <svg
            className={vocab.drawing}
            viewBox="0 0 100 100"
            width="1.25em"
            height="1.25em"
            focusable="false"
            dangerouslySetInnerHTML={{ __html: vegetable! }}
          />
        ))}
    </span>
  )
}

/**
 * Mot français dans sa couleur, précédé de son emoji. Blanc et noir gardent la couleur du
 * texte : écrits tels quels, l'un des deux serait illisible selon le thème.
 */
export function FrenchWord({
  word,
  iconClassName,
  icon = true,
}: {
  word: VocabWord
  iconClassName?: string
  /** Sans emoji quand il est déjà affiché à part (grand, au-dessus). */
  icon?: boolean
}) {
  return (
    <>
      {icon && <WordIcon word={word} className={iconClassName} />}
      <span style={word.tint ? { color: word.tint } : undefined}>
        {word.fr}
      </span>
    </>
  )
}
