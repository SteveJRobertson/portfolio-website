import React, { Fragment, useEffect, useRef } from 'react';
import type { CompiledPage, FastextLink, SemanticBlock, SemanticInline } from '../types/teletext';
import { FASTEXT_ORDER, fastextName } from '../display/fastext';
import { isPlainClick, pageHref } from '../navigation/paths';

/** Where focus is in the semantic mirror, so the grid can outline the same thing. */
export interface MirrorFocus {
  /** "link-NNN" for a page link, "href:…" for an address. Null when the focused element has no twin on screen. */
  twin: string | null;
  /** The sub-page the focused element belongs to. */
  subpage?: number;
}

interface SemanticPageProps {
  page: CompiledPage;
  /** The heading text (the page title). */
  heading: string;
  headingRef: React.Ref<HTMLHeadingElement>;
  /** Every page, for the page list. */
  pages: readonly CompiledPage[];
  onNavigate: (page: number) => void;
  /** Text mode shows this tree as a readable page; otherwise it is visually hidden behind the grid. */
  visible: boolean;
  /** Called when keyboard focus moves within the tree, and with null when it leaves. */
  onFocusChange?: (focus: MirrorFocus | null) => void;
  /** Set when the focused element has no twin on screen: it then shows itself as a caption instead. */
  caption?: boolean;
  /** Shown at the end of the page content (the 888 switches in Text mode). */
  children?: React.ReactNode;
}

const PageLink: React.FC<{ page: number; onNavigate: (page: number) => void; children: React.ReactNode; label?: string }> = ({
  page,
  onNavigate,
  children,
  label,
}) => (
  <a
    href={pageHref(page)}
    aria-label={label}
    data-twin={`link-${page}`}
    onClick={(e) => {
      if (!isPlainClick(e)) return;
      e.preventDefault();
      onNavigate(page);
    }}
  >
    {children}
  </a>
);

const Inline: React.FC<{ content: SemanticInline[]; onNavigate: (page: number) => void }> = ({ content, onNavigate }) => (
  <>
    {content.map((run, i) =>
      run.page !== undefined ? (
        <PageLink key={i} page={run.page} onNavigate={onNavigate}>
          {run.text}
        </PageLink>
      ) : run.href ? (
        <a key={i} href={run.href} data-twin={`href:${run.href}`}>
          {run.text}
        </a>
      ) : (
        <Fragment key={i}>{run.text}</Fragment>
      ),
    )}
  </>
);

const Block: React.FC<{ block: SemanticBlock; onNavigate: (page: number) => void }> = ({ block, onNavigate }) => {
  if (block.kind === 'heading') {
    return (
      <h2>
        <Inline content={block.content} onNavigate={onNavigate} />
      </h2>
    );
  }
  if (block.kind === 'list') {
    return (
      <ul>
        {block.items.map((item, i) => (
          <li key={i}>
            <Inline content={item} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p>
      <Inline content={block.content} onNavigate={onNavigate} />
    </p>
  );
};

const isFocusVisible = (el: Element) => {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
};

/**
 * The semantic mirror (SPEC §9): the same content as the grid, as headings,
 * paragraphs, lists and real links. It is hidden behind the grid for screen
 * readers, and is the page itself in Text mode, so the two can't drift.
 */
export const SemanticPage: React.FC<SemanticPageProps> = ({
  page,
  heading,
  headingRef,
  pages,
  onNavigate,
  visible,
  onFocusChange,
  caption = false,
  children,
}) => {
  const root = useRef<HTMLDivElement>(null);
  const multi = page.semantic.length > 1;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-caption]').forEach((n) => n.removeAttribute('data-caption'));
    const active = document.activeElement;
    if (caption && active && el.contains(active)) active.setAttribute('data-caption', '');
  });

  const onFocus = (e: React.FocusEvent) => {
    const el = e.target as HTMLElement;
    if (!onFocusChange) return;
    // The heading takes focus after navigation so screen readers announce it; it isn't a control, so nothing is outlined.
    if (el.tagName === 'H1' || !isFocusVisible(el)) return onFocusChange(null);
    const twin = el.closest('[data-twin]')?.getAttribute('data-twin');
    const subpage = (el.closest('[data-subpage]') as HTMLElement | null)?.dataset.subpage;
    onFocusChange({ twin: twin && twin !== 'none' ? twin : null, subpage: subpage === undefined ? undefined : Number(subpage) });
  };

  const onBlur = (e: React.FocusEvent) => {
    if (!root.current?.contains(e.relatedTarget as Node | null)) onFocusChange?.(null);
  };

  return (
    <div ref={root} className={visible ? 'mirror mirror--visible' : 'mirror mirror--hidden'} onFocus={onFocus} onBlur={onBlur}>
      <main id="content">
        <h1 ref={headingRef} tabIndex={-1}>
          {heading}
        </h1>
        {page.semantic.map((blocks, i) => (
          <section key={i} data-subpage={i} aria-label={multi ? `Part ${i + 1} of ${page.semantic.length}` : undefined}>
            {blocks.map((block, j) => (
              <Block key={j} block={block} onNavigate={onNavigate} />
            ))}
          </section>
        ))}
        {children}
      </main>

      {visible && <FastextNav links={page.fastext} onNavigate={onNavigate} />}

      <nav aria-label="All pages" className="mirror__pages">
        <h2>All pages</h2>
        <ul>
          {pages.map((p) => (
            <li key={p.page}>
              <PageLink page={p.page} onNavigate={onNavigate}>
                {p.page} {p.title}
              </PageLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const FastextNav: React.FC<{ links: readonly FastextLink[]; onNavigate: (page: number) => void }> = ({ links, onNavigate }) => (
  <nav aria-label="Fastext" className="mirror__fastext">
    {FASTEXT_ORDER.map((color, i) => (
      <PageLink key={color} page={links[i].page} onNavigate={onNavigate} label={fastextName(i, links[i])}>
        <span className={`mirror__swatch bg-${color}`} aria-hidden="true" /> {links[i].page} {links[i].label}
      </PageLink>
    ))}
  </nav>
);
