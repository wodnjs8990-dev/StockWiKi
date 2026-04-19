'use client';
import React, { useEffect, useRef } from 'react';

// ──────────────────────────────────────────────
//  씬 구성: N=8
//  S0 Hero / S1 Philosophy / S2 Numbers
//  S3 Categories (9개 패밀리 한 화면)
//  S4 Glossary feature / S5 Calculator feature
//  S6 Calendar feature / S7 CTA
// ──────────────────────────────────────────────
const N  = 8;
const PX = 1800;   // 씬당 스크롤 픽셀
const FF = 0.45;   // crossfade 구간 비율

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

// ──────────────────────────────────────────────
export default function HomeView({
  T, isDark, totalTerms,
  setActiveTab, setSelectedCalc,
}: any) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ── CSS 주입 ──
    const style = document.createElement('style');
    style.id = 'hw-styles';
    style.textContent = `
      html { scrollbar-width: none; }
      html::-webkit-scrollbar { display: none; }

      @keyframes hw-grid-drift {
        0%   { background-position: 0 0; }
        100% { background-position: 80px 80px; }
      }
      @keyframes hw-glow-pulse {
        0%,100% { opacity: 0.18; transform: scale(1); }
        50%      { opacity: 0.32; transform: scale(1.12); }
      }
      @keyframes hw-scroll-bounce {
        0%,100% { transform: translateY(0); opacity:0.5; }
        50%      { transform: translateY(8px); opacity:1; }
      }
      @keyframes hw-bar-in {
        from { transform: scaleX(0); }
        to   { transform: scaleX(1); }
      }
      .hw-scroll-cue { animation: hw-scroll-bounce 1.8s ease-in-out infinite; }
      .hw-stat-bar { transform-origin: left center; transform: scaleX(0); }
      .hw-stat-bar.lit { animation: hw-bar-in 0.9s cubic-bezier(0.22,1,0.36,1) forwards; }
      .hw-diff-fill { transition: width 0.9s cubic-bezier(0.22,1,0.36,1); }
      .hw-fam-card {
        transition: opacity 0.3s, transform 0.3s, border-color 0.3s;
        cursor: pointer;
      }
      .hw-fam-card:hover {
        opacity: 1 !important;
        transform: translateY(-3px) !important;
      }
    `;
    document.head.appendChild(style);

    // ── body 높이 / 초기화 ──
    // body/html 배경을 stage와 동일하게 설정 → 초기 FOUC 및 마지막 씬 이후 배경 불일치 방지
    const prevBg = document.body.style.background;
    const prevHtmlBg = document.documentElement.style.background;
    const stageBg = isDark ? '#080808' : '#f5f4f0';
    document.body.style.background = stageBg;
    document.documentElement.style.background = stageBg;
    document.body.classList.add('hw-active');
    document.documentElement.classList.add('hw-active');

    window.scrollTo(0, 0);
    document.body.style.height = `${N * PX + window.innerHeight}px`;
    document.body.style.overflow = '';

    const scenes = Array.from({ length: N }, (_, i) =>
      document.getElementById(`hs${i}`) as HTMLElement | null
    );

    // ── 트리거 상태 ──
    let countersStarted = false;
    let dbarDone = false;

    function triggerCounters() {
      countersStarted = true;
      document.querySelectorAll<HTMLElement>('.hw-num[data-to]').forEach((el) => {
        const to = parseInt(el.dataset.to || '0', 10);
        const dur = 1500;
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
        delay += 160;
      });
    }

    function triggerDbar() {
      dbarDone = true;
      const dbf = document.getElementById('hw-dbf');
      if (dbf) setTimeout(() => { (dbf as HTMLElement).style.width = '68%'; }, 300);
    }

    // ── 스크롤 스냅 ──
    // 씬 경계의 50% 넘으면 다음/이전 씬으로 자동 스냅
    let snapTimeout: ReturnType<typeof setTimeout> | null = null;
    let isSnapping = false;

    function scheduleSnap(sy: number) {
      if (snapTimeout) clearTimeout(snapTimeout);
      snapTimeout = setTimeout(() => {
        if (isSnapping) return;
        // 마지막 씬 너머로 스크롤하면 즉시 마지막 씬으로 강제 스냅
        const maxSY = (N - 1) * PX;
        if (sy > maxSY + 50) {
          isSnapping = true;
          window.scrollTo({ top: maxSY, behavior: 'smooth' });
          setTimeout(() => { isSnapping = false; }, 700);
          return;
        }
        const rawIdx = sy / PX;
        const nearestIdx = Math.round(rawIdx);
        const clampedIdx = Math.max(0, Math.min(N - 1, nearestIdx));
        const targetSY = clampedIdx * PX;
        if (Math.abs(sy - targetSY) > 12) {
          isSnapping = true;
          window.scrollTo({ top: targetSY, behavior: 'smooth' });
          setTimeout(() => { isSnapping = false; }, 700);
        }
      }, 80);
    }

    // ── RAF 루프 ──
    let lastSY = -1;
    let lastActiveIdx = -1;
    let rafId: number;

    function compute(sy: number) {
      let activeIdx = 0;
      let maxO = -1;

      scenes.forEach((s, i) => {
        if (!s) return;
        const dist = (sy - i * PX) / PX;
        let o = 0, y = 0;

        if (dist >= -FF && dist < 0) {
          const t = easeOut((dist + FF) / FF);
          o = t; y = 60 * (1 - t);
        } else if (dist >= 0 && dist <= 1 - FF) {
          o = 1; y = 0;
        } else if (dist > 1 - FF && dist <= 1) {
          const t = easeOut((dist - (1 - FF)) / FF);
          o = 1 - t; y = -60 * t;
        } else {
          o = 0; y = dist < -FF ? 60 : -60;
        }

        const finalO = o < 0.002 ? 0 : o > 0.998 ? 1 : o;
        s.style.opacity = String(finalO);
        s.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
        s.style.pointerEvents = finalO > 0.05 ? 'auto' : 'none';

        if (finalO > maxO) { maxO = finalO; activeIdx = i; }
      });

      // dot
      document.querySelectorAll<HTMLElement>('.hw-dot').forEach((dot, di) => {
        dot.style.opacity = di === activeIdx ? '1' : '0.22';
        dot.style.transform = di === activeIdx ? 'scale(1.5)' : 'scale(1)';
      });

      // progress
      const prog = document.getElementById('hw-prog');
      if (prog) prog.style.transform = `scaleX(${(activeIdx / (N - 1)).toFixed(3)})`;

      // 씬 진입 트리거
      if (activeIdx !== lastActiveIdx) {
        lastActiveIdx = activeIdx;
        if (activeIdx === 2 && !countersStarted) triggerCounters();
        if (activeIdx === 5 && !dbarDone) triggerDbar();
      }
    }

    function loop() {
      const sy = window.scrollY;
      if (sy !== lastSY) {
        lastSY = sy;
        compute(sy);
        scheduleSnap(sy);
      }
      rafId = requestAnimationFrame(loop);
    }

    compute(0);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      if (snapTimeout) clearTimeout(snapTimeout);
      document.body.style.height = '';
      document.body.style.background = prevBg;
      document.documentElement.style.background = prevHtmlBg;
      document.body.classList.remove('hw-active');
      document.documentElement.classList.remove('hw-active');
      window.scrollTo(0, 0);
      document.getElementById('hw-styles')?.remove();
    };
  }, []);

  // 색상 토큰
  const bg     = isDark ? '#080808' : '#f5f4f0';
  const txt    = isDark ? '#ede9df' : '#1a1a1a';
  const muted  = isDark ? '#76726e' : '#999';
  const dimmer = isDark ? '#4a4745' : '#bbb';
  const border = isDark ? '#1c1c1c' : '#e0ddd8';
  const accent = '#C89650';
  const bgCard = isDark ? '#111' : '#fff';
  const bgSurf = isDark ? '#0d0d0d' : '#f0eeea';

  return (
    <>
      <div
        ref={stageRef}
        style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: bg, zIndex: 1 }}
      >

        {/* ── S0 HERO ─────────────────────────────── */}
        <div id="hs0" style={sceneBase}>
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px),
                              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 100%)',
            animation: 'hw-grid-drift 14s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: `radial-gradient(ellipse 55% 45% at 50% 55%, ${accent}22 0%, transparent 70%)`,
            animation: 'hw-glow-pulse 5s ease-in-out infinite',
          }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 200,
              fontSize: 'clamp(52px, 10vw, 140px)',
              lineHeight: 1.0, letterSpacing: '-0.04em', color: txt,
            }}>
              <div>주식의</div>
              <div style={{ opacity: 0.4 }}>모든 언어를</div>
              <div style={{ color: accent }}>한 곳에.</div>
            </div>
            <p style={{ color: muted, fontSize: 'clamp(13px, 1.6vw, 16px)', marginTop: 28, marginBottom: 44, letterSpacing: '0.01em' }}>
              {(totalTerms || 2400).toLocaleString()}개 금융 용어 &middot; 9개 패밀리 &middot; 계산기 &middot; 이벤트 캘린더
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab?.('glossary')} style={{
                background: accent, color: '#fff', border: 'none',
                padding: '13px 34px', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.07em', cursor: 'pointer', borderRadius: 2,
              }}>사전 열기</button>
              <button onClick={() => setActiveTab?.('calc')} style={{
                background: 'transparent', color: txt, border: `1px solid ${border}`,
                padding: '13px 34px', fontSize: 13, fontWeight: 500,
                letterSpacing: '0.07em', cursor: 'pointer', borderRadius: 2,
              }}>계산기 보기</button>
            </div>
            <div className="hw-scroll-cue" style={{ marginTop: 72, color: dimmer, fontSize: 10, letterSpacing: '0.16em' }}>
              <div style={{ width: 1, height: 32, background: `linear-gradient(to bottom, transparent, ${dimmer})`, margin: '0 auto 8px' }} />
              SCROLL
            </div>
          </div>
        </div>

        {/* ── S1 PHILOSOPHY ───────────────────────── */}
        <div id="hs1" style={sceneBase}>
          <div style={{ maxWidth: 700, padding: '0 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.24em', color: accent, marginBottom: 36, fontWeight: 600 }}>
              PHILOSOPHY
            </div>
            <blockquote style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: 'clamp(20px, 3.2vw, 36px)',
              lineHeight: 1.65, color: txt, margin: 0,
              borderLeft: `2px solid ${accent}`, paddingLeft: 28, textAlign: 'left',
            }}>
              시장은 언어를 사용한다.<br />
              <em style={{ color: accent }}>그 언어를 이해하는 자</em>만이<br />
              기회를 읽을 수 있다.
            </blockquote>
            <p style={{ color: muted, marginTop: 36, fontSize: 'clamp(13px, 1.5vw, 15px)', lineHeight: 1.9, textAlign: 'left', paddingLeft: 28 }}>
              StockWiKi는 금융 용어를 단순히 설명하지 않습니다.
              개념 간의 연결, 실전 적용, 시장 맥락을 함께 제공합니다.
            </p>
          </div>
        </div>

        {/* ── S2 NUMBERS ──────────────────────────── */}
        <div id="hs2" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 960, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.24em', color: accent, marginBottom: 56, textAlign: 'center', fontWeight: 600 }}>
              BY THE NUMBERS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, textAlign: 'center' }}>
              {[
                { to: totalTerms || 2400, label: '금융 용어', unit: '개', color: accent },
                { to: 9, label: '패밀리 카테고리', unit: '개', color: '#8bc87a' },
                { to: 30, label: '계산기 도구', unit: '종', color: '#c87a8b' },
                { to: 365, label: '이벤트 캘린더', unit: '일', color: '#9a7ac8' },
              ].map((stat, i) => (
                <div key={i}>
                  <div style={{
                    fontSize: 'clamp(44px, 6vw, 76px)', fontWeight: 200,
                    color: stat.color, lineHeight: 1, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em',
                  }}>
                    <span className="hw-num" data-to={stat.to}>0</span>
                    <span style={{ fontSize: '0.34em', fontWeight: 400, opacity: 0.65, marginLeft: 4 }}>{stat.unit}</span>
                  </div>
                  <div style={{ color: muted, fontSize: 11, letterSpacing: '0.14em', marginTop: 10 }}>{stat.label}</div>
                  <div style={{ height: 2, background: border, marginTop: 18, borderRadius: 1 }}>
                    <div className="hw-stat-bar" style={{ height: '100%', background: stat.color, transformOrigin: 'left center' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── S3 CATEGORIES (9개 패밀리 한 화면) ──── */}
        <div id="hs3" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 1100, padding: '0 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.24em', color: accent, marginBottom: 12, fontWeight: 600 }}>
                9 FAMILIES
              </div>
              <div style={{
                fontSize: 'clamp(22px, 3.5vw, 40px)', fontWeight: 200,
                color: txt, letterSpacing: '-0.03em', fontFamily: 'Inter, sans-serif',
              }}>
                모든 금융 언어는 9개 패밀리로 분류됩니다
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10,
            }}>
              {FAMILIES.map((fam) => (
                <button
                  key={fam.id}
                  className="hw-fam-card"
                  onClick={() => setActiveTab?.('glossary')}
                  style={{
                    background: bgCard,
                    border: `1px solid ${fam.color}33`,
                    padding: '18px 20px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 3,
                    opacity: 0.85,
                  }}
                >
                  <div style={{
                    width: 28, height: 3, background: fam.color,
                    marginBottom: 14, borderRadius: 2,
                  }} />
                  <div style={{
                    fontSize: 11, letterSpacing: '0.14em', color: fam.color,
                    fontWeight: 600, marginBottom: 6,
                  }}>
                    {fam.en}
                  </div>
                  <div style={{ fontSize: 14, color: txt, marginBottom: 8, fontWeight: 500 }}>
                    {fam.label}
                  </div>
                  <div style={{ fontSize: 11, color: muted, lineHeight: 1.6 }}>
                    {fam.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── S4 GLOSSARY FEATURE ─────────────────── */}
        <div id="hs4" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 1000, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: accent, marginBottom: 14, fontWeight: 500 }}>FEATURE 01</div>
            <div style={{ fontSize: 'clamp(26px, 4vw, 52px)', fontWeight: 200, color: txt, letterSpacing: '-0.03em', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
              금융 사전
            </div>
            <p style={{ color: muted, fontSize: 14, lineHeight: 1.8, marginBottom: 44, maxWidth: 460 }}>
              {(totalTerms || 2400).toLocaleString()}개 용어를 9개 패밀리로 분류. 개요·심화·공식·예시·연결관계까지 한 화면에서.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {[
                { term: 'PER', cat: 'FUNDAMENTAL', color: '#c8a96e', desc: '주가수익비율. 주가를 주당순이익으로 나눈 값으로 기업 고평가/저평가 판단 지표.' },
                { term: 'VaR', cat: 'RISK',        color: '#c87a8b', desc: '최대 손실 가능성. 특정 기간 동안 발생할 수 있는 최대 손실 금액을 확률적으로 추정.' },
                { term: 'ROE', cat: 'FUNDAMENTAL', color: '#c8a96e', desc: '자기자본이익률. 투자한 자기자본 대비 얼마나 수익을 창출했는지 보여주는 지표.' },
              ].map((item) => (
                <div key={item.term} style={{ background: bgCard, border: `1px solid ${border}`, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: item.color, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>{item.term}</span>
                    <span style={{ fontSize: 9, background: `${item.color}22`, color: item.color, padding: '2px 8px', letterSpacing: '0.1em' }}>{item.cat}</span>
                  </div>
                  <p style={{ fontSize: 12, color: muted, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── S5 CALCULATOR FEATURE ───────────────── */}
        <div id="hs5" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 1000, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: '#c87a8b', marginBottom: 14, fontWeight: 500 }}>FEATURE 02</div>
            <div style={{ fontSize: 'clamp(26px, 4vw, 52px)', fontWeight: 200, color: txt, letterSpacing: '-0.03em', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
              금융 계산기
            </div>
            <p style={{ color: muted, fontSize: 14, lineHeight: 1.8, marginBottom: 44, maxWidth: 460 }}>
              복리·손익분기·PER/PBR·옵션 등 30종 계산기. A/B 비교 모드로 시나리오 분석.
            </p>
            <div style={{ background: bgCard, border: `1px solid ${border}`, padding: '26px 30px', maxWidth: 520 }}>
              <div style={{ fontSize: 11, color: muted, letterSpacing: '0.1em', marginBottom: 22 }}>A / B 수익률 비교</div>
              {[
                { label: 'A — 연 복리 8%, 10년', pct: '116%', color: accent, isStatic: true },
                { label: 'B — 단리 8%, 10년',   pct: '80%',  color: '#7ac8c0', isStatic: false },
              ].map((row, ri) => (
                <div key={ri} style={{ marginBottom: ri === 0 ? 18 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 12, color: muted }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontFamily: 'Inter, sans-serif' }}>{row.pct}</span>
                  </div>
                  <div style={{ height: 5, background: border, borderRadius: 3, overflow: 'hidden' }}>
                    {row.isStatic
                      ? <div style={{ height: '100%', background: row.color, width: '100%', borderRadius: 3 }} />
                      : <div id="hw-dbf" className="hw-diff-fill" style={{ height: '100%', background: row.color, width: '0%', borderRadius: 3 }} />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── S6 CALENDAR FEATURE ─────────────────── */}
        <div id="hs6" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 1000, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: '#9a7ac8', marginBottom: 14, fontWeight: 500 }}>FEATURE 03</div>
            <div style={{ fontSize: 'clamp(26px, 4vw, 52px)', fontWeight: 200, color: txt, letterSpacing: '-0.03em', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
              이벤트 캘린더
            </div>
            <p style={{ color: muted, fontSize: 14, lineHeight: 1.8, marginBottom: 44, maxWidth: 460 }}>
              FOMC·실적 발표·경제지표 발표일을 한눈에. 365일 마켓 이벤트 추적.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, maxWidth: 700 }}>
              {[
                { date: 'APR 30', event: 'FOMC 금리 결정',  type: 'HIGH', color: '#c87a8b' },
                { date: 'MAY 02', event: '미국 고용지표',    type: 'MED',  color: accent },
                { date: 'MAY 07', event: '삼성전자 실적',    type: 'HIGH', color: '#9a7ac8' },
                { date: 'MAY 13', event: '美 CPI 발표',      type: 'HIGH', color: '#c87a8b' },
              ].map((ev) => (
                <div key={ev.date} style={{ background: bgCard, border: `1px solid ${border}`, padding: '14px 18px' }}>
                  <div style={{ fontSize: 10, color: ev.color, letterSpacing: '0.1em', marginBottom: 7 }}>{ev.date}</div>
                  <div style={{ fontSize: 13, color: txt, marginBottom: 6 }}>{ev.event}</div>
                  <div style={{ fontSize: 9, color: ev.color, background: `${ev.color}18`, padding: '2px 8px', display: 'inline-block', letterSpacing: '0.1em' }}>{ev.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── S7 CTA ──────────────────────────────── */}
        <div id="hs7" style={sceneBase}>
          <div style={{ textAlign: 'center', padding: '0 40px', maxWidth: 660 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.24em', color: accent, marginBottom: 36, fontWeight: 600 }}>GET STARTED</div>
            <div style={{
              fontSize: 'clamp(34px, 6vw, 76px)', fontWeight: 200,
              color: txt, lineHeight: 1.1, letterSpacing: '-0.04em',
              fontFamily: 'Inter, sans-serif', marginBottom: 22,
            }}>
              지금 시작하세요.
            </div>
            <p style={{ color: muted, fontSize: 15, lineHeight: 1.8, marginBottom: 48 }}>
              금융 언어를 이해하는 것이 투자의 시작입니다.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
              <button onClick={() => setActiveTab?.('glossary')} style={{
                background: accent, color: '#fff', border: 'none',
                padding: '15px 42px', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.07em', cursor: 'pointer', borderRadius: 2,
              }}>사전 열기</button>
              <button onClick={() => setActiveTab?.('calc')} style={{
                background: 'transparent', color: txt, border: `1px solid ${border}`,
                padding: '15px 42px', fontSize: 13, fontWeight: 500,
                letterSpacing: '0.07em', cursor: 'pointer', borderRadius: 2,
              }}>계산기 보기</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
              {[{ key: '⌘K', desc: '검색' }, { key: 'G', desc: '사전' }, { key: 'C', desc: '계산기' }, { key: '?', desc: '도움말' }].map((sc) => (
                <div key={sc.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <kbd style={{ background: bgSurf, border: `1px solid ${border}`, padding: '3px 7px', fontSize: 10, color: txt, fontFamily: 'monospace', borderRadius: 3 }}>{sc.key}</kbd>
                  <span style={{ fontSize: 10, color: dimmer }}>{sc.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DOTS ────────────────────────────────── */}
        <div style={{
          position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 10, zIndex: 100,
        }}>
          {Array.from({ length: N }, (_, i) => (
            <button
              key={i}
              className="hw-dot"
              onClick={() => window.scrollTo({ top: i * PX, behavior: 'smooth' })}
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: accent, border: 'none', padding: 0, cursor: 'pointer',
                opacity: i === 0 ? 1 : 0.22,
                transition: 'opacity 0.3s, transform 0.3s',
              }}
            />
          ))}
        </div>

        {/* ── PROGRESS ────────────────────────────── */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 2, background: border, zIndex: 100 }}>
          <div id="hw-prog" style={{ height: '100%', background: accent, transformOrigin: 'left center', transform: 'scaleX(0)' }} />
        </div>

      </div>
    </>
  );
}
