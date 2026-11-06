# Coverage

How each of the 1436 endings in IANA's list answered on 2026-11-06, from one computer, measured by `npm run survey`. Registries can treat other addresses differently, and some change their rules.

| How it answers | Endings | What the app says |
|---|---|---|
| The registry told a registered name from a made-up one | 1255 | "Free" or "Taken", with the record's details where the registry shares them |
| The registry says a made-up name is free, with no registered test name to compare | 18 | The same. Many of these are endings in other scripts, or closed to the public |
| The registry won't answer, so this rests on DNS | 162 | "Probably free", and "Taken" when a name has live name servers |
| Nobody answered this time | 1 | "Can't tell" |
| A made-up name looked taken | 0 | "Taken", wrongly, because the ending answers for every name |

## The registry won't answer

These refuse public lookups, or answer only some networks. The app never calls a name here "free".

.ae, .al, .ao, .aq, .arpa, .aw, .az, .ba, .bb, .bd, .bo, .bridgestone, .brother, .bs, .bt, .bv, .bw, .by, .canon, .cf, .cg, .ck, .cu, .cw, .cy, .datsun, .dj, .dm, .dnp, .eg, .epson, .er, .es, .et, .firestone, .fk, .fujitsu, .gb, .ggee, .gm, .gmo, .goldpoint, .gp, .gq, .gr, .gt, .gu, .gw, .hisamitsu, .hitachi, .hm, .honda, .hyundai, .il, .infiniti, .iq, .jcb, .jm, .jo, .kddi, .kh, .kia, .km, .komatsu, .kp, .kyoto, .lexus, .lk, .lotte, .lr, .lu, .mh, .mil, .mitsubishi, .ml, .mp, .mt, .mv, .mw, .na, .nagoya, .ne, .nec, .ng, .nhk, .ni, .nico, .nissan, .np, .nr, .okinawa, .otsuka, .pa, .panasonic, .ph, .playstation, .pt, .py, .ricoh, .ryukyu, .sharp, .shop, .sj, .sm, .softbank, .sony, .suzuki, .sv, .sx, .sz, .tj, .tk, .tokyo, .toray, .toshiba, .toyota, .tt, .uy, .va, .vn, .ಭಾರತ, .ଭାରତ, .ভাৰত, .ভারত, .বাংলা, .срб, .бг, .бел, .ею, .భారత్, .ලංකා, .ભારત, .भारतम्, .भारत, .भारोत, .香港, .мон, .امارات, .پاکستان, .بارت, .بھارت, .المغرب, .ڀارت, .سودان, .عراق, .مليسيا, .გე, .سورية, .تونس, .ευ, .ελ, .ഭാരതം, .ਭਾਰਤ, .مصر, .இலங்கை, .இந்தியா, .հայ, .فلسطين, .yodobashi, .yokohama, .za, .zw

## Nobody answered

Worth measuring again, as this is often temporary.

.الاردن
