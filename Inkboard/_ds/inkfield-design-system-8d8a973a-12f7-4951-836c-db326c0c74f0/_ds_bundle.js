/* @ds-bundle: {"format":3,"namespace":"InkfieldDesignSystem_8d8a97","components":[],"sourceHashes":{"handoff/src/app/app-shell.ts":"7956ddf122a2","handoff/src/control-panel.ts":"b269e9e7212c","inkfield/app.jsx":"57f09f44e488","inkfield/glyph-field.js":"59923e7d9a61","inkfield/inspector.jsx":"419d64a01e8e","inkfield/panels.jsx":"e71b745d2abb","inkfield/tweaks-panel.jsx":"6591467622ed","inkfield/ui.jsx":"df50be1dfcac","ui_kits/inkfield/App.jsx":"9466284a652f","ui_kits/inkfield/components/ControlRail.jsx":"4a606fd3687a","ui_kits/inkfield/components/Controls.jsx":"9ec60c903774","ui_kits/inkfield/components/GlyphField.jsx":"8872e6c00648"},"inlinedExternals":[],"unexposedExports":[{"name":"createUi","sourcePath":"handoff/src/control-panel.ts"},{"name":"renderAppShell","sourcePath":"handoff/src/app/app-shell.ts"}]} */

(() => {

const __ds_ns = (window.InkfieldDesignSystem_8d8a97 = window.InkfieldDesignSystem_8d8a97 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// handoff/src/app/app-shell.ts
try { (() => {
/**
 * InkField — redesigned app shell (v5 UI refresh).
 *
 * Layout goals (see handoff/README-redesign.md):
 *   • Render mode is the HERO — a permanent left rail of tiles, not a buried row.
 *   • Six cramped tabs become ONE roomy, self-summarizing inspector of
 *     collapsible sections (pure-CSS accordion — no JS needed to open/close).
 *   • Plain-language labels lead; the technical term stays as a muted hint.
 *   • Docked panels sit BESIDE the canvas, never on top of it.
 *
 * IMPORTANT — every element id, input[name], and data-flow-only /
 * data-non-flow-only hook that control-panel.ts + bootstrap.ts + scene-context.ts
 * rely on is preserved verbatim, so the existing wiring works unchanged.
 */
function renderAppShell(app) {
  app.innerHTML = `
  <div class="app">
    <input id="panels-toggle" class="panels-toggle" type="checkbox" aria-label="Hide side panels" />

    <header class="topbar">
      <div class="brand">
        <p class="eyebrow">InkField</p>
        <h1>Algorithmic Splat Studio</h1>
      </div>
      <div class="topbar-spacer"></div>
      <label class="btn dashed sm file-button">
        <input id="file-input" type="file" accept="${__ds_scope.SUPPORTED_SPLAT_ACCEPT}" />
        Open file…
      </label>
      <button id="sample-button" class="btn sm" type="button">Load sample</button>
      <label class="btn ghost sm panels-toggle-btn" for="panels-toggle">
        <span class="ptoggle-hide">Hide panels</span>
        <span class="ptoggle-show">Show panels</span>
      </label>
    </header>

    <div class="body">
      <!-- ============================ MODE RAIL (hero) ===================== -->
      <nav class="rail" aria-label="Render mode">
        <div class="rail-title">Render mode</div>

        <label class="mode-tile">
          <input type="radio" name="render-mode" value="photo" />
          <span class="thumb thumb-photo" aria-hidden="true"></span>
          <span class="meta">
            <span class="name"><span class="glyph">◍</span>Photo</span>
            <span class="desc">Raw Gaussian splats — the untouched scan.</span>
          </span>
        </label>

        <label class="mode-tile">
          <input type="radio" name="render-mode" value="glyph" checked />
          <span class="thumb thumb-glyph" aria-hidden="true"></span>
          <span class="meta">
            <span class="name"><span class="glyph">@</span>Glyph</span>
            <span class="desc">Structure-aware characters per cell.</span>
          </span>
        </label>

        <label class="mode-tile">
          <input type="radio" name="render-mode" value="hatch" />
          <span class="thumb thumb-hatch" aria-hidden="true"></span>
          <span class="meta">
            <span class="name"><span class="glyph">╱</span>Hatch</span>
            <span class="desc">Pen hatching along the orientation field.</span>
          </span>
        </label>

        <label class="mode-tile">
          <input type="radio" name="render-mode" value="flow" />
          <span class="mode-badge">relight</span>
          <span class="thumb thumb-flow" aria-hidden="true"></span>
          <span class="meta">
            <span class="name"><span class="glyph">∿</span>Flow</span>
            <span class="desc">Streamlines that ride the surface.</span>
          </span>
        </label>

        <button id="auto-tune-button" class="btn ghost sm rail-auto" type="button">Auto-tune look</button>
      </nav>

      <!-- ============================ STAGE =============================== -->
      <main class="stage" aria-label="Viewport">
        <canvas id="viewport" class="viewport" aria-label="InkField splat viewport"></canvas>

        <div class="stage-hint" aria-hidden="true">
          <span><kbd>drag</kbd> orbit</span>
          <span><kbd>scroll</kbd> zoom</span>
        </div>

        <div id="light-widget" class="light-widget" aria-label="Light source direction" role="img">
          <div class="light-widget-orbit">
            <span class="light-widget-axis light-widget-axis-x"></span>
            <span class="light-widget-axis light-widget-axis-y"></span>
            <span id="light-widget-ray" class="light-widget-ray"></span>
            <span id="light-widget-dot" class="light-widget-dot"></span>
          </div>
        </div>

        <div id="loading-status" class="loading-status" role="status" aria-live="polite" hidden>
          <span id="loading-status-message" class="loading-status-message">Loading…</span>
          <progress id="loading-status-progress" class="loading-status-progress"></progress>
        </div>
      </main>

      <!-- ============================ INSPECTOR =========================== -->
      <aside class="inspector" aria-label="Controls">
        <div class="insp-head">
          <div class="title">Inspector</div>
          <div class="sub">Every control, grouped and labelled</div>
        </div>

        <!-- LOOK ------------------------------------------------------- -->
        <section class="section">
          <input id="sec-look" class="sec-toggle" type="checkbox" checked />
          <label class="section-head" for="sec-look">
            <span class="ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/></svg>
            </span>
            <span class="grow"><span class="name">Look</span><span class="summary" id="sum-look"></span></span>
            <span class="chev" aria-hidden="true">›</span>
          </label>
          <div class="section-body">
            <!-- glyph / hatch / photo -->
            <div class="row" data-non-flow-only>
              <div class="row-label"><span class="lbl">Stroke source<span class="hint">how direction is found</span></span></div>
              <div class="seg" role="group" aria-label="Stroke source">
                <label><input type="radio" name="orientation-source" value="screen" /><span>Per-frame</span></label>
                <label><input type="radio" name="orientation-source" value="surface" checked /><span>Locked to surface</span></label>
              </div>
            </div>
            <label class="row range-row" for="saturation" data-non-flow-only>
              <div class="row-label"><span class="lbl">Colour<span class="hint">saturation</span></span><span id="saturation-value" class="val">1.15</span></div>
              <input id="saturation" class="slider" type="range" min="0" max="2.5" step="0.05" value="1.15" />
            </label>
            <label class="row range-row" for="grid-columns" data-non-flow-only>
              <div class="row-label"><span class="lbl">Detail<span class="hint">grid columns</span></span><span id="grid-columns-value" class="val">180</span></div>
              <input id="grid-columns" class="slider" type="range" min="90" max="260" step="10" value="180" />
            </label>

            <!-- flow -->
            <div class="row" data-flow-only>
              <div class="row-label"><span class="lbl">Mark style</span></div>
              <div class="seg" role="group" aria-label="Mark style">
                <label><input type="radio" name="flow-atlas" value="glyph" /><span><span class="g">∿</span> Glyph</span></label>
                <label><input type="radio" name="flow-atlas" value="hatch" checked /><span><span class="g">╱</span> Hatch</span></label>
              </div>
            </div>
            <label class="row range-row" for="flow-stamp-interval" data-flow-only>
              <div class="row-label"><span class="lbl">Mark spacing<span class="hint">densest interval</span></span><span id="flow-stamp-interval-value" class="val">18</span></div>
              <input id="flow-stamp-interval" class="slider" type="range" min="8" max="48" step="1" value="18" />
            </label>
            <label class="row range-row" for="light-azimuth" data-flow-only>
              <div class="row-label"><span class="lbl">Light direction<span class="hint">azimuth</span></span><span id="light-azimuth-value" class="val">30deg</span></div>
              <input id="light-azimuth" class="slider" type="range" min="0" max="360" step="5" value="30" />
            </label>
            <label class="row range-row" for="light-elevation" data-flow-only>
              <div class="row-label"><span class="lbl">Light height<span class="hint">elevation</span></span><span id="light-elevation-value" class="val">40deg</span></div>
              <input id="light-elevation" class="slider" type="range" min="-90" max="90" step="5" value="40" />
            </label>
            <div class="row toggle-row" data-flow-only>
              <label class="toggle" for="scene-defocus-toggle">
                <span class="lbl">Depth of field<span class="hint">defocus far marks</span></span>
                <span class="switch"><input id="scene-defocus-toggle" type="checkbox" checked /><span class="track"></span><span class="knob"></span></span>
              </label>
            </div>
          </div>
        </section>

        <!-- LENS & DEPTH ----------------------------------------------- -->
        <section class="section">
          <input id="sec-lens" class="sec-toggle" type="checkbox" />
          <label class="section-head" for="sec-lens">
            <span class="ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/></svg>
            </span>
            <span class="grow"><span class="name">Lens &amp; Depth</span><span class="summary" id="sum-lens"></span></span>
            <span class="chev" aria-hidden="true">›</span>
          </label>
          <div class="section-body">
            <div class="row">
              <div class="row-label"><span class="lbl">Focal length</span></div>
              <div class="seg" role="group" aria-label="Focal length">
                <label><input type="radio" name="lens-preset" value="24" /><span>24mm</span></label>
                <label><input type="radio" name="lens-preset" value="35" /><span>35mm</span></label>
                <label><input type="radio" name="lens-preset" value="50" checked /><span>50mm</span></label>
                <label><input type="radio" name="lens-preset" value="85" /><span>85mm</span></label>
              </div>
            </div>
            <label class="row range-row" for="lens-aperture">
              <div class="row-label"><span class="lbl">Aperture<span class="hint">depth of field</span></span><span id="lens-aperture-value" class="val">f/4</span></div>
              <input id="lens-aperture" class="slider" type="range" min="0" max="7" step="1" value="3" />
            </label>
            <label class="row range-row" for="lens-focus-distance">
              <div class="row-label"><span class="lbl">Focus distance</span><span id="lens-focus-distance-value" class="val">3.30</span></div>
              <input id="lens-focus-distance" class="slider" type="range" min="0.2" max="12" step="0.05" value="3.3" />
            </label>
            <div class="row toggle-row">
              <label class="toggle" for="focus-plane-toggle">
                <span class="lbl">Show focus plane</span>
                <span class="switch"><input id="focus-plane-toggle" type="checkbox" checked /><span class="track"></span><span class="knob"></span></span>
              </label>
            </div>
            <div class="row toggle-row">
              <label class="toggle" for="focus-peaking-toggle">
                <span class="lbl">Focus peaking<span class="hint">highlight sharp edges</span></span>
                <span class="switch"><input id="focus-peaking-toggle" type="checkbox" /><span class="track"></span><span class="knob"></span></span>
              </label>
            </div>
          </div>
        </section>

        <!-- CAMERA MOTION ---------------------------------------------- -->
        <section class="section">
          <input id="sec-motion" class="sec-toggle" type="checkbox" />
          <label class="section-head" for="sec-motion">
            <span class="ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="12" rx="9" ry="4.5"/><circle cx="12" cy="7.5" r="1.6" fill="currentColor" stroke="none"/></svg>
            </span>
            <span class="grow"><span class="name">Camera Motion</span><span class="summary" id="sum-motion"></span></span>
            <span class="chev" aria-hidden="true">›</span>
          </label>
          <div class="section-body">
            <div class="row">
              <div class="row-label"><span class="lbl">Path</span></div>
              <div class="seg" role="group" aria-label="Camera path">
                <label><input type="radio" name="camera-rig-preset" value="turntable" checked /><span>Orbit</span></label>
                <label><input type="radio" name="camera-rig-preset" value="dolly" /><span>Dolly in</span></label>
              </div>
            </div>
            <div class="row action-row">
              <span class="lbl">Playback</span>
              <button id="camera-rig-play" class="btn ghost sm" type="button" aria-pressed="false">Play</button>
            </div>
            <label class="row range-row" for="camera-rig-scrub">
              <div class="row-label"><span class="lbl">Scrub</span><span id="camera-rig-scrub-value" class="val">0%</span></div>
              <input id="camera-rig-scrub" class="slider" type="range" min="0" max="1000" step="1" value="0" />
            </label>
            <label class="row range-row" for="camera-rig-duration">
              <div class="row-label"><span class="lbl">Duration</span><span id="camera-rig-duration-value" class="val">8s</span></div>
              <input id="camera-rig-duration" class="slider" type="range" min="2" max="30" step="1" value="8" />
            </label>
            <label class="row range-row" for="camera-rig-rpm">
              <div class="row-label"><span class="lbl">Speed<span class="hint">rotations / min</span></span><span id="camera-rig-rpm-value" class="val">7.5rpm</span></div>
              <input id="camera-rig-rpm" class="slider" type="range" min="1" max="18" step="0.5" value="7.5" />
            </label>
          </div>
        </section>

        <!-- ORIENT SCAN (transform) ------------------------------------ -->
        <section class="section">
          <input id="sec-transform" class="sec-toggle" type="checkbox" />
          <label class="section-head" for="sec-transform">
            <span class="ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4.5" y="4.5" width="15" height="15" rx="1.5"/><path d="M9 4.5v15M4.5 9h15"/></svg>
            </span>
            <span class="grow"><span class="name">Orient Scan</span><span class="summary" id="sum-transform"></span></span>
            <span class="chev" aria-hidden="true">›</span>
          </label>
          <div class="section-body">
            <label class="row range-row" for="transform-rotation-x">
              <div class="row-label"><span class="lbl">Tilt<span class="hint">rot X</span></span><span id="transform-rotation-x-value" class="val">0deg</span></div>
              <input id="transform-rotation-x" class="slider" type="range" min="-180" max="180" step="5" value="0" />
            </label>
            <label class="row range-row" for="transform-rotation-y">
              <div class="row-label"><span class="lbl">Turn<span class="hint">rot Y</span></span><span id="transform-rotation-y-value" class="val">0deg</span></div>
              <input id="transform-rotation-y" class="slider" type="range" min="-180" max="180" step="5" value="0" />
            </label>
            <label class="row range-row" for="transform-rotation-z">
              <div class="row-label"><span class="lbl">Roll<span class="hint">rot Z</span></span><span id="transform-rotation-z-value" class="val">0deg</span></div>
              <input id="transform-rotation-z" class="slider" type="range" min="-180" max="180" step="5" value="0" />
            </label>
            <div class="row action-row">
              <span class="lbl">Reset orientation</span>
              <button id="transform-reset" class="btn ghost sm" type="button">Reset</button>
            </div>
          </div>
        </section>

        <!-- EXPORT ----------------------------------------------------- -->
        <section class="section">
          <input id="sec-export" class="sec-toggle" type="checkbox" />
          <label class="section-head" for="sec-export">
            <span class="ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M5 15v4h14v-4"/></svg>
            </span>
            <span class="grow"><span class="name">Export</span><span class="summary" id="sum-export"></span></span>
            <span class="chev" aria-hidden="true">›</span>
          </label>
          <div class="section-body">
            <div class="divider-note">Still image</div>
            <div class="row action-row">
              <span class="lbl">Save PNG</span>
              <button id="png-export-button" class="btn ghost sm" type="button">Save PNG</button>
            </div>
            <label class="row range-row" for="png-export-scale">
              <div class="row-label"><span class="lbl">Resolution<span class="hint">multiplier</span></span><span id="png-export-scale-value" class="val">2x</span></div>
              <input id="png-export-scale" class="slider" type="range" min="1" max="4" step="0.5" value="2" />
            </label>
            <div class="row action-row">
              <span class="lbl">Save SVG<span class="hint">vector marks</span></span>
              <button id="svg-export-button" class="btn ghost sm" type="button">Save SVG</button>
            </div>
            <div class="divider-note">Orbit movie</div>
            <label class="row range-row" for="frame-sequence-frame-count">
              <div class="row-label"><span class="lbl">Frames</span><span id="frame-sequence-frame-count-value" class="val">24</span></div>
              <input id="frame-sequence-frame-count" class="slider" type="range" min="8" max="120" step="1" value="24" />
            </label>
            <label class="row range-row" for="video-export-fps">
              <div class="row-label"><span class="lbl">Frame rate</span><span id="video-export-fps-value" class="val">24fps</span></div>
              <input id="video-export-fps" class="slider" type="range" min="12" max="60" step="1" value="24" />
            </label>
            <div class="row action-row">
              <span class="lbl">Render frames</span>
              <button id="frame-sequence-export-button" class="btn ghost sm" type="button">Render frames</button>
            </div>
            <div class="row action-row">
              <span class="lbl">Save video</span>
              <button id="video-export-button" class="btn ghost sm" type="button">Save video</button>
            </div>
            <div class="row action-row">
              <span class="lbl">Fallback<span class="hint">frames as ZIP</span></span>
              <button id="png-sequence-export-button" class="btn ghost sm" type="button">PNG ZIP</button>
            </div>
            <div class="progress-row">
              <progress id="frame-sequence-progress" class="sequence-progress" value="0" max="1" hidden></progress>
              <span id="frame-sequence-progress-label" class="progress-label">Ready</span>
            </div>
          </div>
        </section>

        <!-- DIAGNOSTICS ------------------------------------------------ -->
        <section class="section">
          <input id="sec-diag" class="sec-toggle" type="checkbox" />
          <label class="section-head" for="sec-diag">
            <span class="ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 18V9M9 18V5M14 18v-6M19 18v-9"/></svg>
            </span>
            <span class="grow"><span class="name">Diagnostics</span><span class="summary" id="sum-diag"></span></span>
            <span class="chev" aria-hidden="true">›</span>
          </label>
          <div class="section-body">
            <div class="row" data-non-flow-only>
              <div class="row-label"><span class="lbl">Direction bins<span class="hint">orientation quantization</span></span></div>
              <div class="seg" role="group" aria-label="Direction bins">
                <label><input type="radio" name="direction-bins" value="4" checked /><span>4</span></label>
                <label><input type="radio" name="direction-bins" value="8" /><span>8</span></label>
              </div>
            </div>
            <div class="row toggle-row">
              <label class="toggle" for="normal-overlay">
                <span class="lbl">Normals overlay</span>
                <span class="switch"><input id="normal-overlay" type="checkbox" disabled /><span class="track"></span><span class="knob"></span></span>
              </label>
            </div>
            <div class="row toggle-row">
              <label class="toggle" for="tangent-overlay">
                <span class="lbl">Tangents overlay</span>
                <span class="switch"><input id="tangent-overlay" type="checkbox" disabled /><span class="track"></span><span class="knob"></span></span>
              </label>
            </div>
            <dl class="readout">
              <div><dt>Render</dt><dd id="render-status">Starting orientation pass…</dd></div>
              <div><dt>Scene</dt><dd id="scene-status">Starting renderer…</dd></div>
            </dl>
          </div>
        </section>
      </aside>
    </div>
  </div>
`;
}
Object.assign(__ds_scope, { renderAppShell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "handoff/src/app/app-shell.ts", error: String((e && e.message) || e) }); }

// handoff/src/control-panel.ts
try { (() => {
function createUi() {
  const sampleButton = getElement('sample-button');
  const fileInput = getElement('file-input');
  const autoTuneButton = getElement('auto-tune-button');
  const modeInputs = getInputGroup('render-mode');
  const flowModeInput = modeInputs.find(input => input.value === 'flow');
  const orientationSourceInputs = getInputGroup('orientation-source');
  const normalOverlay = getElement('normal-overlay');
  const tangentOverlay = getElement('tangent-overlay');
  const gridColumns = getElement('grid-columns');
  const gridColumnsValue = getElement('grid-columns-value');
  const directionBinInputs = getInputGroup('direction-bins');
  const saturation = getElement('saturation');
  const saturationValue = getElement('saturation-value');
  const flowAtlasInputs = getInputGroup('flow-atlas');
  const flowStampInterval = getElement('flow-stamp-interval');
  const flowStampIntervalValue = getElement('flow-stamp-interval-value');
  const lightAzimuth = getElement('light-azimuth');
  const lightAzimuthValue = getElement('light-azimuth-value');
  const lightElevation = getElement('light-elevation');
  const lightElevationValue = getElement('light-elevation-value');
  const cameraRigPlay = getElement('camera-rig-play');
  const cameraRigPresetInputs = getInputGroup('camera-rig-preset');
  const cameraRigScrub = getElement('camera-rig-scrub');
  const cameraRigScrubValue = getElement('camera-rig-scrub-value');
  const cameraRigDuration = getElement('camera-rig-duration');
  const cameraRigDurationValue = getElement('camera-rig-duration-value');
  const cameraRigRpm = getElement('camera-rig-rpm');
  const cameraRigRpmValue = getElement('camera-rig-rpm-value');
  const lensPresetInputs = getInputGroup('lens-preset');
  const lensAperture = getElement('lens-aperture');
  const lensApertureValue = getElement('lens-aperture-value');
  const lensFocusDistance = getElement('lens-focus-distance');
  const lensFocusDistanceValue = getElement('lens-focus-distance-value');
  const focusPlaneToggle = getElement('focus-plane-toggle');
  const focusPeakingToggle = getElement('focus-peaking-toggle');
  const sceneDefocusToggle = getElement('scene-defocus-toggle');
  const pngScale = getElement('png-export-scale');
  const pngScaleValue = getElement('png-export-scale-value');
  const pngExportButton = getElement('png-export-button');
  const frameSequenceFrameCount = getElement('frame-sequence-frame-count');
  const frameSequenceFrameCountValue = getElement('frame-sequence-frame-count-value');
  const frameSequenceExportButton = getElement('frame-sequence-export-button');
  const videoExportFps = getElement('video-export-fps');
  const videoExportFpsValue = getElement('video-export-fps-value');
  const videoExportButton = getElement('video-export-button');
  const pngSequenceExportButton = getElement('png-sequence-export-button');
  const svgExportButton = getElement('svg-export-button');
  const frameSequenceProgress = getElement('frame-sequence-progress');
  const frameSequenceProgressLabel = getElement('frame-sequence-progress-label');
  const lightWidget = getElement('light-widget');
  const flowOnlyControls = Array.from(document.querySelectorAll('[data-flow-only]'));
  const nonFlowOnlyControls = Array.from(document.querySelectorAll('[data-non-flow-only]'));
  const transformReset = getElement('transform-reset');
  const transformInputs = {
    x: getElement('transform-rotation-x'),
    y: getElement('transform-rotation-y'),
    z: getElement('transform-rotation-z')
  };
  const transformValues = {
    x: getElement('transform-rotation-x-value'),
    y: getElement('transform-rotation-y-value'),
    z: getElement('transform-rotation-z-value')
  };
  const sceneStatus = getElement('scene-status');
  const renderStatus = getElement('render-status');
  const loadingStatus = getOptionalElement('loading-status');
  const loadingStatusMessage = getOptionalElement('loading-status-message');
  const loadingStatusProgress = getOptionalElement('loading-status-progress');

  // ── v5 UI refresh: live section summaries ─────────────────────────────────
  // Additive only — does not change the public InkFieldUi contract. Reads the
  // current DOM state and writes a one-line summary into each section header's
  // #sum-* span, so the collapsed inspector reads at a glance. Updates on any
  // user input (event delegation) and whenever a setter pushes a value in.
  const summaryTargets = {
    look: getOptionalElement('sum-look'),
    lens: getOptionalElement('sum-lens'),
    motion: getOptionalElement('sum-motion'),
    transform: getOptionalElement('sum-transform'),
    export: getOptionalElement('sum-export'),
    diag: getOptionalElement('sum-diag')
  };
  function checkedValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  }
  function refreshSummaries() {
    const mode = checkedValue('render-mode') || 'glyph';
    if (summaryTargets.look) {
      summaryTargets.look.textContent = mode === 'photo' ? 'Raw splats' : mode === 'flow' ? `Flow · ${checkedValue('flow-atlas')} · gap ${flowStampInterval.value}` : `${mode} · ${checkedValue('orientation-source')} · detail ${gridColumns.value}`;
    }
    if (summaryTargets.lens) {
      summaryTargets.lens.textContent = `${checkedValue('lens-preset')}mm · ${lensApertureValue.textContent} · ${lensFocusDistanceValue.textContent}`;
    }
    if (summaryTargets.motion) {
      const path = checkedValue('camera-rig-preset') === 'dolly' ? 'Dolly' : 'Orbit';
      summaryTargets.motion.textContent = `${path} · ${cameraRigDurationValue.textContent}`;
    }
    if (summaryTargets.transform) {
      const x = transformInputs.x.value;
      const y = transformInputs.y.value;
      const z = transformInputs.z.value;
      summaryTargets.transform.textContent = x === '0' && y === '0' && z === '0' ? 'Default pose' : `${x}° ${y}° ${z}°`;
    }
    if (summaryTargets.export) {
      summaryTargets.export.textContent = `PNG ${pngScaleValue.textContent} · ${frameSequenceFrameCountValue.textContent}f`;
    }
    if (summaryTargets.diag) {
      summaryTargets.diag.textContent = `${checkedValue('direction-bins')} bins`;
    }
  }
  document.addEventListener('input', refreshSummaries);
  document.addEventListener('change', refreshSummaries);
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(refreshSummaries);
  }
  // ──────────────────────────────────────────────────────────────────────────

  return {
    onLoadSample(callback) {
      sampleButton.addEventListener('click', callback);
    },
    onLoadFile(callback) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) {
          callback(file);
        }
        fileInput.value = '';
      });
    },
    onAutoTune(callback) {
      autoTuneButton.addEventListener('click', callback);
    },
    onModeChange(callback) {
      for (const input of modeInputs) {
        input.addEventListener('change', () => {
          if (input.checked) {
            callback(input.value);
          }
        });
      }
    },
    onOrientationSourceChange(callback) {
      for (const input of orientationSourceInputs) {
        input.addEventListener('change', () => {
          if (input.checked) {
            callback(input.value);
          }
        });
      }
    },
    onNormalOverlayChange(callback) {
      normalOverlay.addEventListener('change', () => {
        callback(normalOverlay.checked);
      });
    },
    onTangentOverlayChange(callback) {
      tangentOverlay.addEventListener('change', () => {
        callback(tangentOverlay.checked);
      });
    },
    onGridColumnsChange(callback) {
      gridColumns.addEventListener('input', () => {
        const columns = Number(gridColumns.value);
        gridColumnsValue.textContent = String(columns);
        callback(columns);
      });
    },
    onDirectionBinCountChange(callback) {
      for (const input of directionBinInputs) {
        input.addEventListener('change', () => {
          if (input.checked) {
            callback(__ds_scope.toDirectionBinCount(Number(input.value)));
          }
        });
      }
    },
    onSaturationChange(callback) {
      saturation.addEventListener('input', () => {
        const amount = Number(saturation.value);
        saturationValue.textContent = amount.toFixed(2);
        callback(amount);
      });
    },
    onFlowAtlasChange(callback) {
      for (const input of flowAtlasInputs) {
        input.addEventListener('change', () => {
          if (input.checked) {
            callback(__ds_scope.toFlowAtlas(input.value));
          }
        });
      }
    },
    onFlowStampIntervalChange(callback) {
      flowStampInterval.addEventListener('input', () => {
        const interval = Number(flowStampInterval.value);
        flowStampIntervalValue.textContent = String(interval);
        callback(interval);
      });
    },
    onLightAzimuthChange(callback) {
      lightAzimuth.addEventListener('input', () => {
        const azimuth = Number(lightAzimuth.value);
        lightAzimuthValue.textContent = formatDegrees(azimuth);
        callback(azimuth);
      });
    },
    onLightElevationChange(callback) {
      lightElevation.addEventListener('input', () => {
        const elevation = Number(lightElevation.value);
        lightElevationValue.textContent = formatDegrees(elevation);
        callback(elevation);
      });
    },
    onCameraRigPlayToggle(callback) {
      cameraRigPlay.addEventListener('click', callback);
    },
    onCameraRigPresetChange(callback) {
      for (const input of cameraRigPresetInputs) {
        input.addEventListener('change', () => {
          if (input.checked) {
            callback(__ds_scope.toCameraRigPreset(input.value));
          }
        });
      }
    },
    onCameraRigScrubChange(callback) {
      cameraRigScrub.addEventListener('input', () => {
        const progress = Number(cameraRigScrub.value) / 1000;
        cameraRigScrubValue.textContent = formatPercent(progress);
        callback(progress);
      });
    },
    onCameraRigDurationChange(callback) {
      cameraRigDuration.addEventListener('input', () => {
        const duration = Number(cameraRigDuration.value);
        cameraRigDurationValue.textContent = formatSeconds(duration);
        callback(duration);
      });
    },
    onCameraRigRpmChange(callback) {
      cameraRigRpm.addEventListener('input', () => {
        const rpm = Number(cameraRigRpm.value);
        cameraRigRpmValue.textContent = formatRpm(rpm);
        callback(rpm);
      });
    },
    onLensPresetChange(callback) {
      for (const input of lensPresetInputs) {
        input.addEventListener('change', () => {
          if (input.checked) {
            callback(__ds_scope.toLensPresetMm(Number(input.value)));
          }
        });
      }
    },
    onApertureChange(callback) {
      lensAperture.addEventListener('input', () => {
        const fNumber = __ds_scope.apertureStopAtIndex(Number(lensAperture.value));
        lensApertureValue.textContent = formatFStop(fNumber);
        callback(fNumber);
      });
    },
    onFocusDistanceChange(callback) {
      lensFocusDistance.addEventListener('input', () => {
        const distance = Number(lensFocusDistance.value);
        lensFocusDistanceValue.textContent = formatFocusDistance(distance);
        callback(distance);
      });
    },
    onFocusPlaneToggle(callback) {
      focusPlaneToggle.addEventListener('change', () => {
        callback(focusPlaneToggle.checked);
      });
    },
    onFocusPeakingToggle(callback) {
      focusPeakingToggle.addEventListener('change', () => {
        callback(focusPeakingToggle.checked);
      });
    },
    onSceneDefocusToggle(callback) {
      sceneDefocusToggle.addEventListener('change', () => {
        callback(sceneDefocusToggle.checked);
      });
    },
    onPngScaleChange(callback) {
      pngScale.addEventListener('input', () => {
        const scale = Number(pngScale.value);
        pngScaleValue.textContent = formatScale(scale);
        callback(scale);
      });
    },
    onExportPng(callback) {
      pngExportButton.addEventListener('click', callback);
    },
    onFrameSequenceFrameCountChange(callback) {
      frameSequenceFrameCount.addEventListener('input', () => {
        const frameCount = Number(frameSequenceFrameCount.value);
        frameSequenceFrameCountValue.textContent = String(frameCount);
        callback(frameCount);
      });
    },
    onExportFrameSequence(callback) {
      frameSequenceExportButton.addEventListener('click', callback);
    },
    onVideoExportFpsChange(callback) {
      videoExportFps.addEventListener('input', () => {
        const fps = Number(videoExportFps.value);
        videoExportFpsValue.textContent = `${fps}fps`;
        callback(fps);
      });
    },
    onExportVideo(callback) {
      videoExportButton.addEventListener('click', callback);
    },
    onExportPngSequence(callback) {
      pngSequenceExportButton.addEventListener('click', callback);
    },
    onExportSvg(callback) {
      svgExportButton.addEventListener('click', callback);
    },
    onTransformRotationChange(callback) {
      for (const axis of ['x', 'y', 'z']) {
        transformInputs[axis].addEventListener('input', () => {
          const degrees = Number(transformInputs[axis].value);
          transformValues[axis].textContent = formatDegrees(degrees);
          callback(axis, degrees);
        });
      }
    },
    onTransformReset(callback) {
      transformReset.addEventListener('click', callback);
    },
    setLoadingStatus(message, completed, total) {
      if (!loadingStatus || !loadingStatusMessage || !loadingStatusProgress) {
        return;
      }
      loadingStatus.hidden = false;
      loadingStatusMessage.textContent = message;
      if (completed !== undefined && total !== undefined && total > 0) {
        loadingStatusProgress.removeAttribute('data-indeterminate');
        loadingStatusProgress.max = total;
        loadingStatusProgress.value = Math.max(0, Math.min(total, completed));
      } else {
        loadingStatusProgress.setAttribute('data-indeterminate', 'true');
        loadingStatusProgress.removeAttribute('value');
      }
    },
    clearLoadingStatus(message = 'Ready') {
      if (!loadingStatus || !loadingStatusMessage || !loadingStatusProgress) {
        return;
      }
      loadingStatusMessage.textContent = message;
      loadingStatusProgress.max = 1;
      loadingStatusProgress.value = 1;
      loadingStatusProgress.removeAttribute('data-indeterminate');
      loadingStatus.hidden = true;
    },
    setSceneStatus(message) {
      sceneStatus.textContent = message;
    },
    setRenderStatus(message) {
      renderStatus.textContent = message;
    },
    setFlowModeAvailable(available) {
      if (!flowModeInput) {
        return;
      }
      flowModeInput.disabled = !available;
    },
    setRenderModeValue(mode) {
      for (const input of modeInputs) {
        input.checked = input.value === mode;
      }
      refreshSummaries();
    },
    setOrientationSourceValue(source) {
      for (const input of orientationSourceInputs) {
        input.checked = input.value === source;
      }
      refreshSummaries();
    },
    setNormalOverlayAvailable(available) {
      normalOverlay.disabled = !available;
    },
    setNormalOverlayEnabled(enabled) {
      normalOverlay.checked = enabled;
    },
    setTangentOverlayAvailable(available) {
      tangentOverlay.disabled = !available;
    },
    setTangentOverlayEnabled(enabled) {
      tangentOverlay.checked = enabled;
    },
    setGridColumnsValue(columns) {
      gridColumns.value = String(columns);
      gridColumnsValue.textContent = String(columns);
      refreshSummaries();
    },
    setDirectionBinCountValue(count) {
      for (const input of directionBinInputs) {
        input.checked = Number(input.value) === count;
      }
      refreshSummaries();
    },
    setSaturationValue(amount) {
      saturation.value = String(amount);
      saturationValue.textContent = amount.toFixed(2);
    },
    setFlowAtlasValue(atlas) {
      for (const input of flowAtlasInputs) {
        input.checked = input.value === atlas;
      }
      refreshSummaries();
    },
    setFlowStampIntervalValue(interval) {
      flowStampInterval.value = String(interval);
      flowStampIntervalValue.textContent = String(interval);
      refreshSummaries();
    },
    setLightAzimuthValue(azimuth) {
      lightAzimuth.value = String(azimuth);
      lightAzimuthValue.textContent = formatDegrees(azimuth);
    },
    setLightElevationValue(elevation) {
      lightElevation.value = String(elevation);
      lightElevationValue.textContent = formatDegrees(elevation);
    },
    setCameraRigPlaying(playing) {
      cameraRigPlay.textContent = playing ? 'Pause' : 'Play';
      cameraRigPlay.setAttribute('aria-pressed', playing ? 'true' : 'false');
    },
    setCameraRigProgress(progress) {
      const clamped = Math.max(0, Math.min(1, progress));
      cameraRigScrub.value = String(Math.round(clamped * 1000));
      cameraRigScrubValue.textContent = formatPercent(clamped);
    },
    setCameraRigDurationValue(durationSeconds) {
      cameraRigDuration.value = String(durationSeconds);
      cameraRigDurationValue.textContent = formatSeconds(durationSeconds);
      refreshSummaries();
    },
    setCameraRigRpmValue(rotationsPerMinute) {
      cameraRigRpm.value = String(rotationsPerMinute);
      cameraRigRpmValue.textContent = formatRpm(rotationsPerMinute);
    },
    setLensPresetValue(focalLengthMm) {
      for (const input of lensPresetInputs) {
        input.checked = Number(input.value) === focalLengthMm;
      }
      refreshSummaries();
    },
    setApertureValue(fNumber) {
      lensAperture.value = String(__ds_scope.apertureStopIndex(fNumber));
      lensApertureValue.textContent = formatFStop(fNumber);
      refreshSummaries();
    },
    setFocusDistanceValue(focusDistance) {
      lensFocusDistance.value = String(focusDistance);
      lensFocusDistanceValue.textContent = formatFocusDistance(focusDistance);
      refreshSummaries();
    },
    setFocusPlaneVisible(visible) {
      focusPlaneToggle.checked = visible;
    },
    setFocusPeakingValue(enabled) {
      focusPeakingToggle.checked = enabled;
    },
    setSceneDefocusEnabled(enabled) {
      sceneDefocusToggle.checked = enabled;
    },
    setPngScaleValue(scale) {
      pngScale.value = String(scale);
      pngScaleValue.textContent = formatScale(scale);
      refreshSummaries();
    },
    setPngExportBusy(busy) {
      pngExportButton.disabled = busy;
      pngExportButton.textContent = busy ? 'Rendering...' : 'Save PNG';
    },
    setFrameSequenceFrameCountValue(frameCount) {
      frameSequenceFrameCount.value = String(frameCount);
      frameSequenceFrameCountValue.textContent = String(frameCount);
      refreshSummaries();
    },
    setFrameSequenceExportBusy(busy) {
      frameSequenceExportButton.disabled = busy;
      frameSequenceExportButton.textContent = busy ? 'Rendering...' : 'Render frames';
    },
    setVideoExportFpsValue(fps) {
      videoExportFps.value = String(fps);
      videoExportFpsValue.textContent = `${fps}fps`;
    },
    setVideoExportBusy(busy) {
      videoExportButton.disabled = busy;
      videoExportButton.textContent = busy ? 'Encoding...' : 'Save video';
    },
    setPngSequenceExportBusy(busy) {
      pngSequenceExportButton.disabled = busy;
      pngSequenceExportButton.textContent = busy ? 'Packaging...' : 'PNG ZIP';
    },
    setSvgExportBusy(busy) {
      svgExportButton.disabled = busy;
      svgExportButton.textContent = busy ? 'Saving...' : 'Save SVG';
    },
    setFrameSequenceProgress(completedFrames, totalFrames, latestHash) {
      const safeTotal = Math.max(1, totalFrames);
      const safeCompleted = Math.max(0, Math.min(safeTotal, completedFrames));
      frameSequenceProgress.hidden = completedFrames <= 0 && totalFrames <= 0;
      frameSequenceProgress.max = safeTotal;
      frameSequenceProgress.value = safeCompleted;
      frameSequenceProgressLabel.textContent = totalFrames <= 0 ? 'Ready' : `${safeCompleted}/${safeTotal}${latestHash ? ` ${latestHash}` : ''}`;
    },
    setModeControlVisibility(mode) {
      const isFlowMode = mode === 'flow';
      for (const element of flowOnlyControls) {
        element.hidden = !isFlowMode;
      }
      for (const element of nonFlowOnlyControls) {
        element.hidden = isFlowMode;
      }
      lightWidget.hidden = !isFlowMode;
      refreshSummaries();
    },
    setTransformValues(transform) {
      const values = {
        x: transform.rotationX,
        y: transform.rotationY,
        z: transform.rotationZ
      };
      for (const axis of ['x', 'y', 'z']) {
        transformInputs[axis].value = String(values[axis]);
        transformValues[axis].textContent = formatDegrees(values[axis]);
      }
      refreshSummaries();
    }
  };
}
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing #${id}`);
  }
  return element;
}
function getOptionalElement(id) {
  return document.getElementById(id);
}
function getInputGroup(name) {
  const inputs = Array.from(document.querySelectorAll(`input[name="${name}"]`));
  if (inputs.length === 0) {
    throw new Error(`Missing input group ${name}`);
  }
  return inputs;
}
function formatDegrees(degrees) {
  return `${Math.round(degrees)}deg`;
}
function formatSeconds(seconds) {
  return `${Math.round(seconds)}s`;
}
function formatRpm(rpm) {
  return `${Number(rpm.toFixed(1))}rpm`;
}
function formatPercent(progress) {
  return `${Math.round(progress * 100)}%`;
}
function formatScale(scale) {
  return `${Number(scale.toFixed(1))}x`;
}
function formatFStop(fNumber) {
  return `f/${Number(fNumber.toFixed(1))}`;
}
function formatFocusDistance(distance) {
  return distance.toFixed(2);
}
Object.assign(__ds_scope, { createUi });
})(); } catch (e) { __ds_ns.__errors.push({ path: "handoff/src/control-panel.ts", error: String((e && e.message) || e) }); }

// inkfield/app.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* InkField redesign — App: state, viewport, loading flow, motion, Tweaks. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "#e8a24c",
  "density": "regular"
} /*EDITMODE-END*/;
const DEFAULT_PARAMS = {
  mode: 'glyph',
  field: 'surface',
  color: 1.15,
  grid: 150,
  flowAtlas: 'hatch',
  flowGap: 18,
  lightAz: 30,
  lightEl: 40,
  dof: true,
  focal: 50,
  apertureIdx: 3,
  focus: 0.42,
  focusPlane: true,
  peaking: false,
  path: 'orbit',
  scrub: 0,
  duration: 8,
  rpm: 7.5,
  playing: false,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  pngScale: 2,
  frames: 24,
  fps: 24,
  bins: 4,
  normals: false,
  tangents: false
};
function loadParams() {
  try {
    const raw = localStorage.getItem('inkfield.redesign.params');
    if (raw) return Object.assign({}, DEFAULT_PARAMS, JSON.parse(raw), {
      playing: false
    });
  } catch (e) {}
  return Object.assign({}, DEFAULT_PARAMS);
}
function renderT(p) {
  const dolly = p.path === 'dolly' ? 0.4 : 1;
  return Number(p.scrub) / 1000 * Math.PI * 2 * dolly + p.rotY * Math.PI / 180;
}
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [params, setParams] = useState(loadParams);
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [panelsOn, setPanelsOn] = useState(true);
  const [exportState, setExportState] = useState({
    busy: null,
    pct: 0,
    label: 'Ready'
  });
  const [open, setOpen] = useState({
    look: true,
    lens: false,
    motion: false,
    transform: false,
    export: false,
    diag: false
  });
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const paramsRef = useRef(params);
  const refs = useRef({
    theme: t.theme,
    accent: t.accent
  });
  paramsRef.current = params;
  refs.current = {
    theme: t.theme,
    accent: t.accent
  };
  const set = useCallback(patch => setParams(prev => Object.assign({}, prev, patch)), []);
  const toggle = useCallback(id => setOpen(o => Object.assign({}, o, {
    [id]: !o[id]
  })), []);

  /* apply theme / density / accent to :root */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme || 'dark');
    document.documentElement.setAttribute('data-density', t.density || 'regular');
    document.documentElement.style.setProperty('--accent', t.accent || '#e8a24c');
  }, [t.theme, t.density, t.accent]);

  /* persist params (throttled) */
  const saveT = useRef(0);
  useEffect(() => {
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem('inkfield.redesign.params', JSON.stringify(params));
      } catch (e) {}
    }, 250);
  }, [params]);

  /* render viewport */
  const renderViewport = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !window.InkRender || !scan) return;
    const p = paramsRef.current;
    window.InkRender.render(c, {
      mode: p.mode,
      theme: refs.current.theme,
      accent: refs.current.accent,
      saturation: p.color,
      grid: p.grid,
      bins: p.bins,
      light: {
        az: p.lightAz,
        el: p.lightEl
      },
      flowAtlas: p.flowAtlas,
      flowGap: p.flowGap,
      focus: p.focus,
      aperture: window.FSTOPS[p.apertureIdx],
      dof: p.dof,
      showFocusPlane: p.focusPlane,
      showPeaking: p.peaking,
      t: renderT(p)
    });
  }, [scan]);
  useEffect(() => {
    renderViewport();
  }, [params, t.theme, t.accent, scan, renderViewport]);

  /* resize */
  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(() => renderViewport());
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [renderViewport]);

  /* motion playback loop */
  useEffect(() => {
    if (!params.playing) return;
    let raf,
      last = performance.now(),
      acc = 0;
    const loop = now => {
      const dt = (now - last) / 1000;
      last = now;
      const p = paramsRef.current;
      const step = dt / Math.max(1, p.duration) * 1000;
      let next = Number(p.scrub) + step;
      if (next >= 1000) next -= 1000;
      paramsRef.current = Object.assign({}, p, {
        scrub: next
      });
      renderViewport();
      acc += dt;
      if (acc > 0.12) {
        acc = 0;
        setParams(pr => Object.assign({}, pr, {
          scrub: next
        }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [params.playing, renderViewport]);

  /* loading sequence */
  const loadScene = useCallback((name, fmt) => {
    setScan(null);
    const steps = [{
      m: 'Decoding scan',
      d: name,
      pct: 22
    }, {
      m: 'Uploading splats to GPU',
      d: '1.04M',
      pct: 48
    }, {
      m: 'Baking surface field',
      d: 'kd-tree · normals · tangents',
      pct: 78
    }, {
      m: 'Tracing flow streamlines',
      d: 'object space',
      pct: 96
    }];
    let i = 0;
    setLoading({
      message: steps[0].m,
      detail: steps[0].d,
      pct: steps[0].pct
    });
    const tick = () => {
      i++;
      if (i < steps.length) {
        setLoading({
          message: steps[i].m,
          detail: steps[i].d,
          pct: steps[i].pct
        });
        setTimeout(tick, 380);
      } else {
        setScan({
          name,
          fmt,
          splats: '1.04M splats'
        });
        setLoading({
          message: 'Ready',
          detail: '',
          pct: 100
        });
        setTimeout(() => setLoading(null), 420);
      }
    };
    setTimeout(tick, 420);
  }, []);
  const onLoadSample = useCallback(() => loadScene('sample.spz', 'spz'), [loadScene]);
  const onLoadFile = useCallback(file => {
    const ext = (file.name.split('.').pop() || 'ply').toLowerCase();
    loadScene(file.name, ext);
  }, [loadScene]);
  const onPlay = useCallback(() => set({
    playing: !paramsRef.current.playing
  }), [set]);
  const onResetTransform = useCallback(() => set({
    rotX: 0,
    rotY: 0,
    rotZ: 0
  }), [set]);

  /* fake export with progress */
  const onExport = useCallback(kind => {
    const labels = {
      png: 'PNG',
      svg: 'SVG',
      frames: 'Frames',
      video: 'Video'
    };
    setExportState({
      busy: kind,
      pct: 0,
      label: labels[kind] + ' 0%'
    });
    let pct = 0;
    const iv = setInterval(() => {
      pct += kind === 'png' || kind === 'svg' ? 34 : 12;
      if (pct >= 100) {
        clearInterval(iv);
        setExportState({
          busy: null,
          pct: 100,
          label: labels[kind] + ' saved'
        });
        setTimeout(() => setExportState(s => Object.assign({}, s, {
          pct: 0,
          label: 'Ready'
        })), 1400);
      } else {
        setExportState({
          busy: kind,
          pct,
          label: labels[kind] + ' ' + pct + '%'
        });
      }
    }, kind === 'png' || kind === 'svg' ? 220 : 160);
  }, []);

  /* drag & drop */
  const dragHandlers = {
    onDragOver: e => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: e => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onLoadFile(f);else onLoadSample();
    }
  };
  const isFlow = params.mode === 'flow';
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement(TopBar, {
    scan: scan,
    onLoadSample: onLoadSample,
    onLoadFile: onLoadFile,
    panelsOn: panelsOn,
    onTogglePanels: () => setPanelsOn(v => !v)
  }), /*#__PURE__*/React.createElement("div", {
    className: 'body' + (panelsOn ? '' : ' no-panels')
  }, panelsOn && /*#__PURE__*/React.createElement(ModeRail, {
    mode: params.mode,
    onMode: m => set({
      mode: m
    }),
    loaded: !!scan,
    flowAvailable: !!scan,
    params: params,
    theme: t.theme,
    accent: t.accent
  }), /*#__PURE__*/React.createElement("div", _extends({
    className: "stage",
    ref: stageRef
  }, scan ? {} : dragHandlers), /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    className: "viewport"
  }), scan && /*#__PURE__*/React.createElement("div", {
    className: "stage-tools"
  }, /*#__PURE__*/React.createElement("button", {
    className: "seg-btn",
    "aria-pressed": params.playing,
    onClick: onPlay
  }, params.playing ? 'Pause' : 'Orbit'), /*#__PURE__*/React.createElement("button", {
    className: "seg-btn",
    onClick: onResetTransform
  }, "Recenter"), /*#__PURE__*/React.createElement("button", {
    className: "seg-btn",
    onClick: () => onExport('png')
  }, "Snapshot")), scan && /*#__PURE__*/React.createElement("div", {
    className: "stage-hint"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("kbd", null, "drag"), " orbit"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("kbd", null, "scroll"), " zoom"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("kbd", null, "space"), " play")), scan && isFlow && /*#__PURE__*/React.createElement(LightWidget, {
    az: params.lightAz,
    el: params.lightEl
  }), !scan && !loading && /*#__PURE__*/React.createElement(EmptyState, {
    onLoadSample: onLoadSample,
    onLoadFile: onLoadFile,
    dragging: dragging,
    dragHandlers: dragHandlers
  }), loading && /*#__PURE__*/React.createElement(Loading, {
    message: loading.message,
    detail: loading.detail,
    pct: loading.pct
  })), panelsOn && (scan ? /*#__PURE__*/React.createElement(Inspector, {
    params: params,
    set: set,
    open: open,
    toggle: toggle,
    exportState: exportState,
    onExport: onExport,
    onResetTransform: onResetTransform,
    onPlay: onPlay
  }) : /*#__PURE__*/React.createElement("aside", {
    className: "inspector",
    "aria-label": "Controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "insp-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "title"
  }, "Inspector"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Load a scan to enable controls")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "note"
  }, "Once a scan is loaded, every control \u2014 render mode, lens & depth of field, camera motion, transform, export, and diagnostics \u2014 appears here, grouped and labelled in plain language."))))), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Appearance"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Theme",
    value: t.theme,
    options: ['dark', 'light'],
    onChange: v => setTweak('theme', v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Density",
    value: t.density,
    options: ['compact', 'regular', 'roomy'],
    onChange: v => setTweak('density', v)
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Accent",
    value: t.accent,
    options: ['#e8a24c', '#45b3a3', '#5aa0e8', '#b487e8', '#e87f9b'],
    onChange: v => setTweak('accent', v)
  })));
}

/* keyboard: space toggles play */
window.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    const btn = document.querySelector('.stage-tools .seg-btn');
    if (btn) btn.click();
  }
});
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "inkfield/app.jsx", error: String((e && e.message) || e) }); }

// inkfield/glyph-field.js
try { (() => {
/* ============================================================================
   InkField — procedural glyph-field renderer (mockup stand-in for the real
   Gaussian-splat NPR engine). Renders an abstract "scanned bust + table" scene
   as Photo / Glyph / Hatch / Flow so the UI mockup demonstrates each mode and
   the previews mean something. Pure canvas 2D, deterministic, no deps.
   Exposes window.InkRender.
   ============================================================================ */
(function () {
  'use strict';

  // ---- tiny value-noise for organic direction jitter ----------------------
  function hash(x, y) {
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function vnoise(x, y) {
    const xi = Math.floor(x),
      yi = Math.floor(y);
    const xf = x - xi,
      yf = y - yi;
    const tl = hash(xi, yi),
      tr = hash(xi + 1, yi);
    const bl = hash(xi, yi + 1),
      br = hash(xi + 1, yi + 1);
    const u = xf * xf * (3 - 2 * xf),
      v = yf * yf * (3 - 2 * yf);
    return (tl * (1 - u) + tr * u) * (1 - v) + (bl * (1 - u) + br * u) * v;
  }

  // ---- the "scene": abstract bust on a table, sampled per cell -------------
  // Returns {cover 0..1, depth 0..1 (0 near), nx, ny (screen normal), ang (tangent rad)}
  function sampleScene(u, v, t) {
    // u,v in [-1,1], v up. t = orbit phase (radians).
    const ca = Math.cos(t * 0.25),
      sa = Math.sin(t * 0.25);
    // slow horizontal sway to imply orbit
    const ux = u + sa * 0.06;

    // head ellipsoid
    const hx = ux / 0.40,
      hy = (v - 0.18) / 0.50;
    const head = hx * hx + hy * hy; // <1 inside
    // shoulders / torso
    const sx = ux / 0.78,
      sy = (v + 0.78) / 0.42;
    const tors = sx * sx + sy * sy;
    // combine as soft union
    const fHead = Math.max(0, 1 - head);
    const fTors = Math.max(0, 1 - tors);
    let cover = Math.max(fHead, fTors * 0.92);
    if (cover <= 0.001) {
      return {
        cover: 0,
        depth: 1,
        nx: 0,
        ny: 0,
        ang: 0,
        lit: 0
      };
    }

    // pseudo-3D z from the dominant blob (front bulge)
    const z = Math.sqrt(Math.max(0, fHead > fTors ? fHead : fTors));
    const depth = 0.5 - z * 0.42 + (head < tors ? 0 : 0.04) - ca * 0.03; // 0 near .. 1 far

    // screen-space normal from gradient of the field (finite diff-ish, analytic)
    let nx = hx / 0.40 * (fHead > fTors ? 1 : 0.2) + sx / 0.78 * (fTors >= fHead ? 0.7 : 0);
    let ny = hy / 0.50 * (fHead > fTors ? 1 : 0.2) + sy / 0.42 * (fTors >= fHead ? 0.7 : 0);
    const nz = z * 1.6 + 0.3;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;

    // tangent line field: perpendicular to gradient, plus surface swirl + noise
    const grad = Math.atan2(ny, nx);
    const swirl = (vnoise(ux * 2.4 + 10, v * 2.4 - t * 0.15) - 0.5) * 1.4;
    const ang = grad + Math.PI / 2 + swirl * 0.5;
    return {
      cover,
      depth,
      nx,
      ny,
      nz: nz / nl,
      ang,
      lit: 0
    };
  }

  // ground/table shelf behind the bust (adds an edge for flow to ride)
  function sampleTable(u, v) {
    const top = -0.62,
      h = 0.16;
    if (v > top || v < top - h) return 0;
    const fade = 1 - Math.abs(v - (top - h / 2)) / (h / 2);
    return Math.max(0, fade) * (0.5 + 0.5 * (1 - Math.abs(u)));
  }

  // ---- palettes ------------------------------------------------------------
  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function hexToRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function toCss(c, a) {
    return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')';
  }

  // ---- glyph ramps ---------------------------------------------------------
  const RAMP = ' .:-=+oa*#%@';
  const DIR4 = ['-', '\\', '|', '/'];
  const DIR8 = ['-', '`', '\\', '~', '|', '/', '~', ','];
  function dirGlyph(ang, bins) {
    let a = ang % Math.PI;
    if (a < 0) a += Math.PI;
    const set = bins >= 8 ? DIR8 : DIR4;
    const idx = Math.round(a / Math.PI * set.length) % set.length;
    return set[idx];
  }

  // ============================================================================
  // Main render
  // opts: { mode, grid, saturation, accent (hex), light:{az,el}, focus, aperture,
  //         bins, theme:'dark'|'light', t, flowAtlas:'glyph'|'hatch', flowGap,
  //         dof, preview:bool }
  // ============================================================================
  function render(canvas, opts) {
    const o = opts || {};
    const mode = o.mode || 'glyph';
    const theme = o.theme || 'dark';
    const accent = hexToRgb(o.accent || '#e8a24c');
    const sat = o.saturation == null ? 1.15 : o.saturation;
    const bins = o.bins || 4;
    const t = o.t || 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const preview = !!o.preview;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(2, Math.round((rect.width || canvas.width) * dpr));
    const H = Math.max(2, Math.round((rect.height || canvas.height) * dpr));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // background
    const bg = theme === 'light' ? [243, 241, 236] : [18, 20, 24];
    const paper = theme === 'light';
    ctx.fillStyle = toCss(bg);
    ctx.fillRect(0, 0, W, H);
    // vignette
    const g = ctx.createRadialGradient(W * 0.54, H * 0.46, 0, W * 0.54, H * 0.46, Math.max(W, H) * 0.75);
    g.addColorStop(0, paper ? 'rgba(0,0,0,0.0)' : 'rgba(40,44,52,0.30)');
    g.addColorStop(1, paper ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // light direction (screen projection)
    const az = (o.light && o.light.az || 30) * Math.PI / 180;
    const el = (o.light && o.light.el || 40) * Math.PI / 180;
    const lx = Math.cos(el) * Math.cos(az);
    const ly = Math.sin(el);
    const lz = Math.cos(el) * Math.sin(az);
    const focus = o.focus == null ? 0.5 : o.focus; // 0..1 in depth space (mapped)
    const aperture = o.aperture == null ? 4 : o.aperture; // f-number; smaller = shallower
    const dofStrength = o.dof === false ? 0 : Math.max(0, (8 - aperture) / 8); // 0..~0.9

    // grid sizing
    const cols = Math.max(20, Math.round((o.grid || 150) * (preview ? 0.34 : 1)));
    const cellW = W / cols;
    const aspect = mode === 'glyph' ? 1.92 : 1.18; // monospace tall cells for glyph
    const cellH = cellW * aspect;
    const rows = Math.max(8, Math.floor(H / cellH));
    const offY = (H - rows * cellH) / 2;
    const fg = paper ? [26, 24, 20] : [199, 204, 211];
    const baseTint = paper ? [70, 60, 48] : [150, 158, 168];
    if (mode === 'glyph') {
      ctx.font = (cellH * 0.92 | 0) + 'px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }
    ctx.lineCap = 'round';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols * 2 - 1;
        const v = -((r + 0.5) / rows * 2 - 1);
        const px = c * cellW + cellW / 2;
        const py = offY + r * cellH + cellH / 2;
        let s = sampleScene(u, v, t);
        const tbl = sampleTable(u, v);
        let cover = s.cover;
        let depth = s.depth,
          ang = s.ang;
        if (tbl > cover) {
          cover = tbl * 0.8;
          depth = 0.7;
          ang = 0.0 + (vnoise(u * 3, v * 3) - 0.5) * 0.3;
        }
        if (cover < 0.04) continue;

        // lighting (relightable)
        const lambert = Math.max(0, s.nx * lx + s.ny * ly + (s.nz || 0.5) * lz);
        const ambient = 0.32;
        let lit = ambient + (1 - ambient) * lambert;
        lit = Math.min(1, lit * 1.15);

        // tone = how dark/inky this cell is (drives glyph density & reveal)
        let tone = Math.min(1, cover * (0.45 + 0.75 * lit));

        // depth of field: blur factor 0..1
        const coc = Math.min(1, Math.abs(depth - focus) * 2.2 * dofStrength);

        // colour
        let col;
        const warm = mix(baseTint, accent, 0.55);
        const cool = paper ? [120, 110, 96] : [120, 130, 150];
        const hueMix = 0.5 + 0.5 * Math.sin(u * 2.2 + v * 1.5);
        const chroma = mix(cool, warm, hueMix);
        col = mix(paper ? [40, 38, 34] : [120, 128, 140], chroma, Math.min(1, sat * 0.6));
        col = mix(col, accent, Math.min(0.5, sat * 0.18 * lit));
        const lift = paper ? -1 : 1;
        col = [col[0] + lift * lit * 40, col[1] + lift * lit * 40, col[2] + lift * lit * 40];
        if (mode === 'photo') {
          // soft splat blobs
          const rad = cellW * (0.62 + 0.5 * cover) * (1 + coc * 1.8);
          const a = Math.min(0.95, (0.18 + 0.7 * cover) * (1 - coc * 0.45));
          const rg = ctx.createRadialGradient(px, py, 0, px, py, rad);
          rg.addColorStop(0, toCss(col, a));
          rg.addColorStop(1, toCss(col, 0));
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, 7);
          ctx.fill();
          continue;
        }
        if (mode === 'glyph') {
          let ch;
          if (cover < 0.16 || lit < 0.18) ch = RAMP[Math.max(1, Math.round(tone * 4))];else if (coc > 0.5) ch = RAMP[Math.round(tone * (RAMP.length - 1))]; // blurred -> blob ramp
          else ch = dirGlyph(ang, bins);
          ctx.fillStyle = toCss(col, Math.min(1, 0.35 + tone));
          ctx.fillText(ch, px, py);
          continue;
        }

        // hatch + flow: oriented strokes
        const reveal = mode === 'flow' ? (1 - lit) * cover // flow: darkness reveals marks (relightable)
        : tone;
        const tiers = mode === 'flow' ? 3 : 1;
        const gap = mode === 'flow' ? Math.max(1, Math.round((o.flowGap || 18) / cellW)) : 1;
        if (mode === 'flow' && (r % gap !== 0 || (c + r) % gap !== 0)) {
          // sparser stamping for flow look (skip some cells based on gap)
          if (reveal < 0.55) continue;
        }
        const stroke = mode === 'flow' && o.flowAtlas === 'glyph';
        for (let ti = 0; ti < tiers; ti++) {
          const thresh = mode === 'flow' ? 0.18 + ti * 0.26 : 0.12;
          if (reveal < thresh) break;
          const jitter = vnoise(c * 0.7 + ti * 5, r * 0.7) - 0.5;
          const a2 = ang + (mode === 'flow' && ti === 2 ? Math.PI / 2 : 0) + jitter * 0.25; // cross-hatch top tier
          const len = cellW * (mode === 'flow' ? 1.5 : 1.05) * (0.7 + 0.5 * reveal);
          const dx = Math.cos(a2) * len / 2,
            dy = Math.sin(a2) * len / 2;
          ctx.strokeStyle = toCss(col, Math.min(0.95, (0.3 + reveal) * (1 - coc * 0.4)));
          ctx.lineWidth = Math.max(0.6, cellW * (0.12 + 0.05 * reveal) * (1 + coc));
          if (stroke && mode === 'flow') {
            // glyph-atlas flow: little oriented dashes
            ctx.beginPath();
            ctx.moveTo(px - dx * 0.5, py - dy * 0.5);
            ctx.lineTo(px + dx * 0.5, py + dy * 0.5);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(px - dx, py - dy);
            ctx.lineTo(px + dx, py + dy);
            ctx.stroke();
          }
        }
      }
    }

    // focus-plane indicator overlay (optional)
    if (o.showFocusPlane && !preview) {
      const yLine = H * (0.30 + focus * 0.42);
      ctx.strokeStyle = toCss(accent, 0.5);
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([6 * dpr, 6 * dpr]);
      ctx.beginPath();
      ctx.moveTo(0, yLine);
      ctx.lineTo(W, yLine);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // focus peaking overlay
    if (o.showPeaking && !preview) {
      ctx.fillStyle = toCss(accent, 0.9);
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 2) {
          const u = (c + 0.5) / cols * 2 - 1;
          const v = -((r + 0.5) / rows * 2 - 1);
          const s = sampleScene(u, v, t);
          if (s.cover < 0.05) continue;
          if (Math.abs(s.depth - focus) < 0.06) {
            ctx.fillRect(c * cellW, offY + r * cellH, Math.max(1.4, cellW * 0.5), Math.max(1.4, cellH * 0.4));
          }
        }
      }
    }
  }
  window.InkRender = {
    render: render
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "inkfield/glyph-field.js", error: String((e && e.message) || e) }); }

// inkfield/inspector.jsx
try { (() => {
/* InkField redesign — Inspector: all controls reorganized into discoverable,
   plain-language collapsible sections with live state summaries. */

const FSTOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
const FOCALS = [24, 35, 50, 85];
function focusMeters(f) {
  return (0.4 + f * 6).toFixed(1) + 'm';
}
function Inspector({
  params,
  set,
  open,
  toggle,
  exportState,
  onExport,
  onResetTransform,
  onPlay
}) {
  const p = params;
  const isFlow = p.mode === 'flow';
  const stylized = p.mode !== 'photo';
  const summaries = {
    look: p.mode === 'photo' ? 'Raw splats' : isFlow ? `Flow · ${p.flowAtlas} · gap ${p.flowGap}` : `${p.mode} · ${p.field} · detail ${p.grid}`,
    lens: `${p.focal}mm · f/${FSTOPS[p.apertureIdx]} · ${focusMeters(p.focus)}`,
    motion: `${p.path === 'orbit' ? 'Orbit' : 'Dolly'} · ${p.duration}s${p.playing ? ' · playing' : ''}`,
    transform: p.rotX || p.rotY || p.rotZ ? `${p.rotX}° ${p.rotY}° ${p.rotZ}°` : 'Default pose',
    export: `PNG ${p.pngScale}× · SVG · ${p.frames}f`,
    diag: `${p.bins} bins${p.normals ? ' · normals' : ''}${p.tangents ? ' · tangents' : ''}`
  };
  return /*#__PURE__*/React.createElement("aside", {
    className: "inspector",
    "aria-label": "Controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "insp-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "title"
  }, "Inspector"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, p.mode === 'photo' ? 'Photoreal splat view' : `Drawing as ${p.mode} marks`)), /*#__PURE__*/React.createElement(Section, {
    id: "look",
    icon: "look",
    name: "Look",
    summary: summaries.look,
    open: open.look,
    onToggle: toggle
  }, p.mode === 'photo' && /*#__PURE__*/React.createElement("p", {
    className: "note"
  }, "Photo shows the captured Gaussian splats with no stylization. Pick ", /*#__PURE__*/React.createElement("b", null, "Glyph"), ", ", /*#__PURE__*/React.createElement("b", null, "Hatch"), ", or ", /*#__PURE__*/React.createElement("b", null, "Flow"), " in the rail to redraw the scan as marks."), stylized && !isFlow && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Segmented, {
    label: "Stroke source",
    hint: "how mark direction is found",
    value: p.field,
    onChange: v => set({
      field: v
    }),
    options: [{
      value: 'screen',
      label: 'Per-frame'
    }, {
      value: 'surface',
      label: 'Locked to surface'
    }]
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Color",
    hint: "saturation",
    value: p.color,
    min: 0,
    max: 2.5,
    step: 0.05,
    display: p.color.toFixed(2),
    onChange: v => set({
      color: v
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Detail",
    hint: "grid columns",
    value: p.grid,
    min: 90,
    max: 260,
    step: 10,
    display: String(p.grid),
    onChange: v => set({
      grid: v
    })
  })), isFlow && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Segmented, {
    label: "Mark style",
    value: p.flowAtlas,
    onChange: v => set({
      flowAtlas: v
    }),
    options: [{
      value: 'glyph',
      label: 'Glyph',
      glyph: '∿ '
    }, {
      value: 'hatch',
      label: 'Hatch',
      glyph: '╱ '
    }]
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Mark spacing",
    hint: "densest interval",
    value: p.flowGap,
    min: 8,
    max: 48,
    step: 1,
    display: String(p.flowGap) + 'px',
    onChange: v => set({
      flowGap: v
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Light direction",
    hint: "azimuth",
    value: p.lightAz,
    min: 0,
    max: 360,
    step: 5,
    display: p.lightAz + '°',
    onChange: v => set({
      lightAz: v
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Light height",
    hint: "elevation",
    value: p.lightEl,
    min: -90,
    max: 90,
    step: 5,
    display: p.lightEl + '°',
    onChange: v => set({
      lightEl: v
    })
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "Depth of field",
    hint: "defocus far marks",
    checked: p.dof,
    onChange: v => set({
      dof: v
    })
  }))), /*#__PURE__*/React.createElement(Section, {
    id: "lens",
    icon: "lens",
    name: "Lens & Depth",
    summary: summaries.lens,
    open: open.lens,
    onToggle: toggle
  }, /*#__PURE__*/React.createElement(Segmented, {
    label: "Focal length",
    value: p.focal,
    onChange: v => set({
      focal: v
    }),
    options: FOCALS.map(f => ({
      value: f,
      label: f + 'mm'
    }))
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Aperture",
    hint: "depth of field",
    value: p.apertureIdx,
    min: 0,
    max: 7,
    step: 1,
    display: 'f/' + FSTOPS[p.apertureIdx],
    onChange: v => set({
      apertureIdx: v
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Focus distance",
    value: p.focus,
    min: 0,
    max: 1,
    step: 0.01,
    display: focusMeters(p.focus),
    onChange: v => set({
      focus: v
    })
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "Show focus plane",
    checked: p.focusPlane,
    onChange: v => set({
      focusPlane: v
    })
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "Focus peaking",
    hint: "highlight sharp edges",
    checked: p.peaking,
    onChange: v => set({
      peaking: v
    })
  })), /*#__PURE__*/React.createElement(Section, {
    id: "motion",
    icon: "motion",
    name: "Camera Motion",
    summary: summaries.motion,
    open: open.motion,
    onToggle: toggle
  }, /*#__PURE__*/React.createElement(Segmented, {
    label: "Path",
    value: p.path,
    onChange: v => set({
      path: v
    }),
    options: [{
      value: 'orbit',
      label: 'Orbit'
    }, {
      value: 'dolly',
      label: 'Dolly in'
    }]
  }), /*#__PURE__*/React.createElement(Action, {
    label: "Playback",
    hint: p.playing ? 'running' : 'paused'
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    onClick: onPlay
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.playing ? 'pause' : 'play'
  }), " ", p.playing ? 'Pause' : 'Play')), /*#__PURE__*/React.createElement(Slider, {
    label: "Scrub",
    value: p.scrub,
    min: 0,
    max: 1000,
    step: 1,
    display: Math.round(p.scrub / 10) + '%',
    onChange: v => set({
      scrub: v,
      playing: false
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Duration",
    value: p.duration,
    min: 2,
    max: 30,
    step: 1,
    display: p.duration + 's',
    onChange: v => set({
      duration: v
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Speed",
    hint: "rotations / min",
    value: p.rpm,
    min: 1,
    max: 18,
    step: 0.5,
    display: p.rpm + 'rpm',
    onChange: v => set({
      rpm: v
    })
  })), /*#__PURE__*/React.createElement(Section, {
    id: "transform",
    icon: "transform",
    name: "Orient Scan",
    summary: summaries.transform,
    open: open.transform,
    onToggle: toggle
  }, /*#__PURE__*/React.createElement(Slider, {
    label: "Tilt",
    hint: "rot X",
    value: p.rotX,
    min: -180,
    max: 180,
    step: 5,
    display: p.rotX + '°',
    onChange: v => set({
      rotX: v
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Turn",
    hint: "rot Y",
    value: p.rotY,
    min: -180,
    max: 180,
    step: 5,
    display: p.rotY + '°',
    onChange: v => set({
      rotY: v
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Roll",
    hint: "rot Z",
    value: p.rotZ,
    min: -180,
    max: 180,
    step: 5,
    display: p.rotZ + '°',
    onChange: v => set({
      rotZ: v
    })
  }), /*#__PURE__*/React.createElement(Action, {
    label: "Reset orientation"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    onClick: onResetTransform
  }, "Reset"))), /*#__PURE__*/React.createElement(Section, {
    id: "export",
    icon: "export",
    name: "Export",
    summary: summaries.export,
    open: open.export,
    onToggle: toggle
  }, /*#__PURE__*/React.createElement("div", {
    className: "divider-note"
  }, "Still image"), /*#__PURE__*/React.createElement(Action, {
    label: "Save PNG"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    disabled: exportState.busy,
    onClick: () => onExport('png')
  }, exportState.busy === 'png' ? 'Rendering…' : 'Save PNG')), /*#__PURE__*/React.createElement(Slider, {
    label: "Resolution",
    hint: "multiplier",
    value: p.pngScale,
    min: 1,
    max: 4,
    step: 0.5,
    display: p.pngScale + '×',
    onChange: v => set({
      pngScale: v
    })
  }), /*#__PURE__*/React.createElement(Action, {
    label: "Save SVG",
    hint: "vector marks"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    disabled: exportState.busy,
    onClick: () => onExport('svg')
  }, exportState.busy === 'svg' ? 'Saving…' : 'Save SVG')), /*#__PURE__*/React.createElement("div", {
    className: "divider-note"
  }, "Orbit movie"), /*#__PURE__*/React.createElement(Slider, {
    label: "Frames",
    value: p.frames,
    min: 8,
    max: 120,
    step: 1,
    display: String(p.frames),
    onChange: v => set({
      frames: v
    })
  }), /*#__PURE__*/React.createElement(Slider, {
    label: "Frame rate",
    value: p.fps,
    min: 12,
    max: 60,
    step: 1,
    display: p.fps + 'fps',
    onChange: v => set({
      fps: v
    })
  }), /*#__PURE__*/React.createElement(Action, {
    label: "Render frames"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    disabled: exportState.busy,
    onClick: () => onExport('frames')
  }, exportState.busy === 'frames' ? 'Rendering…' : 'Render')), /*#__PURE__*/React.createElement(Action, {
    label: "Save video"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    disabled: exportState.busy,
    onClick: () => onExport('video')
  }, exportState.busy === 'video' ? 'Encoding…' : 'Save video')), /*#__PURE__*/React.createElement("div", {
    className: "progress-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini-progress"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: (exportState.pct || 0) + '%'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "lab mono"
  }, exportState.label || 'Ready'))), /*#__PURE__*/React.createElement(Section, {
    id: "diag",
    icon: "diag",
    name: "Diagnostics",
    summary: summaries.diag,
    open: open.diag,
    onToggle: toggle
  }, /*#__PURE__*/React.createElement(Segmented, {
    label: "Direction bins",
    hint: "orientation quantization",
    value: p.bins,
    onChange: v => set({
      bins: v
    }),
    options: [{
      value: 4,
      label: '4'
    }, {
      value: 8,
      label: '8'
    }],
    disabled: isFlow
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "Normals overlay",
    checked: p.normals,
    disabled: p.field !== 'surface' || isFlow,
    onChange: v => set({
      normals: v
    })
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "Tangents overlay",
    checked: p.tangents,
    disabled: p.field !== 'surface' || isFlow,
    onChange: v => set({
      tangents: v
    })
  }), /*#__PURE__*/React.createElement("dl", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Render"), /*#__PURE__*/React.createElement("dd", null, p.mode === 'photo' ? 'Splat pass · 60fps' : `${p.mode} pass · ${p.field} field · ${p.grid} cols`)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Scene"), /*#__PURE__*/React.createElement("dd", null, exportState.scene || 'sample.spz · 1.04M splats · surface baked')))));
}
Object.assign(window, {
  Inspector,
  FSTOPS,
  FOCALS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "inkfield/inspector.jsx", error: String((e && e.message) || e) }); }

// inkfield/panels.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* InkField redesign — panels: TopBar, ModeRail, EmptyState, Loading, LightWidget */

const MODES = [{
  value: 'photo',
  name: 'Photo',
  glyph: '◍',
  desc: 'Raw Gaussian splats — the untouched scan.'
}, {
  value: 'glyph',
  name: 'Glyph',
  glyph: '@',
  desc: 'Structure-aware characters per cell.'
}, {
  value: 'hatch',
  name: 'Hatch',
  glyph: '╱',
  desc: 'Pen hatching along the orientation field.'
}, {
  value: 'flow',
  name: 'Flow',
  glyph: '∿',
  desc: 'Streamlines that ride the surface.'
}];
function ModePreview({
  mode,
  params,
  theme,
  accent
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.InkRender) {
      window.InkRender.render(ref.current, {
        mode,
        preview: true,
        theme,
        accent,
        saturation: params.color,
        grid: 150,
        light: {
          az: params.lightAz,
          el: params.lightEl
        },
        flowAtlas: params.flowAtlas,
        flowGap: params.flowGap,
        bins: params.bins,
        focus: params.focus,
        aperture: 16,
        dof: false,
        t: 0.6
      });
    }
  }, [mode, theme, accent, params.color, params.lightAz, params.lightEl, params.flowAtlas, params.bins]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    className: "thumb"
  });
}
function ModeRail({
  mode,
  onMode,
  loaded,
  flowAvailable,
  params,
  theme,
  accent
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "rail",
    "aria-label": "Render mode"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rail-title"
  }, "Render mode"), MODES.map(m => /*#__PURE__*/React.createElement("button", {
    key: m.value,
    className: "mode-tile",
    "aria-pressed": mode === m.value,
    disabled: !loaded || m.value === 'flow' && !flowAvailable,
    onClick: () => onMode(m.value)
  }, m.value === 'flow' && flowAvailable && mode !== 'flow' && /*#__PURE__*/React.createElement("span", {
    className: "mode-badge"
  }, "relight"), loaded ? /*#__PURE__*/React.createElement(ModePreview, {
    mode: m.value,
    params: params,
    theme: theme,
    accent: accent
  }) : /*#__PURE__*/React.createElement("span", {
    className: "thumb"
  }), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "name"
  }, /*#__PURE__*/React.createElement("span", {
    className: "glyph"
  }, m.glyph), m.name), /*#__PURE__*/React.createElement("span", {
    className: "desc"
  }, m.desc)))));
}
function TopBar({
  scan,
  onLoadSample,
  onLoadFile,
  panelsOn,
  onTogglePanels
}) {
  const fileRef = useRef(null);
  return /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow mono"
  }, "Inkfield"), /*#__PURE__*/React.createElement("span", {
    className: "wordmark"
  }, "Algorithmic Splat Studio")), /*#__PURE__*/React.createElement("div", {
    className: "topbar-spacer"
  }), scan && /*#__PURE__*/React.createElement("span", {
    className: "scan-chip"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fmt"
  }, scan.fmt), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, scan.name), " \xB7 ", scan.splats)), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    onClick: onTogglePanels
  }, panelsOn ? 'Hide panels' : 'Show panels'), /*#__PURE__*/React.createElement("button", {
    className: "btn dashed sm",
    onClick: () => fileRef.current && fileRef.current.click()
  }, "Open file\u2026"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".ply,.spz,.splat,.ksplat,.sog",
    style: {
      display: 'none'
    },
    onChange: e => {
      if (e.target.files[0]) onLoadFile(e.target.files[0]);
      e.target.value = '';
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: onLoadSample
  }, "Load sample"));
}
const EMPTY_ART = `        . :-=+++=-:.
     .-=+oa**aoo+=-:.
   .:+a*#%%@@%%#*ao=:.
  .=o*#%@@@@@@@@%#*o=.
  -+a#%@@@@@@@@@@%#a+-
  -+a#%@@@@@@@@@@%#a+-
   :=o*#%@@@@@@%#*o=:
     .-=+oa**aao+=-.
   .-==+++oooo++++==-.
 .=+oooooooooooooooo+=.`;
function EmptyState({
  onLoadSample,
  onLoadFile,
  dragging,
  dragHandlers
}) {
  const fileRef = useRef(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement("div", _extends({
    className: 'empty-card' + (dragging ? ' drag' : '')
  }, dragHandlers), /*#__PURE__*/React.createElement("pre", {
    className: "empty-art"
  }, EMPTY_ART), /*#__PURE__*/React.createElement("h2", null, "Load a scan to begin"), /*#__PURE__*/React.createElement("p", null, "Inkfield reads a Gaussian-splat capture and re-draws it as fields of glyphs, hatch strokes, and surface-riding marks. Start with the bundled sample, or drop your own scan anywhere on the canvas."), /*#__PURE__*/React.createElement("div", {
    className: "empty-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onLoadSample
  }, "Load sample scene"), /*#__PURE__*/React.createElement("button", {
    className: "btn dashed",
    onClick: () => fileRef.current && fileRef.current.click()
  }, "Browse files\u2026"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".ply,.spz,.splat,.ksplat,.sog",
    style: {
      display: 'none'
    },
    onChange: e => {
      if (e.target.files[0]) onLoadFile(e.target.files[0]);
      e.target.value = '';
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "empty-formats"
  }, ".ply \xB7 .spz \xB7 .splat \xB7 .ksplat \xB7 .sog")));
}
function Loading({
  message,
  detail,
  pct
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "loading",
    role: "status",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "msg"
  }, message, " ", detail && /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, detail)), /*#__PURE__*/React.createElement("div", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: (pct == null ? 30 : pct) + '%'
    }
  })));
}
function LightWidget({
  az,
  el
}) {
  const a = (az - 90) * Math.PI / 180;
  const r = 30 + el / 90 * 8;
  const x = 50 + Math.cos(a) * r;
  const y = 50 + Math.sin(a) * r;
  const deg = az;
  return /*#__PURE__*/React.createElement("div", {
    className: "light-widget",
    title: `Light ${az}° / ${el}°`
  }, /*#__PURE__*/React.createElement("span", {
    className: "hub"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ray",
    style: {
      width: r + '%',
      transform: `rotate(${deg - 90}deg)`
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      left: x + '%',
      top: y + '%'
    }
  }));
}
Object.assign(window, {
  MODES,
  ModeRail,
  TopBar,
  EmptyState,
  Loading,
  LightWidget
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "inkfield/panels.jsx", error: String((e && e.message) || e) }); }

// inkfield/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "inkfield/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// inkfield/ui.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* InkField redesign — UI primitives (React, Babel). Assigns to window. */
const {
  useState,
  useRef,
  useEffect,
  useCallback
} = React;

/* simple geometric icons only (circles/lines/squares/diamonds) */
function Icon({
  name
}) {
  const s = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  switch (name) {
    case 'look':
      return /*#__PURE__*/React.createElement("svg", s, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "8"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "2.4",
        fill: "currentColor",
        stroke: "none"
      }));
    case 'lens':
      return /*#__PURE__*/React.createElement("svg", s, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "8"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "4"
      }));
    case 'motion':
      return /*#__PURE__*/React.createElement("svg", s, /*#__PURE__*/React.createElement("ellipse", {
        cx: "12",
        cy: "12",
        rx: "9",
        ry: "4.5"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "7.5",
        r: "1.6",
        fill: "currentColor",
        stroke: "none"
      }));
    case 'transform':
      return /*#__PURE__*/React.createElement("svg", s, /*#__PURE__*/React.createElement("rect", {
        x: "4.5",
        y: "4.5",
        width: "15",
        height: "15",
        rx: "1.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M9 4.5v15M4.5 9h15"
      }));
    case 'export':
      return /*#__PURE__*/React.createElement("svg", s, /*#__PURE__*/React.createElement("path", {
        d: "M12 15V4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M8 8l4-4 4 4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M5 15v4h14v-4"
      }));
    case 'diag':
      return /*#__PURE__*/React.createElement("svg", s, /*#__PURE__*/React.createElement("path", {
        d: "M4 18V9M9 18V5M14 18v-6M19 18v-9"
      }));
    case 'play':
      return /*#__PURE__*/React.createElement("svg", _extends({}, s, {
        fill: "currentColor",
        stroke: "none"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M8 6.5v11l9-5.5z"
      }));
    case 'pause':
      return /*#__PURE__*/React.createElement("svg", _extends({}, s, {
        fill: "currentColor",
        stroke: "none"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "7.5",
        y: "6.5",
        width: "3",
        height: "11",
        rx: "0.8"
      }), /*#__PURE__*/React.createElement("rect", {
        x: "13.5",
        y: "6.5",
        width: "3",
        height: "11",
        rx: "0.8"
      }));
    case 'chev':
      return /*#__PURE__*/React.createElement("svg", s, /*#__PURE__*/React.createElement("path", {
        d: "M9 6l6 6-6 6"
      }));
    default:
      return null;
  }
}
function Section({
  id,
  icon,
  name,
  summary,
  open,
  onToggle,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "section",
    "data-open": open ? 'true' : 'false'
  }, /*#__PURE__*/React.createElement("button", {
    className: "section-head",
    onClick: () => onToggle(id),
    "aria-expanded": open
  }, /*#__PURE__*/React.createElement("span", {
    className: "ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon
  })), /*#__PURE__*/React.createElement("span", {
    className: "grow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "name"
  }, name), /*#__PURE__*/React.createElement("span", {
    className: "summary mono"
  }, summary)), /*#__PURE__*/React.createElement("span", {
    className: "chev"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chev"
  }))), open && /*#__PURE__*/React.createElement("div", {
    className: "section-body"
  }, children));
}
function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  display,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row-label"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, label, hint && /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, hint)), /*#__PURE__*/React.createElement("span", {
    className: "val mono"
  }, display)), /*#__PURE__*/React.createElement("input", {
    className: "slider",
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function Segmented({
  label,
  hint,
  options,
  value,
  onChange,
  disabled
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, label && /*#__PURE__*/React.createElement("div", {
    className: "row-label"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, label, hint && /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, hint))), /*#__PURE__*/React.createElement("div", {
    className: "seg",
    role: "group"
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    "aria-pressed": value === o.value,
    disabled: disabled || o.disabled,
    onClick: () => onChange(o.value)
  }, o.glyph && /*#__PURE__*/React.createElement("span", {
    className: "g"
  }, o.glyph), o.label))));
}
function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "toggle"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, label, hint && /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, hint)), /*#__PURE__*/React.createElement("span", {
    className: "switch"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", {
    className: "track"
  }), /*#__PURE__*/React.createElement("span", {
    className: "knob"
  })));
}
function Action({
  label,
  hint,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "action"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, label, hint && /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, hint)), /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(window, {
  Icon,
  Section,
  Slider,
  Segmented,
  Toggle,
  Action
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "inkfield/ui.jsx", error: String((e && e.message) || e) }); }

// ui_kits/inkfield/App.jsx
try { (() => {
/* Inkfield UI kit — app shell. State + layout + status copy. */
const {
  useState: useStateApp,
  useMemo: useMemoApp,
  useCallback: useCallbackApp
} = React;
function App() {
  const [state, setState] = useStateApp({
    mode: 'glyph',
    columns: 180,
    saturation: 1.15,
    bins: 4,
    orientation: 'auto',
    overlays: {
      normal: false,
      tangent: false
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    },
    live: null
  });
  const [collapsed, setCollapsed] = useStateApp(false);
  const [scene, setScene] = useStateApp('sample.spz loaded');
  const [loading, setLoading] = useStateApp(false);
  const set = useCallbackApp(patch => setState(s => ({
    ...s,
    ...patch
  })), []);

  // approximate live cell count for the readout (mirrors product copy)
  const cells = useMemoApp(() => {
    const w = window.innerWidth,
      h = window.innerHeight;
    const cell = w / state.columns;
    return state.columns * Math.max(1, Math.floor(h / cell));
  }, [state.columns]);
  const status = useMemoApp(() => {
    let render;
    if (state.mode === 'photo') render = 'Photorealistic Spark';else {
      const label = state.mode === 'hatch' ? 'Hatch' : 'Glyph';
      render = `${label} (${cells.toLocaleString()} cells, ${state.saturation.toFixed(2)}x color)`;
    }
    const ov = [];
    if (state.mode !== 'photo') {
      if (state.overlays.normal) ov.push('\u22a5 normal');
      if (state.overlays.tangent) ov.push('\u2016 tangent');
    }
    const src = state.orientation.charAt(0).toUpperCase() + state.orientation.slice(1);
    const field = state.mode === 'photo' ? '\u2014' : `${src} source${ov.length ? ' \u00b7 ' + ov.join(' \u00b7 ') : ''}`;
    return {
      render,
      scene,
      field
    };
  }, [state.mode, state.saturation, state.orientation, state.overlays, cells, scene]);
  const onLoadSample = useCallbackApp(() => {
    setLoading(true);
    setScene('Starting orientation pass…');
    setTimeout(() => {
      setLoading(false);
      setScene('sample.spz loaded');
    }, 900);
  }, []);
  const onReset = useCallbackApp(() => {
    set({
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      live: null
    });
  }, [set]);
  return /*#__PURE__*/React.createElement("main", {
    className: "if-app"
  }, /*#__PURE__*/React.createElement(GlyphField, {
    mode: state.mode,
    columns: state.columns,
    saturation: state.saturation,
    rotation: state.rotation,
    onOrbit: () => {}
  }), /*#__PURE__*/React.createElement(ControlRail, {
    state: state,
    set: set,
    status: status,
    onLoadSample: onLoadSample,
    onReset: onReset,
    collapsed: collapsed,
    onToggle: () => setCollapsed(c => !c)
  }), loading && /*#__PURE__*/React.createElement(GlyphSpinner, null), /*#__PURE__*/React.createElement("div", {
    className: "if-hint"
  }, "drag the canvas to orbit \xB7 or use Rot X / Y / Z"));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/inkfield/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/inkfield/components/ControlRail.jsx
try { (() => {
/* Inkfield UI kit — the floating control rail (collapsible). */
const {
  useState: useStateCR
} = React;
function ControlRail({
  state,
  set,
  status,
  onLoadSample,
  onReset,
  collapsed,
  onToggle
}) {
  if (collapsed) {
    return /*#__PURE__*/React.createElement("button", {
      className: "if-rail-tab",
      onClick: onToggle,
      "aria-label": "Show controls"
    }, /*#__PURE__*/React.createElement("span", {
      className: "if-tab-glyphs"
    }, "- / | \\"), /*#__PURE__*/React.createElement("span", {
      className: "if-tab-label"
    }, "Controls"));
  }
  const overlaysAvailable = state.mode !== 'photo';
  return /*#__PURE__*/React.createElement("section", {
    className: "if-rail",
    "aria-label": "Splat controls"
  }, /*#__PURE__*/React.createElement("header", {
    className: "if-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "if-brand-row"
  }, /*#__PURE__*/React.createElement("p", {
    className: "if-eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "if-brand-mark",
    "aria-hidden": "true"
  }, "@"), " InkField"), /*#__PURE__*/React.createElement("button", {
    className: "if-collapse",
    onClick: onToggle,
    "aria-label": "Collapse panel"
  }, "\xD7")), /*#__PURE__*/React.createElement("h1", {
    className: "if-title"
  }, "Structure-driven splat renderer"), /*#__PURE__*/React.createElement("div", {
    className: "if-tickstrip",
    "aria-hidden": "true"
  })), /*#__PURE__*/React.createElement("div", {
    className: "if-actions"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: onLoadSample
  }, "Load sample"), /*#__PURE__*/React.createElement(Button, {
    variant: "file",
    as: "label"
  }, "Load local scan", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".ply,.spz,.splat,.ksplat,.sog",
    style: {
      display: 'none'
    },
    onChange: onLoadSample
  }))), /*#__PURE__*/React.createElement("div", {
    className: "if-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "if-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "if-lab"
  }, "Mode"), /*#__PURE__*/React.createElement(Segmented, {
    ariaLabel: "Render mode",
    options: [{
      value: 'photo',
      label: 'Photo'
    }, {
      value: 'glyph',
      label: 'Glyph'
    }, {
      value: 'hatch',
      label: 'Hatch'
    }],
    value: state.mode,
    onChange: v => set({
      mode: v
    })
  })), /*#__PURE__*/React.createElement(RulerSlider, {
    label: "Color",
    min: 0,
    max: 2.5,
    step: 0.05,
    value: state.saturation,
    active: state.live === 'saturation',
    onChange: v => set({
      saturation: v,
      live: 'saturation'
    }),
    format: v => v.toFixed(2),
    ticks: 20
  }), /*#__PURE__*/React.createElement(RulerSlider, {
    label: "Grid",
    min: 90,
    max: 260,
    step: 10,
    value: state.columns,
    active: state.live === 'columns',
    onChange: v => set({
      columns: v,
      live: 'columns'
    }),
    ticks: 17
  }), /*#__PURE__*/React.createElement("div", {
    className: "if-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "if-lab"
  }, "Bins"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 150
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    ariaLabel: "Direction bins",
    options: [{
      value: 4,
      label: '4'
    }, {
      value: 8,
      label: '8'
    }],
    value: state.bins,
    onChange: v => set({
      bins: v
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "if-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "if-lab"
  }, "Source"), /*#__PURE__*/React.createElement(Segmented, {
    ariaLabel: "Orientation source",
    options: [{
      value: 'auto',
      label: 'Auto'
    }, {
      value: 'normal',
      label: 'Normal'
    }, {
      value: 'tangent',
      label: 'Tangent'
    }],
    value: state.orientation,
    onChange: v => set({
      orientation: v
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "if-overlays"
  }, /*#__PURE__*/React.createElement(GlyphRule, {
    label: "Overlays"
  }), /*#__PURE__*/React.createElement(Toggle, {
    glyph: '\u22a5',
    label: "Normal",
    available: overlaysAvailable,
    checked: overlaysAvailable && state.overlays.normal,
    onChange: v => set({
      overlays: {
        ...state.overlays,
        normal: v
      }
    })
  }), /*#__PURE__*/React.createElement(Toggle, {
    glyph: '\u2016',
    label: "Tangent",
    available: overlaysAvailable,
    checked: overlaysAvailable && state.overlays.tangent,
    onChange: v => set({
      overlays: {
        ...state.overlays,
        tangent: v
      }
    })
  }), !overlaysAvailable && /*#__PURE__*/React.createElement("p", {
    className: "if-overlays-note"
  }, "overlays available in glyph / hatch")), /*#__PURE__*/React.createElement("div", {
    className: "if-transform"
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "mini",
      onClick: onReset
    }, "Reset")
  }, "Transform"), ['x', 'y', 'z'].map(axis => /*#__PURE__*/React.createElement(RulerSlider, {
    key: axis,
    label: `Rot ${axis.toUpperCase()}`,
    min: -180,
    max: 180,
    step: 5,
    value: state.rotation[axis],
    active: state.live === 'rot' + axis,
    onChange: v => set({
      rotation: {
        ...state.rotation,
        [axis]: v
      },
      live: 'rot' + axis
    }),
    format: v => `${Math.round(v)}deg`,
    ticks: 12
  }))), /*#__PURE__*/React.createElement(Readout, {
    items: [{
      label: 'Render',
      value: status.render
    }, {
      label: 'Field',
      value: status.field
    }, {
      label: 'Scene',
      value: status.scene,
      dot: true
    }]
  }));
}
window.ControlRail = ControlRail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/inkfield/components/ControlRail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/inkfield/components/Controls.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Inkfield UI kit — control primitives.
   Mono, grayscale, one amber signal. Exports to window for cross-file use. */
const {
  useRef,
  useState,
  useEffect,
  useCallback
} = React;

/* Primary / secondary / file / mini buttons -------------------------------- */
function Button({
  variant = 'primary',
  children,
  onClick,
  as = 'button',
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `if-btn if-btn--${variant}`,
    onClick: onClick
  }, rest), children);
}

/* Segmented control (mode / bins) ----------------------------------------- */
function Segmented({
  options,
  value,
  onChange,
  ariaLabel
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "if-seg",
    role: "radiogroup",
    "aria-label": ariaLabel
  }, options.map(opt => {
    const v = typeof opt === 'object' ? opt.value : opt;
    const label = typeof opt === 'object' ? opt.label : opt;
    const on = v === value;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "radio",
      "aria-checked": on,
      className: `if-seg__opt${on ? ' is-on' : ''}`,
      onClick: () => onChange(v)
    }, label);
  }));
}

/* Ruler slider — the signature flourish. Real range behaviour + tick marks. */
function RulerSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
  ticks = 16,
  active
}) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const pct = (value - min) / (max - min);
  const setFromClientX = useCallback(clientX => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let p = (clientX - r.left) / r.width;
    p = Math.min(1, Math.max(0, p));
    let raw = min + p * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Math.min(max, Math.max(min, snapped)));
  }, [min, max, step, onChange]);
  useEffect(() => {
    if (!drag) return;
    const move = e => setFromClientX(e.touches ? e.touches[0].clientX : e.clientX);
    const up = () => setDrag(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, {
      passive: false
    });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [drag, setFromClientX]);
  const tickEls = [];
  for (let i = 0; i <= ticks; i++) {
    tickEls.push(/*#__PURE__*/React.createElement("span", {
      key: i,
      className: `if-tick${i % 4 === 0 ? ' is-maj' : ''}`
    }));
  }
  const display = format ? format(value) : String(value);
  return /*#__PURE__*/React.createElement("div", {
    className: "if-row if-row--range"
  }, /*#__PURE__*/React.createElement("span", {
    className: `if-lab${active ? ' is-active' : ''}`
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "if-ruler",
    onMouseDown: e => {
      setDrag(true);
      setFromClientX(e.clientX);
    },
    onTouchStart: e => {
      setDrag(true);
      setFromClientX(e.touches[0].clientX);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "if-ticks"
  }, tickEls), /*#__PURE__*/React.createElement("div", {
    className: "if-track",
    ref: trackRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "if-fill",
    style: {
      width: `${pct * 100}%`
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: `if-thumb${drag ? ' is-drag' : ''}`,
    style: {
      left: `${pct * 100}%`
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "if-val tnum"
  }, display));
}

/* Toggle / switch (v2) — overlay switches with a glyph indicator ----------- */
function Toggle({
  glyph,
  label,
  checked,
  onChange,
  available = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "if-toggle",
    role: "switch",
    "aria-checked": checked,
    "aria-disabled": !available,
    tabIndex: available ? 0 : -1,
    onClick: () => available && onChange(!checked),
    onKeyDown: e => {
      if (!available) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onChange(!checked);
      }
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "if-toggle__glyph",
    "aria-hidden": "true"
  }, glyph), /*#__PURE__*/React.createElement("span", {
    className: "if-toggle__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "if-toggle__track"
  }));
}

/* Glyph rule divider (v2) — a box-drawing section seam with optional label -- */
function GlyphRule({
  label,
  cap = '\u251c'
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "if-rule",
    role: "separator",
    "aria-label": label || 'divider'
  }, /*#__PURE__*/React.createElement("span", {
    className: "if-rule__cap",
    "aria-hidden": "true"
  }, cap), label && /*#__PURE__*/React.createElement("span", {
    className: "if-rule__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "if-rule__fill"
  }));
}

/* Section heading with optional action ------------------------------------ */
function SectionHeading({
  children,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "if-section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "if-lab"
  }, children), action);
}

/* Status readout ----------------------------------------------------------- */
function Readout({
  items
}) {
  return /*#__PURE__*/React.createElement("dl", {
    className: "if-readout"
  }, items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.label,
    className: "if-ro"
  }, /*#__PURE__*/React.createElement("dt", null, it.label), /*#__PURE__*/React.createElement("dd", null, it.dot && /*#__PURE__*/React.createElement("span", {
    className: "if-dot"
  }), it.value))));
}

/* Glyph spinner (v2) — a mechanical loading mark cycling the dir-4 alphabet.
   Respects reduced-motion (holds a static frame). Overlays the canvas. */
function GlyphSpinner({
  label = 'Starting orientation pass'
}) {
  const frames = ['-', '\\', '|', '/'];
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => setI(n => (n + 1) % frames.length), 110);
    return () => clearInterval(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "if-loading",
    role: "status",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "if-loading__field",
    "aria-hidden": "true"
  }, '. : - = + * # % @'), /*#__PURE__*/React.createElement("div", {
    className: "if-loading__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "if-spin"
  }, frames[i]), /*#__PURE__*/React.createElement("span", {
    className: "if-loading__label"
  }, label + '\u2026')));
}
Object.assign(window, {
  Button,
  Segmented,
  Toggle,
  GlyphRule,
  RulerSlider,
  SectionHeading,
  Readout,
  GlyphSpinner
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/inkfield/components/Controls.jsx", error: String((e && e.message) || e) }); }

// ui_kits/inkfield/components/GlyphField.jsx
try { (() => {
/* Inkfield UI kit — the live glyph-field canvas.
   Not the real Spark pipeline: a faithful stand-in that renders a structured
   flow field as photo splats / direction glyphs / pen hatching, driven live by
   the controls. The canvas owns all the color & texture; the chrome stays gray. */
const {
  useRef: useRefGF,
  useEffect: useEffectGF,
  useState: useStateGF,
  useCallback: useCallbackGF
} = React;
const DIR4 = ['-', '/', '|', '\\'];
const BLOB = ['.', 'o', '@'];
function GlyphField({
  mode,
  columns,
  saturation,
  rotation,
  onOrbit
}) {
  const canvasRef = useRefGF(null);
  const wrapRef = useRefGF(null);
  const [orbit, setOrbit] = useStateGF({
    x: 0,
    y: 0
  });
  const dragRef = useRefGF(null);
  const rafRef = useRefGF(0);
  const stateRef = useRefGF({});
  stateRef.current = {
    mode,
    columns,
    saturation,
    rotation,
    orbit
  };

  // Scalar field: a blobby subject (a couple of lobes) sitting on a ground plane.
  // Returns { cov, ang, hue } for a normalised coordinate.
  const sample = useCallbackGF((nx, ny, rot) => {
    // apply in-plane Z rotation
    const cz = Math.cos(rot.z),
      sz = Math.sin(rot.z);
    let x = nx * cz - ny * sz;
    let y = nx * sz + ny * cz;
    // orbit (Y/X) skews the apparent form
    x += rot.y * 0.55;
    y += rot.x * 0.4;

    // subject: a body lobe + a smaller upper lobe, centred in the open canvas
    // (right of the rail). Bounded — no rectangular ground plane.
    const cxs = 0.26;
    const body = Math.exp(-((x - cxs) ** 2 * 5.6 + (y + 0.02) ** 2 * 6.8));
    const head = Math.exp(-((x - cxs - 0.16) ** 2 * 11.0 + (y + 0.24) ** 2 * 13.0));
    const subject = body * 1.0 + head * 0.6;
    // a tight, bounded fringe so the silhouette gets a directional edge
    const fringe = 0.085 * Math.exp(-((x - cxs) ** 2 * 3.6 + y ** 2 * 4.0));
    let cov = subject + fringe;
    cov = Math.min(1, Math.max(0, cov));

    // orientation: tangent to the body gradient (flow along the surface) + swirl
    const eps = 0.012;
    const g = (px, py) => Math.exp(-((px - cxs) ** 2 * 4.2 + (py + 0.02) ** 2 * 5.4));
    const fx = g(x + eps, y) - g(x - eps, y);
    const fy = g(x, y + eps) - g(x, y - eps);
    const ang = Math.atan2(fy, fx) + Math.PI / 2 + Math.sin(y * 5.5 + rot.y * 2) * 0.45 + Math.cos(x * 4 + rot.x) * 0.2;

    // INTRINSIC SURFACE COLOR — belongs to the splat, not the UI. Keyed to the
    // object's (rotated) surface coords so the color stays put as you orbit,
    // exactly like real per-cell average splat color. The UI never tints this;
    // the Color control only scales its saturation (0 = grayscale).
    const n1 = Math.sin(x * 2.6 + y * 1.3) * 0.5 + 0.5;
    const n2 = Math.sin(x * -1.9 + y * 3.4 + 2.1) * 0.5 + 0.5;
    const n3 = Math.sin(x * 5.2 - y * 4.7) * 0.5 + 0.5;
    const region = n1 * 0.55 + n2 * 0.33 + n3 * 0.12;
    const hue = 134 - region * 116; // foliage green → tan → terracotta
    const baseSat = 26 + region * 30; // the scan's own chroma, 26–56%
    return {
      cov,
      ang,
      hue,
      baseSat
    };
  }, []);
  const render = useCallbackGF(() => {
    const canvas = canvasRef.current,
      wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = wrap.clientWidth,
      H = wrap.clientHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const st = stateRef.current;
    const cols = st.columns;
    const cell = W / cols;
    const rows = Math.max(1, Math.floor(H / cell));
    const rot = {
      x: st.rotation.x * Math.PI / 180 + st.orbit.x,
      y: st.rotation.y * Math.PI / 180 + st.orbit.y,
      z: st.rotation.z * Math.PI / 180
    };
    const sat = st.saturation;
    const fontPx = Math.max(5, cell * 1.5);
    ctx.font = `${fontPx}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineCap = 'round';
    const aspect = H / W;
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const nx = (gx / cols - 0.5) * 2;
        const ny = (gy / rows - 0.5) * 2 * aspect;
        const {
          cov,
          ang,
          hue,
          baseSat
        } = sample(nx, ny, rot);
        if (cov < 0.14) continue;
        const px = gx * cell + cell / 2;
        const py = gy * cell + cell / 2;
        const light = 40 + cov * 32;
        // the scan's own chroma, scaled by the Color (saturation) control
        const chroma = Math.min(82, baseSat * (sat / 1.15));
        const col = `hsl(${hue} ${chroma}% ${light}%)`;
        if (st.mode === 'photo') {
          ctx.fillStyle = `hsla(${hue} ${chroma}% ${light}% / ${0.45 + cov * 0.5})`;
          ctx.fillRect(px - cell / 2, py - cell / 2, cell + 0.6, cell + 0.6);
        } else if (st.mode === 'hatch') {
          // pen hatching — short strokes oriented by the field
          const len = cell * (0.7 + cov * 0.8);
          ctx.strokeStyle = col;
          ctx.lineWidth = Math.max(0.6, cell * 0.16);
          ctx.globalAlpha = 0.5 + cov * 0.5;
          ctx.beginPath();
          ctx.moveTo(px - Math.cos(ang) * len / 2, py - Math.sin(ang) * len / 2);
          ctx.lineTo(px + Math.cos(ang) * len / 2, py + Math.sin(ang) * len / 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else {
          // glyph mode: choose blob or direction glyph
          let g;
          if (cov < 0.34) g = BLOB[0];else if (cov > 0.94) g = BLOB[2];else {
            let a = (ang % Math.PI + Math.PI) % Math.PI;
            g = DIR4[Math.round(a / (Math.PI / 4)) % 4];
          }
          ctx.fillStyle = col;
          ctx.globalAlpha = 0.55 + cov * 0.45;
          ctx.fillText(g, px, py);
          ctx.globalAlpha = 1;
        }
      }
    }
  }, [sample]);

  // re-render on any prop/orbit change — draw synchronously, then once more
  // next frame in case fonts/layout are still settling.
  useEffectGF(() => {
    render();
    const id = requestAnimationFrame(render);
    return () => cancelAnimationFrame(id);
  }, [mode, columns, saturation, rotation, orbit, render]);

  // resize — window + a ResizeObserver on the stage (also fires on first layout)
  useEffectGF(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    let ro;
    if (wrapRef.current && window.ResizeObserver) {
      ro = new ResizeObserver(() => render());
      ro.observe(wrapRef.current);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, [render]);

  // drag to orbit
  useEffectGF(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const down = e => {
      const p = e.touches ? e.touches[0] : e;
      dragRef.current = {
        x: p.clientX,
        y: p.clientY,
        ox: stateRef.current.orbit.x,
        oy: stateRef.current.orbit.y
      };
    };
    const move = e => {
      if (!dragRef.current) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = (p.clientX - dragRef.current.x) / 240;
      const dy = (p.clientY - dragRef.current.y) / 240;
      setOrbit({
        x: dragRef.current.oy + dy,
        y: dragRef.current.ox + dx
      });
      if (onOrbit) onOrbit();
    };
    const up = () => {
      dragRef.current = null;
    };
    wrap.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    wrap.addEventListener('touchstart', down, {
      passive: true
    });
    window.addEventListener('touchmove', move, {
      passive: true
    });
    window.addEventListener('touchend', up);
    return () => {
      wrap.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      wrap.removeEventListener('touchstart', down);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [onOrbit]);
  const cellCount = columns * Math.max(1, Math.floor((wrapRef.current?.clientHeight || 600) / ((wrapRef.current?.clientWidth || 1000) / columns)));
  return /*#__PURE__*/React.createElement("div", {
    className: "if-stage",
    ref: wrapRef
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    className: "if-canvas",
    "aria-label": "InkField glyph viewport"
  }), /*#__PURE__*/React.createElement("div", {
    className: "if-reg if-reg--tl"
  }), /*#__PURE__*/React.createElement("div", {
    className: "if-reg if-reg--tr"
  }), /*#__PURE__*/React.createElement("div", {
    className: "if-reg if-reg--bl"
  }), /*#__PURE__*/React.createElement("div", {
    className: "if-reg if-reg--br"
  }));
}
window.GlyphField = GlyphField;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/inkfield/components/GlyphField.jsx", error: String((e && e.message) || e) }); }

})();
