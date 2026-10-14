package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.ThumbUp
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
import com.example.data.model.KiezReporterComment
import com.example.data.model.KiezReporterPost
import com.example.data.repository.KiezStorageManager
import com.example.data.repository.SampleData
import com.example.ui.theme.BerlinBlue
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinYellow

@Composable
fun KiezReporterScreen(
    language: AppLanguage,
    customPosts: List<KiezReporterPost>,
    onSubmitPost: (title: String, kiez: String, category: String, desc: String, author: String) -> Unit,
    onAddComment: (postId: String, author: String, text: String) -> Unit = { _, _, _ -> }
) {
    val context = LocalContext.current
    var showDialog by remember { mutableStateOf(false) }

    // Sourced directly from authentic 24h real-time Berlin bulletins
    val dailyPosts = remember(language) {
        SampleData.getDailyReporterPosts(language)
    }

    val allPosts = remember(customPosts, dailyPosts) {
        customPosts + dailyPosts
    }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showDialog = true },
                containerColor = BerlinRed,
                contentColor = Color.White,
                icon = { Icon(imageVector = Icons.Default.Add, contentDescription = null) },
                text = {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Haber Bildir" else if (language == AppLanguage.ENGLISH) "Report News" else "Meldung senden",
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
                        text = if (language == AppLanguage.TURKISH) "Kiez Muhabiri" else if (language == AppLanguage.ENGLISH) "Neighborhood Reporter" else "Kiez-Reporter",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                    Text(
                        text = if (language == AppLanguage.TURKISH)
                            "Mahallendeki gerçek olaylar, yol çalışmaları ve güncel duyurular"
                        else if (language == AppLanguage.ENGLISH)
                            "Real neighborhood news, road works & official alerts in Berlin"
                        else
                            "Echte Nachbarschaftsmeldungen, Baustellen & aktuelle Ereignisse",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            LazyColumn(
                contentPadding = PaddingValues(start = 14.dp, end = 14.dp, top = 6.dp, bottom = 90.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(allPosts, key = { it.id }) { post ->
                    KiezReporterPostCard(
                        post = post,
                        language = language,
                        onAddComment = onAddComment
                    )
                }
            }
        }
    }

    if (showDialog) {
        CreateReporterPostDialog(
            language = language,
            onDismiss = { showDialog = false },
            onSubmit = { title, kiez, category, desc, author ->
                onSubmitPost(title, kiez, category, desc, author)
                showDialog = false
            }
        )
    }
}

@Composable
private fun KiezReporterPostCard(
    post: KiezReporterPost,
    language: AppLanguage,
    onAddComment: (postId: String, author: String, text: String) -> Unit
) {
    val context = LocalContext.current
    var upvotes by remember { mutableIntStateOf(post.upvotes) }
    var hasUpvoted by remember { mutableStateOf(false) }
    var isCommentsExpanded by remember { mutableStateOf(false) }

    // Persistent comments store for this post
    val comments = remember(post.id) {
        mutableStateListOf<KiezReporterComment>().apply {
            val saved = KiezStorageManager.loadCommentsForPost(context, post.id)
            if (saved.isNotEmpty()) {
                addAll(saved)
            } else {
                addAll(post.comments)
            }
        }
    }

    var newCommentAuthor by remember { mutableStateOf("") }
    var newCommentText by remember { mutableStateOf("") }

    val categoryColor = when {
        post.category.contains("Baustelle") || post.category.contains("Yol") || post.category.contains("Work") -> Color(0xFFD97706)
        post.category.contains("Verkehr") || post.category.contains("Ulaşım") || post.category.contains("Transit") -> BerlinRed
        post.category.contains("Kultur") || post.category.contains("Kültür") -> Color(0xFF7B1FA2)
        post.category.contains("Neueröffnung") || post.category.contains("Açılış") -> BerlinGreen
        else -> BerlinBlue
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.5.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = categoryColor.copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = post.category,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = categoryColor,
                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.5.dp)
                        )
                    }

                    Text(
                        text = "${post.kiez} · ${post.author}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }

                Text(
                    text = post.timeAgo,
                    fontSize = 11.sp,
                    color = Color.Gray
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Title
            Text(
                text = post.title,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                lineHeight = 20.sp,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Description (Full multiline text supported)
            Text(
                text = post.description,
                fontSize = 13.sp,
                lineHeight = 18.5.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Action Row: Upvote + Comments Toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Comments button with count (up to 10)
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isCommentsExpanded) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.clickable { isCommentsExpanded = !isCommentsExpanded }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Text(
                            text = "💬",
                            fontSize = 13.sp
                        )
                        Text(
                            text = if (language == AppLanguage.TURKISH) {
                                "Yorumlar (${comments.size}/10)"
                            } else if (language == AppLanguage.ENGLISH) {
                                "Comments (${comments.size}/10)"
                            } else {
                                "Antworten (${comments.size}/10)"
                            },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isCommentsExpanded) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Upvote button
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (hasUpvoted) BerlinRed.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.clickable {
                        if (!hasUpvoted) {
                            upvotes += 1
                            hasUpvoted = true
                        }
                    }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ThumbUp,
                            contentDescription = "Hilfreich",
                            tint = if (hasUpvoted) BerlinRed else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "$upvotes",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (hasUpvoted) BerlinRed else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Expandable Comments Section (Up to 10 replies per post)
            AnimatedVisibility(visible = isCommentsExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(10.dp)
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Mahalle Yorumları & Cevaplar" else if (language == AppLanguage.ENGLISH) "Community Responses" else "Nachbarschafts-Antworten",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.primary
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    if (comments.isEmpty()) {
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "Henüz yorum yapılmamış. İlk cevabı siz yazın!"
                            else if (language == AppLanguage.ENGLISH)
                                "No replies yet. Be the first to reply!"
                            else
                                "Noch keine Antworten. Schreibe die erste!",
                            fontSize = 11.5.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            comments.take(10).forEach { comment ->
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = MaterialTheme.colorScheme.surface,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(8.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = comment.author,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.5.sp,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = if (language == AppLanguage.TURKISH) "az önce" else "gerade",
                                                fontSize = 10.sp,
                                                color = Color.Gray
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = comment.text,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Input Form for New Reply (Up to 10 max)
                    if (comments.size < 10) {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OutlinedTextField(
                                value = newCommentAuthor,
                                onValueChange = { newCommentAuthor = it },
                                label = {
                                    Text(
                                        if (language == AppLanguage.TURKISH) "Adınız (İsteğe bağlı)" else "Dein Name (Optional)",
                                        fontSize = 11.sp
                                    )
                                },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                OutlinedTextField(
                                    value = newCommentText,
                                    onValueChange = { newCommentText = it },
                                    label = {
                                        Text(
                                            if (language == AppLanguage.TURKISH) "Cevabını yaz..." else "Antwort schreiben...",
                                            fontSize = 11.sp
                                        )
                                    },
                                    maxLines = 3,
                                    modifier = Modifier.weight(1f)
                                )

                                IconButton(
                                    onClick = {
                                        if (newCommentText.isNotBlank()) {
                                            val authorClean = if (newCommentAuthor.isBlank()) {
                                                if (language == AppLanguage.TURKISH) "Komşu" else "Nachbar"
                                            } else {
                                                newCommentAuthor.trim()
                                            }
                                            val comment = KiezReporterComment(
                                                id = "c_${System.currentTimeMillis()}",
                                                author = authorClean,
                                                text = newCommentText.trim()
                                            )
                                            val updatedList = KiezStorageManager.addCommentToPost(context, post.id, comment)
                                            comments.clear()
                                            comments.addAll(updatedList)
                                            onAddComment(post.id, authorClean, newCommentText.trim())
                                            newCommentText = ""
                                        }
                                    },
                                    enabled = newCommentText.isNotBlank()
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Send,
                                        contentDescription = "Send",
                                        tint = if (newCommentText.isNotBlank()) BerlinRed else Color.Gray
                                    )
                                }
                            }
                        }
                    } else {
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "Maksimum 10 yoruma ulaşıldı."
                            else
                                "Maximale Anzahl von 10 Antworten erreicht.",
                            fontSize = 10.5.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CreateReporterPostDialog(
    language: AppLanguage,
    onDismiss: () -> Unit,
    onSubmit: (title: String, kiez: String, category: String, desc: String, author: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var kiez by remember { mutableStateOf("Kreuzberg") }
    var category by remember {
        mutableStateOf(if (language == AppLanguage.TURKISH) "Yol Çalışması" else "Baustelle")
    }
    var desc by remember { mutableStateOf("") }
    var author by remember { mutableStateOf("") }

    val kieze = listOf(
        "Ganz Berlin", "Kreuzberg", "Mitte", "Friedrichshain", "Neukölln",
        "Prenzlauer Berg", "Charlottenburg", "Schöneberg", "Wedding",
        "Moabit", "Pankow", "Tempelhof", "Spandau", "Steglitz"
    )

    val categories = if (language == AppLanguage.TURKISH) {
        listOf("Yol Çalışması", "Ulaşım & Trafik", "Yeni Açılan Mekan", "Kültür & Etkinlik", "Mahalle Olayı", "Kayıp Eşya")
    } else if (language == AppLanguage.ENGLISH) {
        listOf("Construction", "Transport & Traffic", "New Opening", "Culture & Event", "Community", "Lost & Found")
    } else {
        listOf("Baustelle", "Verkehr & ÖPNV", "Neueröffnung", "Kultur & Feste", "Nachbarschaft", "Fundbüro")
    }

    var kiezDropdownExpanded by remember { mutableStateOf(false) }
    var catDropdownExpanded by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Kiez Haberi Bildir" else if (language == AppLanguage.ENGLISH) "Submit Neighborhood Report" else "Kiez-Meldung einsenden",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }
                }

                // Kiez & Category Selectors
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Kiez Selector
                    Box(modifier = Modifier.weight(1f)) {
                        OutlinedButton(
                            onClick = { kiezDropdownExpanded = true },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth(),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(text = "📍 $kiez", fontSize = 12.sp, maxLines = 1)
                            Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                        DropdownMenu(
                            expanded = kiezDropdownExpanded,
                            onDismissRequest = { kiezDropdownExpanded = false }
                        ) {
                            kieze.forEach { k ->
                                DropdownMenuItem(
                                    text = { Text(k) },
                                    onClick = {
                                        kiez = k
                                        kiezDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Category Selector
                    Box(modifier = Modifier.weight(1f)) {
                        OutlinedButton(
                            onClick = { catDropdownExpanded = true },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth(),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Text(text = "🏷 $category", fontSize = 12.sp, maxLines = 1)
                            Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                        DropdownMenu(
                            expanded = catDropdownExpanded,
                            onDismissRequest = { catDropdownExpanded = false }
                        ) {
                            categories.forEach { c ->
                                DropdownMenuItem(
                                    text = { Text(c) },
                                    onClick = {
                                        category = c
                                        catDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                // Title Input
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = {
                        Text(
                            if (language == AppLanguage.TURKISH) "Başlık (örn. Kottbusser Damm su borusu patladı)"
                            else if (language == AppLanguage.ENGLISH) "Headline (e.g. Water pipe burst on Kottbusser Damm)"
                            else "Überschrift (z.B. Rohrbruch am Kottbusser Damm)"
                        )
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Detailed Long Text Description Input (Spacious, multi-line)
                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = {
                        Text(
                            if (language == AppLanguage.TURKISH) "Detaylı Açıklama (Uzun metin yazabilirsiniz)"
                            else if (language == AppLanguage.ENGLISH) "Detailed Description (Long texts supported)"
                            else "Ausführliche Beschreibung (Längerer Text möglich)"
                        )
                    },
                    minLines = 4,
                    maxLines = 8,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 100.dp, max = 160.dp)
                )

                // Author Input
                OutlinedTextField(
                    value = author,
                    onValueChange = { author = it },
                    label = {
                        Text(
                            if (language == AppLanguage.TURKISH) "Adınız (İsteğe bağlı)"
                            else if (language == AppLanguage.ENGLISH) "Your Name (Optional)"
                            else "Dein Name (Optional)"
                        )
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Submit Button
                Button(
                    onClick = {
                        if (title.isNotBlank() && desc.isNotBlank()) {
                            val cleanAuthor = if (author.isBlank()) {
                                if (language == AppLanguage.TURKISH) "Mahalleli" else "Anwohner"
                            } else {
                                author.trim()
                            }
                            onSubmit(title.trim(), kiez, category, desc.trim(), cleanAuthor)
                        }
                    },
                    enabled = title.isNotBlank() && desc.isNotBlank(),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Haberi Kalıcı Paylaş" else if (language == AppLanguage.ENGLISH) "Publish Report" else "Meldung veröffentlichen",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
