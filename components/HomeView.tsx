'use client';
import React, { useEffect, useRef } from 'react';

// ──────────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────────
const N  = 12;
const PX = 1800;
const FF = 0.45;

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

const FAM = [
  { id: 'value',  label: 'VALUE',  color: '#C89650', num: '01' },
  { id: 'profit', label: 'PROFIT', color: '#A63D33', num: '02' },
  { id: 'risk',   label: 'RISK',   color: '#4F7E7C', num: '03' },
  { id: 'macro',  label: 'MACRO',  color: '#7C6A9B', num: '04' },
  { id: 'trade',  label: 'TRADE',  color: '#6B6B6B', num: '05' },
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
//  HomeView
// ──────────────────────────────────────────────
export default function HomeView({
  T, isDark, totalTerms, recent, favorites,
  setActiveTab, setSelectedCalc,
}: any) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // CSS injection
    const style = document.createElement('style');
    style.id = 'hw-styles';
    style.textContent = `
      /* scrollbar hidden */
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
      @keyframes hw-counter-glow {
        0%,100% { text-shadow: 0 0 0 transparent; }
        50% { text-shadow: 0 0 40px currentColor; }
      }
      .hw-scroll-cue { animation: hw-scroll-bounce 1.8s ease-in-out infinite; }
      .hw-stat-bar { transform-origin: left center; transform: scaleX(0); }
      .hw-stat-bar.lit { animation: hw-bar-in 0.9s cubic-bezier(0.22,1,0.36,1) forwards; }
      .hw-diff-fill { transition: width 0.9s cubic-bezier(0.22,1,0.36,1); }
      .hw-fam-row { transition: opacity 0.25s, transform 0.25s; }
      .hw-fam-row.on { opacity: 1 !important; letter-spacing: 0.08em; transform: translateX(6px); }
    `;
    document.head.appendChild(style);

    // body height
    window.scrollTo(0, 0);
    document.body.style.height = `${N * PX + window.innerHeight}px`;
    document.body.style.overflow = '';

    // scene elements
    const scenes = Array.from({ length: N }, (_, i) =>
      document.getElementById(`hs${i}`) as HTMLElement | null
    );

    // stat counter
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
      // stat bars
      let delay = 0;
      document.querySelectorAll<HTMLElement>('.hw-stat-bar').forEach((bar) => {
        setTimeout(() => bar.classList.add('lit'), delay);
        delay += 160;
      });
    }

    function triggerDbar() {
      dbarDone = true;
      const dbf = document.getElementById('hw-dbf');
      if (dbf) setTimeout(() => { dbf.style.width = '68%'; }, 300);
    }

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

      // family index highlight (s3-s7)
      if (activeIdx >= 3 && activeIdx <= 7) {
        const famIdx = activeIdx - 3;
        document.querySelectorAll<HTMLElement>('.hw-fam-row').forEach((row, ri) => {
          if (ri === famIdx) {
            row.classList.add('on');
            row.style.opacity = '1';
          } else {
            row.classList.remove('on');
            row.style.opacity = '0.28';
          }
        });
      }

      // dot indicator
      document.querySelectorAll<HTMLElement>('.hw-dot').forEach((dot, di) => {
        dot.style.opacity = di === activeIdx ? '1' : '0.25';
        dot.style.transform = di === activeIdx ? 'scale(1.4)' : 'scale(1)';
      });

      // progress bar
      const prog = document.getElementById('hw-prog');
      if (prog) {
        prog.style.transform = `scaleX(${(activeIdx / (N - 1)).toFixed(3)})`;
      }

      // scene entry triggers
      if (activeIdx !== lastActiveIdx) {
        lastActiveIdx = activeIdx;
        if (activeIdx === 2 && !countersStarted) triggerCounters();
        if (activeIdx === 9 && !dbarDone) triggerDbar();
      }
    }

    function loop() {
      const sy = window.scrollY;
      if (sy !== lastSY) { lastSY = sy; compute(sy); }
      rafId = requestAnimationFrame(loop);
    }

    compute(0);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      document.body.style.height = '';
      window.scrollTo(0, 0);
      const st = document.getElementById('hw-styles');
      if (st) st.remove();
    };
  }, []);

  const bg = isDark ? '#080808' : '#f5f4f0';
  const txt = isDark ? '#ede9df' : '#1a1a1a';
  const muted = isDark ? '#76726e' : '#999';
  const dimmer = isDark ? '#4a4745' : '#bbb';
  const border = isDark ? '#1c1c1c' : '#e0ddd8';
  const accent = '#C89650';
  const bgCard = isDark ? '#111' : '#fff';
  const bgSurf = isDark ? '#0d0d0d' : '#f0eeea';

  return (
    <>
      {/* ── FIXED STAGE ─────────────────────────── */}
      <div
        ref={stageRef}
        style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: bg, zIndex: 1 }}
      >

        {/* ── S0 HERO ──────────────────────────── */}
        <div id="hs0" style={sceneBase}>
          {/* animated grid bg */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.032)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px),
                              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.032)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)',
            animation: 'hw-grid-drift 12s linear infinite',
          }} />
          {/* radial glow */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: `radial-gradient(ellipse 60% 50% at 50% 55%, ${accent}28 0%, transparent 70%)`,
            animation: 'hw-glow-pulse 5s ease-in-out infinite',
          }} />
          {/* content */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 200,
              fontSize: 'clamp(52px, 10vw, 140px)',
              lineHeight: 1.0, letterSpacing: '-0.04em',
              color: txt,
            }}>
              <div>주식의</div>
              <div style={{ opacity: 0.45 }}>모든 언어를</div>
              <div style={{ color: accent }}>한 곳에.</div>
            </div>
            <p style={{ color: muted, fontSize: 'clamp(13px, 1.8vw, 17px)', marginTop: 32, marginBottom: 48, letterSpacing: '0.01em' }}>
              {totalTerms?.toLocaleString() || '2,400'}개 금융 용어 · 5개 패밀리 · 계산기 · 이벤트 캘린더
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab?.('glossary')}
                style={{
                  background: accent, color: '#fff', border: 'none',
                  padding: '14px 36px', fontSize: 14, fontWeight: 600,
                  letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 2,
                }}
              >
                사전 열기
              </button>
              <button
                onClick={() => setActiveTab?.('calc')}
                style={{
                  background: 'transparent', color: txt, border: `1px solid ${border}`,
                  padding: '14px 36px', fontSize: 14, fontWeight: 500,
                  letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 2,
                }}
              >
                계산기 보기
              </button>
            </div>
            {/* scroll cue */}
            <div className="hw-scroll-cue" style={{ marginTop: 80, color: muted, fontSize: 11, letterSpacing: '0.14em' }}>
              <div style={{ width: 1, height: 36, background: `linear-gradient(to bottom, transparent, ${muted})`, margin: '0 auto 8px' }} />
              SCROLL
            </div>
          </div>
        </div>

        {/* ── S1 PHILOSOPHY ──────────────────────── */}
        <div id="hs1" style={sceneBase}>
          <div style={{ maxWidth: 720, padding: '0 40px', textAlign: 'center' }}>
            <div style={{
              fontSize: 11, letterSpacing: '0.22em', color: accent,
              marginBottom: 40, fontWeight: 500,
            }}>
              PHILOSOPHY
            </div>
            <blockquote style={{
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: 'clamp(22px, 3.5vw, 38px)',
              lineHeight: 1.6, color: txt, margin: 0,
              borderLeft: `3px solid ${accent}`,
              paddingLeft: 32, textAlign: 'left',
            }}>
              시장은 언어를 사용한다.<br />
              <em style={{ color: accent }}>그 언어를 이해하는 자</em>만이<br />
              기회를 읽을 수 있다.
            </blockquote>
            <p style={{ color: muted, marginTop: 40, fontSize: 'clamp(13px, 1.6vw, 16px)', lineHeight: 1.8 }}>
              StockWiKi는 금융 용어를 단순히 설명하지 않습니다.<br />
              개념 간의 연결, 실전 적용, 시장 맥락을 함께 제공합니다.
            </p>
          </div>
        </div>

        {/* ── S2 NUMBERS ─────────────────────────── */}
        <div id="hs2" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 960, padding: '0 40px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', color: accent, marginBottom: 60, textAlign: 'center', fontWeight: 500 }}>
              BY THE NUMBERS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, textAlign: 'center' }}>
              {[
                { to: totalTerms || 2400, label: '금융 용어', unit: '개', color: accent },
                { to: 5, label: '패밀리 카테고리', unit: '개', color: '#4F7E7C' },
                { to: 30, label: '계산기 도구', unit: '종', color: '#A63D33' },
                { to: 365, label: '이벤트 캘린더', unit: '일', color: '#7C6A9B' },
              ].map((stat, i) => (
                <div key={i} className="hw-stat-item">
                  <div style={{
                    fontSize: 'clamp(48px, 6vw, 80px)', fontWeight: 200,
                    color: stat.color, lineHeight: 1, fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.04em',
                  }}>
                    <span className="hw-num" data-to={stat.to}>0</span>
                    <span style={{ fontSize: '0.35em', fontWeight: 400, opacity: 0.7, marginLeft: 4 }}>{stat.unit}</span>
                  </div>
                  <div style={{ color: muted, fontSize: 12, letterSpacing: '0.12em', marginTop: 12 }}>
                    {stat.label}
                  </div>
                  <div style={{ height: 2, background: border, marginTop: 20, borderRadius: 1 }}>
                    <div className="hw-stat-bar" style={{ height: '100%', background: stat.color, transformOrigin: 'left center' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── S3–S7 FAMILY SCENES ────────────────── */}
        {FAM.map((fam, fi) => (
          <div key={fam.id} id={`hs${3 + fi}`} style={sceneBase}>
            {/* large bg number */}
            <div style={{
              position: 'absolute', right: '6%', bottom: '-5%',
              fontSize: 'clamp(200px, 28vw, 380px)', fontWeight: 800,
              color: fam.color, opacity: 0.035, lineHeight: 1,
              fontFamily: 'Inter, sans-serif', userSelect: 'none', pointerEvents: 'none',
              letterSpacing: '-0.06em',
            }}>
              {fam.num}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 320px', gap: 80,
              width: '100%', maxWidth: 1100, padding: '0 40px',
              alignItems: 'center',
            }}>
              {/* left */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.24em', color: fam.color, marginBottom: 20, fontWeight: 600 }}>
                  FAMILY {fam.num}
                </div>
                <div style={{
                  fontSize: 'clamp(64px, 10vw, 112px)', fontWeight: 200,
                  color: txt, letterSpacing: '-0.05em', lineHeight: 1,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {fam.label}
                </div>
                <div style={{ width: 48, height: 2, background: fam.color, margin: '28px 0' }} />
                <p style={{ color: muted, fontSize: 'clamp(13px, 1.5vw, 16px)', lineHeight: 1.9, maxWidth: 480 }}>
                  {FAM_DESC[fi]}
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  marginTop: 32, padding: '6px 14px',
                  border: `1px solid ${fam.color}44`,
                  fontSize: 11, letterSpacing: '0.12em', color: fam.color,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: fam.color }} />
                  {fam.label} FAMILY
                </div>
              </div>
              {/* right: family index */}
              <div>
                <div style={{ fontSize: 10, color: dimmer, letterSpacing: '0.18em', marginBottom: 20 }}>INDEX</div>
                {FAM.map((f, ri) => (
                  <div
                    key={f.id}
                    className="hw-fam-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 0', borderBottom: `1px solid ${border}`,
                      opacity: ri === fi ? 1 : 0.28,
                      cursor: 'default',
                    }}
                  >
                    <div style={{
                      width: 3, height: 28,
                      background: ri === fi ? f.color : dimmer,
                      transition: 'background 0.3s',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, letterSpacing: '0.08em', color: ri === fi ? f.color : muted, fontWeight: ri === fi ? 600 : 400 }}>
                        {f.label}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: dimmer }}>{f.num}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* ── S8 GLOSSARY FEATURE ────────────────── */}
        <div id="hs8" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 1000, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: accent, marginBottom: 16, fontWeight: 500 }}>FEATURE 01</div>
            <div style={{ fontSize: 'clamp(28px, 4.5vw, 56px)', fontWeight: 200, color: txt, letterSpacing: '-0.03em', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
              금융 사전
            </div>
            <p style={{ color: muted, fontSize: 14, lineHeight: 1.8, marginBottom: 48, maxWidth: 480 }}>
              2,400개+ 용어를 5개 패밀리로 분류. 개요·심화·공식·예시·연결관계까지 한 화면에서.
            </p>
            {/* mock card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                { term: 'PER', cat: 'VALUE', color: '#C89650', desc: '주가수익비율. 주가를 주당순이익으로 나눈 값으로 기업 고평가/저평가 판단 지표.' },
                { term: 'VaR', cat: 'RISK', color: '#4F7E7C', desc: '최대 손실 가능성. 특정 기간 동안 발생할 수 있는 최대 손실 금액을 확률적으로 추정.' },
                { term: 'ROE', cat: 'PROFIT', color: '#A63D33', desc: '자기자본이익률. 투자한 자기자본 대비 얼마나 수익을 창출했는지 보여주는 지표.' },
              ].map((item) => (
                <div key={item.term} style={{ background: bgCard, border: `1px solid ${border}`, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: item.color, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                      {item.term}
                    </span>
                    <span style={{ fontSize: 9, background: `${item.color}22`, color: item.color, padding: '2px 8px', letterSpacing: '0.1em' }}>
                      {item.cat}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: muted, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── S9 CALCULATOR FEATURE ──────────────── */}
        <div id="hs9" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 1000, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: '#A63D33', marginBottom: 16, fontWeight: 500 }}>FEATURE 02</div>
            <div style={{ fontSize: 'clamp(28px, 4.5vw, 56px)', fontWeight: 200, color: txt, letterSpacing: '-0.03em', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
              금융 계산기
            </div>
            <p style={{ color: muted, fontSize: 14, lineHeight: 1.8, marginBottom: 48, maxWidth: 480 }}>
              복리, 손익분기, PER/PBR, 옵션 등 30종 계산기. A/B 비교 모드로 시나리오 분석.
            </p>
            {/* A/B diff mock */}
            <div style={{ background: bgCard, border: `1px solid ${border}`, padding: '28px 32px', maxWidth: 540 }}>
              <div style={{ fontSize: 11, color: muted, letterSpacing: '0.1em', marginBottom: 24 }}>A / B 수익률 비교</div>
              {[
                { label: 'A — 연 복리 8%, 10년', pct: '116%', color: accent, width: '100%' },
                { label: 'B — 단리 8%, 10년', pct: '80%', color: '#4F7E7C', isMock: true },
              ].map((row, ri) => (
                <div key={ri} style={{ marginBottom: ri === 0 ? 20 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: muted }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: row.color, fontFamily: 'Inter, sans-serif' }}>{row.pct}</span>
                  </div>
                  <div style={{ height: 6, background: border, borderRadius: 3, overflow: 'hidden' }}>
                    {ri === 0
                      ? <div style={{ height: '100%', background: row.color, width: row.width, borderRadius: 3 }} />
                      : <div id="hw-dbf" className="hw-diff-fill" style={{ height: '100%', background: row.color, width: '0%', borderRadius: 3 }} />
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── S10 CALENDAR FEATURE ───────────────── */}
        <div id="hs10" style={sceneBase}>
          <div style={{ width: '100%', maxWidth: 1000, padding: '0 40px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: '#7C6A9B', marginBottom: 16, fontWeight: 500 }}>FEATURE 03</div>
            <div style={{ fontSize: 'clamp(28px, 4.5vw, 56px)', fontWeight: 200, color: txt, letterSpacing: '-0.03em', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
              이벤트 캘린더
            </div>
            <p style={{ color: muted, fontSize: 14, lineHeight: 1.8, marginBottom: 48, maxWidth: 480 }}>
              FOMC, 실적 발표, 경제지표 발표일을 한눈에. 365일 마켓 이벤트 추적.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, maxWidth: 700 }}>
              {[
                { date: 'APR 30', event: 'FOMC 금리 결정', type: 'HIGH', color: '#A63D33' },
                { date: 'MAY 02', event: '미국 고용지표', type: 'MED', color: accent },
                { date: 'MAY 07', event: '삼성전자 실적', type: 'HIGH', color: '#7C6A9B' },
                { date: 'MAY 13', event: '美 CPI 발표', type: 'HIGH', color: '#A63D33' },
              ].map((ev) => (
                <div key={ev.date} style={{ background: bgCard, border: `1px solid ${border}`, padding: '16px 20px' }}>
                  <div style={{ fontSize: 10, color: ev.color, letterSpacing: '0.1em', marginBottom: 8 }}>{ev.date}</div>
                  <div style={{ fontSize: 13, color: txt, marginBottom: 6 }}>{ev.event}</div>
                  <div style={{ fontSize: 9, color: ev.color, background: `${ev.color}18`, padding: '2px 8px', display: 'inline-block', letterSpacing: '0.1em' }}>
                    {ev.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── S11 CTA ───────────────────────────── */}
        <div id="hs11" style={sceneBase}>
          <div style={{ textAlign: 'center', padding: '0 40px', maxWidth: 680 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', color: accent, marginBottom: 40, fontWeight: 500 }}>
              GET STARTED
            </div>
            <div style={{
              fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: 200,
              color: txt, lineHeight: 1.1, letterSpacing: '-0.04em',
              fontFamily: 'Inter, sans-serif', marginBottom: 24,
            }}>
              지금 시작하세요.
            </div>
            <p style={{ color: muted, fontSize: 15, lineHeight: 1.8, marginBottom: 52 }}>
              금융 언어를 이해하는 것이 투자의 시작입니다.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
              <button
                onClick={() => setActiveTab?.('glossary')}
                style={{
                  background: accent, color: '#fff', border: 'none',
                  padding: '16px 44px', fontSize: 14, fontWeight: 600,
                  letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 2,
                }}
              >
                사전 열기
              </button>
              <button
                onClick={() => setActiveTab?.('calc')}
                style={{
                  background: 'transparent', color: txt, border: `1px solid ${border}`,
                  padding: '16px 44px', fontSize: 14, fontWeight: 500,
                  letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 2,
                }}
              >
                계산기 보기
              </button>
            </div>
            {/* shortcut guide */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              {[
                { key: '⌘K', desc: '검색' },
                { key: 'G', desc: '사전 이동' },
                { key: 'C', desc: '계산기' },
                { key: '?', desc: '도움말' },
              ].map((sc) => (
                <div key={sc.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <kbd style={{
                    background: bgSurf, border: `1px solid ${border}`,
                    padding: '3px 8px', fontSize: 11, color: txt,
                    fontFamily: 'monospace', borderRadius: 3,
                  }}>{sc.key}</kbd>
                  <span style={{ fontSize: 11, color: dimmer }}>{sc.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DOTS NAVIGATOR ─────────────────────── */}
        <div style={{
          position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 10, zIndex: 100,
        }}>
          {Array.from({ length: N }, (_, i) => (
            <button
              key={i}
              className="hw-dot"
              onClick={() => window.scrollTo({ top: i * PX, behavior: 'smooth' })}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: accent, border: 'none', padding: 0, cursor: 'pointer',
                opacity: i === 0 ? 1 : 0.25,
                transition: 'opacity 0.3s, transform 0.3s',
              }}
            />
          ))}
        </div>

        {/* ── PROGRESS BAR ───────────────────────── */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 2,
          background: border, zIndex: 100,
        }}>
          <div
            id="hw-prog"
            style={{
              height: '100%', background: accent,
              transformOrigin: 'left center', transform: 'scaleX(0)',
            }}
          />
        </div>

      </div>
    </>
  );
}

const FAM_DESC = [
  '기업의 내재 가치를 분석하는 접근법입니다. PER, PBR, DCF 등 밸류에이션 도구로 저평가 자산을 발굴합니다.',
  '포지션의 수익성을 극대화하는 전략입니다. ROE, ROA, 영업이익률 등 수익 지표로 우수 기업을 선별합니다.',
  '포트폴리오 리스크를 정량화하고 관리하는 방법론입니다. VaR, 샤프 지수, 베타로 위험을 측정합니다.',
  '거시경제 환경이 시장에 미치는 영향을 분석합니다. 금리, 환율, 인플레이션, 경기 사이클을 읽어냅니다.',
  '실전 매매에서 사용하는 기법과 도구입니다. 차트 패턴, 모멘텀, 포지션 사이징, 손절 전략을 다룹니다.',
];
