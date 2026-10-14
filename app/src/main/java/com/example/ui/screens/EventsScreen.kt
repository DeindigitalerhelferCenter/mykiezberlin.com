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
import com.example.data.model.KiezEvent
import com.example.data.repository.SampleData
import com.example.ui.components.KiezPhotoHelper
import com.example.ui.components.RealKiezImage
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinGreenLight
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinRedLight

@Composable
fun EventsScreen(
    language: AppLanguage,
    activeFilter: String,
    onFilterChange: (String) -> Unit,
    favoriteIds: Set<String>,
    onToggleFavorite: (String) -> Unit,
    customEvents: List<KiezEvent>,
    showSubmitDialog: Boolean,
    onOpenSubmit: () -> Unit,
    onCloseSubmit: () -> Unit,
    onSubmitNewEvent: (String, String, String, String, String, String, String) -> Unit,
    submitSuccessMessage: String?
) {
    val context = LocalContext.current
    val filters = listOf("Alle", "Heute", "Dieses Wochenende", "Diesen Monat", "Kostenlos")

    val allEvents: List<KiezEvent> = remember(customEvents, activeFilter) {
        val merged: List<KiezEvent> = customEvents + SampleData.events
        when (activeFilter) {
            "Heute" -> merged.filter { it.dayLabel.equals("HEUTE", ignoreCase = true) || it.dayLabel.equals("OKT", ignoreCase = true) }
            "Dieses Wochenende" -> merged.filter { it.dayLabel.contains("SA", ignoreCase = true) || it.dayLabel.contains("SO", ignoreCase = true) }
            "Diesen Monat" -> merged.filter { it.monthLabel.contains("OKT", ignoreCase = true) || it.dayLabel.contains("OKT", ignoreCase = true) }
            "Kostenlos" -> merged.filter { it.isFree }
            else -> merged
        }
    }

    var selectedEvent by remember { mutableStateOf<KiezEvent?>(null) }

    var titleInput by remember { mutableStateOf("") }
    var kiezInput by remember { mutableStateOf("Kreuzberg") }
    var dateInput by remember { mutableStateOf("15.10.2026") }
    var timeInput by remember { mutableStateOf("19:00 Uhr") }
    var priceInput by remember { mutableStateOf("Kostenlos") }
    var categoryInput by remember { mutableStateOf("Kultur & Musik") }
    var descInput by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Date filters & "Event eintragen" Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                filters.forEach { filter ->
                    val isSelected = activeFilter == filter
                    FilterChip(
                        selected = isSelected,
                        onClick = { onFilterChange(filter) },
                        label = {
                            Text(
                                text = when {
                                    language == AppLanguage.TURKISH && filter == "Alle" -> "Tümü"
                                    language == AppLanguage.TURKISH && filter == "Heute" -> "Bugün"
                                    language == AppLanguage.TURKISH && filter == "Dieses Wochenende" -> "Bu Hafta Sonu"
                                    language == AppLanguage.TURKISH && filter == "Diesen Monat" -> "Bu Ay"
                                    language == AppLanguage.TURKISH && filter == "Kostenlos" -> "Ücretsiz"
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

            Spacer(modifier = Modifier.width(8.dp))

            // Action: Event eintragen
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = BerlinRed,
                modifier = Modifier.clickable { onOpenSubmit() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Event hinzufügen", tint = Color.White, modifier = Modifier.size(16.dp))
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Ekle" else "+ Event",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Events list
        LazyColumn(
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(allEvents) { event ->
                val isFav = favoriteIds.contains(event.id)
                EventCard(
                    event = event,
                    isFavorite = isFav,
                    onToggleFavorite = { onToggleFavorite(event.id) },
                    onClick = { selectedEvent = event }
                )
            }
        }
    }

    // Event Detail Dialog
    selectedEvent?.let { event ->
        val isFav = favoriteIds.contains(event.id)
        Dialog(onDismissRequest = { selectedEvent = null }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp),
                modifier = Modifier.fillMaxWidth().wrapContentHeight()
            ) {
                Column {
                    // Header Bar (No stock photos)
                    Surface(
                        color = BerlinRed.copy(alpha = 0.08f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Surface(
                                    color = BerlinRed,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = "🏛️ Offiziell: berlin.de",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                                Text(
                                    text = event.category,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                            IconButton(
                                onClick = { selectedEvent = null },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = MaterialTheme.colorScheme.onSurface)
                            }
                        }
                    }

                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = event.title, fontWeight = FontWeight.Black, fontSize = 18.sp, modifier = Modifier.weight(1f))
                            IconButton(onClick = { onToggleFavorite(event.id) }) {
                                Icon(
                                    imageVector = if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                    contentDescription = "Favorit",
                                    tint = if (isFav) BerlinRed else Color.Gray
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Surface(color = BerlinRedLight, shape = RoundedCornerShape(6.dp)) {
                                Text(
                                    text = "${event.dateNum} ${event.monthLabel} · ${event.time}",
                                    color = BerlinRed,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                            Surface(color = if (event.isFree) BerlinGreenLight else MaterialTheme.colorScheme.surfaceVariant, shape = RoundedCornerShape(6.dp)) {
                                Text(
                                    text = event.price,
                                    color = if (event.isFree) BerlinGreen else MaterialTheme.colorScheme.onSurface,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(15.dp))
                            Text(text = "${event.kiezName} · ${event.locationAddress}", fontSize = 12.5.sp, fontWeight = FontWeight.SemiBold)
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = event.description, fontSize = 13.sp, lineHeight = 19.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Quelle / Veranstalter: ${event.organizer}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Official Website Link Button (Prominent)
                        Button(
                            onClick = {
                                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(event.officialUrl))
                                context.startActivity(browserIntent)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                        ) {
                            Icon(imageVector = Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Offizielle Seite öffnen (${event.officialUrl.replace("https://www.", "").replace("/", "")}) ↗", fontSize = 12.5.sp, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = {
                                    Toast.makeText(context, "Event '${event.title}' in Kalender vorgemerkt! 📅", Toast.LENGTH_SHORT).show()
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Event, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Merken", fontSize = 12.sp)
                            }

                            OutlinedButton(
                                onClick = {
                                    val mapIntent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${event.kiezName}+Berlin"))
                                    context.startActivity(Intent.createChooser(mapIntent, "Karte öffnen"))
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Directions, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Route", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    // Submit Event Dialog
    if (showSubmitDialog) {
        Dialog(onDismissRequest = onCloseSubmit) {
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
                            text = if (language == AppLanguage.TURKISH) "Etkinlik Ekle" else "Kiez-Event eintragen",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        IconButton(onClick = onCloseSubmit) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    if (submitSuccessMessage != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = BerlinGreenLight,
                            modifier = Modifier.padding(vertical = 12.dp)
                        ) {
                            Text(
                                text = submitSuccessMessage,
                                color = BerlinGreen,
                                fontWeight = FontWeight.Medium,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    } else {
                        OutlinedTextField(
                            value = titleInput,
                            onValueChange = { titleInput = it },
                            label = { Text("Event Titel") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = kiezInput,
                                onValueChange = { kiezInput = it },
                                label = { Text("Kiez") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = priceInput,
                                onValueChange = { priceInput = it },
                                label = { Text("Preis") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = dateInput,
                                onValueChange = { dateInput = it },
                                label = { Text("Datum") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = timeInput,
                                onValueChange = { timeInput = it },
                                label = { Text("Uhrzeit") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedTextField(
                            value = descInput,
                            onValueChange = { descInput = it },
                            label = { Text("Beschreibung") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 3
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                if (titleInput.isNotBlank()) {
                                    onSubmitNewEvent(titleInput, kiezInput, dateInput, timeInput, priceInput, categoryInput, descInput)
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                            enabled = titleInput.isNotBlank()
                        ) {
                            Text("Event einreichen", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EventCard(
    event: KiezEvent,
    isFavorite: Boolean,
    onToggleFavorite: () -> Unit,
    onClick: () -> Unit
) {
    val context = LocalContext.current

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row: Badges
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        color = BerlinRed.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(6.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BerlinRed.copy(alpha = 0.3f))
                    ) {
                        Text(
                            text = "🏛️ berlin.de Offiziell",
                            color = BerlinRed,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.5.sp,
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                        )
                    }

                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = "${event.dateNum} ${event.monthLabel} · ${event.dayLabel}",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.5.sp,
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                        )
                    }
                }

                Surface(
                    color = if (event.isFree) BerlinGreenLight else MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = event.price,
                        color = if (event.isFree) BerlinGreen else MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.5.sp,
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Title
            Text(
                text = event.title,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.onSurface,
                lineHeight = 21.sp
            )

            // Category & Kiez
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = event.category,
                    fontSize = 11.5.sp,
                    color = BerlinRed,
                    fontWeight = FontWeight.SemiBold
                )
                Text("•", color = Color.Gray, fontSize = 10.sp)
                Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(13.dp))
                Text(
                    text = "${event.kiezName} (${event.locationAddress})",
                    fontSize = 11.5.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }

            // Description
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = event.description,
                fontSize = 12.5.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 17.sp,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Action Buttons Row: Direct Link to official page
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(event.officialUrl))
                        context.startActivity(browserIntent)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(imageVector = Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Offizielle Seite (berlin.de) ↗", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onToggleFavorite,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = if (isFavorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            contentDescription = "Favorit",
                            tint = if (isFavorite) BerlinRed else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                }
            }
        }
    }
}
