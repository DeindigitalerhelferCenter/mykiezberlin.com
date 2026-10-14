package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AppLanguage
import com.example.data.model.KiezStory
import com.example.data.model.LocalBusiness
import com.example.data.repository.SampleData
import com.example.ui.components.*
import com.example.ui.theme.*

@Composable
fun BusinessesScreen(
    language: AppLanguage,
    activeCategory: String,
    onCategoryChange: (String) -> Unit,
    activeKiezFilter: String = "Alle",
    onKiezFilterChange: (String) -> Unit = {},
    selectedBusiness: LocalBusiness?,
    onSelectBusiness: (LocalBusiness) -> Unit,
    onCloseDetail: () -> Unit,
    favoriteIds: Set<String>,
    onToggleFavorite: (String) -> Unit,
    searchQuery: String = "",
    customBusinesses: List<LocalBusiness> = emptyList(),
    onAddBusiness: (LocalBusiness) -> Unit = {},
    stories: List<KiezStory> = SampleData.stories,
    onStoryClick: (KiezStory) -> Unit = {},
    onAddStoryClick: () -> Unit = {},
    viewMode: String = "card", // "card", "list", "map"
    onViewModeChange: (String) -> Unit = {},
    onResetFilters: () -> Unit = {},
    showAddBusinessDialog: Boolean = false,
    onOpenAddBusiness: () -> Unit = {},
    onCloseAddBusiness: () -> Unit = {}
) {
    val context = LocalContext.current
    var localAddBusinessModal by remember { mutableStateOf(false) }

    // Combine standard and custom businesses with smart bilingual filtering
    val allBusinesses = remember(customBusinesses, activeCategory, activeKiezFilter, searchQuery) {
        val merged = customBusinesses + SampleData.businesses
        merged.filter { biz ->
            val matchCat = matchCategoryHelper(biz.category, activeCategory)
            val matchKiez = matchKiezHelper(biz.kiezName, activeKiezFilter)
            val matchSearch = searchQuery.isBlank() ||
                    biz.name.contains(searchQuery, ignoreCase = true) ||
                    biz.address.contains(searchQuery, ignoreCase = true) ||
                    biz.category.contains(searchQuery, ignoreCase = true) ||
                    biz.kiezName.contains(searchQuery, ignoreCase = true)
            matchCat && matchKiez && matchSearch
        }
    }

    val isFilterActive = (activeKiezFilter != "Alle" && activeKiezFilter != "Ganz Berlin" && activeKiezFilter != "Tüm Berlin") ||
            (activeCategory != "Alle" && activeCategory != "Hepsi" && activeCategory != "Alles") ||
            searchQuery.isNotBlank()

    val filterLabel = remember(activeKiezFilter, activeCategory) {
        if (activeKiezFilter != "Alle" && activeKiezFilter != "Ganz Berlin" && activeKiezFilter != "Tüm Berlin") {
            activeKiezFilter
        } else {
            activeCategory
        }
    }

    Scaffold { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (viewMode) {
                "map" -> {
                    // 1. HARİTA MODU: Tam sayfa kaydırılabilir (Sponsor ve hikâyeler yukarı kaydırılabilir!)
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 90.dp)
                    ) {
                        item(key = "stories") {
                            KiezStoriesBar(
                                stories = stories,
                                language = language,
                                onStoryClick = onStoryClick,
                                onAddStoryClick = onAddStoryClick
                            )
                        }
                        item(key = "sponsors") {
                            SponsorBannerComponent(
                                language = language,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                        item(key = "control_bar") {
                            BusinessesControlBar(
                                businessCount = allBusinesses.size,
                                isFilterActive = isFilterActive,
                                filterLabel = filterLabel,
                                onResetFilters = onResetFilters,
                                viewMode = viewMode,
                                onViewModeChange = onViewModeChange,
                                language = language
                            )
                        }
                        item(key = "map_view") {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(580.dp)
                                    .padding(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                KiezMapComponent(
                                    kiezName = activeKiezFilter,
                                    language = language,
                                    onSpotClick = { spotId ->
                                        allBusinesses.firstOrNull { it.id == spotId }?.let { onSelectBusiness(it) }
                                    }
                                )
                            }
                        }
                    }
                }

                "list" -> {
                    // 2. LİSTE MODU: Hikâyeler & Sponsorlar liste ile birlikte yukarı kayar, tam ekran görünürlük!
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 90.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item(key = "stories") {
                            KiezStoriesBar(
                                stories = stories,
                                language = language,
                                onStoryClick = onStoryClick,
                                onAddStoryClick = onAddStoryClick
                            )
                        }
                        item(key = "sponsors") {
                            SponsorBannerComponent(
                                language = language,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                        item(key = "control_bar") {
                            BusinessesControlBar(
                                businessCount = allBusinesses.size,
                                isFilterActive = isFilterActive,
                                filterLabel = filterLabel,
                                onResetFilters = onResetFilters,
                                viewMode = viewMode,
                                onViewModeChange = onViewModeChange,
                                language = language
                            )
                        }

                        if (allBusinesses.isEmpty()) {
                            item(key = "empty") {
                                EmptyBusinessesView(language = language, onResetFilters = onResetFilters)
                            }
                        } else {
                            items(allBusinesses, key = { it.id }) { business ->
                                val isFav = favoriteIds.contains(business.id)
                                Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                                    CompactBusinessListItem(
                                        business = business,
                                        isFav = isFav,
                                        language = language,
                                        onSelect = { onSelectBusiness(business) },
                                        onToggleFav = { onToggleFavorite(business.id) },
                                        onCall = {
                                            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${business.phone}"))
                                            context.startActivity(dialIntent)
                                        },
                                        onWhatsApp = {
                                            val waNumber = business.whatsapp.replace("+", "").replace(" ", "")
                                            val waIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$waNumber?text=Hallo,%20ich%20habe%20Ihren%20Betrieb%20auf%20Berliner%20Kiez-Check%20gefunden."))
                                            context.startActivity(waIntent)
                                        }
                                    )
                                }
                            }
                        }
                    }
                }

                else -> {
                    // 3. KART MODU: Hikâyeler & Sponsorlar kartlar ile birlikte yukarı kayar, kartlar ferahça incelenir!
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 90.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        item(key = "stories") {
                            KiezStoriesBar(
                                stories = stories,
                                language = language,
                                onStoryClick = onStoryClick,
                                onAddStoryClick = onAddStoryClick
                            )
                        }
                        item(key = "sponsors") {
                            SponsorBannerComponent(
                                language = language,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                        item(key = "control_bar") {
                            BusinessesControlBar(
                                businessCount = allBusinesses.size,
                                isFilterActive = isFilterActive,
                                filterLabel = filterLabel,
                                onResetFilters = onResetFilters,
                                viewMode = viewMode,
                                onViewModeChange = onViewModeChange,
                                language = language
                            )
                        }

                        if (allBusinesses.isEmpty()) {
                            item(key = "empty") {
                                EmptyBusinessesView(language = language, onResetFilters = onResetFilters)
                            }
                        } else {
                            items(allBusinesses, key = { it.id }) { business ->
                                val isFav = favoriteIds.contains(business.id)
                                Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                                    CardBusinessItem(
                                        business = business,
                                        isFav = isFav,
                                        language = language,
                                        onSelect = { onSelectBusiness(business) },
                                        onToggleFav = { onToggleFavorite(business.id) },
                                        onCall = {
                                            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${business.phone}"))
                                            context.startActivity(dialIntent)
                                        },
                                        onWhatsApp = {
                                            val waNumber = business.whatsapp.replace("+", "").replace(" ", "")
                                            val waIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$waNumber?text=Hallo,%20ich%20habe%20Ihren%20Betrieb%20auf%20Berliner%20Kiez-Check%20gefunden."))
                                            context.startActivity(waIntent)
                                        },
                                        onRoute = {
                                            val mapIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=${Uri.encode(business.name + " " + business.address)}"))
                                            context.startActivity(mapIntent)
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Detail Dialog
    if (selectedBusiness != null) {
        val biz = selectedBusiness
        val isFav = favoriteIds.contains(biz.id)
        Dialog(onDismissRequest = onCloseDetail) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .clip(RoundedCornerShape(14.dp))
                    ) {
                        RealKiezImage(
                            drawableId = KiezPhotoHelper.getKiezDrawable(biz.kiezName),
                            contentDescription = biz.name,
                            showBottomGradient = true,
                            modifier = Modifier.fillMaxSize()
                        )
                        IconButton(
                            onClick = onCloseDetail,
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(4.dp)
                        ) {
                            Surface(shape = CircleShape, color = Color.Black.copy(alpha = 0.5f), modifier = Modifier.size(28.dp)) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = biz.name, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        IconButton(onClick = { onToggleFavorite(biz.id) }, modifier = Modifier.size(32.dp)) {
                            Icon(
                                imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                contentDescription = null,
                                tint = if (isFav) BerlinRed else Color.Gray
                            )
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Surface(shape = RoundedCornerShape(6.dp), color = BerlinRedLight) {
                            Text(text = biz.category, fontSize = 11.sp, color = BerlinRed, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                        }
                        Surface(shape = RoundedCornerShape(6.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
                            Text(text = "📍 ${biz.kiezName}", fontSize = 11.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                        }
                    }

                    Text(text = biz.address, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(text = biz.description, fontSize = 12.5.sp)

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                val waIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/${biz.whatsapp.replace("+", "").replace(" ", "")}"))
                                context.startActivity(waIntent)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinGreen)
                        ) {
                            Text("WhatsApp", fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = {
                                val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${biz.phone}"))
                                context.startActivity(dialIntent)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(if (language == AppLanguage.TURKISH) "Ara" else "Anrufen")
                        }
                    }
                }
            }
        }
    }

    // Free Business Registration Modal (Betrieb kostenlos eintragen)
    if (showAddBusinessDialog || localAddBusinessModal) {
        var nameInput by remember { mutableStateOf("") }
        var kiezInput by remember { mutableStateOf("Kreuzberg") }
        var catInput by remember { mutableStateOf("Café") }
        var addressInput by remember { mutableStateOf("") }
        var descInput by remember { mutableStateOf("") }
        var phoneInput by remember { mutableStateOf("") }
        var waInput by remember { mutableStateOf("") }
        var emailInput by remember { mutableStateOf("") }

        val dismissAction = {
            localAddBusinessModal = false
            onCloseAddBusiness()
        }

        Dialog(onDismissRequest = dismissAction) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp),
                modifier = Modifier.fillMaxWidth().padding(8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "İşletmeni Ücretsiz Ekle" else "Betrieb kostenlos eintragen",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        IconButton(onClick = dismissAction) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    OutlinedTextField(
                        value = nameInput,
                        onValueChange = { nameInput = it },
                        label = { Text(if (language == AppLanguage.TURKISH) "İşletme Adı" else "Betriebsname") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = addressInput,
                        onValueChange = { addressInput = it },
                        label = { Text(if (language == AppLanguage.TURKISH) "Adres" else "Adresse") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = waInput,
                        onValueChange = { waInput = it },
                        label = { Text("WhatsApp") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Button(
                        onClick = {
                            if (nameInput.isNotBlank() && addressInput.isNotBlank()) {
                                val newBiz = LocalBusiness(
                                    id = "biz_${System.currentTimeMillis()}",
                                    name = nameInput,
                                    category = catInput,
                                    rating = 5.0,
                                    reviewsCount = 1,
                                    kiezName = kiezInput,
                                    distance = "100 m",
                                    address = addressInput,
                                    imageUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
                                    phone = if (phoneInput.isBlank()) "+49 30 123456" else phoneInput,
                                    whatsapp = if (waInput.isBlank()) "+4915126509586" else waInput,
                                    description = if (descInput.isBlank()) "Neuer Betrieb im Kiez." else descInput
                                )
                                onAddBusiness(newBiz)
                                Toast.makeText(context, if (language == AppLanguage.TURKISH) "İşletmeniz eklendi!" else "Betrieb eingetragen!", Toast.LENGTH_SHORT).show()
                                dismissAction()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(if (language == AppLanguage.TURKISH) "Kaydı Tamamla" else "Eintragen", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// BÜYÜK GÖRSEL KART MODU (Card Mode)
@Composable
private fun CardBusinessItem(
    business: LocalBusiness,
    isFav: Boolean,
    language: AppLanguage,
    onSelect: () -> Unit,
    onToggleFav: () -> Unit,
    onCall: () -> Unit,
    onWhatsApp: () -> Unit,
    onRoute: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(3.dp)
    ) {
        Column {
            // Header Image with Badges
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(145.dp)
            ) {
                RealKiezImage(
                    drawableId = KiezPhotoHelper.getKiezDrawable(business.kiezName),
                    contentDescription = business.name,
                    showBottomGradient = true,
                    modifier = Modifier.fillMaxSize()
                )

                // Top Left Badges: Sponsored & Coupon
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (business.isSponsored) {
                        Surface(color = BerlinYellow, shape = RoundedCornerShape(6.dp)) {
                            Text(
                                text = "Anzeige",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Black,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                    if (business.hasCoupon) {
                        Surface(color = BerlinRed, shape = RoundedCornerShape(6.dp)) {
                            Text(
                                text = business.couponText.ifBlank { "Kupon" },
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                // Top Right: Favorite Button
                IconButton(
                    onClick = onToggleFav,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(6.dp)
                ) {
                    Surface(
                        shape = CircleShape,
                        color = Color.Black.copy(alpha = 0.45f),
                        modifier = Modifier.size(34.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                contentDescription = "Favorit",
                                tint = if (isFav) BerlinRed else Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                // Bottom Left: Rating & Distance Badge
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color.Black.copy(alpha = 0.65f),
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(10.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Star, contentDescription = null, tint = BerlinYellow, modifier = Modifier.size(13.dp))
                        Text(
                            text = "${business.rating} (${business.reviewsCount})",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(text = "·", color = Color.LightGray, fontSize = 10.sp)
                        Text(text = business.distance, fontSize = 11.sp, color = Color.White)
                    }
                }
            }

            // Card Body Info
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = business.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1
                    )
                    Surface(shape = RoundedCornerShape(6.dp), color = BerlinRedLight) {
                        Text(
                            text = business.category,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = BerlinRed,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(13.dp))
                    Text(
                        text = "${business.kiezName} · ${business.address}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }

                Text(
                    text = business.description,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    lineHeight = 16.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Actions: WhatsApp, Call, Route
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onWhatsApp,
                        modifier = Modifier.weight(1.2f),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BerlinGreen),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Chat, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("WhatsApp", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = onCall,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(13.dp))
                        Spacer(modifier = Modifier.width(3.dp))
                        Text(if (language == AppLanguage.TURKISH) "Ara" else "Anrufen", fontSize = 11.sp)
                    }

                    OutlinedButton(
                        onClick = onRoute,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Directions, contentDescription = null, modifier = Modifier.size(13.dp))
                        Spacer(modifier = Modifier.width(3.dp))
                        Text(if (language == AppLanguage.TURKISH) "Yol" else "Route", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

// KOMPAKT LİSTE MODU (Compact List View)
@Composable
private fun CompactBusinessListItem(
    business: LocalBusiness,
    isFav: Boolean,
    language: AppLanguage,
    onSelect: () -> Unit,
    onToggleFav: () -> Unit,
    onCall: () -> Unit,
    onWhatsApp: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(1.5.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Thumbnail
            Box(
                modifier = Modifier
                    .size(62.dp)
                    .clip(RoundedCornerShape(10.dp))
            ) {
                RealKiezImage(
                    drawableId = KiezPhotoHelper.getKiezDrawable(business.kiezName),
                    contentDescription = business.name,
                    showBottomGradient = false,
                    modifier = Modifier.fillMaxSize()
                )
            }

            // Info Column
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = business.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    if (business.isSponsored) {
                        Surface(color = BerlinYellow, shape = RoundedCornerShape(4.dp)) {
                            Text(text = "Ad", fontSize = 8.5.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp))
                        }
                    }
                }

                Text(
                    text = "${business.category} · ${business.kiezName}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )

                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(imageVector = Icons.Default.Star, contentDescription = null, tint = BerlinYellow, modifier = Modifier.size(12.dp))
                    Text(text = "${business.rating}", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    Text(text = "·", color = Color.Gray, fontSize = 10.sp)
                    Text(text = business.distance, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Quick Actions: WhatsApp & Call & Favorite
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                IconButton(onClick = onWhatsApp, modifier = Modifier.size(32.dp)) {
                    Surface(shape = CircleShape, color = BerlinGreen, modifier = Modifier.size(28.dp)) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(imageVector = Icons.Default.Chat, contentDescription = "WhatsApp", tint = Color.White, modifier = Modifier.size(15.dp))
                        }
                    }
                }

                IconButton(onClick = onCall, modifier = Modifier.size(32.dp)) {
                    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.size(28.dp)) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(imageVector = Icons.Default.Phone, contentDescription = "Ara", tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(15.dp))
                        }
                    }
                }

                IconButton(onClick = onToggleFav, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Fav",
                        tint = if (isFav) BerlinRed else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyBusinessesView(language: AppLanguage, onResetFilters: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.size(56.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(imageVector = Icons.Default.SearchOff, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(28.dp))
                }
            }
            Text(
                text = if (language == AppLanguage.TURKISH) "Seçili filtreye uygun işletme bulunamadı" else "Keine passenden Betriebe gefunden",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
            Text(
                text = if (language == AppLanguage.TURKISH) "Farklı bir mahalle veya kategori seçebilir ya da filtreleri sıfırlayabilirsiniz." else "Bitte wähle einen anderen Kiez oder setze die Filter zurück.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            Button(
                onClick = onResetFilters,
                colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(if (language == AppLanguage.TURKISH) "Tüm Berlin'i Göster" else "Filter zurücksetzen", color = Color.White)
            }
        }
    }
}

// BILINGUAL CATEGORY & KIEZ NORMALIZATION HELPERS
private fun matchCategoryHelper(bizCategory: String, activeCategory: String): Boolean {
    if (activeCategory == "Alle" || activeCategory == "Hepsi" || activeCategory == "Alles" || activeCategory.isBlank()) return true
    val b = bizCategory.lowercase()
    val a = activeCategory.lowercase()
    if (b.contains(a) || a.contains(b)) return true

    if ((a.contains("kafe") || a.contains("cafe") || a.contains("kahvalt") || a.contains("frühstück")) &&
        (b.contains("caf") || b.contains("kafe") || b.contains("frühstück") || b.contains("kahvalt") || b.contains("bäckerei"))) return true

    if ((a.contains("restoran") || a.contains("restaurant") || a.contains("gastro") || a.contains("essen")) &&
        (b.contains("restaur") || b.contains("gastro") || b.contains("essen") || b.contains("imbiss") || b.contains("döner") || b.contains("kulinarik"))) return true

    if ((a.contains("döner") || a.contains("büfe") || a.contains("imbiss")) &&
        (b.contains("döner") || b.contains("imbiss") || b.contains("kebap") || b.contains("burger") || b.contains("grill"))) return true

    if ((a.contains("fırın") || a.contains("pastane") || a.contains("bäckerei") || a.contains("konditorei")) &&
        (b.contains("bäck") || b.contains("brot") || b.contains("fırın") || b.contains("kondit") || b.contains("torte"))) return true

    if ((a.contains("kuaför") || a.contains("berber") || a.contains("friseur") || a.contains("barber")) &&
        (b.contains("friseur") || b.contains("barber") || b.contains("haare") || b.contains("kuaför"))) return true

    if ((a.contains("market") || a.contains("alışveriş") || a.contains("supermarkt") || a.contains("shopping") || a.contains("giyim") || a.contains("mode")) &&
        (b.contains("market") || b.contains("shop") || b.contains("handel") || b.contains("einkauf") || b.contains("mode") || b.contains("boutique"))) return true

    if ((a.contains("fitness") || a.contains("spor") || a.contains("gym")) &&
        (b.contains("fit") || b.contains("sport") || b.contains("gym"))) return true

    if ((a.contains("sağlık") || a.contains("eczane") || a.contains("gesundheit") || a.contains("apotheke")) &&
        (b.contains("apotheke") || b.contains("gesund") || b.contains("pharma"))) return true

    if ((a.contains("hizmet") || a.contains("dienstleistung") || a.contains("danışmanlık") || a.contains("beratung") || a.contains("steuer")) &&
        (b.contains("dienst") || b.contains("berat") || b.contains("steuer") || b.contains("recht") || b.contains("service"))) return true

    return false
}

private fun matchKiezHelper(bizKiez: String, activeKiez: String): Boolean {
    if (activeKiez == "Alle" || activeKiez == "Ganz Berlin" || activeKiez == "Tüm Berlin" || activeKiez.isBlank()) return true
    val b = bizKiez.lowercase()
    val a = activeKiez.lowercase()
    return b.contains(a) || a.contains(b)
}

@Composable
fun BusinessesControlBar(
    businessCount: Int,
    isFilterActive: Boolean,
    filterLabel: String,
    onResetFilters: () -> Unit,
    viewMode: String,
    onViewModeChange: (String) -> Unit,
    language: AppLanguage
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 1.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Sol Taraf: Kayıt sayısı ve aktif filtre rozeti
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.weight(1f)
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = BerlinRed.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "$businessCount ${if (language == AppLanguage.TURKISH) "Kayıt" else "Betriebe"}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = BerlinRed,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }

                if (isFilterActive) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier.clickable { onResetFilters() }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Text(
                                text = filterLabel,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1
                            )
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Temizle",
                                modifier = Modifier.size(12.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Sağ Taraf: Kart / Liste / Harita Seçici Butonları
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surfaceVariant
            ) {
                Row(modifier = Modifier.padding(2.dp)) {
                    // Kart Modu
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = if (viewMode == "card") BerlinRed else Color.Transparent,
                        modifier = Modifier
                            .clickable { onViewModeChange("card") }
                            .testTag("mode_card_button")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ViewAgenda,
                                contentDescription = null,
                                tint = if (viewMode == "card") Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Kart" else "Karte",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (viewMode == "card") Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Liste Modu
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = if (viewMode == "list") BerlinRed else Color.Transparent,
                        modifier = Modifier
                            .clickable { onViewModeChange("list") }
                            .testTag("mode_list_button")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ViewList,
                                contentDescription = null,
                                tint = if (viewMode == "list") Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Liste" else "Liste",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (viewMode == "list") Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Harita Modu
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = if (viewMode == "map") BerlinRed else Color.Transparent,
                        modifier = Modifier
                            .clickable { onViewModeChange("map") }
                            .testTag("mode_map_button")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Map,
                                contentDescription = null,
                                tint = if (viewMode == "map") Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Harita" else "Map",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (viewMode == "map") Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}
