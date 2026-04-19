'use client';
import React, { useEffect, useRef } from 'react';

// ──────────────────────────────────────────────
//  씬 구성 N=8
//  S0 Hero / S1 Philosophy / S2 Numbers
//  S3 Categories / S4 Glossary / S5 Calculator
//  S6 Calendar / S7 CTA
// ──────────────────────────────────────────────
const N  = 8;
const FF = 0.45;

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

const FAMILIES = [
  { id: 'fundamental', label: '기업펀더멘탈', en: 'FUNDAMENTAL', color: '#c8a96e', desc: '재무제표·밸류에이션·수익성·현금흐름' },
  { id: 'market',      label: '시장거래',     en: 'MARKET',      color: '#6ea8c8', desc: 'ETF·주문유형·시장구조·한국/해외시장' },
  { id: 'macro',       label: '거시경제',     en: 'MACRO',       color: '#8bc87a', desc: '금리·환율·인플레이션·경기순환' },
  { id: 'risk',        label: '리스크관리',   en: 'RISK',        color: '#c87a8b', desc: 'VaR·포트폴리오·성과평가·퀀트통계' },
  { id: 'derivatives', label: '파생상품',     en: 'DERIVATIVES', color: '#9a7ac8', desc: '선물·옵션·스왑·변동성·헤지' },
  { id: 'trading',     label: '트레이딩',     en: 'TRADING',     color: '#c8b47a', desc: '기술적 지표·차트패턴·매매실전' },
  { id: 'industry',    label: '산업섹터',     en: 'INDUSTRY',    color: '#7ac8c0', desc: '반도체·바이오·에너지·소비재·금융' },
  { id: 'digital',     label: '디지털자산',   en: 'DIGITAL',     color: '#c87ab4', desc: 'DeFi·블록체인·토큰화·디지털자산' },
  { id: 'tax',         label: '세금·제도',    en: 'TAX',         color: '#a8c87a', desc: '계좌·세금·공시·법률·규제' },
];

const SCENE_LABELS = ['INTRO', 'PHILOSOPHY', 'NUMBERS', 'FAMILIES', 'GLOSSARY', 'CALCULATOR', 'CALENDAR', 'START'];

const sceneBase: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  willChange: 'opacity, transform',
  pointerEvents: 'none',
  overflow: 'hidden',
};

export default function HomeView({
  T, isDark, totalTerms,
  setActiveTab,
}: any) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ── CSS ──
    const style = document.createElement('style');
    style.id = 'hw-styles';
    style.textContent = `
      html, body { overflow: hidden !important; height: 100% !important; }
      html { scrollbar-width: none; }
      html::-webkit-scrollbar { display: none; }

      /* 모든 씬을 JS 실행 전까지 완전히 숨김 — 겹쳐 보이는 flash 방지 */
      #hw-stage:not(.hw-ready) .hw-scene { opacity: 0 !important; pointer-events: none !important; }

      @keyframes hw-grid-drift {
        0%   { background-position: 0 0; }
        100% { background-position: 80px 80px; }
      }
      @keyframes hw-glow-pulse {
        0%,100% { opacity: 0.15; transform: scale(1); }
        50%      { opacity: 0.28; transform: scale(1.1); }
      }
      @keyframes hw-cue-bounce {
        0%,100% { transform: translateY(0); opacity: 0.4; }
        50%      { transform: translateY(10px); opacity: 0.9; }
      }
      @keyframes hw-bar-in {
        from { transform: scaleX(0); }
        to   { transform: scaleX(1); }
      }
      @keyframes hw-fade-up {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .hw-scroll-cue { animation: hw-cue-bounce 2s ease-in-out infinite; }
      .hw-stat-bar { transform-origin: left; transform: scaleX(0); }
      .hw-stat-bar.lit { animation: hw-bar-in 0.9s cubic-bezier(0.22,1,0.36,1) forwards; }
      .hw-diff-fill { transition: width 0.9s cubic-bezier(0.22,1,0.36,1); }
      .hw-fam-card {
        transition: opacity 0.25s, transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        cursor: pointer;
      }
      .hw-fam-card:hover {
        opacity: 1 !important;
        transform: translateY(-4px) !important;
      }
      .hw-nav-link {
        opacity: 0.5; transition: opacity 0.2s; cursor: pointer;
        font-size: 11px; letter-spacing: 0.12em; padding: 4px 0;
      }
      .hw-nav-link:hover { opacity: 1; }
      .hw-nav-link.active { opacity: 1; }

      /* 모바일 전용 */
      .hw-nav-desktop { display: flex; }
      .hw-nav-mobile  { display: none; }
      .hw-fam-grid    { display: grid; grid-template-columns: repeat(auto-fill, minmax(188px, 1fr)); gap: 8px; }
      .hw-dots        { display: flex; }
      /* S4~S6 mock 패널 — 모바일에서 가로 레이아웃 스케일 다운 */
      .hw-calc-ab     { display: grid; grid-template-columns: 1fr auto 1fr; }
      .hw-calc-delta  { width: 100px; }

      @media (max-width: 640px) {
        /* NAV */
        .hw-nav-desktop { display: none !important; }
        .hw-nav-mobile  { display: flex !important; }

        /* 우측 dots 숨김 */
        .hw-dots        { display: none !important; }

        /* HERO 타이틀 */
        .hw-hero-title  { font-size: clamp(40px, 13vw, 72px) !important; }

        /* S3 FAMILIES 그리드 */
        .hw-fam-grid {
          grid-template-columns: 1fr !important;
          gap: 6px !important;
          overflow-y: auto;
          max-height: calc(100vh - 180px);
        }
        .hw-fam-grid::-webkit-scrollbar { display: none; }

        /* S4/S5/S6 — 2단 → 1단, padding/gap 축소 */
        .hw-feat-grid {
          grid-template-columns: 1fr !important;
          gap: 20px !important;
          padding: 0 24px !important;
          align-items: flex-start !important;
        }
        /* S4/S5/S6 우측 목업 패널 모바일에서 완전 숨김 */
        .hw-feat-mockup { display: none !important; }
        /* 텍스트 영역 좌측 정렬 유지 */
        .hw-feat-text { max-width: 100% !important; }

        /* S2 숫자 카운터 — 2×2로 */
        .hw-numbers-grid {
          grid-template-columns: 1fr 1fr !important;
          gap: 28px !important;
        }

        /* S7 단축키 힌트 숨김 (모바일엔 키보드 없음) */
        .hw-shortcuts { display: none !important; }

        /* S1 Philosophy padding */
        .hw-philosophy { padding: 0 24px !important; }

        /* S2 numbers padding 축소 */
        .hw-numbers-grid { padding: 0 !important; }

        /* S3 families 상단 여백 줄이기 */
        .hw-fam-title { margin-bottom: 16px !important; }
        /* S3 씬 자체 paddingTop 축소 */
        #hs3 { padding-top: 56px !important; }

        /* S4/S5/S6 텍스트 영역 — 모바일 단일 컬럼일 때 중앙 정렬 */
        .hw-feat-text { text-align: center !important; }
        .hw-feat-text button { margin: 0 auto !important; }
      }
    `;
    document.head.appendChild(style);

    // 배경색 통일 (FOUC 방지)
    const stageBg = isDark ? '#080808' : '#f5f4f0';
    const prevBodyBg = document.body.style.background;
    const prevHtmlBg = document.documentElement.style.background;
    const prevOverflow = document.body.style.overflow;
    document.body.style.background = stageBg;
    document.documentElement.style.background = stageBg;
    document.body.classList.add('hw-active');

    // ── 씬 전환 엔진 ──
    // window.scrollY 방식 대신 내부 progress(0~1) 직접 제어
    let currentIdx = 0;
    let targetIdx  = 0;
    let progress   = 0;  // 0 = currentIdx 완전 표시, 1 = targetIdx 완전 표시
    let animId: number;
    let isAnimating = false;

    const scenes = Array.from({ length: N }, (_, i) =>
      document.getElementById(`hs${i}`) as HTMLElement | null
    );

    // 트리거
    let countersStarted = false;
    let dbarDone = false;

    function triggerCounters() {
      countersStarted = true;
      document.querySelectorAll<HTMLElement>('.hw-num[data-to]').forEach((el) => {
        const to = parseInt(el.dataset.to || '0', 10);
        const dur = 1400;
        const start = performance.now();
        function step(now: number) {
          const t = easeOut(Math.min((now - start) / dur, 1));
          el.textContent = Math.round(t * to).toLocaleString();
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = to.toLocaleString();
        }
        requestAnimationFrame(step);
      });
      let delay = 0;
      document.querySelectorAll<HTMLElement>('.hw-stat-bar').forEach((bar) => {
        setTimeout(() => bar.classList.add('lit'), delay);
        delay += 180;
      });
    }

    function triggerDbar() {
      dbarDone = true;
      const dbf = document.getElementById('hw-dbf');
      if (dbf) setTimeout(() => { (dbf as HTMLElement).style.width = '68%'; }, 400);
    }

    // 씬 opacity/transform 직접 설정
    function applyScenes(from: number, to: number, prog: number) {
      scenes.forEach((s, i) => {
        if (!s) return;
        let o = 0, y = 0;
        if (i === from && i === to) {
          o = 1; y = 0;
        } else if (i === from) {
          // 나가는 씬 — 위로 사라짐
          const t = easeOut(prog);
          o = 1 - t;
          y = -60 * t;
        } else if (i === to) {
          // 들어오는 씬 — 아래에서 올라옴
          const t = easeOut(prog);
          o = t;
          y = 60 * (1 - t);
        } else {
          o = 0;
          y = i < from ? -60 : 60;
        }
        s.style.opacity = String(o < 0.001 ? 0 : o > 0.999 ? 1 : o);
        s.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        s.style.pointerEvents = o > 0.05 ? 'auto' : 'none';
      });
    }

    function updateUI(idx: number) {
      // dots
      document.querySelectorAll<HTMLElement>('.hw-dot').forEach((d, di) => {
        d.style.opacity = di === idx ? '1' : '0.2';
        d.style.transform = di === idx ? 'scale(1.6)' : 'scale(1)';
      });
      // progress bar
      const prog = document.getElementById('hw-prog');
      if (prog) prog.style.transform = `scaleX(${(idx / (N - 1)).toFixed(3)})`;
      // nav labels
      document.querySelectorAll<HTMLElement>('.hw-nav-link').forEach((el, li) => {
        el.classList.toggle('active', li === idx);
      });
      // scene label
      const lbl = document.getElementById('hw-scene-label');
      if (lbl) lbl.textContent = SCENE_LABELS[idx] || '';
      // triggers
      if (idx === 2 && !countersStarted) triggerCounters();
      if (idx === 5 && !dbarDone) triggerDbar();
    }

    function goTo(idx: number) {
      const clamped = Math.max(0, Math.min(N - 1, idx));
      if (clamped === currentIdx && !isAnimating) return;
      if (isAnimating) {
        // 애니메이션 중에 또 요청 오면 즉시 완료 후 새 목적지로
        cancelAnimationFrame(animId);
        applyScenes(currentIdx, targetIdx, 1);
        currentIdx = targetIdx;
        isAnimating = false;
        progress = 0;
      }
      targetIdx = clamped;
      if (targetIdx === currentIdx) return;
      isAnimating = true;
      progress = 0;
      const dur = 600; // ms
      const start = performance.now();
      function animate(now: number) {
        progress = Math.min((now - start) / dur, 1);
        applyScenes(currentIdx, targetIdx, progress);
        if (progress < 1) {
          animId = requestAnimationFrame(animate);
        } else {
          currentIdx = targetIdx;
          isAnimating = false;
          progress = 0;
          updateUI(currentIdx);
        }
      }
      updateUI(clamped); // 도트/라벨 즉시 업데이트
      animId = requestAnimationFrame(animate);
    }

    // ── 초기 상태 ── applyScenes 직후 hw-ready 부착 → CSS !important 해제
    applyScenes(0, 0, 0);
    updateUI(0);
    document.getElementById('hw-stage')?.classList.add('hw-ready');

    // ── wheel 이벤트 — 한 번 휠 = 한 씬 이동 ──
    let wheelCooldown = false;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (wheelCooldown) return;
      const delta = e.deltaY > 0 ? 1 : -1;
      goTo(currentIdx + delta);
      wheelCooldown = true;
      setTimeout(() => { wheelCooldown = false; }, 700);
    }

    // ── touch 이벤트 ──
    let touchStartY = 0;
    let touchCooldown = false;
    function onTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0].clientY;
    }
    function onTouchEnd(e: TouchEvent) {
      if (touchCooldown) return;
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 40) return;
      goTo(currentIdx + (diff > 0 ? 1 : -1));
      touchCooldown = true;
      setTimeout(() => { touchCooldown = false; }, 700);
    }

    // ── 키보드 ──
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(currentIdx + 1); }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(currentIdx - 1); }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);

    // goTo를 전역 노출 (dot 버튼 클릭용)
    (window as any).__hwGoTo = goTo;

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
      delete (window as any).__hwGoTo;
      document.body.style.background = prevBodyBg;
      document.documentElement.style.background = prevHtmlBg;
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove('hw-active');
      document.getElementById('hw-stage')?.classList.remove('hw-ready');
      document.getElementById('hw-styles')?.remove();
    };
  }, [isDark]);

  const bg     = isDark ? '#080808' : '#f5f4f0';
  const txt    = isDark ? '#ede9df' : '#1a1a1a';
  const muted  = isDark ? '#76726e' : '#999';
  const dimmer = isDark ? '#4a4745' : '#bbb';
  const border = isDark ? '#1c1c1c' : '#e0ddd8';
  const accent = '#C89650';
  const bgCard = isDark ? '#111' : '#fff';
  const bgSurf = isDark ? '#0d0d0d' : '#f0eeea';

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: bg, zIndex: 1 }}>

      {/* ── 상단 NAV ──────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px',
        zIndex: 200,
        background: isDark ? 'rgba(8,8,8,0.9)' : 'rgba(245,244,240,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${border}`,
      }}>
        {/* 브랜드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: txt, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
            Stock<span style={{ color: accent }}>Wi</span>Ki
            <span style={{ color: muted, fontWeight: 300, fontSize: 12, marginLeft: 3 }}>.kr</span>
          </span>
          <span style={{ width: 1, height: 14, background: border, flexShrink: 0 }} />
          <span id="hw-scene-label" style={{ fontSize: 10, color: dimmer, letterSpacing: '0.18em', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden' }}>INTRO</span>
        </div>

        {/* 데스크탑: 3개 버튼 */}
        <div className="hw-nav-desktop" style={{ alignItems: 'center', gap: 8 }}>
          {[
            { label: '금융 사전', tab: 'glossary' },
            { label: '계산기',   tab: 'calc' },
            { label: '캘린더',   tab: 'events' },
          ].map(({ label, tab }) => (
            <button key={tab} onClick={() => setActiveTab?.(tab)} style={{
              background: 'transparent', color: muted, border: `1px solid ${border}`,
              padding: '5px 14px', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.08em', cursor: 'pointer', borderRadius: 2,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.color = txt; el.style.borderColor = muted; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.color = muted; el.style.borderColor = border; }}
            >{label}</button>
          ))}
        </div>

        {/* 모바일: 금융 사전 버튼 1개만 */}
        <div className="hw-nav-mobile" style={{ alignItems: 'center' }}>
          <button onClick={() => setActiveTab?.('glossary')} style={{
            background: accent, color: '#fff', border: 'none',
            padding: '7px 18px', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 2,
            whiteSpace: 'nowrap',
          }}>사전 열기</button>
        </div>
      </div>

      {/* ── FIXED STAGE ───────────────────────── */}
      <div id="hw-stage" ref={stageRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

        {/* S0 HERO */}
        <div id="hs0" className="hw-scene" style={sceneBase}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.038)'} 1px, transparent 1px),
                              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.038)'} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 65% 65% at 50% 52%, black 15%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 52%, black 15%, transparent 100%)',
            animation: 'hw-grid-drift 16s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 50% 40% at 50% 56%, ${accent}1e 0%, transparent 70%)`,
            animation: 'hw-glow-pulse 6s ease-in-out infinite',
          }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
            <div className="hw-hero-title" style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 200,
              fontSize: 'clamp(48px, 9.5vw, 132px)',
              lineHeight: 1.0, letterSpacing: '-0.04em', color: txt,
            }}>
              <div>주식의</div>
              <div style={{ opacity: 0.38 }}>모든 언어를</div>
              <div style={{ color: accent }}>한 곳에.</div>
            </div>
            <p style={{ color: muted, fontSize: 'clamp(13px, 1.5vw, 15px)', marginTop: 28, marginBottom: 44, letterSpacing: '0.01em' }}>
              {(totalTerms || 2400).toLocaleString()}개 금융 용어 &middot; 9개 패밀리 &middot; 30종 계산기 &middot; 이벤트 캘린더
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab?.('glossary')} style={{
                background: accent, color: '#fff', border: 'none',
                padding: '13px 36px', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.07em', cursor: 'pointer', borderRadius: 2,
              }}>사전 열기</button>
              <button onClick={() => setActiveTab?.('calc')} style={{
                background: 'transparent', color: txt, border: `1px solid ${border}`,
                padding: '13px 36px', fontSize: 13, fontWeight: 500,
                letterSpacing: '0.07em', cursor: 'pointer', borderRadius: 2,
              }}>계산기 보기</button>
            </div>
            <div className="hw-scroll-cue" style={{ marginTop: 64, color: dimmer, fontSize: 10, letterSpacing: '0.18em' }}>
              <div style={{ width: 1, height: 28, background: `linear-gradient(to bottom, transparent, ${dimmer})`, margin: '0 auto 8px' }} />
              SCROLL
            </div>
          </div>
        </div>

        {/* S1 PHILOSOPHY */}
        <div id="hs1" className="hw-scene" style={sceneBase}>
          <div className="hw-philosophy" style={{ maxWidth: 680, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.26em', color: accent, marginBottom: 32, fontWeight: 600 }}>PHILOSOPHY</div>
            <blockquote style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: 'clamp(20px, 3vw, 34px)', lineHeight: 1.7,
              color: txt, margin: 0,
              borderLeft: `2px solid ${accent}`, paddingLeft: 28,
            }}>
              시장은 언어를 사용한다.<br />
              <em style={{ color: accent }}>그 언어를 이해하는 자</em>만이<br />
              기회를 읽을 수 있다.
            </blockquote>
            <p style={{ color: muted, marginTop: 32, fontSize: 14, lineHeight: 1.9, paddingLeft: 28 }}>
              StockWiKi는 금융 용어를 단순히 설명하지 않습니다.
              개념 간의 연결, 실전 적용, 시장 맥락을 함께 제공합니다.
            </p>
          </div>
        </div>

        {/* S2 NUMBERS */}
        <div id="hs2" className="hw-scene" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 920, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.26em', color: accent, marginBottom: 52, textAlign: 'center', fontWeight: 600 }}>BY THE NUMBERS</div>
            <div className="hw-numbers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 44, textAlign: 'center' }}>
              {[
                { to: totalTerms || 2400, label: '금융 용어', unit: '개', color: accent },
                { to: 9,   label: '패밀리 카테고리', unit: '개', color: '#8bc87a' },
                { to: 30,  label: '계산기 도구',     unit: '종', color: '#c87a8b' },
                { to: 365, label: '이벤트 캘린더',   unit: '일', color: '#9a7ac8' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 'clamp(42px, 5.5vw, 72px)', fontWeight: 200, color: s.color, lineHeight: 1, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em' }}>
                    <span className="hw-num" data-to={s.to}>0</span>
                    <span style={{ fontSize: '0.32em', opacity: 0.6, marginLeft: 3 }}>{s.unit}</span>
                  </div>
                  <div style={{ color: muted, fontSize: 11, letterSpacing: '0.14em', marginTop: 10 }}>{s.label}</div>
                  <div style={{ height: 2, background: border, marginTop: 16, borderRadius: 1 }}>
                    <div className="hw-stat-bar" style={{ height: '100%', background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* S3 CATEGORIES */}
        <div id="hs3" className="hw-scene" style={{ ...sceneBase, alignItems: 'flex-start', paddingTop: 64, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 1080, padding: '0 28px 32px' }}>
            <div className="hw-fam-title" style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.26em', color: accent, marginBottom: 10, fontWeight: 600 }}>9 FAMILIES</div>
              <div style={{ fontSize: 'clamp(18px, 3vw, 36px)', fontWeight: 200, color: txt, letterSpacing: '-0.03em', fontFamily: 'Inter, sans-serif' }}>
                모든 금융 언어는 9개 패밀리로 분류됩니다
              </div>
            </div>
            <div className="hw-fam-grid">
              {FAMILIES.map((fam) => (
                <button
                  key={fam.id}
                  className="hw-fam-card"
                  onClick={() => setActiveTab?.('glossary')}
                  style={{
                    background: bgCard, border: `1px solid ${fam.color}2e`,
                    padding: '16px 18px', textAlign: 'left',
                    borderRadius: 2, opacity: 0.82, width: '100%',
                  }}
                >
                  <div style={{ width: 24, height: 2.5, background: fam.color, marginBottom: 10, borderRadius: 2 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.14em', color: fam.color, fontWeight: 600, marginBottom: 3 }}>{fam.en}</div>
                      <div style={{ fontSize: 14, color: txt, fontWeight: 600 }}>{fam.label}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: muted, lineHeight: 1.6, textAlign: 'right', maxWidth: 240 }}>{fam.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* S4 GLOSSARY — 좌: 타이포+설명, 우: 앱 UI 목업 */}
        <div id="hs4" className="hw-scene" style={sceneBase}>
          <div className="hw-feat-grid" style={{ width: '100%', maxWidth: 1060, padding: '0 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            {/* 좌: 텍스트 */}
            <div className="hw-feat-text">
              <div style={{ fontSize: 10, letterSpacing: '0.26em', color: accent, marginBottom: 24, fontWeight: 600 }}>GLOSSARY</div>
              <div style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 200, color: txt, lineHeight: 1.15, letterSpacing: '-0.03em', fontFamily: 'Inter, sans-serif', marginBottom: 24 }}>
                용어를 알면<br />
                <span style={{ color: accent }}>시장이 보입니다.</span>
              </div>
              <p style={{ color: muted, fontSize: 14, lineHeight: 1.85, margin: '0 0 28px' }}>
                PER부터 파생상품 그릭스까지 — 개요·공식·예시·연결관계를 한 화면에서 확인하세요.
              </p>
              <button onClick={() => setActiveTab?.('glossary')} style={{
                background: 'transparent', color: accent,
                border: `1px solid ${accent}44`, padding: '10px 24px',
                fontSize: 12, fontWeight: 500, letterSpacing: '0.08em',
                cursor: 'pointer', borderRadius: 2,
              }}>사전 열기 →</button>
            </div>
            {/* 우: 앱 UI 목업 (축소) */}
            <div className="hw-feat-mockup" style={{ background: isDark ? '#0d0d0d' : '#fff', border: `1px solid ${border}`, overflow: 'hidden', opacity: 0.9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${border}` }}>
                <span style={{ fontSize: 10, fontWeight: 600, background: accent, color: '#0a0a0a', padding: '2px 8px', letterSpacing: '0.06em' }}>밸류에이션</span>
                {['개요','심화','공식','예시','연결'].map((t, ti) => (
                  <span key={t} style={{ fontSize: 10, color: ti === 2 ? txt : dimmer, borderBottom: ti === 2 ? `1px solid ${accent}` : undefined, padding: '2px 4px' }}>{t}</span>
                ))}
              </div>
              <div style={{ padding: '16px 16px 0' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: txt, letterSpacing: '-0.03em', lineHeight: 1 }}>PER</div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: muted, marginTop: 4, marginBottom: 12 }}>Price Earnings Ratio</div>
                <div style={{ background: isDark ? '#060606' : '#f8f7f3', borderLeft: `3px solid ${accent}`, padding: '10px 14px', marginBottom: 0 }}>
                  <div style={{ fontSize: 8, color: accent, letterSpacing: '0.18em', marginBottom: 5, fontFamily: 'monospace' }}>ƒ FORMULA</div>
                  <div style={{ fontSize: 13, color: txt, fontFamily: 'monospace' }}>PER = 주가 ÷ EPS</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${border}`, marginTop: 12 }}>
                {[['주가','50,000',false],['EPS','5,000',false],['PER','10.0배',true]].map(([l,v,hl],ci) => (
                  <div key={ci} style={{ padding: '10px 14px', borderRight: ci<2?`1px solid ${border}`:undefined, background: hl?(isDark?'#060606':'#f4f2ed'):undefined }}>
                    <div style={{ fontSize: 9, color: muted, letterSpacing: '0.1em', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'monospace', color: hl?accent:txt }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderTop: `1px solid ${border}`, flexWrap: 'wrap' }}>
                {['EPS ↗','PEG','PBR','DCF','WACC'].map(tag => (
                  <span key={tag} style={{ fontSize: 10, color: muted, border: `1px solid ${border}`, padding: '2px 8px' }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* S5 CALCULATOR — 좌: 타이포+설명, 우: A/B 목업 */}
        <div id="hs5" className="hw-scene" style={sceneBase}>
          <div className="hw-feat-grid" style={{ width: '100%', maxWidth: 1060, padding: '0 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            {/* 좌: 텍스트 */}
            <div className="hw-feat-text">
              <div style={{ fontSize: 10, letterSpacing: '0.26em', color: accent, marginBottom: 24, fontWeight: 600 }}>CALCULATOR</div>
              <div style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 200, color: txt, lineHeight: 1.15, letterSpacing: '-0.03em', fontFamily: 'Inter, sans-serif', marginBottom: 24 }}>
                숫자로<br />
                <span style={{ color: accent }}>직접 확인하세요.</span>
              </div>
              <p style={{ color: muted, fontSize: 14, lineHeight: 1.85, margin: '0 0 28px' }}>
                30종 계산기 · A/B 시나리오 비교로 EPS가 25% 늘면 PER이 어떻게 달라지는지 실시간으로 확인합니다.
              </p>
              <button onClick={() => setActiveTab?.('calc')} style={{
                background: 'transparent', color: accent,
                border: `1px solid ${accent}44`, padding: '10px 24px',
                fontSize: 12, fontWeight: 500, letterSpacing: '0.08em',
                cursor: 'pointer', borderRadius: 2,
              }}>계산기 열기 →</button>
            </div>
            {/* 우: A/B 목업 */}
            <div className="hw-feat-mockup" style={{ background: isDark ? '#0d0d0d' : '#fff', border: `1px solid ${border}`, overflow: 'hidden', opacity: 0.9 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#6ea8c8', fontFamily: 'monospace', letterSpacing: '0.1em' }}>M—01</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: txt }}>PER · EPS</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ fontSize: 10, border: `1px solid ${border}`, color: muted, padding: '3px 10px' }}>단일</span>
                  <span style={{ fontSize: 10, background: accent, color: '#0a0a0a', padding: '3px 10px', fontWeight: 600 }}>A/B</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
                {/* A */}
                <div style={{ padding: '14px', background: isDark ? '#080808' : '#f9f8f4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, background: accent, color: '#0a0a0a', padding: '1px 6px' }}>A</span>
                    <span style={{ fontSize: 10, color: muted }}>현재 기준</span>
                  </div>
                  {[['PRICE','50,000'],['EPS','5,000']].map(([l,v]) => (
                    <div key={l} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: dimmer, letterSpacing: '0.1em', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 15, fontFamily: 'monospace', color: txt }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ background: isDark?'#060606':'#fff', border: `1px solid ${border}`, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: muted, letterSpacing: '0.1em', marginBottom: 4 }}>PER</div>
                    <div style={{ fontFamily: 'monospace', color: accent }}>
                      <span style={{ fontSize: 24, fontWeight: 600 }}>10.0</span>
                      <span style={{ fontSize: 11, marginLeft: 2 }}>배</span>
                    </div>
                  </div>
                </div>
                {/* 델타 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}`, padding: '14px 10px', gap: 4 }}>
                  <div style={{ fontSize: 8, color: dimmer, fontFamily: 'monospace' }}>§ △</div>
                  <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'monospace', color: '#c87a8b' }}>−2.5</div>
                  <div style={{ fontSize: 11, color: '#4a7045', fontFamily: 'monospace', fontWeight: 600 }}>▼ 25%</div>
                </div>
                {/* B */}
                <div style={{ padding: '14px', background: isDark ? '#080808' : '#f9f8f4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, background: '#4a7045', color: '#fff', padding: '1px 6px' }}>B</span>
                    <span style={{ fontSize: 10, color: muted }}>EPS+25%</span>
                  </div>
                  {[['PRICE','52,000'],['EPS','6,875']].map(([l,v]) => (
                    <div key={l} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: dimmer, letterSpacing: '0.1em', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 15, fontFamily: 'monospace', color: txt }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ background: isDark?'#060606':'#fff', border: `1px solid ${border}`, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: muted, letterSpacing: '0.1em', marginBottom: 4 }}>PER</div>
                    <div style={{ fontFamily: 'monospace', color: '#4a7045' }}>
                      <span style={{ fontSize: 24, fontWeight: 600 }}>7.6</span>
                      <span style={{ fontSize: 11, marginLeft: 2 }}>배</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* S6 CALENDAR — 좌: 타이포+설명, 우: 캘린더 목업 */}
        <div id="hs6" className="hw-scene" style={sceneBase}>
          <div className="hw-feat-grid" style={{ width: '100%', maxWidth: 1060, padding: '0 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            {/* 좌: 텍스트 */}
            <div className="hw-feat-text">
              <div style={{ fontSize: 10, letterSpacing: '0.26em', color: '#9a7ac8', marginBottom: 24, fontWeight: 600 }}>CALENDAR</div>
              <div style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 200, color: txt, lineHeight: 1.15, letterSpacing: '-0.03em', fontFamily: 'Inter, sans-serif', marginBottom: 24 }}>
                시장을 움직이는<br />
                <span style={{ color: '#9a7ac8' }}>날짜를 미리 봅니다.</span>
              </div>
              <p style={{ color: muted, fontSize: 14, lineHeight: 1.85, margin: '0 0 28px' }}>
                FOMC, CPI, NFP, 어닝시즌, K200 만기까지 — MACRO · EARNINGS · OPTIONS EXPIRY 탭으로 이벤트 종류를 한눈에 구분합니다.
              </p>
              <button onClick={() => setActiveTab?.('events')} style={{
                background: 'transparent', color: '#9a7ac8',
                border: `1px solid #9a7ac844`, padding: '10px 24px',
                fontSize: 12, fontWeight: 500, letterSpacing: '0.08em',
                cursor: 'pointer', borderRadius: 2,
              }}>캘린더 열기 →</button>
            </div>
            {/* 우: 캘린더 목업 */}
            <div className="hw-feat-mockup" style={{ background: isDark ? '#0d0d0d' : '#fff', border: `1px solid ${border}`, overflow: 'hidden', opacity: 0.9 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 300, fontFamily: 'monospace', color: txt }}>2026.04</span>
                  <span style={{ fontSize: 9, color: muted, letterSpacing: '0.12em' }}>APRIL · KST</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['‹','›'].map(ch => (
                    <span key={ch} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${border}`, color: muted, fontSize: 12, cursor: 'pointer' }}>{ch}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${border}` }}>
                {['MON','TUE','WED','THU','FRI','SAT','SUN'].map((d, di) => (
                  <div key={d} style={{ padding: '6px 0', textAlign: 'center', fontSize: 8, letterSpacing: '0.1em', color: di >= 5 ? '#c87a8b' : dimmer, borderRight: di<6?`1px solid ${border}`:undefined }}>{d}</div>
                ))}
              </div>
              {[
                [{d:'30',prev:true,ev:[]},{d:'31',prev:true,ev:[]},{d:'01',ev:[{l:'韓 CPI',c:'#9a7ac8'}]},{d:'02',ev:[]},{d:'03',ev:[{l:'NFP',c:'#c87a8b'}]},{d:'04',ev:[],sat:true},{d:'05',ev:[],sun:true}],
                [{d:'06',ev:[]},{d:'07',ev:[{l:'美 PPI',c:'#9a7ac8'}]},{d:'08',ev:[{l:'K200만기',c:'#c8a96e'}]},{d:'09',ev:[{l:'美 CPI',c:'#9a7ac8'}]},{d:'10',ev:[{l:'JPMorgan',c:'#c87a8b'}]},{d:'11',ev:[],sat:true},{d:'12',ev:[],sun:true}],
                [{d:'13',ev:[]},{d:'14',ev:[]},{d:'15',ev:[]},{d:'16',ev:[{l:'FOMC',c:'#c87a8b'}]},{d:'17',ev:[{l:'TSMC실적',c:'#c87a8b'}]},{d:'18',ev:[],sat:true},{d:'19',ev:[],sun:true,today:true}],
              ].map((week,wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi<2?`1px solid ${border}`:undefined }}>
                  {week.map((cell,ci) => (
                    <div key={ci} style={{ minHeight: 42, padding: '4px 6px', borderRight: ci<6?`1px solid ${border}`:undefined, position: 'relative' }}>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: cell.today ? accent : (cell.prev ? dimmer : (cell.sat||cell.sun ? '#c87a8b55' : muted)), marginBottom: 3 }}>{cell.d}</div>
                      {cell.today && <div style={{ position: 'absolute', top: 4, right: 6, width: 5, height: 5, borderRadius: '50%', background: accent }} />}
                      {(cell as any).ev?.map((ev: any, ei: number) => (
                        <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                          <div style={{ width: 2, height: 10, background: ev.c, borderRadius: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 9, color: txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 52 }}>{ev.l}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* S7 CTA */}
        <div id="hs7" className="hw-scene" style={sceneBase}>
          <div style={{ textAlign: 'center', padding: '0 40px', maxWidth: 640 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.26em', color: accent, marginBottom: 32, fontWeight: 600 }}>GET STARTED</div>
            <div style={{ fontSize: 'clamp(32px, 5.5vw, 72px)', fontWeight: 200, color: txt, lineHeight: 1.1, letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', marginBottom: 20 }}>
              지금 시작하세요.
            </div>
            <p style={{ color: muted, fontSize: 15, lineHeight: 1.8, marginBottom: 44 }}>금융 언어를 이해하는 것이 투자의 시작입니다.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
              <button onClick={() => setActiveTab?.('glossary')} style={{
                background: accent, color: '#fff', border: 'none',
                padding: '14px 42px', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.07em', cursor: 'pointer', borderRadius: 2,
              }}>사전 열기</button>
              <button onClick={() => setActiveTab?.('calc')} style={{
                background: 'transparent', color: txt, border: `1px solid ${border}`,
                padding: '14px 42px', fontSize: 13, fontWeight: 500,
                letterSpacing: '0.07em', cursor: 'pointer', borderRadius: 2,
              }}>계산기 보기</button>
            </div>
            <div className="hw-shortcuts" style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              {[{ key: '⌘K', desc: '검색' }, { key: 'G', desc: '사전' }, { key: 'C', desc: '계산기' }, { key: '?', desc: '도움말' }].map((sc) => (
                <div key={sc.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <kbd style={{ background: bgSurf, border: `1px solid ${border}`, padding: '3px 7px', fontSize: 10, color: txt, fontFamily: 'monospace', borderRadius: 3 }}>{sc.key}</kbd>
                  <span style={{ fontSize: 10, color: dimmer }}>{sc.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── 우측 DOTS ────────────────────────────── */}
      <div className="hw-dots" style={{
        position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200,
      }}>
        {Array.from({ length: N }, (_, i) => (
          <button
            key={i}
            className="hw-dot"
            onClick={() => (window as any).__hwGoTo?.(i)}
            title={SCENE_LABELS[i]}
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: accent, border: 'none', padding: 0, cursor: 'pointer',
              opacity: i === 0 ? 1 : 0.2,
              transition: 'opacity 0.3s, transform 0.3s',
            }}
          />
        ))}
      </div>

      {/* ── 하단 PROGRESS ────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 2, background: border, zIndex: 200 }}>
        <div id="hw-prog" style={{ height: '100%', background: accent, transformOrigin: 'left center', transform: 'scaleX(0)', transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>

    </div>
  );
}
