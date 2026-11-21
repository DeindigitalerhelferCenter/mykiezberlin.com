package com.example.ui.components

/*
 * 2026-11-22 (owner): Kiez search – same as public/kiez-search.js on the web.
 * The user types a Kiez into the search box (e.g. "Wedding") -> one list with everything in that Kiez:
 *   1. sponsors in the Kiez (Premium -> Plus -> Basic), 2. sponsors nearby (same district),
 *   3. businesses & food, 4. Kiez-Stories, 5. events, 6. jobs (PLZ of the Kiez).
 */

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage
import com.example.data.model.Kiez
import com.example.data.model.KiezEvent
import com.example.data.model.KiezJob
import com.example.data.model.KiezStory
import com.example.data.repository.AdsRepository
import com.example.data.repository.SampleData
import com.example.data.repository.ServerAd
import com.example.ui.viewmodel.AppScreen

private val DISTRICT = mapOf(
    "mitte" to "mitte", "wedding" to "mitte", "gesundbrunnen" to "mitte", "moabit" to "mitte", "tiergarten" to "mitte",
    "kreuzberg" to "fk", "friedrichshain" to "fk", "prenzlauer berg" to "pankow", "pankow" to "pankow",
    "charlottenburg" to "cw", "wilmersdorf" to "cw", "charlottenburg-nord" to "cw", "charlottenburg-wilmersdorf" to "cw",
    "schöneberg" to "ts", "tempelhof" to "ts", "neukölln" to "neukölln", "britz" to "neukölln",
    "steglitz" to "sz", "zehlendorf" to "sz", "spandau" to "spandau", "reinickendorf" to "reinickendorf", "tegel" to "reinickendorf",
    "lichtenberg" to "lichtenberg", "treptow" to "tk", "köpenick" to "tk", "marzahn" to "mh",
)

private fun pk(language: AppLanguage, de: String, tr: String, en: String = de) = when (language) {
    AppLanguage.TURKISH -> tr
    AppLanguage.ENGLISH -> en
    else -> de
}

/** The Kiez the search word means, or null (at least 3 letters). */
fun findSearchKiez(query: String, kieze: List<Kiez>): Kiez? {
    val t = query.trim().lowercase()
    if (t.length < 3) return null
    val list = kieze.filter { it.name != "Berlin & Umgebung" }
    return list.firstOrNull { it.name.lowercase() == t } ?: list.firstOrNull { it.name.lowercase().startsWith(t) }
}

private fun plz(k: Kiez) = k.postalCodes.split(",", " ").map { it.trim() }.filter { it.isNotBlank() }
private fun inKiez(text: String?, k: Kiez): Boolean {
    val s = (text ?: "").lowercase()
    if (s.isBlank()) return false
    if (s.contains(k.name.lowercase())) return true
    return plz(k).any { s.contains(it) }
}
private fun tier(a: ServerAd) = when (a.size) { "large", "banner" -> 0; "small" -> 2; else -> 1 }
private fun tierName(a: ServerAd) = when (tier(a)) { 0 -> "Premium"; 1 -> "Plus"; else -> "Basic" }

private sealed class Row2 {
    data class Head(val text: String) : Row2()
    data class Item(val icon: String, val title: String, val sub: String, val img: String = "", val badge: String = "", val onClick: () -> Unit) : Row2()
}

@Composable
fun KiezSearchResults(
    kiez: Kiez,
    language: AppLanguage,
    stories: List<KiezStory>,
    events: List<KiezEvent>,
    jobs: List<KiezJob>,
    onOpenStory: (KiezStory, List<KiezStory>, Int) -> Unit,
    onNavigate: (AppScreen) -> Unit,
) {
    val ads by AdsRepository.pageAds.collectAsState()
    val d0 = DISTRICT[kiez.name.lowercase()]
    val here = ads.filter { inKiez(it.kieze, kiez) || inKiez(it.address, kiez) }.sortedBy { tier(it) }
    val near = ads.filter { a -> a !in here && d0 != null && a.kieze.split(",").any { DISTRICT[it.trim().lowercase()] == d0 } }.sortedBy { tier(it) }
    val approved = stories.filter { it.status == "approved" }
    val rows = mutableListOf<Row2>()
    fun section(title: String, items: List<Row2.Item>) { if (items.isNotEmpty()) { rows.add(Row2.Head("$title (${items.size})")); rows.addAll(items) } }
    val spItem = { a: ServerAd ->
        Row2.Item("🤝", a.name, (if (language == AppLanguage.TURKISH) a.categoryTr else a.categoryDe).ifBlank { a.address }, a.logo.ifBlank { a.image }, tierName(a)) { SponsorInfoState.show(a) }
    }
    section("🤝 " + pk(language, "Sponsoren im Kiez", "Mahalledeki sponsorlar", "Sponsors in the Kiez"), here.map(spItem))
    section("📌 " + pk(language, "Sponsoren in der Nähe", "Yakındaki sponsorlar", "Sponsors nearby"), near.map(spItem))
    val places = SampleData.businesses.filter { inKiez(it.kiezName, kiez) || inKiez(it.address, kiez) }.map { b ->
        Row2.Item("🏪", b.name, listOf(b.category, b.address).filter { it.isNotBlank() }.joinToString(" · ")) { onNavigate(AppScreen.BUSINESSES) }
    } + SampleData.foodSpots.filter { inKiez(it.kiezName, kiez) || inKiez(it.address, kiez) }.map { f ->
        Row2.Item("🍽️", f.name, listOf(f.cuisine, f.address).filter { it.isNotBlank() }.joinToString(" · ")) { onNavigate(AppScreen.FOOD) }
    }
    section("🏪 " + pk(language, "Betriebe & Essen", "İşletmeler & yemek", "Businesses & food"), places)
    val st = approved.mapIndexedNotNull { i, s ->
        if (inKiez(s.kiez, kiez) || inKiez(s.headline, kiez)) Row2.Item("📰", s.headline, s.kiez, s.mediaUri?.takeIf { !s.isVideo } ?: "") { onOpenStory(s, approved, i) } else null
    }
    section("📰 " + pk(language, "Kiez-Stories", "Mahalle hikâyeleri", "Kiez stories"), st)
    val ev = (events + SampleData.events).distinctBy { it.title }.filter { inKiez(it.kiezName, kiez) || inKiez(it.description, kiez) }.map { e ->
        Row2.Item("🎉", e.title, listOf(e.dayLabel, e.time, e.kiezName).filter { it.isNotBlank() }.joinToString(" · ")) { onNavigate(AppScreen.EVENTS) }
    }
    section("🎉 " + pk(language, "Events", "Etkinlikler", "Events"), ev)
    val jb = (jobs + SampleData.jobs).distinctBy { it.id }.filter { inKiez(it.kiez, kiez) }.take(40).map { j ->
        Row2.Item("💼", j.title, listOf(j.company, j.kiez, j.jobType).filter { it.isNotBlank() }.joinToString(" · ")) { onNavigate(AppScreen.JOBS) }
    }
    section("💼 " + pk(language, "Jobs im Kiez", "Mahalledeki iş ilanları", "Jobs in the Kiez"), jb)
    val total = rows.count { it is Row2.Item }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item {
            Column(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Brush.linearGradient(listOf(Color(0xFF0F172A), Color(0xFF1E3A8A)))).padding(14.dp)
            ) {
                Text("📍 ${kiez.name} – " + pk(language, "alles im Kiez", "mahallede neler var", "everything in the Kiez"), color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                Text(listOf(kiez.subtitle, if (kiez.population.isNotBlank()) pk(language, "Einwohner", "Nüfus", "Population") + ": " + kiez.population else "", if (plz(kiez).isNotEmpty()) "PLZ " + plz(kiez).joinToString(", ") else "")
                    .filter { it.isNotBlank() }.joinToString(" · "), color = Color.White.copy(alpha = 0.85f), fontSize = 12.sp)
                Text("$total " + pk(language, "Treffer", "sonuç", "results"), color = Color(0xFFFFC107), fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 6.dp))
            }
        }
        items(rows) { r ->
            when (r) {
                is Row2.Head -> Text(r.text, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, modifier = Modifier.padding(top = 10.dp, bottom = 2.dp))
                is Row2.Item -> Row(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surface).clickable { r.onClick() }.padding(horizontal = 12.dp, vertical = 9.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (r.img.isNotBlank()) AsyncImage(model = r.img, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)).background(Color.White))
                    else Box(Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.surfaceVariant), contentAlignment = Alignment.Center) { Text(r.icon, fontSize = 20.sp) }
                    Column(Modifier.weight(1f)) {
                        Text(r.title, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        if (r.sub.isNotBlank()) Text(r.sub, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    if (r.badge.isNotBlank()) Box(Modifier.clip(RoundedCornerShape(10.dp)).background(Color(0xFFFFC107)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                        Text(r.badge, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF0F172A))
                    }
                }
            }
        }
        if (total == 0) item { Text(pk(language, "Hier ist noch nichts eingetragen.", "Burada henüz bir şey yok.", "Nothing listed here yet."), color = MaterialTheme.colorScheme.onSurfaceVariant) }
        item {
            Box(Modifier.fillMaxWidth().padding(top = 14.dp).clip(RoundedCornerShape(14.dp)).background(Color.Black).clickable { KiezBoost.werbenRequest.value = true }.padding(12.dp), contentAlignment = Alignment.Center) {
                Text("📣 " + pk(language, "Dein Betrieb in ${kiez.name}? Jetzt sichtbar werden →", "İşletmen ${kiez.name}'da mı? Hemen görünür ol →", "Your business in ${kiez.name}? Get visible →"), color = Color(0xFFFFC107), fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}
