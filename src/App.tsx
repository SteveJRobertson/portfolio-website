import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { track, trackOutbound, type NavigateMethod } from './analytics/track';
import { TeletextScreen } from './components/TeletextScreen';
import { HeaderTicker } from './components/HeaderTicker';
import { FastTextBar } from './components/FastTextBar';
import { GridLine } from './components/GridLine';
import { MobileKeypad } from './components/MobileKeypad';
import { SemanticPage, type MirrorAction, type MirrorFocus } from './components/SemanticPage';
import { SettingsControls } from './components/SettingsControls';
import { HoldButton } from './components/HoldButton';
import { NAVIGABLE_PAGES, PAGES, QUICK_INDEX, getPage } from './content/registry';
import { documentTitle } from './content/meta';
import { useGridMode } from './display/useGridMode';
import { MORE_CONTRAST, REDUCED_MOTION, useMediaQuery, usePageVisible } from './display/useMediaQuery';
import { layoutBody } from './display/layout';
import { sidebarRows } from './display/sidebar';
import { useSubpage } from './hooks/useSubpage';
import { useDigitBuffer } from './navigation/useDigitBuffer';
import { useHotkeys } from './navigation/useHotkeys';
import { useNavigation } from './navigation/useNavigation';
import { crtEffectOn, useSettings, type Settings } from './settings/useSettings';
import { quiz } from './flummox/quizData';
import { useFlummox } from './flummox/useFlummox';
import { flummoxView, quizRules, resultAnnouncement, type FlummoxEffects } from './flummox/view';
import type { GameState } from './flummox/game';
import { SHARE_NETWORKS, scoreUrl, shareMessage } from './flummox/share';
import { fillSemanticSlots, fillSlots } from './flummox/slots';
import { FASTEXT_ORDER, type FastextActions } from './display/fastext';
import type { CompiledPage } from './types/teletext';

const SIDEBAR_ROWS = sidebarRows(QUICK_INDEX);
const PAGE_LIST = PAGES.filter((p) => NAVIGABLE_PAGES.includes(p.page));

/** Flummox!, the quiz: its page shows the game's current screen (docs/flummox). */
const QUIZ_PAGE = 152;
const QUIZ_RULES = quizRules(quiz);

/** Email opens the mail app; web addresses open in a new tab so the Teletext stays put. */
const openAddress = (href: string) => {
  trackOutbound(href);
  if (href.startsWith('mailto:')) window.location.href = href;
  else window.open(href, '_blank', 'noopener');
};

const SETTING_NAMES = { textMode: 'text mode', shortcuts: 'shortcuts', crt: 'crt' } as const;

export const App: React.FC = () => {
  const { page: requested, changes, navigate: goTo } = useNavigation();
  const [settings, saveSettings] = useSettings();

  // Each way of changing page is counted by how it was used (analytics SPEC §4.2).
  const nav = useMemo(() => {
    const by = (method: NavigateMethod) => (page: number) => {
      track('Navigate', { method });
      goTo(page);
    };
    return { digits: by('digits'), fastext: by('fastext'), link: by('link'), remote: by('remote') };
  }, [goTo]);
  const navigate = nav.link;

  const updateSettings = useCallback(
    (change: Partial<Settings>) => {
      for (const [name, on] of Object.entries(change)) {
        if (typeof on === 'boolean') track('Setting', { name: SETTING_NAMES[name as keyof Settings], on });
      }
      saveSettings(change);
    },
    [saveSettings],
  );
  const mode = useGridMode();

  // On the quiz page the body, mirror and Fastext come from the game's screen.
  const [announcement, setAnnouncement] = useState('');
  // Results are announced however the answer was given (SPEC §9).
  const announceResult = useCallback((next: GameState) => {
    const said = resultAnnouncement(next, quiz.questions.length);
    if (said) setAnnouncement(said);
  }, []);
  const flummox = useFlummox(quiz.edition, QUIZ_RULES, announceResult);
  const shared = {
    message: shareMessage(quiz.message, flummox.game.score),
    url: scoreUrl(`${window.location.origin}${import.meta.env.BASE_URL}`, flummox.game.score),
  };
  const effects: FlummoxEffects = {
    // The phone's own share sheet where there is one; otherwise, or if it fails, the list of networks.
    share: () => {
      if (!navigator.share) return flummox.dispatch({ type: 'share' });
      navigator.share({ text: shared.message, url: shared.url }).then(() => track('Flummox share', { network: 'share sheet' }), (e: unknown) => {
        if (!(e instanceof DOMException && e.name === 'AbortError')) flummox.dispatch({ type: 'share' });
      });
    },
    copy: () => {
      const text = `${shared.message} ${shared.url}`;
      if (!navigator.clipboard) return setAnnouncement("Copying isn't available here: select the message on screen.");
      navigator.clipboard.writeText(text).then(
        () => {
          track('Flummox share', { network: 'copy' });
          setAnnouncement('Copied the message and link.');
        },
        () => setAnnouncement("Couldn't copy: select the message on screen."),
      );
    },
  };
  const view = requested === QUIZ_PAGE ? flummoxView(quiz, flummox.game, flummox.best, flummox.newBest, flummox.dispatch, effects) : undefined;
  const shareLinks = SHARE_NETWORKS.map((n) => ({ name: n.name, href: n.href(shared.message, shared.url) }));
  const lastPage = useRef(requested);
  const { dispatch: dispatchGame } = flummox;
  useEffect(() => {
    // Coming back to the quiz from another page shows the intro, which offers to carry on.
    if (requested === QUIZ_PAGE && lastPage.current !== QUIZ_PAGE) dispatchGame({ type: 'open' });
    lastPage.current = requested;
  }, [requested, dispatchGame]);

  const source = getPage(requested)!;
  const fastextActions: FastextActions | undefined = view?.fastext.map((slot) => ('page' in slot ? undefined : slot));
  const page: CompiledPage = view
    ? {
        ...source,
        fastext: view.fastext.map((slot, i) => ('page' in slot ? slot : source.fastext[i])) as CompiledPage['fastext'],
        wide: [fillSlots(view.screen.wide, view.slots)],
        narrow: [fillSlots(view.screen.narrow, view.slots)],
        semantic: [
          [
            ...fillSemanticSlots(view.screen.semantic, view.slots),
            ...(flummox.game.screen === 'share'
              ? [{ kind: 'list' as const, items: shareLinks.map((l) => [{ text: `Share on ${l.name}`, href: l.href }]) }]
              : []),
          ],
        ],
      }
    : source;
  const heading = page.title;
  const visible = usePageVisible();

  // The game's keys as buttons in the mirror (SPEC §9), so it can be played with a screen reader or in Text mode.
  // A button press moves focus to the next screen's heading, since the button itself goes.
  const focusResult = useRef(false);
  const mirrorActions = view && {
    label: flummox.game.screen === 'question' ? 'Answers' : 'Game',
    items: view.fastext.flatMap((slot, i): MirrorAction[] => {
      if ('page' in slot) return [];
      const text = slot.name.replace(/^\w+: /, '');
      return [
        {
          name: flummox.game.screen === 'question' ? slot.name : text,
          text,
          color: flummox.game.screen === 'question' ? FASTEXT_ORDER[i] : undefined,
          twin: flummox.game.screen === 'question' ? `answer-${i}` : undefined,
          onPress: () => {
            focusResult.current = true;
            slot.onPress();
          },
        },
      ];
    }).filter((action, i, all) => all.findIndex((a) => a.text === action.text) === i),
  };
  const { screen: gameScreen, question: gameQuestion } = flummox.game;
  useEffect(() => {
    if (!focusResult.current) return;
    focusResult.current = false;
    document.querySelector<HTMLElement>('#content section h2')?.focus();
  }, [gameScreen, gameQuestion]);
  const reducedMotion = useMediaQuery(REDUCED_MOTION);
  const moreContrast = useMediaQuery(MORE_CONTRAST);
  const crt = crtEffectOn(settings.crt, reducedMotion || moreContrast);
  // Keyboard focus in the hidden mirror is shown by outlining its twin on screen.
  const [mirrorFocus, setMirrorFocus] = useState<MirrorFocus | null>(null);
  const subpage = useSubpage(requested, page.wide.length, {
    // Cycling waits while nobody can see it, or while someone is reading the mirror (Text mode shows every part at once).
    paused: !visible || mirrorFocus !== null || settings.textMode,
    startHeld: reducedMotion,
  });
  const buffer = useDigitBuffer(requested, nav.digits);

  // Focus goes to the page heading after a page change or a switch of view, but not on first load.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textMode = useRef(settings.textMode);
  useEffect(() => {
    if (changes > 0) headingRef.current?.focus();
  }, [changes]);
  useEffect(() => {
    if (textMode.current === settings.textMode) return;
    textMode.current = settings.textMode;
    headingRef.current?.focus();
  }, [settings.textMode]);

  const title = documentTitle(requested, heading);
  useEffect(() => {
    document.title = title;
  }, [title]);

  // Flummox! has its own "F" favicon in place of the site's "S"
  const quizOpen = requested === QUIZ_PAGE;
  useEffect(() => {
    const name = quizOpen ? 'favicon-flummox' : 'favicon';
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((link) => {
      const href = link.getAttribute('href') ?? '';
      link.setAttribute('href', href.replace(/favicon(-flummox)?(?=\.(ico|svg)$)/, name));
    });
  }, [quizOpen]);

  // Sub-page steps don't move focus, so the visitor's own steps and HOLD are announced.
  // Timed steps aren't (the mirror already has every part, so they'd only interrupt),
  // and neither are steps that follow focus into another part of the mirror.
  const stepSubpage = (delta: number) => {
    if (subpage.count < 2) return;
    subpage.step(delta);
    setAnnouncement(`Part ${((subpage.index + delta + subpage.count) % subpage.count) + 1} of ${subpage.count}`);
  };

  const toggleHold = () => {
    subpage.toggleHold();
    setAnnouncement(subpage.held ? 'Cycling' : `Held on part ${subpage.index + 1} of ${subpage.count}`);
  };

  useHotkeys({
    characterKeys: settings.shortcuts,
    arrowKeys: !settings.textMode,
    onDigit: buffer.digit,
    onClear: buffer.clear,
    onFastext: (slot) => {
      const action = fastextActions?.[slot];
      if (action) action.onPress();
      else nav.fastext(page.fastext[slot].page);
    },
    onSubpage: stepSubpage,
    onHold: () => {
      if (subpage.count > 1) toggleHold();
    },
  });

  const { index: subpageIndex, show: showSubpage } = subpage;
  const onMirrorFocus = useCallback(
    (focus: MirrorFocus | null) => {
      setMirrorFocus(focus);
      if (focus?.subpage !== undefined && focus.subpage !== subpageIndex) showSubpage(focus.subpage);
    },
    [subpageIndex, showSubpage],
  );

  const liveRegion = (
    <div role="status" className="sr-only">
      {announcement}
    </div>
  );

  const mirrorProps = { page, heading, headingRef, pages: PAGE_LIST, onNavigate: navigate, actions: mirrorActions };

  if (settings.textMode) {
    return (
      <div className="text-mode">
        <header className="text-mode__bar">
          <span>
            STEEVEFAX <span className="c-cyan">P{requested}</span>
          </span>
          <button type="button" onClick={() => updateSettings({ textMode: false })}>
            TELETEXT VIEW
          </button>
        </header>
        <SemanticPage {...mirrorProps} visible>
          {page.page === 888 && <SettingsControls settings={settings} onChange={updateSettings} />}
        </SemanticPage>
        {liveRegion}
      </div>
    );
  }

  const bodyRows = (mode.name === 'portrait' ? page.narrow : page.wide)[subpage.index];
  const lines = layoutBody(mode, bodyRows, SIDEBAR_ROWS);
  const twin = mirrorFocus?.twin;
  const focusLink = twin?.startsWith('link-') ? Number(twin.slice(5)) : undefined;
  const focusHref = twin?.startsWith('href:') ? twin.slice(5) : undefined;
  const focusAnswer = twin?.startsWith('answer-') ? Number(twin.slice(7)) : undefined;
  const twinOnScreen = lines.some((l) =>
    l.content.segments.some(
      (s) =>
        (focusLink !== undefined && s.link === focusLink) ||
        (focusHref !== undefined && s.href === focusHref) ||
        (focusAnswer !== undefined && s.answer === focusAnswer),
    ),
  );

  return (
    <>
      <a
        href="#content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          headingRef.current?.focus();
        }}
      >
        Skip to page content
      </a>

      <div className="teletext-wrapper" data-mode={mode.name}>
        <TeletextScreen mode={mode} crt={crt}>
          <HeaderTicker bufferText={buffer.text} currentPage={requested} cols={mode.cols} subpage={subpage} />

          {lines.map(({ key, ...line }) => (
            <GridLine
              key={key}
              {...line}
              onLink={navigate}
              onOpen={openAddress}
              focusHref={focusHref}
              focusLink={focusLink}
              focusAnswer={focusAnswer}
              onAnswer={
                !view
                  ? undefined
                  : flummox.game.screen === 'question'
                    ? (slot) => dispatchGame({ type: 'answer', slot })
                    : flummox.game.screen === 'share'
                      ? (slot) => openAddress(shareLinks[slot].href)
                      : undefined
              }
            />
          ))}

          <FastTextBar links={page.fastext} actions={fastextActions} onNavigate={nav.fastext} cols={mode.cols} row={mode.rows} />
        </TeletextScreen>

        <section className="control-strip" aria-label="Screen controls">
          <MobileKeypad
            buffer={buffer.text}
            onDigit={buffer.digit}
            onClear={buffer.clear}
            fastext={page.fastext}
            fastextActions={fastextActions}
            onNavigate={nav.remote}
            onSubpage={stepSubpage}
            hold={subpage.count > 1 ? { held: subpage.held, onToggle: toggleHold } : undefined}
            currentPage={requested}
          />
          {subpage.count > 1 && <HoldButton held={subpage.held} onToggle={toggleHold} />}
          {page.page === 888 && <SettingsControls settings={settings} onChange={updateSettings} crtOn={crt} />}
        </section>
      </div>

      <SemanticPage
        {...mirrorProps}
        visible={false}
        onFocusChange={onMirrorFocus}
        caption={mirrorFocus !== null && !twinOnScreen}
      />
      {liveRegion}
    </>
  );
};

export default App;
