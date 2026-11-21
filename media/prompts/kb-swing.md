# kb-swing — prompt, fonte 3 (pilota del 2026-11-21)

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
| `{KG}` | 12 o 20 (Alessio ha 8, 12, 20): sceglie il designer |
| fotogrammi | **2, non 3**: fondo del backswing e picco. Lo schema ne vuole 3 per lo swing; affiancati sul telefono non si leggono (STYLE_GUIDE §8.5). Decide il designer |
| `{POSE_1}` | bozza dai cue: «Feet a little wider than the hips, knees softly bent, hips pushed far back, back flat from pelvis to head, eyes on the floor two metres ahead, straight arms with the kettlebell swung high between the thighs, close to the groin.» |
| `{READ_1}` | «flat back; hips behind the heels; kettlebell high between the thighs» |
| `{POSE_2}` | bozza: «Standing tall, hips and knees fully straight, glutes and abs braced, ribs down, straight arms, the kettlebell floating at chest height in front of him.» |
| `{READ_2}` | «body in one straight line like a standing plank; kettlebell at chest height, not higher» |
| `{MUST_NOT}` | «squatting, rounded back, arched lower back, leaning back, kettlebell above the head, bent arms» |

## Prompt (inglese — il testo eseguito va copiato qui, identico)
```
A realistic studio photograph of two side-by-side panels of equal width showing the same man in two positions of one kettlebell swing. One continuous backdrop, no line between the panels; same face, hair, build, clothing, light, camera and scale in both; he is centred in each panel and nothing crosses the middle.
LEFT PANEL, bottom position of the backswing: {POSE_1} Clearly visible: {READ_1}.
RIGHT PANEL, top position: {POSE_2} Clearly visible: {READ_2}.
EQUIPMENT: one {KG} kg cast-iron kettlebell, matte black, plain, with a single smooth handle, no markings.
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
| 2026-11-21 | `mcp-tools/Qwen-Image`@`bce5b19` · `Qwen/Qwen-Image`@`75e0b4b` | 11 · 50 · 4,0 (true CFG), 16:9 → 1664×928 | **scartata** in prima lettura della sessione principale (checklist G0–G11 non eseguita): pannello sinistro **frontale** e in squat, campana bassa; stativo da studio a destra; riga bianca fra i pannelli; segni sulla campana. Pannello destro (picco, di lato) corretto | grezzo fuori dal repo (S4) |
| 2026-11-21 | come sopra | 22 · 50 · 4,0, 16:9 (al primo tentativo «GPU task aborted», ripetuto uguale) | **scartata** in prima lettura: pannello sinistro di nuovo **frontale**, cerniera appena accennata, campana fra le ginocchia; riga bianca fra i pannelli; segni sulla campana. Pannello destro corretto | grezzo fuori dal repo (S4) |
| 2026-11-21 | come sopra | 33 · 50 · 4,0, variante V2 qui sotto | **non eseguita**: quota ZeroGPU gratuita esaurita (si rinnova dopo 24 h) | — |

### Valori eseguiti nei semi 11 e 22
Modello T2 sopra con: `{KG}` = 20; fotogrammi 2 (caricamento e picco della scheda del designer, 5.1: il designer ne chiede 3, il pilota ne prova 2 per la leggibilità, STYLE_GUIDE §8.5). Pose dalla scheda 5.1, testo eseguito:
- `{POSE_1}`: «both hands hold the handle of one kettlebell with an overhand grip; the kettlebell is swung back between his thighs, behind the line of his knees, the handle above knee height and close to the groin, the bottom of the bell facing backwards; his forearms touch the inside of his thighs; hips pushed far back behind his heels, shins almost vertical, knees only slightly bent, heels on the floor, feet a little wider than his shoulders; back flat from pelvis to head, head in line with the spine, eyes on the floor two metres ahead.»
- `{READ_1}`: «a hip hinge, not a squat; the handle high between the thighs; a flat back»
- `{POSE_2}`: «standing tall like a standing plank, ankles, hips and shoulders on one vertical line, knees straight, glutes squeezed, ribs down, no backward lean; straight arms in front of him just below horizontal, both hands on the handle; the kettlebell at chest height in line with the arms, below shoulder level; shoulders down, eyes forward, whole feet on the floor.»
- `{READ_2}`: «the body in one straight vertical line; the kettlebell at chest height, not higher»
- `{MUST_NOT}` nel negativo: «kettlebell above the head, kettlebell above the shoulders, leaning back, arched lower back, rounded back, knees past the toes, heels lifted, bent arms, one-handed grip, two kettlebells, dumbbell, squatting»

### Variante V2 (non eseguita) — per il difetto ricorrente del pannello sinistro frontale
La vista di profilo detta per prima e ripetuta in ogni metà; nel negativo «front view, facing the camera, looking at the camera, markings on the kettlebell, white gap, light stand, studio equipment, kettlebell near the floor». Testo esatto nel registro della sessione del 2026-11-21; va copiato qui quando si esegue.

