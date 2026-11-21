# apertura-anche — prompt, fonte 3 (pilota del 2026-11-21)

**Stato: bozza.** I segnaposto `{POSE_n}`, `{READ_n}`, `{MUST_NOT}` si
riempiono dalla scheda del designer (EXERCISE_SCHEMA `frames`); la tabella
qui sotto è solo una proposta dai cue di oggi. Stile fisso: STYLE_GUIDE §8.7.
Nessuna immagine RepDB è stata guardata o descritta per scriverlo (C1–C2).

| parametro | valore |
|---|---|
| template | T1 · 1328×1328 |
| modello | `Qwen/Qwen-Image` @ `75e0b4b` |
| passi · guidance | 50 · `true_cfg_scale` 4,0 · `max_sequence_length` 1024 in locale |
| semi del pilota | 11, 22, 33, 44 (tutti e quattro, tutti guardati) |
| servizio | Space `mcp-tools/Qwen-Image` @ `bce5b19` (LICENSING §3.5): passare sempre `seed`, `randomize_seed=False`, il negativo qui sotto, `guidance_scale=4.0`, `num_inference_steps=50` (default 30), `aspect_ratio` |

## Proposte del media lead (vale la scheda del designer)
| cosa | proposta |
|---|---|
| **da chiarire** | il cue dice affondo basso con il ginocchio dietro a terra; la `videoQuery` dice «couch stretch», che ha il piede dietro alzato contro un muro o un divano. Sono due posizioni: il prompt segue il cue finché il designer non decide |
| lato | lavora il **sinistro** (ginocchio sinistro a terra, anca sinistra in apertura), vicino alla macchina. «Metà tempo per lato» resta nei cue |
| `{POSE_1}` | bozza dal cue: «Left knee on the floor under the hip, right foot flat in front with the right knee bent at about 90 degrees, pelvis tucked under and shifted forward, torso upright, hands on the hips.» |
| `{READ_1}` | «pelvis tucked, lower back not arched; torso upright; rear knee on the floor» |
| `{MUST_NOT}` | «arched lower back, leaning forward, front knee caving inward, kneeling pad» |

## Prompt (inglese — il testo eseguito va copiato qui, identico)
```
A realistic studio photograph of one man holding the held stretch position of one half-kneeling hip flexor stretch: {POSE_1} Clearly visible: {READ_1}.
EQUIPMENT: no equipment.
VIEW: strict side view, camera at 90 degrees to the direction he faces, his left side towards the camera.
ATHLETE: a man in his mid-thirties, athletic but realistic build, not a bodybuilder, short dark-brown hair, clean-shaven, no tattoos or jewellery, calm focused expression, not looking at the camera. CLOTHING: fitted plain deep-blue short-sleeved T-shirt, fitted plain medium-grey shorts ending above the knee, low white socks, plain black training shoes with white soles; no logos, prints, stripes or text on anything. STUDIO: seamless light warm-grey backdrop, floor and wall the same colour, nothing else in the scene but the listed equipment; soft even light from the front, natural colours, soft contact shadows where body and equipment touch the floor. CAMERA: realistic photograph, camera about one metre above the floor, tilted slightly down, 50 mm lens from about four metres, whole body and equipment inside the frame with a margin on every side, all in sharp focus. ANATOMY: correct anatomy, two arms, two legs, five fingers on each hand wrapping naturally around what they hold, joints bending only in their natural direction, realistic proportions.
```

## Negativo
```
text, letters, numbers, watermark, logo, brand, label, caption, arrow, diagram, border, divider line, gym, mirror, window, other people, extra arms, extra legs, extra fingers, missing fingers, fused fingers, deformed hands, twisted wrist, backwards knee, hyperextended elbow, cropped head, cropped hands, cropped feet, motion blur, blurred background, cartoon, illustration, 3D render, plastic skin, dramatic lighting, tattoo, jewellery, headphones, watch, {MUST_NOT}
```

## Esecuzioni
| data | Space@sha · modello@sha | seme · passi · guidance (stampati) | esito G0–G11 | file |
|---|---|---|---|---|
