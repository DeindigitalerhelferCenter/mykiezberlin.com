package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.R
import com.example.data.model.AppLanguage
import com.example.ui.theme.BerlinBlue
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinRedLight
import com.example.ui.viewmodel.AppScreen

@Composable
fun ProfileScreen(
    language: AppLanguage,
    onLanguageChange: (AppLanguage) -> Unit,
    isDarkMode: Boolean,
    onToggleDarkMode: () -> Unit,
    locationGranted: Boolean,
    onToggleLocation: () -> Unit,
    onNavigate: (AppScreen) -> Unit,
    notificationsEnabled: Boolean = true,
    onToggleNotifications: (Boolean) -> Unit = {},
    onTriggerTestNotification: () -> Unit = {}
) {
    var activeLegalDialog by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 90.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // App Identity Header Card with Official Logo
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Surface(
                        shape = CircleShape,
                        color = Color.White,
                        modifier = Modifier.size(68.dp),
                        shadowElevation = 3.dp
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.mykiez_logo),
                            contentDescription = "My Kiez Berlin Logo",
                            modifier = Modifier.padding(6.dp),
                            contentScale = ContentScale.Fit
                        )
                    }

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "My Kiez Berlin",
                                fontWeight = FontWeight.Black,
                                fontSize = 20.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        Text(
                            text = "https://mykiezberlin.com",
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = BerlinRed
                        )
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "Gizlilik Dostu Kiez Rehberi · DSGVO / GDPR Konform"
                            else
                                "Datenschutzfreundlicher Kiez-Führer · Ohne Cookies & Tracking",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Language Switcher Section
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Language, contentDescription = null, tint = BerlinRed)
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Uygulama Dili" else if (language == AppLanguage.ENGLISH) "Language" else "Sprache",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        AppLanguage.values().forEach { lang ->
                            val isSelected = language == lang
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { onLanguageChange(lang) },
                                shape = RoundedCornerShape(10.dp),
                                color = if (isSelected) BerlinRedLight else MaterialTheme.colorScheme.surfaceVariant,
                                border = if (isSelected) androidx.compose.foundation.BorderStroke(1.5.dp, BerlinRed) else null
                            ) {
                                Row(
                                    modifier = Modifier.padding(vertical = 10.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(text = lang.flag, fontSize = 14.sp)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = lang.label,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) BerlinRed else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Settings (Dark Mode & Location)
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(imageVector = Icons.Default.DarkMode, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Column {
                                Text(text = if (language == AppLanguage.TURKISH) "Karanlık Mod (Dark Mode)" else "Dunkler Modus", fontSize = 14.sp)
                                Text(text = if (language == AppLanguage.TURKISH) "Göz yormayan koyu tema" else "Schont die Augen bei Nacht", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(
                            checked = isDarkMode,
                            onCheckedChange = { onToggleDarkMode() },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = BerlinRed)
                        )
                    }

                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(imageVector = Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Column {
                                Text(text = if (language == AppLanguage.TURKISH) "Konum Tabanlı Mesafe" else "Standortbasierte Entfernung", fontSize = 14.sp)
                                Text(text = if (language == AppLanguage.TURKISH) "Yakındaki yerleri sıralar" else "Zeigt Distanzen im Kiez", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Switch(
                            checked = locationGranted,
                            onCheckedChange = { onToggleLocation() },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = BerlinRed)
                        )
                    }

                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                            Icon(imageVector = Icons.Default.Notifications, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Column {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Berlin Bildirimleri (2-3 Saatte Bir)" else "Kiez-Benachrichtigungen (alle 2-3h)",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "İtfaiye, polis, ulaşım & işletme görünürlüğü" else "Feuerwehr, Polizei, BVG & Unternehmenshinweise",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        Switch(
                            checked = notificationsEnabled,
                            onCheckedChange = { onToggleNotifications(it) },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = BerlinRed)
                        )
                    }

                    // Canlı Hatırlatma Gönder (S-Bahn / BVG / İtfaiye / Polis Test Butonu)
                    if (notificationsEnabled) {
                        Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0xFF008754),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onTriggerTestNotification() }
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(imageVector = Icons.Default.NotificationsActive, contentDescription = null, tint = Color.White, modifier = Modifier.size(17.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "🔔 Canlı Hatırlatma Gönder (S-Bahn / BVG Test)" else "🔔 Live-Alarm testen (S-Bahn / BVG)",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // ARKADAŞIMA PAYLAŞ KARTI & APK İNDİRME LİNKİ
        item {
            val apkUrl = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Paylaş Butonu
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
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Share, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                            Column {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Arkadaşıma Paylaş" else "App mit Freunden teilen",
                                    fontSize = 13.5.sp,
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
                                                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl))
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
                }
            }
        }

        // Settings Menu Items: Favorites, B2B, Admin, Impressum, Datenschutz, AGB
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column {
                    ProfileMenuItem(Icons.Default.Favorite, if (language == AppLanguage.TURKISH) "Favorilerim" else "Favoriten") { onNavigate(AppScreen.FAVORITES) }
                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    ProfileMenuItem(Icons.Default.Business, if (language == AppLanguage.TURKISH) "İşletmeler İçin Reklam (B2B Werbepakete)" else "Für Unternehmen (B2B Werbepakete)") { onNavigate(AppScreen.BUSINESS_PORTAL) }
                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    ProfileMenuItem(Icons.Default.AdminPanelSettings, if (language == AppLanguage.TURKISH) "Yönetici Paneli (Admin)" else "Admin-Bereich (Moderation & Prüfung)") { onNavigate(AppScreen.ADMIN) }
                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    ProfileMenuItem(Icons.Default.Gavel, "Impressum (Rechtliche Angaben gemäß § 5 DDG)") { activeLegalDialog = "Impressum" }
                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    ProfileMenuItem(Icons.Default.Security, "Datenschutzerklärung (DSGVO Konform)") { activeLegalDialog = "Datenschutz" }
                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    ProfileMenuItem(Icons.Default.Description, "Allgemeine Geschäftsbedingungen (AGB)") { activeLegalDialog = "AGB" }
                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    ProfileMenuItem(Icons.Default.Language, "Webseite: https://mykiezberlin.com") {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://mykiezberlin.com"))
                        context.startActivity(browserIntent)
                    }
                }
            }
        }
    }

    // AUFGABE 4: IMPRESSUM / AGB / DATENSCHUTZ - Vollständige, rechtskonforme Dokumente im Dialog
    if (activeLegalDialog != null) {
        Dialog(onDismissRequest = { activeLegalDialog = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp),
                modifier = Modifier.fillMaxWidth().fillMaxHeight(0.88f)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = when (activeLegalDialog) {
                                "Impressum" -> "Impressum (Künye)"
                                "Datenschutz" -> "Datenschutzerklärung (Gizlilik)"
                                else -> "Allgemeine Geschäftsbedingungen (AGB)"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = { activeLegalDialog = null }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    Text(
                        text = "My Kiez Berlin · Stand: September / Oktober 2026",
                        fontSize = 11.5.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Divider(modifier = Modifier.padding(vertical = 10.dp))

                    // Scrollable full official text from provided HTML documents
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        when (activeLegalDialog) {
                            "Impressum" -> {
                                Text(
                                    text = "Angaben gemäß § 5 DDG\n\n" +
                                            "Anbieter:\n" +
                                            "Deindigitalerhelfer.Center\n" +
                                            "Sarah Strehlke\n" +
                                            "Behaimstraße 3\n" +
                                            "10585 Berlin, Deutschland\n\n" +
                                            "My Kiez Berlin ist ein Angebot von Deindigitalerhelfer.Center.\n\n" +
                                            "Kontakt:\n" +
                                            "Telefon: +49 163 9527817\n" +
                                            "E-Mail: info@deindigitalerhelfer.com\n" +
                                            "Webseite: https://mykiezberlin.com\n\n" +
                                            "Rechtsform:\n" +
                                            "Einzelunternehmen (Kleinunternehmer)\n\n" +
                                            "Umsatzsteuer:\n" +
                                            "Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer berechnet und ausgewiesen.\n\n" +
                                            "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:\n" +
                                            "Sarah Strehlke, Behaimstraße 3, 10585 Berlin\n\n" +
                                            "Einträge von Betrieben:\n" +
                                            "Die Einträge (Namen, Beschreibungen, Fotos, Gutscheine, Stellenanzeigen) werden von den jeweiligen Betrieben selbst eingestellt und vor der Veröffentlichung geprüft. Für diese Inhalte sind die Betriebe verantwortlich. Bezahlte Platzierungen sind als „Anzeige“ gekennzeichnet.\n\n" +
                                            "Kontaktstelle nach Art. 11 und 12 DSA / Meldung rechtswidriger Inhalte:\n" +
                                            "Behörden und Nutzer erreichen uns unter info@deindigitalerhelfer.com (Deutsch, Türkisch, Englisch). Rechtswidrige Einträge können mit Link und Begründung gemeldet werden. Wir prüfen jede Meldung unverzüglich.",
                                    fontSize = 13.sp,
                                    lineHeight = 19.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }

                            "Datenschutz" -> {
                                Text(
                                    text = "Datenschutzerklärung gemäß DSGVO\n\n" +
                                            "Kurz gesagt:\n" +
                                            "Wir verwenden keine Cookies und kein Tracking. Wir speichern nur, was für Einträge, Anfragen und Zahlungen nötig ist. Einstellungen wie Sprache oder Merkliste bleiben in Ihrem Gerät.\n\n" +
                                            "1. Verantwortlicher:\n" +
                                            "Deindigitalerhelfer.Center, Sarah Strehlke, Behaimstraße 3, 10585 Berlin, Deutschland. E-Mail: info@deindigitalerhelfer.com.\n\n" +
                                            "2. Hosting und Bereitstellung:\n" +
                                            "Die Plattform, Datenbank und Fotos werden bei Cloudflare (Cloudflare Workers, D1-Datenbank, R2-Speicher) gehostet. Fotos werden in der EU gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.\n\n" +
                                            "3. Schutz vor Missbrauch:\n" +
                                            "IP-Adressen bei Einsendungen werden nur als verschlüsselte Prüfsumme (Hash) mit Zeitstempel temporär gespeichert, um Spam zu verhindern.\n\n" +
                                            "4. Kiez-Stories & Kiez-Reporter:\n" +
                                            "Hochgeladene Fotos, Texte und Namen werden erst nach Prüfung freigeschaltet. Jeder Beitrag kann jederzeit gelöscht werden.\n\n" +
                                            "5. Ihre Rechte:\n" +
                                            "Sie haben jederzeit das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17) und Widerspruch (Art. 21 DSGVO). Schreiben Sie uns an info@deindigitalerhelfer.com.",
                                    fontSize = 13.sp,
                                    lineHeight = 19.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }

                            else -> {
                                Text(
                                    text = "Allgemeine Geschäftsbedingungen (AGB)\n\n" +
                                            "Stand: September / Oktober 2026\n\n" +
                                            "§ 1 Geltungsbereich und Anbieter:\n" +
                                            "Diese AGB gelten für alle Leistungen der Plattform My Kiez Berlin (mykiezberlin.com). Anbieter ist Deindigitalerhelfer.Center, Sarah Strehlke, Behaimstraße 3, 10585 Berlin.\n\n" +
                                            "§ 2 Leistungen & Pakete:\n" +
                                            "• Grundeintrag: Kostenlos für Betriebe in Berlin.\n" +
                                            "• Startangebot: Alle B2B-Pakete die ersten 3 Monate für nur 19 €/Monat, danach 29 €, 49 € oder 89 €/Monat – monatlich kündbar.\n" +
                                            "• Kiez-Stories: 24 Std. & 48 Std. kostenlos. 7 Tage für 5 €, 30 Tage für 9,90 €.\n" +
                                            "• Gründungspartner: Die ersten Betriebe testen 3 Monate kostenlos.\n\n" +
                                            "§ 3 Inhalte der Betriebe & Story-Regeln:\n" +
                                            "Betriebe und Nutzer sind für ihre Texte und Fotos selbst verantwortlich. Unzulässig sind falsche Angaben, fremde Marken ohne Erlaubnis, Politik, Beleidigungen und 18+ Inhalte. Alle Einsendungen werden vor Freischaltung moderiert.\n\n" +
                                            "§ 4 Laufzeit und Kündigung:\n" +
                                            "Monatliche Pakete verlängern sich jeweils um einen Monat und können jederzeit zum Monatsende per E-Mail an info@deindigitalerhelfer.com gekündigt werden.\n\n" +
                                            "§ 5 Gerichtsstand:\n" +
                                            "Es gilt deutsches Recht. Gerichtsstand ist Berlin.",
                                    fontSize = 13.sp,
                                    lineHeight = 19.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = { activeLegalDialog = null },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Schließen", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun ProfileMenuItem(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp)
            )
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
        Icon(
            imageVector = Icons.Default.ArrowForwardIos,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(14.dp)
        )
    }
}
