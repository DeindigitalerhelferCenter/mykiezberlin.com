package com.example.ui.components

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AppLanguage
import com.example.data.repository.SampleData
import com.example.ui.theme.*
import com.example.ui.viewmodel.AppScreen

@Composable
fun HamburgerMenuModal(
    language: AppLanguage,
    itemCount: Int,
    isMapView: Boolean,
    onSelectViewMode: (Boolean) -> Unit,
    activeKiezFilter: String,
    onKiezFilterChange: (String) -> Unit,
    activeCategory: String,
    onCategoryChange: (String) -> Unit,
    onAddBusinessClick: () -> Unit,
    onNavigate: (AppScreen) -> Unit,
    onDismiss: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val kiezeFilterList = listOf("Alle") + SampleData.allKieze.map { it.name }
    val categoriesFilterList = listOf("Alle") + SampleData.categoriesMap.values.map {
        if (language == AppLanguage.TURKISH) it.second else it.first
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.90f)
                .padding(vertical = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(18.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // 1. HEADER
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
                            shape = RoundedCornerShape(8.dp),
                            color = BerlinRed.copy(alpha = 0.12f),
                            modifier = Modifier.size(34.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Menu,
                                    contentDescription = null,
                                    tint = BerlinRed,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Column {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Menü & Filtreler" else "Menü & Filter",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) "$itemCount işletme hazır" else "$itemCount Einträge verfügbar",
                                fontSize = 11.sp,
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
                            contentDescription = "Close",
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                // 2. AKSIYONLAR & GÖRÜNÜM MODLARI (Liste / Harita / İşletme Ekle)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Aksiyonlar & Görünüm Modu" else "Aktionen & Ansicht",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = BerlinRed
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Liste Modu Butonu
                        Button(
                            onClick = {
                                onSelectViewMode(false)
                                onDismiss()
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (!isMapView) BerlinRed else MaterialTheme.colorScheme.surfaceVariant,
                                contentColor = if (!isMapView) Color.White else MaterialTheme.colorScheme.onSurface
                            ),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(vertical = 10.dp)
                        ) {
                            Icon(imageVector = Icons.Default.List, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Liste Modu" else "Listen-Modus",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Harita Modu Butonu
                        Button(
                            onClick = {
                                onSelectViewMode(true)
                                onDismiss()
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isMapView) BerlinRed else MaterialTheme.colorScheme.surfaceVariant,
                                contentColor = if (isMapView) Color.White else MaterialTheme.colorScheme.onSurface
                            ),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(vertical = 10.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Map, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Harita Modu" else "Karten-Modus",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // İşletme Ekle Butonu
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = BerlinGreen,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                onDismiss()
                                onAddBusinessClick()
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(imageVector = Icons.Default.Add, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Yeni İşletme / Yer Ekle" else "Betrieb kostenlos eintragen",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = Color.White
                            )
                        }
                    }

                    // Aktif Filtre Temizleme Butonu
                    if (activeKiezFilter != "Alle" || activeCategory != "Alle") {
                        OutlinedButton(
                            onClick = {
                                onKiezFilterChange("Alle")
                                onCategoryChange("Alle")
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Filtreleri Sıfırla (Tümü)" else "Filter zurücksetzen",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                // Arkadaşıma Paylaş Butonu (APK İndirme Linki)
                val context = LocalContext.current
                val apkUrl = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"
                Surface(
                    shape = RoundedCornerShape(10.dp),
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
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
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

                // 3. UYGULAMA BÖLÜMLERİ / KLASÖRLER (Direkt yönlendirme)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Uygulama Bölümleri & Klasörler" else "Kategorien & Bereiche",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = BerlinBlue
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "Yeme-İçme" else "Gastronomie",
                            icon = Icons.Default.Restaurant,
                            tint = BerlinRed,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.FOOD)
                            }
                        )
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "İşletmeler" else "Betriebe",
                            icon = Icons.Default.Storefront,
                            tint = BerlinBlue,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.BUSINESSES)
                            }
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "Google Maps" else "Google Maps",
                            icon = Icons.Default.Map,
                            tint = BerlinGreen,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                com.example.util.MapHelper.openGoogleMaps(context, "Berlin Germany")
                            }
                        )
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "Etkinlikler" else "Events",
                            icon = Icons.Default.Event,
                            tint = BerlinYellow,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.EVENTS)
                            }
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "İndirimler" else "Deals",
                            icon = Icons.Default.LocalOffer,
                            tint = BerlinRed,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.DEALS)
                            }
                        )
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "İş İlanları" else "Jobs",
                            icon = Icons.Default.Work,
                            tint = BerlinBlue,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.JOBS)
                            }
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "Acil Yardım" else "Notruf",
                            icon = Icons.Default.Phone,
                            tint = BerlinRed,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.NOTRUF)
                            }
                        )
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "Kiez-Haber" else "Reporter",
                            icon = Icons.Default.Campaign,
                            tint = Color(0xFF8B5CF6),
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.REPORTER)
                            }
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "Berlin'de Ne Yapılır?" else "Was tun in Berlin?",
                            icon = Icons.Default.Explore,
                            tint = BerlinRed,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.BERLIN_TIPS)
                            }
                        )
                        FolderNavButton(
                            title = if (language == AppLanguage.TURKISH) "Canlı Bülten" else "Live-Ticker",
                            icon = Icons.Default.RssFeed,
                            tint = BerlinGreen,
                            modifier = Modifier.weight(1f),
                            onClick = {
                                onDismiss()
                                onNavigate(AppScreen.LIVE_BULLETIN)
                            }
                        )
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                // 4. BERLİN MAHALLELERİ (Kiez Seçimi)
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Berlin Mahalleleri (Kiez Seçimi)" else "Berliner Kieze",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = BerlinRed
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        kiezeFilterList.forEach { kiez ->
                            val isSelected = (activeKiezFilter == "Alle" && kiez == "Alle") || activeKiezFilter == kiez
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    onKiezFilterChange(kiez)
                                    // Yönlendirme ve hızlı uygulama
                                    onNavigate(AppScreen.BUSINESSES)
                                },
                                label = {
                                    Text(
                                        text = if (language == AppLanguage.TURKISH && kiez == "Alle") "Tüm Berlin" else if (kiez == "Alle") "Ganz Berlin" else kiez,
                                        fontSize = 11.5.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = BerlinRed,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                // 5. KATEGORİLER (Gastronomi & İşletmeler)
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Kategoriler (Gastronomi & İşletmeler)" else "Kategorien",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = BerlinBlue
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        categoriesFilterList.forEach { cat ->
                            val isSelected = (activeCategory == "Alle" && cat == "Alle") || activeCategory == cat
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    onCategoryChange(cat)
                                    // Yönlendirme ve hızlı uygulama
                                    onNavigate(AppScreen.BUSINESSES)
                                },
                                label = {
                                    Text(
                                        text = if (language == AppLanguage.TURKISH && cat == "Alle") "Hepsi" else if (cat == "Alle") "Alles" else cat,
                                        fontSize = 11.5.sp,
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

                // 6. KAPAT & UYGULA BUTONU
                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(vertical = 12.dp)
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Uygula & Menüyü Kapat" else "Schließen & Anwenden",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun FolderNavButton(
    title: String,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = modifier.clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(imageVector = icon, contentDescription = title, tint = tint, modifier = Modifier.size(16.dp))
            Text(
                text = title,
                fontSize = 11.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
        }
    }
}
