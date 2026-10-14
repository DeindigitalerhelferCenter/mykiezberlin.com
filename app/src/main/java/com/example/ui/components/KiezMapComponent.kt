package com.example.ui.components

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.data.model.AppLanguage
import com.example.ui.theme.*

data class MapPinItem(
    val id: String,
    val title: String,
    val category: String,
    val rating: Double,
    val distance: String,
    val address: String = "Berlin"
)

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun KiezMapComponent(
    kiezName: String,
    language: AppLanguage,
    onSpotClick: (String) -> Unit
) {
    val context = LocalContext.current
    var mapDisplayMode by remember { mutableStateOf("gmaps") } // "gmaps", "transit", "spots"
    val actualKiez = remember(kiezName) {
        if (kiezName.isBlank() || kiezName == "Alle" || kiezName == "Ganz Berlin" || kiezName == "Tüm Berlin") {
            "Berlin"
        } else {
            kiezName
        }
    }

    val pins = remember(actualKiez) {
        listOf(
            MapPinItem("mustafas", "Mustafa's Gemüse Kebab", "Essen & Trinken", 4.7, "450 m", "Mehringdamm 32, Berlin"),
            MapPinItem("markthalle_neun", "Markthalle Neun", "Essen & Trinken", 4.6, "850 m", "Eisenbahnstraße 42/43, Berlin"),
            MapPinItem("kiez_friseur", "Kiez Friseur & Barber", "Unternehmen", 5.0, "300 m", "Oranienstraße 185, Berlin"),
            MapPinItem("kiez_fitness", "Kiez Fitness Studio", "Unternehmen", 4.6, "550 m", "Reichenberger Str. 124, Berlin"),
            MapPinItem("goerli", "Görlitzer Park", "Sehenswürdigkeiten", 4.4, "600 m", "Görlitzer Park, Berlin"),
            MapPinItem("landwehr", "Landwehrkanal Ufer", "Sehenswürdigkeiten", 4.8, "500 m", "Paul-Lincke-Ufer, Berlin")
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // ÜST KONTROL BARI: Mod Seçici [ 🗺️ Google Maps | 🚇 U- & S-Bahn | 📍 Mekânlar ]
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Row(modifier = Modifier.padding(3.dp)) {
                // 1. Google Maps
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { mapDisplayMode = "gmaps" },
                    shape = RoundedCornerShape(9.dp),
                    color = if (mapDisplayMode == "gmaps") BerlinRed else Color.Transparent
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 7.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Map,
                            contentDescription = null,
                            tint = if (mapDisplayMode == "gmaps") Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Google Maps",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.5.sp,
                            color = if (mapDisplayMode == "gmaps") Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // 2. U- & S-Bahn
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { mapDisplayMode = "transit" },
                    shape = RoundedCornerShape(9.dp),
                    color = if (mapDisplayMode == "transit") BerlinRed else Color.Transparent
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 7.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.DirectionsSubway,
                            contentDescription = null,
                            tint = if (mapDisplayMode == "transit") Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (language == AppLanguage.TURKISH) "U-/S-Bahn" else "U-/S-Bahn",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.5.sp,
                            color = if (mapDisplayMode == "transit") Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // 3. Mekânlar
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { mapDisplayMode = "spots" },
                    shape = RoundedCornerShape(9.dp),
                    color = if (mapDisplayMode == "spots") BerlinRed else Color.Transparent
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 7.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Place,
                            contentDescription = null,
                            tint = if (mapDisplayMode == "spots") Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Mekânlar" else "Orte",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.5.sp,
                            color = if (mapDisplayMode == "spots") Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        when (mapDisplayMode) {
            "transit" -> {
                // Berlin Toplu Taşıma Ağı
                BerlinTransitMapComponent(
                    language = language,
                    modifier = Modifier.weight(1f)
                )
            }

            "spots" -> {
                // Kiezdeki Mekânlar Listesi
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "$actualKiez · Öne Çıkan Noktalar",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    )

                    pins.forEach { pin ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSpotClick(pin.id) },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = BerlinRedLight,
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(Icons.Default.Place, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(20.dp))
                                        }
                                    }
                                    Column {
                                        Text(pin.title, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Text("${pin.category} · ${pin.distance} · ${pin.address}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                                IconButton(
                                    onClick = {
                                        com.example.util.MapHelper.openDirections(context, "${pin.title} ${pin.address}")
                                    }
                                ) {
                                    Icon(Icons.Default.Directions, contentDescription = "Maps", tint = Color(0xFF34A853))
                                }
                            }
                        }
                    }
                }
            }

            else -> {
                // GERÇEK CANLI GOOGLE MAPS GÖRÜNÜMÜ
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    val mapQuery = "$actualKiez, Berlin, Germany"
                    val embedUrl = "https://www.google.com/maps?q=${Uri.encode(mapQuery)}&z=13&output=embed"

                    AndroidView(
                        factory = { ctx ->
                            WebView(ctx).apply {
                                settings.javaScriptEnabled = true
                                settings.domStorageEnabled = true
                                settings.setSupportZoom(true)
                                settings.builtInZoomControls = true
                                settings.displayZoomControls = false
                                webChromeClient = WebChromeClient()
                                webViewClient = object : WebViewClient() {}
                                loadUrl(embedUrl)
                            }
                        },
                        update = { webView ->
                            webView.loadUrl(embedUrl)
                        },
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(12.dp))
                    )

                    // ÜSTTE SABİT: DOĞRUDAN GOOGLE MAPS UYGULAMASINDA AÇ BUTONU (100% GARANTİLİ ÇALIŞIR)
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color.White,
                        shadowElevation = 6.dp,
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(top = 10.dp)
                            .clickable {
                                com.example.util.MapHelper.openGoogleMaps(context, mapQuery)
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Launch,
                                contentDescription = null,
                                tint = Color(0xFF1A73E8),
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) {
                                    "Google Maps'te Canlı Aç ($actualKiez)"
                                } else {
                                    "In Google Maps öffnen ($actualKiez)"
                                },
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF202124)
                            )
                        }
                    }

                    // SAĞ ALT: HIZLI YOL TARİFİ (DIRECTIONS) BUTONU
                    FloatingActionButton(
                        onClick = {
                            com.example.util.MapHelper.openDirections(context, mapQuery)
                        },
                        containerColor = BerlinRed,
                        contentColor = Color.White,
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(14.dp)
                            .size(46.dp),
                        shape = CircleShape
                    ) {
                        Icon(imageVector = Icons.Default.Navigation, contentDescription = "Yol Tarifi", modifier = Modifier.size(22.dp))
                    }
                }
            }
        }
    }
}
