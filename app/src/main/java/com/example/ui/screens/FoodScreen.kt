package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
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
import com.example.data.repository.SampleData
import com.example.ui.components.KiezPhotoHelper
import com.example.ui.components.RealKiezImage
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinGreenLight
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinRedLight
import com.example.ui.theme.BerlinYellow

@Composable
fun FoodScreen(
    language: AppLanguage,
    activeCuisine: String,
    onSelectCuisine: (String) -> Unit,
    favoriteIds: Set<String>,
    onToggleFavorite: (String) -> Unit
) {
    val context = LocalContext.current
    val cuisines = listOf("Alle", "Türkisch", "Deutsch", "International", "Streetfood", "Café", "Döner", "Pizza")

    var selectedDetailSpot by remember { mutableStateOf<FoodSpot?>(null) }

    val filteredSpots = remember(activeCuisine) {
        if (activeCuisine == "Alle") {
            SampleData.foodSpots
        } else {
            SampleData.foodSpots.filter {
                it.cuisine.contains(activeCuisine, ignoreCase = true) ||
                it.name.contains(activeCuisine, ignoreCase = true)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Cuisines horizontal scroll
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            cuisines.forEach { cuisine ->
                val isSelected = activeCuisine == cuisine
                FilterChip(
                    selected = isSelected,
                    onClick = { onSelectCuisine(cuisine) },
                    label = {
                        Text(
                            text = when {
                                language == AppLanguage.TURKISH && cuisine == "Alle" -> "Tümü"
                                language == AppLanguage.TURKISH && cuisine == "Deutsch" -> "Alman"
                                language == AppLanguage.TURKISH && cuisine == "International" -> "Uluslararası"
                                else -> cuisine
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

        // Food Spots List
        LazyColumn(
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(filteredSpots) { spot ->
                val isFav = favoriteIds.contains(spot.id)
                FoodSpotCard(
                    spot = spot,
                    isFavorite = isFav,
                    onToggleFavorite = { onToggleFavorite(spot.id) },
                    onClick = { selectedDetailSpot = spot }
                )
            }
        }
    }

    // Interactive Food Detail Dialog
    selectedDetailSpot?.let { spot ->
        val isFav = favoriteIds.contains(spot.id)
        Dialog(onDismissRequest = { selectedDetailSpot = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp),
                modifier = Modifier.fillMaxWidth().wrapContentHeight()
            ) {
                Column {
                    // Header photo
                    Box(modifier = Modifier.fillMaxWidth().height(160.dp)) {
                        RealKiezImage(
                            drawableId = KiezPhotoHelper.getFoodDrawable(spot.id),
                            contentDescription = spot.name,
                            showBottomGradient = true,
                            modifier = Modifier.fillMaxSize()
                        )
                        IconButton(
                            onClick = { selectedDetailSpot = null },
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(8.dp)
                                .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                                .size(32.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White, modifier = Modifier.size(18.dp))
                        }
                    }

                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = spot.name, fontWeight = FontWeight.Black, fontSize = 20.sp)
                            IconButton(onClick = { onToggleFavorite(spot.id) }) {
                                Icon(
                                    imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                    contentDescription = "Favorit",
                                    tint = if (isFav) BerlinRed else Color.Gray
                                )
                            }
                        }

                        Text(text = "${spot.cuisine} · ${spot.priceRange}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(imageVector = Icons.Default.Star, contentDescription = null, tint = BerlinYellow, modifier = Modifier.size(16.dp))
                            Text(text = "${spot.rating} (${spot.reviewsCount} Bewertungen)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        HorizontalDivider()
                        Spacer(modifier = Modifier.height(10.dp))

                        // Info rows
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(16.dp))
                            Text(text = spot.address, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(imageVector = Icons.Default.AccessTime, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(16.dp))
                            Text(text = spot.openingHours, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
                        }

                        if (spot.popularDishes.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(text = "Beliebte Spezialitäten:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            spot.popularDishes.forEach { dish ->
                                Text(text = "• $dish", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Action buttons: Anrufen, Route, Website
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
                                    com.example.util.MapHelper.openDirections(context, "${spot.name} ${spot.address} Berlin")
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
    }
}

@Composable
fun FoodSpotCard(
    spot: FoodSpot,
    isFavorite: Boolean,
    onToggleFavorite: () -> Unit,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
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
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Real Food Image
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(14.dp))
                ) {
                    RealKiezImage(
                        drawableId = KiezPhotoHelper.getFoodDrawable(spot.id),
                        contentDescription = spot.name,
                        showBottomGradient = false,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = spot.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        if (spot.isSponsored) {
                            Surface(color = BerlinYellow, shape = RoundedCornerShape(4.dp)) {
                                Text(
                                    text = "Anzeige",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Black,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(imageVector = Icons.Default.Star, contentDescription = null, tint = BerlinYellow, modifier = Modifier.size(13.dp))
                        Text(
                            text = "${spot.rating} (${spot.reviewsCount})",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text("•", color = Color.Gray, fontSize = 10.sp)
                        Text(text = spot.cuisine, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(13.dp))
                        Text(
                            text = "${spot.kiezName} · ${spot.distance}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            IconButton(
                onClick = onToggleFavorite,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = "Favorit",
                    tint = if (isFavorite) BerlinRed else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
