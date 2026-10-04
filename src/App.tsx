import React from 'react';
import { usePageBuffer } from './hooks/usePageBuffer';
import { useSubpage } from './hooks/useSubpage';
import { TeletextScreen } from './components/TeletextScreen';
import { HeaderTicker } from './components/HeaderTicker';
import { FastTextBar } from './components/FastTextBar';
import { GridLine } from './components/GridLine';
import { MobileKeypad } from './components/MobileKeypad';
import { NOT_FOUND_PAGE, QUICK_INDEX, getPage } from './content/registry';
import { useGridMode } from './display/useGridMode';
import { layoutBody } from './display/layout';
import { rowText } from './display/rows';
import { sidebarRows } from './display/sidebar';

const SIDEBAR_ROWS = sidebarRows(QUICK_INDEX);

export const App: React.FC = () => {
  const { bufferText, currentPage, navigateToPage } = usePageBuffer(100);
  const mode = useGridMode();

  const page = getPage(currentPage) ?? getPage(NOT_FOUND_PAGE)!;
  const subpage = useSubpage(currentPage, page.wide.length);
  const bodyRows = (mode.name === 'portrait' ? page.narrow : page.wide)[subpage.index];
  const lines = layoutBody(mode, bodyRows, SIDEBAR_ROWS);

  return (
    <>
      {/* 1. VISUAL TELETEXT CRT DISPLAY */}
      <div aria-hidden="true" className="teletext-wrapper">
        <TeletextScreen mode={mode} ariaLabel="Ceefax Teletext Screen">
          <HeaderTicker bufferText={bufferText} currentPage={currentPage} cols={mode.cols} subpage={subpage} />

          {lines.map(({ key, ...line }) => (
            <GridLine key={key} {...line} />
          ))}

          <FastTextBar links={page.fastext} onNavigate={navigateToPage} cols={mode.cols} row={mode.rows} />
        </TeletextScreen>

        {/* Retro Remote TV Handset Overlay (Mobile & Touch support) */}
        <MobileKeypad onNavigate={navigateToPage} onSubpage={subpage.step} currentPage={currentPage} />
      </div>

      {/* 2. ACCESSIBLE SEMANTIC DOM TREE (stop-gap until the Phase 4 semantic mirror) */}
      <div className="sr-only">
        <header>
          <h1>{page.title}</h1>
          <p>Current Page: {currentPage}</p>
        </header>
        <main>
          <article>
            {page.wide.map((rows, i) => (
              <section key={i}>
                {rows
                  .filter((row) => !row.fill)
                  .map((row) => rowText(row).trim())
                  .filter(Boolean)
                  .map((text, j) => (
                    <p key={j}>{text}</p>
                  ))}
              </section>
            ))}
            <ul>
              {QUICK_INDEX.map(({ page: n, title }) => (
                <li key={n}>
                  <a href={n === 100 ? '/' : `/${n}`} onClick={(e) => { e.preventDefault(); navigateToPage(n); }}>
                    Page {n}: {title}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </main>
      </div>
    </>
  );
};

export default App;
