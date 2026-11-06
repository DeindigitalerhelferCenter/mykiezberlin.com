#!/usr/bin/env python3
"""Builds tools/kiez_overrides.json from checked sources.

Bürgerämter come from service.berlin.de and police sections from berlin.de
(checked 2026-11-06). Population and photos are fetched from Wikidata and
Wikimedia Commons. Usage: python tools/build_kiez_overrides.py <kiez_wiki.json>
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "tools/kiez_overrides.json")
UA = {"User-Agent": "MyKiezBerlinDataCheck/1.0 (https://mykiezberlin.com; info@deindigitalerhelfer.com)"}
BA_URL = "https://service.berlin.de/standorte/buergeraemter/"
POLICE_URL = "https://www.berlin.de/polizei/dienststellen/landespolizeidirektion/"

OFFICIAL = {
    "mitte": ("Bürgeramt Rathaus Mitte", "Karl-Marx-Allee 31, 10178 Berlin", "Polizeiabschnitt 57", "Keibelstraße 35, 10178 Berlin", "+49 30 4664 557700"),
    "kreuzberg": ("Bürgeramt 1 (Kreuzberg)", "Yorckstraße 4-11, 10965 Berlin", "Polizei Kreuzberg (Friesenstraße)", "Friesenstraße 16, 10965 Berlin", "+49 30 4664 552700"),
    "neukoelln": ("Bürgeramt Rathaus Neukölln", "Donaustraße 29, 12043 Berlin", "Polizeiabschnitt 54", "Sonnenallee 107, 12045 Berlin", "+49 30 4664 554701"),
    "friedrichshain": ("Bürgeramt 3 (Friedrichshain)", "Frankfurter Allee 35/37, 10247 Berlin", "Polizeiabschnitt 51", "Wedekindstraße 10, 10243 Berlin", "+49 30 4664 551700"),
    "prenzlauer-berg": ("Bürgeramt Prenzlauer Berg", "Fröbelstraße 17, 10405 Berlin", "Polizeiabschnitt 15", "Eberswalder Straße 6-9, 10437 Berlin", "+49 30 4664 115701"),
    "charlottenburg": ("Bürgeramt Wilmersdorfer Straße", "Wilmersdorfer Straße 46, 10627 Berlin", "Polizeiabschnitt 25", "Bismarckstraße 111, 10625 Berlin", "+49 30 4664 225701"),
    "schoeneberg": ("Bürgeramt Schöneberg", "John-F.-Kennedy-Platz 1, 10825 Berlin", "Polizeiabschnitt 41", "Gothaer Straße 19, 10823 Berlin", "+49 30 4664 441701"),
    "wedding": ("Bürgeramt Wedding", "Osloer Straße 36, 13359 Berlin", "Regionalabschnitt 17/18", "Oudenarder Straße 16, 13347 Berlin", "+49 30 4664 117701"),
    "moabit": ("Bürgeramt Rathaus Tiergarten", "Mathilde-Jacob-Platz 1, 10551 Berlin", "Polizeiabschnitt 27", "Perleberger Straße 61a, 10559 Berlin", "+49 30 4664 227700"),
    "tiergarten": ("Bürgeramt Rathaus Tiergarten", "Mathilde-Jacob-Platz 1, 10551 Berlin", "Polizeiabschnitt 27", "Perleberger Straße 61a, 10559 Berlin", "+49 30 4664 227700"),
    "wilmersdorf": ("Bürgeramt Hohenzollerndamm", "Hohenzollerndamm 177, 10713 Berlin", "Polizeiabschnitt 26", "Rudolstädter Straße 81, 10713 Berlin", "+49 30 4664 226700"),
    "tempelhof": ("Bürgeramt Tempelhof", "Tempelhofer Damm 165, 12099 Berlin", "Polizeiabschnitt 44", "Götzstraße 6, 12099 Berlin", "+49 30 4664 0"),
    "gesundbrunnen": ("Bürgeramt Wedding", "Osloer Straße 36, 13359 Berlin", "Regionalabschnitt 17/18", "Oudenarder Straße 16, 13347 Berlin", "+49 30 4664 117701"),
    "steglitz": ("Bürgeramt Steglitz", "Schloßstraße 37, 12163 Berlin", "Polizeiabschnitt 45", "Augustaplatz 7, 12203 Berlin", "+49 30 4664 0"),
    "zehlendorf": ("Bürgeramt Zehlendorf", "Kirchstraße 1/3, 14163 Berlin", "Polizeiabschnitt 43", "Alemannenstraße 10, 14129 Berlin", "+49 30 4664 0"),
    "spandau": ("Bürgeramt Rathaus Spandau", "Carl-Schurz-Straße 2/6, 13597 Berlin", "Polizeiabschnitt 21", "Moritzstraße 10, 13597 Berlin", "+49 30 4664 221700"),
    "reinickendorf": ("Bürgeramt Reinickendorf-Ost", "Teichstraße 65, 13407 Berlin", "Polizeiabschnitt 12", "Am Nordgraben 6, 13437 Berlin", "+49 30 4664 112701"),
    "pankow": ("Bürgeramt Pankow", "Breite Straße 24A-26, 13187 Berlin", "Polizeiabschnitt 13", "Hadlichstraße 37, 13187 Berlin", "+49 30 4664 113701"),
    "lichtenberg": ("Bürgeramt 2 (Lichtenberg)", "Normannenstraße 1-2, 10367 Berlin", "Polizeiabschnitt 34", "Nöldnerstraße 35, 10317 Berlin", "+49 30 4664 334700"),
    "treptow": ("Bürgeramt Schöneweide", "Michael-Brückner-Straße 1, 12439 Berlin", "Polizeiabschnitt 35", "Segelfliegerdamm 42, 12487 Berlin", "+49 30 4664 335700"),
    "koepenick": ("Bürgeramt Rathaus Köpenick", "Alt-Köpenick 23, 12555 Berlin", "Polizeiabschnitt 36", "Karlstraße 8, 12557 Berlin", "+49 30 4664 336700"),
    "marzahn": ("Bürgeramt Marzahner Promenade", "Marzahner Promenade 11, 12679 Berlin", "Polizeiabschnitt 32", "Cecilienstraße 92, 12683 Berlin", "+49 30 4664 332700"),
    "britz": ("Bürgeramt Blaschkoallee", "Blaschkoallee 32, 12359 Berlin", "Polizeiabschnitt 48", "Zwickauer Damm 58, 12353 Berlin", "+49 30 4664 448700"),
}


def fetch(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))


def population(title):
    query = urllib.parse.urlencode({"action": "query", "titles": title, "prop": "pageprops", "ppprop": "wikibase_item", "redirects": 1, "format": "json", "formatversion": 2})
    page = fetch("https://de.wikipedia.org/w/api.php?" + query)["query"]["pages"][0]
    qid = page.get("pageprops", {}).get("wikibase_item")
    if not qid:
        return None
    claims = fetch("https://www.wikidata.org/wiki/Special:EntityData/%s.json" % qid)["entities"][qid]["claims"].get("P1082", [])
    best = None
    for c in claims:
        value = c["mainsnak"].get("datavalue", {}).get("value", {}).get("amount")
        when = c.get("qualifiers", {}).get("P585", [{}])[0].get("datavalue", {}).get("value", {}).get("time", "")
        if value and (best is None or when > best[1]):
            best = (int(float(value)), when[1:11], qid)
    return best


def main():
    wiki = json.load(open(sys.argv[1], encoding="utf-8"))
    wiki["treptow"]["wiki"] = "Berlin-Alt-Treptow"
    result = {}
    for kid, (ba, ba_addr, pol, pol_addr, phone) in OFFICIAL.items():
        pop = population(wiki[kid]["wiki"])
        entry = {
            "buergeramtName": ba, "buergeramtAddress": ba_addr, "policeStation": pol, "policeAddress": pol_addr, "policePhone": phone,
            "rentIndex": "", "photoCredits": wiki[kid]["media"],
            "sources": {"buergeramt": BA_URL, "polizei": POLICE_URL, "checked": "2026-11-06"},
        }
        if wiki[kid]["media"]:
            entry["impressionImages"] = [m["url"] for m in wiki[kid]["media"]]
        if pop:
            entry["population"] = "{:,}".format(pop[0]).replace(",", ".")
            entry["populationDate"] = pop[1]
            entry["sources"]["population"] = "https://www.wikidata.org/wiki/" + pop[2]
        result[kid] = entry
        print(kid.ljust(17), str(entry.get("population", "-")).ljust(10), entry.get("populationDate", "-").ljust(11), len(wiki[kid]["media"]))
        time.sleep(0.3)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
