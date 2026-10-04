import React from 'react';
import { usePageBuffer } from './hooks/usePageBuffer';
import { TeletextScreen } from './components/TeletextScreen';
import { HeaderTicker } from './components/HeaderTicker';
import { FastTextBar } from './components/FastTextBar';
import { GridLine } from './components/GridLine';
import { MobileKeypad } from './components/MobileKeypad';
import { TeletextCanvasImage } from './components/TeletextCanvasImage';
import { getPageData } from './utils/pageRegistry';
import { useGridMode } from './display/useGridMode';
import { layoutBody } from './display/layout';
import { rowFromData, type GridRow } from './display/rows';
import { SIDEBAR_ROWS } from './display/sidebar';
import { CANVAS_ANCHOR, CANVAS_ROWS, PAGE_202_ROWS, PAGE_404_ROWS } from './display/systemPages';
import type { FastTextLink } from './types/teletext';

const DEFAULT_FASTEXT: { red: FastTextLink; green: FastTextLink; yellow: FastTextLink; cyan: FastTextLink } = {
  red: { label: 'About [101]', page: 101, path: '/101', color: 'red' },
  green: { label: 'Projects [200]', page: 200, path: '/200', color: 'green' },
  yellow: { label: 'Stack [300]', page: 300, path: '/300', color: 'yellow' },
  cyan: { label: 'Contact [400]', page: 400, path: '/400', color: 'cyan' },
};

export const App: React.FC = () => {
  const { bufferText, currentPage, navigateToPage } = usePageBuffer(100);
  const mode = useGridMode();

  const pageData = getPageData(currentPage);
  const fastTextLinks = pageData?.fastText || DEFAULT_FASTEXT;

  const bodyRows: GridRow[] =
    currentPage === 202 ? PAGE_202_ROWS : pageData ? pageData.mainRows.map(rowFromData) : PAGE_404_ROWS;
  const lines = layoutBody(mode, bodyRows, SIDEBAR_ROWS);
  const canvasLine = lines.find((line) => line.content.id === CANVAS_ANCHOR);

  return (
    <>
      {/* 1. VISUAL TELETEXT CRT DISPLAY */}
      <div aria-hidden="true" className="teletext-wrapper">
        <TeletextScreen mode={mode} ariaLabel="Ceefax Teletext Screen">
          <HeaderTicker bufferText={bufferText} currentPage={currentPage} cols={mode.cols} />

          {lines.map(({ key, ...line }) => (
            <GridLine key={key} {...line} />
          ))}

          {currentPage === 202 && canvasLine && (
            <div
              className="tt-graphic"
              style={{ gridRow: `${canvasLine.row} / span ${CANVAS_ROWS}`, gridColumn: `2 / span ${mode.mainCols - 2}` }}
            >
              <TeletextCanvasImage
                src="/favicon.svg"
                alt="Teletext 8-color mosaic canvas image demo"
                widthCols={mode.mainCols - 2}
                heightRows={CANVAS_ROWS}
              />
            </div>
          )}

          <FastTextBar links={fastTextLinks} onNavigate={navigateToPage} cols={mode.cols} row={mode.rows} />
        </TeletextScreen>

        {/* Retro Remote TV Handset Overlay (Mobile & Touch support) */}
        <MobileKeypad onNavigate={navigateToPage} currentPage={currentPage} />
      </div>

      {/* 2. ACCESSIBLE SEMANTIC DOM TREE */}
      <div className="sr-only">
        <header>
          <h1>{pageData?.semanticContent.heading || 'Steve Robertson - Teletext Portfolio'}</h1>
          <p>Current Page: {currentPage}</p>
        </header>
        <main>
          <article>
            <h2>{pageData?.title || 'Page Details'}</h2>
            {pageData?.semanticContent.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <ul>
              <li><a href="/100" onClick={(e) => { e.preventDefault(); navigateToPage(100); }}>Page 100: Index</a></li>
              <li><a href="/101" onClick={(e) => { e.preventDefault(); navigateToPage(101); }}>Page 101: About Me</a></li>
              <li><a href="/200" onClick={(e) => { e.preventDefault(); navigateToPage(200); }}>Page 200: Projects</a></li>
              <li><a href="/300" onClick={(e) => { e.preventDefault(); navigateToPage(300); }}>Page 300: Tech Stack</a></li>
              <li><a href="/400" onClick={(e) => { e.preventDefault(); navigateToPage(400); }}>Page 400: Contact</a></li>
            </ul>
          </article>
        </main>
      </div>
    </>
  );
};

export default App;
