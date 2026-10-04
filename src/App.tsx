import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TeletextScreen } from './components/TeletextScreen';
import { HeaderTicker } from './components/HeaderTicker';
import { FastTextBar } from './components/FastTextBar';
import { GridLine } from './components/GridLine';
import { MobileKeypad } from './components/MobileKeypad';
import { SemanticPage, type MirrorFocus } from './components/SemanticPage';
import { SettingsControls } from './components/SettingsControls';
import { NAVIGABLE_PAGES, PAGES, QUICK_INDEX, getPage } from './content/registry';
import { useGridMode } from './display/useGridMode';
import { layoutBody } from './display/layout';
import { sidebarRows } from './display/sidebar';
import { useSubpage } from './hooks/useSubpage';
import { useDigitBuffer } from './navigation/useDigitBuffer';
import { useHotkeys } from './navigation/useHotkeys';
import { useNavigation } from './navigation/useNavigation';
import { useSettings } from './settings/useSettings';

const SIDEBAR_ROWS = sidebarRows(QUICK_INDEX);
const PAGE_LIST = PAGES.filter((p) => NAVIGABLE_PAGES.includes(p.page));

export const App: React.FC = () => {
  const { page: requested, changes, navigate } = useNavigation();
  const [settings, updateSettings] = useSettings();
  const mode = useGridMode();

  const page = getPage(requested)!;
  const heading = page.title;
  const subpage = useSubpage(requested, page.wide.length);
  const buffer = useDigitBuffer(requested, navigate);

  useHotkeys({
    characterKeys: settings.shortcuts,
    arrowKeys: !settings.textMode,
    onDigit: buffer.digit,
    onClear: buffer.clear,
    onFastext: (slot) => navigate(page.fastext[slot].page),
    onSubpage: subpage.step,
  });

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

  useEffect(() => {
    document.title = `P${requested} ${heading} | Steve Robertson`;
  }, [requested, heading]);

  // Sub-page changes don't move focus, so they're announced. Not when focus itself moved there.
  const [announcement, setAnnouncement] = useState('');
  const shown = useRef({ page: requested, index: subpage.index });
  const followingFocus = useRef(false);
  useEffect(() => {
    const before = shown.current;
    shown.current = { page: requested, index: subpage.index };
    if (before.page !== requested || before.index === subpage.index) return;
    if (followingFocus.current) followingFocus.current = false;
    else setAnnouncement(`Part ${subpage.index + 1} of ${subpage.count}`);
  }, [requested, subpage.index, subpage.count]);

  // Keyboard focus in the hidden mirror is shown by outlining its twin on screen.
  const [mirrorFocus, setMirrorFocus] = useState<MirrorFocus | null>(null);
  const { index: subpageIndex, show: showSubpage } = subpage;
  const onMirrorFocus = useCallback(
    (focus: MirrorFocus | null) => {
      setMirrorFocus(focus);
      if (focus?.subpage !== undefined && focus.subpage !== subpageIndex) {
        followingFocus.current = true;
        showSubpage(focus.subpage);
      }
    },
    [subpageIndex, showSubpage],
  );

  const liveRegion = (
    <div role="status" className="sr-only">
      {announcement}
    </div>
  );

  const mirrorProps = { page, heading, headingRef, pages: PAGE_LIST, onNavigate: navigate };

  if (settings.textMode) {
    return (
      <div className="text-mode">
        <header className="text-mode__bar">
          <span>
            STEVE-TEXT <span className="c-cyan">P{requested}</span>
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
  const titleKey = `main-${Math.max(0, bodyRows.findIndex((row) => row.doubleHeight))}`;
  const twin = mirrorFocus?.twin;
  const focusLink = twin?.startsWith('link-') ? Number(twin.slice(5)) : undefined;
  const twinOnScreen =
    twin === 'title'
      ? lines.some((l) => l.key === titleKey)
      : focusLink !== undefined && lines.some((l) => l.content.segments.some((s) => s.link === focusLink));

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

      <div className="teletext-wrapper">
        <TeletextScreen mode={mode}>
          <HeaderTicker bufferText={buffer.text} currentPage={requested} cols={mode.cols} subpage={subpage} />

          {lines.map(({ key, ...line }) => (
            <GridLine
              key={key}
              {...line}
              onLink={navigate}
              focused={twin === 'title' && key === titleKey}
              focusLink={focusLink}
            />
          ))}

          <FastTextBar links={page.fastext} onNavigate={navigate} cols={mode.cols} row={mode.rows} />
        </TeletextScreen>

        <section className="control-strip" aria-label="Screen controls">
          <MobileKeypad
            buffer={buffer.text}
            onDigit={buffer.digit}
            onClear={buffer.clear}
            fastext={page.fastext}
            onNavigate={navigate}
            onSubpage={subpage.step}
            currentPage={requested}
          />
          {page.page === 888 && <SettingsControls settings={settings} onChange={updateSettings} />}
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
