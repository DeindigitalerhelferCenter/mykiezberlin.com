package com.example.ui.screens

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage
import com.example.data.model.KiezStory
import com.example.data.repository.SampleData
import com.example.ui.components.StoryViewerDialog
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    language: AppLanguage,
    isAuthenticated: Boolean,
    currentTab: String,
    stories: List<KiezStory>,
    onLogin: (String) -> Boolean,
    onTabChange: (String) -> Unit,
    onApproveStory: (String, Int?) -> Unit,
    onRejectStory: (String, String) -> Unit,
    onExtendStory: (String, Int) -> Unit,
    onDeleteStory: (String) -> Unit,
    onUpdateStory: (String, String, String) -> Unit,
    onAddAdminStory: (
        headline: String,
        subtext: String,
        kiez: String,
        kind: String,
        color: String,
        author: String,
        mediaUri: String?,
        isVideo: Boolean,
        durationHours: Int
    ) -> Unit,
    onLogout: () -> Unit = {},
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var tokenInput by remember { mutableStateOf("") }
    var loginError by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) } // Eye icon toggle

    // Story editing modal state
    var editingStory by remember { mutableStateOf<KiezStory?>(null) }
    var editHeadline by remember { mutableStateOf("") }
    var editSubtext by remember { mutableStateOf("") }

    // Story full preview dialog for Admin
    var previewStory by remember { mutableStateOf<KiezStory?>(null) }

    // Admin create story dialog (+ Neue Story (Admin))
    var showAdminCreateStoryDialog by remember { mutableStateOf(false) }
    var showLogoutConfirmDialog by remember { mutableStateOf(false) }

    androidx.activity.compose.BackHandler {
        if (isAuthenticated) {
            showLogoutConfirmDialog = true
        } else {
            onBack()
        }
    }

    if (showLogoutConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirmDialog = false },
            title = {
                Text(
                    text = if (language == AppLanguage.TURKISH) "Admin Çıkışı" else "Admin-Abmeldung",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = if (language == AppLanguage.TURKISH)
                        "Çıkış yapmak istiyor musunuz?\n\n'Açık Bırak' derseniz bu cihazda oturum açık kalır ve tekrar şifre sormaz.\n'Oturumu Kapat' derseniz oturum sonlanır ve tekrar şifre girmeniz gerekir."
                    else
                        "Möchten Sie sich wirklich abmelden?\n\n'Angemeldet bleiben' hält die Admin-Sitzung auf diesem Gerät dauerhaft aktiv.\n'Abmelden' sperrt den Zugang und erfordert erneute Passworteingabe.",
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutConfirmDialog = false
                        onLogout()
                        onBack()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                ) {
                    Text(if (language == AppLanguage.TURKISH) "Evet, Oturumu Kapat" else "Ja, Abmelden", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = {
                        showLogoutConfirmDialog = false
                        onBack()
                    }
                ) {
                    Text(if (language == AppLanguage.TURKISH) "Hayır, Açık Bırak & Ana Sayfa" else "Nein, Angemeldet bleiben")
                }
            }
        )
    }

    // If not authenticated, show the login box matching admin.html with EYE TOGGLE
    if (!isAuthenticated) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("My Kiez Berlin Admin", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(Color(0xFF141B22)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1C252E)),
                    elevation = CardDefaults.cardElevation(8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = BerlinRed.copy(alpha = 0.15f),
                            modifier = Modifier.size(56.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = null,
                                    tint = BerlinRed,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                        }

                        Text(
                            text = "My Kiez Berlin Admin",
                            color = Color(0xFFE9ECE6),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = "Admin-Token eingeben (z. B. admin123 oder kiez2026)",
                            color = Color(0xFFA9B3BC),
                            fontSize = 13.sp
                        )

                        OutlinedTextField(
                            value = tokenInput,
                            onValueChange = {
                                tokenInput = it
                                loginError = false
                            },
                            label = { Text("Admin-Token", color = Color(0xFFA9B3BC)) },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Icon(
                                        imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = if (passwordVisible) "Passwort verbergen" else "Passwort anzeigen",
                                        tint = if (passwordVisible) BerlinRed else Color(0xFFA9B3BC)
                                    )
                                }
                            },
                            isError = loginError,
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = BerlinRed,
                                unfocusedBorderColor = Color(0xFF4A5866)
                            )
                        )

                        if (loginError) {
                            Text(
                                text = "Ungültiger Token! (Standard: admin123)",
                                color = BerlinRed,
                                fontSize = 12.sp
                            )
                        }

                        Button(
                            onClick = {
                                if (tokenInput.isNotBlank()) {
                                    val ok = onLogin(tokenInput)
                                    if (!ok) loginError = true
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F9D55))
                        ) {
                            Text("Anmelden", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }
        }
        return
    }

    // Authenticated Admin Dashboard (recreating admin.html & admin-stories.js)
    val pendingStories = stories.filter { it.status == "pending" }
    val approvedStories = stories.filter { it.status == "approved" }
    val rejectedOrOldStories = stories.filter { it.status == "rejected" || it.status == "expired" }

    var tabMenuExpanded by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "My Kiez Berlin Admin" else "My Kiez Berlin Admin",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "Onay Bekleyen: ${pendingStories.size} · Yayında: ${approvedStories.size}"
                            else
                                "Zu prüfen: ${pendingStories.size} · Online: ${approvedStories.size}",
                            fontSize = 11.sp,
                            color = Color(0xFFA9B3BC)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    // Small + Story button
                    FilledTonalButton(
                        onClick = { showAdminCreateStoryDialog = true },
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.padding(end = 4.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (language == AppLanguage.TURKISH) "+ Story" else "+ Story", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    // Logout Button with Confirmation
                    IconButton(
                        onClick = { showLogoutConfirmDialog = true },
                        modifier = Modifier.padding(end = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Logout,
                            contentDescription = "Logout",
                            tint = Color(0xFFEF4444)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF141B22),
                    titleContentColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        // ENTIRE ADMIN DASHBOARD IN ONE SINGLE LAZYCOLUMN - NOTHING IS FIXED!
        // When admin scrolls, header and menus scroll up naturally, giving 100% of the screen to stories!
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFF141B22))
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 1. Compact Admin Overview Card (Clean, no huge text, no green light)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1C252E))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Kullanıcı Hikayeleri Yönetimi" else "Story-Manager & Freigabe",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = if (language == AppLanguage.TURKISH)
                                    "Kullanıcıların paylaştığı fotoğraf ve videoları inceleyip onaylayın."
                                else
                                    "Eingereichte Stories prüfen, ansehen und freigeben.",
                                color = Color(0xFFA9B3BC),
                                fontSize = 11.sp
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = if (pendingStories.isNotEmpty()) Color(0xFFD97706).copy(alpha = 0.2f) else Color(0xFF26323D)
                        ) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "${pendingStories.size} Bekliyor" else "${pendingStories.size} Zu prüfen",
                                color = if (pendingStories.isNotEmpty()) Color(0xFFFBBF24) else Color(0xFFA9B3BC),
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }

            // 2. Compact Hamburger Menu / Dropdown Selector for Navigation Tabs
            item {
                val tabLabels = listOf(
                    "pending" to (if (language == AppLanguage.TURKISH) "🟡 Onay Bekleyenler (${pendingStories.size})" else "🟡 Zu prüfen (${pendingStories.size})"),
                    "approved" to (if (language == AppLanguage.TURKISH) "🟢 Yayındakiler (${approvedStories.size})" else "🟢 Online (${approvedStories.size})"),
                    "rejected" to (if (language == AppLanguage.TURKISH) "🔴 Reddedilen / Eski (${rejectedOrOldStories.size})" else "🔴 Abgelaufen (${rejectedOrOldStories.size})"),
                    "sponsors" to (if (language == AppLanguage.TURKISH) "🏢 Sponsörler (${SampleData.sponsors.size})" else "🏢 Sponsoren (${SampleData.sponsors.size})"),
                    "jobs" to "💼 Jobs",
                    "requests" to (if (language == AppLanguage.TURKISH) "📢 Reklam Talepleri" else "📢 Werbeanfragen"),
                    "posts" to "📰 Kiez-Reporter"
                )

                val activeLabel = tabLabels.firstOrNull { it.first == currentTab }?.second ?: currentTab

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Dropdown / Hamburger Menu Selector
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFF1C252E),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { tabMenuExpanded = true }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Menu,
                                    contentDescription = "Menü",
                                    tint = Color(0xFFCBD5E1),
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = activeLabel,
                                    color = Color.White,
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = null,
                                tint = Color(0xFFA9B3BC)
                            )
                        }

                        DropdownMenu(
                            expanded = tabMenuExpanded,
                            onDismissRequest = { tabMenuExpanded = false }
                        ) {
                            tabLabels.forEach { (key, label) ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = label,
                                            fontWeight = if (currentTab == key) FontWeight.Bold else FontWeight.Normal,
                                            color = if (currentTab == key) BerlinGreen else Color.Unspecified
                                        )
                                    },
                                    onClick = {
                                        onTabChange(key)
                                        tabMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Quick 3-chip switch row (Zu prüfen, Online, Abgelehnt)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(
                            "pending" to (if (language == AppLanguage.TURKISH) "Onay (${pendingStories.size})" else "Prüfen (${pendingStories.size})"),
                            "approved" to (if (language == AppLanguage.TURKISH) "Online (${approvedStories.size})" else "Online (${approvedStories.size})"),
                            "rejected" to (if (language == AppLanguage.TURKISH) "Reddedilen" else "Archiv")
                        ).forEach { (key, label) ->
                            val isSelected = currentTab == key
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (isSelected) Color(0xFFE9ECE6) else Color(0xFF26323D),
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { onTabChange(key) }
                            ) {
                                Text(
                                    text = label,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                    modifier = Modifier.padding(vertical = 7.dp),
                                    color = if (isSelected) Color(0xFF141B22) else Color(0xFFCBD5E1),
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }

            // Tab Content Items (Fully Scrollable in the main LazyColumn)
            when (currentTab) {
                "pending" -> {
                    if (pendingStories.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Onay bekleyen hikaye yok. 🎉" else "Keine ausstehenden Stories zur Prüfung. 🎉",
                                    color = Color(0xFFA9B3BC)
                                )
                            }
                        }
                    } else {
                        items(pendingStories) { story ->
                            AdminStoryCard(
                                story = story,
                                isPending = true,
                                onPreview = { previewStory = story },
                                onApprove = { hours ->
                                    onApproveStory(story.id, hours)
                                    Toast.makeText(
                                        context,
                                        if (language == AppLanguage.TURKISH) "Hikaye onaylandı ve yayına alındı!" else "Story freigegeben!",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                },
                                onReject = {
                                    onRejectStory(story.id, "Von Admin abgelehnt")
                                    Toast.makeText(
                                        context,
                                        if (language == AppLanguage.TURKISH) "Hikaye reddedildi!" else "Story abgelehnt!",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                },
                                onExtend = { h -> onExtendStory(story.id, h) },
                                onDelete = {
                                    onDeleteStory(story.id)
                                    Toast.makeText(
                                        context,
                                        if (language == AppLanguage.TURKISH) "Hikaye silindi!" else "Story gelöscht!",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                },
                                onEdit = {
                                    editingStory = story
                                    editHeadline = story.headline
                                    editSubtext = story.subtext
                                }
                            )
                        }
                    }
                }

                "approved" -> {
                    if (approvedStories.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Yayında olan hikaye yok." else "Keine aktiven Stories online.",
                                    color = Color(0xFFA9B3BC)
                                )
                            }
                        }
                    } else {
                        items(approvedStories) { story ->
                            AdminStoryCard(
                                story = story,
                                isPending = false,
                                onPreview = { previewStory = story },
                                onApprove = { h -> onApproveStory(story.id, h) },
                                onReject = { onRejectStory(story.id, "Gesperrt") },
                                onExtend = { h ->
                                    onExtendStory(story.id, h)
                                    Toast.makeText(context, "+$h Std. verlängert!", Toast.LENGTH_SHORT).show()
                                },
                                onDelete = {
                                    onDeleteStory(story.id)
                                    Toast.makeText(context, "Story gelöscht!", Toast.LENGTH_SHORT).show()
                                },
                                onEdit = {
                                    editingStory = story
                                    editHeadline = story.headline
                                    editSubtext = story.subtext
                                }
                            )
                        }
                    }
                }

                "rejected" -> {
                    if (rejectedOrOldStories.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Reddedilen hikaye yok." else "Keine abgelehnten Stories.",
                                    color = Color(0xFFA9B3BC)
                                )
                            }
                        }
                    } else {
                        items(rejectedOrOldStories) { story ->
                            AdminStoryCard(
                                story = story,
                                isPending = false,
                                onPreview = { previewStory = story },
                                onApprove = { h -> onApproveStory(story.id, h) },
                                onReject = { onRejectStory(story.id, "Abgelehnt") },
                                onExtend = { h -> onExtendStory(story.id, h) },
                                onDelete = { onDeleteStory(story.id) },
                                onEdit = {
                                    editingStory = story
                                    editHeadline = story.headline
                                    editSubtext = story.subtext
                                }
                            )
                        }
                    }
                }

                "sponsors" -> {
                    item {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Aktif Sponsörler (${SampleData.sponsors.size})" else "Aktive Sponsoren (${SampleData.sponsors.size})",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 15.sp
                        )
                    }
                    items(SampleData.sponsors) { sp ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1C252E))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .width(100.dp)
                                        .height(60.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.White),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Image(
                                        painter = painterResource(id = sp.drawableRes),
                                        contentDescription = sp.name,
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier.fillMaxSize().padding(4.dp)
                                    )
                                }

                                Column(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                        Text(sp.name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                        Text("Aktiv", color = Color(0xFF1F9D55), fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                    }
                                    Text(sp.headlineDe, color = Color(0xFFA9B3BC), fontSize = 11.5.sp)
                                    Text("239 Einblendungen · 10 Klicks · 4.2% CTR", color = Color(0xFF718096), fontSize = 10.5.sp)
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 4.dp)) {
                                        Button(
                                            onClick = { Toast.makeText(context, "Sponsor pausiert", Toast.LENGTH_SHORT).show() },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF26323D)),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Text("Pausieren", fontSize = 10.sp, color = Color.White)
                                        }
                                        Button(
                                            onClick = { Toast.makeText(context, "Bericht kopiert", Toast.LENGTH_SHORT).show() },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF26323D)),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Text("Bericht kopieren", fontSize = 10.sp, color = Color.White)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                "requests" -> {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1C252E))
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("ErsenBox (Banner-Werbung)", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                Text("John Cloud · johncloud401@gmail.com · 0176 82015455", color = Color(0xFFA9B3BC), fontSize = 12.sp)
                                Text("Status: Ausstehende Prüfung", color = BerlinYellow, fontSize = 11.sp)
                            }
                        }
                    }
                }

                else -> {
                    item {
                        Text("Bereich '${currentTab}' geladen.", color = Color(0xFFA9B3BC))
                    }
                }
            }
        }
    }

    // Story Fullscreen Preview Dialog (Admin can click preview on any card)
    previewStory?.let { story ->
        StoryViewerDialog(
            story = story,
            language = language,
            onClose = { previewStory = null }
        )
    }

    // Story Edit Dialog
    if (editingStory != null) {
        Dialog(onDismissRequest = { editingStory = null }) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1C252E))
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Story bearbeiten", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)

                    OutlinedTextField(
                        value = editHeadline,
                        onValueChange = { editHeadline = it },
                        label = { Text("Überschrift", color = Color(0xFFA9B3BC)) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )

                    OutlinedTextField(
                        value = editSubtext,
                        onValueChange = { editSubtext = it },
                        label = { Text("Zusatztext", color = Color(0xFFA9B3BC)) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = { editingStory = null }) {
                            Text("Abbrechen", color = Color(0xFFA9B3BC))
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                onUpdateStory(editingStory!!.id, editHeadline, editSubtext)
                                editingStory = null
                                Toast.makeText(context, "Story gespeichert!", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F9D55))
                        ) {
                            Text("Speichern", color = Color.White)
                        }
                    }
                }
            }
        }
    }

    // + Neue Story (Admin) Dialog
    if (showAdminCreateStoryDialog) {
        AdminCreateStoryModal(
            language = language,
            onDismiss = { showAdminCreateStoryDialog = false },
            onSubmit = { h, s, k, kd, c, a, uri, isVid, dur ->
                onAddAdminStory(h, s, k, kd, c, a, uri, isVid, dur)
                showAdminCreateStoryDialog = false
                Toast.makeText(context, "Admin-Story direkt online veröffentlicht!", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@Composable
fun AdminStoryCard(
    story: KiezStory,
    isPending: Boolean,
    onPreview: () -> Unit,
    onApprove: (Int?) -> Unit,
    onReject: () -> Unit,
    onExtend: (Int) -> Unit,
    onDelete: () -> Unit,
    onEdit: () -> Unit
) {
    var selectedDuration by remember { mutableStateOf<Int?>(null) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1C252E)),
        border = if (story.status == "rejected") androidx.compose.foundation.BorderStroke(1.dp, BerlinRed) else null
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Header: Category, Kiez, Color, Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${story.kind.uppercase()} · ${story.kiez} · ${story.headlineColor}",
                    color = Color(0xFFA9B3BC),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )

                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = when (story.status) {
                        "approved" -> Color(0xFF1F9D55)
                        "rejected" -> BerlinRed
                        else -> Color(0xFFD97706)
                    }
                ) {
                    Text(
                        text = when (story.status) {
                            "approved" -> "Online"
                            "rejected" -> "Abgelehnt"
                            else -> "Zu prüfen"
                        },
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Main Body: 9:16 Photo/Video Thumbnail on Left + Headline & Content on Right (Matching Image 1 & admin-stories.js)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Media Thumbnail Preview (Clean aspect ratio box, fully visible with clear preview button)
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.width(92.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(125.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .border(1.dp, Color(0xFF4A5866), RoundedCornerShape(8.dp))
                            .background(Color(0xFF18191A))
                            .clickable { onPreview() },
                        contentAlignment = Alignment.Center
                    ) {
                        if (story.mediaUri != null) {
                            AsyncImage(
                                model = story.mediaUri,
                                contentDescription = story.headline,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                            if (story.isVideo) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(Color.Black.copy(alpha = 0.35f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(imageVector = Icons.Default.PlayCircle, contentDescription = "Video", tint = Color.White, modifier = Modifier.size(28.dp))
                                }
                            }
                        } else if (story.mediaResId != null) {
                            Image(
                                painter = painterResource(id = story.mediaResId),
                                contentDescription = story.headline,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            // Text story thumbnail with category icon
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = when (story.kind) {
                                        "traffic" -> Icons.Default.Traffic
                                        "event" -> Icons.Default.Celebration
                                        "warn" -> Icons.Default.Warning
                                        else -> Icons.Default.Newspaper
                                    },
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(story.kiez.take(2).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            }
                        }

                        // "Vorschau" Badge
                        Surface(
                            shape = RoundedCornerShape(topStart = 4.dp),
                            color = Color.Black.copy(alpha = 0.75f),
                            modifier = Modifier.align(Alignment.BottomEnd)
                        ) {
                            Text("Büyük Gör", color = Color.White, fontSize = 8.sp, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFF26323D),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onPreview() }
                    ) {
                        Row(
                            modifier = Modifier.padding(vertical = 3.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Visibility, contentDescription = null, tint = Color(0xFF60A5FA), modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(3.dp))
                            Text("Önizle", fontSize = 10.sp, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Story Content & Details
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Text(
                        text = story.headline,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        maxLines = 3
                    )

                    if (story.subtext.isNotBlank()) {
                        Text(
                            text = story.subtext,
                            color = Color(0xFFCBD5E1),
                            fontSize = 11.5.sp,
                            maxLines = 4,
                            lineHeight = 15.sp
                        )
                    }

                    Text(
                        text = "Gönderen: ${story.author} · ${story.timeAgo}",
                        color = Color(0xFF94A3B8),
                        fontSize = 10.5.sp
                    )

                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = if (story.modNote.contains("OK") || story.modNote.contains("Admin")) Color(0xFF1F9D55).copy(alpha = 0.2f) else BerlinRed.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = story.modNote,
                            color = if (story.modNote.contains("OK") || story.modNote.contains("Admin")) Color(0xFF4ADE80) else Color(0xFFF87171),
                            fontSize = 9.5.sp,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                        )
                    }
                }
            }

            // Action Buttons matching admin-stories.js
            Divider(color = Color(0xFF334155), modifier = Modifier.padding(vertical = 4.dp))

            if (isPending || story.status == "pending") {
                // Duration selection row (24h, 48h, 7 Tage, 30 Tage)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Yayın:", color = Color(0xFFA9B3BC), fontSize = 10.5.sp)
                    listOf(24 to "24s", 48 to "48s", 168 to "7 Gün", 720 to "30 Gün").forEach { (h, lbl) ->
                        FilterChip(
                            selected = (selectedDuration ?: story.durationHours) == h,
                            onClick = { selectedDuration = h },
                            label = { Text(lbl, fontSize = 10.sp) },
                            modifier = Modifier.height(26.dp)
                        )
                    }
                }

                // Pending actions: Duration select, Freigeben, Ablehnen
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = { onApprove(selectedDuration ?: story.durationHours) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F9D55)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1.2f)
                    ) {
                        Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Onayla & Canlıya Al", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.5.sp)
                    }

                    Button(
                        onClick = onReject,
                        colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(0.8f)
                    ) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Reddet", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.5.sp)
                    }
                }
            } else if (story.status == "approved") {
                // Approved actions: Bearbeiten, +1 Tag, +7 Tage, Löschen
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Button(
                        onClick = onEdit,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF26323D)),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Bearbeiten", fontSize = 11.sp, color = Color.White)
                    }

                    Button(
                        onClick = { onExtend(24) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF26323D)),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("+1 Tag", fontSize = 11.sp, color = Color.White)
                    }

                    Button(
                        onClick = { onExtend(168) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF26323D)),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("+7 Tage", fontSize = 11.sp, color = Color.White)
                    }

                    Button(
                        onClick = onDelete,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("Löschen", fontSize = 11.sp, color = Color(0xFFE2E8F0))
                    }
                }
            } else {
                // Rejected actions: Wieder online, Löschen
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { onApprove(48) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F9D55)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Wieder online (48h)", color = Color.White, fontSize = 12.sp)
                    }

                    Button(
                        onClick = onDelete,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF26323D)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Endgültig löschen", color = Color(0xFFEF4444), fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// Modal for + Neue Story (Admin) allowing direct admin posting with photo/video
@Composable
fun AdminCreateStoryModal(
    language: AppLanguage,
    onDismiss: () -> Unit,
    onSubmit: (
        headline: String,
        subtext: String,
        kiez: String,
        kind: String,
        color: String,
        author: String,
        mediaUri: String?,
        isVideo: Boolean,
        durationHours: Int
    ) -> Unit
) {
    var headline by remember { mutableStateOf("") }
    var subtext by remember { mutableStateOf("") }
    var selectedKiez by remember { mutableStateOf("Mitte") }
    var selectedKind by remember { mutableStateOf("news") }
    var selectedColor by remember { mutableStateOf("blau") }
    var author by remember { mutableStateOf("Admin") }
    var selectedDurationHours by remember { mutableIntStateOf(48) }

    var selectedMediaUri by remember { mutableStateOf<String?>(null) }
    var isVideoMedia by remember { mutableStateOf(false) }
    val context = LocalContext.current

    val photoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            selectedMediaUri = uri.toString()
            isVideoMedia = false
        }
    }

    val videoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            selectedMediaUri = uri.toString()
            isVideoMedia = true
        }
    }

    var showCustomKiezDialog by remember { mutableStateOf(false) }
    var customKiezInput by remember { mutableStateOf("") }

    val kieze = remember(showCustomKiezDialog) {
        val base = com.example.data.repository.KiezStorageManager.ALL_BERLIN_OFFICIAL_KIEZE
        val custom = com.example.data.repository.KiezStorageManager.loadCustomKieze(context)
        (base + custom).distinct()
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1C252E)),
            elevation = CardDefaults.cardElevation(8.dp),
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.92f)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("+ Neue Story (Admin)", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                }

                Text(
                    text = "Direkt als Administrator ohne Prüfung veröffentlichen (sofort 'Online').",
                    color = Color(0xFFA9B3BC),
                    fontSize = 11.5.sp
                )

                // Media Picker Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { photoPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF26323D)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(imageVector = Icons.Default.Image, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Bild wählen", fontSize = 11.sp, color = Color.White)
                    }

                    Button(
                        onClick = { videoPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly)) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF26323D)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(imageVector = Icons.Default.Videocam, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Video (1 Min)", fontSize = 11.sp, color = Color.White)
                    }
                }

                if (selectedMediaUri != null) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color(0xFF26323D),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isVideoMedia) "Video ausgewählt" else "Bild ausgewählt",
                                color = Color(0xFF4ADE80),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            IconButton(onClick = { selectedMediaUri = null }, modifier = Modifier.size(24.dp)) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Remove", tint = Color.White)
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = headline,
                    onValueChange = { headline = it },
                    label = { Text("Überschrift (z.B. Event oder Angebot)", color = Color(0xFFA9B3BC)) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                OutlinedTextField(
                    value = subtext,
                    onValueChange = { subtext = it },
                    label = { Text("Zusatztext / Beschreibung", color = Color(0xFFA9B3BC)) },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                // Kiez selection chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Kiez:", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text(
                        text = if (language == AppLanguage.TURKISH) "+ Yeni Mahalle Ekle" else "+ Neuer Kiez",
                        color = Color(0xFFFFCC00),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable { showCustomKiezDialog = true }
                    )
                }

                if (showCustomKiezDialog) {
                    AlertDialog(
                        onDismissRequest = { showCustomKiezDialog = false },
                        title = { Text(if (language == AppLanguage.TURKISH) "Yeni Mahalle Ekle" else "Neuen Kiez hinzufügen") },
                        text = {
                            OutlinedTextField(
                                value = customKiezInput,
                                onValueChange = { customKiezInput = it },
                                label = { Text("Mahalle / Kiez Adı") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                        },
                        confirmButton = {
                            Button(
                                onClick = {
                                    if (customKiezInput.isNotBlank()) {
                                        val trimmed = customKiezInput.trim()
                                        com.example.data.repository.KiezStorageManager.saveCustomKiez(context, trimmed)
                                        selectedKiez = trimmed
                                        customKiezInput = ""
                                        showCustomKiezDialog = false
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F9D55))
                            ) {
                                Text("Speichern / Kaydet", color = Color.White)
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showCustomKiezDialog = false }) {
                                Text("Abbrechen")
                            }
                        }
                    )
                }

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(kieze) { kiezName ->
                        FilterChip(
                            selected = selectedKiez == kiezName,
                            onClick = { selectedKiez = kiezName },
                            label = { Text(kiezName, fontSize = 11.sp) }
                        )
                    }
                }

                // Category kind selection
                Text("Kategorie:", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    listOf("news" to "News", "event" to "Event", "traffic" to "Verkehr", "warn" to "Polizei/Warnung").forEach { (kd, label) ->
                        FilterChip(
                            selected = selectedKind == kd,
                            onClick = { selectedKind = kd },
                            label = { Text(label, fontSize = 11.sp) }
                        )
                    }
                }

                // Color selection
                Text("Farbe:", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    listOf("blau" to "Blau", "rot" to "Rot", "gelb" to "Gelb", "weiss" to "Weiß").forEach { (c, label) ->
                        FilterChip(
                            selected = selectedColor == c,
                            onClick = { selectedColor = c },
                            label = { Text(label, fontSize = 11.sp) }
                        )
                    }
                }

                OutlinedTextField(
                    value = author,
                    onValueChange = { author = it },
                    label = { Text("Autor / Quelle (z.B. Polizei Berlin, Kiez-Team)", color = Color(0xFFA9B3BC)) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Text("Laufzeit (Admin: 100% Kostenlos · Keine Gebühren):", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(
                        listOf(
                            24 to "24 Std. (0€)",
                            48 to "48 Std. (0€)",
                            168 to "7 Tage (0€)",
                            720 to "30 Tage (0€)",
                            2160 to "90 Tage (0€)",
                            9999 to "Unbegrenzt (0€)"
                        )
                    ) { (h, label) ->
                        FilterChip(
                            selected = selectedDurationHours == h,
                            onClick = { selectedDurationHours = h },
                            label = { Text(label, fontSize = 11.sp) }
                        )
                    }
                }

                Button(
                    onClick = {
                        if (headline.isNotBlank()) {
                            onSubmit(
                                headline,
                                subtext,
                                selectedKiez,
                                selectedKind,
                                selectedColor,
                                author.ifBlank { "Admin" },
                                selectedMediaUri,
                                isVideoMedia,
                                selectedDurationHours
                            )
                        }
                    },
                    enabled = headline.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F9D55)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Sofort veröffentlichen", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
