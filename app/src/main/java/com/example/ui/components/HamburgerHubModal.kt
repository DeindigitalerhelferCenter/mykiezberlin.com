package com.example.ui.components

import android.content.Intent
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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppLanguage
import com.example.data.repository.SampleData
import com.example.ui.theme.BerlinBlue
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinRedLight
import com.example.ui.theme.BerlinYellow
import com.example.ui.viewmodel.AppScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HamburgerHubModal(
    language: AppLanguage,
    currentViewMode: String, // "card", "list", "map"
    onSelectViewMode: (String) -> Unit,
    activeKiez: String,
    onSelectKiez: (String) -> Unit,
    activeCategory: String,
    onSelectCategory: (String) -> Unit,
    onNavigateToScreen: (AppScreen) -> Unit,
    onOpenAddBusiness: () -> Unit,
    onResetFilters: () -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        dragHandle = {
            Surface(
                modifier = Modifier
                    .padding(vertical = 10.dp)
                    .width(48.dp)
                    .height(4.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.outlineVariant
            ) {}
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
                .padding(horizontal = 20.dp)
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = BerlinRed,
                        modifier = Modifier.size(40.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                    Column {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Berlin Kiez-Hub & Menü" else "Berliner Kiez-Hub & Filter",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Görünümler, Klasörler & Mahalleler" else "Ansichten, Ordner & Kieze",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Schließen",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // GÖRÜNÜM MODLARI (KART MODU, LİSTE MODU, HARİTA MODU)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(imageVector = Icons.Default.ViewModule, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(16.dp))
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Görünüm Modları" else "Ansichts-Modus",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = BerlinRed
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Kart Modu
                    ViewModeButton(
                        label = if (language == AppLanguage.TURKISH) "Kart Modu" else "Karten-Ansicht",
                        icon = Icons.Default.ViewAgenda,
                        isSelected = currentViewMode == "card",
                        modifier = Modifier.weight(1f)
                    ) {
                        onSelectViewMode("card")
                        onNavigateToScreen(AppScreen.BUSINESSES)
                        onDismiss()
                    }

                    // Liste Modu
                    ViewModeButton(
                        label = if (language == AppLanguage.TURKISH) "Liste Modu" else "Listen-Modus",
                        icon = Icons.Default.ViewList,
                        isSelected = currentViewMode == "list",
                        modifier = Modifier.weight(1f)
                    ) {
                        onSelectViewMode("list")
                        onNavigateToScreen(AppScreen.BUSINESSES)
                        onDismiss()
                    }

                    // Harita Modu
                    ViewModeButton(
                        label = if (language == AppLanguage.TURKISH) "Harita Modu" else "Kiez-Karte",
                        icon = Icons.Default.Map,
                        isSelected = currentViewMode == "map",
                        modifier = Modifier.weight(1f)
                    ) {
                        onSelectViewMode("map")
                        onNavigateToScreen(AppScreen.BUSINESSES)
                        onDismiss()
                    }
                }
            }

            // Arkadaşıma Paylaş Butonu (APK İndirme Linki)
            val context = LocalContext.current
            val apkUrl = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF0284C7),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            val text = if (language == AppLanguage.TURKISH) {
                                "Berlin'in canlı bülteni, mahalle rehberi ve etkinlikleri için My Kiez Berlin uygulamasını hemen indir:\n$apkUrl"
                            } else {
                                "Lade jetzt die My Kiez Berlin App für Live-Ticker, Nachbarschafts-Guide und Events herunter:\n$apkUrl"
                            }
                            putExtra(Intent.EXTRA_TEXT, text)
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "My Kiez Berlin teilen"))
                    }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(imageVector = Icons.Default.Share, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Column {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Arkadaşıma Paylaş" else "App mit Freunden teilen",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = if (language == AppLanguage.TURKISH) "My Kiez Berlin uygulamasını tavsiye et" else "Direkter APK-Download-Link zum Weiterleiten",
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.9f)
                        )
                    }
                }
            }

            // APK İndirme Linki Kutusu (Doğrudan butonun altında görünür)
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF0284C7).copy(alpha = 0.35f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "İndirme Linki (APK):" else "Download-Link (APK):",
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = BerlinBlue
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Kopyala" else "Kopieren",
                                fontSize = 11.sp,
                                color = Color(0xFF0284C7),
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .clickable {
                                        val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                        clipboard.setPrimaryClip(android.content.ClipData.newPlainText("My Kiez Berlin APK", apkUrl))
                                        android.widget.Toast.makeText(context, if (language == AppLanguage.TURKISH) "İndirme linki kopyalandı!" else "Link kopiert!", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                    .padding(2.dp)
                            )
                            Text(text = "•", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(
                                text = if (language == AppLanguage.TURKISH) "İndir" else "Download",
                                fontSize = 11.sp,
                                color = BerlinGreen,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .clickable {
                                        val browserIntent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse(apkUrl))
                                        context.startActivity(browserIntent)
                                    }
                                    .padding(2.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = apkUrl,
                        fontSize = 10.5.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

            // UYGULAMA KLASÖRLERİ & AKSİYONLAR
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(imageVector = Icons.Default.Folder, contentDescription = null, tint = BerlinBlue, modifier = Modifier.size(16.dp))
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Uygulama Klasörleri & Aksiyonlar" else "Bereiche & Aktionen",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = BerlinBlue
                    )
                }

                // Grid of Main Sections
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "İşletmeler" else "Betriebe",
                            subtitle = if (language == AppLanguage.TURKISH) "Rehber & Esnaf" else "Kiez-Verzeichnis",
                            icon = Icons.Default.Storefront,
                            color = BerlinRed,
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.BUSINESSES)
                            onDismiss()
                        }

                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "Gastronomi" else "Gastro & Food",
                            subtitle = if (language == AppLanguage.TURKISH) "Yeme & İçme" else "Essen & Trinken",
                            icon = Icons.Default.Restaurant,
                            color = Color(0xFFE65100),
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.FOOD)
                            onDismiss()
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "Kiez Fırsatları" else "Deals & Rabatte",
                            subtitle = if (language == AppLanguage.TURKISH) "İndirim Kuponları" else "Exklusive Coupons",
                            icon = Icons.Default.LocalOffer,
                            color = BerlinYellow,
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.DEALS)
                            onDismiss()
                        }

                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "Etkinlikler" else "Kiez-Events",
                            subtitle = if (language == AppLanguage.TURKISH) "Kültür & Takvim" else "Was geht im Kiez?",
                            icon = Icons.Default.Event,
                            color = Color(0xFF6A1B9A),
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.EVENTS)
                            onDismiss()
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "22 Berlin Kiezi" else "22 Berliner Kieze",
                            subtitle = if (language == AppLanguage.TURKISH) "Mahalle Rehberi" else "Bezirk-Navigator",
                            icon = Icons.Default.Place,
                            color = BerlinGreen,
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.KIEZE)
                            onDismiss()
                        }

                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "İş İlanları" else "Kiez-Jobs",
                            subtitle = if (language == AppLanguage.TURKISH) "Eleman & Kariyer" else "Stellenangebote",
                            icon = Icons.Default.Work,
                            color = Color(0xFF0284C7),
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.JOBS)
                            onDismiss()
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "Kiez Muhabiri" else "Kiez-Reporter",
                            subtitle = if (language == AppLanguage.TURKISH) "Haberler & Sesler" else "Berichte & News",
                            icon = Icons.Default.Campaign,
                            color = Color(0xFFD81B60),
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.REPORTER)
                            onDismiss()
                        }

                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "Acil Durum (SOS)" else "Notruf & Hilfe",
                            subtitle = if (language == AppLanguage.TURKISH) "Berlin Acil Hatları" else "Krisen-Hotlines",
                            icon = Icons.Default.Warning,
                            color = BerlinRed,
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.NOTRUF)
                            onDismiss()
                        }
                    }

                    // Berlin'de Ne Yapılır & Canlı Bülten
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "Berlin'de Ne Yapılır?" else "Was tun in Berlin?",
                            subtitle = if (language == AppLanguage.TURKISH) "33 Berlin Noktası (Maps)" else "33 Highlights (1-Klick)",
                            icon = Icons.Default.Explore,
                            color = BerlinBlue,
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.BERLIN_TIPS)
                            onDismiss()
                        }

                        FolderNavTile(
                            title = if (language == AppLanguage.TURKISH) "🔴 Canlı Bülten" else "🔴 Live-Ticker",
                            subtitle = if (language == AppLanguage.TURKISH) "Polis & BVG Resmî" else "Offizielle Meldungen",
                            icon = Icons.Default.Sensors,
                            color = BerlinRed,
                            modifier = Modifier.weight(1f)
                        ) {
                            onNavigateToScreen(AppScreen.LIVE_BULLETIN)
                            onDismiss()
                        }
                    }

                    // Hızlı İşletme Ekle Aksiyonu
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = BerlinRed.copy(alpha = 0.08f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                onOpenAddBusiness()
                                onDismiss()
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = BerlinRed,
                                modifier = Modifier.size(32.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                }
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "+ Kendi İşletmeni Ücretsiz Ekle" else "+ Eigenen Betrieb eintragen",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = BerlinRed
                                )
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Kiez Check'e katıl, müşterilere ulaş" else "Sichtbar werden für Nachbarn & Kunden",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = BerlinRed)
                        }
                    }
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

            // BERLİN MAHALLELERİ (KİEZE KLASÖRÜ - 22 BERLİN BÖLGESİ)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(imageVector = Icons.Default.LocationCity, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(16.dp))
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Berlin Mahalleleri (Kieze)" else "Berliner Kieze",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = BerlinGreen
                        )
                    }

                    if (activeKiez != "Alle" && activeKiez != "Ganz Berlin" && activeKiez != "Tüm Berlin") {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Aktif: $activeKiez" else "Aktiv: $activeKiez",
                            fontSize = 11.sp,
                            color = BerlinGreen,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                val allKieze = listOf("Alle") + SampleData.allKieze.map { it.name }

                // Scrollable Chips for all 22 Berlin Districts
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    allKieze.forEach { kiezName ->
                        val isSelected = (activeKiez == "Alle" && kiezName == "Alle") || activeKiez == kiezName
                        val label = if (kiezName == "Alle") {
                            if (language == AppLanguage.TURKISH) "Tüm Berlin" else "Ganz Berlin"
                        } else {
                            kiezName
                        }

                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                onSelectKiez(kiezName)
                                onNavigateToScreen(AppScreen.BUSINESSES)
                                onDismiss()
                            },
                            label = {
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = BerlinGreen,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

            // KATEGORİLER & SEKTÖRLER KLASÖRÜ
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Category, contentDescription = null, tint = BerlinBlue, modifier = Modifier.size(16.dp))
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Sektörler & Kategoriler" else "Kategorien & Branchen",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = BerlinBlue
                        )
                    }

                    if (activeCategory != "Alle" && activeCategory != "Hepsi" && activeCategory != "Alles") {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Aktif: $activeCategory" else "Aktiv: $activeCategory",
                            fontSize = 11.sp,
                            color = BerlinBlue,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                val categories = listOf(
                    "Alle" to Pair("Alles", "Hepsi"),
                    "cafe" to Pair("Café & Frühstück", "Kafe & Kahvaltı"),
                    "restaurant" to Pair("Restaurant", "Restoran"),
                    "imbiss" to Pair("Imbiss & Döner", "Büfe & Döner"),
                    "baeckerei" to Pair("Bäckerei & Konditorei", "Fırın & Pastane"),
                    "friseur" to Pair("Friseur & Barber", "Kuaför & Berber"),
                    "shop" to Pair("Shopping & Mode", "Alışveriş & Giyim"),
                    "markt" to Pair("Supermarkt & Markt", "Market & Bakkal"),
                    "fitness" to Pair("Fitness & Sport", "Fitness & Spor"),
                    "gesundheit" to Pair("Apotheke & Gesundheit", "Eczane & Sağlık"),
                    "service" to Pair("Dienstleistungen", "Hizmet & Danışmanlık")
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    categories.forEach { (catKey, names) ->
                        val label = if (language == AppLanguage.TURKISH) names.second else names.first
                        val isSelected = (activeCategory == "Alle" && catKey == "Alle") ||
                                activeCategory.contains(label, ignoreCase = true) ||
                                (catKey == "Alle" && (activeCategory == "Hepsi" || activeCategory == "Alles"))

                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                onSelectCategory(if (catKey == "Alle") "Alle" else label)
                                onNavigateToScreen(AppScreen.BUSINESSES)
                                onDismiss()
                            },
                            label = {
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = BerlinBlue,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Action Buttons: Reset Filters & Dismiss
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        onResetFilters()
                        onDismiss()
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Filtreleri Sıfırla" else "Filter zurücksetzen",
                        fontSize = 12.sp
                    )
                }

                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Uygula & Kapat" else "Anwenden",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun ViewModeButton(
    label: String,
    icon: ImageVector,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) BerlinRed else MaterialTheme.colorScheme.surfaceVariant,
        modifier = modifier
            .height(52.dp)
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                fontSize = 10.5.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun FolderNavTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
        modifier = modifier
            .height(64.dp)
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = color.copy(alpha = 0.15f),
                modifier = Modifier.size(36.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, fontWeight = FontWeight.Bold, fontSize = 12.sp, maxLines = 1)
                Text(text = subtitle, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
            }
        }
    }
}
