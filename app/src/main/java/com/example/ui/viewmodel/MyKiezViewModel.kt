package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.KiezStorageManager
import com.example.data.repository.LiveAlert
import com.example.data.repository.LiveAlertsRepository
import com.example.data.repository.LiveBerlinFeedRepository
import com.example.data.repository.SampleData
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AppScreen {
    HOME,
    KIEZE,
    KIEZ_DETAIL,
    KIEZ_MAP,
    QUIZ,
    FOOD,
    EVENTS,
    BUSINESSES,
    DEALS,
    KNOWLEDGE,
    FAVORITES,
    PROFILE,
    BUSINESS_PORTAL,
    JOBS,
    NOTRUF,
    REPORTER,
    ADMIN,
    LIVE_BULLETIN,
    BERLIN_TIPS,
    SPORTS_AND_MARKETS,
    KIEZ_MATCH,
    COMMUNITY
}

data class UiState(
    val currentScreen: AppScreen = AppScreen.HOME,
    val language: AppLanguage = AppLanguage.GERMAN,
    val isDarkMode: Boolean = false,
    val locationPermissionGranted: Boolean = true,
    val selectedKiezId: String = "kreuzberg",
    val searchQuery: String = "",
    val activeFoodCuisine: String = "Alle",
    val activeEventFilter: String = "Alle",
    val activeBusinessCategory: String = "Alle",
    val activeKiezFilter: String = "Alle",
    val activeKnowledgeCategory: String = "Alle",
    val isBusinessMapView: Boolean = false,
    val businessViewMode: String = "card", // "card", "list", "map"
    // Quiz state
    val quizCurrentIndex: Int = 0,
    val quizSelectedOption: Int? = null,
    val quizIsAnswerChecked: Boolean = false,
    val quizScore: Int = 0,
    val quizFinished: Boolean = false,
    // Favorites
    val favoriteIds: Set<String> = setOf("mustafas", "kreuzberg", "lange_nacht", "deal_anna_blume", "kiez_friseur"),
    val activeFavoritesTypeFilter: String = "Alle",
    // Deals modal
    val activeRedeemDeal: Deal? = null,
    // Business Booking
    val selectedPricingPackage: PricingPackage? = null,
    val isBillingYearly: Boolean = false,
    val bookingSuccessMessage: String? = null,
    // Selected Business for Detail Sheet
    val selectedBusiness: LocalBusiness? = null,
    val showAddBusinessDialog: Boolean = false,
    // Event Submission Modal
    val showEventSubmitDialog: Boolean = false,
    val eventSubmitSuccessMessage: String? = null,
    // User added items
    val customEvents: List<KiezEvent> = emptyList(),
    val customBusinesses: List<LocalBusiness> = emptyList(),
    val customJobs: List<KiezJob> = emptyList(),
    val customStories: List<KiezStory> = emptyList(),
    val allStories: List<KiezStory> = SampleData.stories,
    val customReports: List<KiezReporterPost> = emptyList(),
    // Stories
    val activeStory: KiezStory? = null,
    val activeStoriesList: List<KiezStory> = emptyList(),
    val activeStoryIndex: Int = 0,
    val showAddStoryDialog: Boolean = false,
    val storySubmissionFeedback: String? = null,
    // Admin & Moderation
    val isAdminAuthenticated: Boolean = false,
    val adminStoriesTab: String = "pending", // "pending", "approved", "rejected", "sponsors", "jobs", "requests", "posts"
    // Map selection
    val selectedMapSpot: FoodSpot? = SampleData.foodSpots.first(),
    // Berlin Live Bulletins (Hourly & 24h Auto-Expiry)
    val liveBulletins: List<BerlinLiveBulletin> = emptyList(),
    val activeBulletinFolder: BulletinFolder = BulletinFolder.ALL,
    val bulletinSearchQuery: String = "",
    val lastBulletinUpdateMillis: Long = System.currentTimeMillis(),
    val isNotificationsEnabled: Boolean = true,
    val isLiveAlertsAvailable: Boolean = false,
    val activeAlertBanner: LiveAlert? = null,
    val kieze: List<Kiez> = SampleData.kieze,
    val appUpdateInfo: AppUpdateInfo? = null
)

class MyKiezViewModel(application: Application) : AndroidViewModel(application) {
    private val app = application

    private val _uiState: MutableStateFlow<UiState>
    private var remoteStoriesCache: List<KiezStory> = emptyList()

    // Replaces the previous server stories so removed ones disappear too.
    private fun applyRemoteStories(remote: List<KiezStory>) {
        val previous = remoteStoriesCache
        remoteStoriesCache = remote
        _uiState.update { state ->
            val kept = state.allStories.filter { story -> previous.none { it.id == story.id } }
            state.copy(allStories = (remote + kept).distinctBy { it.id })
        }
    }

    init {
        val initialLang = KiezStorageManager.loadLanguage(application)
        val userStories = KiezStorageManager.loadStories(application)
        val initialAlerts = LiveAlertsRepository.liveAlerts.value
        val instStories = LiveAlertsRepository.generateInstitutionStories(initialAlerts, initialLang)
        val mergedStories = instStories + userStories.filter { u -> instStories.none { it.id == u.id } }
        val savedReports = KiezStorageManager.loadCustomReports(application)
        val initialBulletins = LiveAlertsRepository.toBulletins(initialAlerts)

        _uiState = MutableStateFlow(
            UiState(
                language = initialLang,
                isNotificationsEnabled = KiezStorageManager.isNotificationsEnabled(application),
                allStories = mergedStories,
                isAdminAuthenticated = KiezStorageManager.isAdminAuthenticated(application),
                liveBulletins = initialBulletins,
                customReports = savedReports,
                isLiveAlertsAvailable = LiveAlertsRepository.isLiveAvailable.value,
                activeAlertBanner = LiveAlertsRepository.activeAlertBanner.value
            )
        )

        // Real-time OkHttp live alerts collection from https://mykiezberlin.com/api/live
        viewModelScope.launch {
            LiveAlertsRepository.liveAlerts.collect { alerts ->
                val lang = _uiState.value.language
                val uStories = KiezStorageManager.loadStories(app)
                val iStories = LiveAlertsRepository.generateInstitutionStories(alerts, lang)
                val mStories = (remoteStoriesCache + iStories + uStories).distinctBy { it.id }
                val bulletins = LiveAlertsRepository.toBulletins(alerts)
                _uiState.update {
                    it.copy(
                        liveBulletins = bulletins,
                        allStories = mStories,
                        isLiveAlertsAvailable = LiveAlertsRepository.isLiveAvailable.value,
                        activeAlertBanner = LiveAlertsRepository.activeAlertBanner.value,
                        lastBulletinUpdateMillis = System.currentTimeMillis()
                    )
                }
            }
        }

        // Availability and banner change independently of the alert list.
        viewModelScope.launch {
            LiveAlertsRepository.isLiveAvailable.collect { available ->
                _uiState.update { it.copy(isLiveAlertsAvailable = available) }
            }
        }
        viewModelScope.launch {
            LiveAlertsRepository.activeAlertBanner.collect { banner ->
                _uiState.update { it.copy(activeAlertBanner = banner) }
            }
        }

        // Fetch stories and reporter posts from https://mykiezberlin.com/api/stories & /api/reporter
        viewModelScope.launch {
            try {
                val remoteStories = LiveAlertsRepository.fetchRemoteStories()
                if (remoteStories.isNotEmpty()) applyRemoteStories(remoteStories)
                val remoteReports = LiveAlertsRepository.fetchRemoteReporterPosts()
                if (remoteReports.isNotEmpty()) {
                    val currentRep = _uiState.value.customReports
                    val combinedRep = (remoteReports + currentRep).distinctBy { it.id }
                    _uiState.update { it.copy(customReports = combinedRep) }
                }
            } catch (e: Exception) {
                // Graceful fallback to local
            }
        }

        // Fetch live 24 kieze from https://mykiezberlin.com/api/kieze
        viewModelScope.launch {
            try {
                val remoteKieze = LiveAlertsRepository.fetchKieze()
                if (remoteKieze.isNotEmpty()) {
                    _uiState.update { it.copy(kieze = remoteKieze) }
                }
            } catch (e: Exception) {
                // Keep SampleData.kieze fallback
            }
        }

        // Fetch approved submissions from https://mykiezberlin.com/api/submissions
        viewModelScope.launch {
            try {
                val approvedItems = LiveAlertsRepository.fetchSubmissions()
                if (approvedItems.isNotEmpty()) {
                    val newBiz = mutableListOf<LocalBusiness>()
                    val newEvents = mutableListOf<KiezEvent>()
                    val newJobs = mutableListOf<KiezJob>()
                    for (item in approvedItems) {
                        when (item.optString("type")) {
                            "business" -> {
                                newBiz.add(
                                    LocalBusiness(
                                        id = item.optString("id", "biz_${System.currentTimeMillis()}"),
                                        name = item.optString("name", "Neues Unternehmen"),
                                        category = item.optString("category", "Handel"),
                                        rating = 0.0,
                                        reviewsCount = 0,
                                        kiezName = item.optString("kiezName", item.optString("kiez", "Berlin")),
                                        distance = "0.5 km",
                                        address = item.optString("address", "Berlin"),
                                        imageUrl = item.optString("imageUrl", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600"),
                                        phone = item.optString("phone", item.optString("contact", "")),
                                        whatsapp = item.optString("whatsapp", "+4915126509586"),
                                        website = item.optString("website", "https://mykiezberlin.com"),
                                        description = item.optString("description", "")
                                    )
                                )
                            }
                            "event" -> {
                                newEvents.add(
                                    KiezEvent(
                                        id = item.optString("id", "event_${System.currentTimeMillis()}"),
                                        title = item.optString("title", "Kiez Event"),
                                        dayLabel = item.optString("dateText", item.optString("date", "")),
                                        dateNum = "",
                                        monthLabel = "",
                                        time = item.optString("time", ""),
                                        kiezName = item.optString("kiezName", item.optString("kiez", "Berlin")),
                                        price = item.optString("price", "Kostenlos"),
                                        isFree = item.optString("price", "").contains("frei", ignoreCase = true) || item.optString("price", "").contains("kostenlos", ignoreCase = true),
                                        category = item.optString("category", "Kultur"),
                                        description = item.optString("description", "")
                                    )
                                )
                            }
                            "job" -> {
                                newJobs.add(
                                    KiezJob(
                                        id = item.optString("id", "job_${System.currentTimeMillis()}"),
                                        title = item.optString("title", "Kiez Job"),
                                        company = item.optString("company", "Unternehmen"),
                                        kiez = item.optString("kiez", "Berlin"),
                                        jobType = item.optString("jobType", "Vollzeit"),
                                        salary = item.optString("salary", "Nach Vereinbarung"),
                                        description = item.optString("description", ""),
                                        contactWa = item.optString("contact", ""),
                                        contactPhone = item.optString("contactPhone", ""),
                                        contactEmail = item.optString("contactEmail", "")
                                    )
                                )
                            }
                        }
                    }
                    _uiState.update {
                        it.copy(
                            customBusinesses = (newBiz + it.customBusinesses).distinctBy { b -> b.id },
                            customEvents = (newEvents + it.customEvents).distinctBy { ev -> ev.id },
                            customJobs = (newJobs + it.customJobs).distinctBy { j -> j.id }
                        )
                    }
                }
            } catch (e: Exception) {
                // Graceful
            }
        }

        // Version Check on startup
        viewModelScope.launch {
            try {
                val remoteVer = LiveAlertsRepository.fetchAppVersion()
                if (remoteVer != null && remoteVer.versionCode > com.example.BuildConfig.VERSION_CODE) {
                    _uiState.update { it.copy(appUpdateInfo = remoteVer) }
                }
            } catch (_: Exception) {}
        }

        // Periodic 60s background refresh for live, stories, reporter, and submissions
        viewModelScope.launch {
            while (isActive) {
                delay(60_000L)
                try {
                    LiveAlertsRepository.fetchLiveAlerts()
                    LiveBerlinFeedRepository.fetchLiveApi()

                    val remoteStories = LiveAlertsRepository.fetchRemoteStories()
                    if (remoteStories.isNotEmpty()) applyRemoteStories(remoteStories)

                    val remoteReports = LiveAlertsRepository.fetchRemoteReporterPosts()
                    if (remoteReports.isNotEmpty()) {
                        val currentRep = _uiState.value.customReports
                        val combinedRep = (remoteReports + currentRep).distinctBy { it.id }
                        _uiState.update { it.copy(customReports = combinedRep) }
                    }

                    val approvedItems = LiveAlertsRepository.fetchSubmissions()
                    if (approvedItems.isNotEmpty()) {
                        val newBiz = mutableListOf<LocalBusiness>()
                        val newEvents = mutableListOf<KiezEvent>()
                        val newJobs = mutableListOf<KiezJob>()
                        for (item in approvedItems) {
                            when (item.optString("type")) {
                                "business" -> newBiz.add(
                                    LocalBusiness(
                                        id = item.optString("id", "biz_${System.currentTimeMillis()}"),
                                        name = item.optString("name", "Unternehmen"),
                                        category = item.optString("category", "Handel"),
                                        rating = 0.0,
                                        reviewsCount = 0,
                                        kiezName = item.optString("kiezName", item.optString("kiez", "Berlin")),
                                        distance = "0.5 km",
                                        address = item.optString("address", "Berlin"),
                                        imageUrl = item.optString("imageUrl", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600"),
                                        phone = item.optString("phone", item.optString("contact", "")),
                                        whatsapp = item.optString("whatsapp", "+4915126509586"),
                                        website = item.optString("website", "https://mykiezberlin.com"),
                                        description = item.optString("description", "")
                                    )
                                )
                                "event" -> newEvents.add(
                                    KiezEvent(
                                        id = item.optString("id", "event_${System.currentTimeMillis()}"),
                                        title = item.optString("title", "Kiez Event"),
                                        dayLabel = item.optString("dateText", item.optString("date", "")),
                                        dateNum = "",
                                        monthLabel = "",
                                        time = item.optString("time", ""),
                                        kiezName = item.optString("kiezName", item.optString("kiez", "Berlin")),
                                        price = item.optString("price", "Kostenlos"),
                                        isFree = true,
                                        category = item.optString("category", "Kultur"),
                                        description = item.optString("description", "")
                                    )
                                )
                                "job" -> newJobs.add(
                                    KiezJob(
                                        id = item.optString("id", "job_${System.currentTimeMillis()}"),
                                        title = item.optString("title", "Kiez Job"),
                                        company = item.optString("company", "Unternehmen"),
                                        kiez = item.optString("kiez", "Berlin"),
                                        jobType = item.optString("jobType", "Vollzeit"),
                                        salary = item.optString("salary", "Nach Vereinbarung"),
                                        description = item.optString("description", ""),
                                        contactWa = item.optString("contact", ""),
                                        contactPhone = item.optString("contactPhone", ""),
                                        contactEmail = item.optString("contactEmail", "")
                                    )
                                )
                            }
                        }
                        _uiState.update {
                            it.copy(
                                customBusinesses = (newBiz + it.customBusinesses).distinctBy { b -> b.id },
                                customEvents = (newEvents + it.customEvents).distinctBy { ev -> ev.id },
                                customJobs = (newJobs + it.customJobs).distinctBy { j -> j.id }
                            )
                        }
                    }
                } catch (_: Exception) {}
            }
        }

        // Periodic 15 min (900s) background refresh for sport data
        viewModelScope.launch {
            while (isActive) {
                delay(900_000L)
                try {
                    LiveBerlinFeedRepository.fetchSportApi()
                } catch (_: Exception) {}
            }
        }
    }

    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    fun refreshLiveBulletins() {
        viewModelScope.launch {
            LiveAlertsRepository.fetchLiveAlerts()
        }
    }

    fun selectBulletinFolder(folder: BulletinFolder) {
        _uiState.update { it.copy(activeBulletinFolder = folder) }
    }

    fun setBulletinSearchQuery(query: String) {
        _uiState.update { it.copy(bulletinSearchQuery = query) }
    }

    fun navigateTo(screen: AppScreen) {
        _uiState.update { it.copy(currentScreen = screen) }
    }

    fun setLanguage(language: AppLanguage) {
        KiezStorageManager.saveLanguage(app, language)
        val currentAlerts = LiveAlertsRepository.liveAlerts.value
        val uStories = KiezStorageManager.loadStories(app)
        val iStories = LiveAlertsRepository.generateInstitutionStories(currentAlerts, language)
        val mStories = (remoteStoriesCache + iStories + uStories).distinctBy { it.id }
        _uiState.update { it.copy(language = language, allStories = mStories) }
    }

    fun toggleNotifications(enabled: Boolean) {
        KiezStorageManager.setNotificationsEnabled(app, enabled)
        _uiState.update { it.copy(isNotificationsEnabled = enabled) }
    }

    fun triggerTestNotification() {
        LiveAlertsRepository.cycleNextAlert()
        _uiState.update {
            it.copy(
                activeAlertBanner = LiveAlertsRepository.activeAlertBanner.value,
                isLiveAlertsAvailable = LiveAlertsRepository.isLiveAvailable.value
            )
        }
    }

    fun dismissAlertBanner() {
        LiveAlertsRepository.dismissBanner()
        _uiState.update { it.copy(activeAlertBanner = null) }
    }

    fun toggleDarkMode() {
        _uiState.update { it.copy(isDarkMode = !it.isDarkMode) }
    }

    fun toggleLocationPermission() {
        _uiState.update { it.copy(locationPermissionGranted = !it.locationPermissionGranted) }
    }

    fun openKiezDetail(kiezId: String) {
        _uiState.update { it.copy(selectedKiezId = kiezId, currentScreen = AppScreen.KIEZ_DETAIL) }
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun setFoodCuisine(cuisine: String) {
        _uiState.update { it.copy(activeFoodCuisine = cuisine) }
    }

    fun setEventFilter(filter: String) {
        _uiState.update { it.copy(activeEventFilter = filter) }
    }

    fun setBusinessCategory(category: String) {
        _uiState.update { it.copy(activeBusinessCategory = category) }
    }

    fun setBusinessViewMode(mode: String) {
        _uiState.update { it.copy(businessViewMode = mode, isBusinessMapView = (mode == "map")) }
    }

    fun resetFilters() {
        _uiState.update { it.copy(activeBusinessCategory = "Alle", activeKiezFilter = "Alle", searchQuery = "") }
    }

    fun setBusinessMapView(isMap: Boolean) {
        _uiState.update { it.copy(isBusinessMapView = isMap, businessViewMode = if (isMap) "map" else "card") }
    }

    fun setKiezFilter(kiez: String) {
        _uiState.update { it.copy(activeKiezFilter = kiez) }
    }

    fun setKnowledgeCategory(cat: String) {
        _uiState.update { it.copy(activeKnowledgeCategory = cat) }
    }

    fun toggleFavorite(id: String) {
        _uiState.update { state ->
            val newFavorites = state.favoriteIds.toMutableSet()
            if (newFavorites.contains(id)) {
                newFavorites.remove(id)
            } else {
                newFavorites.add(id)
            }
            state.copy(favoriteIds = newFavorites)
        }
    }

    fun setFavoritesTypeFilter(filter: String) {
        _uiState.update { it.copy(activeFavoritesTypeFilter = filter) }
    }

    fun openRedeemDeal(deal: Deal) {
        _uiState.update { it.copy(activeRedeemDeal = deal) }
    }

    fun closeRedeemDeal() {
        _uiState.update { it.copy(activeRedeemDeal = null) }
    }

    // Business Portal
    fun selectPricingPackage(pkg: PricingPackage) {
        _uiState.update { it.copy(selectedPricingPackage = pkg) }
    }

    fun closeBookingDialog() {
        _uiState.update { it.copy(selectedPricingPackage = null, bookingSuccessMessage = null) }
    }

    fun toggleBillingPeriod(isYearly: Boolean) {
        _uiState.update { it.copy(isBillingYearly = isYearly) }
    }

    fun submitBooking(companyName: String, email: String, kiez: String) {
        val selectedPkg = _uiState.value.selectedPricingPackage?.name ?: "B2B Paket"
        _uiState.update {
            it.copy(
                bookingSuccessMessage = "Wird vor der Veröffentlichung geprüft"
            )
        }
        viewModelScope.launch {
            val json = org.json.JSONObject().apply {
                put("company", companyName)
                put("email", email)
                put("phone", "+4915126509586")
                put("packageName", selectedPkg)
                put("kiez", kiez)
                put("notes", "B2B Buchung aus App")
                put("name", companyName)
            }
            LiveAlertsRepository.postSubmission("booking", json)
        }
    }

    // Business Details
    fun openBusinessDetail(business: LocalBusiness) {
        _uiState.update { it.copy(selectedBusiness = business) }
    }

    fun closeBusinessDetail() {
        _uiState.update { it.copy(selectedBusiness = null) }
    }

    fun addCustomBusiness(business: LocalBusiness) {
        _uiState.update { it.copy(customBusinesses = listOf(business) + it.customBusinesses, showAddBusinessDialog = false) }
        viewModelScope.launch {
            val json = org.json.JSONObject().apply {
                put("name", business.name)
                put("kiez", business.kiezName)
                put("category", business.category)
                put("contact", business.phone.ifBlank { business.whatsapp })
                put("description", business.description)
                put("address", business.address)
                put("website", business.website)
            }
            LiveAlertsRepository.postSubmission("business", json)
        }
        android.widget.Toast.makeText(app, "Wird vor der Veröffentlichung geprüft", android.widget.Toast.LENGTH_LONG).show()
    }

    fun openAddBusinessDialog() {
        _uiState.update { it.copy(showAddBusinessDialog = true) }
    }

    fun closeAddBusinessDialog() {
        _uiState.update { it.copy(showAddBusinessDialog = false) }
    }

    // Event submission
    fun openEventSubmitDialog() {
        _uiState.update { it.copy(showEventSubmitDialog = true, eventSubmitSuccessMessage = null) }
    }

    fun closeEventSubmitDialog() {
        _uiState.update { it.copy(showEventSubmitDialog = false, eventSubmitSuccessMessage = null) }
    }

    fun submitNewEvent(
        title: String,
        kiezName: String,
        dayLabel: String,
        time: String,
        price: String,
        category: String,
        desc: String
    ) {
        val newEvent = KiezEvent(
            id = "custom_event_${System.currentTimeMillis()}",
            title = title,
            dayLabel = dayLabel,
            dateNum = "28",
            monthLabel = "OKT",
            time = time,
            kiezName = kiezName,
            price = price.ifBlank { "Kostenlos" },
            isFree = price.contains("kostenlos", ignoreCase = true) || price.contains("frei", ignoreCase = true) || price.isBlank(),
            category = category,
            description = desc,
            imageUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
            locationAddress = "$kiezName, Berlin",
            organizer = "Kiez Community"
        )
        _uiState.update {
            it.copy(
                customEvents = listOf(newEvent) + it.customEvents,
                showEventSubmitDialog = false,
                eventSubmitSuccessMessage = "Wird vor der Veröffentlichung geprüft"
            )
        }
        viewModelScope.launch {
            val json = org.json.JSONObject().apply {
                put("title", title)
                put("kiez", kiezName)
                put("date", "$dayLabel $time")
                put("category", category)
                put("description", desc)
                put("price", price)
            }
            LiveAlertsRepository.postSubmission("event", json)
        }
    }

    // Stories
    fun openStory(story: KiezStory, list: List<KiezStory> = emptyList(), index: Int = 0) {
        // If it's an institution story (BVG, S-Bahn, Feuerwehr, Polizei, Bürgeramt, Senat, Kultur),
        // load all 10 authentic reports for this specific institution so user can browse all official incident reports
        if (story.id.startsWith("inst_story_")) {
            val matchingFolder = BulletinFolder.values().firstOrNull { folder ->
                story.id.contains(folder.key, ignoreCase = true) || story.author.contains(folder.key, ignoreCase = true)
            }
            if (matchingFolder != null) {
                val folderStories = LiveAlertsRepository.getFolderStories(matchingFolder, LiveAlertsRepository.liveAlerts.value, _uiState.value.language)
                if (folderStories.isNotEmpty()) {
                    val validIdx = folderStories.indexOfFirst { it.headline == story.headline }.takeIf { it >= 0 } ?: 0
                    _uiState.update {
                        it.copy(
                            activeStory = folderStories[validIdx],
                            activeStoriesList = folderStories,
                            activeStoryIndex = validIdx
                        )
                    }
                    return
                }
            }
        }

        val fullList = if (list.isNotEmpty()) list else listOf(story)
        val validIndex = if (index in fullList.indices) index else fullList.indexOf(story).coerceAtLeast(0)
        _uiState.update {
            it.copy(
                activeStory = story,
                activeStoriesList = fullList,
                activeStoryIndex = validIndex
            )
        }
    }

    fun closeStory() {
        _uiState.update {
            it.copy(
                activeStory = null,
                activeStoriesList = emptyList(),
                activeStoryIndex = 0
            )
        }
    }

    fun openAddStoryDialog() {
        _uiState.update { it.copy(showAddStoryDialog = true) }
    }

    fun closeAddStoryDialog() {
        _uiState.update { it.copy(showAddStoryDialog = false) }
    }

    fun clearStoryFeedback() {
        _uiState.update { it.copy(storySubmissionFeedback = null) }
    }

    fun submitStory(
        headline: String,
        subtext: String,
        kiez: String,
        kind: String,
        color: String,
        author: String,
        mediaUri: String? = null,
        isVideo: Boolean = false,
        isCommercial: Boolean = false,
        durationHours: Int = 24,
        pricePaid: Double = 0.0,
        link: String = ""
    ) {
        val lowerText = "$headline $subtext $author".lowercase()
        // Moderation filter: Politic, bad words / swearing, 18+ adult content prohibited
        val prohibitedWords = listOf(
            "porno", "sex", "18+", "nackt", "xxx", "erotik",
            "hurensohn", "arschloch", "bastard", "wichser", "scheisse", "fick", "küfür", "piç", "orospu",
            "nazi", "hitler", "afd", "faschist", "terror", "krieg", "propaganda"
        )
        val hasProhibitedContent = prohibitedWords.any { lowerText.contains(it) }

        val persistentMediaUri = mediaUri?.takeIf { it.isNotBlank() }?.let {
            KiezStorageManager.copyMediaToInternalStorage(app, it, isVideo)
        }

        if (hasProhibitedContent) {
            val rejectedStory = KiezStory(
                id = "story_${System.currentTimeMillis()}",
                headline = headline,
                subtext = subtext,
                kind = kind,
                headlineColor = color,
                kiez = kiez,
                author = author,
                timeAgo = "gerade eben",
                mediaUri = persistentMediaUri,
                isVideo = isVideo,
                isCommercial = isCommercial,
                durationHours = durationHours,
                pricePaid = pricePaid,
                link = link,
                status = "rejected",
                modNote = "Automatisch abgelehnt: Verstoß gegen Inhaltsregeln (18+/Politik/Beleidigung)"
            )
            _uiState.update {
                val updatedStories = listOf(rejectedStory) + it.allStories
                KiezStorageManager.saveStories(app, updatedStories)
                it.copy(
                    allStories = updatedStories,
                    customStories = listOf(rejectedStory) + it.customStories,
                    showAddStoryDialog = false,
                    storySubmissionFeedback = "REJECTED"
                )
            }
            return
        }

        val validDuration = if (durationHours == 48) 48 else 24
        val newStory = KiezStory(
            id = "story_${System.currentTimeMillis()}",
            headline = headline,
            subtext = subtext,
            kind = kind,
            headlineColor = color,
            kiez = kiez,
            author = author.ifBlank { "Kiez-User" },
            timeAgo = "gerade eben",
            mediaUri = persistentMediaUri,
            isVideo = isVideo,
            isCommercial = isCommercial,
            durationHours = validDuration,
            pricePaid = pricePaid,
            link = link,
            status = "approved",
            modNote = "KI: Geprüft & Freigegeben",
            createdAtMillis = System.currentTimeMillis()
        )
        _uiState.update {
            val updatedStories = listOf(newStory) + it.allStories
            KiezStorageManager.saveStories(app, updatedStories)
            it.copy(
                allStories = updatedStories,
                customStories = listOf(newStory) + it.customStories,
                showAddStoryDialog = false,
                storySubmissionFeedback = "Wird vor der Veröffentlichung geprüft"
            )
        }
        viewModelScope.launch {
            var fileBytes: ByteArray? = null
            var fileName: String? = null
            var mimeType: String? = null
            if (mediaUri != null && mediaUri.isNotBlank()) {
                try {
                    val uri = android.net.Uri.parse(mediaUri)
                    val cr = app.contentResolver
                    mimeType = cr.getType(uri) ?: "image/jpeg"
                    val inputStream = cr.openInputStream(uri)
                    fileBytes = inputStream?.readBytes()
                    inputStream?.close()
                    fileName = "story_${System.currentTimeMillis()}.${if (mimeType.contains("png")) "png" else "jpg"}"
                } catch (_: Exception) {}
            }
            LiveAlertsRepository.postStoryMultipart(
                headline = headline,
                subtext = subtext,
                kiez = kiez,
                kind = kind,
                durationHours = validDuration,
                fileBytes = fileBytes,
                fileName = fileName,
                mimeType = mimeType
            )
            LiveAlertsRepository.postRemoteStory(newStory)
        }
        android.widget.Toast.makeText(app, "Wird vor der Veröffentlichung geprüft", android.widget.Toast.LENGTH_LONG).show()
    }

    fun dismissUpdateDialog() {
        _uiState.update { it.copy(appUpdateInfo = null) }
    }

    // Admin Actions (Freigeben, Ablehnen, Löschen, Verlängern, Bearbeiten)
    fun setAdminAuthenticated(auth: Boolean) {
        KiezStorageManager.setAdminAuthenticated(app, auth)
        _uiState.update { it.copy(isAdminAuthenticated = auth) }
    }

    fun setAdminStoriesTab(tab: String) {
        _uiState.update { it.copy(adminStoriesTab = tab) }
    }

    fun approveStory(storyId: String, durationHours: Int? = null) {
        _uiState.update { state ->
            val updateFn = { story: KiezStory ->
                if (story.id == storyId) {
                    story.copy(
                        status = "approved",
                        durationHours = durationHours ?: story.durationHours,
                        modNote = "Admin: Freigegeben"
                    )
                } else story
            }
            val newAll = state.allStories.map(updateFn)
            KiezStorageManager.saveStories(app, newAll)
            state.copy(
                allStories = newAll,
                customStories = state.customStories.map(updateFn)
            )
        }
    }

    fun rejectStory(storyId: String, reason: String = "Von Admin abgelehnt") {
        _uiState.update { state ->
            val updateFn = { story: KiezStory ->
                if (story.id == storyId) {
                    story.copy(status = "rejected", modNote = reason)
                } else story
            }
            val newAll = state.allStories.map(updateFn)
            KiezStorageManager.saveStories(app, newAll)
            state.copy(
                allStories = newAll,
                customStories = state.customStories.map(updateFn)
            )
        }
    }

    fun extendStory(storyId: String, additionalHours: Int) {
        _uiState.update { state ->
            val updateFn = { story: KiezStory ->
                if (story.id == storyId) {
                    story.copy(
                        durationHours = story.durationHours + additionalHours,
                        modNote = "Admin: +$additionalHours Std. verlängert"
                    )
                } else story
            }
            val newAll = state.allStories.map(updateFn)
            KiezStorageManager.saveStories(app, newAll)
            state.copy(
                allStories = newAll,
                customStories = state.customStories.map(updateFn)
            )
        }
    }

    fun deleteStory(storyId: String) {
        _uiState.update { state ->
            val newAll = state.allStories.filterNot { it.id == storyId }
            KiezStorageManager.saveStories(app, newAll)
            state.copy(
                allStories = newAll,
                customStories = state.customStories.filterNot { it.id == storyId }
            )
        }
    }

    fun updateStoryHeadline(storyId: String, newHeadline: String, newSubtext: String) {
        _uiState.update { state ->
            val updateFn = { story: KiezStory ->
                if (story.id == storyId) {
                    story.copy(headline = newHeadline, subtext = newSubtext)
                } else story
            }
            val newAll = state.allStories.map(updateFn)
            KiezStorageManager.saveStories(app, newAll)
            state.copy(
                allStories = newAll,
                customStories = state.customStories.map(updateFn)
            )
        }
    }

    fun addAdminStory(
        headline: String,
        subtext: String,
        kiez: String,
        kind: String,
        color: String,
        author: String,
        mediaUri: String? = null,
        isVideo: Boolean = false,
        durationHours: Int = 48
    ) {
        val persistentMediaUri = mediaUri?.takeIf { it.isNotBlank() }?.let {
            KiezStorageManager.copyMediaToInternalStorage(app, it, isVideo)
        }

        val adminStory = KiezStory(
            id = "story_admin_${System.currentTimeMillis()}",
            headline = headline,
            subtext = subtext,
            kind = kind,
            headlineColor = color,
            kiez = kiez,
            author = author.ifBlank { "Admin" },
            timeAgo = "gerade eben",
            mediaUri = persistentMediaUri,
            isVideo = isVideo,
            durationHours = durationHours,
            status = "approved",
            modNote = "KI: Admin Direktfreigabe",
            createdAtMillis = System.currentTimeMillis()
        )
        _uiState.update {
            val newAll = listOf(adminStory) + it.allStories
            KiezStorageManager.saveStories(app, newAll)
            it.copy(
                allStories = newAll,
                customStories = listOf(adminStory) + it.customStories
            )
        }
        viewModelScope.launch {
            LiveAlertsRepository.postRemoteStory(adminStory)
        }
    }

    // Jobs
    fun addJob(
        title: String,
        company: String,
        kiez: String,
        type: String,
        salary: String,
        contactWa: String,
        desc: String
    ) {
        val newJob = KiezJob(
            id = "job_${System.currentTimeMillis()}",
            title = title,
            company = company,
            kiez = kiez,
            jobType = type,
            salary = salary.ifBlank { "Nach Vereinbarung" },
            description = desc,
            contactWa = contactWa.ifBlank { "+4915126509586" },
            contactPhone = "+49 30 123456"
        )
        _uiState.update {
            it.copy(customJobs = listOf(newJob) + it.customJobs)
        }
        viewModelScope.launch {
            val json = org.json.JSONObject().apply {
                put("title", title)
                put("company", company)
                put("kiez", kiez)
                put("contact", contactWa.ifBlank { "+4915126509586" })
                put("description", desc)
                put("salary", salary)
                put("jobType", type)
            }
            LiveAlertsRepository.postSubmission("job", json)
        }
        android.widget.Toast.makeText(app, "Wird vor der Veröffentlichung geprüft", android.widget.Toast.LENGTH_LONG).show()
    }

    // Reporter
    fun submitReporterPost(
        title: String,
        kiez: String,
        category: String,
        desc: String,
        author: String
    ) {
        val post = KiezReporterPost(
            id = "rep_${System.currentTimeMillis()}",
            title = title,
            description = desc,
            kiez = kiez,
            category = category,
            author = author.ifBlank { "Berliner Nachbar" },
            timeAgo = "Gerade eben",
            upvotes = 1,
            comments = emptyList()
        )
        val updated = listOf(post) + _uiState.value.customReports
        _uiState.update {
            it.copy(customReports = updated)
        }
        KiezStorageManager.saveCustomReports(app, updated)
        viewModelScope.launch {
            LiveAlertsRepository.postRemoteReporterPost(post)
        }
    }

    fun addReporterComment(postId: String, author: String, text: String) {
        if (text.isBlank()) return
        val comment = KiezReporterComment(
            id = "comm_${System.currentTimeMillis()}",
            author = if (author.isBlank()) "Berliner Nachbar" else author.trim(),
            text = text.trim()
        )
        val updatedComments = KiezStorageManager.addCommentToPost(app, postId, comment)

        val updatedCustom = _uiState.value.customReports.map { post ->
            if (post.id == postId) {
                post.copy(comments = updatedComments)
            } else {
                post
            }
        }
        _uiState.update {
            it.copy(customReports = updatedCustom)
        }
        KiezStorageManager.saveCustomReports(app, updatedCustom)
        viewModelScope.launch {
            LiveAlertsRepository.postReporterComment(postId, text.trim(), author.ifBlank { "Berliner Nachbar" })
        }
    }

    // Quiz Functions
    fun answerQuizOption(optionIndex: Int) {
        if (_uiState.value.quizIsAnswerChecked) return
        val currentQ = SampleData.quizQuestions.getOrNull(_uiState.value.quizCurrentIndex) ?: return
        val isCorrect = optionIndex == currentQ.correctIndex
        _uiState.update {
            it.copy(
                quizSelectedOption = optionIndex,
                quizIsAnswerChecked = true,
                quizScore = if (isCorrect) it.quizScore + 1 else it.quizScore
            )
        }
    }

    fun nextQuizQuestion() {
        val nextIdx = _uiState.value.quizCurrentIndex + 1
        if (nextIdx < SampleData.quizQuestions.size) {
            _uiState.update {
                it.copy(
                    quizCurrentIndex = nextIdx,
                    quizSelectedOption = null,
                    quizIsAnswerChecked = false
                )
            }
        } else {
            _uiState.update { it.copy(quizFinished = true) }
        }
    }

    fun restartQuiz() {
        _uiState.update {
            it.copy(
                quizCurrentIndex = 0,
                quizSelectedOption = null,
                quizIsAnswerChecked = false,
                quizScore = 0,
                quizFinished = false
            )
        }
    }
}
