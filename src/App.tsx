import React, { useState, useEffect } from 'react';
import { usePageBuffer } from './hooks/usePageBuffer';
import { TeletextScreen } from './components/TeletextScreen';
import { HeaderTicker } from './components/HeaderTicker';
import { FastTextBar } from './components/FastTextBar';
import { ColorSpan } from './components/ColorSpan';
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

  const rowClass = isWidescreen ? 'teletext-row-grid' : 'teletext-row';

  return (
    <>
      {/* 1. VISUAL TELETEXT CRT DISPLAY */}
      <div aria-hidden="true" className="teletext-wrapper">
        <TeletextScreen ariaLabel="Ceefax Teletext Screen">
          {/* Top Ticker Row */}
          <HeaderTicker bufferText={bufferText} currentPage={currentPage} />

          {/* Teletext Body Grid Container */}
          <div style={{ flex: 1, padding: '0.4em 0', display: 'flex', flexDirection: 'column', gap: '0.15em' }}>
            
            {/* ROW 1: Header Banner */}
            <div className={rowClass}>
              <div className="teletext-main-col">
                <ColorSpan color="yellow">======================================'</ColorSpan>
              </div>
              {isWidescreen && (
                <div className="teletext-sidebar-col">
                  <ColorSpan color="cyan">QUICK INDEX   </ColorSpan>
                </div>
              )}
            </div>

            {/* ROW 2: Title */}
            <div className={rowClass}>
              <div className="teletext-main-col">
                <ColorSpan color="cyan"> STEVE ROBERTSON - TELETEXT PORTFOLIO </ColorSpan>
              </div>
              {isWidescreen && (
                <div className="teletext-sidebar-col">
                  <ColorSpan color="yellow">--------------</ColorSpan>
                </div>
              )}
            </div>

            {/* ROW 3: Divider */}
            <div className={rowClass}>
              <div className="teletext-main-col">
                <ColorSpan color="yellow">======================================</ColorSpan>
              </div>
              {isWidescreen && (
                <div className="teletext-sidebar-col">
                  <ColorSpan color="red">100 </ColorSpan>
                  <ColorSpan color="white">HOME      </ColorSpan>
                </div>
              )}
            </div>

            {/* ROW 4: Spacer */}
            <div className={rowClass}>
              <div className="teletext-main-col"><ColorSpan color="white"> </ColorSpan></div>
              {isWidescreen && (
                <div className="teletext-sidebar-col">
                  <ColorSpan color="red">101 </ColorSpan>
                  <ColorSpan color="white">ABOUT     </ColorSpan>
                </div>
              )}
            </div>

            {/* PAGE CONTENT ROUTER */}
            {currentPage === 100 && (
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> WELCOME TO CEEFAX PAGE 100         </ColorSpan>
                  </div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      <ColorSpan color="green">200 </ColorSpan>
                      <ColorSpan color="white">PROJECTS  </ColorSpan>
                    </div>
                  )}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="green"> SENIOR FRONTEND & SYSTEMS ARCHITECT</ColorSpan>
                  </div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      <ColorSpan color="yellow">300 </ColorSpan>
                      <ColorSpan color="white">STACK     </ColorSpan>
                    </div>
                  )}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> BASED IN EDINBURGH, SCOTLAND       </ColorSpan>
                  </div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      <ColorSpan color="cyan">400 </ColorSpan>
                      <ColorSpan color="white">CONTACT   </ColorSpan>
                    </div>
                  )}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col"><ColorSpan color="white"> </ColorSpan></div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      <ColorSpan color="magenta">888 </ColorSpan>
                      <ColorSpan color="white">A11Y MODE </ColorSpan>
                    </div>
                  )}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="yellow"> DIRECT NAVIGATION INDEX:           </ColorSpan>
                  </div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      <ColorSpan color="yellow">--------------</ColorSpan>
                    </div>
                  )}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="red"> 101 </ColorSpan>
                    <ColorSpan color="white">ABOUT ME & BACKGROUND          </ColorSpan>
                  </div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      <ColorSpan color="green">SYS: ONLINE   </ColorSpan>
                    </div>
                  )}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="green"> 200 </ColorSpan>
                    <ColorSpan color="white">FEATURED PROJECTS & WORK       </ColorSpan>
                  </div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      <ColorSpan color="white">EDINBURGH, UK </ColorSpan>
                    </div>
                  )}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="yellow"> 300 </ColorSpan>
                    <ColorSpan color="white">TECH STACK ARCHITECTURE MATRIX </ColorSpan>
                  </div>
                  {isWidescreen && (
                    <div className="teletext-sidebar-col">
                      <ColorSpan color="white">CRT: 50Hz     </ColorSpan>
                    </div>
                  )}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="cyan"> 400 </ColorSpan>
                    <ColorSpan color="white">GET IN TOUCH & CONNECT         </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="magenta"> 888 </ColorSpan>
                    <ColorSpan color="white">ACCESSIBILITY / SUBTITLES MODE </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>

                <div className={rowClass}><div className="teletext-main-col"><ColorSpan color="white"> </ColorSpan></div></div>

                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="magenta"> TIP: TYPE 3 DIGITS OR PRESS R,G,Y,C</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>
              </>
            )}

            {currentPage === 101 && (
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="red"> P101 ABOUT STEVE ROBERTSON        </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">QUICK INDEX   </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> Senior Solutions Architect & Lead  </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> Frontend Engineer in Edinburgh, UK.</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="green">200 </ColorSpan><ColorSpan color="white">WORK      </ColorSpan></div>}
                </div>
              </>
            )}

            {currentPage === 200 && (
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="green"> P200 FEATURED PROJECTS INDEX       </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">QUICK INDEX   </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="cyan"> 201 </ColorSpan>
                    <ColorSpan color="white">TELETEXT DESIGN SYSTEM STORYBOOK</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="cyan"> 202 </ColorSpan>
                    <ColorSpan color="white">CANVAS TELETEXT IMAGE SHADER    </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="yellow">300 </ColorSpan><ColorSpan color="white">STACK     </ColorSpan></div>}
                </div>
              </>
            )}

            {currentPage === 300 && (
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="yellow"> P300 TECH STACK MATRIX             </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">QUICK INDEX   </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="cyan"> CORE:   </ColorSpan>
                    <ColorSpan color="white">React, TypeScript, Vite     </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="cyan"> STYLING:</ColorSpan>
                    <ColorSpan color="white">Vanilla CSS, Container Query</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">400 </ColorSpan><ColorSpan color="white">CONTACT   </ColorSpan></div>}
                </div>
              </>
            )}

            {currentPage === 400 && (
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="cyan"> P400 CONTACT & CONNECT             </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">QUICK INDEX   </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> GITHUB:   github.com/SteveJRobertson</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> LOCATION: Edinburgh, UK            </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>
              </>
            )}

            {currentPage === 888 && (
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="magenta"> P888 SUBTITLES ACCESSIBILITY MODE</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="cyan">QUICK INDEX   </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> Full WCAG AA/AAA Parity Enabled.   </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></div>}
                </div>
              </>
            )}

            {currentPage === 404 && (
              <>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="red"> P404 SIGNAL LOST / PAGE NOT FOUND  </ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="red">100 </ColorSpan><ColorSpan color="white">HOME      </ColorSpan></div>}
                </div>
                <div className={rowClass}>
                  <div className="teletext-main-col">
                    <ColorSpan color="white"> The page number keyed is unassigned</ColorSpan>
                  </div>
                  {isWidescreen && <div className="teletext-sidebar-col"><ColorSpan color="white">              </ColorSpan></div>}
                </div>
              </>
            )}

          </div>

          {/* Fastext 4-Color Action Bar */}
          <FastTextBar links={DEFAULT_FASTEXT} onNavigate={navigateToPage} />
        </TeletextScreen>
      </div>

      {/* 2. ACCESSIBLE SEMANTIC DOM TREE */}
      <div className="sr-only">
        <header>
          <h1>Steve Robertson - Teletext Portfolio</h1>
          <p>Current Page: {currentPage}</p>
        </header>
        <main>
          <article>
            <h2>Senior Frontend & Systems Architect</h2>
            <p>Based in Edinburgh, Scotland.</p>
            <ul>
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
