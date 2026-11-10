# Specification: Redesign 1 Mins Mode Visuals & Audio from "How a Star Explodes"

## 1. Context & Motivation
The user requested: *"sử dụng video này để thiết kế lại chế độ chơi từ hình ảnh đến âm thanh đi"* accompanied by the attached video `media_1794313918930_41936449.mp4` (Duration: 67.03s, by `@the.lab67` on TikTok: *"How a giant star explodes, and what it sounds like"*).
Additionally, the user provided screenshots showing:
1. Stuck 5-second countdown & worm freeze on mobile (`00.0s / 67.0s` with cyan `5`).
2. Overlapping subpanels on mobile portrait mode.

This specification outlines the comprehensive redesign of the `1 Mins Mode` (Beat Dash) in visuals, audio, and gameplay flow to create an authentic Sci-Fi Observatory experience true to the video while guaranteeing robust controls and mobile UI stability.

---

## 2. User Stories & Acceptance Criteria

### User Story 1: Authentic Audio Experience (P1 - MVP)
**As a** player in 1 Mins Mode,  
**I want** to listen to the authentic soundtrack extracted from the video (*"How a giant star explodes, and what it sounds like"*),  
**So that** the beats, element fusion transitions, sirens, and supernova explosion sound directly as portrayed in the video.

#### Acceptance Criteria (Given / When / Then)
- **AC 1.1**: *Given* the player starts 1 Mins Mode and the 5-second countdown finishes,  
  *When* `oneMinState` transitions to `"playing"`,  
  *Then* `public/audio/how_a_star_explodes.mp3` starts playing from 0.0s.
- **AC 1.2**: *Given* the audio is playing,  
  *When* the game loop updates,  
  *Then* `oneMinPlayTime` tracks `audio.currentTime` smoothly, ensuring exact Danmaku choreography and stage synchronization.
- **AC 1.3**: *Given* browser audio autoplay policies block or fail to decode MP3,  
  *When* an error occurs,  
  *Then* the system falls back seamlessly to procedural synthesizer (`oneMinSynth`) without crashing.
- **AC 1.4**: *Given* the player pauses or resumes the game,  
  *When* `togglePause()` is called,  
  *Then* `oneMinAudio.pause()` and `oneMinAudio.play()` synchronize instantly, and the default background music `bgMusic` does not overlap.
- **AC 1.5**: *Given* the track completes at 67.0s,  
  *When* the music ends,  
  *Then* the arena transitions to `"core_spawned"` where the player can grab the Victory Core to win.

---

### User Story 2: Observatory Console & Evolving Star Visuals (P1 - MVP)
**As a** player watching the arena background,  
**I want** to see the glowing Giant Star with concentric fusion layers, dynamic oscilloscope, and neon stage lamps evolving across 10 stages,  
**So that** I feel immersed in a real astrophysical observation console.

#### Acceptance Criteria
- **AC 2.1**: *Given* the match is running,  
  *When* rendering the arena,  
  *Then* the center background features a Sci-Fi Observatory aperture and a massive glowing Giant Star with concentric fusion shells:
  - Inner Core: Iron (`Fe` - dense crimson/white)
  - Shell 1: Silicon (`Si` - neon violet `#aa66ff`)
  - Shell 2: Oxygen (`O` - cyan `#44ccff`)
  - Shell 3: Neon (`Ne` - emerald `#44ff66`)
  - Shell 4: Carbon (`C` - gold `#ffdd44`)
  - Shell 5: Helium (`He` - orange `#ffaa33`)
  - Outer Corona: Hydrogen (`H` - cyan flare `#00e5ff`)
- **AC 2.2**: *Given* Stage 8 (`CHANDRASEKHAR` limit at 46.9s - 53.6s),  
  *When* iron core mass approaches 1.44 Solar Masses,  
  *Then* the core pulses violently with hazard warning rings and telemetry *"CRITICAL: 1.44 SUNS LIMIT EXCEEDED"*.
- **AC 2.3**: *Given* Stage 9 (`COLLAPSE` at 53.6s - 60.3s),  
  *When* core collapse occurs at 70,000 km/s,  
  *Then* the outer shells implode inwards with radial gravity vortex streaks pulled into a singularity.
- **AC 2.4**: *Given* Stage 10 (`SUPERNOVA` at 60.3s - 67.0s),  
  *When* the cosmic blast wave triggers,  
  *Then* a blinding white flash occurs, followed by an expanding multi-colored remnant planetary nebula (`t^(2/5)` expansion) with radiant cosmic shockwaves and central pulsar.
- **AC 2.5**: *Given* the arena background,  
  *When* rendering,  
  *Then* a cathode-ray neon Oscilloscope wave plots the authentic mathematical equations with a scanning probe bead tracing the wave in real time.
- **AC 2.6**: *Given* the 10 stages,  
  *When* rendering the status bar,  
  *Then* 10 LED indicator lamps (`[H]`, `[He]`, `[C]`, `[Ne]`, `[O]`, `[Si]`, `[Fe]`, `[1.44M☉]`, `[COLLAPSE]`, `[SUPERNOVA]`) illuminate progressively with neon status glow.

---

### User Story 3: 5s Countdown & Control Responsiveness (P1 - MVP)
**As a** mobile or PC player,  
**I want** the 5-second countdown to count down reliably without freezing, and the worm to be freely controllable,  
**So that** I am prepared to dodge danmaku hazards immediately.

#### Acceptance Criteria
- **AC 3.1**: *Given* the player presses "BẮT ĐẦU (ĐẾM NGƯỢC 5S)",  
  *When* countdown is active,  
  *Then* `oneMinCountdownTimer` ticks down smoothly (5.0s -> 0.0s), showing large pulsing numbers (5 -> 4 -> 3 -> 2 -> 1) with countdown beeps.
- **AC 3.2**: *Given* countdown is running,  
  *When* the player uses WASD, Arrow keys, or the on-screen Touch Joystick,  
  *Then* the worm can move freely in all 360-degree directions inside the arena to verify controls.
- **AC 3.3**: *Given* mobile portrait or landscape mode,  
  *When* opening `#panel-onemin`,  
  *Then* the panel is cleanly isolated as a modal without overlapping other menu panels, and closes completely when the game starts.
