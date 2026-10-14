package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AddOnOption
import com.example.data.model.AppLanguage
import com.example.data.model.PricingPackage
import com.example.data.repository.SampleData
import com.example.ui.theme.*

@Composable
fun BusinessPortalScreen(
    language: AppLanguage,
    isYearly: Boolean,
    onToggleYearly: (Boolean) -> Unit,
    selectedPackage: PricingPackage?,
    onSelectPackage: (PricingPackage) -> Unit,
    onCloseBooking: () -> Unit,
    onSubmitBooking: (String, String, String) -> Unit,
    bookingSuccessMessage: String?
) {
    var companyNameInput by remember { mutableStateOf("") }
    var emailInput by remember { mutableStateOf("") }
    var kiezInput by remember { mutableStateOf("Kreuzberg") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        // Hero Header (Matching Image 4)
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFF0F172A), Color(0xFF1E293B), BerlinRedDark)
                        )
                    )
                    .padding(20.dp)
            ) {
                Column {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color.White.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = "FÜR UNTERNEHMEN · B2B",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = if (language == AppLanguage.TURKISH)
                            "İşletmeniz Tüm Berlin'de Görünür Olsun!"
                        else
                            "Ihr Unternehmen in ganz Berlin sichtbar!",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 24.sp,
                        lineHeight = 28.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Mit My Kiez Berlin erreichen Sie gezielt Menschen in Ihrem Kiez. Präsentieren Sie Ihr Unternehmen auf unserer App und Website – modern, lokal und effektiv.",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Dein Kiez. Deine Kunden. Dein Erfolg.",
                        color = BerlinYellow,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }
        }

        // 4 Value Pillars (USPs)
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    UspRow(Icons.Default.Adjust, "Gezielte lokale Reichweite", "Direkt in Ihrem Stadtteil sichtbar sein")
                    UspRow(Icons.Default.People, "Passende Kunden aus Ihrem Kiez", "Anwohner und Kiez-Besucher ansprechen")
                    UspRow(Icons.Default.TrendingUp, "Mehr Sichtbarkeit & mehr Umsatz", "Durch Top-Platzierungen und Werbe-Pins")
                    UspRow(Icons.Default.TouchApp, "Einfache Online-Buchung", "In wenigen Minuten online starten")
                }
            }
        }

        // Pricing Section Header & Billing Period Switcher
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Unsere Werbepakete",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
                Text(
                    text = "Wählen Sie das passende Paket für Ihr Unternehmen.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Toggle: Monatlich / Jährlich (2 Monate gratis)
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Row(modifier = Modifier.padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (!isYearly) BerlinRed else Color.Transparent,
                            modifier = Modifier.clickable { onToggleYearly(false) }
                        ) {
                            Text(
                                text = "Monatlich",
                                color = if (!isYearly) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isYearly) BerlinRed else Color.Transparent,
                            modifier = Modifier.clickable { onToggleYearly(true) }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = "Jährlich",
                                    color = if (isYearly) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = BerlinGreen
                                ) {
                                    Text(
                                        text = "2 Monate gratis",
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Pricing Cards
        items(SampleData.pricingPackages) { pkg ->
            val isSelected = selectedPackage?.id == pkg.id
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (pkg.isPopular) Color(0xFFF0FDF4) else MaterialTheme.colorScheme.surface
                ),
                border = if (pkg.isPopular) androidx.compose.foundation.BorderStroke(2.dp, BerlinGreen)
                else if (pkg.isMaxVisibility) androidx.compose.foundation.BorderStroke(2.dp, BerlinRed)
                else androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                elevation = CardDefaults.cardElevation(if (pkg.isPopular || pkg.isMaxVisibility) 4.dp else 2.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = pkg.name,
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp
                        )

                        if (pkg.isPopular) {
                            Surface(shape = RoundedCornerShape(8.dp), color = BerlinGreen) {
                                Text(
                                    text = "Beliebt",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        } else if (pkg.isMaxVisibility) {
                            Surface(shape = RoundedCornerShape(8.dp), color = BerlinRed) {
                                Text(
                                    text = "Maximale Sichtbarkeit",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = if (isYearly) pkg.priceYearlyMonthly else pkg.priceMonthly,
                            fontWeight = FontWeight.Black,
                            fontSize = 26.sp,
                            color = BerlinCharcoal
                        )
                        Text(
                            text = " / Monat zzgl. MwSt.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 4.dp, start = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Divider(color = MaterialTheme.colorScheme.surfaceVariant)
                    Spacer(modifier = Modifier.height(14.dp))

                    // Features checklist
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        pkg.features.forEach { feat ->
                            Row(
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = if (pkg.isMaxVisibility) BerlinRed else BerlinGreen,
                                    modifier = Modifier.size(16.dp).padding(top = 2.dp)
                                )
                                Text(
                                    text = feat,
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    Button(
                        onClick = { onSelectPackage(pkg) },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (pkg.isMaxVisibility) BerlinRed else if (pkg.isPopular) BerlinBlue else BerlinCharcoal
                        ),
                        modifier = Modifier.fillMaxWidth().height(46.dp)
                    ) {
                        Text(
                            text = "Jetzt ${pkg.name} wählen",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }

        // Additional Add-Ons (Zusätzliche Werbemöglichkeiten)
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Text(
                    text = "Zusätzliche Werbemöglichkeiten (optional buchbar)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(10.dp))

                SampleData.addOns.forEach { addOn ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(1.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = addOn.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(text = addOn.description, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Surface(shape = RoundedCornerShape(8.dp), color = BerlinRedLight) {
                                Text(
                                    text = addOn.pricePerWeek,
                                    color = BerlinRed,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // 4 Step How it works: "So einfach funktioniert es"
        item {
            Spacer(modifier = Modifier.height(20.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "So einfach funktioniert es",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    StepRow("1", "Paket wählen", "Wählen Sie das passende Werbepaket für Ihr Unternehmen.")
                    StepRow("2", "Daten eintragen", "Laden Sie Bilder hoch und ergänzen Sie Ihre Daten.")
                    StepRow("3", "Prüfung & Freigabe", "Wir prüfen Ihren Eintrag und schalten ihn online.")
                    StepRow("4", "Sichtbar werden", "Ihr Unternehmen erreicht gezielt Menschen im Kiez.")
                }
            }
        }
    }

    // Booking Dialog Modal
    if (selectedPackage != null) {
        Dialog(onDismissRequest = onCloseBooking) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Buchung: ${selectedPackage.name}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        IconButton(onClick = onCloseBooking) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    if (bookingSuccessMessage != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = BerlinGreenLight,
                            modifier = Modifier.padding(vertical = 12.dp)
                        ) {
                            Text(
                                text = bookingSuccessMessage,
                                color = BerlinGreen,
                                fontWeight = FontWeight.Medium,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(12.dp)
                            )
                        }

                        Button(
                            onClick = onCloseBooking,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Schließen", color = Color.White)
                        }
                    } else {
                        Text(
                            text = "Preis: ${selectedPackage.priceMonthly} / Monat",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = BerlinRed
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        OutlinedTextField(
                            value = companyNameInput,
                            onValueChange = { companyNameInput = it },
                            label = { Text("Unternehmensname") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = emailInput,
                            onValueChange = { emailInput = it },
                            label = { Text("E-Mail-Adresse") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = kiezInput,
                            onValueChange = { kiezInput = it },
                            label = { Text("Kiez / Stadtteil") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(18.dp))

                        Button(
                            onClick = {
                                if (companyNameInput.isNotBlank() && emailInput.isNotBlank()) {
                                    onSubmitBooking(companyNameInput, emailInput, kiezInput)
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            enabled = companyNameInput.isNotBlank() && emailInput.isNotBlank()
                        ) {
                            Text(
                                text = "Jetzt Werbepaket buchen ->",
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun UspRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
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
    Row(
        modifier = Modifier.padding(vertical = 6.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
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
