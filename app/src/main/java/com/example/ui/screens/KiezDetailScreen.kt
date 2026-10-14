package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
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
import com.example.data.repository.SampleData
import com.example.ui.components.BerlinTransitMapComponent
import com.example.ui.components.KiezPhotoHelper
import com.example.ui.components.RealKiezImage
import com.example.ui.theme.*
import com.example.util.MapHelper
import com.example.ui.viewmodel.AppScreen

@Composable
fun KiezDetailScreen(
    kiezId: String,
    language: AppLanguage,
    onBack: () -> Unit,
    onStartQuiz: () -> Unit,
    onNavigate: (AppScreen) -> Unit,
    isFavorite: Boolean,
    onToggleFavorite: () -> Unit
) {
    val context = LocalContext.current
    val kiez = remember(kiezId) {
        SampleData.kieze.find { it.id == kiezId || it.id.replace("-", "") == kiezId.replace("-", "") }
            ?: SampleData.kieze.first()
    }

    var activeSubTab by remember { mutableStateOf("Überblick") }
    val subTabs = listOf(
        "Überblick",
        "Verkehr & Karte",
        "Behörden & Polizei",
        "Sehenswürdigkeiten",
        "Essen & Trinken",
        "Unternehmen",
        "Events"
    )

    val kiezFoodSpots = remember(kiez.name) {
        SampleData.foodSpots.filter { it.kiezName.contains(kiez.name, ignoreCase = true) || kiez.name.contains(it.kiezName, ignoreCase = true) }
            .ifEmpty { SampleData.foodSpots.take(3) }
    }

    val kiezBusinesses = remember(kiez.name) {
        SampleData.businesses.filter { it.kiezName.contains(kiez.name, ignoreCase = true) || kiez.name.contains(it.kiezName, ignoreCase = true) }
            .ifEmpty { SampleData.businesses.take(3) }
    }

    val kiezEvents = remember(kiez.name) {
        SampleData.events.filter { it.kiezName.contains(kiez.name, ignoreCase = true) || kiez.name.contains(it.kiezName, ignoreCase = true) }
            .ifEmpty { SampleData.events.take(2) }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 90.dp)
    ) {
        // Hero Header with real photo of Kiez landmark
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(250.dp)
            ) {
                RealKiezImage(
                    drawableId = KiezPhotoHelper.getKiezDrawable(kiez.id),
                    imageUrl = kiez.imageUrl,
                    contentDescription = kiez.name,
                    showBottomGradient = true,
                    modifier = Modifier.fillMaxSize()
                )

                // Top controls: Back & Favorite
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = Color.Black.copy(alpha = 0.5f),
                        modifier = Modifier
                            .size(40.dp)
                            .clickable { onBack() }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Surface(
                        shape = CircleShape,
                        color = Color.Black.copy(alpha = 0.5f),
                        modifier = Modifier
                            .size(40.dp)
                            .clickable {
                                onToggleFavorite()
                                Toast.makeText(
                                    context,
                                    if (isFavorite) "${kiez.name} aus Favoriten entfernt" else "${kiez.name} zu Favoriten hinzugefügt! ❤️",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                contentDescription = "Favorite",
                                tint = if (isFavorite) BerlinRed else Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }

                // Title & Subtitle at bottom of hero
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp)
                ) {
                    Surface(
                        color = BerlinRed,
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.padding(bottom = 6.dp)
                    ) {
                        Text(
                            text = "BERLIN KIEZ · ${kiez.postalCodes.split(',').first().trim()}",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                    Text(
                        text = kiez.name,
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 32.sp
                    )
                    Text(
                        text = kiez.subtitle,
                        color = Color.White.copy(alpha = 0.92f),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Subtabs Row
        item {
            ScrollableTabRow(
                selectedTabIndex = subTabs.indexOf(activeSubTab).coerceAtLeast(0),
                edgePadding = 14.dp,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = BerlinRed
            ) {
                subTabs.forEach { tab ->
                    val isSelected = activeSubTab == tab
                    Tab(
                        selected = isSelected,
                        onClick = { activeSubTab = tab },
                        text = {
                            Text(
                                text = when {
                                    language == AppLanguage.TURKISH && tab == "Überblick" -> "Genel Bakış"
                                    language == AppLanguage.TURKISH && tab == "Verkehr & Karte" -> "Ulaşım & Harita"
                                    language == AppLanguage.TURKISH && tab == "Behörden & Polizei" -> "Resmi Kurumlar & Karakol"
                                    language == AppLanguage.TURKISH && tab == "Sehenswürdigkeiten" -> "Gezilecek Yerler"
                                    language == AppLanguage.TURKISH && tab == "Essen & Trinken" -> "Yeme & İçme"
                                    language == AppLanguage.TURKISH && tab == "Unternehmen" -> "İşletmeler"
                                    language == AppLanguage.TURKISH && tab == "Events" -> "Etkinlikler"
                                    language == AppLanguage.ENGLISH && tab == "Überblick" -> "Overview"
                                    language == AppLanguage.ENGLISH && tab == "Verkehr & Karte" -> "Transit & Map"
                                    language == AppLanguage.ENGLISH && tab == "Behörden & Polizei" -> "Authorities & Police"
                                    language == AppLanguage.ENGLISH && tab == "Sehenswürdigkeiten" -> "Sights"
                                    language == AppLanguage.ENGLISH && tab == "Essen & Trinken" -> "Food & Drinks"
                                    language == AppLanguage.ENGLISH && tab == "Unternehmen" -> "Businesses"
                                    else -> tab
                                },
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 13.sp,
                                color = if (isSelected) BerlinRed else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    )
                }
            }
        }

        // DYNAMIC CONTENT BASED ON ACTIVE SUBTAB
        when (activeSubTab) {
            "Überblick" -> {
                // Stats Badges (PLZ, Einwohner, Mietspiegel, Vibe)
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text("PLZ", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, fontWeight = FontWeight.Bold)
                                Text(kiez.postalCodes.split(",").take(2).joinToString(", "), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }

                        Card(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Nüfus" else "Einwohner",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(kiez.population, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }

                        Card(
                            modifier = Modifier.weight(1.15f),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Ekim 2026 Kira" else "Miete Okt 2026",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(kiez.rentIndex, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BerlinRed)
                            }
                        }
                    }
                }

                // Description
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(18.dp))
                                Text(
                                    text = "${if (language == AppLanguage.TURKISH) "Hakkında: " else "Über "}${kiez.name}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = kiez.description,
                                fontSize = 14.sp,
                                lineHeight = 21.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // Ulaşım Ağı Özeti Kartı
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(imageVector = Icons.Default.DirectionsTransit, contentDescription = null, tint = BerlinBlue, modifier = Modifier.size(18.dp))
                                    Text(
                                        text = if (language == AppLanguage.TURKISH) "Ulaşım Ağı & Bağlantılar" else "Öffentlicher Nahverkehr",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                }
                                TextButton(onClick = { activeSubTab = "Verkehr & Karte" }) {
                                    Text(if (language == AppLanguage.TURKISH) "Haritada Gör" else "Netzplan", fontSize = 12.sp, color = BerlinRed)
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = kiez.transitLines.ifEmpty { "U-Bahn, S-Bahn & Bus-Linien direkt angebunden." },
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                lineHeight = 19.sp
                            )
                        }
                    }
                }

                // Parklar & Yeşil Alanlar Kartı
                if (kiez.parks.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(14.dp))
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(imageVector = Icons.Default.Park, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(18.dp))
                                    Text(
                                        text = if (language == AppLanguage.TURKISH) "Parklar & Yeşil Alanlar" else "Parks & Grünanlagen",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    kiez.parks.forEach { park ->
                                        Surface(
                                            shape = RoundedCornerShape(8.dp),
                                            color = BerlinGreenLight
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Icon(imageVector = Icons.Default.NaturePeople, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(12.dp))
                                                Text(text = park, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, color = BerlinGreen)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Popüler Kafe & Restoranlar Kartı
                if (kiez.popularSpots.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(14.dp))
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(imageVector = Icons.Default.Restaurant, contentDescription = null, tint = BerlinYellow, modifier = Modifier.size(18.dp))
                                    Text(
                                        text = if (language == AppLanguage.TURKISH) "Öne Çıkan Kafe & Restoranlar" else "Beliebte Cafés & Restaurants",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState()),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    kiez.popularSpots.forEach { spot ->
                                        Surface(
                                            shape = RoundedCornerShape(8.dp),
                                            color = MaterialTheme.colorScheme.surfaceVariant
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Icon(imageVector = Icons.Default.LocalCafe, contentDescription = null, tint = BerlinYellow, modifier = Modifier.size(12.dp))
                                                Text(text = spot, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Resmi Daire & Karakol Özeti Kartı
                if (kiez.buergeramtName.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(14.dp))
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(imageVector = Icons.Default.AccountBalance, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(18.dp))
                                        Text(
                                            text = if (language == AppLanguage.TURKISH) "Resmi Daire & Karakol" else "Bürgeramt & Polizei",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp
                                        )
                                    }
                                    TextButton(onClick = { activeSubTab = "Behörden & Polizei" }) {
                                        Text(if (language == AppLanguage.TURKISH) "Detaylar" else "Details", fontSize = 12.sp, color = BerlinRed)
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "🏛️ ${kiez.buergeramtName} (${kiez.buergeramtAddress})",
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "👮 ${kiez.policeStation} (${kiez.policeAddress})",
                                    fontSize = 12.5.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                // Highlights Section
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Öne Çıkan Özellikler & Mekanlar" else "Highlights im Kiez",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        kiez.highlights.forEach { hl ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(16.dp))
                                Text(text = hl, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }

                // Impressionen Photo Gallery
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "İzlenimler & Fotoğraflar" else "Impressionen aus ${kiez.name}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(kiez.highlights) { spotName ->
                                Card(
                                    modifier = Modifier.width(150.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    elevation = CardDefaults.cardElevation(2.dp)
                                ) {
                                    Column {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(95.dp)
                                        ) {
                                            RealKiezImage(
                                                drawableId = KiezPhotoHelper.getKiezDrawable(kiez.id),
                                                imageUrl = kiez.imageUrl,
                                                contentDescription = spotName,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                        }
                                        Text(
                                            text = spotName,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            maxLines = 1,
                                            modifier = Modifier.padding(8.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Kiez Quiz CTA
                item {
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = onStartQuiz,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .height(50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(imageVector = Icons.Default.EmojiEvents, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                            Text(
                                text = if (language == AppLanguage.TURKISH) "${kiez.name} Bilgi Yarışmasını Başlat" else "Kiez-Quiz für ${kiez.name} starten",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Icon(imageVector = Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }

            "Verkehr & Karte" -> {
                // Berlin U-Bahn & S-Bahn Harita Sekmesi
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "${kiez.name} Ulaşım Ağı & Haritalar" else "Verkehr & Karten für ${kiez.name}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Geçen Hatlar: ${kiez.transitLines}",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Action Buttons: Open in Google Maps & Open BVG
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    MapHelper.openGoogleMaps(context, "${kiez.name} Berlin", kiez.lat, kiez.lng)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF34A853))
                            ) {
                                Icon(imageVector = Icons.Default.Map, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Google Maps", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }

                            Button(
                                onClick = {
                                    val bvgIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.bvg.de/de/verbindungen/fahrplanauskunft"))
                                    context.startActivity(bvgIntent)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF3C400))
                            ) {
                                Icon(imageVector = Icons.Default.DirectionsSubway, contentDescription = null, tint = Color.Black, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("BVG Fahrinfo", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                            }
                        }
                    }
                }

                // Interactive Berlin Transit Map
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(420.dp)) {
                        BerlinTransitMapComponent(
                            language = language,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
            }

            "Behörden & Polizei" -> {
                // Resmi Kurumlar & Karakollar Sekmesi
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "${kiez.name} Resmi Kurumları & Güvenlik" else "Behörden & Polizei in ${kiez.name}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        // 1. Bürgeramt Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Surface(shape = CircleShape, color = BerlinBlueLight, modifier = Modifier.size(36.dp)) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(imageVector = Icons.Default.AccountBalance, contentDescription = null, tint = BerlinBlue, modifier = Modifier.size(20.dp))
                                        }
                                    }
                                    Column {
                                        Text(
                                            text = kiez.buergeramtName.ifEmpty { "Bürgeramt ${kiez.name}" },
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp
                                        )
                                        Text(
                                            text = kiez.buergeramtAddress.ifEmpty { "Bezirksamt Berlin" },
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = {
                                            val terminIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://service.berlin.de/terminvereinbarung/"))
                                            context.startActivity(terminIntent)
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = BerlinBlue),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text(if (language == AppLanguage.TURKISH) "Randevu Al (Termin)" else "Termin buchen", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            MapHelper.openDirections(context, "${kiez.buergeramtName} ${kiez.buergeramtAddress} Berlin")
                                        },
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(imageVector = Icons.Default.Directions, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(if (language == AppLanguage.TURKISH) "Rota Göster" else "Route", fontSize = 11.5.sp)
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // 2. Polizeiabschnitt Card
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Surface(shape = CircleShape, color = BerlinGreenLight, modifier = Modifier.size(36.dp)) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(imageVector = Icons.Default.LocalPolice, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(20.dp))
                                        }
                                    }
                                    Column {
                                        Text(
                                            text = kiez.policeStation.ifEmpty { "Polizeiabschnitt ${kiez.name}" },
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp
                                        )
                                        Text(
                                            text = kiez.policeAddress.ifEmpty { "Polizei Berlin" },
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Telefon: ${kiez.policePhone}",
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = {
                                            val dial = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${kiez.policePhone.replace(" ", "")}"))
                                            context.startActivity(dial)
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = BerlinGreen),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(imageVector = Icons.Default.Phone, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(if (language == AppLanguage.TURKISH) "Karakolu Ara" else "Anrufen", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            MapHelper.openGoogleMaps(context, "${kiez.policeStation} ${kiez.policeAddress} Berlin")
                                        },
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(imageVector = Icons.Default.Place, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(if (language == AppLanguage.TURKISH) "Haritada Aç" else "Karte", fontSize = 11.5.sp)
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // 3. Notruf Schnellanruf Row
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Acil Durum Hatları" else "Zentrale Notrufnummern",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = BerlinRedLight,
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable {
                                        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:110")))
                                    }
                            ) {
                                Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("110", fontWeight = FontWeight.Black, fontSize = 16.sp, color = BerlinRed)
                                    Text("Polizei", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = BerlinRedLight,
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable {
                                        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:112")))
                                    }
                            ) {
                                Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("112", fontWeight = FontWeight.Black, fontSize = 16.sp, color = BerlinRed)
                                    Text("Feuerwehr", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier
                                    .weight(1.3f)
                                    .clickable {
                                        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:116117")))
                                    }
                            ) {
                                Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("116 117", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("Arzt-Dienst", fontSize = 10.sp)
                                }
                            }
                        }
                    }
                }
            }

            "Sehenswürdigkeiten" -> {
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "${kiez.highlights.size} Sehenswürdigkeiten in ${kiez.name}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
                items(kiez.highlights) { sight ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(modifier = Modifier.size(65.dp).clip(RoundedCornerShape(10.dp))) {
                                RealKiezImage(drawableId = KiezPhotoHelper.getKiezDrawable(kiez.id), imageUrl = kiez.imageUrl, contentDescription = sight, modifier = Modifier.fillMaxSize())
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = sight, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(text = "${kiez.name}, Berlin", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = BerlinRedLight,
                                        modifier = Modifier.clickable {
                                            MapHelper.openDirections(context, "$sight, ${kiez.name}, Berlin")
                                        }
                                    ) {
                                        Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                            Icon(imageVector = Icons.Default.Directions, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(12.dp))
                                            Text(text = "Route", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BerlinRed)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "Essen & Trinken" -> {
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Gastronomie in ${kiez.name}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
                items(kiezFoodSpots) { spot ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clickable { onNavigate(AppScreen.FOOD) },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(modifier = Modifier.size(70.dp).clip(RoundedCornerShape(10.dp))) {
                                RealKiezImage(drawableId = KiezPhotoHelper.getFoodDrawable(spot.id), contentDescription = spot.name, modifier = Modifier.fillMaxSize())
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = spot.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text(text = spot.cuisine, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(imageVector = Icons.Default.Star, contentDescription = null, tint = BerlinYellow, modifier = Modifier.size(12.dp))
                                    Text(text = "${spot.rating} (${spot.reviewsCount})", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                }
                                Text(text = spot.address, fontSize = 11.sp, color = Color.Gray, maxLines = 1)
                            }
                        }
                    }
                }
            }

            "Unternehmen" -> {
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Lokale Unternehmen in ${kiez.name}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
                items(kiezBusinesses) { biz ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clickable { onNavigate(AppScreen.BUSINESSES) },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(text = biz.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text(text = biz.category, fontSize = 12.sp, color = BerlinBlue, fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = biz.address, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(modifier = Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${biz.phone}"))
                                        context.startActivity(intent)
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    modifier = Modifier.height(32.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.Phone, contentDescription = null, tint = Color.White, modifier = Modifier.size(13.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Anrufen", fontSize = 11.sp, color = Color.White)
                                }
                            }
                        }
                    }
                }
            }

            "Events" -> {
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Events in ${kiez.name}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
                items(kiezEvents) { event ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clickable { onNavigate(AppScreen.EVENTS) },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(modifier = Modifier.size(65.dp).clip(RoundedCornerShape(10.dp))) {
                                RealKiezImage(drawableId = KiezPhotoHelper.getEventDrawable(event.id), contentDescription = event.title, modifier = Modifier.fillMaxSize())
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(text = event.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(text = "${event.dayLabel} · ${event.time}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Surface(color = if (event.isFree) BerlinGreenLight else BerlinRedLight, shape = RoundedCornerShape(4.dp)) {
                                    Text(
                                        text = event.price,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (event.isFree) BerlinGreen else BerlinRed,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
