package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.LocalPolice
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.model.AppLanguage
import com.example.data.repository.SampleData
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinGreenLight
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinRedLight

@Composable
fun EmergencyScreen(
    language: AppLanguage,
    onNavigateToLiveBulletin: () -> Unit = {}
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Notrufe, 1: Kiez-Polizei, 2: Portale
    var searchQuery by remember { mutableStateOf("") }

    val filteredKieze = remember(searchQuery) {
        if (searchQuery.isBlank()) {
            SampleData.kieze.filter { it.policeStation.isNotBlank() }
        } else {
            SampleData.kieze.filter {
                it.policeStation.isNotBlank() &&
                        (it.name.contains(searchQuery, ignoreCase = true) ||
                                it.policeStation.contains(searchQuery, ignoreCase = true) ||
                                it.policeAddress.contains(searchQuery, ignoreCase = true))
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Top Banner with Full Official My Kiez Berlin Logo
        Surface(
            color = BerlinRed.copy(alpha = 0.08f),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, BerlinRed.copy(alpha = 0.3f))
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color.White,
                    shadowElevation = 2.dp,
                    modifier = Modifier.size(52.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.mykiez_logo),
                        contentDescription = "My Kiez Berlin Logo",
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.Fit
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Berlin Acil Durum & Karakollar" else "Berlin Notruf & Polizeiwachen",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = BerlinRed
                    )
                    Text(
                        text = if (language == AppLanguage.TURKISH)
                            "Dokunarak doğrudan arayabilirsiniz. 110 ve 112 ücretsizdir."
                        else
                            "Direkt per Fingertipp anrufen. Polizei (110) & Feuerwehr (112) sind kostenlos.",
                        fontSize = 11.5.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Tab Selector: [ 🚨 Zentrale Notrufe | 👮 22 Mahalle Karakolu | 🏛️ Resmî Portallar ]
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            shape = RoundedCornerShape(10.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Row(modifier = Modifier.padding(3.dp)) {
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { selectedTab = 0 },
                    shape = RoundedCornerShape(8.dp),
                    color = if (selectedTab == 0) BerlinRed else Color.Transparent
                ) {
                    Box(
                        modifier = Modifier.padding(vertical = 7.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "🚨 Acil Hatlar" else "🚨 Notrufe",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            color = if (selectedTab == 0) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { selectedTab = 1 },
                    shape = RoundedCornerShape(8.dp),
                    color = if (selectedTab == 1) BerlinRed else Color.Transparent
                ) {
                    Box(
                        modifier = Modifier.padding(vertical = 7.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "👮 Karakollar" else "👮 Wachen",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            color = if (selectedTab == 1) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Surface(
                    modifier = Modifier
                        .weight(1.1f)
                        .clickable { selectedTab = 2 },
                    shape = RoundedCornerShape(8.dp),
                    color = if (selectedTab == 2) BerlinRed else Color.Transparent
                ) {
                    Box(
                        modifier = Modifier.padding(vertical = 7.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "🏛️ Resmî Portallar" else "🏛️ Portale & BVG",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            color = if (selectedTab == 2) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        if (selectedTab == 0) {
            // Zentrale Notrufnummern
            LazyColumn(
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 6.dp, bottom = 90.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(SampleData.emergencyContacts) { contact ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${contact.number}"))
                                context.startActivity(intent)
                            },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = when (language) {
                                            AppLanguage.TURKISH -> contact.nameTr
                                            AppLanguage.ENGLISH -> contact.nameEn
                                            else -> contact.nameDe
                                        },
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    if (contact.isFree) {
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = BerlinGreen.copy(alpha = 0.15f)
                                        ) {
                                            Text(
                                                text = if (language == AppLanguage.TURKISH) "Ücretsiz" else "Gebührenfrei",
                                                color = BerlinGreen,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = when (language) {
                                        AppLanguage.TURKISH -> contact.descTr
                                        AppLanguage.ENGLISH -> contact.descEn
                                        else -> contact.descDe
                                    },
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    lineHeight = 16.sp
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = BerlinRed,
                                modifier = Modifier.padding(start = 10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Call,
                                        contentDescription = "Anrufen",
                                        tint = Color.White,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = contact.number,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        } else if (selectedTab == 1) {
            // 22 Mahalle Karakolu Listesi
            Column(modifier = Modifier.fillMaxSize()) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Mahalle veya karakol ara (örn. Neukölln, 53)..." else "Kiez oder Abschnitt suchen...",
                            fontSize = 12.sp
                        )
                    },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(18.dp))
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp)
                )

                LazyColumn(
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 6.dp, bottom = 90.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredKieze) { kiez ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
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
                                            shape = CircleShape,
                                            color = BerlinGreenLight,
                                            modifier = Modifier.size(32.dp)
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Icon(imageVector = Icons.Default.LocalPolice, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(18.dp))
                                            }
                                        }

                                        Column {
                                            Text(
                                                text = kiez.policeStation,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp
                                            )
                                            Text(
                                                text = "${kiez.name} · ${kiez.buergeramtName}",
                                                fontSize = 11.5.sp,
                                                color = BerlinRed,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                        }
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = BerlinGreen,
                                        modifier = Modifier.clickable {
                                            val dial = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${kiez.policePhone.replace(" ", "")}"))
                                            context.startActivity(dial)
                                        }
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(imageVector = Icons.Default.Call, contentDescription = null, tint = Color.White, modifier = Modifier.size(13.dp))
                                            Text(text = "Ara", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Adres: ${kiez.policeAddress}",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "Tel: ${kiez.policePhone}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }
        } else {
            // Tab 2: Resmî Berlin Kamu ve Ulaşım Portalları (Telif / Güvenlik Riski Olmayan Resmi Linkler)
            val officialPortals = listOf(
                OfficialPortalInfo(
                    title = "Berlin.de Resmî Etkinlikler & Festivaller",
                    url = "https://www.berlin.de/events/volksfeste/",
                    desc = "Volksfeste, Ekim festivalleri, kültür, tiyatro ve müzik etkinlikleri resmi rehberi."
                ),
                OfficialPortalInfo(
                    title = "Berlin.de Eyalet Resmî Ana Portalı",
                    url = "https://www.berlin.de/",
                    desc = "Berlin Eyaleti resmi hükümet, kamu ve şehir rehberi ana sayfası."
                ),
                OfficialPortalInfo(
                    title = "Polizei Berlin (Resmî Güvenlik)",
                    url = "https://www.berlin.de/polizei/",
                    desc = "Berlin Emniyet Müdürlüğü resmi duyuruları, basın bültenleri ve karakol rehberi."
                ),
                OfficialPortalInfo(
                    title = "Polizei Berlin Internetwache (Online İhbar)",
                    url = "https://www.internetwache-polizei-berlin.de/",
                    desc = "Online suç duyurusu, ihbar bildirme ve resmi emniyet servisleri."
                ),
                OfficialPortalInfo(
                    title = "BVG (Berliner Verkehrsbetriebe)",
                    url = "https://www.bvg.de/de/verbindungen/stoerungsmeldungen",
                    desc = "U-Bahn, Tram ve Otobüs canlı sefer durumları, arıza ve gecikme bildirimleri."
                ),
                OfficialPortalInfo(
                    title = "S-Bahn Berlin (Deutsche Bahn)",
                    url = "https://sbahn.berlin/fahren/bauen-stoerung/",
                    desc = "Berlin banliyö trenleri, hat inşaatları ve güncel sefer kesinti tablosu."
                ),
                OfficialPortalInfo(
                    title = "Berliner Feuerwehr (İtfaiye & Kurtarma)",
                    url = "https://www.berliner-feuerwehr.de/",
                    desc = "Resmi yangın, ilkyardım ve acil kurtarma bilgilendirme servisi."
                ),
                OfficialPortalInfo(
                    title = "Bürgeramt Berlin (Service-Portal)",
                    url = "https://service.berlin.de/standorte/buergeraemter/",
                    desc = "İkametgâh (Anmeldung), kimlik, pasaport randevuları ve belediye hizmetleri."
                )
            )

            LazyColumn(
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 6.dp, bottom = 90.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = BerlinRed.copy(alpha = 0.1f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BerlinRed.copy(alpha = 0.35f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToLiveBulletin() }
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = BerlinRed,
                                modifier = Modifier.size(10.dp)
                            ) {}
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "🔴 Saat Başı Canlı Berlin Bülteni" else "🔴 Stündlicher Berlin Live-Ticker",
                                    fontWeight = FontWeight.Bold,
                                    color = BerlinRed,
                                    fontSize = 12.5.sp
                                )
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Polis, İtfaiye, BVG ve S-Bahn olaylarını anlık takip edin ➔" else "Echtzeit-Meldungen & Störungen der Berliner Behörden ansehen ➔",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                items(officialPortals) { portal ->
                    OfficialPortalCard(portal = portal)
                }
            }
        }
    }
}

data class OfficialPortalInfo(
    val title: String,
    val url: String,
    val desc: String
)

@Composable
fun OfficialPortalCard(portal: OfficialPortalInfo) {
    val context = LocalContext.current

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = BerlinRed.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(6.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BerlinRed.copy(alpha = 0.3f))
                ) {
                    Text(
                        text = "🏛️ Resmî Berlin Portalı",
                        color = BerlinRed,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                    )
                }

                Text(
                    text = "Yasal & Güvenli",
                    color = BerlinGreen,
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = portal.title,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = portal.desc,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(10.dp))

            Button(
                onClick = {
                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(portal.url))
                    context.startActivity(browserIntent)
                },
                colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
            ) {
                Icon(imageVector = Icons.Default.Search, contentDescription = null, modifier = Modifier.size(15.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Websayfasına Git (${portal.url}) ↗", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
