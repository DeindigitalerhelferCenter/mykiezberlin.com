package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AppLanguage
import com.example.data.model.PricingPackage
import com.example.data.repository.SampleData
import com.example.ui.theme.*

/**
 * B2B packages (2026-11-11): Kiez Basic / Kiez Plus / Kiez Premium – same names and prices as /werben,
 * the home page and Stripe (29 / 49 / 89 € per month, first 3 months 19 €). The listed benefits are exactly
 * what the package gets in app and web (functions/_lib/plans.js), so every sponsor gets what they pay for.
 * Every text is available in German, Turkish and English.
 */
private data class B2bPlan(
    val size: String,          // s | m | l (Stripe / plans.js)
    val packageId: String,     // SampleData.pricingPackages id
    val name: String,
    val price: Int,
    val tagDe: String, val tagTr: String, val tagEn: String,
    val badgeDe: String = "", val badgeTr: String = "", val badgeEn: String = "",
    val features: List<Triple<String, String, String>>
)

private val B2B_PLANS = listOf(
    B2bPlan(
        "s", "basic", "Kiez Basic", 29,
        "Sichtbar in deinem Kiez", "Mahallende görün", "Visible in your neighbourhood",
        features = listOf(
            Triple("Ganz oben in deinem Kiez, wenn Nutzer deinen Kiez wählen", "Kullanıcı mahalleni seçince en üstte", "Top of your neighbourhood when users choose it"),
            Triple("Kleiner Sponsor-Streifen mit Logo bei Seitenwechseln (Rotation 1×)", "Sayfa geçişlerinde logolu küçük sponsor şeridi (rotasyon 1×)", "Small sponsor strip with logo on page changes (rotation 1×)"),
            Triple("Gelb markiert und als Anzeige gekennzeichnet", "Sarı işaretli, reklam olarak etiketli", "Highlighted in yellow, labelled as an ad"),
            Triple("Kontaktfenster: Adresse, Öffnungszeiten, Anrufen, WhatsApp, E-Mail", "İletişim penceresi: adres, saatler, arama, WhatsApp, e-posta", "Contact sheet: address, hours, call, WhatsApp, e-mail"),
            Triple("Eigener Gutschein im Bereich „Gutscheine“", "„Kuponlar“ bölümünde kendi kuponun", "Your own coupon under “Coupons”"),
            Triple("In App und Webseite gleichzeitig", "Uygulamada ve web sitesinde aynı anda", "In the app and on the website at the same time")
        )
    ),
    B2bPlan(
        "m", "plus", "Kiez Plus", 49,
        "Mehr Kunden aus ganz Berlin", "Tüm Berlin'den daha fazla müşteri", "More customers from all over Berlin",
        "Empfohlen", "Önerimiz", "Recommended",
        features = listOf(
            Triple("Alles aus Kiez Basic", "Mahalle Basic paketindeki her şey", "Everything in Neighbourhood Basic"),
            Triple("Mittleres Banner mit Logo, Text und Buttons (Anrufen / WhatsApp)", "Logo, metin ve butonlu orta boy banner (Ara / WhatsApp)", "Medium banner with logo, text and buttons (call / WhatsApp)"),
            Triple("Im Sponsor-Streifen auf der Startseite", "Ana sayfadaki sponsor şeridinde", "In the sponsor strip on the home page"),
            Triple("In langen Listen nach jedem 6. Eintrag", "Uzun listelerde her 6. kayıttan sonra", "In long lists after every 6th entry"),
            Triple("Doppelt so oft bei Seitenwechseln (Rotation 2×)", "Sayfa geçişlerinde iki kat sık (rotasyon 2×)", "Twice as often on page changes (rotation 2×)")
        )
    ),
    B2bPlan(
        "l", "premium", "Kiez Premium", 89,
        "Maximale Sichtbarkeit", "En yüksek görünürlük", "Maximum visibility",
        "Maximal", "En güçlü", "Maximum",
        features = listOf(
            Triple("Alles aus Kiez Plus", "Mahalle Plus paketindeki her şey", "Everything in Neighbourhood Plus"),
            Triple("Große Sponsor-Karte mit Bild auf der Startseite", "Ana sayfada resimli büyük sponsor kartı", "Large sponsor card with picture on the home page"),
            Triple("Große Karte auch bei Seitenwechseln", "Sayfa geçişlerinde de büyük kart", "Large card on page changes too"),
            Triple("Dreimal so oft wie Kiez Basic (Rotation 3×)", "Mahalle Basic'ten üç kat sık (rotasyon 3×)", "Three times as often as Neighbourhood Basic (rotation 3×)"),
            Triple("Höchste Priorität: immer vorne in der Reihenfolge", "En yüksek öncelik: sıralamada hep önde", "Highest priority: always first in the order"),
            Triple("Persönliche Betreuung bei Bild und Text", "Resim ve metinde kişisel destek", "Personal help with picture and text")
        )
    )
)

@Composable
fun BusinessPortalScreen(
    language: AppLanguage,
    isYearly: Boolean,
    onToggleYearly: (Boolean) -> Unit,
    selectedPackage: PricingPackage?,
    onSelectPackage: (PricingPackage) -> Unit,
    onCloseBooking: () -> Unit,
    onSubmitBooking: (String, String, String) -> Unit,
    bookingSuccessMessage: String?,
    onOpenWerben: (String) -> Unit = {}
) {
    val context = LocalContext.current
    fun t(de: String, tr: String, en: String) = when (language) { AppLanguage.TURKISH -> tr; AppLanguage.ENGLISH -> en; else -> de }
    var companyNameInput by remember { mutableStateOf("") }
    var emailInput by remember { mutableStateOf("") }
    var kiezInput by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        // Hero
        item {
            Box(
                modifier = Modifier.fillMaxWidth()
                    .background(Brush.verticalGradient(listOf(Color(0xFF0F172A), Color(0xFF1E293B), BerlinRedDark)))
                    .padding(20.dp)
            ) {
                Column {
                    Surface(shape = RoundedCornerShape(8.dp), color = Color.White.copy(alpha = 0.2f)) {
                        Text(
                            text = t("FÜR UNTERNEHMEN · B2B", "İŞLETMELER İÇİN · B2B", "FOR BUSINESSES · B2B"),
                            color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Text(
                        text = t("Ihr Unternehmen in ganz Berlin sichtbar!", "İşletmeniz tüm Berlin'de görünür olsun!", "Make your business visible all over Berlin!"),
                        color = Color.White, fontWeight = FontWeight.Black, fontSize = 24.sp, lineHeight = 28.sp
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = t(
                            "Mit My Kiez Berlin erreichen Sie gezielt Menschen in Ihrem Kiez – in der App und auf mykiezberlin.com. Lokal, einfach und monatlich kündbar.",
                            "My Kiez Berlin ile mahallenizdeki insanlara doğrudan ulaşırsınız – uygulamada ve mykiezberlin.com'da. Yerel, kolay ve aylık iptal edilebilir.",
                            "With My Kiez Berlin you reach people in your neighbourhood directly – in the app and on mykiezberlin.com. Local, simple and cancellable monthly."
                        ),
                        color = Color.White.copy(alpha = 0.9f), fontSize = 13.sp, lineHeight = 18.sp
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = t("Dein Kiez. Deine Kunden. Dein Erfolg.", "Senin mahallen. Senin müşterilerin. Senin başarın.", "Your neighbourhood. Your customers. Your success."),
                        color = BerlinYellow, fontWeight = FontWeight.Bold, fontSize = 15.sp
                    )
                }
            }
        }

        // Value pillars
        item {
            Card(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    UspRow(Icons.Default.Adjust, t("Gezielte lokale Reichweite", "Hedefli yerel erişim", "Targeted local reach"), t("Direkt in Ihrem Stadtteil sichtbar sein", "Doğrudan semtinizde görünür olun", "Be visible right in your district"))
                    UspRow(Icons.Default.People, t("Passende Kunden aus Ihrem Kiez", "Mahallenizden doğru müşteriler", "The right customers from your neighbourhood"), t("Anwohner und Kiez-Besucher ansprechen", "Mahalle sakinlerine ve ziyaretçilere ulaşın", "Reach residents and visitors"))
                    UspRow(Icons.Default.Phone, t("Direkter Kontakt", "Doğrudan iletişim", "Direct contact"), t("Kunden rufen an oder schreiben per WhatsApp – mit einem Tipp", "Müşteriler tek dokunuşla arar veya WhatsApp'tan yazar", "Customers call or message on WhatsApp with one tap"))
                    UspRow(Icons.Default.TouchApp, t("Einfache Online-Buchung", "Kolay online rezervasyon", "Easy online booking"), t("Sicher per Karte (Stripe), Rechnung per E-Mail", "Kartla güvenli ödeme (Stripe), fatura e-postayla", "Secure card payment (Stripe), invoice by e-mail"))
                }
            }
        }

        // Start offer (replaces the old monthly / yearly switch: Stripe bills monthly)
        item {
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = BerlinYellow.copy(alpha = 0.18f))
            ) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("✨ " + t("Startangebot: die ersten 3 Monate nur 19 €/Monat", "Başlangıç teklifi: ilk 3 ay sadece 19 €/ay", "Starter offer: first 3 months only €19/month"), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(
                        t("Gründungspartner: Die ersten 20 Betriebe testen 3 Monate kostenlos. Danach monatlich kündbar.",
                          "Kurucu ortaklar: İlk 20 işletme 3 ay ücretsiz dener. Sonra aylık iptal edilebilir.",
                          "Founding partners: the first 20 businesses test for 3 months free. Then cancel monthly."),
                        fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        item {
            Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(t("Unsere Werbepakete", "Reklam paketlerimiz", "Our advertising packages"), fontWeight = FontWeight.Bold, fontSize = 20.sp)
                Text(t("Je höher das Paket, desto größer und häufiger Ihre Anzeige.", "Paket büyüdükçe reklamınız daha büyük ve daha sık görünür.", "The higher the package, the bigger and more often your ad."), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
            }
        }

        // Package cards
        items(B2B_PLANS) { plan ->
            val recommended = plan.size == "m"
            val premium = plan.size == "l"
            val accent = if (premium) BerlinRed else if (recommended) BerlinGreen else BerlinBlue
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = androidx.compose.foundation.BorderStroke(if (recommended || premium) 2.dp else 1.dp, if (recommended || premium) accent else MaterialTheme.colorScheme.outline),
                elevation = CardDefaults.cardElevation(if (recommended || premium) 4.dp else 2.dp)
            ) {
                Column(Modifier.padding(18.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(t(plan.name, plan.name.replace("Kiez", "Mahalle"), plan.name.replace("Kiez", "Neighbourhood")), fontWeight = FontWeight.Black, fontSize = 19.sp) // 2026-11-14: package names translated
                            Text(t(plan.tagDe, plan.tagTr, plan.tagEn), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        if (plan.badgeDe.isNotBlank()) {
                            Surface(shape = RoundedCornerShape(8.dp), color = accent) {
                                Text(t(plan.badgeDe, plan.badgeTr, plan.badgeEn), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text("${plan.price} €", fontWeight = FontWeight.Black, fontSize = 28.sp, color = accent)
                        Text(t(" / Monat", " / ay", " / month"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(bottom = 5.dp, start = 4.dp))
                    }
                    Text(t("Start: 3 Monate je 19 €", "Başlangıç: 3 ay 19 €", "Start: 3 months at €19"), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(12.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                    Spacer(Modifier.height(12.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        plan.features.forEach { f ->
                            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = accent, modifier = Modifier.size(16.dp).padding(top = 2.dp))
                                Text(t(f.first, f.second, f.third), fontSize = 12.5.sp, lineHeight = 17.sp, color = MaterialTheme.colorScheme.onSurface)
                            }
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Button(
                        onClick = { onOpenWerben(plan.size) },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = accent),
                        modifier = Modifier.fillMaxWidth().height(46.dp)
                    ) {
                        Text(t("${plan.name} wählen & buchen", "${plan.name} seç & rezerve et", "Choose & book ${plan.name}"), fontWeight = FontWeight.Bold, color = Color.White)
                    }
                    TextButton(
                        onClick = { SampleData.pricingPackages.firstOrNull { it.id == plan.packageId }?.let(onSelectPackage) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(t("Erst unverbindlich anfragen", "Önce bağlayıcı olmayan talep gönder", "Send a free enquiry first"), fontSize = 12.sp)
                    }
                }
            }
        }

        // Optional extras (on request)
        item {
            Spacer(Modifier.height(16.dp))
            Column(Modifier.padding(horizontal = 16.dp)) {
                Text(t("Zusätzliche Werbemöglichkeiten (auf Anfrage)", "Ek reklam seçenekleri (talep üzerine)", "Additional advertising options (on request)"), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Spacer(Modifier.height(10.dp))
                val extras = listOf(
                    listOf(t("Kiez Deal", "Mahalle fırsatı", "Neighbourhood deal"), t("Ihr Angebot prominent in der Deals-Übersicht", "Teklifiniz fırsatlar listesinde öne çıkar", "Your offer featured in the deals overview"), t("14,90 € / Woche", "14,90 € / hafta", "€14.90 / week")),
                    listOf(t("Event hervorheben", "Etkinliği öne çıkar", "Highlight an event"), t("Ihre Veranstaltung ganz oben in den Events", "Etkinliğiniz etkinlikler listesinde en üstte", "Your event at the top of the events"), t("19,90 € / Woche", "19,90 € / hafta", "€19.90 / week")),
                    listOf(t("Top-Platzierung im Kiez", "Mahallede en üst sıra", "Top spot in your neighbourhood"), t("Ihr Unternehmen an erster Stelle in der Kategorie", "İşletmeniz kategoride ilk sırada", "Your business first in its category"), t("29,90 € / Woche", "29,90 € / hafta", "€29.90 / week")),
                    listOf(t("Startseiten-Banner", "Ana sayfa banner'ı", "Home page banner"), t("Exklusive Präsentation auf der Startseite", "Ana sayfada özel tanıtım", "Exclusive presentation on the home page"), t("49,90 € / Woche", "49,90 € / hafta", "€49.90 / week"))
                )
                extras.forEach { (title, desc, price) ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(1.dp)
                    ) {
                        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                            Column(Modifier.weight(1f)) {
                                Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(desc, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Surface(shape = RoundedCornerShape(8.dp), color = BerlinRedLight) {
                                Text(price, color = BerlinRed, fontWeight = FontWeight.Bold, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                            }
                        }
                    }
                }
            }
        }

        // How it works
        item {
            Spacer(Modifier.height(20.dp))
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text(t("So einfach funktioniert es", "Bu kadar kolay", "It's that easy"), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(Modifier.height(12.dp))
                    StepRow("1", t("Paket wählen", "Paket seç", "Choose a package"), t("Kiez Basic, Kiez Plus oder Kiez Premium.", "Mahalle Basic, Mahalle Plus veya Mahalle Premium.", "Neighbourhood Basic, Neighbourhood Plus or Neighbourhood Premium."))
                    StepRow("2", t("Daten senden & bezahlen", "Bilgileri gönder & öde", "Send details & pay"), t("Firmendaten eintragen, sicher per Karte zahlen.", "Firma bilgilerini gir, kartla güvenle öde.", "Enter your details, pay securely by card."))
                    StepRow("3", t("Prüfung & Freigabe", "Kontrol & onay", "Check & approval"), t("Wir prüfen Bild und Text und schalten Ihre Anzeige online.", "Resim ve metni kontrol edip reklamınızı yayına alırız.", "We check picture and text and put your ad online."))
                    StepRow("4", t("Sichtbar werden", "Görünür ol", "Get seen"), t("Kunden im Kiez rufen Sie an oder schreiben Ihnen.", "Mahalledeki müşteriler sizi arar veya size yazar.", "Customers in the neighbourhood call or message you."))
                }
            }
        }

        // Contact
        item {
            Spacer(Modifier.height(16.dp))
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).clickable {
                    try { context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:info@mykiezberlin.com?subject=" + Uri.encode("Werbung My Kiez Berlin")))) } catch (_: Exception) {}
                },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(Icons.Default.Email, contentDescription = null, tint = BerlinRed)
                    Column(Modifier.weight(1f)) {
                        Text(t("Fragen? Schreiben Sie uns", "Sorunuz mu var? Bize yazın", "Questions? Write to us"), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("info@mykiezberlin.com", fontSize = 13.sp, color = BerlinRed)
                    }
                }
            }
        }
    }

    // Enquiry dialog (without payment)
    if (selectedPackage != null) {
        Dialog(onDismissRequest = onCloseBooking) {
            Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), elevation = CardDefaults.cardElevation(8.dp)) {
                Column(Modifier.fillMaxWidth().padding(20.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(t("Anfrage: ", "Talep: ", "Enquiry: ") + t(selectedPackage.name, selectedPackage.name.replace("Kiez", "Mahalle"), selectedPackage.name.replace("Kiez", "Neighbourhood")), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        IconButton(onClick = onCloseBooking) { Icon(Icons.Default.Close, contentDescription = t("Schließen", "Kapat", "Close")) }
                    }
                    if (bookingSuccessMessage != null) {
                        Surface(shape = RoundedCornerShape(12.dp), color = BerlinGreenLight, modifier = Modifier.padding(vertical = 12.dp)) {
                            Text(
                                t("Danke! Ihre Anfrage ist da. Wir melden uns per E-Mail.", "Teşekkürler! Talebiniz bize ulaştı. Size e-postayla döneceğiz.", "Thank you! We received your enquiry and will reply by e-mail."),
                                color = BerlinGreen, fontWeight = FontWeight.Medium, fontSize = 13.sp, modifier = Modifier.padding(12.dp)
                            )
                        }
                        Button(onClick = onCloseBooking, shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = BerlinRed), modifier = Modifier.fillMaxWidth()) {
                            Text(t("Schließen", "Kapat", "Close"), color = Color.White)
                        }
                    } else {
                        Text(t("Preis: ", "Fiyat: ", "Price: ") + selectedPackage.priceMonthly + t(" / Monat", " / ay", " / month"), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = BerlinRed)
                        Spacer(Modifier.height(14.dp))
                        OutlinedTextField(companyNameInput, { companyNameInput = it }, label = { Text(t("Unternehmensname", "Firma adı", "Company name")) }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(emailInput, { emailInput = it }, label = { Text(t("E-Mail-Adresse", "E-posta adresi", "E-mail address")) }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(kiezInput, { kiezInput = it }, label = { Text(t("Kiez / Stadtteil", "Mahalle / semt", "Neighbourhood / district")) }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                        Spacer(Modifier.height(18.dp))
                        Button(
                            onClick = { if (companyNameInput.isNotBlank() && emailInput.isNotBlank()) onSubmitBooking(companyNameInput, emailInput, kiezInput) },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            enabled = companyNameInput.isNotBlank() && emailInput.isNotBlank()
                        ) { Text(t("Anfrage senden →", "Talebi gönder →", "Send enquiry →"), fontWeight = FontWeight.Bold, color = Color.White) }
                    }
                }
            }
        }
    }
}

@Composable
fun UspRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Surface(shape = CircleShape, color = BerlinRedLight, modifier = Modifier.size(36.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Icon(imageVector = icon, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(18.dp))
            }
        }
        Column {
            Text(text = title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(text = subtitle, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun StepRow(step: String, title: String, description: String) {
    Row(modifier = Modifier.padding(vertical = 6.dp), verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Surface(shape = CircleShape, color = BerlinRed, modifier = Modifier.size(26.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text(text = step, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
        Column {
            Text(text = title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(text = description, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
