package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AppLanguage
import com.example.data.model.FoodSpot
import com.example.data.model.KiezEvent
import com.example.data.model.LocalBusiness
import com.example.data.repository.SampleData
import com.example.ui.components.KiezPhotoHelper
import com.example.ui.components.RealKiezImage
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinYellow

@Composable
fun FavoritesScreen(
    language: AppLanguage,
    activeTypeFilter: String,
    onFilterChange: (String) -> Unit,
    favoriteIds: Set<String>,
    onToggleFavorite: (String) -> Unit,
    onKiezClick: (String) -> Unit
) {
    val context = LocalContext.current
    val typeFilters = listOf("Alle", "Gastronomie", "Events", "Kieze", "Unternehmen")

    val favoriteSpots = remember(favoriteIds) { SampleData.foodSpots.filter { favoriteIds.contains(it.id) } }
    val favoriteEvents = remember(favoriteIds) { SampleData.events.filter { favoriteIds.contains(it.id) } }
    val favoriteKieze = remember(favoriteIds) { SampleData.kieze.filter { favoriteIds.contains(it.id) } }
    val favoriteBusinesses = remember(favoriteIds) { SampleData.businesses.filter { favoriteIds.contains(it.id) } }

    val totalCount = favoriteSpots.size + favoriteEvents.size + favoriteKieze.size + favoriteBusinesses.size

    var selectedSpot by remember { mutableStateOf<FoodSpot?>(null) }
    var selectedEvent by remember { mutableStateOf<KiezEvent?>(null) }
    var selectedBusiness by remember { mutableStateOf<LocalBusiness?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Type filter chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            typeFilters.forEach { filter ->
                val isSelected = activeTypeFilter == filter
                FilterChip(
                    selected = isSelected,
                    onClick = { onFilterChange(filter) },
                    label = {
                        Text(
                            text = when {
                                language == AppLanguage.TURKISH && filter == "Alle" -> "Tümü"
                                language == AppLanguage.TURKISH && filter == "Gastronomie" -> "Yeme-İçme"
                                language == AppLanguage.TURKISH && filter == "Events" -> "Etkinlikler"
                                language == AppLanguage.TURKISH && filter == "Kieze" -> "Kiezler"
                                language == AppLanguage.TURKISH && filter == "Unternehmen" -> "İşletmeler"
                                else -> filter
                            },
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 12.sp
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BerlinRed,
                        selectedLabelColor = Color.White
                    )
                )
            }
        }

        if (totalCount == 0) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(imageVector = Icons.Default.Favorite, contentDescription = null, tint = Color.LightGray, modifier = Modifier.size(48.dp))
                    Text(
                        text = if (language == AppLanguage.TURKISH)
                            "Henüz favori eklemediniz.\nKalp simgesine dokunarak mekan, kiez ve etkinlik kaydedebilirsiniz."
                        else
                            "Noch keine Favoriten gespeichert.\nTippe auf das Herz-Symbol, um Orte zu speichern.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 14.sp
                    )
                }
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 80.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Gastronomie
                if (activeTypeFilter == "Alle" || activeTypeFilter == "Gastronomie") {
                    items(favoriteSpots) { spot ->
                        FoodSpotCard(
                            spot = spot,
                            isFavorite = true,
                            onToggleFavorite = { onToggleFavorite(spot.id) },
                            onClick = { selectedSpot = spot }
                        )
                    }
                }

                // Events
                if (activeTypeFilter == "Alle" || activeTypeFilter == "Events") {
                    items(favoriteEvents) { event ->
                        EventCard(
                            event = event,
                            isFavorite = true,
                            onToggleFavorite = { onToggleFavorite(event.id) },
                            onClick = { selectedEvent = event }
                        )
                    }
                }

                // Kieze
                if (activeTypeFilter == "Alle" || activeTypeFilter == "Kieze") {
                    items(favoriteKieze) { kiez ->
                        KiezListItem(
                            kiez = kiez,
                            onClick = { onKiezClick(kiez.id) }
                        )
                    }
                }

                // Businesses
                if (activeTypeFilter == "Alle" || activeTypeFilter == "Unternehmen") {
                    items(favoriteBusinesses) { biz ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedBusiness = biz },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(60.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                ) {
                                    RealKiezImage(
                                        drawableId = KiezPhotoHelper.getKiezDrawable(biz.kiezName),
                                        contentDescription = biz.name,
                                        showBottomGradient = false,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(biz.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text("${biz.category} · ${biz.kiezName}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                IconButton(onClick = { onToggleFavorite(biz.id) }) {
                                    Icon(imageVector = Icons.Default.Favorite, contentDescription = null, tint = BerlinRed)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Detail Dialog for Favorite Food Spot
    selectedSpot?.let { spot ->
        Dialog(onDismissRequest = { selectedSpot = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(20.dp)) {
                    Box(modifier = Modifier.fillMaxWidth().height(160.dp).clip(RoundedCornerShape(14.dp))) {
                        RealKiezImage(
                            drawableId = KiezPhotoHelper.getFoodDrawable(spot.id),
                            contentDescription = spot.name,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = spot.name, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(text = "${spot.cuisine} · ${spot.kiezName} · ${spot.address}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${spot.phone}"))
                                context.startActivity(dialIntent)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                        ) {
                            Icon(imageVector = Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Anrufen", fontSize = 12.sp)
                        }
                        OutlinedButton(
                            onClick = {
                                com.example.util.MapHelper.openDirections(context, "${spot.name} Berlin")
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Directions, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Route", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }

    // Detail Dialog for Favorite Event
    selectedEvent?.let { ev ->
        Dialog(onDismissRequest = { selectedEvent = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(20.dp)) {
                    Box(modifier = Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(14.dp))) {
                        RealKiezImage(
                            drawableId = KiezPhotoHelper.getEventDrawable(ev.id),
                            contentDescription = ev.title,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = ev.title, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(text = "${ev.dayLabel} ${ev.dateNum} ${ev.monthLabel} · ${ev.time} · ${ev.kiezName}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = ev.description, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(14.dp))
                    Button(
                        onClick = {
                            com.example.util.MapHelper.openDirections(context, "${ev.locationAddress} Berlin")
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                    ) {
                        Text("Veranstaltungsort anzeigen")
                    }
                }
            }
        }
    }

    // Detail Dialog for Favorite Business
    selectedBusiness?.let { biz ->
        Dialog(onDismissRequest = { selectedBusiness = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(20.dp)) {
                    Text(text = biz.name, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(text = "${biz.category} · ${biz.kiezName} · ${biz.address}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = biz.description, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${biz.phone}"))
                                context.startActivity(dialIntent)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                        ) {
                            Text("Anrufen", fontSize = 12.sp)
                        }
                        OutlinedButton(
                            onClick = {
                                com.example.util.MapHelper.openDirections(context, "${biz.name} ${biz.address} Berlin")
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Route", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
