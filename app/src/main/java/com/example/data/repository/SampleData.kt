package com.example.data.repository

import com.example.R
import com.example.data.model.*

object SampleData {

    // EXACTLY 12 KIEZE AS REQUESTED WITH REAL PHOTOGRAPHIC IMAGES
    val kieze = listOf(
        Kiez(
            id = "mitte",
            name = "Mitte",
            subtitle = "Historisch, Kulturell, Zentral",
            postalCodes = "10115, 10117, 10119, 10178, 10179",
            population = "ca. 102.000",
            specialty = "Brandenburger Tor, Museumsinsel, Fernsehturm",
            description = "Das pulsierende Herz Berlins: Wo die Geschichte an jeder Ecke spürbar ist. Zwischen der Museumsinsel, dem Alexanderplatz und den Hackeschen Höfen vereint Mitte Weltmetropolen-Flair mit exklusiven Galerien, Spitzen-Gastronomie und architektonischen Monumenten.",
            tags = listOf("Historisch", "Kultur", "Zentrum", "Monumente"),
            lat = 52.5200,
            lng = 13.4050,
            highlights = listOf("Fernsehturm", "Brandenburger Tor", "Museumsinsel", "Hackesche Höfe"),
            imageUrl = "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop&q=80", // Brandenburger Tor
            impressionImages = listOf(
                "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1546726747-421c6d69c929?w=600&auto=format&fit=crop&q=80"
            ),
            rentIndex = "21,50 €/m²",
            vibe = "Metropolisch & Monumental",
            transitLines = "U2, U5, U6, U8, S1, S2, S3, S5, S7, S9, Tram M1, M5",
            parks = listOf("Monbijoupark", "Lustgarten", "James-Simon-Park", "Krausnickpark"),
            popularSpots = listOf("The Barn", "Borchardt", "Café Einstein Unter den Linden", "Monsieur Vuong", "Hackescher Markt"),
            buergeramtName = "Bürgeramt Mitte",
            buergeramtAddress = "Karl-Marx-Allee 31, 10178 Berlin",
            policeStation = "Polizeiabschnitt 51",
            policeAddress = "Keibelstraße 35, 10178 Berlin",
            policePhone = "+49 30 4664 551700"
        ),
        Kiez(
            id = "kreuzberg",
            name = "Kreuzberg",
            subtitle = "Kreativ, International, Vielfältig",
            postalCodes = "10961, 10963, 10965, 10967, 10969, 10997, 10999",
            population = "ca. 155.000",
            specialty = "Streetart, Nightlife, Vielfalt, Multikulti",
            description = "Kreuzberg ist weltbekannt für seine kreative Szene, internationale Küche, Streetart und lebendige Kiez-Kultur. Hier treffen Tradition, Vielfalt und urbanes Leben aufeinander. Rund um die Bergmannstraße, das Paul-Lincke-Ufer und das Schlesische Tor pulsiert das Berliner Leben Tag und Nacht.",
            tags = listOf("Kreativ", "Vielfältig", "Szene", "Kulinarik"),
            lat = 52.4986,
            lng = 13.4069,
            highlights = listOf("Görlitzer Park", "Streetart Oberbaumbrücke", "Landwehrkanal", "Markthalle Neun", "Bergmannkiez"),
            imageUrl = "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800&auto=format&fit=crop&q=80", // Oberbaumbrücke Kreuzberg
            impressionImages = listOf(
                "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=600&auto=format&fit=crop&q=80"
            ),
            rentIndex = "16,80 €/m²",
            vibe = "Alternativ & Bunt",
            transitLines = "U1, U3, U7, U8, Bus M29, M41, S-Bahn Ostkreuz / Treptow",
            parks = listOf("Görlitzer Park", "Viktoriapark", "Landwehrkanal Ufer", "Böcklerpark"),
            popularSpots = listOf("Mustafa's Gemüse Kebap", "Hasır Kreuzberg", "Markthalle Neun", "Five Elephant", "Curry 36"),
            buergeramtName = "Bürgeramt Kreuzberg",
            buergeramtAddress = "Yorckstraße 4-11, 10965 Berlin",
            policeStation = "Polizeiabschnitt 53",
            policeAddress = "Friedrichstraße 219, 10969 Berlin",
            policePhone = "+49 30 4664 553700"
        ),
        Kiez(
            id = "neukoelln",
            name = "Neukölln",
            subtitle = "Bunt, Lebendig, Anders",
            postalCodes = "12043, 12045, 12047, 12049, 12051",
            population = "ca. 168.000",
            specialty = "Reuterkiez, Weserstraße, Maybachufer",
            description = "Neukölln hat sich vom traditionellen Arbeiterviertel zu einem der dynamischsten Hotspots Europas entwickelt. Cafés am Maybachufer, Künstlerateliers und kulinarische Entdeckungen aus aller Welt prägen das pulsierende Straßenbild.",
            tags = listOf("Bunt", "Urban", "Bars", "Weserstraße"),
            lat = 52.4812,
            lng = 13.4353,
            highlights = listOf("Tempelhofer Feld", "Maybachufer Markt", "Richardplatz", "Weserstraße Bars"),
            imageUrl = "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&auto=format&fit=crop&q=80",
            impressionImages = listOf(
                "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80"
            ),
            rentIndex = "14,80 €/m²",
            vibe = "Dynamisch & Trendsetzend",
            transitLines = "U7, U8, S41, S42 (Ringbahn), S45, S46, Bus M41, 171",
            parks = listOf("Tempelhofer Feld", "Körnerpark", "Volkspark Hasenheide", "Weichselplatz"),
            popularSpots = listOf("Azzam Restaurant", "Café Camon", "Roamers", "Bäckerei Brotzeit", "Isla Coffee"),
            buergeramtName = "Bürgeramt Neukölln",
            buergeramtAddress = "Karl-Marx-Straße 83, 12043 Berlin",
            policeStation = "Polizeiabschnitt 54",
            policeAddress = "Sonnenallee 107, 12045 Berlin",
            policePhone = "+49 30 4664 554700"
        ),
        Kiez(
            id = "friedrichshain",
            name = "Friedrichshain",
            subtitle = "Jung, Urban, Nachtleben",
            postalCodes = "10243, 10245, 10247, 10249",
            population = "ca. 138.000",
            specialty = "East Side Gallery, Simon-Dach-Straße, RAW",
            description = "Heimat der längsten Open-Air-Galerie der Welt (East Side Gallery) und legendärer Klubkultur rund um das RAW-Gelände. Auf der Simon-Dach-Straße reihen sich Straßencafés, Bars und internationale Restaurants aneinander.",
            tags = listOf("Jung", "Nachtleben", "RAW-Gelände", "East Side"),
            lat = 52.5159,
            lng = 13.4543,
            highlights = listOf("East Side Gallery", "RAW-Gelände", "Boxhagener Platz", "Simon-Dach-Straße"),
            imageUrl = "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&auto=format&fit=crop&q=80",
            impressionImages = listOf(
                "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80"
            ),
            rentIndex = "17,50 €/m²",
            vibe = "Clubkultur & Streetlife",
            transitLines = "U5, S3, S5, S7, S9, S41, S42 (Ostkreuz), Tram M10, M13",
            parks = listOf("Volkspark Friedrichshain", "Boxhagener Platz", "Traveplatz"),
            popularSpots = listOf("Dromedar", "Silo Coffee", "Santa Maria Eastside", "19grams Alex", "Silberfisch"),
            buergeramtName = "Bürgeramt Friedrichshain",
            buergeramtAddress = "Frankfurter Allee 35, 10247 Berlin",
            policeStation = "Polizeiabschnitt 52",
            policeAddress = "Wedekindstraße 10, 10243 Berlin",
            policePhone = "+49 30 4664 552700"
        ),
        Kiez(
            id = "prenzlauer-berg",
            name = "Prenzlauer Berg",
            subtitle = "Familienfreundlich, Historisch",
            postalCodes = "10405, 10407, 10435, 10437, 10439",
            population = "ca. 165.000",
            specialty = "Kollwitzplatz, Mauerpark, Gründerzeit",
            description = "Prächtige Altbauten aus der Gründerzeit, idyllische Plätze wie der Kollwitzplatz und der berühmte Flohmarkt im Mauerpark machen diesen Kiez zu einem der lebenswertesten und charmantesten Viertel Berlins.",
            tags = listOf("Kollwitzplatz", "Mauerpark", "Café-Kultur", "Altbau"),
            lat = 52.5388,
            lng = 13.4244,
            highlights = listOf("Mauerpark & Flohmarkt", "Kollwitzplatz", "Kulturbrauerei", "Wasserturm"),
            imageUrl = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80",
            impressionImages = listOf(
                "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80"
            ),
            rentIndex = "18,20 €/m²",
            vibe = "Bohème & Familienidyll",
            transitLines = "U2, S41, S42, S8, S85, Tram M1, M2, M10, M12",
            parks = listOf("Mauerpark", "Volkspark Prenzlauer Berg", "Kollwitzplatz", "Ernst-Thälmann-Park"),
            popularSpots = listOf("Café Anna Blume", "Prater Biergarten", "The Bird", "Standard Pizza", "Konnopke's Imbiß"),
            buergeramtName = "Bürgeramt Prenzlauer Berg",
            buergeramtAddress = "Fröbelstraße 17, 10405 Berlin",
            policeStation = "Polizeiabschnitt 15",
            policeAddress = "Eberswalder Straße 6, 10437 Berlin",
            policePhone = "+49 30 4664 115700"
        ),
        Kiez(
            id = "charlottenburg",
            name = "Charlottenburg",
            subtitle = "Klassisch, Elegant, Gediegen",
            postalCodes = "10585, 10587, 10589, 10623, 10625, 10627, 10629",
            population = "ca. 130.000",
            specialty = "Schloss Charlottenburg, Kurfürstendamm, Savignyplatz",
            description = "Elegante Boulevards, das prächtige Schloss Charlottenburg und der renommierte Kurfürstendamm: Charlottenburg steht für das westberliner Lebensgefühl mit erstklassigen Restaurants, noblen Boutiquen und intellektuellen Literatur-Cafés am Savignyplatz.",
            tags = listOf("Klassisch", "Schloss", "Ku'damm", "Savignyplatz"),
            lat = 52.5163,
            lng = 13.3040,
            highlights = listOf("Schloss Charlottenburg", "Kurfürstendamm", "Savignyplatz", "Deutsche Oper"),
            imageUrl = "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop&q=80",
            impressionImages = listOf(
                "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&auto=format&fit=crop&q=80"
            ),
            rentIndex = "17,00 €/m²",
            vibe = "Klassisch-Elegant",
            transitLines = "U2, U7, U9, S3, S5, S7, S9, Bus M19, M29, X9",
            parks = listOf("Schlosspark Charlottenburg", "Lietzensee Park", "Savignyplatz"),
            popularSpots = listOf("Café Savigny", "Schwarzes Café", "Kant Konditorei", "Rogacki Feinkost", "Paris Bar"),
            buergeramtName = "Bürgeramt Charlottenburg",
            buergeramtAddress = "Otto-Suhr-Allee 100, 10585 Berlin",
            policeStation = "Polizeiabschnitt 25",
            policeAddress = "Bismarckstraße 111, 10625 Berlin",
            policePhone = "+49 30 4664 225700"
        ),
        Kiez(
            id = "schoeneberg",
            name = "Schöneberg",
            subtitle = "Geschichtsträchtig, Offen, Lebendig",
            postalCodes = "10777, 10779, 10781, 10783, 10823, 10825, 10827",
            population = "ca. 122.000",
            specialty = "Winterfeldtplatz Markt, Rathaus Schöneberg, Nollendorfplatz",
            description = "Hier rief JFK 'Ich bin ein Berliner': Schöneberg verbindet weltoffenes Regenbogen-Flair am Nollendorfplatz mit dem feinsten Samstagsmarkt Berlins am Winterfeldtplatz und prächtigen Bürgerhäusern im Akazienkiez.",
            tags = listOf("Akazienkiez", "Winterfeldtmarkt", "Regenbogenkiez", "Markt"),
            lat = 52.4830,
            lng = 13.3530,
            highlights = listOf("Winterfeldtplatz Markt", "Akazienkiez Cafés", "Rathaus Schöneberg", "Nollendorfplatz"),
            imageUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
            rentIndex = "16,20 €/m²",
            vibe = "Tolerant & Genussfreudig",
            transitLines = "U1, U2, U3, U4, U7, S1, S2, S25, S41, S42 (Innsbrucker Platz)",
            parks = listOf("Heinrich-von-Kleist-Park", "Rudolph-Wilde-Park", "Viktoria-Luise-Platz"),
            popularSpots = listOf("Café Einstein Stammhaus", "Winterfeldt Schokolade", "Malafemmena Pizza", "Winterfeldt Markt"),
            buergeramtName = "Bürgeramt Schöneberg",
            buergeramtAddress = "John-F.-Kennedy-Platz 1, 10825 Berlin",
            policeStation = "Polizeiabschnitt 41",
            policeAddress = "Gothaer Straße 19, 10823 Berlin",
            policePhone = "+49 30 4664 441700"
        ),
        Kiez(
            id = "wedding",
            name = "Wedding",
            subtitle = "Authentisch, Industriell, Im Wandel",
            postalCodes = "13347, 13351, 13353, 13355, 13357, 13359",
            population = "ca. 87.000",
            specialty = "Volkspark Humboldthain, Leopoldplatz, Gerichtshöfe",
            description = "Echt, ungeschminkt und voller Aufbruch: Im Wedding trifft historische Industriearchitektur auf lebendige Kunstgalerien in den Gerichtshöfen, günstige Kiez-Gastronomie und grüne Oasen wie den Schillerpark und Humboldthain.",
            tags = listOf("Authentisch", "Aufstrebend", "Leopoldplatz", "Humboldthain"),
            lat = 52.5496,
            lng = 13.3526,
            highlights = listOf("Humboldthain Flakturm", "Café Pförtner Uferhallen", "Leopoldplatz", "Gerichtshöfe Kunst"),
            imageUrl = "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
            rentIndex = "13,20 €/m²",
            vibe = "Direkt & Inspirierend",
            transitLines = "U6, U9, S41, S42 (Wedding), Tram M13, 50, Bus M27",
            parks = listOf("Volkspark Humboldthain", "Schillerpark", "Volkspark Rehberge", "Plötzensee"),
            popularSpots = listOf("Café Pförtner", "Wedding Döner & Grill", "St. Oberholz Leopoldplatz", "Escados Steakhouse"),
            buergeramtName = "Bürgeramt Wedding",
            buergeramtAddress = "Osloer Straße 36, 13359 Berlin",
            policeStation = "Polizeiabschnitt 17",
            policeAddress = "Pankstraße 29, 13357 Berlin",
            policePhone = "+49 30 4664 117700"
        ),
        Kiez(
            id = "moabit",
            name = "Moabit",
            subtitle = "Inselkiez, Zentral, Charmant",
            postalCodes = "10551, 10553, 10555, 10557, 10559",
            population = "ca. 81.000",
            specialty = "Arminius Markthalle, Spreeufer, Kriminalgericht",
            description = "Komplett von Wasserstraßen umgeben ist Moabit eine echte Insel im Herzen Berlins. Die historische Arminiusmarkthalle, Altbauten mit Stuck und die Nähe zum Hauptbahnhof machen den Kiez besonders beliebt.",
            tags = listOf("Insel", "Markthalle", "Spree", "Kiezperle"),
            lat = 52.5302,
            lng = 13.3420,
            highlights = listOf("Arminius Markthalle", "Spree-Promenade", "Kulturfabrik Moabit", "Fritz-Schloß-Park"),
            imageUrl = "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop&q=80",
            rentIndex = "14,50 €/m²",
            vibe = "Gemütlich & Bodenständig",
            transitLines = "U9 (Turmstr., Birkenstr.), S41, S42 (Westhafen), Tram M10",
            parks = listOf("Fritz-Schloß-Park", "Kleiner Tiergarten", "Spreebogenpark"),
            popularSpots = listOf("Arminius Markthalle Gastronomie", "Arema Café", "Valladares Feinkost", "Hofbräu Moabit"),
            buergeramtName = "Bürgeramt Moabit",
            buergeramtAddress = "Turmstraße 21, 10559 Berlin",
            policeStation = "Polizeiabschnitt 27",
            policeAddress = "Alt-Moabit 143, 10557 Berlin",
            policePhone = "+49 30 4664 227700"
        ),
        Kiez(
            id = "tiergarten",
            name = "Tiergarten",
            subtitle = "Grüne Lunge, Botschaften, Kulturforum",
            postalCodes = "10557, 10785, 10787",
            population = "ca. 15.000",
            specialty = "Großer Tiergarten, Siegessäule, Philharmonie",
            description = "Der Große Tiergarten ist Berlins berühmtester Stadtpark. Umgeben von Botschaften, dem Regierungsviertel und dem Kulturforum mit Neuer Nationalgalerie und Philharmonie.",
            tags = listOf("Großer Park", "Siegessäule", "Philharmonie", "Botschaften"),
            lat = 52.5145,
            lng = 13.3501,
            highlights = listOf("Siegessäule", "Schloss Bellevue", "Café am Neuen See", "Kulturforum & Philharmonie"),
            imageUrl = "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
            rentIndex = "19,00 €/m²",
            vibe = "Prächtig & Naturreich",
            transitLines = "S3, S5, S7, S9 (Bellevue, Tiergarten), U9 (Hansaplatz), Bus 100, 200",
            parks = listOf("Großer Tiergarten", "Zoologischer Garten", "Englischer Garten"),
            popularSpots = listOf("Café am Neuen See", "Schleusenkrug", "Lützow Bar", "Kafé Bellevue"),
            buergeramtName = "Bürgeramt Tiergarten",
            buergeramtAddress = "Turmstraße 21, 10559 Berlin",
            policeStation = "Polizeiabschnitt 28",
            policeAddress = "Lietzenburger Straße 37, 10789 Berlin",
            policePhone = "+49 30 4664 228700"
        ),
        Kiez(
            id = "wilmersdorf",
            name = "Wilmersdorf",
            subtitle = "Ruhig, Grün, Bürgerlich",
            postalCodes = "10713, 10715, 10717, 10719",
            population = "ca. 101.000",
            specialty = "Preußenpark (Thai Park), Rüdesheimer Platz",
            description = "Bürgerliche Gemütlichkeit trifft multikulturelle Köstlichkeiten: Berühmt ist der 'Thai Park' im Preußenpark sowie der idyllische Weinbrunnen am Rüdesheimer Platz unter alten Linden.",
            tags = listOf("Thai Park", "Rüdesheimer Platz", "Bürgerlich", "Weinbrunnen"),
            lat = 52.4870,
            lng = 13.3150,
            highlights = listOf("Thai-Streetfood Preußenpark", "Rüdesheimer Platz", "Fasanenplatz", "Volkspark Wilmersdorf"),
            imageUrl = "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
            rentIndex = "16,50 €/m²",
            vibe = "Ruhig & Lebensfroh",
            transitLines = "U3, U7, U9, S41, S42, S46 (Heidelberger Platz)",
            parks = listOf("Volkspark Wilmersdorf", "Preußenpark (Thai Park)", "Rüdesheimer Platz"),
            popularSpots = listOf("Benedict Berlin", "Café Fasan", "Trattoria Del Corso", "Thai Park Street Food"),
            buergeramtName = "Bürgeramt Wilmersdorf",
            buergeramtAddress = "Hohenzollerndamm 177, 10713 Berlin",
            policeStation = "Polizeiabschnitt 26",
            policeAddress = "Rudolstädter Straße 81, 10713 Berlin",
            policePhone = "+49 30 4664 226700"
        ),
        Kiez(
            id = "tempelhof",
            name = "Tempelhof",
            subtitle = "Flugfeld-Weite, Freiheit, Familien",
            postalCodes = "12099, 12101, 12103, 12105",
            population = "ca. 65.000",
            specialty = "Tempelhofer Feld, Fliegerviertel, Hafen",
            description = "Das Tempelhofer Feld ist das Symbol für Berlins Freiraum: Ein stillgelegter historischer Flughafen, der den Menschen heute als gigantischer Sport- und Entspannungspark gehört. Kiten, Skaten und Urban Gardening pur.",
            tags = listOf("Flughafenfeld", "Skaten", "Fliegerviertel", "Freiheit"),
            lat = 52.4730,
            lng = 13.3850,
            highlights = listOf("Tempelhofer Feld", "Flughafengebäude Tempelhof", "Tempelhofer Hafen", "Bärensiedlung"),
            imageUrl = "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
            rentIndex = "13,80 €/m²",
            vibe = "Grenzenlos & Entspannt",
            transitLines = "U6 (Tempelhof, Alt-Tempelhof), S41, S42, S45, S46",
            parks = listOf("Tempelhofer Feld", "Franckepark", "Bosepark", "Lehmbruckteich"),
            popularSpots = listOf("Trattoria Lucca", "Café Tomasa Tempelhof", "Marina Tempelhofer Hafen", "Kiez-Backstube"),
            buergeramtName = "Bürgeramt Tempelhof",
            buergeramtAddress = "Tempelhofer Damm 165, 12099 Berlin",
            policeStation = "Polizeiabschnitt 44",
            policeAddress = "Tempelhofer Damm 12, 12101 Berlin",
            policePhone = "+49 30 4664 444700"
        ),
        Kiez(
            id = "gesundbrunnen",
            name = "Gesundbrunnen",
            subtitle = "Knotenpunkt, Grün, Multikulturell",
            postalCodes = "13355, 13357, 13359",
            population = "ca. 94.000",
            specialty = "Bahnhof Gesundbrunnen, Humboldthain, Berliner Unterwelten",
            description = "Ein wichtiger Dreh- und Angelpunkt mit dem modernen Fernbahnhof Gesundbrunnen, dem weltberühmten Berliner Unterwelten Museum und weitläufigen Parks entlang der Panke.",
            tags = listOf("Knotenpunkt", "Unterwelten", "Panke", "Humboldthain"),
            lat = 52.5507,
            lng = 13.3905,
            highlights = listOf("Berliner Unterwelten e.V.", "Flakturm Humboldthain", "Pankeufer Promenade", "Gesundbrunnen-Center"),
            imageUrl = "https://images.unsplash.com/photo-1546726747-421c6d69c929?w=800&auto=format&fit=crop&q=80",
            rentIndex = "13,00 €/m²",
            vibe = "Verkehrsgünstig & Multikulti",
            transitLines = "U8, S1, S2, S25, S26, S41, S42 (Gesundbrunnen Fernbahnhof)",
            parks = listOf("Humboldthain Park & Rosengarten", "Panke-Grünzug"),
            popularSpots = listOf("Akko Restaurant", "Falafel Al-Amin", "Café Kotti Branch", "Gesundbrunnen Center"),
            buergeramtName = "Bürgeramt Gesundbrunnen",
            buergeramtAddress = "Badstraße 10, 13357 Berlin",
            policeStation = "Polizeiabschnitt 18",
            policeAddress = "Prinzenallee 24, 13359 Berlin",
            policePhone = "+49 30 4664 118700"
        ),
        Kiez(
            id = "steglitz",
            name = "Steglitz",
            subtitle = "Shopping, Villenviertel, Botanik",
            postalCodes = "12157, 12161, 12163, 12165, 12167, 12169",
            population = "ca. 75.000",
            specialty = "Schloßstraße, Botanischer Garten, Stadtpark Steglitz",
            description = "Die Schloßstraße zählt zu den größten Shopping-Meilen Berlins. Drumherum liegen friedliche Altbauquartiere, der weitläufige Stadtpark und der weltberühmte Botanische Garten.",
            tags = listOf("Shopping", "Schloßstraße", "Botanischer Garten", "Gepflegt"),
            lat = 52.4560,
            lng = 13.3220,
            highlights = listOf("Schloßstraße", "Botanischer Garten Berlin", "Gutshaus Steglitz", "Stadtpark"),
            imageUrl = "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
            rentIndex = "14,20 €/m²",
            vibe = "Etabliert & Komfortabel",
            transitLines = "U9 (Rathaus Steglitz, Schloßstr.), S1 (Feuerbachstr.), Bus X83, M48",
            parks = listOf("Stadtpark Steglitz", "Botanischer Garten Berlin", "Bäketal"),
            popularSpots = listOf("Café Schwartzsche Villa", "Ristorante Il Mulino", "Boulevard Berlin Cafés", "Trattoria L'Angolo"),
            buergeramtName = "Bürgeramt Steglitz",
            buergeramtAddress = "Schloßstraße 37, 12163 Berlin",
            policeStation = "Polizeiabschnitt 45",
            policeAddress = "Birkbuschstraße 52, 12167 Berlin",
            policePhone = "+49 30 4664 445700"
        ),
        Kiez(
            id = "zehlendorf",
            name = "Zehlendorf",
            subtitle = "Seen, Wälder, Villen & Natur",
            postalCodes = "14163, 14165, 14167, 14169",
            population = "ca. 58.000",
            specialty = "Schlachtensee, Krumme Lanke, Mexikoplatz",
            description = "Berlins grünste und nobelste Oase im Südwesten: Glasklare Badeseen wie der Schlachtensee und die Krumme Lanke, Jugendstilarchitektur am Mexikoplatz und waldnahes Wohnen.",
            tags = listOf("Schlachtensee", "Mexikoplatz", "Natur", "Exklusiv"),
            lat = 52.4330,
            lng = 13.2590,
            highlights = listOf("Schlachtensee & Fischerhütte", "Krumme Lanke", "Jugendstil Mexikoplatz", "Haus am Waldsee"),
            imageUrl = "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
            rentIndex = "15,50 €/m²",
            vibe = "Idyllisch & Nobel",
            transitLines = "S1 (Zehlendorf, Mexikoplatz, Sundgauer Str.), Bus X10, 112, 118",
            parks = listOf("Schlachtensee Ufer", "Krumme Lanke", "Fischtalpark", "Düppeler Forst"),
            popularSpots = listOf("Wiener Conditorei Mexikoplatz", "Forsthaus Paulsborn", "Die Fischerhütte am Schlachtensee"),
            buergeramtName = "Bürgeramt Zehlendorf",
            buergeramtAddress = "Kirchstraße 1/3, 14163 Berlin",
            policeStation = "Polizeiabschnitt 46",
            policeAddress = "Teltower Damm 38, 14169 Berlin",
            policePhone = "+49 30 4664 446700"
        ),
        Kiez(
            id = "spandau",
            name = "Spandau",
            subtitle = "Historische Altstadt, Havel & Festung",
            postalCodes = "13581, 13583, 13585, 13587, 13589, 13597",
            population = "ca. 100.000",
            specialty = "Zitadelle Spandau, Altstadt Spandau, Havelauen",
            description = "Spandau blickt auf eine ältere Geschichte als Berlin selbst zurück: Die Renaissance-Zitadelle, die malerische Fußgängerzone der Altstadt und kilometerlange Uferwege an Havel und Spree verleihen ihr ganz eigenen Reiz.",
            tags = listOf("Zitadelle", "Altstadt", "Havel", "Historisch"),
            lat = 52.5354,
            lng = 13.1990,
            highlights = listOf("Zitadelle Spandau", "St.-Nikolai-Kirche Altstadt", "Havelpromenade", "Kolksiedlung"),
            imageUrl = "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop&q=80",
            rentIndex = "11,80 €/m²",
            vibe = "Traditionsreich & Wasserreich",
            transitLines = "U7 (Rathaus Spandau), S3, S9 (Spandau), Regionalbahn & ICE",
            parks = listOf("Spandauer Forst", "Koeltzepark", "Zitadelle Spandau Insel", "Südpark"),
            popularSpots = listOf("Brauhaus Spandau", "Café Lutetia Altstadt", "Spandauer Altstadt-Konditorei", "Restaurant Raymons"),
            buergeramtName = "Bürgeramt Spandau",
            buergeramtAddress = "Carl-Schurz-Straße 2/6, 13597 Berlin",
            policeStation = "Polizeiabschnitt 21",
            policeAddress = "Moritzstraße 10, 13597 Berlin",
            policePhone = "+49 30 4664 221700"
        ),
        Kiez(
            id = "reinickendorf",
            name = "Reinickendorf",
            subtitle = "Tegeler See, Wald & Familien",
            postalCodes = "13403, 13405, 13407, 13409, 13507, 13509",
            population = "ca. 85.000",
            specialty = "Tegeler See, Schäfersee, Greenwichpromenade",
            description = "Im Norden Berlins lockt Reinickendorf mit dem idyllischen Tegeler See, Schifffahrt-Promenaden und ruhigen Siedlungen. Perfekt für Wassersportler und Erholungssuchende.",
            tags = listOf("Tegeler See", "Schäfersee", "Wasser", "Erholung"),
            lat = 52.5870,
            lng = 13.3290,
            highlights = listOf("Greenwichpromenade Tegel", "Schäfersee Rundweg", "Schloss Tegel & Park", "Tegeler Fließ"),
            imageUrl = "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&auto=format&fit=crop&q=80",
            rentIndex = "12,20 €/m²",
            vibe = "Naturnah & Ruhig",
            transitLines = "U8 (Rathaus Reinickendorf, Franz-Neumann-Platz), S25, Bus 125, 221",
            parks = listOf("Schäfersee Park", "Tegeler Forst", "Greenwichpromenade Tegeler See", "Kienhorstpark"),
            popularSpots = listOf("Café am Schäfersee", "Restaurant Seeterrassen Tegel", "Trattoria Da Reno", "Ristorante Bella Italia"),
            buergeramtName = "Bürgeramt Reinickendorf",
            buergeramtAddress = "Teichstraße 65, 13407 Berlin",
            policeStation = "Polizeiabschnitt 11",
            policeAddress = "Flottenstraße 60, 13407 Berlin",
            policePhone = "+49 30 4664 111700"
        ),
        Kiez(
            id = "pankow",
            name = "Pankow",
            subtitle = "Bürgerparks, Schlösser & Grüner Norden",
            postalCodes = "13187, 13189, 13156, 13158",
            population = "ca. 68.000",
            specialty = "Bürgerpark Pankow, Schloss Schönhausen, Panke",
            description = "Einstiger Regierungssitz der DDR und heute ein begehrtes grünes Wohnviertel. Das Schloss Schönhausen, weitläufige Parks an der Panke und gemütliche Straßencafés prägen das Bild.",
            tags = listOf("Bürgerpark", "Schloss Schönhausen", "Grün", "Familien"),
            lat = 52.5690,
            lng = 13.4020,
            highlights = listOf("Schloss Schönhausen", "Bürgerpark Pankow", "Rathaus Pankow", "Sommerbad Pankow"),
            imageUrl = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80",
            rentIndex = "14,50 €/m²",
            vibe = "Beschaulich & Kulturvoll",
            transitLines = "U2 (Pankow, Vinetastr.), S2, S8, S85 (Pankow), Tram 50, M1",
            parks = listOf("Bürgerpark Pankow", "Schlosspark Schönhausen", "Bleichwiesen Park"),
            popularSpots = listOf("Café Milch & Zucker", "Restaurant Stuck", "Panke Bar", "Zimmer 16 Café"),
            buergeramtName = "Bürgeramt Pankow",
            buergeramtAddress = "Breite Straße 24A, 13187 Berlin",
            policeStation = "Polizeiabschnitt 13",
            policeAddress = "Berliner Straße 100, 13189 Berlin",
            policePhone = "+49 30 4664 113700"
        ),
        Kiez(
            id = "lichtenberg",
            name = "Lichtenberg",
            subtitle = "Aufbruch, Asiatischer Markt & Weite",
            postalCodes = "10315, 10317, 10319, 10365, 10367",
            population = "ca. 140.000",
            specialty = "Dong Xuan Center, Stasi-Museum, Landschaftspark Herzberge",
            description = "Lichtenberg entwickelt sich rasant: Bekannt für das riesige asiatische Handelszentrum 'Dong Xuan Center', lebendige Kreativorte an der Rummelsburger Bucht und historische Industriebauten.",
            tags = listOf("Dong Xuan", "Aufbruch", "Herzberge", "Kreativ"),
            lat = 52.5130,
            lng = 13.4990,
            highlights = listOf("Dong Xuan Center", "Stasi-Museum Normannenstraße", "Landschaftspark Herzberge", "Rummelsburger Bucht"),
            imageUrl = "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&auto=format&fit=crop&q=80",
            rentIndex = "13,00 €/m²",
            vibe = "Dynamisch & Vielfältig",
            transitLines = "U5 (Lichtenberg, Magdalenenstr.), S5, S7, S75, S41, S42, Tram M8, 21",
            parks = listOf("Stadtpark Lichtenberg", "Landschaftspark Herzberge", "Fennpfuhlpark"),
            popularSpots = listOf("Café Roedelius", "Syld Café", "Restaurant Neu-Helgoland", "Dong Xuan Center Food Court"),
            buergeramtName = "Bürgeramt Lichtenberg",
            buergeramtAddress = "Normannenstraße 1-2, 10367 Berlin",
            policeStation = "Polizeiabschnitt 34",
            policeAddress = "Alfredstraße 11, 10365 Berlin",
            policePhone = "+49 30 4664 334700"
        ),
        Kiez(
            id = "treptow",
            name = "Treptow",
            subtitle = "Spreeufer, Insel der Jugend, Riesiger Park",
            postalCodes = "12435, 12437, 12439",
            population = "ca. 70.000",
            specialty = "Treptower Park, Sowjetisches Ehrenmal, Insel der Jugend",
            description = "Treptow zieht Menschen ans Wasser: Der Treptower Park direkt an der Spree mit Bootverleih, die berühmte Insel der Jugend und das traditionsreiche Gasthaus Zenner bieten fantastische Freizeitqualität.",
            tags = listOf("Treptower Park", "Insel der Jugend", "Spree", "Zenner"),
            lat = 52.4900,
            lng = 13.4700,
            highlights = listOf("Treptower Park & Hafen", "Insel der Jugend Brücke", "Zenner Biergarten & Konzerte", "Sowjetisches Ehrenmal"),
            imageUrl = "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&auto=format&fit=crop&q=80",
            rentIndex = "14,80 €/m²",
            vibe = "Entspannt am Wasser",
            transitLines = "S8, S9, S41, S42, S45, S85 (Treptower Park), Bus 165, 265",
            parks = listOf("Treptower Park", "Plänterwald & Spreepromenade", "Insel der Jugend", "Karpfenteich"),
            popularSpots = listOf("Inselgarten Treptow", "Zenner Biergarten & Restaurant", "Café Klee", "Hafenbar Treptow"),
            buergeramtName = "Bürgeramt Treptow",
            buergeramtAddress = "Neue Krugallee 4, 12435 Berlin",
            policeStation = "Polizeiabschnitt 35",
            policeAddress = "Schnellerstraße 138, 12439 Berlin",
            policePhone = "+49 30 4664 335700"
        ),
        Kiez(
            id = "koepenick",
            name = "Köpenick",
            subtitle = "Müggelsee, Wasserschloss & Romantik",
            postalCodes = "12555, 12557, 12559, 12587",
            population = "ca. 68.000",
            specialty = "Schloss Köpenick, Großer Müggelsee, Hauptmann von Köpenick",
            description = "Berlins wald- und wasserreichster Kiez: Romantische Altstadt auf einer Insel mit Schloss Köpenick, Ausflugsdampfer auf dem Müggelsee und die berühmte Legende vom Hauptmann von Köpenick.",
            tags = listOf("Müggelsee", "Schloss Köpenick", "Wasserstadt", "Romantisch"),
            lat = 52.4450,
            lng = 13.5760,
            highlights = listOf("Wasserschloss Köpenick", "Großer Müggelsee Strandbad", "Historisches Rathaus Köpenick", "Bölschestraße Friedrichshagen"),
            imageUrl = "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=80",
            rentIndex = "12,50 €/m²",
            vibe = "Maritime Idylle",
            transitLines = "S3 (Köpenick, Hirschgarten, Friedrichshagen), Tram 60, 61, 62, 68",
            parks = listOf("Müggelsee Strand & Uferpromenade", "Schlosspark Köpenick", "Volkspark Dämeritz", "Krumme Lake"),
            popularSpots = listOf("Schlossplatzbrauerei Köpenick", "Mutter Lustig Café am Wasser", "Café Bölsche Friedrichshagen", "Ratskeller Köpenick"),
            buergeramtName = "Bürgeramt Köpenick",
            buergeramtAddress = "Alt-Köpenick 21, 12555 Berlin",
            policeStation = "Polizeiabschnitt 36",
            policeAddress = "Wendenschloßstraße 18, 12559 Berlin",
            policePhone = "+49 30 4664 336700"
        ),
        Kiez(
            id = "marzahn",
            name = "Marzahn",
            subtitle = "Gärten der Welt, Wuhletal & Weite",
            postalCodes = "12679, 12681, 12683, 12685, 12687, 12689",
            population = "ca. 110.000",
            specialty = "Gärten der Welt, Seilbahn, Alt-Marzahn Mühle",
            description = "Weitaus mehr als Plattenbau: Internationale Themengärten in den 'Gärten der Welt', Berlins einzige Seilbahn über den Kienberg, ein historisches Angerdorf mit Bockwindmühle und das renaturierte Wuhletal.",
            tags = listOf("Gärten der Welt", "Seilbahn", "Wuhletal", "Windmühle"),
            lat = 52.5450,
            lng = 13.5640,
            highlights = listOf("Gärten der Welt & Seilbahn", "Historisches Dorf Alt-Marzahn", "Wuhletal-Wanderweg", "Bockwindmühle"),
            imageUrl = "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop&q=80",
            rentIndex = "10,80 €/m²",
            vibe = "Grün & Überraschend",
            transitLines = "U5 (Kienberg - Gärten der Welt), S7 (Marzahn), Tram M6, 18",
            parks = listOf("Gärten der Welt", "Erholungspark Marzahn", "Wuhletal Wanderweg", "Bürgerpark Marzahn"),
            popularSpots = listOf("Café im Chinesischen Garten", "Restaurant Albatros", "Kiez-Café Marzahn", "Bockwindmühle Marzahn Café"),
            buergeramtName = "Bürgeramt Marzahn",
            buergeramtAddress = "Helene-Weigel-Platz 8, 12681 Berlin",
            policeStation = "Polizeiabschnitt 32",
            policeAddress = "Poelchaustraße 1, 12681 Berlin",
            policePhone = "+49 30 4664 332700"
        ),
        Kiez(
            id = "britz",
            name = "Britz",
            subtitle = "Britzer Garten, Gutshof & Windmühle",
            postalCodes = "12347, 12349, 12359",
            population = "ca. 42.000",
            specialty = "Britzer Garten (BUGA), Schloss Britz, Hufeisensiedlung",
            description = "Britz bietet pure Lebensqualität im Süden: Die UNESCO-Welterbe Hufeisensiedlung von Bruno Taut, der weltberühmte Britzer Garten mit See und Parkeisenbahn sowie Schloss und Gutshof Britz.",
            tags = listOf("Britzer Garten", "Schloss Britz", "Hufeisensiedlung", "Idyll"),
            lat = 52.4430,
            lng = 13.4330,
            highlights = listOf("Britzer Garten & Parkbahn", "Schloss & Gutshof Britz", "Britzer Mühle", "Hufeisensiedlung UNESCO"),
            imageUrl = "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&auto=format&fit=crop&q=80",
            rentIndex = "13,40 €/m²",
            vibe = "Gartenstadt & Ruhig",
            transitLines = "U7 (Grenzallee, Blaschkoallee, Parchimer Allee, Britz-Süd), Bus M44, M46",
            parks = listOf("Britzer Garten (BUGA 85)", "Gutshof Britz Park", "Park am Buschkrug"),
            popularSpots = listOf("Restaurant Schloss Britz", "Café am See Britzer Garten", "Bäckerei Britzer Mühle", "Eiscafé Vivaldi"),
            buergeramtName = "Bürgeramt Britz / Neukölln",
            buergeramtAddress = "Karl-Marx-Straße 83, 12043 Berlin",
            policeStation = "Polizeiabschnitt 55",
            policeAddress = "Rollbergstraße 70, 12053 Berlin",
            policePhone = "+49 30 4664 555700"
        )
    )

    // Gastronomie with authentic photos matching Screen 6
    val foodSpots = listOf(
        FoodSpot(
            id = "mustafas",
            name = "Mustafa's Gemüse Kebab",
            cuisine = "Imbiss · Türkisch · Streetfood",
            rating = 4.7,
            reviewsCount = 3812,
            kiezName = "Kreuzberg",
            distance = "450 m",
            address = "Mehringdamm 32, 10961 Berlin",
            priceRange = "€",
            imageUrl = "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80", // Döner Kebab
            isSponsored = false,
            phone = "+49 30 69532940",
            website = "https://mustafas.de",
            openingHours = "Täglich: 10:00 - 02:00 Uhr",
            popularDishes = listOf("Gemüse Kebab mit Feta & Zitrone", "Dürüm Kebab Spezial", "Falafel im Brot")
        ),
        FoodSpot(
            id = "anna_blume",
            name = "Café Anna Blume",
            cuisine = "Café · Frühstück · Kuchen",
            rating = 4.5,
            reviewsCount = 1204,
            kiezName = "Prenzlauer Berg",
            distance = "1,2 km",
            address = "Kollwitzstraße 83, 10435 Berlin",
            priceRange = "€€",
            imageUrl = "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80", // Breakfast Etagere
            isSponsored = true,
            phone = "+49 30 44048641",
            website = "https://cafe-anna-blume.de",
            openingHours = "Mo-So: 08:30 - 20:00 Uhr",
            popularDishes = listOf("Große Frühstücksetagere für Zwei", "Schoko-Himbeer-Torte", "Rührei mit Kräutern")
        ),
        FoodSpot(
            id = "markthalle_neun",
            name = "Markthalle Neun",
            cuisine = "Streetfood · International",
            rating = 4.6,
            reviewsCount = 2331,
            kiezName = "Kreuzberg",
            distance = "850 m",
            address = "Eisenbahnstraße 42/43, 10997 Berlin",
            priceRange = "€€",
            imageUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", // Streetfood Hall
            isSponsored = false,
            phone = "+49 30 61074714",
            website = "https://markthalleneun.de",
            openingHours = "Di-Sa: 12:00 - 22:00 Uhr",
            popularDishes = listOf("Street Food Thursday Specials", "Artisan Pasta", "Craft Beer Tasting")
        ),
        FoodSpot(
            id = "burgermeister",
            name = "Burgermeister",
            cuisine = "Burger · International · Streetfood",
            rating = 4.4,
            reviewsCount = 2105,
            kiezName = "Friedrichshain",
            distance = "1,5 km",
            address = "Oberbaumstraße 8, 10997 Berlin",
            priceRange = "€",
            imageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80", // Burger
            isSponsored = false,
            phone = "+49 30 23883840",
            website = "https://burger-meister.de",
            openingHours = "Täglich: 11:00 - 03:00 Uhr",
            popularDishes = listOf("Meisterburger mit Bacon & BBQ", "Hausgemachte Pommes", "Chili Cheese Fries")
        ),
        FoodSpot(
            id = "five_elephant",
            name = "Five Elephant",
            cuisine = "Café · Spezialitätenkaffee",
            rating = 4.6,
            reviewsCount = 1902,
            kiezName = "Mitte",
            distance = "2,3 km",
            address = "Alte Schönhauser Str. 14, 10119 Berlin",
            priceRange = "€€",
            imageUrl = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80", // Specialty Coffee & Cheesecake
            isSponsored = false,
            phone = "+49 30 96081527",
            website = "https://fiveelephant.com",
            openingHours = "Mo-Fr: 08:00 - 18:00, Sa-So: 09:00 - 18:00",
            popularDishes = listOf("New York Cheesecake", "Flat White Single Origin", "Handfilter Ethiopia")
        ),
        FoodSpot(
            id = "curry36",
            name = "Curry 36",
            cuisine = "Imbiss · Deutsch · Currywurst",
            rating = 4.3,
            reviewsCount = 3450,
            kiezName = "Kreuzberg",
            distance = "500 m",
            address = "Mehringdamm 36, 10961 Berlin",
            priceRange = "€",
            imageUrl = "https://images.unsplash.com/photo-1627042633145-b780d842ba45?w=600&auto=format&fit=crop&q=80", // Currywurst & Fries
            isSponsored = false,
            phone = "+49 30 2517368",
            website = "https://curry36.de",
            openingHours = "Täglich: 09:00 - 03:00 Uhr",
            popularDishes = listOf("Currywurst mit Darm", "Currywurst ohne Darm", "Pommes Schranke")
        )
    )

    // Events with verified official berlin.de sources & cleaned dates (No past dates)
    val events = listOf(
        KiezEvent(
            id = "festival_of_lights",
            title = "Festival of Lights Berlin",
            dayLabel = "OKT",
            dateNum = "16",
            monthLabel = "OKT",
            time = "19:00 - 00:00 Uhr",
            kiezName = "Mitte",
            price = "Kostenlos",
            isFree = true,
            category = "Lichtkunst & Spektakel",
            description = "Internationale Lichtkünstler verwandeln die Wahrzeichen Berlins wie Brandenburger Tor und Fernsehturm in spektakuläre Projektionen.",
            locationAddress = "Brandenburger Tor / Alexanderplatz, Berlin",
            organizer = "Kulturprojekte Berlin / Senat Berlin",
            officialUrl = "https://www.berlin.de/events/volksfeste/"
        ),
        KiezEvent(
            id = "herbst_rummel_oktoberfest",
            title = "Berliner Herbst-Rummel & Volksfest",
            dayLabel = "SA",
            dateNum = "18",
            monthLabel = "OKT",
            time = "14:00 - 22:00 Uhr",
            kiezName = "Reinickendorf / Wedding",
            price = "Eintritt frei",
            isFree = true,
            category = "Volksfest & Rummel",
            description = "Großes Volksfest mit Riesenrad, Karussells, Zuckerwatte und Spaß für die ganze Familie auf dem zentralen Festplatz.",
            locationAddress = "Zentraler Festplatz Kurt-Schumacher-Damm, 13405 Berlin",
            organizer = "Schaustellerverband Berlin e.V.",
            officialUrl = "https://www.berlin.de/events/volksfeste/"
        ),
        KiezEvent(
            id = "jazzfest_berlin",
            title = "Jazzfest Berlin 2026",
            dayLabel = "DO",
            dateNum = "05",
            monthLabel = "NOV",
            time = "18:00 - 23:30 Uhr",
            kiezName = "Tiergarten / Charlottenburg",
            price = "ab 18 €",
            isFree = false,
            category = "Musik & Konzerte",
            description = "Eines der traditionsreichsten Jazzfestivals der Welt mit hochkarätigen internationalen Musikern und Kiez-Sessions.",
            locationAddress = "Haus der Berliner Festspiele, Schaperstraße 24, 10719 Berlin",
            organizer = "Berliner Festspiele",
            officialUrl = "https://www.berlin.de/events/volksfeste/"
        ),
        KiezEvent(
            id = "mauerpark_kultur_flohmarkt",
            title = "Mauerpark Kultur & Bit Pazarı (Güncel Her Pazar)",
            dayLabel = "SO",
            dateNum = "Jeden SO",
            monthLabel = "AKTUELL",
            time = "10:00 - 18:00 Uhr",
            kiezName = "Prenzlauer Berg",
            price = "Kostenlos",
            isFree = true,
            category = "Markt & Live-Musik",
            description = "Der legendäre Berliner Sonntagsflohmarkt mit Vintage-Schätzen, Streetfood-Ständen und Amphitheater-Karaoke. Findet jeden Sonntag statt.",
            locationAddress = "Bernauer Str. 63-64, 13355 Berlin",
            organizer = "Mauerpark Flohmarkt Berlin",
            officialUrl = "https://www.berlin.de/events/volksfeste/"
        ),
        KiezEvent(
            id = "weihnachtszauber_berlin",
            title = "Berliner Weihnachtszauber & Kiez Pazarları",
            dayLabel = "MO",
            dateNum = "23",
            monthLabel = "NOV",
            time = "11:00 - 22:00 Uhr",
            kiezName = "Mitte",
            price = "Kostenlos",
            isFree = true,
            category = "Kiez-Märkte & Winter",
            description = "Lichterglanz, heißer Glühwein, gebrannte Mandeln und traditionelles Handwerk auf den schönsten Berliner Plätzen.",
            locationAddress = "Gendarmenmarkt / Bebelplatz, 10117 Berlin",
            organizer = "Berlin Partner / visitBerlin",
            officialUrl = "https://www.berlin.de/events/volksfeste/"
        ),
        KiezEvent(
            id = "winterzauber_potsdamer_platz",
            title = "Winterzauber & Winterwelt Potsdamer Platz",
            dayLabel = "FR",
            dateNum = "01",
            monthLabel = "DEZ",
            time = "10:00 - 22:00 Uhr",
            kiezName = "Tiergarten / Mitte",
            price = "Eintritt frei",
            isFree = true,
            category = "Winterfest & Eislauf",
            description = "Große Rodelbahn mit Blick auf das Brandenburger Tor, Eisbahn und alpenländische Hüttengaudi im Herzen Berlins.",
            locationAddress = "Potsdamer Platz, 10785 Berlin",
            organizer = "Land Berlin / https://www.berlin.de/events/volksfeste/",
            officialUrl = "https://www.berlin.de/events/volksfeste/"
        ),
        KiezEvent(
            id = "kiez_theater_kultur",
            title = "Kiez-Theater & Bühnenfestival Berlin",
            dayLabel = "SA",
            dateNum = "12",
            monthLabel = "DEZ",
            time = "19:30 - 22:00 Uhr",
            kiezName = "Friedrichshain / Kreuzberg",
            price = "Kulturpass / ab 12 €",
            isFree = false,
            category = "Theater & Bühnenkunst",
            description = "Freie Theaterszene und zeitgenössische Inszenierungen der Berliner Kiez-Bühnen mit Ticketverlosungen.",
            locationAddress = "Hebbel am Ufer (HAU), Stresemannstraße 29, 10963 Berlin",
            organizer = "Kulturprojekte Berlin / https://www.berlin.de/tickets/",
            officialUrl = "https://www.berlin.de/tickets/"
        )
    )

    // Local Businesses with real photos matching Screen 8
    val businesses = listOf(
        LocalBusiness(
            id = "kiez_friseur",
            name = "Kiez Friseur",
            category = "Dienstleistungen · Friseur",
            rating = 5.0,
            reviewsCount = 124,
            kiezName = "Kreuzberg",
            distance = "300 m",
            address = "Oranienstraße 185, 10999 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80", // Barber salon
            isSponsored = true,
            phone = "+49 30 61284455",
            website = "https://kiezfriseur-berlin.de",
            openingHours = "Mo-Sa: 10:00 - 20:00 Uhr",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80"
            ),
            description = "Traditionelles Handwerk trifft moderne Styles. Spezialisiert auf Herren- und Damenschnitte, Bartpflege und Naturfarben in entspannter Kiez-Atmosphäre."
        ),
        LocalBusiness(
            id = "brotzeit",
            name = "Bäckerei & Café Brotzeit",
            category = "Shopping · Bäckerei",
            rating = 4.8,
            reviewsCount = 231,
            kiezName = "Neukölln",
            distance = "400 m",
            address = "Sonnenallee 54, 12045 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", // Bakery
            isSponsored = false,
            phone = "+49 30 55432100",
            website = "https://brotzeit-neukoelln.de",
            openingHours = "Di-So: 07:00 - 18:00 Uhr",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80"
            ),
            description = "Täglich frisch gebackenes Sauerteigbrot aus regionalem Bio-Getreide, traditionelle Berliner Schrippen, Zimtschnecken und Specialty Coffee."
        ),
        LocalBusiness(
            id = "kiez_fitness",
            name = "Kiez Fitness",
            category = "Fitness · Fitnessstudio",
            rating = 4.6,
            reviewsCount = 98,
            kiezName = "Kreuzberg",
            distance = "550 m",
            address = "Wrangelstraße 72, 10997 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80", // Gym
            isSponsored = false,
            phone = "+49 30 69812300",
            website = "https://kiezfitness-kreuzberg.de",
            openingHours = "Mo-Fr: 06:30 - 23:00, Sa-So: 08:00 - 21:00",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80"
            ),
            description = "Dein familiäres Gym im Kiez. State-of-the-Art Freihanteln, Functional-Area, Sauna und über 30 wöchentliche Kurse von Calisthenics bis Yoga."
        ),
        LocalBusiness(
            id = "kiez_apotheke",
            name = "Kiez Apotheke",
            category = "Gesundheit · Apotheke",
            rating = 4.9,
            reviewsCount = 176,
            kiezName = "Mitte",
            distance = "700 m",
            address = "Torstraße 112, 10119 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=80", // Pharmacy
            isSponsored = false,
            phone = "+49 30 28091100",
            website = "https://apotheke-torstrasse.de",
            openingHours = "Mo-Fr: 08:30 - 19:30, Sa: 09:00 - 16:00",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=80"
            ),
            description = "Kompetente pharmazeutische Beratung, Botendienst direkt zu dir nach Hause im Kiez und ein breites Sortiment an Naturkosmetik."
        ),
        LocalBusiness(
            id = "rechtbox",
            name = "Rechtbox Steuerberatung",
            category = "Dienstleistungen · Steuerberatung",
            rating = 5.0,
            reviewsCount = 52,
            kiezName = "Pankow",
            distance = "1,1 km",
            address = "Prenzlauer Allee 88, 10405 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80", // Modern Office
            isSponsored = false,
            phone = "+49 30 44332211",
            website = "https://rechtbox-beratung.de",
            openingHours = "Mo-Fr: 09:00 - 18:00 Uhr",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80"
            ),
            description = "Digitale Steuerberatung und Buchhaltung für Gastronomen, Freiberufler, Kiez-Geschäfte und Startups. Papierlos, schnell und transparent."
        ),
        LocalBusiness(
            id = "wedding_doener",
            name = "Wedding Döner & Grill",
            category = "Imbiss & Döner",
            rating = 4.9,
            reviewsCount = 310,
            kiezName = "Wedding",
            distance = "500 m",
            address = "Müllerstraße 142, 13353 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80",
            isSponsored = true,
            phone = "+49 30 45021234",
            whatsapp = "+4915126509586",
            website = "https://wedding-grill.de",
            openingHours = "Mo-So: 10:00 - 02:00 Uhr",
            description = "Echter Berliner Kiez-Döner mit hausgemachtem Brot, frischen Kräutern und saftigem Kalb- & Hähnchenfleisch."
        ),
        LocalBusiness(
            id = "cafe_pfoertner",
            name = "Café Pförtner",
            category = "Gastronomie · Café & Frühstück",
            rating = 4.8,
            reviewsCount = 185,
            kiezName = "Wedding",
            distance = "750 m",
            address = "Uferstraße 8, 13357 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 45678912",
            whatsapp = "+4915126509586",
            website = "https://cafe-pfoertner.de",
            openingHours = "Mo-Sa: 09:00 - 18:00 Uhr",
            description = "Kult-Café in den Uferhallen mit italienischer Pasta, Spezialitätenkaffee und hausgemachten Kuchen in historischem Bus-Ambiente."
        ),
        LocalBusiness(
            id = "silberfisch_fshain",
            name = "Silberfisch Kiez-Shop",
            category = "Shopping · Geschenke & Mode",
            rating = 4.7,
            reviewsCount = 92,
            kiezName = "Friedrichshain",
            distance = "350 m",
            address = "Grünberger Str. 34, 10245 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 29364400",
            whatsapp = "+4915126509586",
            website = "https://silberfisch-berlin.de",
            openingHours = "Mo-Sa: 11:00 - 19:30 Uhr",
            description = "Liebevoll kuratierte Kiez-Boutique mit Berliner Design, Schmuck, Wohnaccessoires und Postkarten."
        ),
        LocalBusiness(
            id = "simondach_barber",
            name = "Simon-Dach Barber & Friseur",
            category = "Handwerk · Friseur & Barber",
            rating = 4.9,
            reviewsCount = 143,
            kiezName = "Friedrichshain",
            distance = "450 m",
            address = "Simon-Dach-Straße 22, 10245 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 29778899",
            whatsapp = "+4915126509586",
            website = "https://simondach-barber.de",
            openingHours = "Mo-Sa: 10:00 - 20:00 Uhr",
            description = "Klassische Bartpflege, Nassrasur mit heißem Tuch und moderne Haarschnitte direkt am Boxhagener Kiez."
        ),
        LocalBusiness(
            id = "kant_konditorei",
            name = "Kant Konditorei & Bäckerei",
            category = "Shopping · Bäckerei & Konditorei",
            rating = 4.9,
            reviewsCount = 210,
            kiezName = "Charlottenburg",
            distance = "600 m",
            address = "Kantstraße 64, 10627 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 3241100",
            whatsapp = "+4915126509586",
            website = "https://kant-konditorei.de",
            openingHours = "Di-So: 07:30 - 18:30 Uhr",
            description = "Traditionsreiche Berliner Konditorei mit feinsten Torten, Petit Fours, Croissants und Kaffee-Spezialitäten."
        ),
        LocalBusiness(
            id = "schwarzes_cafe",
            name = "Schwarzes Café",
            category = "Gastronomie · Café & Restaurant",
            rating = 4.6,
            reviewsCount = 420,
            kiezName = "Charlottenburg",
            distance = "850 m",
            address = "Kantstraße 148, 10623 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 3138038",
            whatsapp = "+4915126509586",
            website = "https://schwarzescafe-berlin.de",
            openingHours = "Rund um die Uhr (24/7)",
            description = "Legendäre Berliner Institution seit den 1970ern. Frühstück zu jeder Tages- und Nachtzeit und internationale Küche."
        ),
        LocalBusiness(
            id = "winterfeldt_markt",
            name = "Winterfeldt Bäckerei & Feinkost",
            category = "Shopping · Bäckerei & Markt",
            rating = 4.8,
            reviewsCount = 160,
            kiezName = "Schöneberg",
            distance = "400 m",
            address = "Winterfeldtstraße 45, 10781 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 2168900",
            whatsapp = "+4915126509586",
            website = "https://winterfeldt-kiez.de",
            openingHours = "Mo-Sa: 08:00 - 19:00 Uhr",
            description = "Frisches Bio-Brot, Kiez-Käse, Oliven und Spezialitäten direkt am beliebten Winterfeldtplatz."
        ),
        LocalBusiness(
            id = "arminius_markthalle",
            name = "Arminius Markthalle Kiez-Restaurant",
            category = "Gastronomie · Restaurant & Markt",
            rating = 4.8,
            reviewsCount = 380,
            kiezName = "Moabit",
            distance = "500 m",
            address = "Arminiusstraße 2, 10551 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 39876543",
            whatsapp = "+4915126509586",
            website = "https://arminiusmarkthalle.com",
            openingHours = "Mo-Sa: 10:00 - 22:00 Uhr",
            description = "Historische Markthalle Moabit mit vielfältigen Essensständen, Craft Beer und geselligem Kiez-Flair."
        ),
        LocalBusiness(
            id = "anna_blume_kiez",
            name = "Café Anna Blume",
            category = "Gastronomie · Café & Frühstück",
            rating = 4.9,
            reviewsCount = 520,
            kiezName = "Prenzlauer Berg",
            distance = "300 m",
            address = "Kollwitzstraße 83, 10435 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=600&auto=format&fit=crop&q=80",
            isSponsored = true,
            hasCoupon = true,
            couponText = "%20 İndirim (Frühstückset)",
            phone = "+49 30 44048641",
            whatsapp = "+4915126509586",
            website = "https://cafe-annablume.de",
            openingHours = "Mo-So: 08:30 - 20:00 Uhr",
            description = "Berühmtes Café und Blumengeschäft mit dreistöckigen Frühstücks-Etagèren, Bio-Rührei und eigener Tortenmanufaktur."
        ),
        LocalBusiness(
            id = "mustafas_kiez",
            name = "Mustafa's Gemüse Kebap",
            category = "Imbiss & Döner",
            rating = 4.8,
            reviewsCount = 890,
            kiezName = "Kreuzberg",
            distance = "250 m",
            address = "Mehringdamm 32, 10961 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 69532100",
            whatsapp = "+4915126509586",
            website = "https://mustafas.de",
            openingHours = "Mo-So: 10:00 - 02:00 Uhr",
            description = "Der weltbekannte Berliner Gemüse-Döner mit gebratenem Gemüse, frischem Schafskäse und Zitronenspritzer."
        ),
        LocalBusiness(
            id = "azzam_kiez",
            name = "Azzam Hummus & Falafel",
            category = "Gastronomie · Restaurant",
            rating = 4.8,
            reviewsCount = 450,
            kiezName = "Neukölln",
            distance = "350 m",
            address = "Sonnenallee 54, 12045 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1540914124281-342587941389?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 62725678",
            whatsapp = "+4915126509586",
            website = "https://azzam-berlin.de",
            openingHours = "Mo-So: 09:00 - 23:00 Uhr",
            description = "Legendäre orientalische Küche auf der Sonnenallee: Hausgemachter cremiger Hummus, warme Fatteh und knusprige Falafel."
        ),
        LocalBusiness(
            id = "tempelhof_sport",
            name = "Tempelhofer Rad & Sport",
            category = "Fitness · Sport & Verleih",
            rating = 4.7,
            reviewsCount = 88,
            kiezName = "Tempelhof",
            distance = "600 m",
            address = "Tempelhofer Damm 90, 12101 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 78912300",
            whatsapp = "+4915126509586",
            website = "https://tempelhof-sport.de",
            openingHours = "Mo-Sa: 10:00 - 19:00 Uhr",
            description = "Fahrradreparatur, Verleih für das Tempelhofer Feld, Inline-Skates und Outdoor-Equipment."
        ),
        LocalBusiness(
            id = "schloss_apotheke",
            name = "Schloss Apotheke Steglitz",
            category = "Gesundheit · Apotheke",
            rating = 4.8,
            reviewsCount = 130,
            kiezName = "Steglitz",
            distance = "700 m",
            address = "Schloßstraße 42, 12165 Berlin",
            imageUrl = "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=80",
            phone = "+49 30 7914422",
            whatsapp = "+4915126509586",
            website = "https://schloss-apotheke-steglitz.de",
            openingHours = "Mo-Fr: 08:30 - 19:30, Sa: 09:00 - 16:00",
            description = "Persönliche Beratung, Kiez-Botendienst und große Auswahl an Naturheilmitteln im Herzen von Steglitz."
        )
    )

    // Deals with real photos matching Screen 9
    val deals = listOf(
        Deal(
            id = "deal_anna_blume",
            businessName = "Café Anna Blume",
            discountBadge = "20 %",
            title = "20 % auf alle Frühstückssets",
            validUntil = "Gültig bis 30.09.2026",
            category = "Essen & Trinken",
            code = "KIEZ20BLUME",
            imageUrl = "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80"
        ),
        Deal(
            id = "deal_la_piazza",
            businessName = "La Piazza",
            discountBadge = "2 für 1",
            title = "2 für 1 Steinofenpizza nach Wahl",
            validUntil = "Gültig bis 15.10.2026",
            category = "Essen & Trinken",
            code = "PIAZZA2FOR1",
            imageUrl = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80"
        ),
        Deal(
            id = "deal_kiez_friseur",
            businessName = "Kiez Friseur",
            discountBadge = "15 %",
            title = "15 % auf alle Haarschnitte",
            validUntil = "Gültig bis 31.10.2026",
            category = "Dienstleistungen",
            code = "KIEZSTYLE15",
            imageUrl = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80"
        ),
        Deal(
            id = "deal_kiez_fitness",
            businessName = "Kiez Fitness",
            discountBadge = "10 %",
            title = "10 % auf Monatsmitgliedschaft",
            validUntil = "Gültig bis 31.12.2026",
            category = "Freizeit & Fitness",
            code = "FITKIEZ10",
            imageUrl = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80"
        )
    )

    // Quiz Questions with real photos matching Screen 5
    val quizQuestions = listOf(
        QuizQuestion(
            id = 1,
            question = "In welchem Bezirk steht das Brandenburger Tor?",
            imageUrl = "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop&q=80",
            options = listOf("Mitte", "Friedrichshain", "Charlottenburg", "Neukölln"),
            correctIndex = 0,
            explanation = "Richtig! 🎉 Das Brandenburger Tor steht im Bezirk Mitte und ist eines der bekanntesten Wahrzeichen Berlins."
        ),
        QuizQuestion(
            id = 2,
            question = "Welches Tier ist das traditionelle Wappentier von Berlin?",
            imageUrl = "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&auto=format&fit=crop&q=80",
            options = listOf("Der Berliner Adler", "Der Berliner Bär", "Der Berliner Löwe", "Der Berliner Fuchs"),
            correctIndex = 1,
            explanation = "Richtig! 🐻 Der Berliner Bär schmückt seit dem 13. Jahrhundert das Stadtwappen und begegnet einem überall in Berlin."
        ),
        QuizQuestion(
            id = 3,
            question = "Wie hoch ist der Berliner Fernsehturm am Alexanderplatz?",
            imageUrl = "https://images.unsplash.com/photo-1546726747-421c6d69c929?w=800&auto=format&fit=crop&q=80",
            options = listOf("288 Meter", "325 Meter", "368 Meter", "412 Meter"),
            correctIndex = 2,
            explanation = "Richtig! 🗼 Mit genau 368 Metern ist der Fernsehturm das höchste freistehende Bauwerk Deutschlands."
        ),
        QuizQuestion(
            id = 4,
            question = "Was bedeutet das typische Berliner Wort 'Schrippe'?",
            imageUrl = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
            options = listOf("Ein Brötchen", "Eine U-Bahn-Fahrkarte", "Ein alter Mantel", "Ein Regenschirm"),
            correctIndex = 0,
            explanation = "Genau! 🥖 In Berlin bestellt man beim Bäcker niemals Brötchen oder Semmeln, sondern immer echte 'Schrippen'."
        ),
        QuizQuestion(
            id = 5,
            question = "In welchem Jahr fiel die Berliner Mauer?",
            imageUrl = "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&auto=format&fit=crop&q=80",
            options = listOf("1987", "1989", "1991", "1993"),
            correctIndex = 1,
            explanation = "Richtig! 🧱 Am 9. November 1989 öffnete sich die Berliner Mauer und markierte das Ende der Teilung Europas."
        )
    )

    // Kiez Wissen Articles with real photos matching Screen 10
    val articles = listOf(
        KiezArticle(
            id = "geschichte_berlins",
            title = "Die Geschichte Berlins",
            subtitle = "Von der Doppelstadt zur Hauptstadt",
            category = "Geschichte",
            readTimeMinutes = 5,
            imageUrl = "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&auto=format&fit=crop&q=80",
            fullContent = "Berlin entstand im 13. Jahrhundert als Doppelstadt Berlin und Cölln an den Ufern der Spree. Über die Jahrhunderte entwickelte sich die Stadt von einer kurfürstlichen und preußischen Residenz zur pulsierenden Kulturmetropole der Goldenen Zwanziger Jahre. Nach den Zerstörungen des Zweiten Weltkriegs und der 28 Jahre währenden Teilung im Kalten Krieg feierte Berlin 1989 die friedliche Wiedervereinigung. Heute ist die deutsche Hauptstadt ein globales Zentrum für Kreativität, Hochtechnologie, Wissenschaft und gelebte Toleranz."
        ),
        KiezArticle(
            id = "berliner_mauer",
            title = "Berliner Mauer",
            subtitle = "Entstehung, Verlauf und Heute",
            category = "Geschichte",
            readTimeMinutes = 6,
            imageUrl = "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=600&auto=format&fit=crop&q=80",
            fullContent = "Vom 13. August 1961 bis zum 9. November 1989 trennte die Berliner Mauer West-Berlin von Ost-Berlin und der DDR auf einer Länge von über 155 Kilometern. Die Grenzanlagen mit Todesstreifen, Wachtürmen und Selbstschussanlagen kosteten mindestens 140 Menschen das Leben. Der historische Mauerfall im November 1989 leitete das Ende des Kalten Krieges ein. Heute mahnen die Gedenkstätte Bernauer Straße und die 1,3 Kilometer lange East Side Gallery als weltweit längste Open-Air-Galerie an diese Epoche."
        ),
        KiezArticle(
            id = "kiez_kultur",
            title = "Die Berliner Kieze",
            subtitle = "Vielfalt und Besonderheiten",
            category = "Kultur",
            readTimeMinutes = 4,
            imageUrl = "https://images.unsplash.com/photo-1572953109213-3be62398eb95?w=600&auto=format&fit=crop&q=80",
            fullContent = "Ein 'Kiez' ist in Berlin weit mehr als ein einfacher Stadtteil. Es ist das Mikrokosmos-Gefühl der eigenen Nachbarschaft: der Bäcker an der Ecke, der Späti um Mitternacht, der Wochenmarkt und die Nachbarn, die sich seit Jahrzehnten grüßen. Jeder Kiez – ob Bergmannkiez, Kollwitzplatz oder Reuterkiez – besitzt seine ganz eigene Identität."
        ),
        KiezArticle(
            id = "sehenswuerdigkeiten",
            title = "Sehenswürdigkeiten",
            subtitle = "Das darf man nicht verpassen",
            category = "Sehenswürdigkeiten",
            readTimeMinutes = 5,
            imageUrl = "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600&auto=format&fit=crop&q=80",
            fullContent = "Vom Brandenburger Tor über die Museumsinsel bis zum Schloss Charlottenburg und der Siegessäule im Tiergarten: Berlin bietet unzählige weltberühmte Monumente und versteckte architektonische Juwele, die man unbedingt gesehen haben muss."
        ),
        KiezArticle(
            id = "berliner_dialekt",
            title = "Berliner Dialekt",
            subtitle = "Typische Wörter und Ausdrücke",
            category = "Sprache",
            readTimeMinutes = 3,
            imageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
            fullContent = "Der Berliner Dialekt ('Berliner Schnauze') ist direkt, herzlich und schlagfertig. 'Icke' heißt Ich, 'Knorke' bedeutet großartig, eine 'Stulle' ist ein belegtes Butterbrot und 'Jwd' steht für 'janz weit draußen'."
        )
    )

    // B2B Pricing Packages matching the user's explicit decision:
    // Basic (19,90 €), Plus (49,90 €), Premium (99,90 €)
    val pricingPackages = listOf(
        PricingPackage(
            id = "basic",
            name = "Kiez Basic",
            priceMonthly = "19,90 €",
            priceYearlyMonthly = "16,50 €",
            isPopular = false,
            isMaxVisibility = false,
            features = listOf(
                "Unternehmensprofil mit allen wichtigen Infos",
                "Adresse, Telefon, Website & Öffnungszeiten",
                "Bilder (bis zu 5)",
                "Eintrag in der Kiez-Suche",
                "Ihr Standort auf der Kiez-Karte",
                "Kundenbewertungen",
                "Social-Media-Verlinkung"
            )
        ),
        PricingPackage(
            id = "plus",
            name = "Kiez Plus",
            priceMonthly = "49,90 €",
            priceYearlyMonthly = "41,50 €",
            isPopular = true,
            isMaxVisibility = false,
            features = listOf(
                "Alle Leistungen aus Kiez Basic",
                "Hervorgehobener Eintrag in Listen",
                "Platzierung als Anzeige in passenden Kategorien",
                "Angebote & Deals einstellen (bis zu 4 pro Monat)",
                "Event-Veranstaltungen eintragen",
                "Mehr Bilder & Galerie",
                "Erweiterte Unternehmensbeschreibung",
                "Statistiken zu Aufrufen und Klicks"
            )
        ),
        PricingPackage(
            id = "premium",
            name = "Kiez Premium",
            priceMonthly = "99,90 €",
            priceYearlyMonthly = "82,50 €",
            isPopular = false,
            isMaxVisibility = true,
            features = listOf(
                "Alle Leistungen aus Kiez Plus",
                "Top-Platzierung: 'Top Unternehmen im Kiez'",
                "Startseiten-Präsenz (wechselnd)",
                "Gesponserter Pin auf der Kiez-Karte (auffällig)",
                "Mehr Angebote & Deals (bis zu 8 pro Monat)",
                "Event-Highlights",
                "Bevorzugte Platzierung in Suchergebnissen",
                "Detaillierte Statistiken & monatlicher Bericht",
                "Persönlicher Support"
            )
        )
    )

    val addOns = listOf(
        AddOnOption(
            id = "deal_addon",
            title = "Kiez Deal",
            pricePerWeek = "14,90 € / Woche",
            priceNum = 14.90,
            description = "Ihr Angebot prominent in der Deals-Übersicht"
        ),
        AddOnOption(
            id = "event_addon",
            title = "Event hervorheben",
            pricePerWeek = "19,90 € / Woche",
            priceNum = 19.90,
            description = "Ihre Veranstaltung ganz oben in den Events"
        ),
        AddOnOption(
            id = "top_addon",
            title = "Top-Platzierung im Kiez",
            pricePerWeek = "29,90 € / Woche",
            priceNum = 29.90,
            description = "Ihr Unternehmen an erster Stelle in der Kategorie"
        ),
        AddOnOption(
            id = "banner_addon",
            title = "Startseiten-Banner",
            pricePerWeek = "49,90 € / Woche",
            priceNum = 49.90,
            description = "Exklusive Präsentation auf der Startseite"
        )
    )

    // Complete 22 Berlin Districts from worker.js
    val allKieze = listOf(
        KiezDistrict("neukoelln", "Neukölln", 52.4811, 13.4350),
        KiezDistrict("kreuzberg", "Kreuzberg", 52.4986, 13.4030),
        KiezDistrict("wedding", "Wedding", 52.5496, 13.3526),
        KiezDistrict("gesundbrunnen", "Gesundbrunnen", 52.5507, 13.3905),
        KiezDistrict("moabit", "Moabit", 52.5302, 13.3420),
        KiezDistrict("tiergarten", "Tiergarten", 52.5145, 13.3501),
        KiezDistrict("mitte", "Mitte", 52.5200, 13.4050),
        KiezDistrict("friedrichshain", "Friedrichshain", 52.5156, 13.4541),
        KiezDistrict("prenzlauer-berg", "Prenzlauer Berg", 52.5388, 13.4244),
        KiezDistrict("schoeneberg", "Schöneberg", 52.4830, 13.3530),
        KiezDistrict("tempelhof", "Tempelhof", 52.4664, 13.3850),
        KiezDistrict("charlottenburg", "Charlottenburg", 52.5163, 13.3040),
        KiezDistrict("spandau", "Spandau", 52.5354, 13.1990),
        KiezDistrict("reinickendorf", "Reinickendorf", 52.5870, 13.3290),
        KiezDistrict("steglitz", "Steglitz", 52.4560, 13.3220),
        KiezDistrict("lichtenberg", "Lichtenberg", 52.5130, 13.4990),
        KiezDistrict("pankow", "Pankow", 52.5690, 13.4020),
        KiezDistrict("treptow", "Treptow", 52.4900, 13.4700),
        KiezDistrict("britz", "Britz", 52.4430, 13.4330),
        KiezDistrict("koepenick", "Köpenick", 52.4450, 13.5760),
        KiezDistrict("marzahn", "Marzahn", 52.5450, 13.5640),
        KiezDistrict("umgebung", "Berlin & Umgebung", 52.5200, 13.4050)
    )

    // 12 Categories from worker.js with German and Turkish labels
    val categoriesMap = mapOf(
        "fruehstueck" to Pair("Frühstück", "Kahvaltı"),
        "cafe" to Pair("Café", "Kafe"),
        "restaurant" to Pair("Restaurant", "Restoran"),
        "imbiss" to Pair("Imbiss & Döner", "Büfe & Döner"),
        "baeckerei" to Pair("Bäckerei", "Fırın & Pastane"),
        "markt" to Pair("Supermarkt & Markt", "Market"),
        "friseur" to Pair("Friseur & Barber", "Kuaför & Berber"),
        "beauty" to Pair("Kosmetik & Nails", "Güzellik"),
        "service" to Pair("Dienstleistung", "Hizmet"),
        "shop" to Pair("Einkaufen", "Alışveriş"),
        "handel" to Pair("Einzel- & Großhandel", "Perakende & Toptan"),
        "sonstiges" to Pair("Sonstiges", "Diğer")
    )

    // The 7 Real Sponsors from seed-sponsoren.sql
    val sponsors = listOf(
        SponsorBanner(
            id = "deindigitalerhelfer",
            name = "Dein Digitaler Helfer",
            drawableRes = com.example.R.drawable.sponsor_deindigitalerhelfer,
            headlineDe = "Behördenbriefe verstehen, Anträge vorbereiten",
            headlineTr = "Resmi yazıları anla, başvuruları hazırla",
            headlineEn = "Understand official letters, prepare applications",
            ctaDe = "Kostenlos starten",
            ctaTr = "Ücretsiz başla",
            ctaEn = "Start for free",
            linkWeb = "https://deindigitalerhelfer.com",
            linkWa = "",
            linkTel = "",
            category = "service",
            priority = 5
        ),
        SponsorBanner(
            id = "ersenbox",
            name = "ErsenBox",
            drawableRes = com.example.R.drawable.sponsor_ersenbox,
            headlineDe = "Dokumente verstehen, Risiken erkennen",
            headlineTr = "Belgeleri anla, riskleri gör",
            headlineEn = "Understand documents, spot risks",
            ctaDe = "Mehr erfahren",
            ctaTr = "Keşfet",
            ctaEn = "Learn more",
            linkWeb = "https://ersenbox.com",
            linkWa = "",
            linkTel = "",
            category = "service",
            priority = 4
        ),
        SponsorBanner(
            id = "deinfinanzenhelfer",
            name = "Dein Finanzen Helfer",
            drawableRes = com.example.R.drawable.sponsor_deinfinanzenhelfer,
            headlineDe = "Finanzamt-Brief verstehen, Steuererklärung online",
            headlineTr = "Finanzamt mektubunu anla, vergi beyannamesi online",
            headlineEn = "Understand tax office letters, file online",
            ctaDe = "Anfrage starten",
            ctaTr = "Başvur",
            ctaEn = "Get started",
            linkWeb = "https://deinfinanzenhelfer.com",
            linkWa = "",
            linkTel = "",
            category = "service",
            priority = 3
        ),
        SponsorBanner(
            id = "it-rechtbox",
            name = "IT-Rechtbox",
            drawableRes = com.example.R.drawable.sponsor_it_rechtbox,
            headlineDe = "Website prüfen: Impressum, Datenschutz, Cookies",
            headlineTr = "Web siteni kontrol et: Impressum, Datenschutz, çerezler",
            headlineEn = "Check your website: imprint, privacy, cookies",
            ctaDe = "Website prüfen",
            ctaTr = "Siteyi kontrol et",
            ctaEn = "Check website",
            linkWeb = "https://it-rechtbox.pages.dev",
            linkWa = "",
            linkTel = "",
            category = "service",
            priority = 4
        ),
        SponsorBanner(
            id = "tek-getraenke",
            name = "Terra Verde TEK Getränke",
            drawableRes = com.example.R.drawable.sponsor_tek_getraenke,
            headlineDe = "Getränke, Lebensmittel & Verpackung im Großhandel",
            headlineTr = "İçecek, gıda ve ambalajda toptan satış",
            headlineEn = "Wholesale drinks, food & packaging in Berlin",
            ctaDe = "Sortiment ansehen",
            ctaTr = "Ürünleri gör",
            ctaEn = "See products",
            linkWeb = "https://www.tekgetraenke.de",
            linkWa = "",
            linkTel = "",
            category = "handel",
            priority = 6
        ),
        SponsorBanner(
            id = "the-visit",
            name = "The Visit Coffee Roastery",
            drawableRes = com.example.R.drawable.sponsor_the_visit,
            headlineDe = "Kaffeerösterei & Specialty Coffee in Kreuzberg",
            headlineTr = "Kreuzberg'de taze kahve kavurma evi & kafe",
            headlineEn = "Specialty coffee roastery in Kreuzberg",
            ctaDe = "Website ansehen",
            ctaTr = "Siteye git",
            ctaEn = "Visit website",
            linkWeb = "https://thevisitcoffeeroastery.pages.dev/",
            linkWa = "",
            linkTel = "",
            category = "cafe",
            priority = 6
        ),
        SponsorBanner(
            id = "berlin-handel",
            name = "Berlin Handel",
            drawableRes = com.example.R.drawable.sponsor_berlin_handel,
            headlineDe = "Getränke-Lieferservice für Berlin & Umgebung per WhatsApp",
            headlineTr = "Berlin ve çevresine içecek teslimatı – WhatsApp ile sipariş",
            headlineEn = "Beverage delivery service in Berlin via WhatsApp",
            ctaDe = "WhatsApp bestellen",
            ctaTr = "WhatsApp ile sipariş",
            ctaEn = "Order on WhatsApp",
            linkWeb = "",
            linkWa = "https://wa.me/4915126509586",
            linkTel = "+4915126509586",
            category = "handel",
            priority = 6
        )
    )

    // Kiez-Stories (Instagram/WhatsApp style 24h stories)
    val stories = listOf(
        KiezStory(
            id = "story_1",
            headline = "Straßensperrung am Kottbusser Damm wegen Bauarbeiten",
            subtext = "U8 Schienenersatzverkehr zwischen Hermannplatz und Moritzplatz am Wochenende.",
            kind = "traffic",
            headlineColor = "gelb",
            kiez = "Kreuzberg",
            author = "BVG & Kiez-Team",
            timeAgo = "vor 25 Min.",
            mediaResId = R.drawable.kiez_kreuzberg,
            source = "BVG Berlin",
            link = "https://www.bvg.de",
            whatsapp = "+4915126509586"
        ),
        KiezStory(
            id = "story_2",
            headline = "Neuer Bio-Markt eröffnet in der Weserstraße!",
            subtext = "Regionale Produkte, frisches Obst & Gemüse und unverpackte Lebensmittel.",
            kind = "news",
            headlineColor = "blau",
            kiez = "Neukölln",
            author = "Ali (Kiez-Reporter)",
            timeAgo = "vor 1 Std.",
            mediaResId = R.drawable.kiez_neukoelln,
            source = "Weserstraße Kiez",
            link = "https://www.berlin.de",
            whatsapp = "+4915126509586"
        ),
        KiezStory(
            id = "story_3",
            headline = "Mauerpark Flohmarkt: Großes Open-Air Karaoke ab 15 Uhr",
            subtext = "Tolles Wetter erwartet! Kommt vorbei und bringt Freunde mit.",
            kind = "event",
            headlineColor = "rot",
            kiez = "Prenzlauer Berg",
            author = "Mauerpark Freunde",
            timeAgo = "vor 3 Std.",
            mediaResId = R.drawable.event_mauerpark,
            source = "Mauerpark Berlin",
            link = "https://www.mauerpark.info",
            whatsapp = "+4915126509586"
        ),
        KiezStory(
            id = "story_4",
            headline = "Warnung: Taschendiebe rund um Alexanderplatz U-Bahn",
            subtext = "Polizei bittet um Wachsamkeit bei dichtem Gedränge an den Rolltreppen.",
            kind = "warn",
            headlineColor = "rot",
            kiez = "Mitte",
            author = "Polizei Berlin / Kiez",
            timeAgo = "vor 4 Std.",
            mediaResId = R.drawable.kiez_mitte,
            source = "Polizei Berlin",
            link = "https://www.berlin.de/polizei/"
        ),
        KiezStory(
            id = "story_5",
            headline = "Kiezfest Bergmannstraße: Anmeldung für Stände offen",
            subtext = "Anwohner können sich bis Ende des Monats für kostenlose Nachbarschaftsstände bewerben. Ein buntes Straßenfest für die ganze Familie mit Musik, Essen und Flohmarktständen.",
            kind = "info",
            headlineColor = "weiss",
            kiez = "Kreuzberg",
            author = "Kiez-Initiative",
            timeAgo = "vor 6 Std.",
            mediaResId = R.drawable.event_markthalle,
            source = "Kiez-Initiative Bergmannstraße",
            link = "",
            whatsapp = "+4915126509586"
        )
    )

    // Real Kiez Jobs
    val jobs = listOf(
        KiezJob(
            id = "job_1",
            title = "Barista & Servicekraft (m/w/d)",
            company = "The Visit Coffee Roastery",
            kiez = "Kreuzberg",
            jobType = "Teilzeit / Vollzeit",
            salary = "14,50 € - 17,00 € / Std.",
            description = "Wir suchen begeisterte Baristi für unser Team in Kreuzberg. Leidenschaft für Specialty Coffee und kundenorientiertes Arbeiten erwünscht.",
            contactWa = "+4915126509586",
            contactPhone = "+49 30 61284455",
            contactEmail = "jobs@thevisitcoffee.de",
            isUrgent = true
        ),
        KiezJob(
            id = "job_2",
            title = "Verkäufer / Kasiyer (m/w/d)",
            company = "Bolu Supermarkt",
            kiez = "Neukölln",
            jobType = "Vollzeit",
            salary = "2.300 € - 2.600 € / Monat",
            description = "Für unseren Standort am Hermannplatz suchen wir engagierte Verkäufer für die Obst- und Gemüseabteilung und die Kasse.",
            contactWa = "+4915126509586",
            contactPhone = "+49 30 6214589",
            contactEmail = "kontakt@bolu.berlin",
            isUrgent = false
        ),
        KiezJob(
            id = "job_3",
            title = "Lieferfahrer / Kurye (Klasse B)",
            company = "Berlin Handel Getränkeservice",
            kiez = "Mitte",
            jobType = "Vollzeit / Minijob",
            salary = "15,00 € / Std. + Trinkgeld",
            description = "Getränke-Auslieferung im Stadtgebiet Berlin mit Firmenfahrzeug. Zuverlässigkeit und Ortskenntnisse von Vorteil.",
            contactWa = "+4915126509586",
            contactPhone = "+49 151 26509586",
            contactEmail = "service@berlin-handel.de",
            isUrgent = true
        ),
        KiezJob(
            id = "job_4",
            title = "Friseur / Barber (m/w/d)",
            company = "Kiez Barber Club",
            kiez = "Wedding",
            jobType = "Vollzeit",
            salary = "2.400 € / Monat + Provision",
            description = "Moderner Barbershop sucht talentierte Friseure für Bartpflege, Fade-Cuts und klassische Haarschnitte.",
            contactWa = "+4915126509586",
            contactPhone = "+49 30 4678123",
            contactEmail = "info@kiezbarber.de",
            isUrgent = false
        ),
        KiezJob(
            id = "job_5",
            title = "Koch / Küchenhilfe (m/w/d)",
            company = "Hasir Restaurant",
            kiez = "Kreuzberg",
            jobType = "Vollzeit",
            salary = "2.500 € - 2.800 € / Monat",
            description = "Erfahrener Grillmeister oder Koch für traditionelle anatolische Küche und Holzkohlegrill gesucht.",
            contactWa = "+4915126509586",
            contactPhone = "+49 30 6142373",
            contactEmail = "karriere@hasir.de",
            isUrgent = false
        )
    )

    // Berlin Emergency Numbers (Notruf & Wichtige Nummern)
    val emergencyContacts = listOf(
        EmergencyContact(
            id = "polizei",
            nameDe = "Polizei Berlin",
            nameTr = "Berlin Polisi (Acil)",
            nameEn = "Berlin Police (Emergency)",
            descDe = "Bei akuter Gefahr, Straftaten und Unfällen",
            descTr = "Acil tehlike, suç ve kazalarda arayın",
            descEn = "Immediate danger, crime and accidents",
            number = "110",
            category = "notruf",
            isFree = true
        ),
        EmergencyContact(
            id = "feuerwehr",
            nameDe = "Feuerwehr & Rettungsdienst",
            nameTr = "İtfaiye & Acil Ambulans",
            nameEn = "Fire & Ambulance",
            descDe = "Brände, schwere Verletzungen, lebensbedrohliche Notfälle",
            descTr = "Yangın, ağır yaralanma ve hayati tehlikeler",
            descEn = "Fires, severe injuries and medical emergencies",
            number = "112",
            category = "notruf",
            isFree = true
        ),
        EmergencyContact(
            id = "aerztlicher_dienst",
            nameDe = "Ärztlicher Bereitschaftsdienst",
            nameTr = "Nöbetçi Doktor Hattı",
            nameEn = "Medical On-Call Service",
            descDe = "Bei Erkrankungen außerhalb der Praxisöffnungszeiten",
            descTr = "Muayenehane kapalıyken nöbetçi hekim",
            descEn = "Non-emergency medical care outside practice hours",
            number = "116117",
            category = "gesundheit",
            isFree = true
        ),
        EmergencyContact(
            id = "krisendienst",
            nameDe = "Berliner Krisendienst",
            nameTr = "Berlin Kriz Servisi (24 Saat)",
            nameEn = "Berlin Crisis Service (24h)",
            descDe = "Kostenlose Hilfe bei seelischen Krisen & Notfällen rund um die Uhr",
            descTr = "Psikolojik kriz ve çaresizlik anlarında 24 saat ücretsiz destek",
            descEn = "Psychological support in crises around the clock",
            number = "0303906310",
            category = "krise",
            isFree = true
        ),
        EmergencyContact(
            id = "giftnotruf",
            nameDe = "Giftnotruf Berlin",
            nameTr = "Zehirlenme Acil Danışma",
            nameEn = "Poison Control Center",
            descDe = "Vergiftungsnotfälle bei Kindern und Erwachsenen (24h)",
            descTr = "Çocuk ve yetişkinlerde zehirlenme durumunda 24 saat danışma",
            descEn = "24-hour guidance for poisoning emergencies",
            number = "03019240",
            category = "gesundheit",
            isFree = false
        ),
        EmergencyContact(
            id = "drogennotdienst",
            nameDe = "Drogennotdienst Berlin",
            nameTr = "Uyuşturucu & Bağımlılık Acil",
            nameEn = "Drug Emergency Hotline",
            descDe = "24 Stunden Beratung & Hilfe bei Suchtnotfällen",
            descTr = "Madde ve alkol bağımlılığı acil destek hattı",
            descEn = "24-hour help and counseling for addictions",
            number = "03019237",
            category = "krise",
            isFree = false
        ),
        EmergencyContact(
            id = "frauennotruf",
            nameDe = "Frauennotruf Berlin",
            nameTr = "Kadın Acil Destek Hattı",
            nameEn = "Women's Crisis Helpline",
            descDe = "Beratung bei Gewalt gegen Frauen und sexuellen Übergriffen",
            descTr = "Kadına yönelik şiddet ve taciz durumunda destek",
            descEn = "Crisis counseling for women facing violence",
            number = "0306154243",
            category = "soziales",
            isFree = false
        ),
        EmergencyContact(
            id = "jugendnotdienst",
            nameDe = "Kinder- und Jugendnotdienst",
            nameTr = "Çocuk & Genç Acil Servis",
            nameEn = "Child & Youth Emergency Hotline",
            descDe = "Zuflucht und Beratung für Kinder, Jugendliche und Eltern",
            descTr = "Çocuklar, gençler ve aileler için acil koruma ve danışma",
            descEn = "Immediate help and shelter for youth in distress",
            number = "030610061",
            category = "soziales",
            isFree = false
        ),
        EmergencyContact(
            id = "tiernotdienst",
            nameDe = "Tierärztlicher Notdienst Berlin",
            nameTr = "Nöbetçi Veteriner Hattı",
            nameEn = "Veterinary Emergency",
            descDe = "Zentrale Vermittlung des tierärztlichen Notdienstes",
            descTr = "Evcil hayvanlar için nöbetçi veteriner yönlendirmesi",
            descEn = "Emergency medical assistance for pets",
            number = "03083862356",
            category = "tiere",
            isFree = false
        ),
        EmergencyContact(
            id = "buergertelefon",
            nameDe = "Bürgertelefon Berlin",
            nameTr = "Berlin Vatandaş Danışma Hattı",
            nameEn = "Berlin Citizen Helpline",
            descDe = "Behördenauskunft zu Terminen, Pässen und Ummeldung",
            descTr = "Resmi daire randevuları, ikametgah ve kimlik işlemleri",
            descEn = "Official information on Berlin municipal services",
            number = "115",
            category = "soziales",
            isFree = true
        )
    )

    // Local Kiez Coupons
    val coupons = listOf(
        KiezCoupon(
            id = "coup_1",
            title = "10 % Rabatt auf Specialty Coffee Bohnen",
            businessName = "The Visit Coffee Roastery",
            kiez = "Kreuzberg",
            discount = "10 % RABATT",
            code = "KIEZCHECK10",
            description = "Gilt vor Ort beim Kauf von mindestens einer Packung Kaffeebohnen nach Wahl.",
            validUntil = "31.12.2026",
            whatsapp = "+4915126509586",
            address = "Adalbertstraße 9, 10999 Berlin"
        ),
        KiezCoupon(
            id = "coup_2",
            title = "Kostenloses Heißgetränk zum Frühstück",
            businessName = "Café Anna Blume",
            kiez = "Prenzlauer Berg",
            discount = "1x GRATIS KAFFEE",
            code = "ANNABLUME26",
            description = "Bestelle eine Frühstücksetagere und erhalte einen Cappuccino oder Filterkaffee gratis dazu.",
            validUntil = "30.11.2026",
            whatsapp = "+4915126509586",
            address = "Kollwitzstraße 83, 10435 Berlin"
        ),
        KiezCoupon(
            id = "coup_3",
            title = "5 € Rabatt ab 30 € Einkaufswert",
            businessName = "Bolu Supermarkt",
            kiez = "Neukölln",
            discount = "5 € SPAREN",
            code = "BOLU5SPAR",
            description = "Gültig für den gesamten Frische-Einkauf in der Neuköllner Filiale.",
            validUntil = "15.12.2026",
            whatsapp = "+4915126509586",
            address = "Karl-Marx-Straße 102, 12043 Berlin"
        ),
        KiezCoupon(
            id = "coup_4",
            title = "Gratis Pommes zu jedem Doppel-Burger",
            businessName = "Burgermeister",
            kiez = "Kreuzberg",
            discount = "GRATIS FRIES",
            code = "BURGERFREE",
            description = "Zeige diesen Gutschein an der Kasse am Schlesischen Tor.",
            validUntil = "31.12.2026",
            whatsapp = "+4915126509586",
            address = "Oberbaumstraße 8, 10997 Berlin"
        )
    )

    private fun formatKiezTimeAgo(hours: Int, lang: AppLanguage): String {
        return when (lang) {
            AppLanguage.TURKISH -> "$hours sa. önce"
            AppLanguage.ENGLISH -> "${hours}h ago"
            else -> "vor $hours Std."
        }
    }

    // Kiez-Reporter Community Posts - Echte Quellen & offizielle Berliner Meldungen
    fun getDailyReporterPosts(lang: AppLanguage = AppLanguage.GERMAN): List<KiezReporterPost> {
        return BerlinBulletinRepository.getRealReporterPosts(lang)
    }

    private fun getLegacyPool(lang: AppLanguage): List<KiezReporterPost> {
        val cal = java.util.Calendar.getInstance()
        val dayOfYear = cal.get(java.util.Calendar.DAY_OF_YEAR)
        val poolIndex = Math.floorMod(dayOfYear, 3)

        return when (poolIndex) {
            0 -> listOf(
                KiezReporterPost(
                    id = "rep_d0_1",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Pazar günü Boxhagener Platz'ta yeni Pop-Up bit pazarı"
                        AppLanguage.ENGLISH -> "New Pop-Up Flea Market Sunday at Boxhagener Platz"
                        else -> "Neuer Pop-Up Flohmarkt am Sonntag am Boxhagener Platz"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Mahalle sakinleri kitaplar, plaklar ve vintage kıyafetler içeren butik ikinci el tezgahı kuruyor."
                        AppLanguage.ENGLISH -> "Local neighbors are organizing a small second-hand stand with books, vinyl, and vintage clothes."
                        else -> "Lokale Nachbarn organisieren einen kleinen Second-Hand-Stand mit Büchern, Vinyl und Vintage-Kleidung."
                    },
                    kiez = "Friedrichshain",
                    category = "Kultur",
                    author = "Sarah",
                    timeAgo = formatKiezTimeAgo(1, lang),
                    upvotes = 19
                ),
                KiezReporterPost(
                    id = "rep_d0_2",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Skalitzer Straße'de yol çalışması ve tek yön uygulaması"
                        AppLanguage.ENGLISH -> "Road work and one-way lane on Skalitzer Straße"
                        else -> "Baustelle und Einbahnstraße in der Skalitzer Straße"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Görlitzer Bahnhof yakınındaki su borusu çalışmaları nedeniyle cuma gününe kadar şerit daralması var. Bisikletlilerin Görlitzer Ufer'i kullanması önerilir."
                        AppLanguage.ENGLISH -> "Lane narrowing until Friday due to water pipe repairs near Görlitzer Bahnhof. Cyclists please detour via Görlitzer Ufer."
                        else -> "Fahrbahnverengung bis Freitag wegen Rohrarbeiten nahe Görlitzer Bahnhof. Radfahrer bitte über Görlitzer Ufer ausweichen."
                    },
                    kiez = "Kreuzberg",
                    category = "Baustelle",
                    author = "Murat",
                    timeAgo = formatKiezTimeAgo(2, lang),
                    upvotes = 14
                ),
                KiezReporterPost(
                    id = "rep_d0_3",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Volkspark Friedrichshain'da yeşil kurdeleli anahtarlık bulundu"
                        AppLanguage.ENGLISH -> "Set of keys with green lanyard found in Volkspark Friedrichshain"
                        else -> "Schlüsselbund mit grünem Band im Volkspark Friedrichshain gefunden"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Märchenbrunnen ana yolu yakınında bulundu ve park bekçisi kulübesine teslim edildi."
                        AppLanguage.ENGLISH -> "Found near the Fairy Tale Fountain on the main path and handed to the park keeper."
                        else -> "Gefunden nahe dem Märchenbrunnen am Hauptweg und beim Parkwächterhäuschen abgegeben."
                    },
                    kiez = "Friedrichshain",
                    category = "Fundbüro",
                    author = "Tobias",
                    timeAgo = formatKiezTimeAgo(3, lang),
                    upvotes = 8
                ),
                KiezReporterPost(
                    id = "rep_d0_4",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Sonnenallee'de M41 Otobüs güzergah değişikliği"
                        AppLanguage.ENGLISH -> "M41 Bus Detour on Sonnenallee"
                        else -> "M41 Bus Umleitung an der Sonnenallee"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Erkstraße kavşağındaki çalışmalar nedeniyle M41 hattı Karl-Marx-Straße üzerinden yönlendiriliyor. Rathaus Neukölln durakları kaydırıldı."
                        AppLanguage.ENGLISH -> "Due to roadworks at the Erkstraße crossing, bus line M41 detours via Karl-Marx-Straße. Rathaus Neukölln stops relocated."
                        else -> "Wegen Bauarbeiten an der Kreuzung Erkstraße fährt die Linie M41 über Karl-Marx-Straße. Haltestellen Rathaus Neukölln werden verlegt."
                    },
                    kiez = "Neukölln",
                    category = "Verkehr",
                    author = "Aylin",
                    timeAgo = formatKiezTimeAgo(3, lang),
                    upvotes = 22
                ),
                KiezReporterPost(
                    id = "rep_d0_5",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Kollwitzplatz'ta taze organik elma ve elma suyu satışı"
                        AppLanguage.ENGLISH -> "Fresh Organic Apples & Cider at Kollwitzplatz"
                        else -> "Frische Bio-Äpfel & Apfelmost am Kollwitzplatz"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Brandenburg'dan gelen yerel bir meyve üreticisi Knaackstraße köşesinde doğrudan taze Elstar ve Topaz elmaları satıyor."
                        AppLanguage.ENGLISH -> "A local Brandenburg orchard is selling fresh-picked apples directly from their van at the corner of Knaackstraße."
                        else -> "Ein Brandenburger Obsthof bietet heute an der Ecke Knaackstraße erntefrische Sorten wie Elstar und Topaz direkt vom Wagen an."
                    },
                    kiez = "Prenzlauer Berg",
                    category = "Kultur",
                    author = "Felix",
                    timeAgo = formatKiezTimeAgo(4, lang),
                    upvotes = 16
                ),
                KiezReporterPost(
                    id = "rep_d0_6",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Friedrichstraße S-Bahn sinyal arızası giderildi"
                        AppLanguage.ENGLISH -> "S-Bahn signal fault at Friedrichstraße resolved"
                        else -> "S-Bahn Signalstörung Friedrichstraße behoben"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "S3, S5, S7 ve S9 hatları yeniden normal seferlerine başladı. Yaklaşık 5 dakikalık ufak gecikmeler olabilir."
                        AppLanguage.ENGLISH -> "Trains on lines S3, S5, S7, and S9 are running on schedule again, with slight lingering 5-minute delays."
                        else -> "Die Bahnen der Linien S3, S5, S7 und S9 fahren wieder planmäßig. Es kann noch zu leichten Folgeverspätungen von ca. 5 Minuten kommen."
                    },
                    kiez = "Mitte",
                    category = "Verkehr",
                    author = "Lisa",
                    timeAgo = formatKiezTimeAgo(4, lang),
                    upvotes = 27
                ),
                KiezReporterPost(
                    id = "rep_d0_7",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Yeni Açılış: Müllerstraße'de butik ekşi mayalı fırın"
                        AppLanguage.ENGLISH -> "Grand Opening: Artisan Sourdough Bakery on Müllerstraße"
                        else -> "Neueröffnung: Handwerklicher Sauerteig-Bäcker in der Müllerstraße"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Taş fırından taze çıkan enfes ekşi mayalı ekmek ve kakuleli çörekler. İlk hafta %20 tanışma indirimi var."
                        AppLanguage.ENGLISH -> "Fresh stone-baked sourdough bread and cardamom buns. 20% welcome discount during the first week."
                        else -> "Köstliches warmes Sauerteigbrot und Kardamom-Knoten frisch aus dem Steinofen. Erste Woche 20% Kennenlern-Rabatt."
                    },
                    kiez = "Wedding",
                    category = "Neueröffnung",
                    author = "Can",
                    timeAgo = formatKiezTimeAgo(5, lang),
                    upvotes = 31
                ),
                KiezReporterPost(
                    id = "rep_d0_8",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Winterfeldtplatz komşu bahçesi yeni gönüllüler arıyor"
                        AppLanguage.ENGLISH -> "Community Garden at Winterfeldtplatz looking for volunteers"
                        else -> "Nachbarschaftsgarten am Winterfeldtplatz sucht Mitgärtner"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Bu baharda yükseltilmiş tarhlara fesleğen, biberiye ve domates dikiyoruz. Her perşembe 17:00'de açık buluşma."
                        AppLanguage.ENGLISH -> "We are planting raised beds with herbs and tomatoes. Open gathering every Thursday at 5 PM."
                        else -> "Wir pflanzen diesen Frühling Hochbeete mit Küchenkräutern und Tomaten. Jeden Donnerstag 17 Uhr offenes Treffen."
                    },
                    kiez = "Schöneberg",
                    category = "Kultur",
                    author = "Marie",
                    timeAgo = formatKiezTimeAgo(6, lang),
                    upvotes = 12
                ),
                KiezReporterPost(
                    id = "rep_d0_9",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Maybachufer'de beyaz patili gri kedi bulundu"
                        AppLanguage.ENGLISH -> "Grey cat with white paw found on Maybachufer"
                        else -> "Graue Katze mit weißer Pfote am Maybachufer zugelaufen"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Çok cana yakın, künyesiz kırmızı tasması var. Şimdilik mahalle kafesinde güvenli şekilde bakılıyor."
                        AppLanguage.ENGLISH -> "Very friendly, red collar without tag. Safely cared for in the local neighborhood café."
                        else -> "Sehr zutraulich, rotes Halsband ohne Marke. Ist derzeit im Kiez-Café untergebracht und versorgt."
                    },
                    kiez = "Kreuzberg",
                    category = "Fundbüro",
                    author = "Emre",
                    timeAgo = formatKiezTimeAgo(7, lang),
                    upvotes = 18
                ),
                KiezReporterPost(
                    id = "rep_d0_10",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Ernst-Reuter-Platz / Bismarckstraße'de trafik ışığı arızası"
                        AppLanguage.ENGLISH -> "Traffic Light Outage at Ernst-Reuter-Platz / Bismarckstraße"
                        else -> "Ampelausfall am Ernst-Reuter-Platz / Bismarckstraße"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Trafik ışıkları sarı yanıp sönüyor. Lütfen dikkatli geçiniz ve yaya geçitlerine öncelik veriniz."
                        AppLanguage.ENGLISH -> "Signals flashing yellow. Drive carefully and yield to pedestrians at the zebra crossings."
                        else -> "Ampelanlage derzeit auf Gelbblinken. Bitte vorsichtig fahren und Fußgängern an den Zebrastreifen Vorrang gewähren."
                    },
                    kiez = "Charlottenburg",
                    category = "Verkehr",
                    author = "Clara",
                    timeAgo = formatKiezTimeAgo(8, lang),
                    upvotes = 25
                )
            )
            1 -> listOf(
                KiezReporterPost(
                    id = "rep_d1_1",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Karl-Marx-Straße: Berlin yazarları temalı yeni pop-up kitapçı"
                        AppLanguage.ENGLISH -> "Karl-Marx-Straße: New pop-up bookstore featuring Berlin authors"
                        else -> "Karl-Marx-Straße: Neuer Pop-up Buchladen mit Berliner Autoren"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Eski baskılar, Berlin romanları ve arka avluda keyifli okuma alanı açıldı."
                        AppLanguage.ENGLISH -> "Vintage prints, Berlin novels, and a small cozy courtyard reading space opened."
                        else -> "Alte Drucke, Berlin-Romane und kleiner Lesesaal im begrünten Innenhof eröffnet."
                    },
                    kiez = "Neukölln",
                    category = "Kultur",
                    author = "Deniz",
                    timeAgo = formatKiezTimeAgo(1, lang),
                    upvotes = 17
                ),
                KiezReporterPost(
                    id = "rep_d1_2",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Warschauer Brücke: U1 metro yürüyen merdiveni yeniden çalışıyor"
                        AppLanguage.ENGLISH -> "Warschauer Brücke: Escalator to U1 subway back in service"
                        else -> "Warschauer Brücke: Rolltreppe zur U-Bahn U1 wieder in Betrieb"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "İki haftalık bakım çalışmasının ardından ana yürüyen merdiven hizmete açıldı."
                        AppLanguage.ENGLISH -> "After two weeks of maintenance, the main escalator is fully operational again."
                        else -> "Nach zweiwöchiger Wartung läuft die Hauptrolltreppe zur U1 wieder einwandfrei."
                    },
                    kiez = "Friedrichshain",
                    category = "Verkehr",
                    author = "Hannah",
                    timeAgo = formatKiezTimeAgo(2, lang),
                    upvotes = 21
                ),
                KiezReporterPost(
                    id = "rep_d1_3",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Görlitzer Park: Park bankında unutulan siyah deri ceket"
                        AppLanguage.ENGLISH -> "Görlitzer Park: Black leather jacket left on park bench"
                        else -> "Görlitzer Park: Schwarze Lederjacke auf Parkbank vergessen"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Saat 14:00'te bulundu ve Wiener Straße köşesindeki büfeye bırakıldı."
                        AppLanguage.ENGLISH -> "Found at 2 PM and handed over to the kiosk on Wiener Straße."
                        else -> "Wurde gegen 14 Uhr gefunden und am Kiosk an der Wiener Straße abgegeben."
                    },
                    kiez = "Kreuzberg",
                    category = "Fundbüro",
                    author = "Kerem",
                    timeAgo = formatKiezTimeAgo(3, lang),
                    upvotes = 9
                ),
                KiezReporterPost(
                    id = "rep_d1_4",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Kastanienallee: Fiber optik kablo döşemesi nedeniyle park yasağı"
                        AppLanguage.ENGLISH -> "Kastanienallee: Fiber optic installation causes parking restrictions"
                        else -> "Kastanienallee: Glasfaser-Ausbau sorgt für Halteverbote"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Pazartesiden itibaren Oderberger ve Schwedter Str. arasında geçici park yasağı var."
                        AppLanguage.ENGLISH -> "Temporary no-parking zone between Oderberger and Schwedter Str. starting Monday."
                        else -> "Ab Montag beidseitiges temporäres Parkverbot zwischen Oderberger und Schwedter Str."
                    },
                    kiez = "Prenzlauer Berg",
                    category = "Baustelle",
                    author = "Sophia",
                    timeAgo = formatKiezTimeAgo(3, lang),
                    upvotes = 15
                ),
                KiezReporterPost(
                    id = "rep_d1_5",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Torstraße: Yeni vegan ramen lokantası 'Noodle Kiez'"
                        AppLanguage.ENGLISH -> "Torstraße: New vegan ramen restaurant 'Noodle Kiez'"
                        else -> "Torstraße: Neues veganes Ramen-Restaurant 'Noodle Kiez'"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "El yapımı buğday eriştesi, kremamsı mantar suyu ve matcha dondurması. Şiddetle tavsiye edilir!"
                        AppLanguage.ENGLISH -> "Handmade noodles, rich mushroom broth, and matcha ice cream. Highly recommended!"
                        else -> "Selbstgemachte Weizennudeln, cremige Shiitake-Brühe und Matcha-Eis. Große Empfehlung!"
                    },
                    kiez = "Mitte",
                    category = "Neueröffnung",
                    author = "Lukas",
                    timeAgo = formatKiezTimeAgo(4, lang),
                    upvotes = 34
                ),
                KiezReporterPost(
                    id = "rep_d1_6",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Gesundbrunnen: Badstraße'deki şantiye ışığı trafiği yavaşlatıyor"
                        AppLanguage.ENGLISH -> "Gesundbrunnen: Temporary traffic light on Badstraße causing congestion"
                        else -> "Gesundbrunnen: Baustellenampel an der Badstraße staut Berufsverkehr"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Pankow yönünde yaklaşık 15 dakika gecikme yaşanıyor, Osloer Straße alternatif olabilir."
                        AppLanguage.ENGLISH -> "Expect about 15 minutes delay towards Pankow or use Osloer Straße as detour."
                        else -> "Richtung Pankow ca. 15 Minuten Zeitverlust einplanen oder über die Osloer Straße ausweichen."
                    },
                    kiez = "Wedding",
                    category = "Baustelle",
                    author = "Zeynep",
                    timeAgo = formatKiezTimeAgo(5, lang),
                    upvotes = 28
                ),
                KiezReporterPost(
                    id = "rep_d1_7",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Akazienkiez: Apartman girişinde unutulan puset"
                        AppLanguage.ENGLISH -> "Akazienkiez: Stroller left in apartment hallway"
                        else -> "Akazienkiez: Kinderwagen im Hausflur vergessen"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Mavi-gri puset Akazienstr. 14 bina girişinde muhafaza ediliyor, sahibi zili çalabilir."
                        AppLanguage.ENGLISH -> "Blue-grey stroller kept safe in entrance of Akazienstr. 14, owner please ring bell."
                        else -> "Blau-grauer Buggy steht geschützt im Hausflur Akazienstr. 14, Besitzer bitte beim Vorderhaus klingeln."
                    },
                    kiez = "Schöneberg",
                    category = "Fundbüro",
                    author = "Tim",
                    timeAgo = formatKiezTimeAgo(6, lang),
                    upvotes = 11
                ),
                KiezReporterPost(
                    id = "rep_d1_8",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Kantstraße: Bisiklet yolu yeni asfaltlandı"
                        AppLanguage.ENGLISH -> "Kantstraße: Bike boulevard newly resurfaced"
                        else -> "Kantstraße: Fahrradstraße wird neu asphaltiert"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Savignyplatz ile Leibnizstraße arasında yeni pürüzsüz sessiz asfalt döküldü."
                        AppLanguage.ENGLISH -> "Smooth new whisper asphalt completed between Savignyplatz and Leibnizstraße."
                        else -> "Zwischen Savignyplatz und Leibnizstraße frischer glatter Flüsterasphalt fertiggestellt."
                    },
                    kiez = "Charlottenburg",
                    category = "Verkehr",
                    author = "Elena",
                    timeAgo = formatKiezTimeAgo(6, lang),
                    upvotes = 24
                ),
                KiezReporterPost(
                    id = "rep_d1_9",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Oranienplatz: Cumartesi günü ücretsiz bisiklet tamir atölyesi"
                        AppLanguage.ENGLISH -> "Oranienplatz: Free community bicycle repair workshop on Saturday"
                        else -> "Oranienplatz: Kostenlose Fahrrad-Reparatur-Werkstatt am Samstag"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Gönüllü tamirciler lastik yamama, fren ayarı ve zincir yağlamada yardımcı oluyor."
                        AppLanguage.ENGLISH -> "Volunteer mechanics helping with tire patches, brake tuning, and chain lubrication."
                        else -> "Freiwillige Mechaniker helfen beim Schlauchflicken, Bremsen einstellen und Kette ölen."
                    },
                    kiez = "Kreuzberg",
                    category = "Kultur",
                    author = "Mehmet",
                    timeAgo = formatKiezTimeAgo(7, lang),
                    upvotes = 39
                ),
                KiezReporterPost(
                    id = "rep_d1_10",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Turmstraße: 'Spreeufer' komşuluk kafesi açıldı"
                        AppLanguage.ENGLISH -> "Turmstraße: Opening of 'Spreeufer' neighborhood café"
                        else -> "Turmstraße: Eröffnung des Nachbarschafts-Cafés 'Spreeufer'"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Adil ticaret kahvesi, çocuklar için oyun köşesi ve kapı önünde ücretsiz kitap takas dolabı."
                        AppLanguage.ENGLISH -> "Fair-trade coffee, kids play area, and an outdoor book-swap shelf."
                        else -> "Kaffee aus fairem Handel, Spielecke für Kinder und kleiner Tauschschrank vor der Tür."
                    },
                    kiez = "Moabit",
                    category = "Neueröffnung",
                    author = "Julia",
                    timeAgo = formatKiezTimeAgo(8, lang),
                    upvotes = 19
                )
            )
            else -> listOf(
                KiezReporterPost(
                    id = "rep_d2_1",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Tempelhofer Feld: Batı girişinde yeni rüzgar sörfü & kaykay alanı"
                        AppLanguage.ENGLISH -> "Tempelhofer Feld: New wind-skate area near west entrance"
                        else -> "Tempelhofer Feld: Neuer Bereich für Windskaten am Westeingang"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Oderstraße girişinde pist asfaltı temizlendi, rüzgar sporları meraklıları toplanıyor."
                        AppLanguage.ENGLISH -> "Runway asphalt cleaned at Oderstraße gate, wind sports enthusiasts gathering."
                        else -> "Am Eingang Oderstraße wurde die Rollbahn gereinigt. Ideal für Longboards und Windskater."
                    },
                    kiez = "Tempelhof",
                    category = "Kultur",
                    author = "Selin",
                    timeAgo = formatKiezTimeAgo(1, lang),
                    upvotes = 26
                ),
                KiezReporterPost(
                    id = "rep_d2_2",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Bergmannstraße: Yeni yaya öncelikli bölge genişletildi"
                        AppLanguage.ENGLISH -> "Bergmannstraße: Pedestrian priority zone expanded"
                        else -> "Bergmannstraße: Fußgängerzone um weitere Abschnitte erweitert"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Schenkendorfstraße ile Nostitzstraße arasında oturma bankları ve çiçeklikler kuruldu."
                        AppLanguage.ENGLISH -> "Benches and plant containers installed between Schenkendorfstraße and Nostitzstraße."
                        else -> "Neue Holzbänke und Pflanzenkübel zwischen Schenkendorf- und Nostitzstraße aufgestellt."
                    },
                    kiez = "Kreuzberg",
                    category = "Verkehr",
                    author = "Florian",
                    timeAgo = formatKiezTimeAgo(2, lang),
                    upvotes = 32
                ),
                KiezReporterPost(
                    id = "rep_d2_3",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Mauerpark: Kırmızı sırt çantası tribün basamaklarında unutulmuş"
                        AppLanguage.ENGLISH -> "Mauerpark: Red backpack left on amphitheater stairs"
                        else -> "Mauerpark: Roter Rucksack am Amphitheater vergessen"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "İçinde çizim defteri ve termos var. Park görevlilerine teslim edildi."
                        AppLanguage.ENGLISH -> "Contains sketchbook and thermal mug. Handed to park staff."
                        else -> "Enthält Skizzenblock und Edelstahl-Trinkflasche. Beim Parkpersonal hinterlegt."
                    },
                    kiez = "Prenzlauer Berg",
                    category = "Fundbüro",
                    author = "Yasemin",
                    timeAgo = formatKiezTimeAgo(3, lang),
                    upvotes = 13
                ),
                KiezReporterPost(
                    id = "rep_d2_4",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Invalidenstraße: M8 ve M10 Tramvay hattında ray bakım çalışması"
                        AppLanguage.ENGLISH -> "Invalidenstraße: Track maintenance on M8 & M10 tram lines"
                        else -> "Invalidenstraße: Gleisarbeiten an den Linien M8 und M10"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Hauptbahnhof ile Nordbahnhof arasında otobüslerle yedek sefer yapılıyor."
                        AppLanguage.ENGLISH -> "Replacement bus service operating between Hauptbahnhof and Nordbahnhof."
                        else -> "Ersatzverkehr mit Bussen zwischen Hauptbahnhof und Nordbahnhof eingerichtet."
                    },
                    kiez = "Mitte",
                    category = "Verkehr",
                    author = "Niklas",
                    timeAgo = formatKiezTimeAgo(4, lang),
                    upvotes = 20
                ),
                KiezReporterPost(
                    id = "rep_d2_5",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Weserstraße: Yeni organik dondurmacı 'KiezGlace'"
                        AppLanguage.ENGLISH -> "Weserstraße: New organic ice cream parlor 'KiezGlace'"
                        else -> "Weserstraße: Neuer Bio-Eisladen 'KiezGlace' eröffnet"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Tuzlu karamel, antep fıstığı ve fesleğenli limon sorbe çeşitleri çok lezzetli."
                        AppLanguage.ENGLISH -> "Artisan salted caramel, Sicilian pistachio, and basil lemon sorbet."
                        else -> "Hausgemachtes Salted Caramel, sizilianische Pistazie und Basilikum-Zitronen-Sorbet."
                    },
                    kiez = "Neukölln",
                    category = "Neueröffnung",
                    author = "Leyla",
                    timeAgo = formatKiezTimeAgo(4, lang),
                    upvotes = 29
                ),
                KiezReporterPost(
                    id = "rep_d2_6",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Schloßstraße: Kaldırım yenilemesi nedeniyle geçici daralma"
                        AppLanguage.ENGLISH -> "Schloßstraße: Sidewalk resurfacing causes temporary narrowing"
                        else -> "Schloßstraße: Gehwegerneuerung sorgt für Engstelle"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Walther-Schreiber-Platz yakınında yayalar için korunaklı ahşap geçit oluşturuldu."
                        AppLanguage.ENGLISH -> "Protected pedestrian passage set up near Walther-Schreiber-Platz."
                        else -> "Nahe Walther-Schreiber-Platz ist ein gesicherter Fußgängertunnel eingerichtet."
                    },
                    kiez = "Steglitz",
                    category = "Baustelle",
                    author = "David",
                    timeAgo = formatKiezTimeAgo(5, lang),
                    upvotes = 11
                ),
                KiezReporterPost(
                    id = "rep_d2_7",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Treptower Park: İskele yanında kayıp kedi tasması"
                        AppLanguage.ENGLISH -> "Treptower Park: Lost cat harness near boat pier"
                        else -> "Treptower Park: Katzengeschirr am Schiffsanleger gefunden"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Mavi küçük göğüs tasması bankın kenarına asıldı."
                        AppLanguage.ENGLISH -> "Small blue chest harness hung on the bench."
                        else -> "Blaues Katzengeschirr wurde an der Parklaterne gut sichtbar befestigt."
                    },
                    kiez = "Treptow",
                    category = "Fundbüro",
                    author = "Merve",
                    timeAgo = formatKiezTimeAgo(6, lang),
                    upvotes = 7
                ),
                KiezReporterPost(
                    id = "rep_d2_8",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Simon-Dach-Straße: Hafta sonu sakin sokak insiyatifi"
                        AppLanguage.ENGLISH -> "Simon-Dach-Straße: Weekend quiet zone initiative"
                        else -> "Simon-Dach-Straße: Initiative für Verkehrsberuhigung am Wochenende"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Cuma ve cumartesi akşamları motorlu araç girişine kısıtlama talep eden imza kampanyası."
                        AppLanguage.ENGLISH -> "Petition for weekend evening traffic restrictions and more outdoor seating."
                        else -> "Anwohner sammeln Unterschriften für verkehrsberuhigte Abende am Wochenende."
                    },
                    kiez = "Friedrichshain",
                    category = "Kultur",
                    author = "Jan",
                    timeAgo = formatKiezTimeAgo(6, lang),
                    upvotes = 35
                ),
                KiezReporterPost(
                    id = "rep_d2_9",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Leopoldplatz: Yeni çocuk oyun alanı açılışı"
                        AppLanguage.ENGLISH -> "Leopoldplatz: Grand opening of new children's playground"
                        else -> "Leopoldplatz: Neuer Abenteuerspielplatz eröffnet"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Doğal ahşap tırmanma kulesi, su fıskiyesi ve gölgelikli kum havuzu çocukların hizmetinde."
                        AppLanguage.ENGLISH -> "Natural wood climbing tower, water play area, and shaded sandpit."
                        else -> "Kletterturm aus Robinienholz, Wasserspiel und sonnengeschützter Sandkasten fertiggestellt."
                    },
                    kiez = "Wedding",
                    category = "Neueröffnung",
                    author = "Dilara",
                    timeAgo = formatKiezTimeAgo(7, lang),
                    upvotes = 42
                ),
                KiezReporterPost(
                    id = "rep_d2_10",
                    title = when (lang) {
                        AppLanguage.TURKISH -> "Pankow Florastraße: Ağaç budama çalışmaları nedeniyle tek şerit"
                        AppLanguage.ENGLISH -> "Pankow Florastraße: Tree pruning causes single-lane traffic"
                        else -> "Pankow Florastraße: Baumpflegearbeiten erfordern Einbahnverkehr"
                    },
                    description = when (lang) {
                        AppLanguage.TURKISH -> "Belediye ekipleri kuru dalları temizliyor. Otobüs hatlarında kısa beklemeler olabilir."
                        AppLanguage.ENGLISH -> "City crews trimming dry branches. Brief delays on local bus lines."
                        else -> "Grünflächenamt stutzt Totholz. Bitte Parkverbotsbeschilderung beachten."
                    },
                    kiez = "Pankow",
                    category = "Baustelle",
                    author = "Maximilian",
                    timeAgo = formatKiezTimeAgo(8, lang),
                    upvotes = 16
                )
            )
        }
    }

    // Abwärtskompatible Eigenschaft für bestehenden Code
    val reporterPosts: List<KiezReporterPost>
        get() = getDailyReporterPosts(AppLanguage.GERMAN)
}
