package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppLanguage
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinRedLight
import com.example.ui.theme.BerlinYellow
import com.example.util.MapHelper

data class TransitLineInfo(
    val code: String,
    val name: String,
    val type: String, // "U-Bahn", "S-Bahn", "Tram"
    val color: Color,
    val terminus: String,
    val majorStations: List<String>
)

data class OfficialTransitMapCard(
    val id: String,
    val titleDe: String,
    val titleTr: String,
    val subtitleDe: String,
    val subtitleTr: String,
    val badge: String,
    val url: String,
    val iconColor: Color,
    val isPdf: Boolean = false
)

@Composable
fun BerlinTransitMapComponent(
    language: AppLanguage,
    initialSelectedLine: String? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    // Resmî U-Bahn, S-Bahn & BVG Ağ Haritaları
    val officialMaps = remember {
        listOf(
            OfficialTransitMapCard(
                id = "bvg_pdf",
                titleDe = "BVG S+U-Bahn Netzplan (Berlin ABC)",
                titleTr = "Resmî S+U-Bahn Hat Haritası (PDF Tam Boy)",
                subtitleDe = "Offizieller BVG Hochauflösender Netzplan (U-Bahn & S-Bahn)",
                subtitleTr = "Berlin'in tüm metro ve banliyö tren ağı resmî PDF haritası",
                badge = "PDF NETZPLAN",
                url = "https://www.bvg.de/dam/jcr:b2bf0dfc-8db5-48fa-bb64-cba0ec99fa28/S+U-Bahn-Netz.pdf",
                iconColor = Color(0xFFF3C400),
                isPdf = true
            ),
            OfficialTransitMapCard(
                id = "sbahn_netz",
                titleDe = "S-Bahn Berlin Liniennetz",
                titleTr = "S-Bahn Berlin Resmî Hat Ağı",
                subtitleDe = "Offizielles Streckennetz der S-Bahn Berlin (Ringbahn & Stadtbahn)",
                subtitleTr = "Ringbahn ve banliyö hatları resmî Deutsche Bahn haritası",
                badge = "S-BAHN BERLIN",
                url = "https://sbahn.berlin/liniennetz/",
                iconColor = Color(0xFF007E33)
            ),
            OfficialTransitMapCard(
                id = "bvg_portal",
                titleDe = "BVG Liniennetz & Tarifzonen Portal",
                titleTr = "BVG Resmî Hatlar & Tarifeler Portalı",
                subtitleDe = "Interaktive Netzpläne, Tram, Bus und Fähren",
                subtitleTr = "Resmî BVG metro, tramvay, otobüs ve vapur hatları",
                badge = "BVG.DE",
                url = "https://www.bvg.de/de/verbindungen/liniennetz",
                iconColor = Color(0xFFF3C400)
            ),
            OfficialTransitMapCard(
                id = "bvg_disruption",
                titleDe = "BVG Störungsmeldungen & Live-Lage",
                titleTr = "BVG Canlı Sefer & Kesinti Bildirimleri",
                subtitleDe = "Aktuelle Betriebslage, Baustellen und Ausfälle",
                subtitleTr = "U-Bahn, Tram ve otobüs canlı arıza ve sefer durumları",
                badge = "LIVE STÖRUNG",
                url = "https://www.bvg.de/de/verbindungen/stoerungsmeldungen",
                iconColor = BerlinRed
            ),
            OfficialTransitMapCard(
                id = "vbb_portal",
                titleDe = "VBB Verkehrsverbund Berlin-Brandenburg",
                titleTr = "VBB Berlin & Çevre Eyalet Raylı Ağı",
                subtitleDe = "Regionalbahn- und Gesamtraum-Netzpläne",
                subtitleTr = "Bölgesel trenler (RE/RB) ve banliyö ağ haritası",
                badge = "VBB.DE",
                url = "https://www.vbb.de/fahrinfo/liniennetze/",
                iconColor = Color(0xFF1A73E8)
            )
        )
    }

    val transitLines = remember {
        listOf(
            TransitLineInfo("Ringbahn S41/S42", "S-Bahn Ring", "S-Bahn", Color(0xFF782522), "Ringbahn (Vollkreis)", listOf("Ostkreuz", "Südkreuz", "Westkreuz", "Gesundbrunnen", "Treptower Park")),
            TransitLineInfo("U1", "U-Bahn U1", "U-Bahn", Color(0xFF65AC38), "Uhlandstraße ↔ Warschauer Straße", listOf("Kottbusser Tor", "Hallesches Tor", "Möckernbrücke", "Wittenbergplatz")),
            TransitLineInfo("U2", "U-Bahn U2", "U-Bahn", Color(0xFFE31B23), "Pankow ↔ Ruhleben", listOf("Pankow", "Alexanderplatz", "Stadtmitte", "Potsdamer Platz", "Zoologischer Garten")),
            TransitLineInfo("U3", "U-Bahn U3", "U-Bahn", Color(0xFF009C77), "Warschauer Straße ↔ Krumme Lanke", listOf("Warschauer Str.", "Kottbusser Tor", "Wittenbergplatz", "Fehrbelliner Platz", "Krumme Lanke")),
            TransitLineInfo("U5", "U-Bahn U5", "U-Bahn", Color(0xFF7E5330), "Hauptbahnhof ↔ Hönow", listOf("Hauptbahnhof", "Brandenburger Tor", "Unter den Linden", "Alexanderplatz", "Frankfurter Allee")),
            TransitLineInfo("U6", "U-Bahn U6", "U-Bahn", Color(0xFF6B4B9A), "Alt-Tegel ↔ Alt-Mariendorf", listOf("Wedding", "Friedrichstraße", "Stadtmitte", "Mehringdamm", "Tempelhof")),
            TransitLineInfo("U7", "U-Bahn U7", "U-Bahn", Color(0xFF009ED7), "Rathaus Spandau ↔ Rudow", listOf("Rathaus Spandau", "Bismarckstraße", "Fehrbelliner Platz", "Yorckstraße", "Hermannplatz", "Neukölln")),
            TransitLineInfo("U8", "U-Bahn U8", "U-Bahn", Color(0xFF135A9C), "Wittenau ↔ Hermannstraße", listOf("Osloer Straße", "Gesundbrunnen", "Rosenthaler Platz", "Alexanderplatz", "Kottbusser Tor", "Hermannplatz")),
            TransitLineInfo("U9", "U-Bahn U9", "U-Bahn", Color(0xFFF37920), "Osloer Straße ↔ Rathaus Steglitz", listOf("Osloer Straße", "Leopoldplatz", "Turmstraße", "Zoologischer Garten", "Kurfürstendamm", "Rathaus Steglitz")),
            TransitLineInfo("Stadtbahn", "S-Bahn Stadtbahn (S3, S5, S7, S9)", "S-Bahn", Color(0xFF007E33), "Spandau / Potsdam ↔ Erkner / Flughafen BER", listOf("Charlottenburg", "Zoologischer Garten", "Hauptbahnhof", "Friedrichstraße", "Alexanderplatz", "Ostbahnhof", "Ostkreuz")),
            TransitLineInfo("Nord-Süd", "S-Bahn Nord-Süd (S1, S2, S25, S26)", "S-Bahn", Color(0xFF006F45), "Bernau / Hennigsdorf ↔ Wannsee / Teltow", listOf("Gesundbrunnen", "Friedrichstraße", "Potsdamer Platz", "Yorckstraße", "Schöneberg"))
        )
    }

    var selectedLine by remember {
        mutableStateOf(transitLines.find { it.code == initialSelectedLine } ?: transitLines[0])
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 32.dp)
    ) {
        // Quick Action Bar: BVG & Google Maps External links
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.DirectionsSubway,
                        contentDescription = null,
                        tint = BerlinRed,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Berlin Resmî Ulaşım Ağları" else "Berliner Liniennetz & Pläne",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF34A853),
                    modifier = Modifier.clickable {
                        MapHelper.openGoogleMaps(context, "Berlin Transit ÖPNV")
                    }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Map, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                        Text(text = "Google Maps", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // RESMÎ ULAŞIM KARTLARI (Kullanıcı tıkladığı an doğrudan resmî harita ve linke gider)
        Text(
            text = if (language == AppLanguage.TURKISH) "🚇 Resmî U-Bahn & S-Bahn Ağ Haritaları" else "🚇 Offizielle Netzpläne & BVG-Karten",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            officialMaps.forEach { mapCard ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(mapCard.url)).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            context.startActivity(browserIntent)
                        },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = mapCard.iconColor.copy(alpha = 0.15f),
                            modifier = Modifier.size(44.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = if (mapCard.isPdf) Icons.Default.PictureAsPdf else Icons.Default.DirectionsSubway,
                                    contentDescription = null,
                                    tint = mapCard.iconColor,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = mapCard.iconColor.copy(alpha = 0.2f)
                                ) {
                                    Text(
                                        text = mapCard.badge,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Black,
                                        color = mapCard.iconColor,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (language == AppLanguage.TURKISH) mapCard.titleTr else mapCard.titleDe,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) mapCard.subtitleTr else mapCard.subtitleDe,
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Icon(
                            imageVector = Icons.Default.OpenInNew,
                            contentDescription = "Aç",
                            tint = BerlinRed,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // HATLAR VE İSTASYON DETAYLARI
        Text(
            text = if (language == AppLanguage.TURKISH) "🚉 Berlin Metro & Banliyö Hatları (Hızlı İstasyon Rehberi)" else "🚉 Berliner Linien (Stationen & Route)",
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
        )

        // Horizontal Line Selector Badges
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 14.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            transitLines.forEach { line ->
                val isSelected = selectedLine.code == line.code
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isSelected) line.color else line.color.copy(alpha = 0.15f),
                    modifier = Modifier.clickable { selectedLine = line }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = if (isSelected) Color.White else line.color,
                            modifier = Modifier.size(8.dp)
                        ) {}
                        Text(
                            text = line.code,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Selected Line Detail Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 6.dp),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = selectedLine.color
                        ) {
                            Text(
                                text = selectedLine.code,
                                color = Color.White,
                                fontWeight = FontWeight.Black,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                        Text(
                            text = selectedLine.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    Text(
                        text = selectedLine.type,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Güzergâh: ${selectedLine.terminus}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = if (language == AppLanguage.TURKISH) "Önemli Aktarma İstasyonları (Google Maps Tek Tık):" else "Wichtige Bahnhöfe (Google Maps 1-Klick):",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    selectedLine.majorStations.forEach { station ->
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.clickable {
                                MapHelper.openGoogleMaps(context, "S+U $station Berlin")
                            }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = selectedLine.color, modifier = Modifier.size(12.dp))
                                Text(text = station, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }
            }
        }
    }
}
