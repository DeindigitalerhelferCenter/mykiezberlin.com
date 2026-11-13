package com.example

import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.model.AppLanguage
import com.example.data.repository.KiezNotificationWorker
import com.example.ui.components.ClassifiedPromoDialog
import com.example.ui.components.GoalCelebrationHost
import com.example.ui.components.HamburgerHubModal
import com.example.ui.components.InAppAlertBannerComponent
import com.example.ui.components.KiezStoriesBar
import com.example.ui.components.MyKiezBottomNav
import com.example.ui.components.MyKiezTopBar
import com.example.ui.components.StoryCreateDialog
import com.example.ui.components.StoryViewerDialog
import com.example.ui.screens.*
import com.example.ui.theme.BerlinBlue
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.AppScreen
import com.example.ui.viewmodel.MyKiezViewModel

class MainActivity : ComponentActivity() {
    // Compose state, so a notification tap also navigates while the app is already open.
    private var launchTarget by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        launchTarget = intent?.getStringExtra("extra_target_screen")
        readShareIntent(intent)
        KiezNotificationWorker.schedule(applicationContext)
        setContent {
            val viewModel: MyKiezViewModel = viewModel()
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()

            val context = LocalContext.current
            // Admin session check + instant story alarm on the admin phone (v1.15)
            LaunchedEffect(Unit) { viewModel.verifyAdminSession() }

            val permissionLauncher = rememberLauncherForActivityResult(
                ActivityResultContracts.RequestPermission()
            ) { isGranted ->
                if (isGranted) {
                    viewModel.triggerTestNotification()
                }
            }

            LaunchedEffect(Unit) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (ContextCompat.checkSelfPermission(
                            context,
                            android.Manifest.permission.POST_NOTIFICATIONS
                        ) != PackageManager.PERMISSION_GRANTED
                    ) {
                        permissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
                    }
                }
            }

            // Handle incoming notification navigation clicks
            LaunchedEffect(launchTarget) {
                launchTarget?.let { target ->
                    when (target) {
                        "BUSINESS_PORTAL" -> viewModel.navigateTo(AppScreen.BUSINESS_PORTAL)
                        "ADMIN" -> viewModel.navigateTo(AppScreen.ADMIN)
                        "LIVE_BULLETIN" -> viewModel.navigateTo(AppScreen.LIVE_BULLETIN)
                        "NOTRUF" -> viewModel.navigateTo(AppScreen.NOTRUF)
                        "SPORTS_AND_MARKETS" -> viewModel.navigateTo(AppScreen.SPORTS_AND_MARKETS)
                        // Hourly invitations
                        "ADD_STORY" -> { viewModel.navigateTo(AppScreen.HOME); viewModel.openAddStoryDialog() }
                        "WERBEN" -> viewModel.openWerben()
                        else -> if (target.startsWith("SHARE_STORY:")) {
                            // Admin: planned story is online -> open it with the share buttons
                            viewModel.navigateTo(AppScreen.HOME)
                            viewModel.openStoryById(target.removePrefix("SHARE_STORY:"))
                        } else {
                            AppScreen.entries.firstOrNull { it.name == target }?.let { viewModel.navigateTo(it) }
                        }
                    }
                }
            }

            // Text / picture shared from WhatsApp or another app opens "Story teilen" prefilled
            LaunchedEffect(sharedPayload) {
                sharedPayload?.let { share ->
                    viewModel.startSharedStory(share.text, share.mediaUri, share.isVideo)
                    sharedPayload = null
                }
            }

            BatteryHintDialog(language = uiState.language)

            MyApplicationTheme(darkTheme = uiState.isDarkMode) {
                MyKiezMainApp(viewModel)
            }
        }
    }

    // Coming back to the app refreshes weather, quotes and sport right away instead of
    // waiting for the next 60 s / 15 min cycle (Android pauses network while in background).
    override fun onResume() {
        super.onResume()
        com.example.data.repository.LiveBerlinFeedRepository.refreshLiveFeeds()
        com.example.data.repository.LiveBerlinFeedRepository.refreshSportData()
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        launchTarget = intent.getStringExtra("extra_target_screen")
        readShareIntent(intent)
    }

    private class SharedPayload(val text: String?, val mediaUri: String?, val isVideo: Boolean)

    private var sharedPayload by mutableStateOf<SharedPayload?>(null)

    /** "Teilen → My Kiez Berlin": text and/or one picture or video from another app. */
    private fun readShareIntent(intent: android.content.Intent?) {
        if (intent?.action != android.content.Intent.ACTION_SEND) return
        val type = intent.type.orEmpty()
        val text = intent.getStringExtra(android.content.Intent.EXTRA_TEXT)
            ?: intent.getStringExtra(android.content.Intent.EXTRA_SUBJECT)
        val stream: android.net.Uri? = if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableExtra(android.content.Intent.EXTRA_STREAM, android.net.Uri::class.java)
        } else {
            @Suppress("DEPRECATION") intent.getParcelableExtra(android.content.Intent.EXTRA_STREAM)
        }
        if (text.isNullOrBlank() && stream == null) return
        sharedPayload = SharedPayload(text, stream?.toString(), type.startsWith("video/"))
        // handled once; a rotation must not open the dialog again
        intent.action = android.content.Intent.ACTION_MAIN
    }
}

/** Xiaomi / HyperOS and others stop background work: ask once to allow it, so notifications arrive. */
@Composable
private fun BatteryHintDialog(language: AppLanguage) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("kiez_battery_hint", android.content.Context.MODE_PRIVATE) }
    val powerManager = remember { context.getSystemService(android.content.Context.POWER_SERVICE) as android.os.PowerManager }
    var show by remember {
        mutableStateOf(!prefs.getBoolean("asked", false) && !powerManager.isIgnoringBatteryOptimizations(context.packageName))
    }
    if (!show) return
    val tr = language == AppLanguage.TURKISH
    val en = language == AppLanguage.ENGLISH
    AlertDialog(
        onDismissRequest = { prefs.edit().putBoolean("asked", true).apply(); show = false },
        title = { Text(if (tr) "🔔 Haberler kaçmasın" else if (en) "🔔 Don't miss the news" else "🔔 Keine Meldung verpassen", fontWeight = FontWeight.Bold) },
        text = {
            Text(
                if (tr) "Bildirimlerin zamanında gelmesi için My Kiez Berlin'in arka planda çalışmasına izin ver (pil: Kısıtlama yok)."
                else if (en) "Allow My Kiez Berlin to run in the background (battery: no restrictions) so notifications arrive on time."
                else "Erlaube My Kiez Berlin im Hintergrund zu laufen (Akku: keine Einschränkungen), damit Meldungen pünktlich ankommen."
            )
        },
        confirmButton = {
            Button(onClick = {
                prefs.edit().putBoolean("asked", true).apply()
                show = false
                try {
                    @android.annotation.SuppressLint("BatteryLife")
                    val intent = android.content.Intent(
                        android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                        android.net.Uri.parse("package:" + context.packageName)
                    )
                    context.startActivity(intent)
                } catch (_: Exception) {
                    try {
                        context.startActivity(android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, android.net.Uri.parse("package:" + context.packageName)))
                    } catch (_: Exception) {}
                }
            }) { Text(if (tr) "İzin ver" else if (en) "Allow" else "Erlauben") }
        },
        dismissButton = {
            TextButton(onClick = { prefs.edit().putBoolean("asked", true).apply(); show = false }) {
                Text(if (tr) "Sonra" else if (en) "Later" else "Später")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyKiezMainApp(viewModel: MyKiezViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showMoreBottomSheet by remember { mutableStateOf(false) }
    var showHamburgerMenu by remember { mutableStateOf(false) }

    GoalCelebrationHost()
    ClassifiedPromoDialog(
        language = uiState.language,
        onOpen = { viewModel.navigateTo(AppScreen.COMMUNITY) }
    )

    // 2026-11-14 (owner): the top part (search box, live banner, sponsor place) gets out of the way while scrolling
    // down and comes back when scrolling up or opening another page – the page itself gets the room
    var headerShown by remember { mutableStateOf(true) }
    LaunchedEffect(uiState.currentScreen) { headerShown = true }
    val headerScroll = remember {
        object : androidx.compose.ui.input.nestedscroll.NestedScrollConnection {
            override fun onPreScroll(available: androidx.compose.ui.geometry.Offset, source: androidx.compose.ui.input.nestedscroll.NestedScrollSource): androidx.compose.ui.geometry.Offset {
                if (available.y < -6f) headerShown = false else if (available.y > 6f) headerShown = true
                return androidx.compose.ui.geometry.Offset.Zero
            }
        }
    }
    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .testTag("my_kiez_scaffold"),
        topBar = {
            if (uiState.currentScreen != AppScreen.KIEZ_DETAIL) {
                MyKiezTopBar(
                    currentLanguage = uiState.language,
                    onLanguageChange = { viewModel.setLanguage(it) },
                    onNavigate = { viewModel.navigateTo(it) },
                    onOpenHamburgerMenu = { showHamburgerMenu = true },
                    showSearchBox = (uiState.currentScreen == AppScreen.HOME ||
                            uiState.currentScreen == AppScreen.BUSINESSES ||
                            uiState.currentScreen == AppScreen.FOOD ||
                            uiState.currentScreen == AppScreen.DEALS) && (headerShown || uiState.searchQuery.isNotBlank()),
                    searchQuery = uiState.searchQuery,
                    onSearchChange = { viewModel.setSearchQuery(it) },
                    isNotificationsEnabled = uiState.isNotificationsEnabled,
                    onToggleNotifications = { viewModel.toggleNotifications(it) },
                    onTriggerTestNotification = { viewModel.triggerTestNotification() }
                )
            }
        },
        bottomBar = {
            MyKiezBottomNav(
                currentScreen = uiState.currentScreen,
                currentLanguage = uiState.language,
                onNavigate = { viewModel.navigateTo(it) },
                onOpenMoreMenu = { showMoreBottomSheet = true }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            androidx.compose.animation.AnimatedVisibility(visible = headerShown) { Column {
            // Real-time In-App Live Alert Heads-up Banner (S-Bahn, BVG, Feuerwehr, Polizei)
            // Full-page web screens need the room; the ticker stays one tap away.
            if (uiState.currentScreen != AppScreen.KIEZ_MATCH && uiState.currentScreen != AppScreen.COMMUNITY && uiState.currentScreen != AppScreen.WERBEN) {
                InAppAlertBannerComponent(
                    alert = uiState.activeAlertBanner,
                    isLiveAvailable = uiState.isLiveAlertsAvailable,
                    language = uiState.language,
                    onNavigate = { viewModel.navigateTo(it) },
                    onDismiss = { viewModel.dismissAlertBanner() }
                )
            }

            // Sponsor on every page change, sized by its package (home and the business lists have their own sponsors)
            if (uiState.currentScreen !in setOf(AppScreen.HOME, AppScreen.BUSINESSES, AppScreen.KIEZ_BETRIEBE, AppScreen.KIEZ_MATCH, AppScreen.COMMUNITY, AppScreen.WERBEN, AppScreen.ADMIN)) {
                com.example.ui.components.PageSponsorSlot(
                    screenKey = uiState.currentScreen.name,
                    language = uiState.language,
                    activeKiez = uiState.activeKiezFilter,
                    showCoupons = uiState.currentScreen == AppScreen.DEALS
                )
            }
            } } // end of the part that hides while scrolling

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .nestedScroll(headerScroll)
            ) {
                when (uiState.currentScreen) {
                AppScreen.HOME, AppScreen.BUSINESSES -> BusinessesScreen(
                    language = uiState.language,
                    activeCategory = uiState.activeBusinessCategory,
                    onCategoryChange = { viewModel.setBusinessCategory(it) },
                    activeKiezFilter = uiState.activeKiezFilter,
                    onKiezFilterChange = { viewModel.setKiezFilter(it) },
                    selectedBusiness = uiState.selectedBusiness,
                    onSelectBusiness = { viewModel.openBusinessDetail(it) },
                    onCloseDetail = { viewModel.closeBusinessDetail() },
                    favoriteIds = uiState.favoriteIds,
                    onToggleFavorite = { viewModel.toggleFavorite(it) },
                    searchQuery = uiState.searchQuery,
                    customBusinesses = uiState.customBusinesses,
                    onAddBusiness = { viewModel.addCustomBusiness(it) },
                    stories = uiState.allStories,
                    onStoryClick = { clickedStory ->
                        val approvedList = uiState.allStories.filter { it.status == "approved" }
                        val idx = approvedList.indexOf(clickedStory).coerceAtLeast(0)
                        viewModel.openStory(clickedStory, approvedList, idx)
                    },
                    onAddStoryClick = { viewModel.openAddStoryDialog() },
                    viewMode = uiState.businessViewMode,
                    onViewModeChange = { viewModel.setBusinessViewMode(it) },
                    onResetFilters = { viewModel.resetFilters() },
                    showAddBusinessDialog = uiState.showAddBusinessDialog,
                    onOpenAddBusiness = { viewModel.openAddBusinessDialog() },
                    onCloseAddBusiness = { viewModel.closeAddBusinessDialog() },
                    onNavigateToScreen = { viewModel.navigateTo(it) },
                    showBusinessList = false,
                    onOpenWerben = { size, claim -> viewModel.openWerben(size, claim) }
                )

                // The 18 Kiez businesses (moved from the home page), reached from "Yeme & İçme"
                AppScreen.KIEZ_BETRIEBE -> BusinessesScreen(
                    language = uiState.language,
                    activeCategory = uiState.activeBusinessCategory,
                    onCategoryChange = { viewModel.setBusinessCategory(it) },
                    activeKiezFilter = uiState.activeKiezFilter,
                    onKiezFilterChange = { viewModel.setKiezFilter(it) },
                    selectedBusiness = uiState.selectedBusiness,
                    onSelectBusiness = { viewModel.openBusinessDetail(it) },
                    onCloseDetail = { viewModel.closeBusinessDetail() },
                    favoriteIds = uiState.favoriteIds,
                    onToggleFavorite = { viewModel.toggleFavorite(it) },
                    searchQuery = uiState.searchQuery,
                    customBusinesses = uiState.customBusinesses,
                    onAddBusiness = { viewModel.addCustomBusiness(it) },
                    viewMode = uiState.businessViewMode,
                    onViewModeChange = { viewModel.setBusinessViewMode(it) },
                    onResetFilters = { viewModel.resetFilters() },
                    showAddBusinessDialog = uiState.showAddBusinessDialog,
                    onOpenAddBusiness = { viewModel.openAddBusinessDialog() },
                    onCloseAddBusiness = { viewModel.closeAddBusinessDialog() },
                    onNavigateToScreen = { viewModel.navigateTo(it) },
                    showHomeExtras = false,
                    onOpenWerben = { size, claim -> viewModel.openWerben(size, claim) }
                )

                AppScreen.WERBEN -> com.example.ui.screens.KiezWebScreen(
                    url = viewModel.werbenUrl,
                    onBack = { viewModel.navigateTo(AppScreen.HOME) }
                )

                AppScreen.JOBS -> JobsScreen(
                    language = uiState.language,
                    customJobs = uiState.customJobs,
                    onAddJob = { t, c, k, tp, s, w, d -> viewModel.addJob(t, c, k, tp, s, w, d) }
                )

                AppScreen.NOTRUF -> EmergencyScreen(
                    language = uiState.language,
                    onNavigateToLiveBulletin = { viewModel.navigateTo(AppScreen.LIVE_BULLETIN) }
                )

                AppScreen.REPORTER -> KiezReporterScreen(
                    language = uiState.language,
                    customPosts = uiState.customReports,
                    onSubmitPost = { t, k, c, d, a -> viewModel.submitReporterPost(t, k, c, d, a) },
                    onAddComment = { postId, author, text -> viewModel.addReporterComment(postId, author, text) }
                )

                AppScreen.KIEZE -> KiezListScreen(
                    language = uiState.language,
                    onKiezClick = { viewModel.openKiezDetail(it) },
                    kiezeList = uiState.kieze
                )

                AppScreen.KIEZ_DETAIL -> KiezDetailScreen(
                    kiezId = uiState.selectedKiezId,
                    language = uiState.language,
                    onBack = { viewModel.navigateTo(AppScreen.KIEZE) },
                    onStartQuiz = { viewModel.navigateTo(AppScreen.QUIZ) },
                    onNavigate = { viewModel.navigateTo(it) },
                    isFavorite = uiState.favoriteIds.contains(uiState.selectedKiezId),
                    onToggleFavorite = { viewModel.toggleFavorite(uiState.selectedKiezId) },
                    allKieze = uiState.kieze
                )

                AppScreen.KIEZ_MAP -> KiezListScreen(
                    language = uiState.language,
                    onKiezClick = { viewModel.openKiezDetail(it) },
                    kiezeList = uiState.kieze
                )

                AppScreen.KIEZ_MATCH -> com.example.ui.screens.KiezMatchQuizScreen(
                    onBack = { viewModel.navigateTo(AppScreen.HOME) },
                    langCode = when (uiState.language) {
                        AppLanguage.TURKISH -> "tr"
                        AppLanguage.ENGLISH -> "en"
                        else -> "de"
                    }
                )

                AppScreen.COMMUNITY -> com.example.ui.screens.KiezWebScreen(
                    url = "https://mykiezberlin.com/community/?lang=" + if (uiState.language == AppLanguage.TURKISH) "tr" else "de",
                    onBack = { viewModel.navigateTo(AppScreen.HOME) }
                )

                AppScreen.QUIZ -> KiezQuizScreen(
                    currentIndex = uiState.quizCurrentIndex,
                    selectedOption = uiState.quizSelectedOption,
                    isAnswerChecked = uiState.quizIsAnswerChecked,
                    score = uiState.quizScore,
                    isFinished = uiState.quizFinished,
                    language = uiState.language,
                    onSelectOption = { viewModel.answerQuizOption(it) },
                    onNextQuestion = { viewModel.nextQuizQuestion() },
                    onRestart = { viewModel.restartQuiz() },
                    onNavigateHome = { viewModel.navigateTo(AppScreen.HOME) },
                    onNavigateKieze = { viewModel.navigateTo(AppScreen.KIEZE) }
                )

                AppScreen.FOOD -> Column(modifier = Modifier.fillMaxSize()) {
                    // Entry to the Kiez businesses that used to fill the home page
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                            .clickable { viewModel.navigateTo(AppScreen.KIEZ_BETRIEBE) }
                    ) {
                        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text("🏪", fontSize = 22.sp)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    if (uiState.language == AppLanguage.TURKISH) "Mahalle İşletmeleri (${com.example.data.repository.SampleData.businesses.size + uiState.customBusinesses.size})" else "Kiez-Betriebe (${com.example.data.repository.SampleData.businesses.size + uiState.customBusinesses.size})",
                                    fontWeight = FontWeight.Bold, fontSize = 15.sp
                                )
                                Text(
                                    if (uiState.language == AppLanguage.TURKISH) "Dükkanlar, kafeler, fırınlar – adres ve iletişim" else "Läden, Cafés, Bäckereien – Adressen und Kontakt",
                                    fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Text("→", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    Box(modifier = Modifier.weight(1f)) {
                        FoodScreen(
                            language = uiState.language,
                            activeCuisine = uiState.activeFoodCuisine,
                            onSelectCuisine = { viewModel.setFoodCuisine(it) },
                            favoriteIds = uiState.favoriteIds,
                            onToggleFavorite = { viewModel.toggleFavorite(it) }
                        )
                    }
                }

                AppScreen.EVENTS -> EventsScreen(
                    language = uiState.language,
                    activeFilter = uiState.activeEventFilter,
                    onFilterChange = { viewModel.setEventFilter(it) },
                    favoriteIds = uiState.favoriteIds,
                    onToggleFavorite = { viewModel.toggleFavorite(it) },
                    customEvents = uiState.customEvents,
                    showSubmitDialog = uiState.showEventSubmitDialog,
                    onOpenSubmit = { viewModel.openEventSubmitDialog() },
                    onCloseSubmit = { viewModel.closeEventSubmitDialog() },
                    onSubmitNewEvent = { t, k, d, tm, p, c, desc -> viewModel.submitNewEvent(t, k, d, tm, p, c, desc) },
                    submitSuccessMessage = uiState.eventSubmitSuccessMessage
                )

                AppScreen.DEALS -> DealsScreen(
                    language = uiState.language,
                    activeRedeemDeal = uiState.activeRedeemDeal,
                    onOpenRedeem = { viewModel.openRedeemDeal(it) },
                    onCloseRedeem = { viewModel.closeRedeemDeal() },
                    stories = uiState.allStories,
                    onOpenStory = { viewModel.openStory(it) }
                )

                AppScreen.KNOWLEDGE -> KnowledgeScreen(
                    language = uiState.language,
                    activeCategory = uiState.activeKnowledgeCategory,
                    onCategoryChange = { viewModel.setKnowledgeCategory(it) }
                )

                AppScreen.FAVORITES -> FavoritesScreen(
                    language = uiState.language,
                    activeTypeFilter = uiState.activeFavoritesTypeFilter,
                    onFilterChange = { viewModel.setFavoritesTypeFilter(it) },
                    favoriteIds = uiState.favoriteIds,
                    onToggleFavorite = { viewModel.toggleFavorite(it) },
                    onKiezClick = { viewModel.openKiezDetail(it) }
                )

                AppScreen.PROFILE -> ProfileScreen(
                    language = uiState.language,
                    onLanguageChange = { viewModel.setLanguage(it) },
                    isDarkMode = uiState.isDarkMode,
                    onToggleDarkMode = { viewModel.toggleDarkMode() },
                    locationGranted = uiState.locationPermissionGranted,
                    onToggleLocation = { viewModel.toggleLocationPermission() },
                    onNavigate = { viewModel.navigateTo(it) },
                    notificationsEnabled = uiState.isNotificationsEnabled,
                    onToggleNotifications = { viewModel.toggleNotifications(it) },
                    onTriggerTestNotification = { viewModel.triggerTestNotification() }
                )

                AppScreen.BUSINESS_PORTAL -> BusinessPortalScreen(
                    language = uiState.language,
                    isYearly = uiState.isBillingYearly,
                    onToggleYearly = { viewModel.toggleBillingPeriod(it) },
                    selectedPackage = uiState.selectedPricingPackage,
                    onSelectPackage = { viewModel.selectPricingPackage(it) },
                    onCloseBooking = { viewModel.closeBookingDialog() },
                    onSubmitBooking = { c, e, k -> viewModel.submitBooking(c, e, k) },
                    bookingSuccessMessage = uiState.bookingSuccessMessage,
                    onOpenWerben = { size -> viewModel.openWerben(size) }
                )

                AppScreen.ADMIN -> AdminScreen(
                    language = uiState.language,
                    isAuthenticated = uiState.isAdminAuthenticated,
                    currentTab = uiState.adminStoriesTab,
                    stories = uiState.allStories,
                    onLogin = { token ->
                        // token = session from /api/admin-auth (checked on the server, no passwords in the app)
                        viewModel.setAdminToken(token)
                        viewModel.setAdminAuthenticated(true)
                        true
                    },
                    onTabChange = { viewModel.setAdminStoriesTab(it) },
                    onApproveStory = { id, h -> viewModel.approveStory(id, h) },
                    onRejectStory = { id, r -> viewModel.rejectStory(id, r) },
                    onExtendStory = { id, h -> viewModel.extendStory(id, h) },
                    onDeleteStory = { id -> viewModel.deleteStory(id) },
                    onUpdateStory = { id, h, s -> viewModel.updateStoryHeadline(id, h, s) },
                    onAddAdminStory = { h, s, k, kd, c, a, uri, isVid, dur ->
                        viewModel.addAdminStory(h, s, k, kd, c, a, uri, isVid, dur)
                    },
                    onLogout = {
                        viewModel.setAdminAuthenticated(false)
                    },
                    onBack = { viewModel.navigateTo(AppScreen.HOME) },
                    onAdminStoryLink = { viewModel.setAdminStoryLink(it) }
                )

                AppScreen.LIVE_BULLETIN -> BerlinLiveBulletinScreen(
                    language = uiState.language,
                    bulletins = uiState.liveBulletins,
                    activeFolder = uiState.activeBulletinFolder,
                    searchQuery = uiState.bulletinSearchQuery,
                    lastUpdateMillis = uiState.lastBulletinUpdateMillis,
                    onSelectFolder = { viewModel.selectBulletinFolder(it) },
                    onSearchChange = { viewModel.setBulletinSearchQuery(it) },
                    onRefresh = { viewModel.refreshLiveBulletins() },
                    onBack = { viewModel.navigateTo(AppScreen.HOME) },
                    onTriggerAlert = { viewModel.triggerTestNotification() }
                )

                AppScreen.BERLIN_TIPS -> BerlinTipsScreen(
                    language = uiState.language,
                    onBack = { viewModel.navigateTo(AppScreen.HOME) }
                )

                AppScreen.SPORTS_AND_MARKETS -> SportsAndMarketsScreen(
                    language = uiState.language,
                    onBack = { viewModel.navigateTo(AppScreen.HOME) }
                )
            }
        }
    }
}

    // Sponsor contact sheet (opens when a sponsor card is tapped)
    com.example.ui.components.SponsorInfoHost(language = uiState.language)
    // "Fehler melden / Support" form (2026-11-11)
    com.example.ui.components.SupportHost(language = uiState.language)

    // Global Hamburger Hub Modal (Header Sağ Köşe - Menü, Filtreler & Klasörler)
    if (showHamburgerMenu) {
        HamburgerHubModal(
            language = uiState.language,
            currentViewMode = uiState.businessViewMode,
            onSelectViewMode = { viewModel.setBusinessViewMode(it) },
            activeKiez = uiState.activeKiezFilter,
            onSelectKiez = { viewModel.setKiezFilter(it) },
            activeCategory = uiState.activeBusinessCategory,
            onSelectCategory = { viewModel.setBusinessCategory(it) },
            onNavigateToScreen = { viewModel.navigateTo(it) },
            onOpenAddBusiness = { viewModel.openAddBusinessDialog() },
            onResetFilters = { viewModel.resetFilters() },
            onDismiss = { showHamburgerMenu = false },
            isDarkMode = uiState.isDarkMode,
            onToggleDarkMode = { viewModel.toggleDarkMode() }
        )
    }

    // Story Viewer Modal (Supports auto sequential playback of all approved stories!)
    if (uiState.activeStoriesList.isNotEmpty()) {
        StoryViewerDialog(
            stories = uiState.activeStoriesList,
            initialIndex = uiState.activeStoryIndex,
            language = uiState.language,
            onClose = { viewModel.closeStory() }
        )
    } else if (uiState.activeStory != null) {
        StoryViewerDialog(
            story = uiState.activeStory!!,
            language = uiState.language,
            onClose = { viewModel.closeStory() }
        )
    }

    // Story Create Modal
    if (uiState.showAddStoryDialog) {
        val draft by viewModel.shareDraft.collectAsStateWithLifecycle()
        key(draft) {
            StoryCreateDialog(
                language = uiState.language,
                onClose = { viewModel.closeAddStoryDialog(); viewModel.clearShareDraft() },
                onSubmit = { h, s, k, kd, c, a, uri, isVid, isComm, dur, pr, link ->
                    viewModel.submitStory(h, s, k, kd, c, a, uri, isVid, isComm, dur, pr, link)
                    viewModel.clearShareDraft()
                },
                initialHeadline = draft?.headline.orEmpty(),
                initialSubtext = draft?.subtext.orEmpty(),
                initialLink = draft?.link.orEmpty(),
                initialMediaUri = draft?.mediaUri,
                initialIsVideo = draft?.isVideo ?: false
            )
        }
    }

    // Story Submission Feedback Toast / Alert
    uiState.storySubmissionFeedback?.let { feedback ->
        AlertDialog(
            onDismissRequest = { viewModel.clearStoryFeedback() },
            title = {
                Text(
                    text = if (feedback == "DUPLICATE")
                        (if (uiState.language == AppLanguage.TURKISH) "⚠️ Zaten yüklendi" else if (uiState.language == AppLanguage.ENGLISH) "⚠️ Already uploaded" else "⚠️ Schon hochgeladen")
                    else if (feedback == "AUTHOR")
                        (if (uiState.language == AppLanguage.TURKISH) "⚠️ İsim eksik" else if (uiState.language == AppLanguage.ENGLISH) "⚠️ Name missing" else "⚠️ Name fehlt")
                    else if (feedback == "REJECTED")
                        (if (uiState.language == AppLanguage.TURKISH) "İçerik Reddedildi" else "Beitrag abgelehnt")
                    else
                        if (feedback == "Veröffentlicht") (if (uiState.language == AppLanguage.TURKISH) "Hikâye Yayında! 🎉" else "Story ist online! 🎉")
                        else (if (uiState.language == AppLanguage.TURKISH) "Hikâye gönderildi ⏳" else "Story eingereicht ⏳"),
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = if (feedback == "DUPLICATE") {
                        if (uiState.language == AppLanguage.TURKISH) "Aynı içerik ve aynı resim iki kere yüklenemez."
                        else if (uiState.language == AppLanguage.ENGLISH) "The same content and the same picture cannot be uploaded twice."
                        else "Der gleiche Inhalt und das gleiche Bild können nicht zweimal hochgeladen werden."
                    } else if (feedback == "AUTHOR") {
                        if (uiState.language == AppLanguage.TURKISH) "Lütfen adını veya takma adını yaz (en az 2 harf, sadece emoji olmaz)."
                        else if (uiState.language == AppLanguage.ENGLISH) "Please enter your name or nickname (at least 2 letters, not only emoji)."
                        else "Bitte gib deinen Namen oder Spitznamen ein (mindestens 2 Buchstaben, nicht nur Emojis)."
                    } else if (feedback == "REJECTED") {
                        if (uiState.language == AppLanguage.TURKISH)
                            "Gönderiniz politik, küfür veya 18+ içerik kurallarımıza aykırı olduğu için reddedilmiştir."
                        else
                            "Dein Beitrag verstößt gegen unsere Richtlinien (keine Politik, keine Beleidigungen, keine 18+ Inhalte) und wurde abgelehnt."
                    } else if (feedback == "Veröffentlicht") {
                        if (uiState.language == AppLanguage.TURKISH)
                            "Hikâyeniz başarıyla yüklendi ve yayına alındı! Belirlediğiniz süre boyunca ana sayfa story barında ve ilgili mahallede aktif kalacaktır."
                        else
                            "Deine Story wurde erfolgreich veröffentlicht und ist jetzt live im Story-Bereich sichtbar!"
                    } else {
                        if (uiState.language == AppLanguage.TURKISH)
                            "Hikâyen alındı. Kısa bir kontrolden sonra herkes görebilecek."
                        else
                            "Deine Story ist eingegangen. Nach einer kurzen Prüfung sehen sie alle."
                    }
                )
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.clearStoryFeedback() },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (feedback == "REJECTED") BerlinRed else BerlinGreen
                    )
                ) {
                    Text(if (uiState.language == AppLanguage.TURKISH) "Tamam" else "Verstanden", color = Color.White)
                }
            }
        )
    }

    // In-App Version Update Dialog (https://mykiezberlin.com/version.json)
    uiState.appUpdateInfo?.let { updateInfo ->
        val context = LocalContext.current
        AlertDialog(
            onDismissRequest = {
                if (!updateInfo.mandatory) {
                    viewModel.dismissUpdateDialog()
                }
            },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(imageVector = Icons.Default.SystemUpdate, contentDescription = null, tint = BerlinBlue)
                    Text(
                        text = if (uiState.language == AppLanguage.TURKISH) "Yeni Sürüm Mevcut (v${updateInfo.versionName})" else "Neue Version verfügbar (v${updateInfo.versionName})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = updateInfo.localizedNotes(uiState.language).ifBlank {
                            if (uiState.language == AppLanguage.TURKISH)
                                "Uygulamamızın en güncel özelliklerini ve iyileştirmelerini kullanmak için lütfen güncelleyin."
                            else
                                "Ein neues Update für My Kiez Berlin steht bereit mit aktuellen Verbesserungen."
                        },
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (updateInfo.mandatory) {
                        Text(
                            text = if (uiState.language == AppLanguage.TURKISH)
                                "⚠️ Bu güncelleme uygulamayı kullanmaya devam edebilmeniz için zorunludur."
                            else
                                "⚠️ Dieses Update ist erforderlich, um My Kiez Berlin weiter zu nutzen.",
                            fontSize = 11.5.sp,
                            color = BerlinRed,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val browserIntent = android.content.Intent(
                            android.content.Intent.ACTION_VIEW,
                            android.net.Uri.parse(updateInfo.apkUrl)
                        )
                        context.startActivity(browserIntent)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = BerlinBlue)
                ) {
                    Text(
                        text = if (uiState.language == AppLanguage.TURKISH) "Şimdi Güncelle" else "Jetzt aktualisieren",
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            },
            dismissButton = if (!updateInfo.mandatory) {
                {
                    TextButton(onClick = { viewModel.dismissUpdateDialog() }) {
                        Text(
                            text = if (uiState.language == AppLanguage.TURKISH) "Daha Sonra" else "Später",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else null
        )
    }

    // More Bottom Sheet Menu
    if (showMoreBottomSheet) {
        ModalBottomSheet(
            onDismissRequest = { showMoreBottomSheet = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = if (uiState.language == AppLanguage.TURKISH) "Tüm Özellikler & Menü" else "Alle Bereiche & Entdecken",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp
                )

                // Row 1: Notruf (SOS) & Kiez-Reporter
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SheetGridItem(
                        icon = Icons.Default.Warning,
                        label = if (uiState.language == AppLanguage.TURKISH) "Acil Numaralar (SOS)" else "Notruf & SOS (Berlin)",
                        color = BerlinRed,
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.navigateTo(AppScreen.NOTRUF)
                        showMoreBottomSheet = false
                    }
                    SheetGridItem(
                        icon = Icons.Default.Campaign,
                        label = if (uiState.language == AppLanguage.TURKISH) "Kiez Muhabiri" else "Kiez-Reporter",
                        color = Color(0xFF0284C7),
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.navigateTo(AppScreen.REPORTER)
                        showMoreBottomSheet = false
                    }
                }

                // Kiez match quiz
                SheetGridItem(
                    icon = Icons.Default.Star,
                    label = if (uiState.language == AppLanguage.TURKISH) "Sana Hangi Kiez Uyuyor? (Quiz)" else "Welcher Kiez passt zu dir? (Quiz)",
                    color = Color(0xFFE30613),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    viewModel.navigateTo(AppScreen.KIEZ_MATCH)
                    showMoreBottomSheet = false
                }

                // Community and free classifieds
                SheetGridItem(
                    icon = Icons.Default.Person,
                    label = if (uiState.language == AppLanguage.TURKISH) "Topluluk & Ücretsiz İlanlar" else "Community & Kleinanzeigen",
                    color = BerlinBlue,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    viewModel.navigateTo(AppScreen.COMMUNITY)
                    showMoreBottomSheet = false
                }

                // Row 2: 23 Kieze & Gastronomie
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SheetGridItem(
                        icon = Icons.Default.LocationOn,
                        label = if (uiState.language == AppLanguage.TURKISH) "23 Kiez Rehberi" else "Die 23 Kieze",
                        color = BerlinRed,
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.navigateTo(AppScreen.KIEZE)
                        showMoreBottomSheet = false
                    }
                    SheetGridItem(
                        icon = Icons.Default.Restaurant,
                        label = if (uiState.language == AppLanguage.TURKISH) "Yeme & İçme" else "Gastronomie",
                        color = Color(0xFFF97316),
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.navigateTo(AppScreen.FOOD)
                        showMoreBottomSheet = false
                    }
                }

                // Row 3: Events & Kiez-Wissen
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SheetGridItem(
                        icon = Icons.Default.CalendarToday,
                        label = if (uiState.language == AppLanguage.TURKISH) "Etkinlikler" else "Events & Kultur",
                        color = BerlinGreen,
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.navigateTo(AppScreen.EVENTS)
                        showMoreBottomSheet = false
                    }
                    SheetGridItem(
                        icon = Icons.Default.Lightbulb,
                        label = if (uiState.language == AppLanguage.TURKISH) "Kiez Rehberi" else "Kiez-Wissen",
                        color = Color(0xFF06B6D4),
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.navigateTo(AppScreen.KNOWLEDGE)
                        showMoreBottomSheet = false
                    }
                }

                // Row 4: Merkliste & Einstellungen
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SheetGridItem(
                        icon = Icons.Default.Favorite,
                        label = if (uiState.language == AppLanguage.TURKISH) "Kaydedilenler" else "Merkliste",
                        color = Color(0xFFEC4899),
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.navigateTo(AppScreen.FAVORITES)
                        showMoreBottomSheet = false
                    }
                    SheetGridItem(
                        icon = Icons.Default.Settings,
                        label = if (uiState.language == AppLanguage.TURKISH) "Ayarlar & Dil" else "Einstellungen",
                        color = BerlinBlue,
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.navigateTo(AppScreen.PROFILE)
                        showMoreBottomSheet = false
                    }
                }

                // Row 5: Night / day mode right in the menu (2026-11-11). The admin entry is only visible
                // to a logged-in admin; everyone else reaches the login through the small grey lock in the profile.
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SheetGridItem(
                        icon = if (uiState.isDarkMode) Icons.Default.LightMode else Icons.Default.DarkMode,
                        label = when (uiState.language) {
                            AppLanguage.TURKISH -> if (uiState.isDarkMode) "Gündüz modu ☀️" else "Gece modu 🌙"
                            AppLanguage.ENGLISH -> if (uiState.isDarkMode) "Day mode ☀️" else "Night mode 🌙"
                            else -> if (uiState.isDarkMode) "Tagmodus ☀️" else "Nachtmodus 🌙"
                        },
                        color = Color(0xFF6366F1),
                        modifier = Modifier.weight(1f)
                    ) {
                        viewModel.toggleDarkMode()
                    }
                    SheetGridItem(
                        icon = Icons.Default.Build,
                        label = when (uiState.language) {
                            AppLanguage.TURKISH -> "Hata bildir"
                            AppLanguage.ENGLISH -> "Report a problem"
                            else -> "Fehler melden"
                        },
                        color = Color(0xFFF59E0B),
                        modifier = Modifier.weight(1f)
                    ) {
                        showMoreBottomSheet = false
                        com.example.ui.components.SupportState.show("app")
                    }
                }
                if (uiState.isAdminAuthenticated) Row(modifier = Modifier.fillMaxWidth()) {
                    run {
                        SheetGridItem(
                            icon = Icons.Default.AdminPanelSettings,
                            label = "Admin",
                            color = Color(0xFF1F9D55),
                            modifier = Modifier.weight(1f)
                        ) {
                            viewModel.navigateTo(AppScreen.ADMIN)
                            showMoreBottomSheet = false
                        }
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                // B2B Special Button in Sheet
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = BerlinRed,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            viewModel.navigateTo(AppScreen.BUSINESS_PORTAL)
                            showMoreBottomSheet = false
                        }
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(imageVector = Icons.Default.Business, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (uiState.language == AppLanguage.TURKISH) "İşletmeler İçin Reklam (B2B Paketleri)" else "Für Unternehmen: Werbepakete ab 19 €/Monat",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.5.sp
                        )
                    }
                }

                val context = LocalContext.current
                val apkUrl = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"

                // Arkadaşıma Paylaş Butonu (APK İndirme Linki)
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFF0284C7),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val shareIntent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                val text = if (uiState.language == AppLanguage.TURKISH) {
                                    "Berlin'in canlı bülteni, mahalle rehberi ve etkinlikleri için My Kiez Berlin uygulamasını hemen indir:\n$apkUrl"
                                } else {
                                    "Lade jetzt die My Kiez Berlin App für Live-Ticker, Nachbarschafts-Guide und Events herunter:\n$apkUrl"
                                }
                                putExtra(android.content.Intent.EXTRA_TEXT, text)
                            }
                            context.startActivity(android.content.Intent.createChooser(shareIntent, "My Kiez Berlin teilen"))
                        }
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Share, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                        Column {
                            Text(
                                text = if (uiState.language == AppLanguage.TURKISH) "Arkadaşıma Paylaş" else "App mit Freunden teilen",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = if (uiState.language == AppLanguage.TURKISH) "My Kiez Berlin uygulamasını tavsiye et" else "Direkter APK-Download-Link zum Weiterleiten",
                                fontSize = 11.sp,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                    }
                }

                // APK İndirme Linki Kutusu (Doğrudan butonun altında görünür)
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF0284C7).copy(alpha = 0.35f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (uiState.language == AppLanguage.TURKISH) "İndirme Linki (APK):" else "Download-Link (APK):",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = BerlinBlue
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    text = if (uiState.language == AppLanguage.TURKISH) "Kopyala" else "Kopieren",
                                    fontSize = 11.sp,
                                    color = Color(0xFF0284C7),
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier
                                        .clickable {
                                            val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("My Kiez Berlin APK", apkUrl))
                                            android.widget.Toast.makeText(context, if (uiState.language == AppLanguage.TURKISH) "İndirme linki kopyalandı!" else "Link kopiert!", android.widget.Toast.LENGTH_SHORT).show()
                                        }
                                        .padding(2.dp)
                                )
                                Text(text = "•", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    text = if (uiState.language == AppLanguage.TURKISH) "İndir" else "Download",
                                    fontSize = 11.sp,
                                    color = BerlinGreen,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier
                                        .clickable {
                                            val browserIntent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(apkUrl))
                                            context.startActivity(browserIntent)
                                        }
                                        .padding(2.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = apkUrl,
                            fontSize = 10.5.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2,
                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                        )
                    }
                }

                // Canlı Hatırlatma Gönder (S-Bahn / BVG / İtfaiye / Polis Test Butonu)
                if (com.example.BuildConfig.DEBUG) {
Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFF008754),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            viewModel.triggerTestNotification()
                            showMoreBottomSheet = false
                        }
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(imageVector = Icons.Default.NotificationsActive, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (uiState.language == AppLanguage.TURKISH) "🔔 Canlı Hatırlatma Gönder (S-Bahn / BVG / Polis)" else "🔔 Live-Alarm senden (S-Bahn / BVG / Polizei)",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.5.sp
                        )
                    }
                }
}
            }
        }
    }
}

@Composable
fun SheetGridItem(
    icon: ImageVector,
    label: String,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier.clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Surface(shape = RoundedCornerShape(8.dp), color = color.copy(alpha = 0.15f), modifier = Modifier.size(36.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
                }
            }
            Text(text = label, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        }
    }
}
