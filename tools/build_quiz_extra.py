#!/usr/bin/env python3
"""Generates public/quiz/kieze-extra.js with the 11 Kieze added to the quiz.

The `answers` string holds the preferred option for each of the 10 quiz questions.
Usage: python tools/build_quiz_extra.py <osm.json>
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OVERRIDES = os.path.join(ROOT, "tools/kiez_overrides.json")
OUT = os.path.join(ROOT, "public/quiz/kieze-extra.js")
POINTS = 3

# Preferred option for each of the 10 detail questions.
DETAIL_ANSWERS = {
    "wilmersdorf": "2202111203", "gesundbrunnen": "1102221002", "zehlendorf": "0032101303", "spandau": "1020321202",
    "reinickendorf": "1030321232", "pankow": "2200122211", "lichtenberg": "1323221132", "treptow": "2223103111",
    "koepenick": "1020202202", "marzahn": "1020301232", "britz": "1000322202",
}

# id, name, district, badge, subtitle, vibe, why, tip, answers, (night, diversity, green, gastro), bamt
KIEZE = [
    ("wilmersdorf", "Wilmersdorf", "Charlottenburg-Wilmersdorf", "City West", "Bürgerlich, grün & nah an der City West", "Gepflegt & Ruhig",
     "Du magst gepflegte Altbauten, ruhige Plätze und kurze Wege in die City West.",
     "Im Sommer thailändisches Streetfood im Preußenpark probieren.", "2233123013", (2, 3, 3, 4), 1),
    ("gesundbrunnen", "Gesundbrunnen", "Mitte", "Humboldthain", "Bunt, ehrlich & nah am Mauerpark", "Multikulti & Ehrlich",
     "Du suchst eine lebendige, internationale Nachbarschaft mit guter Bahnanbindung.",
     "Vom Flakturm im Humboldthain über die Stadt schauen.", "0101210031", (2, 5, 3, 3), 0),
    ("zehlendorf", "Zehlendorf", "Steglitz-Zehlendorf", "Südwesten", "Villen, Wald & Seen im Südwesten", "Grün & Exklusiv",
     "Du willst Ruhe, viel Grün und Seen direkt in der Nähe.",
     "Den Schlachtensee umrunden und in der Fischerhütte einkehren.", "3331333322", (1, 2, 5, 3), 1),
    ("spandau", "Spandau", "Spandau", "Altstadt", "Eigenständig an Havel & Spree", "Eigenständig & Wassernah",
     "Du magst eine Altstadt, Wasser und einen Kiez, der sich wie eine eigene Stadt anfühlt.",
     "Die Zitadelle Spandau und danach die Altstadt besuchen.", "1332233212", (1, 3, 4, 2), 1),
    ("reinickendorf", "Reinickendorf", "Reinickendorf", "Berliner Norden", "Ruhiger Norden mit See", "Bodenständig & Ruhig",
     "Du suchst bezahlbares, ruhiges Wohnen mit Natur und Berliner Alltag.",
     "Eine Runde um den Schäfersee laufen.", "1332333322", (1, 3, 3, 2), 1),
    ("pankow", "Pankow", "Pankow", "Bürgerpark", "Familienfreundlich mit Dorfcharme", "Familiär & Grün",
     "Du möchtest Altbau, Familienleben und Grün, ohne die Stadt zu verlassen.",
     "Durch den Bürgerpark spazieren und auf der Breiten Straße einkaufen.", "2311131022", (2, 3, 4, 3), 1),
    ("lichtenberg", "Lichtenberg", "Lichtenberg", "Ost-Berlin", "Geschichte, Plattenbau & neue Szene", "Im Wandel",
     "Du suchst gute Verbindungen, moderate Lebenshaltung und einen Kiez im Wandel.",
     "Die Geschichte im Stasi-Museum an der Normannenstraße erkunden.", "0301213213", (2, 4, 3, 3), 1),
    ("treptow", "Treptow (Alt-Treptow)", "Treptow-Köpenick", "An der Spree", "Spree, Park & Kreative", "Entspannt & Wassernah",
     "Du möchtest nah an Kreuzberg und Neukölln wohnen, aber mit Park und Wasser vor der Tür.",
     "Mit dem Boot zur Insel der Jugend im Treptower Park.", "1112211113", (3, 3, 5, 3), 0),
    ("koepenick", "Köpenick", "Treptow-Köpenick", "Altstadt", "Wald, Wasser & Altstadt", "Naturnah & Historisch",
     "Du willst viel Wasser und Wald, dazu eine historische Altstadt.",
     "Das Schloss Köpenick besuchen und am Dahme-Ufer spazieren.", "1332233323", (1, 2, 5, 3), 1),
    ("marzahn", "Marzahn", "Marzahn-Hellersdorf", "Gärten der Welt", "Viel Platz & bezahlbares Wohnen", "Weitläufig & Bezahlbar",
     "Du suchst bezahlbare Wohnungen, moderne Grundrisse und viel Platz für die Familie.",
     "Die Gärten der Welt besuchen und mit der Seilbahn fahren.", "0331233222", (1, 4, 4, 2), 1),
    ("britz", "Britz", "Neukölln", "Hufeisensiedlung", "Gartenstadt mit Welterbe", "Gartenstadt & Ruhig",
     "Du liebst Gartenstädte, ruhige Straßen und trotzdem U-Bahn-Anschluss.",
     "Die Hufeisensiedlung (UNESCO-Welterbe) und den Britzer Garten erkunden.", "1331133322", (1, 3, 5, 2), 1),
]


def report(name, why):
    return {
        "de": f"Deine Antworten passen am besten zu {name}. {why} Prüfe vor einem Umzug am besten aktuelle Mietangebote und besuche den Kiez einmal persönlich.",
        "en": f"Your answers fit {name} best. Before you move, check current rental offers and visit the neighbourhood in person.",
        "tr": f"Cevapların en çok {name} semtine uyuyor. Taşınmadan önce güncel kira ilanlarına bak ve semti bizzat gez.",
    }


def main():
    osm = json.load(open(sys.argv[1], encoding="utf-8"))
    overrides = json.load(open(OVERRIDES, encoding="utf-8"))
    entries, scores = [], {}
    for kid, name, district, badge, subtitle, vibe, why, tip, answers, (night, diversity, green, gastro), bamt in KIEZE:
        image = (overrides[kid].get("impressionImages") or ["/assets/images/hero_berlin.jpg"])[0]
        counts = osm.get(kid, {})
        entries.append({
            "id": kid, "name": name, "district": district, "badge": badge, "subtitle": subtitle, "img": image,
            "why": why, "tip": tip, "rent": "k. A.", "vibe": vibe, "decisionReport": report(name, why),
            "traits": [
                {"icon": "🎨", "label": "Vibe", "score": 3, "val": vibe},
                {"icon": "🌙", "label": "Nightlife", "score": night, "val": f"{night}/5"},
                {"icon": "🌍", "label": "Diversity", "score": diversity, "val": f"{diversity}/5"},
                {"icon": "💰", "label": "Miete", "score": 3, "val": "k. A."},
                {"icon": "🌳", "label": "Grün", "score": green, "val": f"{green}/5"},
                {"icon": "☕", "label": "Gastro", "score": gastro, "val": f"{gastro}/5"},
            ],
            "osm": {"ubahn": counts.get("ubahn", 0), "sbahn": counts.get("sbahn", 0), "bustram": counts.get("bustram", 0), "bikes": counts.get("bikes", 0), "spaeti": counts.get("spaeti", 0), "bamt": bamt},
        })
        scores[kid] = answers
    js = (
        "// GENERATED by tools/build_quiz_extra.py. Do not edit.\n"
        f"const KIEZE_EXTRA = {json.dumps(entries, ensure_ascii=False, indent=1)};\n"
        f"const KIEZE_EXTRA_ANSWERS = {json.dumps(scores)};\n"
        f"const KIEZE_DETAIL_ANSWERS = {json.dumps(DETAIL_ANSWERS)};\n\n"
        "KIEZE.push(...KIEZE_EXTRA);\n"
        "KIEZE.forEach((k) => {\n"
        "  if (k.rent !== \"k. A.\" && !String(k.rent).startsWith(\"ca.\")) k.rent = \"ca. \" + k.rent;\n"
        "});\n"
        "Object.entries(KIEZE_EXTRA_ANSWERS).forEach(([id, answers]) => {\n"
        f"  [...answers].forEach((option, question) => {{\n    QUIZ_QUESTIONS[question].options[Number(option)].scores[id] = {POINTS};\n  }});\n"
        "});\n"
        "Object.entries(KIEZE_DETAIL_ANSWERS).forEach(([id, answers]) => {\n"
        f"  [...answers].forEach((option, question) => {{\n    DEEP_DIVE_QUESTIONS[question].options[Number(option)].scores[id] = {POINTS};\n  }});\n"
        "});\n\n"
        "// The detail questions now count: both quiz parts decide the final Kiez.\n"
        "function combinedWinner() {\n"
        "  const totals = {};\n"
        "  const add = (questions, answers) => Object.entries(answers).forEach(([q, a]) => {\n"
        "    Object.entries(questions[q].options[a].scores).forEach(([id, points]) => { totals[id] = (totals[id] || 0) + points; });\n"
        "  });\n"
        "  add(QUIZ_QUESTIONS, selectedQuizAnswers);\n"
        "  add(DEEP_DIVE_QUESTIONS, selectedDdAnswers);\n"
        "  const best = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];\n"
        "  return best ? KIEZE.find((k) => k.id === best[0]) : null;\n"
        "}\n\n"
        "const baseNextDeepDive = nextDeepDive;\n"
        "nextDeepDive = function () {\n"
        "  if (currentDdIdx === DEEP_DIVE_QUESTIONS.length - 1) {\n"
        "    const finalKiez = combinedWinner();\n"
        "    if (finalKiez && finalKiez.id !== winnerKiez?.id) {\n"
        "      winnerKiez = finalKiez;\n"
        "      displayResult(finalKiez);\n"
        "    }\n"
        "  }\n"
        "  baseNextDeepDive();\n"
        "};\n"
    )
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(js)
    print("quiz extra", len(entries))


if __name__ == "__main__":
    main()
