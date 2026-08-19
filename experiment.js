/* =============================================================
   STUDY LICK-4 — CHS REPLICATION OF LICK-3 (3x2 within, relation between)
   Children (6-8) watch 6 short vignettes in randomized order.
   Each vignette features a unique girl protagonist and one
   side character (the protagonist's mom OR her teacher, fixed
   per participant). The side character either plays the
   protagonist's kazoo (Saliva), uses her drumstick (Touch), or
   replaces her kazoo after it is blown over (Prosocial). Each
   happens with the protagonist either Present (consent implied)
   or Absent (no consent).

   Design: 3 (Condition: Saliva / Touch / Prosocial) x 2 (Consent:
   Present / Absent) within-subjects, x 2 (Relationship: Mom /
   Teacher) BETWEEN-SUBJECTS. 6 trials per child.

   Why between-subjects on Relationship? The original LICK-3 had
   a within-subjects relationship manipulation that produced
   carryover effects (the first relationship encountered anchored
   later judgments). Splitting Relationship between subjects
   eliminates that confound.

   Counterbalanced per child:
     - Relationship (Mom vs Teacher), random
     - Trial order (random permutation of 6 cells)
     - Protagonist-to-cell assignment (6 J-names sampled from 12)

   This file is the CHS-deployment version. A standalone-test
   counterpart lives in index.html (keep in sync).

   Audio files referenced by path under audio/ do not yet exist;
   the study runs silently until they are recorded (see
   audio/SCRIPT.md for the text to record per file).
   ============================================================= */

const jsPsych = initJsPsych();
const timeline = [];

// Base URL for audio / video / image assets. Assets are hosted on GitHub Pages
// so that CHS (which hosts only this .js file) can fetch them by absolute URL.
// Local paths like "audio/foo.mp3" are prefixed at load time; SPEECH_REGIONS
// keys stay relative because that lookup uses endsWith().
const BASE_URL = "https://ashleyjthomas.github.io/lick/";

// === STUDY CONSTANTS ===========================================

const CONDITIONS = ["Saliva", "Touch", "Prosocial"];
const CONSENTS   = ["Present", "Absent"];       // Present = consensual
const RELATIONS  = ["Mom", "Teacher"];

// Fixed protagonist name per cell. Names baked into the narration
// audio, so they don't get randomized per child.
const CELL_NAMES = {
    "Prosocial_Present": "Jane",
    "Prosocial_Absent":  "Jasmine",
    "Saliva_Present":    "Jocelyn",
    "Saliva_Absent":     "Jenny",
    "Touch_Present":     "Jada",
    "Touch_Absent":      "Julia"
};

// === COUNTERBALANCING (sampled per child) ======================

// Between-subjects: each child randomly assigned to Mom or Teacher.
// Override via URL: ?rel=Mom or ?rel=Teacher for testing.
const CB_RELATION = (function() {
    const u = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const force = u.get('rel');
    if (force) {
        const match = RELATIONS.find(r => r.toLowerCase() === force.toLowerCase());
        if (match) return match;
    }
    return jsPsych.randomization.sampleWithoutReplacement(RELATIONS, 1)[0];
})();
console.log("[LICK-4] CB_RELATION =", CB_RELATION);

// Build the 6 within-subjects design cells (condition × consent).
const CELLS = [];
for (const condition of CONDITIONS) {
    for (const consent of CONSENTS) {
        CELLS.push({ condition, consent });
    }
}
// CELLS.length === 6

// Random permutation of trial order
const trial_order = jsPsych.randomization.shuffle([...Array(6).keys()]);

const TRIALS = trial_order.map((cell_idx, run_idx) => {
    const cell = CELLS[cell_idx];
    const key = `${cell.condition}_${cell.consent}`;
    return {
        run_index:  run_idx,            // 0..5 in the order this child sees them
        cell_index: cell_idx,           // 0..5 fixed cell ID
        protagonist: CELL_NAMES[key],   // FIXED per cell, not randomized
        condition:  cell.condition,
        consent:    cell.consent,
        relation:   CB_RELATION         // fixed per participant
    };
});

jsPsych.data.addProperties({
    study: "lick_4_chs_replication",
    cb_relation: CB_RELATION,
    cb_trial_order: trial_order.join(","),
    cb_first_condition: TRIALS[0].condition,
    cb_first_consent:   TRIALS[0].consent
});

// === AUDIO PATHS ===============================================
// Per-cell narration audio: one file per (condition, consent,
// relation) combination, since the wording differs across cells.
// File naming: audio/trial_<condition>_<consent>_<relation>.mp3
//   e.g. audio/trial_saliva_absent_mom.mp3
// Plus per-question prompts and intro/outro. See audio/SCRIPT.md.

function trial_audio_path(t) {
    const c  = t.condition.toLowerCase();
    const cs = t.consent.toLowerCase();
    const r  = t.relation.toLowerCase();
    return `${BASE_URL}audio/trial_${c}_${cs}_${r}.mp3`;
}

const AUDIO = {
    // Only truly generic audio lives here; question audios are
    // per-name and per-relation, resolved by helper functions below.
    q_certainty_ok:    BASE_URL + "audio/q_certainty_ok.mp3",     // played after okay_judgment YES
    q_certainty_notok: BASE_URL + "audio/q_certainty_notok.mp3",  // played after okay_judgment NO
    // Variants worded as a third-person question, used after the
    // protagonist_inference Yes/No ("Would she think it was really ok…").
    q_protag_certainty_ok:    BASE_URL + "audio/q_protag_certainty_ok.mp3",
    q_protag_certainty_notok: BASE_URL + "audio/q_protag_certainty_notok.mp3",
    // Fox's "thanks, we got a piece of pie!" celebration after each trial.
    pie_slice_first:    BASE_URL + "audio/fox_pie_slice_first.mp3",    // after trial 1
    pie_slice_more:     BASE_URL + "audio/fox_pie_slice_more.mp3",     // after trials 2–6
    pie_slice_more_yum: BASE_URL + "audio/fox_pie_slice_more_yum.mp3", // same + "yum!"
    button_training:    BASE_URL + "audio/fox_button_training.mp3",    // explains the two buttons
    thanks:            BASE_URL + "audio/thanks.mp3"
};

// Per-trial question audio paths. Names are lowercased; relations
// lowercased. e.g. q_memory_jane_mom.mp3, q_attention_julia_teacher.mp3.
function _q_audio(kind, t) {
    const n = t.protagonist.toLowerCase();
    const r = t.relation.toLowerCase();
    return `${BASE_URL}audio/q_${kind}_${n}_${r}.mp3`;
}
function memory_audio(t)            { return _q_audio("memory", t); }
function okay_audio(t)              { return _q_audio("okay", t); }
function protagonist_okay_audio(t)  { return _q_audio("protagonist_okay", t); }
function attention_audio(t)         { return _q_audio("attention", t); }

// === VIDEO PATHS ===============================================
// One MP4 video per (condition x consent) cell. Plays once, audio
// (kazoo / drum / wind) baked in at the right moments. Same video
// regardless of relationship — narration adds the mom/teacher label.

const CONDITION_SHORT = { Saliva: "sal", Touch: "tch", Prosocial: "pro" };
const CONSENT_SHORT   = { Present: "pres", Absent: "abs" };

function trial_video_path(t) {
    const c = CONDITION_SHORT[t.condition];
    const s = CONSENT_SHORT[t.consent];
    const r = t.relation.toLowerCase();
    return `${BASE_URL}videos/${c}_${s}_${r}.m4v`;
}

// Per-trial narration audio: 6 cells × 2 relations = 12 files.
// Audio plays alongside the trial video.
function trial_narration_audio_path(t) {
    const c = CONDITION_SHORT[t.condition];
    const s = CONSENT_SHORT[t.consent];
    const r = t.relation.toLowerCase();
    return `${BASE_URL}audio/narration_${c}_${s}_${r}.mp3`;
}

// === HELPER FUNCTIONS ==========================================

// === NARRATOR (FOX) =============================================
// Persistent cute-fox avatar fixed in the bottom-right corner.
// - Always visible across every trial / slide.
// - Mouth opens & closes ("talks") and head bobs whenever any <audio>
//   element on the page is playing.
// - Idle (still, mouth closed) when no audio is playing.
// Inline SVG so we can drive the mouth element directly via CSS.
(function setupNarrator() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('lick4-narrator-container')) return;

    // Fox narrator artwork, sliced out of the rigged Character Animator
    // puppet (POW Studios) into flat PNGs — see charanim/ for the source
    // PSD and the export script. Three face plates (eyes open / mid-blink /
    // shut) plus one PNG per mouth shape, which sits on top of the plate.
    const ART = BASE_URL + "images/narrator/";
    // Mouth position inside the 470x420 face plate, as percentages so the
    // whole thing scales with the container.
    const MOUTH_BOX = { left: 37.87, top: 76.67, width: 18.51, height: 11.90 };
    const VISEMES = ['Neutral','Ah','D','Ee','F','L','M','Oh','R','S','Uh',
                     'WOo','Smile','Surprised'];
    const PLATES  = { open: 'base.png', half: 'base_blink1.png', shut: 'base_blink2.png' };

    // Preload every plate and mouth shape so swaps never flash.
    Object.values(PLATES).forEach(f => { const i = new Image(); i.src = ART + f; });
    VISEMES.forEach(v => { const i = new Image(); i.src = ART + `mouth_${v}.png`; });

    const FOX_HTML = `
        <img class="fox-plate" src="${ART}${PLATES.open}" alt="">
        <img class="fox-mouth-img" src="${ART}mouth_Neutral.png" alt="">`;

    const css = `
        /* Fox: persistent layer. Default position is right side, up near
           the video (not bottom corner). The intro-center class overrides
           this to a big centered pose for the welcome / fox-intro screens. */
        #lick4-narrator-container {
            position: fixed;
            right: 28px;
            top: 110px;
            bottom: auto;
            left: auto;
            width: 200px;
            height: 179px;   /* 470x420 art aspect */
            z-index: 9;
            pointer-events: none;
            filter: drop-shadow(0 8px 18px rgba(0,0,0,0.20));
            transition: width 0.9s ease-in-out, height 0.9s ease-in-out,
                        right 0.9s ease-in-out, bottom 0.9s ease-in-out,
                        top   0.9s ease-in-out, left   0.9s ease-in-out,
                        margin-left 0.9s ease-in-out, margin-top 0.9s ease-in-out;
        }
        /* Hide the fox entirely — used during CHS video-config + consent frames
           before the study actually begins. Removed on the directions/audio-check
           screen so the fox is visible from the sound-check onward. */
        #lick4-narrator-container.hidden { display: none !important; }
        #lick4-narrator-container.intro-center {
            right:  auto;
            bottom: auto;
            left: 50%;
            top:  50%;
            width:  420px;
            height: 376px;
            margin-left: -210px;
            margin-top:  -188px;
        }
        .fox-inner { position: relative; width: 100%; height: 100%; }
        .fox-inner .fox-plate {
            display: block; width: 100%; height: 100%;
        }
        /* Mouth shape overlays the plate. Each mouth PNG already contains the
           surrounding muzzle, so it covers the plate's blank mouth area. */
        .fox-inner .fox-mouth-img {
            position: absolute;
            left:   ${MOUTH_BOX.left}%;
            top:    ${MOUTH_BOX.top}%;
            width:  ${MOUTH_BOX.width}%;
            height: ${MOUTH_BOX.height}%;
        }
        #lick4-narrator-container.speaking .fox-inner {
            animation: fox-bob 1.4s ease-in-out infinite;
        }
        @keyframes fox-bob {
            0%, 100% { transform: translateY(0)   rotate(-0.6deg); }
            50%      { transform: translateY(-3px) rotate( 0.6deg); }
        }

        /* Pie progress: an empty tin that fills with one crusted slice per
           completed trial. Sits in the bottom-LEFT corner — the fox now
           occupies the right side, so they no longer share an edge. After
           the last trial the .feasting class flies the pie to the fox,
           where it gets "eaten". */
        #lick4-pie {
            position: fixed;
            left: 28px;
            bottom: 28px;
            top: auto;
            right: auto;
            margin: 0;
            width: 130px;
            height: 130px;
            z-index: 9;
            pointer-events: none;
            opacity: 0;            /* hidden until pie_intro reveals it */
            /* Smooth transition for ALL position/size properties so the
               pie glides between its corner home and the fox-side spot.
               The trial JS disables this transition while snapping the
               pie INTO the spotlight position so the appearance doesn't
               look like the pie is sliding out of the fox's mouth. */
            transition: right 1.2s ease-in-out, bottom 1.2s ease-in-out,
                        top   1.2s ease-in-out, left   1.2s ease-in-out,
                        margin-left 1.2s ease-in-out, margin-top 1.2s ease-in-out,
                        width 1.2s ease-in-out, height 1.2s ease-in-out,
                        transform 1.2s ease-in-out, opacity 0.4s ease-in-out;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.18));
        }
        #lick4-pie.visible { opacity: 1; }
        /* Tin, plate and slice colours. Empty slots stay visible as dashed
           wedges so "how many left to earn" is readable at corner size. */
        #lick4-pie .pie-plate     { fill: #f5efe3; }
        #lick4-pie .pie-tin-outer { fill: #8d5a28; }
        #lick4-pie .pie-tin-rim   { fill: #b9793d; }
        #lick4-pie .pie-tin-inner { fill: #e6d6bb; }
        #lick4-pie .pie-tin-lip   { fill: none; stroke: #8d5a28; stroke-width: 2; opacity: .35; }
        #lick4-pie .pie-slot {
            fill: none; stroke: #cbbb9c; stroke-width: 1.8; stroke-dasharray: 4 4;
            transition: opacity 0.4s ease-in-out;
        }
        #lick4-pie .pie-slice {
            opacity: 0;
            transition: opacity 0.55s ease-in-out;
        }
        #lick4-pie .pie-fill    { fill: #eda945; }
        #lick4-pie .pie-crust   { fill: none; stroke: #a9601f; stroke-width: 8.5; stroke-linecap: round; }
        #lick4-pie .pie-edge    { fill: none; stroke: #cf8526; stroke-width: 1.3; }
        #lick4-pie .pie-lattice { stroke: #a9601f; stroke-width: 3.6; stroke-linecap: round; opacity: .7; }
        #lick4-pie .pie-steam   { opacity: 0; transition: opacity 0.9s ease-in-out 0.35s; }
        #lick4-pie .pie-steam path {
            fill: none; stroke: #b9ae9c; stroke-width: 3; stroke-linecap: round;
        }
        /* Per-count reveal rules are generated in JS (see PIE_STATE_CSS) —
           6 counts x 6 slices is too many to hand-write without drift. */
        #lick4-pie.feasting {
            opacity: 0;
            transition: transform 1.6s ease-in-out, opacity 1.6s ease-in-out 0.6s;
        }
        /* Pie spotlight — during pie_intro the pie hovers right next
           to the centered fox's face, then transitions back to the
           bottom-right corner when the class is removed. */
        #lick4-pie.spotlight {
            right:  auto;
            bottom: auto;
            left: 50%;
            top:  50%;
            margin-left: 200px;   /* just past the right edge of the centered fox */
            margin-top:  -110px;  /* roughly at face / eye level */
            width:  170px;
            height: 170px;
            filter: drop-shadow(0 8px 20px rgba(212,132,63,0.55));
            animation: pie-spotlight-wiggle 1.4s ease-in-out infinite;
        }
        @keyframes pie-spotlight-wiggle {
            0%, 100% { transform: rotate(-4deg); }
            50%      { transform: rotate( 4deg); }
        }
        /* Brief celebration burst when a new slice fills in. */
        #lick4-pie.celebrating {
            animation: pie-celebrate 0.9s ease-in-out 2;
        }
        @keyframes pie-celebrate {
            0%, 100% { transform: scale(1); }
            25%      { transform: scale(1.35) rotate(-8deg); }
            50%      { transform: scale(1.25) rotate( 6deg); }
            75%      { transform: scale(1.35) rotate(-4deg); }
        }
        @media (max-width: 900px) {
            #lick4-narrator-container { width: 140px; height: 125px; right: 12px; top: 80px; }
            #lick4-pie { width: 90px; height: 90px; left: 12px; bottom: 12px; }
        }
    `;

    // Build the pie SVG: a plate, an empty tin, six dashed empty slots, and
    // six filled slices layered on top. Slices share a centre at (60,60) with
    // r=43; each is 60°. data-i = 0..5 so the generated CSS can reveal them
    // one at a time. Steam only appears once all six are in.
    function buildPieSVG() {
        const cx = 60, cy = 60, r = 43;
        const pt = (ang, rad) =>
            `${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`;
        const ang = i => (i / 6) * 2 * Math.PI - Math.PI / 2;
        const wedge = i => `M ${cx},${cy} L ${pt(ang(i), r)} A ${r},${r} 0 0 1 ${pt(ang(i + 1), r)} Z`;
        const crust = i => `M ${pt(ang(i), r)} A ${r},${r} 0 0 1 ${pt(ang(i + 1), r)}`;

        let slots = '', slices = '';
        for (let i = 0; i < 6; i++) {
            slots += `<path class="pie-slot" data-i="${i}" d="${wedge(i)}"/>`;
            const mid = ang(i + 0.5);
            slices +=
                `<g class="pie-slice" data-i="${i}">` +
                    `<path class="pie-fill"  d="${wedge(i)}"/>` +
                    `<path class="pie-crust" d="${crust(i)}"/>` +
                    `<path class="pie-edge"  d="${wedge(i)}"/>` +
                    `<line class="pie-lattice" x1="${pt(mid, 13).split(',')[0]}" y1="${pt(mid, 13).split(',')[1]}"` +
                          ` x2="${pt(mid, 36).split(',')[0]}" y2="${pt(mid, 36).split(',')[1]}"/>` +
                `</g>`;
        }
        const steam =
            `<g class="pie-steam">` +
                `<path d="M 46,12 q 7,-9 0,-15"/>` +
                `<path d="M 60,7 q 7,-10 0,-17"/>` +
                `<path d="M 74,12 q 7,-9 0,-15"/>` +
            `</g>`;

        return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <ellipse class="pie-plate" cx="60" cy="67" rx="57" ry="49"/>
            <circle class="pie-tin-outer" cx="60" cy="60" r="52"/>
            <circle class="pie-tin-rim"   cx="60" cy="60" r="49"/>
            <circle class="pie-tin-inner" cx="60" cy="60" r="44"/>
            <circle class="pie-tin-lip"   cx="60" cy="60" r="44"/>
            ${slots}${slices}${steam}
        </svg>`;
    }
    const PIE_SVG = buildPieSVG();

    // Reveal rules: at data-done="d", slices 0..d-1 are visible and their
    // empty slots are hidden. Generated rather than hand-written so the two
    // halves can't drift out of sync.
    const PIE_STATE_CSS = (function() {
        let out = '';
        for (let d = 1; d <= 6; d++) {
            const on = [], off = [];
            for (let i = 0; i < d; i++) {
                on.push(`#lick4-pie[data-done="${d}"] .pie-slice[data-i="${i}"]`);
                off.push(`#lick4-pie[data-done="${d}"] .pie-slot[data-i="${i}"]`);
            }
            out += `${on.join(',')} { opacity: 1; }\n${off.join(',')} { opacity: 0; }\n`;
        }
        out += `#lick4-pie[data-done="6"] .pie-steam { opacity: 1; }\n`;
        return out;
    })();

    const ensureMounted = () => {
        // Append to <html>, not <body>. jsPsych wipes body on init/run,
        // so we have to live as a sibling of body. position:fixed keeps
        // the avatar visually anchored to the viewport regardless.
        let c = document.getElementById('lick4-narrator-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'lick4-narrator-container';
            // Start hidden so the fox doesn't show on CHS video-config /
            // consent frames. The directions_and_audio_check trial flips the
            // global flag and removes this class when the study proper begins.
            // Re-mounts (if anything ever removes the container) respect the
            // current visibility state via the flag.
            if (!window._lick4FoxVisible) c.className = 'hidden';
            c.innerHTML = `<div class="fox-inner">${FOX_HTML}</div>`;
        }
        if (c.parentNode !== document.documentElement) {
            document.documentElement.appendChild(c);
        }
        let p = document.getElementById('lick4-pie');
        if (!p) {
            p = document.createElement('div');
            p.id = 'lick4-pie';
            p.setAttribute('data-done', String(window._lick4PieDone || 0));
            p.innerHTML = PIE_SVG;
        }
        if (p.parentNode !== document.documentElement) {
            document.documentElement.appendChild(p);
        }
        return c;
    };

    // Global helpers usable from trial on_finish callbacks.
    window.lick4_pie_advance = function() {
        window._lick4PieDone = Math.min(6, (window._lick4PieDone || 0) + 1);
        const p = document.getElementById('lick4-pie');
        if (p) p.setAttribute('data-done', String(window._lick4PieDone));
    };
    window.lick4_pie_feast = function() {
        const p = document.getElementById('lick4-pie');
        if (!p) return;
        // Fly the finished pie to wherever the fox actually is and let it be
        // eaten. Measured at call time rather than hard-coded: the pie now
        // lives bottom-left and the fox top-right, and either can move with
        // the viewport or the .intro-center pose.
        const fox = document.getElementById('lick4-narrator-container');
        if (fox) {
            const a = p.getBoundingClientRect(), b = fox.getBoundingClientRect();
            const dx = (b.left + b.width / 2)  - (a.left + a.width / 2);
            const dy = (b.top  + b.height * 0.62) - (a.top + a.height / 2);
            p.style.transform = `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) scale(0.55)`;
        }
        p.classList.add('feasting');
    };

    const inject = () => {
        if (!document.getElementById('lick4-narrator-css')) {
            const s = document.createElement('style');
            s.id = 'lick4-narrator-css';
            s.textContent = css + PIE_STATE_CSS;
            (document.head || document.documentElement).appendChild(s);
        }

        ensureMounted();

        // Pre-computed mouth-shape timelines, one per narration asset
        // (every audio clip and every trial video). Built offline from each
        // file's loudness envelope — see charanim/ for the generator. Each
        // track is a string with one hex character per frame; the character
        // indexes into VISEMES. Keys are repo-relative paths, matched against
        // the media element's URL with endsWith().
        let LIPSYNC = null;
        fetch(ART + "lipsync.json")
            .then(r => r.json())
            .then(j => { LIPSYNC = j; })
            .catch(() => { LIPSYNC = null; });   // falls back to a generic flap

        function trackFor(m) {
            if (!LIPSYNC) return null;
            const url = m.currentSrc || m.src || "";
            for (const key in LIPSYNC.tracks) {
                if (url.endsWith(key)) return LIPSYNC.tracks[key];
            }
            return null;
        }

        // Shapes cycled when we have no timeline for a file (shouldn't happen
        // for study assets, but keeps the mouth alive rather than frozen).
        const FLAP = ['Ah','Ee','Neutral','Oh','Uh','Neutral'];

        function currentMouth() {
            let playing = null;
            document.querySelectorAll('audio, video').forEach(m => {
                if (!playing && !m.paused && !m.ended && m.readyState >= 2) playing = m;
            });
            if (!playing) return { shape: 'Neutral', speaking: false };

            const tl = trackFor(playing);
            if (tl) {
                const i = Math.floor(playing.currentTime * 1000 / LIPSYNC.frame_ms);
                if (i >= 0 && i < tl.length) {
                    return { shape: LIPSYNC.visemes[parseInt(tl[i], 16)], speaking: true };
                }
                return { shape: 'Neutral', speaking: true };
            }
            return { shape: FLAP[Math.floor(playing.currentTime * 8) % FLAP.length],
                     speaking: true };
        }

        // Blink every 2.5–6s: half-shut, shut, half-shut, open.
        let plate = 'open', nextBlink = performance.now() + 2500, blinkAt = [];
        function blinkTick(now) {
            if (blinkAt.length && now >= blinkAt[0].t) {
                plate = blinkAt.shift().p;
            } else if (!blinkAt.length && now > nextBlink) {
                plate = 'half';
                blinkAt = [{ t: now +  50, p: 'shut' },
                           { t: now + 130, p: 'half' },
                           { t: now + 180, p: 'open' }];
                nextBlink = now + 2500 + Math.random() * 3500;
            }
        }

        function tick(now) {
            blinkTick(now);
            const { shape, speaking } = currentMouth();
            // Look the container up fresh each frame — jsPsych can wipe and
            // remount it, which would leave a captured reference stale. State
            // lives on the elements (data-*) for the same reason.
            const box = document.getElementById('lick4-narrator-container');
            if (box) {
                const mouthEl = box.querySelector('.fox-mouth-img');
                const plateEl = box.querySelector('.fox-plate');
                if (mouthEl && mouthEl.dataset.shape !== shape) {
                    mouthEl.src = ART + `mouth_${shape}.png`;
                    mouthEl.dataset.shape = shape;
                }
                if (plateEl && plateEl.dataset.plate !== plate) {
                    plateEl.src = ART + PLATES[plate];
                    plateEl.dataset.plate = plate;
                }
                box.classList.toggle('speaking', speaking);
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        // Still re-mount the avatar if anything ever removes it.
        new MutationObserver(() => ensureMounted())
            .observe(document.documentElement, { childList: true, subtree: true });
    };
    if (document.documentElement) inject();
    else document.addEventListener('DOMContentLoaded', inject);
})();

// audio_html just emits the hidden audio element; the fox avatar is
// a persistent layer outside trial content and animates on play.
function audio_html(src) {
    return `<audio autoplay class="narrator-audio">
                <source src="${src}" type="audio/mpeg">
            </audio>`;
}

function caption_banner(text) {
    return `<div style="
        font-size: 26px; color: #555; margin: 4px auto 18px auto;
        max-width: 900px; text-align: center;
        background: #f3efe6; border-radius: 8px; padding: 8px 18px;
        display: inline-block;
    ">${text}</div>`;
}

function story_text(text) {
    return `<div style="
        max-width: 900px; margin: 22px auto;
        font-size: 30px; line-height: 1.35;
    ">${text}</div>`;
}

function next_button(label = "Next") {
    return [`<p style="font-size: 36px; margin: 0;">${label}</p>`];
}

// Render the trial video element. Autoplays once (no loop, no
// controls). Audio is part of the MP4. Browsers allow autoplay
// here because the user has already interacted with the page.
function render_trial_video(t, alt) {
    const path = trial_video_path(t);
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                              .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    return `<video src="${esc(path)}" data-path="${esc(path)}"
                   autoplay playsinline
                   data-trial-video
                   style="max-width: 600px; height: auto; margin: 12px auto; display: block; border-radius: 6px;">
                Your browser does not support inline video. Expected at: ${esc(path)}
            </video>`;
}

// Two-option Yes/No trial with left/right randomization.
// Buttons show a thumbs-up (Yes) and thumbs-down (No) image so the answer
// is visually obvious to non-readers.
function thumb_choice_box(kind /* "up" | "down" */) {
    const isUp  = kind === "up";
    const bg    = isUp ? "linear-gradient(135deg,#1e8449,#27AE60)"
                       : "linear-gradient(135deg,#922b21,#C0392B)";
    const src   = isUp ? BASE_URL + "images/thumbsup.png" : BASE_URL + "images/thumbsdown.png";
    const label = isUp ? "Okay" : "Not Okay";
    return `<div style="background:${bg};color:white;padding:18px 28px;min-width:170px;
                        border-radius:22px;font-size:22px;font-weight:700;line-height:1.2;
                        text-align:center;">
                <img src="${src}" width="72" height="72" style="display:block;margin:0 auto 6px;">
                ${label}
            </div>`;
}
function yes_no_trial({ stimulus_html, audio_key, audio_src, name, extra_data = {} }) {
    // Thumbs-up (Y) on the LEFT, thumbs-down (N) on the RIGHT — fixed,
    // no L/R randomization. The icons are visually distinct (green vs
    // red, up vs down), so position-bias counterbalancing isn't needed.
    // Keeping the position fixed also matches the certainty step's
    // strong/mild button layout, so kids learn one consistent pattern.
    const options = [
        { value: "Y", label_html: thumb_choice_box("up") },
        { value: "N", label_html: thumb_choice_box("down") }
    ];
    return two_option_trial({
        stimulus_html, audio_key, audio_src, options, name, extra_data,
        no_swap: true
    });
}

// 4-point Likert implemented as 2 steps, mirroring the structure
// from the RAD study: first YES/NO via yes_no_trial, then a
// "Was it really ok / just a little ok?" (or really-not-ok / a-little-not-ok)
// follow-up with two buttons coloured to match the prior answer
// (green/thumbs-up if YES, red/thumbs-down if NO).
// Combined answer: DEFINITELY_YES, MAYBE_YES, MAYBE_NO, DEFINITELY_NO,
// which maps to the 4-point label: really_okay / okay / not_okay /
// really_not_okay.
// Parameters:
//   prior_name : jsPsych data 'name' tag of the preceding Yes/No trial
//                whose answer this certainty step refines. Defaults to
//                "okay_judgment" for the primary DV; pass
//                "protagonist_inference" to get the same refinement for
//                the would-protagonist-think-it-was-okay branch.
//   trial_name : the 'name' tag stored on this certainty trial's data,
//                so the two certainty trials show up as distinct rows.
function okay_certainty_trial(extra_data, prior_name = "okay_judgment",
                              trial_name = "okay_certainty") {
    const certMap = {
        "DEFINITELY_YES": ["really_okay", 4],
        "MAYBE_YES":      ["okay",         3],
        "MAYBE_NO":       ["not_okay",     2],
        "DEFINITELY_NO":  ["really_not_okay", 1]
    };
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            // Read the immediately-prior Yes/No answer from the named trial.
            const prev = jsPsych.data.get().filter({name: prior_name}).last(1).values()[0];
            window._last_okay_isYes = prev && prev.chosen_value === "Y";
            const isYes = window._last_okay_isYes;
            const tag = isYes
                ? '<span style="background:linear-gradient(135deg,#56ab2f,#a8e063);color:white;padding:4px 16px;border-radius:18px;font-size:26px;display:inline-block;">okay</span>'
                : '<span style="background:linear-gradient(135deg,#eb3349,#f45c43);color:white;padding:4px 16px;border-radius:18px;font-size:26px;display:inline-block;">not okay</span>';
            // Pick the audio that matches the prior question: protagonist
            // inference gets the third-person variant ("Would she think it
            // was really ok…"). The primary okay_judgment gets first-person.
            const isProtag = (prior_name === "protagonist_inference");
            const certAudio = isProtag
                ? (isYes ? AUDIO.q_protag_certainty_ok : AUDIO.q_protag_certainty_notok)
                : (isYes ? AUDIO.q_certainty_ok        : AUDIO.q_certainty_notok);
            const youSaid = isProtag ? "She would say" : "You said";
            return audio_html(certAudio)
                + story_text(`${youSaid} ${tag}.`);
        },
        choices: function() {
            const isYes = window._last_okay_isYes;
            const thumbSrc = isYes ? BASE_URL + "images/thumbsup.png" : BASE_URL + "images/thumbsdown.png";
            const strongBg = isYes
                ? "linear-gradient(135deg,#1e8449,#27AE60)"
                : "linear-gradient(135deg,#922b21,#C0392B)";
            const mildBg = isYes
                ? "linear-gradient(135deg,#a8e063,#d0f5a0)"
                : "linear-gradient(135deg,#f45c43,#ffbdad)";
            const mildColor = isYes ? "#1a5e2a" : "#7B241C";
            const strongLabel = isYes ? "Really<br>OK!"   : "Really<br>NOT OK!";
            const mildLabel   = isYes ? "Just a little<br>ok" : "Just a little<br>not ok";
            return [
                `<div style="background:${strongBg};color:white;padding:20px 22px;min-width:180px;border-radius:22px;font-size:22px;font-weight:600;line-height:1.25;">
                    <img src="${thumbSrc}" width="54" height="54" style="display:block;margin:0 auto 6px;">
                    ${strongLabel}
                </div>`,
                `<div style="background:${mildBg};color:${mildColor};padding:18px 18px;min-width:160px;border-radius:22px;font-size:18px;font-weight:600;line-height:1.25;">
                    <img src="${thumbSrc}" width="36" height="36" style="display:block;margin:0 auto 4px;">
                    ${mildLabel}
                </div>`
            ];
        },
        margin_horizontal: "16px",
        data: Object.assign({ name: trial_name, prior_name: prior_name }, extra_data),
        on_finish: function(data) {
            const isYes = window._last_okay_isYes;
            const cert = data.response === 0 ? "DEFINITELY" : "MAYBE";
            const combined = cert + (isYes ? "_YES" : "_NO");
            data.certainty       = cert;
            data.combined        = combined;
            data.likert_label    = certMap[combined][0];
            data.likert_numeric  = certMap[combined][1];
            data.initial_yes_no  = isYes ? "Y" : "N";
        }
    };
}

// Choice box with a character face image + a small text caption beneath.
// Used for the memory-check ("whose kazoo / drumstick?") trial.
function face_choice_box(img_src, caption) {
    return `<div style="
        padding: 14px 18px;
        min-width: 220px;
        border: 4px solid #2a6f97;
        border-radius: 18px;
        background: #eaf4fb;
        text-align: center;
        line-height: 1.1;
    ">
        <img src="${img_src}"
             alt=""
             style="display:block;margin:0 auto;width:200px;height:auto;border-radius:10px;background:#fff;">
        <div style="font-size:22px;font-weight:600;margin-top:10px;color:#1a3d5c;">${caption}</div>
    </div>`;
}

function text_choice_box(text) {
    return `<div style="
        font-size: 40px;
        padding: 26px 40px;
        min-width: 220px;
        min-height: 60px;
        border: 4px solid #2a6f97;
        border-radius: 16px;
        background: #eaf4fb;
        line-height: 1.2;
    ">${text}</div>`;
}

// Build a two-option button trial.
//   no_swap : if true, never randomize L/R (options stay in the order
//             given). Used for yes/no thumbs where the icons themselves
//             carry meaning. Default false (memory_check keeps swap so
//             face position can't bias the kid).
//
// The L/R swap is stored in a CLOSURE variable (not a global) so it
// can never be clobbered by a sibling trial's on_start firing in
// between this trial's render and on_finish. (Previously used
// window._opt_swap, which was shared across memory_check /
// okay_judgment / protagonist_inference and produced occasional
// chosen_value flips when timing lined up unluckily.)
function two_option_trial({ stimulus_html, audio_key, audio_src, options,
                            name, extra_data = {}, no_swap = false }) {
    let swap;
    return {
        type: jsPsychHtmlButtonResponse,
        on_start: function() {
            swap = no_swap ? false : (Math.random() < 0.5);
        },
        stimulus: function() {
            const src = audio_src || (audio_key ? AUDIO[audio_key] : null);
            const audio = src ? audio_html(src) : "";
            return audio + stimulus_html;
        },
        choices: function() {
            const ordered = swap ? [options[1], options[0]] : [options[0], options[1]];
            return ordered.map(o => o.label_html);
        },
        margin_horizontal: "30px",
        data: Object.assign({ name: name }, extra_data),
        on_finish: function(data) {
            const ordered = swap ? [options[1], options[0]] : [options[0], options[1]];
            const chosen = ordered[data.response];
            data.options_swapped  = swap;
            data.chosen_value     = chosen.value;
            data.chosen_position  = data.response === 0 ? "left" : "right";
            data.left_value       = ordered[0].value;
            data.right_value      = ordered[1].value;
        }
    };
}

// === TRIAL FACTORY =============================================
// Each design cell becomes a small sub-timeline:
//   GIF playback (with narration) -> memory check
//   -> okay/not -> (absent only) would-they-think-it-was-okay

function side_character_label(t) {
    // The "side character" is the protagonist's mom or teacher.
    // Wording mirrors the LICK-3 script (e.g. "Jasmine's mom").
    return `${t.protagonist}'s ${t.relation.toLowerCase()}`;
}

function instrument_label(t) {
    // Saliva and Prosocial use the kazoo; Touch uses the drumstick.
    return t.condition === "Touch" ? "drumstick" : "kazoo";
}

function action_verb(t) {
    // Verb for the side character's action on the instrument,
    // used in memory-check and protagonist-inference questions.
    // Matches the narration: Saliva→"play", Touch→"use", Prosocial→"touch".
    if (t.condition === "Saliva")    return "play";
    if (t.condition === "Touch")     return "use";
    return "touch"; // Prosocial
}
function action_verb_past(t) {
    if (t.condition === "Saliva")    return "played";
    if (t.condition === "Touch")     return "used";
    return "touched";
}

// Sound effects are now baked into each trial video (kazoo / drum /
// wind tracks). No JS scheduling needed.

function trial_narration(t) {
    // On-screen text mirrors the in-video narration. All trials open
    // with the same character/relationship establishment, then a
    // condition+consent specific action description.
    const inst    = instrument_label(t);                          // kazoo / drumstick
    const playing = t.condition === "Touch" ? "drum" : "kazoo";   // what they're "playing"
    const verb    = action_verb(t);                               // play / use / touch
    const rel     = t.relation.toLowerCase();
    const name    = t.protagonist;
    const her_rel = `<b>${name}'s ${rel}</b>`;

    const opener = `Here's <b>${name}</b>. The person standing next to ${name} is ${her_rel}. ${name} is playing her ${playing}.`;

    if (t.condition === "Prosocial") {
        if (t.consent === "Absent") {
            return `${opener} ${name} leaves. While ${name} is gone, the wind knocks over ${name}'s ${inst}, and ${name}'s ${rel} puts it back. ${name} comes back and plays her ${inst} again.`;
        }
        return `${opener} The wind knocks over ${name}'s ${inst}. ${name}'s ${rel} puts it back. ${name} plays her ${inst} again.`;
    }
    if (t.condition === "Saliva") {
        if (t.consent === "Absent") {
            return `${opener} ${name} leaves. While ${name} is gone, ${name}'s ${rel} plays ${name}'s ${inst}. ${name} comes back and plays her ${inst} again.`;
        }
        return `${opener} ${name} gives her ${inst} to her ${rel}. ${name}'s ${rel} plays ${name}'s ${inst}. She gives it back, and ${name} plays her ${inst} again.`;
    }
    // Touch
    if (t.consent === "Absent") {
        return `${opener} ${name} leaves. While ${name} is gone, ${name}'s ${rel} uses ${name}'s ${inst}. ${name} comes back and uses her ${inst} again.`;
    }
    return `${opener} ${name} gives her ${inst} to her ${rel}. ${name}'s ${rel} uses ${name}'s ${inst}. She gives it back, and ${name} uses her ${inst} again.`;
}

function build_test_trial(t) {
    const sub = [];

    const them = side_character_label(t);
    const inst = instrument_label(t);

    // --- ANIMATION PLAYBACK
    // Video plays once. Narration + sound effects are baked into
    // each m4v during Keynote export, so no separate audio track.
    // Both buttons stay disabled until the video's 'ended' event.
    sub.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            // No caption banner or watching-indicator text — pie progress
            // widget in the corner shows trial number. Video has baked-in narration.
            return render_trial_video(t,
                    `${t.protagonist} and her ${t.relation.toLowerCase()} with a ${inst}`);
        },
        choices: [
            // Watch again — orange with replay symbol
            `<div style="background:linear-gradient(135deg,#ff9436,#ed6b00);color:white;padding:14px 30px;border-radius:16px;font-weight:700;font-size:26px;display:inline-flex;align-items:center;gap:10px;line-height:1;box-shadow:0 4px 10px rgba(237,107,0,0.30);"><span style="font-size:34px;line-height:0.8;">↻</span> Watch again</div>`,
            // Next — green with play symbol
            `<div style="background:linear-gradient(135deg,#34d058,#1e8449);color:white;padding:14px 30px;border-radius:16px;font-weight:700;font-size:26px;display:inline-flex;align-items:center;gap:10px;line-height:1;box-shadow:0 4px 10px rgba(39,174,96,0.30);">Next <span style="font-size:28px;line-height:0.8;">▶</span></div>`
        ],
        button_html: '<button class="jspsych-btn" style="background:transparent;border:none;padding:0;margin:0 10px;">%choice%</button>',
        data: {
            name: "trial_animation",
            run_index: t.run_index,
            cell_index: t.cell_index,
            protagonist: t.protagonist,
            condition: t.condition,
            consent: t.consent,
            relation: t.relation
        },
        on_load: function() {
            const video = document.querySelector('video[data-trial-video]');

            // 1) Intercept "Watch again" (index 0)
            const oldReplay = document.querySelectorAll('button.jspsych-btn')[0];
            const newReplay = oldReplay.cloneNode(true);
            oldReplay.parentNode.replaceChild(newReplay, oldReplay);

            const getBtns = () => document.querySelectorAll('button.jspsych-btn');
            const hideButtons = () => getBtns().forEach(b => {
                b.disabled = true;
                b.style.visibility = "hidden";
            });
            const showButtons = () => getBtns().forEach(b => {
                b.disabled = false;
                b.style.visibility = "visible";
            });

            newReplay.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                if (newReplay.disabled) return;
                video.currentTime = 0;
                video.play().catch(() => {});
                hideButtons();
                const td = jsPsych.getCurrentTrial().data;
                td.replay_count = (td.replay_count || 0) + 1;
            });

            video.addEventListener('ended', showButtons);
            video.play().catch(() => {});
            hideButtons();
        }
    });

    // --- MANIPULATION CHECK
    // Choice buttons show the protagonist's face vs the side-character's
    // face (same character art used in the just-watched video) with a
    // small caption beneath. Faces are pre-cropped per-name to
    // images/faces/<name>.png and <name>_adult.png. The adult face is
    // identical for the mom and teacher variants of a cell.
    // Face-button captions. The protagonist's side names her ("Jasmine's
    // kazoo"); the side-character's side says "Her own kazoo" — mirrors
    // the audio question wording exactly.
    const own_label    = `Her own ${inst}`;
    const target_label = `${t.protagonist}'s ${inst}`;
    const verb         = action_verb(t);
    const _kid_src     = `${BASE_URL}images/faces/${t.protagonist.toLowerCase()}.png`;
    const _adult_src   = `${BASE_URL}images/faces/${t.protagonist.toLowerCase()}_adult.png`;
    sub.push(two_option_trial({
        audio_src: memory_audio(t),
        // Audio asks the question; no on-screen text.
        stimulus_html: "",
        options: [
            { value: "protagonist", label_html: face_choice_box(_kid_src,   target_label) },
            { value: "own",         label_html: face_choice_box(_adult_src, own_label) }
        ],
        name: "memory_check",
        extra_data: {
            run_index: t.run_index, cell_index: t.cell_index,
            protagonist: t.protagonist,
            condition: t.condition, consent: t.consent, relation: t.relation
        }
    }));

    // --- PRIMARY DV: was it okay? — audio carries the question.
    sub.push(yes_no_trial({
        audio_src: okay_audio(t),
        stimulus_html: "",
        name: "okay_judgment",
        extra_data: {
            run_index: t.run_index, cell_index: t.cell_index,
            protagonist: t.protagonist,
            condition: t.condition, consent: t.consent, relation: t.relation
        }
    }));

    // --- "Was it really ok / just a little ok?" (or the not-ok mirror)
    //     follow-up to the Yes/No. Produces the 4-point Likert combined
    //     value (really_okay / okay / not_okay / really_not_okay).
    sub.push(okay_certainty_trial({
        run_index: t.run_index, cell_index: t.cell_index,
        protagonist: t.protagonist,
        condition: t.condition, consent: t.consent, relation: t.relation
    }));

    // --- SECONDARY DV (Absent only): would protagonist think it was okay?
    if (t.consent === "Absent") {
        sub.push(yes_no_trial({
            audio_src: protagonist_okay_audio(t),
            stimulus_html: "",
            name: "protagonist_inference",
            extra_data: {
                run_index: t.run_index, cell_index: t.cell_index,
                protagonist: t.protagonist,
                condition: t.condition, consent: t.consent, relation: t.relation
            }
        }));
        // Certainty refinement for the protagonist-inference Yes/No.
        sub.push(okay_certainty_trial(
            {
                run_index: t.run_index, cell_index: t.cell_index,
                protagonist: t.protagonist,
                condition: t.condition, consent: t.consent, relation: t.relation
            },
            "protagonist_inference",
            "protagonist_certainty"
        ));
    }

    // Per-trial attention check removed — manipulation is checked
    // once at the start (after the attention_intro video).

    // --- PIE SLICE CELEBRATION
    // Fox thanks the kid; the pie advances by one slice with a wiggle.
    // First trial uses "we got a piece of pie!"; the rest use "another
    // piece of pie!". After the 6th slice we'll have the thanks screen
    // do the final feast (handled separately).
    sub.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const done = window._lick4PieDone || 0;
            // Trial 1 -> "we got a piece of pie!". Trials 2-6 alternate
            // between plain "another piece" and "another piece + yum!"
            // (every other slice gets the yum for variety).
            let src;
            if (done === 0)        src = AUDIO.pie_slice_first;
            else if (done % 2 === 1) src = AUDIO.pie_slice_more_yum;
            else                    src = AUDIO.pie_slice_more;
            return `<audio autoplay class="pie-slice-audio">
                        <source src="${src}" type="audio/mpeg">
                    </audio>
                    <div style="height: 360px;"></div>`;
        },
        choices: next_button("Next"),
        data: {
            name: "pie_slice_feedback",
            run_index: t.run_index, cell_index: t.cell_index
        },
        on_load: function() {
            // Advance the pie — slice fills in just as the fox starts speaking.
            if (typeof window.lick4_pie_advance === "function") {
                window.lick4_pie_advance();
            }
            const p = document.getElementById('lick4-pie');
            if (p) {
                p.classList.add('celebrating');
                setTimeout(() => p.classList.remove('celebrating'), 1900);
            }
            const audio = document.querySelector('audio.pie-slice-audio');
            const btns = () => document.querySelectorAll('button.jspsych-btn');
            btns().forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });
            const enableNext = () => btns().forEach(b => { b.disabled = false; b.style.opacity = '1'; });
            if (audio) {
                audio.addEventListener('ended', enableNext);
                setTimeout(() => { if (audio.ended) enableNext(); }, 8000);
            } else { enableNext(); }
        }
    });

    return sub;
}

// === CHS FRAMES ================================================

// Build the per-trial question-audio preload list from the actual TRIALS
// (every kid gets all 6 cells, but only the relation they're assigned).
const _trial_question_audios = TRIALS.flatMap(t => {
    const list = [memory_audio(t), okay_audio(t), attention_audio(t)];
    if (t.consent === "Absent") list.push(protagonist_okay_audio(t));
    return list;
});

// Face-choice images used on the memory-check buttons (one pair per cell).
const _trial_face_images = TRIALS.flatMap(t => {
    const n = t.protagonist.toLowerCase();
    return [`${BASE_URL}images/faces/${n}.png`, `${BASE_URL}images/faces/${n}_adult.png`];
});

const preload = {
    type: jsPsychPreload,
    audio: [
        BASE_URL + "audio/fox_intro.mp3", BASE_URL + "audio/fox_pie_intro.mp3",
        BASE_URL + "audio/intro_mom.mp3", BASE_URL + "audio/intro_teacher.mp3",
        ..._trial_question_audios,
        BASE_URL + "audio/q_certainty_ok.mp3", BASE_URL + "audio/q_certainty_notok.mp3",
        BASE_URL + "audio/q_protag_certainty_ok.mp3", BASE_URL + "audio/q_protag_certainty_notok.mp3",
        BASE_URL + "audio/fox_pie_slice_first.mp3", BASE_URL + "audio/fox_pie_slice_more.mp3",
        BASE_URL + "audio/fox_pie_slice_more_yum.mp3",
        BASE_URL + "audio/fox_button_training.mp3",
        BASE_URL + "audio/q_attention_intro.mp3",
        BASE_URL + "audio/thanks.mp3"
    ],
    video: [
        BASE_URL + "videos/girls_mom_intro.m4v", BASE_URL + "videos/girls_teacher_intro.m4v",
        ...TRIALS.map(trial_video_path)
    ],
    images: [
        BASE_URL + "images/thumbsup.png", BASE_URL + "images/thumbsdown.png",
        ..._trial_face_images
    ],
    auto_preload: false,
    continue_after_error: true,
    show_detailed_errors: false,
    message: "Loading study..."
};

const enter_fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    button_label: "Go full screen"
};

const video_config = {
    type: chsRecord.VideoConfigPlugin
};

const video_consent = {
    type: chsRecord.VideoConsentPlugin,
    PIName: "Ashley Thomas",
    institution: "Harvard University",
    PIContact: "athomas@g.harvard.edu",
    payment: "You will receive a $5 gift card for completing this study. You will be asked to provide your email for this purpose. Your email will remain strictly confidential and will only be used to issue payment.",
    procedures: "The following is key information about the study: Someone will explain this asynchronous research study to you in the form of a video or summary. Your participation is completely voluntary; you and your child can choose not to take part. You and your child can agree to take part and later change your mind. However, because this is an asynchronous online study, we schedule 30–45-minute sessions to ensure there is ample time to make sure that your webcam is set up and working properly. The study session will be conducted remotely and recorded through Lookit, an online platform for developmental research studies. During the study, your child will be observed and recorded for data collection purposes only. During the study, your child will be presented with short videos, pictures, and recorded narration showing girls and their moms or teachers playing musical instruments. We will ask your child a series of questions about whether the characters' actions were okay, and record your child's verbal answers and clicks on the screen. You may be asked to complete several questionnaires that will help us better understand your child's development and behavior. They are optional, so you may fill out as much as you would like. The information you provide helps us to better understand social and moral development. We don't believe there are any risks for your child from participating in this research. You and your child are free to choose whether to be in this study. You can ask all the questions you want before you decide. If you do choose to participate, it's okay to stop at any point during the session. There has been no harm to children involved in this study, and there are no risks associated with their participation. We cannot promise any benefits to your child due to their participation in the study. However, we hope that your child will enjoy the study, and your child's participation may improve our understanding of certain phenomena in the field of Developmental Psychology, as this study attempts to provide deeper insight into how children think about consent and relationships. Participation in research is completely voluntary. Your child's alternative to participating in this research study is to not participate. Your child can decide to participate, not participate, or discontinue participation at any time without penalty or loss of benefits to which your child is otherwise entitled. You and your child's decision will not be held against you. You and your child's refusal to participate will not result in any consequences.",
    purpose: "Why is my child being invited to take part in a research study? We invite your child to take part in a research study because this study examines how typically developing children in their age range think about consent and social relationships. In particular, we are interested in how children evaluate actions involving someone else's belongings, especially when those actions occur with or without the other person's knowledge, and whether children's evaluations depend on the relationship between the people involved (e.g., a parent and child versus a teacher and student).",
    research_rights_statement: "You are not waiving any legal claims, rights, or remedies because of your participation in this research study. If you have questions, concerns, or complaints, or think the research has hurt your child, talk to the research team at 617-384-7777. You can also contact the PI, Ashley Thomas, athomas@g.harvard.edu. This research has been reviewed and approved by the Harvard University Area Institutional Review Board (\"IRB\"). You may talk to them at (617) 496-2847 or cuhs@harvard.edu if: <ul><li>Your questions, concerns, or complaints are not being answered by the research team.</li><li>You cannot reach the research team.</li><li>You want to talk to someone besides the research team.</li><li>You have questions about your child's rights as a research subject.</li><li>You want to get information or provide input about this research.</li></ul>"
};

const start_rec   = { type: chsRecord.StartRecordPlugin };
const stop_rec    = { type: chsRecord.StopRecordPlugin };
const exit_survey = { type: chsSurvey.ExitSurveyPlugin };

const email = {
    type: jsPsychSurveyText,
    questions: [{ prompt: "Please enter your email below. This information will be kept strictly confidential and will only be used to issue payment." }],
    data: { name: "email_for_payment" }
};

// Parent-facing directions + audio test. Replaces the old "transition_to_study"
// screen. Also the point at which the fox is first revealed — she was hidden
// through the CHS video-config + consent frames so parents could focus on setup.
const directions_and_audio_check = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="max-width: 820px; margin: 30px auto 20px; font-size: 22px; line-height: 1.5; text-align: left; color: #222;">
          <h2 style="text-align: center; font-size: 34px; margin: 0 0 20px;">Thank you!</h2>
          <p style="text-align: center; font-size: 22px; color: #444; margin-bottom: 28px;">
            A few things before your child begins:
          </p>
          <ul style="margin: 0 0 32px 24px; font-size: 22px;">
            <li style="margin-bottom: 10px;">Your child will watch <b>6 short videos</b> and answer some simple questions from Ms. Fox.</li>
            <li style="margin-bottom: 10px;">The whole study takes about <b>15 minutes</b>.</li>
            <li>Please <b>let your child answer on their own</b> — you can sit nearby, but try not to guide their answers.</li>
          </ul>
          <div style="background: #f0f7fb; border: 2px solid #4a90b8; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 22px; margin: 0 0 10px;"><b>Quick sound check</b></p>
            <p style="font-size: 19px; margin: 0 0 20px; color: #555;">
              Please turn your sound ON, then click below to hear Ms. Fox.
            </p>
            <button id="lick4-sound-test" type="button"
                    style="font-size: 22px; padding: 14px 30px; cursor: pointer; background: #2a6f97; color: white; border: none; border-radius: 8px; font-weight: 600;">
              🔊 Play test sound
            </button>
            <p id="lick4-sound-status" style="margin: 20px 0 0; font-size: 18px; color: #666; min-height: 24px;">
              Click the button and listen for Ms. Fox's voice.
            </p>
          </div>
        </div>`,
    choices: ["Ready to start"],
    data: { name: "directions_and_audio_check" },
    on_load: function() {
        // Reveal the fox from this point onward.
        window._lick4FoxVisible = true;
        const fc = document.getElementById('lick4-narrator-container');
        if (fc) fc.classList.remove('hidden');

        // Lock "Ready to start" until the parent has played the test audio.
        const nextBtns = () => Array.from(document.querySelectorAll('button.jspsych-btn'));
        nextBtns().forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });

        const btn = document.getElementById('lick4-sound-test');
        const status = document.getElementById('lick4-sound-status');
        // Play only the first ~2s of fox_intro so this is a snappy sound check,
        // not a full listen. Swap to a dedicated audio/audio_check.mp3 later if
        // you record one (and drop the setTimeout below).
        const SOUND_TEST_MS = 2000;
        btn.onclick = () => {
            // Must be IN the document: the narrator's lip-sync driver scans
            // document.querySelectorAll('audio, video'), so a detached
            // `new Audio()` plays with the fox sitting frozen.
            const a = document.createElement('audio');
            a.src = BASE_URL + "audio/fox_intro.mp3";
            a.className = 'sound-test-audio';
            document.body.appendChild(a);
            a.addEventListener('ended', () => a.remove());
            btn.disabled = true;
            btn.style.opacity = '0.55';
            status.textContent = "🔊 Playing…";
            let cutoff;
            a.play().then(() => {
                cutoff = setTimeout(() => {
                    a.pause();
                    status.innerHTML = "✓ If you heard Ms. Fox, click <b>Ready to start</b> below.";
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.textContent = "🔊 Play again";
                    nextBtns().forEach(b => { b.disabled = false; b.style.opacity = '1'; });
                }, SOUND_TEST_MS);
            }).catch(() => {
                clearTimeout(cutoff);
                status.innerHTML = "⚠️ Couldn't play. Check your browser's sound permissions and try again.";
                btn.disabled = false;
                btn.style.opacity = '1';
            });
        };
    }
};

// === STORY FRAMES (intro + warmup + outro) =====================

// Fox intro — fox sits centered on screen, plays the intro audio, then
// transitions back to the bottom-right corner. Audio narration is the
// only spoken content; no on-screen text repeats it.
const fox_intro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <audio autoplay class="fox-intro-audio">
            <source src="${BASE_URL}audio/fox_intro.mp3" type="audio/mpeg">
        </audio>
        <div id="fox-intro-spacer" style="height: 460px;"></div>`,
    choices: next_button(),
    data: { name: "fox_intro" },
    on_load: function() {
        // Defensive: ensure the fox is visible (normally revealed on the
        // preceding directions_and_audio_check screen).
        window._lick4FoxVisible = true;
        const c = document.getElementById('lick4-narrator-container');
        if (c) { c.classList.remove('hidden'); c.classList.add('intro-center'); }

        const audio = document.querySelector('audio.fox-intro-audio');
        const btns  = () => document.querySelectorAll('button.jspsych-btn');
        btns().forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });

        // Don't remove .intro-center here — keep the fox centered through
        // the welcome (`intro`) trial as well. Only the welcome's on_finish
        // moves the fox to the corner.
        const enableNext = () => btns().forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        if (audio) {
            audio.addEventListener('ended', enableNext);
            setTimeout(() => {
                if (audio.ended || (audio.paused && audio.currentTime === 0)) enableNext();
            }, 20000);
        } else {
            enableNext();
        }
    },
    on_finish: function() {
        // Intentionally do NOT remove .intro-center — the welcome screen
        // immediately after fox_intro also wants the fox centered.
    }
};

// Pie intro — fox (still centered) explains the pie reward system.
// The pie widget scales up + pulses in the corner so the kid notices it.
const pie_intro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <audio autoplay class="fox-pie-intro-audio">
            <source src="${BASE_URL}audio/fox_pie_intro.mp3" type="audio/mpeg">
        </audio>
        <div style="height: 460px;"></div>`,
    choices: next_button(),
    data: { name: "pie_intro" },
    on_load: function() {
        const c = document.getElementById('lick4-narrator-container');
        if (c) c.classList.add('intro-center');
        const p = document.getElementById('lick4-pie');
        if (p) {
            // SNAP the pie into the next-to-fox position with no transition
            // (so it just APPEARS there instead of sliding up from the corner).
            const savedTrans = p.style.transition;
            p.style.transition = 'none';
            p.classList.add('spotlight', 'visible');
            void p.offsetHeight; // force a reflow before re-enabling transitions
            p.style.transition = savedTrans;
        }
        const audio = document.querySelector('audio.fox-pie-intro-audio');
        const btns  = () => document.querySelectorAll('button.jspsych-btn');
        btns().forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });
        const enableNext = () => btns().forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        if (audio) {
            audio.addEventListener('ended', enableNext);
            setTimeout(() => {
                if (audio.ended || (audio.paused && audio.currentTime === 0)) enableNext();
            }, 15000);
        } else { enableNext(); }
    },
    on_finish: function() {
        // Drop .spotlight — pie smoothly transitions to the corner.
        // .visible stays on so it remains in view from now on.
        const p = document.getElementById('lick4-pie');
        if (p) p.classList.remove('spotlight');
    }
};

// Welcome / intro screen: fox stays centered + big, no banner text,
// audio is the only narration. Fox returns to corner after this trial.
const intro = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        const intro_audio = CB_RELATION === "Mom"
            ? BASE_URL + "audio/intro_mom.mp3"
            : BASE_URL + "audio/intro_teacher.mp3";
        return `<audio autoplay class="welcome-audio">
                    <source src="${intro_audio}" type="audio/mpeg">
                </audio>
                <div style="height: 460px;"></div>`;
    },
    choices: next_button(),
    data: { name: "intro" },
    on_load: function() {
        const c = document.getElementById('lick4-narrator-container');
        if (c) c.classList.add('intro-center');
        const audio = document.querySelector('audio.welcome-audio');
        const btns  = () => document.querySelectorAll('button.jspsych-btn');
        btns().forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });
        const finish = () => {
            btns().forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        };
        if (audio) {
            audio.addEventListener('ended', finish);
            setTimeout(() => { if (audio.ended) finish(); }, 30000);
        } else { finish(); }
    },
    on_finish: function() {
        const c = document.getElementById('lick4-narrator-container');
        if (c) c.classList.remove('intro-center');
    }
};

// Start-of-study attention check: plays the "in every video today, the
// person next to the girl will be her mom/teacher" intro video. Single
// Single manipulation check — after the intro video, the kid identifies
// who's next to the girl (mom vs. teacher). Replaces the per-trial
// attention check that used to run after every story.
// === SPOKEN-LABEL BUTTON CUES ==================================
// The attention check labels its buttons "Mom" and "Teacher" in text, which
// assumes a 6-year-old can read. Shaking the matching button while the word is
// spoken links the sound to the button instead.
//
// To shake on the actual words, add the time in seconds at which each word is
// spoken. Left empty, the buttons are offered one at a time after the question
// finishes, which needs no alignment.
const WORD_CUES = {
    // "audio/q_attention_intro.mp3": { Mom: 3.10, Teacher: 4.25 },
};

(function injectCueCss() {
    if (document.getElementById('lick4-cue-css')) return;
    const s = document.createElement('style');
    s.id = 'lick4-cue-css';
    s.textContent = `
        @keyframes lick4-cue-shake {
            0%,100% { transform: translateX(0)   rotate(0deg)   scale(1); }
            15%     { transform: translateX(-6px) rotate(-2.5deg) scale(1.06); }
            35%     { transform: translateX(6px)  rotate(2.5deg)  scale(1.08); }
            55%     { transform: translateX(-5px) rotate(-2deg)   scale(1.06); }
            75%     { transform: translateX(4px)  rotate(1.5deg)  scale(1.04); }
        }
        button.jspsych-btn.lick4-cued { animation: lick4-cue-shake 0.72s ease-in-out; }
        button.jspsych-btn.lick4-cued > div { box-shadow: 0 0 0 5px rgba(255,180,60,0.55); }
    `;
    (document.head || document.documentElement).appendChild(s);
})();

// Shake the button whose visible text matches `label`. Matching on text rather
// than index matters: the two buttons are presented in randomised order.
function cueLabel(label) {
    const want = String(label).trim().toLowerCase();
    document.querySelectorAll('button.jspsych-btn').forEach(b => {
        if ((b.textContent || '').trim().toLowerCase() !== want) return;
        b.classList.remove('lick4-cued');
        void b.offsetWidth;                 // restart the animation
        b.classList.add('lick4-cued');
        setTimeout(() => b.classList.remove('lick4-cued'), 900);
    });
}

const attention_intro = {
    type: jsPsychHtmlButtonResponse,
    on_start: function() {
        window._attn_intro_swap = Math.random() < 0.5;
    },
    stimulus: function() {
        const vid = CB_RELATION === "Mom"
            ? BASE_URL + "videos/girls_mom_intro.m4v"
            : BASE_URL + "videos/girls_teacher_intro.m4v";
        return `<video src="${vid}"
                       data-attn-intro-video
                       autoplay playsinline
                       style="max-width: 600px; height: auto; margin: 12px auto;
                              display: block; border-radius: 6px;">
                Your browser does not support inline video.
              </video>`;
    },
    choices: function() {
        const swap = window._attn_intro_swap;
        const mom = `<div style="font-size: 28px; padding: 22px 32px; border: 4px solid #2a6f97; border-radius: 14px; background: #eaf4fb; min-width: 160px;"><b>Mom</b></div>`;
        const tch = `<div style="font-size: 28px; padding: 22px 32px; border: 4px solid #2a6f97; border-radius: 14px; background: #eaf4fb; min-width: 160px;"><b>Teacher</b></div>`;
        return swap ? [tch, mom] : [mom, tch];
    },
    button_html: '<button class="jspsych-btn" style="background:transparent;border:none;padding:0;margin:0 16px;">%choice%</button>',
    margin_horizontal: "16px",
    data: { name: "attention_intro" },
    on_load: function() {
        const video = document.querySelector('video[data-attn-intro-video]');
        const btns  = () => document.querySelectorAll('button.jspsych-btn');
        const lock   = () => btns().forEach(b => { b.disabled = true;  b.style.visibility = "hidden";  });
        const unlock = () => {
            btns().forEach(b => { b.disabled = false; b.style.visibility = "visible"; });
            // Play the manipulation-check question audio the moment the
            // buttons reveal so the kid hears what to answer. It must be IN the
            // document: the lip-sync driver scans the DOM for playing media, so
            // a detached `new Audio()` leaves the fox frozen.
            const a = document.createElement('audio');
            a.src = BASE_URL + "audio/q_attention_intro.mp3";
            a.className = 'attn-intro-audio';
            document.body.appendChild(a);
            const cues = WORD_CUES["audio/q_attention_intro.mp3"];
            if (cues) {
                Object.keys(cues).forEach(label => {
                    const at = cues[label];
                    a.addEventListener('timeupdate', function fire() {
                        if (a.currentTime >= at) {
                            a.removeEventListener('timeupdate', fire);
                            cueLabel(label);
                        }
                    });
                });
                a.addEventListener('ended', () => a.remove());
            } else {
                a.addEventListener('ended', () => {
                    a.remove();
                    cueLabel("Mom");
                    setTimeout(() => cueLabel("Teacher"), 750);
                });
            }
            a.play().catch(() => {});
        };
        if (video) {
            video.addEventListener('ended', unlock);
            video.play().catch(() => {});
        }
        lock();
    },
    on_finish: function(data) {
        const swap = window._attn_intro_swap;
        const vals = swap ? ["teacher", "mom"] : ["mom", "teacher"];
        data.chosen_value   = vals[data.response];
        data.attention_swap = swap;
        data.correct        = (data.chosen_value === CB_RELATION.toLowerCase());
    }
};

// Button-training screen: fox shows the two trial buttons (orange
// Watch-again / green Next) as a demo while explaining what each does.
// Buttons are non-clickable here — just a visual reference. After the
// audio ends, a single "Next" button below lets the kid continue.
const button_training = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <audio autoplay class="button-training-audio">
            <source src="${BASE_URL}audio/fox_button_training.mp3" type="audio/mpeg">
        </audio>
        <div style="margin-top: 30px; display: flex; justify-content: center; gap: 60px;">
            <div style="background:linear-gradient(135deg,#ff9436,#ed6b00);color:white;padding:14px 30px;border-radius:16px;font-weight:700;font-size:26px;display:inline-flex;align-items:center;gap:10px;line-height:1;box-shadow:0 4px 10px rgba(237,107,0,0.30);">
                <span style="font-size:34px;line-height:0.8;">↻</span> Watch again
            </div>
            <div style="background:linear-gradient(135deg,#34d058,#1e8449);color:white;padding:14px 30px;border-radius:16px;font-weight:700;font-size:26px;display:inline-flex;align-items:center;gap:10px;line-height:1;box-shadow:0 4px 10px rgba(39,174,96,0.30);">
                Next <span style="font-size:28px;line-height:0.8;">▶</span>
            </div>
        </div>
        <div style="height: 240px;"></div>`,
    choices: next_button("Got it"),
    data: { name: "button_training" },
    on_load: function() {
        // Fox stays in her side position so she doesn't cover the
        // centered demo buttons.
        const audio = document.querySelector('audio.button-training-audio');
        const btns = () => document.querySelectorAll('button.jspsych-btn');
        btns().forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });
        const enableNext = () => btns().forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        if (audio) {
            audio.addEventListener('ended', enableNext);
            setTimeout(() => { if (audio.ended) enableNext(); }, 25000);
        } else { enableNext(); }
    }
};

const transition_to_trials = {
    type: jsPsychHtmlButtonResponse,
    stimulus: caption_banner("Ready?")
        + story_text(`Great! Let's start. There will be <b>6</b> short videos.`),
    choices: next_button("Start the first video"),
    data: { name: "transition_to_trials" }
};

const thanks = {
    type: jsPsychHtmlButtonResponse,
    stimulus: audio_html(AUDIO.thanks)
        + `<p style="font-size: 44px; margin: 40px auto; line-height: 1.3;">
            Thank you for playing!
            </p>`,
    choices: next_button(),
    on_load: function() {
        // Pie is full — fox eats it (the pie slides into the fox and fades).
        if (typeof window.lick4_pie_feast === "function") {
            setTimeout(window.lick4_pie_feast, 600);
        }
    }
};

const debrief = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<p style="padding: 1em; margin: 0 auto 4% auto; max-width: 950px; border: medium solid #87b79f; border-radius: 5px; background-color: #effbf5; font-size: 26px; line-height: 1.3;">
        Thanks to you and your child for participating in our study!
        <br style="line-height:60px;">
        <b>Description of study:</b> This study examines how children
        ages 6 to 8 think about consent in social relationships. We
        show children short stories about a girl and either her mom
        or her teacher, where the side character interacts with the
        girl's musical instrument in different ways &mdash; sometimes
        with the girl's knowledge, and sometimes while the girl is
        away. We ask children whether each action was &ldquo;okay&rdquo;,
        and what the girl herself would think if she found out. We
        randomize the order of trials and the assignment of
        protagonists to conditions across children. We are interested
        in whether children's evaluations of actions depend on whether
        the action was consensual, what kind of action it was, and the
        relationship between the people involved.
        <br style="line-height:60px;">
        <b>Payment:</b> we will send you a $5 Amazon gift code using the
        email you provided. This can take up to two weeks, but if you
        have not received one by then, please let us know.
        <br style="line-height:60px;">
        To submit this study, you can click the &ldquo;submit&rdquo; button.
        </p>`,
    choices: ['<p style="font-size: 40px;">Submit</p>']
};

// === TIMELINE ==================================================

// setup
timeline.push(preload);
timeline.push(enter_fullscreen);
timeline.push(video_config);
timeline.push(video_consent);
timeline.push(start_rec);
timeline.push(directions_and_audio_check);

// study intro
timeline.push(fox_intro);
timeline.push(pie_intro);
timeline.push(intro);
timeline.push(attention_intro);
timeline.push(button_training);
timeline.push(transition_to_trials);

// 6 test trials in randomized order
for (const t of TRIALS) {
    for (const frame of build_test_trial(t)) {
        timeline.push(frame);
    }
}

// exit
timeline.push(thanks);
timeline.push(stop_rec);
timeline.push(email);
timeline.push(exit_survey);
timeline.push(debrief);

jsPsych.run(timeline);
