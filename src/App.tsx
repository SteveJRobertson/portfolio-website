import React, { useState, useEffect } from 'react';
import { usePageBuffer } from './hooks/usePageBuffer';
import { TeletextScreen } from './components/TeletextScreen';
import { HeaderTicker } from './components/HeaderTicker';
import { FastTextBar } from './components/FastTextBar';
import { ColorSpan } from './components/ColorSpan';
import { MobileKeypad } from './components/MobileKeypad';
import { TeletextCanvasImage } from './components/TeletextCanvasImage';
import { getPageData } from './utils/pageRegistry';
import type { FastTextLink } from './types/teletext';

const DEFAULT_FASTEXT: { red: FastTextLink; green: FastTextLink; yellow: FastTextLink; cyan: FastTextLink } = {
  red: { label: 'About [101]', page: 101, path: '/101', color: 'red' },
  green: { label: 'Projects [200]', page: 200, path: '/200', color: 'green' },
  yellow: { label: 'Stack [300]', page: 300, path: '/300', color: 'yellow' },
  cyan: { label: 'Contact [400]', page: 400, path: '/400', color: 'cyan' },
};

export const App: React.FC = () => {
  const { bufferText, currentPage, navigateToPage } = usePageBuffer(100);
  const [isWidescreen, setIsWidescreen] = useState<boolean>(false);

  useEffect(() => {
    const checkWidescreen = () => {
      const isWide = window.innerWidth >= 1024 && (window.innerWidth / window.innerHeight) >= 1.5;
      setIsWidescreen(isWide);
    };

    checkWidescreen();
    window.addEventListener('resize', checkWidescreen);
    return () => window.removeEventListener('resize', checkWidescreen);
  }, []);

  const pageData = getPageData(currentPage);
  const fastTextLinks = pageData?.fastText || DEFAULT_FASTEXT;
  const rowClass = isWidescreen ? 'teletext-row-grid' : 'teletext-row';

  return (
    <>
      {/* 1. VISUAL TELETEXT CRT DISPLAY */}
      <div aria-hidden="true" className="teletext-wrapper" style={{ flexDirection: 'column' }}>
        <TeletextScreen ariaLabel="Ceefax Teletext Screen">
          {/* Top Ticker Row */}
          <HeaderTicker bufferText={bufferText} currentPage={currentPage} />

          {/* Teletext Body Grid Container */}
          <div style={{ flex: 1, padding: '0.4em 0', display: 'flex', flexDirection: 'column', gap: '0.15em' }}>
            {currentPage === 202 ? (
              /* Special Case Study Page 202: Real-time Canvas Shader Ditherer */
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="yellow">======================================</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">QUICK INDEX   </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="yellow"> P202 TELETEXT CANVAS SHADER ART     </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="yellow">======================================</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="green">200 </ColorSpan><ColorSpan color="white">WORK      </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> Real-time 8-color mosaic posterizer: </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="yellow">300 </ColorSpan><ColorSpan color="white">STACK     </ColorSpan></div>}
                </div>
                <TeletextCanvasImage 
                  src="/favicon.svg" 
                  alt="Teletext 8-color mosaic canvas image demo"
                  widthCols={34}
                  heightRows={6}
                />
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="green"> Dithers image pixels to SAA5050.     </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">400 </ColorSpan><ColorSpan color="white">CONTACT   </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="yellow"> PRESS [200] OR 'R' TO RETURN LIST    </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>
              </>
            ) : pageData ? (
              pageData.mainRows.map((row, idx) => (
                <div key={idx} className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color={row.color || 'white'}>
                      {row.text}
                    </ColorSpan>
                    {row.suffix && (
                      <ColorSpan color="white">
                        {row.suffix}
                      </ColorSpan>
                    )}
                  </div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      {idx === 0 && <ColorSpan color="cyan">QUICK INDEX   </ColorSpan>}
                      {idx === 1 && <ColorSpan color="yellow">--------------</ColorSpan>}
                      {idx === 2 && <><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></>}
                      {idx === 3 && <><ColorSpan color="red">101 </ColorSpan><ColorSpan color="white">ABOUT     </ColorSpan></>}
                      {idx === 4 && <><ColorSpan color="green">200 </ColorSpan><ColorSpan color="white">PROJECTS  </ColorSpan></>}
                      {idx === 5 && <><ColorSpan color="yellow">300 </ColorSpan><ColorSpan color="white">STACK     </ColorSpan></>}
                      {idx === 6 && <><ColorSpan color="cyan">400 </ColorSpan><ColorSpan color="white">CONTACT   </ColorSpan></>}
                      {idx === 7 && <><ColorSpan color="magenta">888 </ColorSpan><ColorSpan color="white">A11Y MODE </ColorSpan></>}
                      {idx === 8 && <ColorSpan color="yellow">--------------</ColorSpan>}
                      {idx === 9 && <ColorSpan color="green">SYS: ONLINE   </ColorSpan>}
                      {idx === 10 && <ColorSpan color="white">EDINBURGH, UK </ColorSpan>}
                      {idx === 11 && <ColorSpan color="white">CRT: 50Hz     </ColorSpan>}
                      {idx > 11 && <ColorSpan color="white">              </ColorSpan>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              /* Fallback 404 Signal Lost */
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="red">======================================</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">QUICK INDEX   </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="red"> P404 SIGNAL LOST / PAGE NOT FOUND    </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="red">======================================</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> The page number keyed is unassigned. </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="yellow"> PRESS [100] OR 'R' TO RETURN HOME    </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>
              </>
            )}
          </div>

          {/* Fastext 4-Color Action Bar */}
          <FastTextBar links={fastTextLinks} onNavigate={navigateToPage} />
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
