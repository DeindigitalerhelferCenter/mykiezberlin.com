package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.example.data.model.BerlinTip
import com.example.data.repository.BerlinTipsRepository
import com.example.ui.theme.*
import com.example.util.MapHelper

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BerlinTipsScreen(
    language: AppLanguage,
    onBack: () -> Unit
) {
    BackHandler { onBack() }
    val context = LocalContext.current

    var selectedFilter by remember { mutableStateOf("all") }
    var searchQuery by remember { mutableStateOf("") }

    val allTips = remember { BerlinTipsRepository.tips }

    val filteredTips = remember(selectedFilter, searchQuery) {
        allTips.filter { tip ->
            val matchesFilter = when (selectedFilter) {
                "all" -> true
                "free" -> tip.isFree
                "culture" -> tip.categories.contains("culture")
                "view" -> tip.categories.contains("view")
                "museum" -> tip.categories.contains("museum")
                "park" -> tip.categories.contains("park") || tip.address.contains("Park", ignoreCase = true) || tip.name.contains("Garten", ignoreCase = true)
                else -> true
            }

            val matchesSearch = searchQuery.isBlank() ||
                    tip.name.contains(searchQuery, ignoreCase = true) ||
                    tip.address.contains(searchQuery, ignoreCase = true) ||
                    tip.descDe.contains(searchQuery, ignoreCase = true) ||
                    tip.descTr.contains(searchQuery, ignoreCase = true) ||
                    tip.kiezId.contains(searchQuery, ignoreCase = true)

            matchesFilter && matchesSearch
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = BerlinRed,
                            modifier = Modifier.size(10.dp)
                        ) {}
                        Column {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Berlin'de Ne Yapılır?" else "Was tun in Berlin?",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) "33 Berlin Klasiği · Google Maps Tek Tık" else "33 Berliner Highlights · Google Maps Direkt",
                                fontSize = 11.5.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Zurück")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(bottom = 90.dp)
        ) {
            // Hero Intro Card
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(2.dp),
                    border = BorderStroke(1.dp, BerlinRed.copy(alpha = 0.2f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = BerlinRedLight,
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.Explore,
                                        contentDescription = null,
                                        tint = BerlinRed,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Column {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Berlin Gezi & Cazibe Rehberi" else "Berliner Highlights & Tipps",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "33 Popüler Nokta · Tek Tıkla Google Maps" else "33 Sehenswürdigkeiten · Direkt per 1-Klick",
                                    fontSize = 11.5.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "Berlin'in en ünlü simgeleri, tarihi noktaları ve gizli parkları. Herhangi bir karta tıkladığınızda doğrudan Google Maps'te açılır."
                            else
                                "Die bekanntesten Sehenswürdigkeiten, historischen Orte und geheimen Parks Berlins. Mit einem Klick direkt auf Google Maps öffnen.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 16.sp
                        )
                    }
                }
            }

            // Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    placeholder = {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Gezilecek yer veya kiez ara..." else "Ort oder Kiez suchen...",
                            fontSize = 13.sp
                        )
                    },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotBlank()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Löschen")
                            }
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
            }

            // Category Filter Pills
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val filters = listOf(
                        "all" to (if (language == AppLanguage.TURKISH) "Tümü (33)" else "Alle (33)"),
                        "free" to (if (language == AppLanguage.TURKISH) "Ücretsiz Giriş" else "Kostenlos"),
                        "culture" to (if (language == AppLanguage.TURKISH) "Tarih & Kültür" else "Kultur"),
                        "view" to (if (language == AppLanguage.TURKISH) "Manzara" else "Aussicht"),
                        "museum" to (if (language == AppLanguage.TURKISH) "Müzeler" else "Museen"),
                        "park" to (if (language == AppLanguage.TURKISH) "Parklar" else "Parks & Natur")
                    )

                    filters.forEach { (key, label) ->
                        val isSelected = selectedFilter == key
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = if (isSelected) BerlinRed else MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.clickable { selectedFilter = key }
                        ) {
                            Text(
                                text = label,
                                fontSize = 11.5.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }

            // Spots Count Header
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "${filteredTips.size} Berlin Noktası" else "${filteredTips.size} Berliner Orte",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Google Maps Tek Tık" else "Google Maps 1-Klick",
                        fontSize = 11.sp,
                        color = BerlinGreen,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // List of Tips / Attractions
            items(filteredTips, key = { it.id }) { tip ->
                TipCardItem(
                    tip = tip,
                    language = language,
                    onOpenMap = {
                        MapHelper.openGoogleMaps(context, "${tip.name} Berlin", tip.lat, tip.lng)
                    },
                    onOpenDirections = {
                        MapHelper.openDirections(context, "${tip.name} Berlin", tip.lat, tip.lng)
                    }
                )
            }
        }
    }
}

@Composable
fun TipCardItem(
    tip: BerlinTip,
    language: AppLanguage,
    onOpenMap: () -> Unit,
    onOpenDirections: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onOpenMap() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row: Kiez Badge + Free Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = BerlinRedLight
                    ) {
                        Text(
                            text = tip.kiezId.replace("-", " ").uppercase(),
                            color = BerlinRed,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }

                    if (tip.isFree) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = BerlinGreenLight
                        ) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "ÜCRETSİZ" else "EINTRITT FREI",
                                color = BerlinGreen,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                // Coordinates Tag
                Text(
                    text = "${tip.lat}, ${tip.lng}",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Spot Title
            Text(
                text = tip.name,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Description
            Text(
                text = tip.localizedDesc(language),
                fontSize = 12.sp,
                lineHeight = 17.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Address Row
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Place,
                    contentDescription = null,
                    tint = BerlinRed,
                    modifier = Modifier.size(13.dp)
                )
                Text(
                    text = tip.address,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Buttons: Google Maps (Tek Tık) & Route
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onOpenMap,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF34A853))
                ) {
                    Icon(
                        imageVector = Icons.Default.Map,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Google Maps",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                OutlinedButton(
                    onClick = onOpenDirections,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Directions,
                        contentDescription = null,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Yol Tarifi" else "Route",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
