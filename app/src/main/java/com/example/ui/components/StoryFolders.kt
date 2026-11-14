package com.example.ui.components

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.data.model.KiezStory
import com.example.ui.theme.BerlinRed
import okhttp3.MultipartBody
import org.json.JSONArray

/*
 * 2026-11-14 (owner): story folders – same list as the server (functions/_lib/story-cats.js) and the web (story-folders.js).
 *  - chips above the stories: "Alle" + every folder that has stories (or is followed); a tap shows only that folder
 *  - 🔔 follow a folder: KiezNotificationWorker sends a notification for new stories in followed folders
 *  - story form: folder chips ("🤖 Automatisch" = the server sorts by text; a price -> also "Angebote")
 */

data class StoryFolder(val key: String, val icon: String, val de: String, val tr: String, val en: String) {
    fun label(language: AppLanguage) = when (language) { AppLanguage.TURKISH -> tr; AppLanguage.ENGLISH -> en; else -> de }
}

val STORY_FOLDERS = listOf(
    StoryFolder("berlin", "🏘️", "Kiez & Berlin", "Mahalleler & Berlin", "Kiez & Berlin"),
    StoryFolder("info", "ℹ️", "Info", "Info", "Info"), // 2026-11-14 (owner)
    StoryFolder("eil", "🚨", "Eilmeldungen", "Acil / Son Dakika", "Breaking news"),
    StoryFolder("verkehr", "🚇", "Verkehr & BVG", "Trafik & BVG", "Traffic & BVG"),
    StoryFolder("deutschland", "🇩🇪", "Deutschland", "Almanya", "Germany"),
    StoryFolder("welt", "🌍", "Europa & Welt", "Avrupa & Dünya", "Europe & World"),
    StoryFolder("tuerkei", "🇹🇷", "Türkei", "Türkiye", "Turkey"),
    StoryFolder("angebote", "🏷️", "Angebote & Rabatte", "İndirimler & Fırsatlar", "Deals"),
    StoryFolder("sponsoren", "🤝", "Sponsoren", "Sponsorlar", "Sponsors"),
    StoryFolder("neue", "🆕", "Neu", "Yeni", "New"),
    StoryFolder("events", "🎉", "Events", "Etkinlik", "Events"),
    StoryFolder("sport", "⚽", "Sport", "Spor", "Sport"),
    StoryFolder("essen", "🍽️", "Essen & Trinken", "Yeme & İçme", "Food & drink"),
    StoryFolder("wohnen", "🏠", "Wohnen", "Emlak & Kiralık", "Housing"),
    StoryFolder("jobs", "💼", "Jobs", "İş İlanları", "Jobs"),
    StoryFolder("aemter", "🏛️", "Ämter & Info", "Resmî İşler & Bilgi", "Offices & info"),
    StoryFolder("fundsachen", "🔎", "Verloren & Gefunden", "Kayıp & Bulundu", "Lost & found"),
)

/** "cats" of /api/stories -> list of known folder keys. */
fun parseStoryCats(arr: JSONArray?): List<String> {
    if (arr == null) return emptyList()
    val keys = STORY_FOLDERS.map { it.key }.toSet()
    return (0 until arr.length()).mapNotNull { arr.optString(it).takeIf { k -> k in keys } }
}

/** Old stories (or local ones) without folders count as "Kiez & Berlin". */
fun KiezStory.folders(): List<String> = cats.ifEmpty { listOf("berlin") }

/** Folder chosen in the story form, sent with the upload (LiveAlertsRepository.postStoryMultipartResult). */
object StoryFolderDraft {
    var key by mutableStateOf("")
    fun addTo(builder: MultipartBody.Builder) {
        if (key.isNotBlank()) builder.addFormDataPart("category", key)
        key = ""
    }
}

object StoryFolders {
    private const val PREFS = "mk_story_folders"
    val selected = mutableStateOf("")
    val followed = mutableStateOf<Set<String>>(emptySet())
    private var loaded = false

    fun load(context: Context) {
        if (loaded) return
        loaded = true
        followed.value = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("follow", "").orEmpty()
            .split(",").filter { it.isNotBlank() }.toSet()
    }

    fun followedKeys(context: Context): Set<String> =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("follow", "").orEmpty().split(",").filter { it.isNotBlank() }.toSet()

    fun toggleFollow(context: Context, key: String): Boolean {
        load(context)
        val now = followed.value.toMutableSet()
        val on = if (key in now) { now.remove(key); false } else { now.add(key); true }
        followed.value = now
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("follow", now.joinToString(","))
            .putLong("seen_$key", System.currentTimeMillis()).apply()
        return on
    }

    fun lastNotified(context: Context): Long = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getLong("notified", 0L)
    fun setLastNotified(context: Context, t: Long) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putLong("notified", t).apply() }
}

/** Chips row above the story rings. */
@Composable
fun StoryFolderChips(stories: List<KiezStory>, language: AppLanguage) {
    val context = LocalContext.current
    LaunchedEffect(Unit) { StoryFolders.load(context) }
    val selected by StoryFolders.selected
    val followed by StoryFolders.followed
    var showAll by remember { mutableStateOf(false) }
    val counts = remember(stories) { STORY_FOLDERS.associate { f -> f.key to stories.count { f.key in it.folders() } } }
    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        item { FolderChip((if (language == AppLanguage.TURKISH) "Tümü" else if (language == AppLanguage.ENGLISH) "All" else "Alle") + " (${stories.size})", selected.isBlank()) { StoryFolders.selected.value = "" } }
        items(STORY_FOLDERS.filter { (counts[it.key] ?: 0) > 0 || it.key in followed || it.key == selected }) { f ->
            val n = counts[f.key] ?: 0
            FolderChip("${f.icon} ${f.label(language)}" + (if (n > 0) " ($n)" else "") + (if (f.key in followed) " 🔔" else ""), selected == f.key) {
                StoryFolders.selected.value = if (selected == f.key) "" else f.key
            }
        }
        item { FolderChip("📁 " + when (language) { AppLanguage.TURKISH -> "Klasörler"; AppLanguage.ENGLISH -> "Folders"; else -> "Ordner" }, false) { showAll = true } }
    }
    if (selected.isNotBlank()) {
        val f = STORY_FOLDERS.firstOrNull { it.key == selected }
        if (f != null) {
            val on = selected in followed
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("${f.icon} ${f.label(language)}", fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.weight(1f))
                TextButton(onClick = { StoryFolders.toggleFollow(context, f.key) }) {
                    Text(if (on) "🔔 " + when (language) { AppLanguage.TURKISH -> "Takipte"; AppLanguage.ENGLISH -> "Following"; else -> "Folge ich" }
                    else "🔕 " + when (language) { AppLanguage.TURKISH -> "Takip et"; AppLanguage.ENGLISH -> "Follow"; else -> "Folgen" }, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }
    }
    if (showAll) AllFoldersDialog(language) { showAll = false }
}

@Composable
private fun FolderChip(text: String, on: Boolean, onClick: () -> Unit) {
    Text(
        text, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (on) Color.White else MaterialTheme.colorScheme.onSurface, maxLines = 1,
        modifier = Modifier.clip(RoundedCornerShape(50)).background(if (on) BerlinRed else MaterialTheme.colorScheme.surface)
            .border(1.dp, if (on) BerlinRed else MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(50))
            .clickable { onClick() }.padding(horizontal = 11.dp, vertical = 6.dp)
    )
}

/** Every folder with a follow switch. */
@Composable
fun AllFoldersDialog(language: AppLanguage, onClose: () -> Unit) {
    val context = LocalContext.current
    val followed by StoryFolders.followed
    AlertDialog(
        onDismissRequest = onClose,
        confirmButton = { TextButton(onClick = onClose) { Text("OK") } },
        title = { Text("📁 " + when (language) { AppLanguage.TURKISH -> "Hikâye Klasörleri"; AppLanguage.ENGLISH -> "Story folders"; else -> "Story-Ordner" }, fontWeight = FontWeight.ExtraBold) },
        text = {
            Column(Modifier.heightIn(max = 460.dp).verticalScrollCompat()) {
                STORY_FOLDERS.forEach { f ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("${f.icon} ${f.label(language)}", fontWeight = FontWeight.Bold, fontSize = 14.sp,
                            modifier = Modifier.weight(1f).clickable { StoryFolders.selected.value = f.key; onClose() }.padding(vertical = 8.dp))
                        // 2026-11-14 (owner: "cannot switch off"): the off state was almost invisible – clear grey track now
                        Switch(
                            checked = f.key in followed, onCheckedChange = { StoryFolders.toggleFollow(context, f.key) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White, checkedTrackColor = BerlinRed,
                                uncheckedThumbColor = Color.White, uncheckedTrackColor = Color(0xFF9AA3B2), uncheckedBorderColor = Color(0xFF6B7280)
                            )
                        )
                    }
                }
                Text(when (language) {
                    AppLanguage.TURKISH -> "Açık = bu klasörde yeni hikâye olunca bildirim alırsın."
                    AppLanguage.ENGLISH -> "On = you get a notification for new stories in this folder."
                    else -> "An = du bekommst eine Nachricht bei neuen Stories in diesem Ordner."
                }, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp))
            }
        }
    )
}

@Composable
private fun Modifier.verticalScrollCompat(): Modifier = this.then(Modifier.verticalScroll(androidx.compose.foundation.rememberScrollState()))

/** Folder choice in the story form. */
@Composable
fun StoryFolderPicker(language: AppLanguage) {
    val sel = StoryFolderDraft.key
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("📁 " + when (language) { AppLanguage.TURKISH -> "Klasör"; AppLanguage.ENGLISH -> "Folder"; else -> "Ordner" }, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            InfoButton("folders", language)
        }
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            item { FolderChip("🤖 " + when (language) { AppLanguage.TURKISH -> "Otomatik (KI)"; AppLanguage.ENGLISH -> "Automatic (AI)"; else -> "Automatisch (KI)" }, sel.isBlank()) { StoryFolderDraft.key = "" } }
            items(STORY_FOLDERS) { f -> FolderChip("${f.icon} ${f.label(language)}", sel == f.key) { StoryFolderDraft.key = f.key } }
        }
    }
}
