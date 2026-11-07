#!/usr/bin/env python3
"""Generates public/data-extended.js from the Android SampleData.kt.

Keeps web and APK content in sync: run this after SampleData.kt changes.
Usage: python tools/extract_sampledata.py
"""
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KT = os.path.join(ROOT, "app/src/main/java/com/example/data/repository/SampleData.kt")
TIPS_KT = os.path.join(ROOT, "app/src/main/java/com/example/data/repository/BerlinTipsRepository.kt")
DRAWABLE = os.path.join(ROOT, "app/src/main/res/drawable")
IMAGES = os.path.join(ROOT, "public/assets/images")
OUT = os.path.join(ROOT, "public/data-extended.js")
KIEZ_OVERRIDES = os.path.join(ROOT, "tools/kiez_overrides.json")
KIEZ_API = os.path.join(ROOT, "functions/_lib/kieze.json")

UMGEBUNG = {
    "id": "umgebung", "name": "Berlin & Umgebung", "subtitle": "Ausflüge rund um Berlin",
    "description": "Das Umland ist von Berlin aus schnell erreichbar: Potsdam mit Schloss Sanssouci, der Spreewald und die Seen in Brandenburg.",
    "lat": 52.52, "lng": 13.405, "imageUrl": "assets/images/hero_berlin.jpg", "vibe": "Natur & Ausflug",
    "highlights": ["Potsdam", "Spreewald", "Werder (Havel)"], "transitLines": "S-Bahn, Regionalbahn (VBB-Tarif ABC)",
}

LISTS = {
    "kieze": "KIEZE_FULL",
    "foodSpots": "FOOD_SPOTS",
    "events": "EVENTS_FULL",
    "businesses": "BUSINESSES",
    "rawDeals": "DEALS",
    "quizQuestions": "QUIZ_FULL",
    "articles": "ARTICLES",
    "pricingPackages": "PRICING_PACKAGES",
    "addOns": "ADD_ONS",
    "sponsors": "SPONSORS",
    "jobs": "JOBS",
    "emergencyContacts": "EMERGENCY_CONTACTS",
    "coupons": "COUPONS",
}


class Parser:
    def __init__(self, text, pos=0):
        self.t = text
        self.i = pos

    def ws(self):
        while self.i < len(self.t):
            c = self.t[self.i]
            if c.isspace():
                self.i += 1
            elif self.t.startswith("//", self.i):
                nl = self.t.find("\n", self.i)
                self.i = len(self.t) if nl < 0 else nl
            elif self.t.startswith("/*", self.i):
                self.i = self.t.index("*/", self.i) + 2
            else:
                return

    def string(self):
        if self.t.startswith('"""', self.i):
            end = self.t.index('"""', self.i + 3)
            s = self.t[self.i + 3:end]
            self.i = end + 3
            return re.sub(r"^\s*\|", "", s, flags=re.M).strip()
        self.i += 1
        out = []
        esc = {"n": "\n", "t": "\t", '"': '"', "\\": "\\", "$": "$", "'": "'", "r": ""}
        while self.t[self.i] != '"':
            c = self.t[self.i]
            if c == "\\":
                n = self.t[self.i + 1]
                if n == "u":
                    out.append(chr(int(self.t[self.i + 2:self.i + 6], 16)))
                    self.i += 6
                    continue
                out.append(esc.get(n, n))
                self.i += 2
                continue
            out.append(c)
            self.i += 1
        self.i += 1
        return "".join(out)

    def value(self):
        self.ws()
        c = self.t[self.i]
        if c == '"':
            v = self.string()
            self.ws()
            while self.t[self.i] == "+":
                self.i += 1
                self.ws()
                v += self.string()
                self.ws()
            return v
        m = re.compile(r"-?\d+(\.\d+)?[fFL]?\b").match(self.t, self.i)
        if m:
            self.i = m.end()
            raw = m.group(0).rstrip("fFL")
            return float(raw) if "." in raw else int(raw)
        m = re.compile(r"[A-Za-z_][\w.]*").match(self.t, self.i)
        if not m:
            raise ValueError("unexpected at %d: %r" % (self.i, self.t[self.i:self.i + 40]))
        name = m.group(0)
        self.i = m.end()
        self.ws()
        if name in ("true", "false"):
            return name == "true"
        if name == "null":
            return None
        if self.i < len(self.t) and self.t[self.i] == "(":
            return self.call(name)
        if ".drawable." in "." + name or ".raw." in "." + name:
            return {"res": name.split(".")[-1]}
        return name

    def call(self, name):
        self.i += 1
        items, named = [], {}
        while True:
            self.ws()
            if self.t[self.i] == ")":
                self.i += 1
                break
            m = re.compile(r"([A-Za-z_]\w*)\s*=(?!=)").match(self.t, self.i)
            if m:
                self.i = m.end()
                named[m.group(1)] = self.value()
            else:
                items.append(self.value())
            self.ws()
            if self.t[self.i] == ",":
                self.i += 1
        if name in ("listOf", "mutableListOf", "emptyList"):
            return items
        return named if named else items


def clean_image(value):
    """Maps drawable references to web assets, copying missing ones."""
    if isinstance(value, dict) and "res" in value:
        name = value["res"]
    elif isinstance(value, str) and value.startswith("android.resource://"):
        name = value.rsplit("/", 1)[-1]
    else:
        return value
    for ext in ("jpg", "png", "webp"):
        src = os.path.join(DRAWABLE, "%s.%s" % (name, ext))
        if os.path.exists(src):
            dst = os.path.join(IMAGES, "%s.%s" % (name, ext))
            if not os.path.exists(dst):
                shutil.copyfile(src, dst)
            return "assets/images/%s.%s" % (name, ext)
    return "assets/images/mykiez_logo.png"


def walk(v):
    if isinstance(v, dict):
        if set(v) == {"res"}:
            return clean_image(v)
        return {k: walk(x) for k, x in v.items()}
    if isinstance(v, list):
        return [walk(x) for x in v]
    if isinstance(v, str) and v.startswith("android.resource://"):
        return clean_image(v)
    return v


def apply_kiez_overrides(kieze):
    """Replaces app data with checked official values and real photos."""
    overrides = json.load(open(KIEZ_OVERRIDES, encoding="utf-8"))
    for kiez in kieze:
        kiez.update(overrides.get(kiez["id"], {}))
        if kiez.get("impressionImages") and kiez.get("photoCredits"):
            kiez["imageUrl"] = kiez["impressionImages"][0]
    if not any(k["id"] == UMGEBUNG["id"] for k in kieze):
        kieze.append(UMGEBUNG)
    with open(KIEZ_API, "w", encoding="utf-8", newline="\n") as f:
        json.dump({"kieze": kieze}, f, ensure_ascii=False)
    return kieze


def main():
    text = open(KT, encoding="utf-8").read()
    out = ["// GENERATED by tools/extract_sampledata.py from SampleData.kt. Do not edit.\n"]
    for key, const in LISTS.items():
        m = re.search(r"val %s\s*(?::[^=]+)?=\s*listOf\(" % key, text)
        if not m:
            sys.exit("missing list: " + key)
        p = Parser(text, m.end() - 1)
        data = walk(p.call("listOf"))
        if key == "kieze":
            data = apply_kiez_overrides(data)
        out.append("const %s = %s;\n" % (const, json.dumps(data, ensure_ascii=False, indent=1)))
        print("%-20s %d" % (key, len(data)))
    tips_text = open(TIPS_KT, encoding="utf-8").read()
    match = re.search(r"val tips\s*:[^=]+=\s*listOf\(", tips_text)
    tips = walk(Parser(tips_text, match.end() - 1).call("listOf"))
    out.append("const BERLIN_TIPS = %s;\n" % json.dumps(tips, ensure_ascii=False, indent=1))
    print("%-20s %d" % ("tips", len(tips)))
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(out))


if __name__ == "__main__":
    main()
