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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Work
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
import com.example.data.model.KiezJob
import com.example.data.repository.SampleData
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinYellow

@Composable
fun JobsScreen(
    language: AppLanguage,
    customJobs: List<KiezJob>,
    onAddJob: (title: String, company: String, kiez: String, type: String, salary: String, contactWa: String, desc: String) -> Unit
) {
    val context = LocalContext.current
    var showAddJobDialog by remember { mutableStateOf(false) }
    var selectedKiezFilter by remember { mutableStateOf("Alle") }

    val allJobs = remember(customJobs, selectedKiezFilter) {
        val merged = customJobs + SampleData.jobs
        if (selectedKiezFilter == "Alle") merged
        else merged.filter { it.kiez.contains(selectedKiezFilter, ignoreCase = true) }
    }

    val kieze = listOf("Alle", "Kreuzberg", "Neukölln", "Mitte", "Friedrichshain", "Wedding", "Prenzlauer Berg")

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showAddJobDialog = true },
                containerColor = BerlinRed,
                contentColor = Color.White,
                icon = { Icon(imageVector = Icons.Default.Add, contentDescription = null) },
                text = {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "İş İlanı Ekle" else "Job aufgeben",
                        fontWeight = FontWeight.Bold
                    )
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Kiez İş İlanları" else "Jobs in deinem Kiez",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    )
                    Text(
                        text = if (language == AppLanguage.TURKISH)
                            "${allJobs.size} açık ilan · Doğrudan işletmeyle iletişim kurun"
                        else
                            "${allJobs.size} aktuelle Stellenangebote direkt aus den Kiezen",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Kiez filter row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                kieze.forEach { kiez ->
                    val isSelected = selectedKiezFilter == kiez
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedKiezFilter = kiez },
                        label = {
                            Text(
                                text = if (language == AppLanguage.TURKISH && kiez == "Alle") "Tümü" else kiez,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BerlinRed,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            // Jobs list
            LazyColumn(
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 6.dp, bottom = 90.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(allJobs) { job ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = job.title,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "${job.company} · ${job.kiez}",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                if (job.isUrgent) {
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = BerlinRed
                                    ) {
                                        Text(
                                            text = if (language == AppLanguage.TURKISH) "ACİL" else "DRINGEND",
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 9.sp,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant
                                ) {
                                    Text(
                                        text = job.jobType,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }

                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = BerlinGreen.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = job.salary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = BerlinGreen,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = job.description,
                                fontSize = 12.sp,
                                lineHeight = 16.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            // Contact buttons: WhatsApp, Phone, Email
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (job.contactWa.isNotEmpty()) {
                                    Button(
                                        onClick = {
                                            val waIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/${job.contactWa.replace("+", "").replace(" ", "")}?text=Hallo,%20ich%20interessiere%20mich%20für%20den%20Job:%20${job.title}"))
                                            context.startActivity(waIntent)
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(10.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = BerlinGreen)
                                    ) {
                                        Text("WhatsApp", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                if (job.contactPhone.isNotEmpty()) {
                                    OutlinedButton(
                                        onClick = {
                                            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${job.contactPhone}"))
                                            context.startActivity(dialIntent)
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.Call, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(if (language == AppLanguage.TURKISH) "Ara" else "Anrufen", fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Add Job Dialog
    if (showAddJobDialog) {
        var titleInput by remember { mutableStateOf("") }
        var companyInput by remember { mutableStateOf("") }
        var kiezInput by remember { mutableStateOf("Kreuzberg") }
        var typeInput by remember { mutableStateOf("Vollzeit") }
        var salaryInput by remember { mutableStateOf("") }
        var waInput by remember { mutableStateOf("") }
        var descInput by remember { mutableStateOf("") }

        Dialog(onDismissRequest = { showAddJobDialog = false }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "İş İlanı Ekle" else "Job kostenlos aufgeben",
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp
                        )
                        IconButton(onClick = { showAddJobDialog = false }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    OutlinedTextField(
                        value = titleInput,
                        onValueChange = { titleInput = it },
                        label = { Text(if (language == AppLanguage.TURKISH) "Pozisyon (örn. Barista)" else "Position / Berufsbezeichnung") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = companyInput,
                        onValueChange = { companyInput = it },
                        label = { Text(if (language == AppLanguage.TURKISH) "İşletme Adı" else "Name des Betriebs") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = typeInput,
                            onValueChange = { typeInput = it },
                            label = { Text("Art (Vollzeit/Teilzeit)") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = salaryInput,
                            onValueChange = { salaryInput = it },
                            label = { Text(if (language == AppLanguage.TURKISH) "Ücret" else "Gehalt") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    OutlinedTextField(
                        value = waInput,
                        onValueChange = { waInput = it },
                        label = { Text("WhatsApp / Telefon") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = descInput,
                        onValueChange = { descInput = it },
                        label = { Text(if (language == AppLanguage.TURKISH) "İlan açıklaması" else "Kurzbeschreibung") },
                        maxLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Button(
                        onClick = {
                            if (titleInput.isNotBlank() && companyInput.isNotBlank()) {
                                onAddJob(titleInput, companyInput, kiezInput, typeInput, salaryInput, waInput, descInput)
                                showAddJobDialog = false
                            }
                        },
                        enabled = titleInput.isNotBlank() && companyInput.isNotBlank(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "İlanı Yayınla" else "Job veröffentlichen",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
