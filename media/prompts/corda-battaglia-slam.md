# corda-battaglia-slam — prompt, fonte 3 (pilota del 2026-11-21)

**Stato: bozza.** I segnaposto `{POSE_n}`, `{READ_n}`, `{MUST_NOT}` si
riempiono dalla scheda del designer (EXERCISE_SCHEMA `frames`); la tabella
qui sotto è solo una proposta dai cue di oggi. Stile fisso: STYLE_GUIDE §8.7.
Nessuna immagine RepDB è stata guardata o descritta per scriverlo (C1–C2).

| parametro | valore |
|---|---|
| template | T2 · 1664×928 |
| modello | `Qwen/Qwen-Image` @ `75e0b4b` |
| passi · guidance | 50 · `true_cfg_scale` 4,0 · `max_sequence_length` 1024 in locale |
| semi del pilota | 11, 22, 33, 44 (tutti e quattro, tutti guardati) |
| servizio | Space `mcp-tools/Qwen-Image` @ `bce5b19` (LICENSING §3.5): passare sempre `seed`, `randomize_seed=False`, il negativo qui sotto, `guidance_scale=4.0`, `num_inference_steps=50` (default 30), `aspect_ratio` |

## Proposte del media lead (vale la scheda del designer)
| cosa | proposta |
|---|---|
| punto di vista | **laterale**, non tre quarti: l'errore tipico è la schiena che si piega al posto delle anche (STYLE_GUIDE §2) |
| `{POSE_1}` | bozza dai cue: «Up on the balls of the feet, legs straight, arms fully extended overhead holding both rope ends, the rope rising from the floor to his hands.» |
| `{READ_1}` | «arms straight overhead; heels off the floor; both rope ends in the hands» |
| `{POSE_2}` | bozza: «Hips hinged back and knees bent, back flat, abs braced, arms driven down in front of the knees, both rope halves slamming flat on the floor.» |
| `{READ_2}` | «the bend is at the hips, back flat; rope flat on the floor» |
| `{MUST_NOT}` | «rounded back, hunched shoulders, rope tangled, a single rope end» |

## Prompt (inglese — il testo eseguito va copiato qui, identico)
```
A realistic studio photograph of two side-by-side panels of equal width showing the same man in two positions of one battle rope slam. One continuous backdrop, no line between the panels; same face, hair, build, clothing, light, camera and scale in both; he is centred in each panel and nothing crosses the middle.
LEFT PANEL, top position: {POSE_1} Clearly visible: {READ_1}.
RIGHT PANEL, bottom position, the moment the rope hits the floor: {POSE_2} Clearly visible: {READ_2}.
EQUIPMENT: one heavy black battle rope looped around a distant anchor, one end in each hand, both halves lying parallel on the floor and leaving the frame.
VIEW: strict side view, camera at 90 degrees to the direction he faces, his left side towards the camera.
ATHLETE: a man in his mid-thirties, athletic but realistic build, not a bodybuilder, short dark-brown hair, clean-shaven, no tattoos or jewellery, calm focused expression, not looking at the camera. CLOTHING: fitted plain deep-blue short-sleeved T-shirt, fitted plain medium-grey shorts ending above the knee, low white socks, plain black training shoes with white soles; no logos, prints, stripes or text on anything. STUDIO: seamless light warm-grey backdrop, floor and wall the same colour, nothing else in the scene but the listed equipment; soft even light from the front, natural colours, soft contact shadows where body and equipment touch the floor. CAMERA: realistic photograph, camera level with his hips, 50 mm lens from about four metres, whole body and equipment inside the frame with a margin on every side, all in sharp focus. ANATOMY: correct anatomy, two arms, two legs, five fingers on each hand wrapping naturally around what they hold, joints bending only in their natural direction, realistic proportions.
```

## Negativo
```
text, letters, numbers, watermark, logo, brand, label, caption, arrow, diagram, border, divider line, gym, mirror, window, other people, extra arms, extra legs, extra fingers, missing fingers, fused fingers, deformed hands, twisted wrist, backwards knee, hyperextended elbow, cropped head, cropped hands, cropped feet, motion blur, blurred background, cartoon, illustration, 3D render, plastic skin, dramatic lighting, tattoo, jewellery, headphones, watch, {MUST_NOT}
```

## Esecuzioni
| data | Space@sha · modello@sha | seme · passi · guidance (stampati) | esito G0–G11 | file |
|---|---|---|---|---|
