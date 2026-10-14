package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppLanguage
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinRedLight
import com.example.ui.viewmodel.AppScreen

@Composable
fun MyKiezTopBar(
    currentLanguage: AppLanguage,
    onLanguageChange: (AppLanguage) -> Unit,
    onNavigate: (AppScreen) -> Unit,
    onOpenHamburgerMenu: () -> Unit = {},
    showSearchBox: Boolean = true,
    searchQuery: String = "",
    onSearchChange: (String) -> Unit = {},
    isNotificationsEnabled: Boolean = true,
    onToggleNotifications: (Boolean) -> Unit = {},
    onTriggerTestNotification: () -> Unit = {}
) {
    var showLangMenu by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Main Logo (Sade logo, yazısız, belirgin ve şık)
            MyKiezLogoView(
                height = 42,
                showText = false,
                onClick = { onNavigate(AppScreen.HOME) }
            )

            // Right Actions: Live Ticker, B2B Business Link, Language Selector, Notifications
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Live Ticker Button
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = BerlinRed,
                    modifier = Modifier.clickable { onNavigate(AppScreen.LIVE_BULLETIN) }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = Color.White,
                            modifier = Modifier.size(6.dp)
                        ) {}
                        Text(
                            text = if (currentLanguage == AppLanguage.TURKISH) "Canlı Bülten" else "Live-Ticker",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.5.sp
                        )
                    }
                }

                // Sponsoring / B2B Link
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = BerlinRedLight,
                    modifier = Modifier.clickable { onNavigate(AppScreen.BUSINESS_PORTAL) }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Business,
                            contentDescription = "B2B Unternehmen",
                            tint = BerlinRed,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = if (currentLanguage == AppLanguage.TURKISH) "İşletmeler" else if (currentLanguage == AppLanguage.ENGLISH) "B2B" else "B2B",
                            color = BerlinRed,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.5.sp
                        )
                    }
                }

                // Language Flag Selector
                Box {
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier
                            .size(34.dp)
                            .clickable { showLangMenu = true }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(text = currentLanguage.flag, fontSize = 16.sp)
                        }
                    }
                    DropdownMenu(
                        expanded = showLangMenu,
                        onDismissRequest = { showLangMenu = false }
                    ) {
                        AppLanguage.values().forEach { lang ->
                            DropdownMenuItem(
                                text = { Text("${lang.flag} ${lang.label}") },
                                onClick = {
                                    onLanguageChange(lang)
                                    showLangMenu = false
                                }
                            )
                        }
                    }
                }

                // Notification Bell Icon (Zil Bildirim Yeri)
                var showNotificationsDialog by remember { mutableStateOf(false) }
                Box {
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier
                            .size(36.dp)
                            .clickable { showNotificationsDialog = true }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = "Benachrichtigungen",
                                tint = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    Surface(
                        shape = CircleShape,
                        color = BerlinRed,
                        modifier = Modifier
                            .size(11.dp)
                            .align(Alignment.TopEnd)
                    ) {}
                }

                // Notification Dialog
                if (showNotificationsDialog) {
                    AlertDialog(
                        onDismissRequest = { showNotificationsDialog = false },
                        icon = {
                            Icon(imageVector = Icons.Default.Notifications, contentDescription = null, tint = BerlinRed)
                        },
                        title = {
                            Text(
                                text = if (currentLanguage == AppLanguage.TURKISH) "Kiez Bildirimleri & Canlı Uyarılar" else "Kiez-Mitteilungen & Live-Alerts",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        },
                        text = {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                // Master Toggle for Periodic Notifications
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                                            Text(
                                                text = if (currentLanguage == AppLanguage.TURKISH) "Otomatik Bildirimler" else "Automatische Benachrichtigungen",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.5.sp
                                            )
                                            Text(
                                                text = if (currentLanguage == AppLanguage.TURKISH) "Her 2-3 saatte bir bülten ve görünürlük hatırlatmaları" else "Alle 2-3 Stunden Live-Ticker & Kiez-Updates",
                                                fontSize = 10.5.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        Switch(
                                            checked = isNotificationsEnabled,
                                            onCheckedChange = { onToggleNotifications(it) }
                                        )
                                    }
                                }

                                // 1. Business Visibility Promotion Card (İşletmeniz tüm Berlin'de görünür olsun mu?)
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = BerlinRedLight,
                                    border = BorderStroke(1.dp, BerlinRed.copy(alpha = 0.3f)),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            showNotificationsDialog = false
                                            onNavigate(AppScreen.BUSINESS_PORTAL)
                                        }
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Text(
                                                text = if (currentLanguage == AppLanguage.TURKISH) "🚀 İşletmeniz Tüm Berlin'de Görünsün mü?" else "🚀 Unternehmen berlinweit sichtbar machen?",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp,
                                                color = BerlinRed
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = if (currentLanguage == AppLanguage.TURKISH)
                                                "Kiez Rehberine işletmenizi kaydedin, mahallenizdeki müşterilere tek tıkla ulaşın. Şimdi inceleyin ↗"
                                            else
                                                "Tragen Sie Ihr Geschäft jetzt im Kiez-Guide ein & erreichen Sie neue Kunden. Jetzt eintragen ↗",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }

                                // 2. Real Live Emergency Event Card (Berliner Feuerwehr)
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            showNotificationsDialog = false
                                            onNavigate(AppScreen.LIVE_BULLETIN)
                                        }
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text(
                                            text = if (currentLanguage == AppLanguage.TURKISH) "🚒 Berliner Feuerwehr: Başarılı Müdahale" else "🚒 Berliner Feuerwehr: Erfolgreicher Einsatz",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = if (currentLanguage == AppLanguage.TURKISH)
                                                "Charlottenburg'da teknik kurtarma operasyonu tamamlandı. Canlı bülteni aç ↗"
                                            else
                                                "Hilfeleistungseinsatz in Charlottenburg abgeschlossen. Zum Live-Ticker ↗",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                // 3. BVG & S-Bahn Live-Ticker Alert Card
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            showNotificationsDialog = false
                                            onNavigate(AppScreen.LIVE_BULLETIN)
                                        }
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text(
                                            text = if (currentLanguage == AppLanguage.TURKISH) "🚇 BVG & S-Bahn: Sefer Güncellemesi" else "🚇 BVG & S-Bahn: Live-Verkehrsupdate",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = if (currentLanguage == AppLanguage.TURKISH)
                                                "Metro ve Ringbahn hatlarında güncel sefer saatleri ve bakım bilgileri yayında ↗"
                                            else
                                                "Aktuelle Takt- und Streckeninformationen im Stadtgebiet online ↗",
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                // Test Notification Trigger Button
                                OutlinedButton(
                                    onClick = {
                                        onTriggerTestNotification()
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Notifications,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp),
                                        tint = BerlinRed
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (currentLanguage == AppLanguage.TURKISH) "Test Bildirimi Gönder" else "Test-Benachrichtigung senden",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        },
                        confirmButton = {
                            TextButton(onClick = { showNotificationsDialog = false }) {
                                Text(if (currentLanguage == AppLanguage.TURKISH) "Tamam" else "Schließen")
                            }
                        }
                    )
                }

                // Hamburger Menu Button (Header Sağ Köşe - Menü & Filtreler)
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = BerlinRed,
                    modifier = Modifier
                        .size(36.dp)
                        .clickable { onOpenHamburgerMenu() }
                        .testTag("topbar_hamburger_button")
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Menu,
                            contentDescription = "Hamburger Menü & Filtreler",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }

        if (showSearchBox) {
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp),
                placeholder = {
                    Text(
                        text = when (currentLanguage) {
                            AppLanguage.TURKISH -> "Kiez, mekân veya konu ara..."
                            AppLanguage.ENGLISH -> "Search kiez, place or topic..."
                            else -> "Kiez, Ort oder Thema suchen..."
                        },
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Suche",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                },
                shape = RoundedCornerShape(24.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedBorderColor = Color.Transparent,
                    focusedBorderColor = BerlinRed
                ),
                singleLine = true
            )
        }
    }
}
