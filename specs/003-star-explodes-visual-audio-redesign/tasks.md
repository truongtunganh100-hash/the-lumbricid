# Implementation Tasks: 1 Mins Mode Visual & Audio Redesign

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  
**Status**: Completed  

---

- [x] **Task 1: Integrate authentic video soundtrack into 1 Mins Mode**
  - **Action**:
    - Ensure `public/audio/how_a_star_explodes.mp3` is tracked in git.
    - Implement `getOneMinAudio()` in `public/index.html`.
    - In `startOneMinMode()`: Cue audio at 0.0s, start playing when 5s countdown completes.
    - In `updateOneMinMode(dt)`: Synchronize `oneMinPlayTime = oneMinAudio.currentTime`.
    - Handle pause/resume in `togglePause()` without playing conflicting default background music.
    - Keep `oneMinSynth` as automatic fallback if audio playback encounters issues.
  - **Verification**: Audio plays in sync with gameplay, pauses and resumes accurately.

- [x] **Task 2: Redesign Arena Visuals to mirror the Observatory Console & Evolving Star**
  - **Action**:
    - Update `drawOneMinWorld(targetCtx)` in `public/index.html`:
      1. Observatory space background with subtle sci-fi coordinate grid and HUD reticle.
      2. Concentric Evolving Giant Star at arena center with 7 element fusion shells (`Fe`, `Si`, `O`, `Ne`, `C`, `He`, `H`).
      3. Stage 8 Chandrasekhar Limit warning trembling & critical mass warning telemetry.
      4. Stage 9 Core Collapse at 70,000 km/s with inward gravitational suction streaks.
      5. Stage 10 Supernova Remnant Nebula with expanding `t^(2/5)` cosmic blast shockwave and central pulsar.
      6. Real-time dynamic cathode-ray Oscilloscope wave line plotting mathematical waveforms with moving scanning probe bead.
      7. 10 LED Stage Status Indicator Lamps along bottom of arena lighting up with element colors.
      8. Clean countdown display with large glowing numbers (5 -> 1) and keys instruction.
  - **Verification**: Visuals match the video aesthetic across all 10 stages, rendering at 60 FPS across all graphics tiers.

- [x] **Task 3: Refine mobile UI layout & panel lifecycle**
  - **Action**:
    - Ensure `#panel-onemin` is cleanly displayed as a centered modal with dark backdrop.
    - Enforce immediate hiding of `#main-menu` upon game start.
    - Keep virtual joystick and action buttons fully responsive.
  - **Verification**: Mobile portrait and landscape display without panel overlap.

- [x] **Task 4: Verification, local server testing & GitHub push**
  - **Action**:
    - Run Node.js VM syntax check on `public/index.html`.
    - Test HTTP 200 on local server for HTML and MP3 asset.
    - Commit all changes with clear descriptive message.
    - Push to `origin main` using the Windows Credential Manager authentication helper.
  - **Verification**: Git exit code 0, push successful to GitHub.
