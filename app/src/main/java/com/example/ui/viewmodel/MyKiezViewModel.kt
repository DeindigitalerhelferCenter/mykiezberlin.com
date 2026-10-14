package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.BerlinBulletinRepository
import com.example.data.repository.KiezStorageManager
import com.example.data.repository.SampleData
import com.example.util.BerlinNotificationItem
import com.example.util.BerlinNotificationManager
import kotlinx.coroutines.delay
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
    BERLIN_TIPS
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
    val activeAlertBanner: BerlinNotificationItem? = null
)

class MyKiezViewModel(application: Application) : AndroidViewModel(application) {
    private val app = application

    private val _uiState: MutableStateFlow<UiState>

    init {
        val initialLang = KiezStorageManager.loadLanguage(application)
        val initialBulletins = BerlinBulletinRepository.loadBulletins(application)
        val userStories = KiezStorageManager.loadStories(application)
        val instStories = BerlinBulletinRepository.generateInstitutionStories(initialBulletins, initialLang)
        val mergedStories = instStories + userStories.filter { u -> instStories.none { it.id == u.id } }
        val savedReports = KiezStorageManager.loadCustomReports(application)

        _uiState = MutableStateFlow(
            UiState(
                language = initialLang,
                isNotificationsEnabled = KiezStorageManager.isNotificationsEnabled(application),
                allStories = mergedStories,
                isAdminAuthenticated = KiezStorageManager.isAdminAuthenticated(application),
                liveBulletins = initialBulletins,
                customReports = savedReports
            )
        )
    }

    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    init {
        // Create notification channel
        BerlinNotificationManager.createNotificationChannel(application)

        // Hourly maintenance coroutine: Prunes bulletins older than 24h
        viewModelScope.launch {
            while (true) {
                delay(60_000L) // Check every 60 seconds
                val current = _uiState.value.liveBulletins
                val pruned = BerlinBulletinRepository.pruneExpiredBulletins(current)
                if (pruned.size != current.size) {
                    BerlinBulletinRepository.saveBulletins(app, pruned)
                    val lang = _uiState.value.language
                    val uStories = KiezStorageManager.loadStories(app)
                    val iStories = BerlinBulletinRepository.generateInstitutionStories(pruned, lang)
                    val mStories = iStories + uStories.filter { u -> iStories.none { it.id == u.id } }
                    _uiState.update { it.copy(liveBulletins = pruned, allStories = mStories) }
                }
            }
        }

        // Automatic Notifications Scheduler (Initial reminder after 1.5s, then periodic)
        viewModelScope.launch {
            delay(1500L) // Initial live reminder 1.5 seconds after startup to prove it works immediately!
            if (KiezStorageManager.isNotificationsEnabled(app)) {
                val item = BerlinNotificationManager.triggerNextNotification(app, _uiState.value.language)
                _uiState.update { it.copy(activeAlertBanner = item) }
            }
            while (true) {
                delay(2 * 3600 * 1000L) // Every 2 hours
                if (KiezStorageManager.isNotificationsEnabled(app)) {
                    val item = BerlinNotificationManager.triggerNextNotification(app, _uiState.value.language)
                    _uiState.update { it.copy(activeAlertBanner = item) }
                }
            }
        }
    }

    fun refreshLiveBulletins() {
        val updated = BerlinBulletinRepository.generateHourlyRefresh(_uiState.value.liveBulletins)
        BerlinBulletinRepository.saveBulletins(app, updated)
        val currentLang = _uiState.value.language
        val uStories = KiezStorageManager.loadStories(app)
        val iStories = BerlinBulletinRepository.generateInstitutionStories(updated, currentLang)
        val mStories = iStories + uStories.filter { u -> iStories.none { it.id == u.id } }
        _uiState.update {
            it.copy(
                liveBulletins = updated,
                allStories = mStories,
                lastBulletinUpdateMillis = System.currentTimeMillis()
            )
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
        val currentBulletins = _uiState.value.liveBulletins
        val uStories = KiezStorageManager.loadStories(app)
        val iStories = BerlinBulletinRepository.generateInstitutionStories(currentBulletins, language)
        val mStories = iStories + uStories.filter { u -> iStories.none { it.id == u.id } }
        _uiState.update { it.copy(language = language, allStories = mStories) }
    }

    fun toggleNotifications(enabled: Boolean) {
        KiezStorageManager.setNotificationsEnabled(app, enabled)
        _uiState.update { it.copy(isNotificationsEnabled = enabled) }
    }

    fun triggerTestNotification() {
        val item = BerlinNotificationManager.triggerNextNotification(app, _uiState.value.language)
        _uiState.update { it.copy(activeAlertBanner = item) }
    }

    fun dismissAlertBanner() {
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
        _uiState.update {
            it.copy(
                bookingSuccessMessage = "Vielen Dank! Die Anfrage für $companyName ($kiez) wurde übermittelt. Wir senden das Angebot an $email."
            )
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
                eventSubmitSuccessMessage = "Veranstaltung '$title' erfolgreich eingereicht und live!"
            )
        }
    }

    // Stories
    fun openStory(story: KiezStory, list: List<KiezStory> = emptyList(), index: Int = 0) {
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

        // Stories are immediately approved and visible on home page and story bar
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
            durationHours = durationHours,
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
                storySubmissionFeedback = "APPROVED"
            )
        }
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
