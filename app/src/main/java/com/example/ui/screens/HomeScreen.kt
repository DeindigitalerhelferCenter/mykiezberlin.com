package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.model.AppLanguage
import com.example.data.model.Kiez
import com.example.data.repository.SampleData
import com.example.ui.components.KiezPhotoHelper
import com.example.ui.components.RealKiezImage
import com.example.ui.theme.*
import com.example.ui.viewmodel.AppScreen

data class QuickActionItem(
    val titleDe: String,
    val titleEn: String,
    val titleTr: String,
    val icon: ImageVector,
    val color: Color,
    val screen: AppScreen
)

@Composable
fun HomeScreen(
    language: AppLanguage,
    searchQuery: String,
    onNavigate: (AppScreen) -> Unit,
    onKiezClick: (String) -> Unit
) {
    val quickActions = listOf(
        QuickActionItem("Kieze", "Kieze", "Kiezler", Icons.Default.LocationOn, BerlinRed, AppScreen.KIEZE),
        QuickActionItem("Quiz", "Quiz", "Bilgi Yarışması", Icons.Default.EmojiEvents, BerlinYellow, AppScreen.QUIZ),
        QuickActionItem("Essen & Trinken", "Food & Drinks", "Yeme & İçme", Icons.Default.Restaurant, Color(0xFFF97316), AppScreen.FOOD),
        QuickActionItem("Events", "Events", "Etkinlikler", Icons.Default.CalendarToday, BerlinBlue, AppScreen.EVENTS),
        QuickActionItem("Unternehmen", "Businesses", "İşletmeler", Icons.Default.Storefront, Color(0xFF8B5CF6), AppScreen.BUSINESSES),
        QuickActionItem("Deals", "Deals", "Fırsatlar", Icons.Default.LocalOffer, BerlinGreen, AppScreen.DEALS),
        QuickActionItem("Wissen", "Guide", "Rehber & Bilgi", Icons.Default.Lightbulb, Color(0xFF06B6D4), AppScreen.KNOWLEDGE),
        QuickActionItem("Favoriten", "Favorites", "Favoriler", Icons.Default.Favorite, Color(0xFFEC4899), AppScreen.FAVORITES)
    )

    // Client-side search matching name, address, cuisine, tags
    val isSearching = searchQuery.isNotBlank()
    val searchKieze = remember(searchQuery) {
        if (!isSearching) emptyList()
        else SampleData.kieze.filter { it.name.contains(searchQuery, ignoreCase = true) || it.specialty.contains(searchQuery, ignoreCase = true) }
    }
    val searchFood = remember(searchQuery) {
        if (!isSearching) emptyList()
        else SampleData.foodSpots.filter { it.name.contains(searchQuery, ignoreCase = true) || it.cuisine.contains(searchQuery, ignoreCase = true) || it.address.contains(searchQuery, ignoreCase = true) }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 80.dp)
    ) {
        // If user is searching from top bar, display search results instantly!
        if (isSearching) {
            item {
                Surface(
                    color = BerlinRedLight,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(16.dp)
                ) {
                    Text(
                        text = "Suchergebnisse für: '$searchQuery' (${searchKieze.size + searchFood.size} Treffer)",
                        color = BerlinRed,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }

            if (searchKieze.isNotEmpty()) {
                item {
                    Text("Gefundene Kieze", fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
                }
                items(searchKieze) { kiez ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).clickable { onKiezClick(kiez.id) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = BerlinRed)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(kiez.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(kiez.subtitle, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }

            if (searchFood.isNotEmpty()) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Gefundene Gastronomie", fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
                }
                items(searchFood) { spot ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).clickable { onNavigate(AppScreen.FOOD) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Restaurant, contentDescription = null, tint = BerlinYellow)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(spot.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("${spot.cuisine} · ${spot.kiezName}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }

            return@LazyColumn
        }

        // Hero Banner with real Berlin panorama photo
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(210.dp)
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .shadow(6.dp, RoundedCornerShape(20.dp))
                    .clip(RoundedCornerShape(20.dp))
            ) {
                // Real Berlin Hero Photo
                Image(
                    painter = painterResource(id = R.drawable.hero_berlin),
                    contentDescription = "Berlin Panorama",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                // Dark stylish gradient overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.35f),
                                    Color.Black.copy(alpha = 0.85f)
                                )
                            )
                        )
                )

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = BerlinRed
                    ) {
                        Text(
                            text = "BERLIN GUIDE 2026 · 22 KIEZE",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }

                    Column {
                        Text(
                            text = when (language) {
                                AppLanguage.TURKISH -> "Berlin'i keşfet.\nKiez Kiez."
                                AppLanguage.ENGLISH -> "Discover Berlin.\nKiez by Kiez."
                                else -> "Entdecke Berlin.\nKiez für Kiez."
                            },
                            color = Color.White,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Black,
                            lineHeight = 28.sp
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = when (language) {
                                AppLanguage.TURKISH -> "22 Mahalle, gizli lezzetler ve yerel işletmeler"
                                AppLanguage.ENGLISH -> "22 Neighborhoods, authentic food & businesses"
                                else -> "22 Kieze. Deine Stadt. Dein Berlin."
                            },
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 12.sp
                        )
                    }

                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(BerlinRed)
                            .clickable { onNavigate(AppScreen.KIEZE) }
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = when (language) {
                                AppLanguage.TURKISH -> "22 Kiezi Keşfet"
                                AppLanguage.ENGLISH -> "Explore 22 Kieze"
                                else -> "22 Kieze entdecken"
                            },
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        }

        // 🔴 Berlin Saat Başı Canlı Bülten & Resmi Haberler (24 Saatlik)
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = BerlinRed.copy(alpha = 0.08f),
                border = androidx.compose.foundation.BorderStroke(1.dp, BerlinRed.copy(alpha = 0.35f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .clickable { onNavigate(AppScreen.LIVE_BULLETIN) }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        shape = CircleShape,
                        color = BerlinRed,
                        modifier = Modifier.size(10.dp)
                    ) {}
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "🔴 CANLI BERLİN BÜLTENİ" else "🔴 BERLIN LIVE-TICKER",
                                color = BerlinRed,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.5.sp
                            )
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = BerlinRed.copy(alpha = 0.12f)
                            ) {
                                Text(
                                    text = "LIVE",
                                    color = BerlinRed,
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
                                )
                            }
                        }
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "Polis, İtfaiye, BVG, S-Bahn ve Berlin Senatosu resmî bültenleri."
                            else
                                "Offizielle Meldungen von Polizei, Feuerwehr, BVG, S-Bahn & Senat.",
                            fontSize = 11.5.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1
                        )
                    }
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = BerlinRed,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        // 🗺️ Berlin'de Ne Yapılır? (33 Klasik Gezi & Cazibe Noktası)
        item {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = BerlinBlue.copy(alpha = 0.08f),
                border = androidx.compose.foundation.BorderStroke(1.dp, BerlinBlue.copy(alpha = 0.35f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .clickable { onNavigate(AppScreen.BERLIN_TIPS) }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = BerlinBlue,
                        modifier = Modifier.size(36.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(imageVector = Icons.Default.Explore, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "BERLİN'DE NE YAPILIR?" else "WAS TUN IN BERLIN?",
                                color = BerlinBlue,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.5.sp
                            )
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = Color(0xFF34A853).copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = "33 NOKTA",
                                    color = Color(0xFF34A853),
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "Tarihi simgeler, manzaralar, müzeler ve parklar (Google Maps Tek Tık)."
                            else
                                "Wahrzeichen, Aussichten, Museen & Parks (Google Maps 1-Klick).",
                            fontSize = 11.5.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1
                        )
                    }
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = BerlinBlue,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        // 22 Kieze Quick Selector Row with real mini photos
        item {
            Column(modifier = Modifier.padding(top = 10.dp, bottom = 4.dp)) {
                Text(
                    text = when (language) {
                        AppLanguage.TURKISH -> "22 Berlin Kiezi (Hızlı Seçim)"
                        AppLanguage.ENGLISH -> "22 Berlin Kieze (Quick Select)"
                        else -> "Die 22 Berliner Kieze (Schnellauswahl)"
                    },
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp)
                )
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(SampleData.kieze) { kiez ->
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.clickable { onKiezClick(kiez.id) }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clip(CircleShape)
                                ) {
                                    Image(
                                        painter = painterResource(id = KiezPhotoHelper.getKiezDrawable(kiez.id)),
                                        contentDescription = kiez.name,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                Text(
                                    text = kiez.name,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }

        // 8 Quick Category Buttons (Grid of 2 rows of 4)
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                // Row 1
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    quickActions.take(4).forEach { action ->
                        QuickCategoryButton(
                            title = when (language) {
                                AppLanguage.TURKISH -> action.titleTr
                                AppLanguage.ENGLISH -> action.titleEn
                                else -> action.titleDe
                            },
                            icon = action.icon,
                            tint = action.color,
                            onClick = { onNavigate(action.screen) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Row 2
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    quickActions.drop(4).take(4).forEach { action ->
                        QuickCategoryButton(
                            title = when (language) {
                                AppLanguage.TURKISH -> action.titleTr
                                AppLanguage.ENGLISH -> action.titleEn
                                else -> action.titleDe
                            },
                            icon = action.icon,
                            tint = action.color,
                            onClick = { onNavigate(action.screen) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        // Section: Beliebte Kieze (Popular Neighborhoods)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = when (language) {
                        AppLanguage.TURKISH -> "Popüler Kiezler"
                        AppLanguage.ENGLISH -> "Popular Kieze"
                        else -> "Beliebte Kieze"
                    },
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = when (language) {
                        AppLanguage.TURKISH -> "Tümünü gör (21 Kiez)"
                        AppLanguage.ENGLISH -> "View all (21 Kieze)"
                        else -> "Mehr anzeigen (21 Kieze)"
                    },
                    color = BerlinRed,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clickable { onNavigate(AppScreen.KIEZE) }
                )
            }

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(SampleData.kieze) { kiez ->
                    KiezCardCompact(
                        kiez = kiez,
                        onClick = { onKiezClick(kiez.id) }
                    )
                }
            }
        }

        // Section: Top Deals & Angebote Preview
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(
                        imageVector = Icons.Default.LocalOffer,
                        contentDescription = null,
                        tint = BerlinRed,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = when (language) {
                            AppLanguage.TURKISH -> "Kiez Fırsatları & İndirimler"
                            AppLanguage.ENGLISH -> "Kiez Deals & Offers"
                            else -> "Kiez Deals & Angebote"
                        },
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }
                Text(
                    text = when (language) {
                        AppLanguage.TURKISH -> "Tümü"
                        AppLanguage.ENGLISH -> "All deals"
                        else -> "Alle Deals"
                    },
                    color = BerlinRed,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clickable { onNavigate(AppScreen.DEALS) }
                )
            }

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(SampleData.deals) { deal ->
                    Card(
                        modifier = Modifier
                            .width(220.dp)
                            .clickable { onNavigate(AppScreen.DEALS) },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = BerlinRed,
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = deal.discountBadge,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                                Text(
                                    text = deal.category,
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = deal.businessName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = deal.title,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = deal.validUntil,
                                fontSize = 10.sp,
                                color = Color.Gray
                            )
                        }
                    }
                }
            }
        }

        // B2B Promo Banner (Recreation of Image 4: "Für Unternehmen")
        item {
            Spacer(modifier = Modifier.height(20.dp))
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clickable { onNavigate(AppScreen.BUSINESS_PORTAL) },
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = BerlinRedLight
                ),
                elevation = CardDefaults.cardElevation(3.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Surface(
                            color = BerlinRed,
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "B2B WERBUNG",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = when (language) {
                                AppLanguage.TURKISH -> "İşletmenizi tüm Berlin'de görünür yapın!"
                                AppLanguage.ENGLISH -> "Make your business visible across Berlin!"
                                else -> "Ihr Unternehmen in ganz Berlin sichtbar!"
                            },
                            fontWeight = FontWeight.Black,
                            fontSize = 16.sp,
                            color = BerlinCharcoal
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Dein Kiez. Deine Kunden. Dein Erfolg. Ab 19,90 € / Monat",
                            fontSize = 12.sp,
                            color = BerlinRedDark,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Surface(
                        shape = CircleShape,
                        color = BerlinRed,
                        modifier = Modifier.size(42.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = "Werbepakete",
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun QuickCategoryButton(
    title: String,
    icon: ImageVector,
    tint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clickable { onClick() }
            .padding(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = tint.copy(alpha = 0.12f),
            modifier = Modifier.size(54.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = tint,
                    modifier = Modifier.size(26.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = title,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onBackground,
            maxLines = 1
        )
    }
}

@Composable
fun KiezCardCompact(
    kiez: Kiez,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(170.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(3.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp)
            ) {
                RealKiezImage(
                    drawableId = KiezPhotoHelper.getKiezDrawable(kiez.id),
                    contentDescription = kiez.name,
                    showBottomGradient = true,
                    modifier = Modifier.fillMaxSize()
                )
                // Kiez Name overlay
                Surface(
                    color = Color.Black.copy(alpha = 0.55f),
                    shape = RoundedCornerShape(bottomEnd = 10.dp),
                    modifier = Modifier.align(Alignment.TopStart)
                ) {
                    Text(
                        text = kiez.name.uppercase(),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
                Surface(
                    color = BerlinRed,
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(6.dp)
                ) {
                    Text(
                        text = kiez.rentIndex,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            Column(modifier = Modifier.padding(10.dp)) {
                Text(
                    text = kiez.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Text(
                    text = kiez.subtitle,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    kiez.tags.take(2).forEach { tag ->
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Text(
                                text = tag,
                                fontSize = 9.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

