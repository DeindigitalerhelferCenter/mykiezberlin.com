package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.data.model.*
import com.example.data.repository.LiveBerlinFeedRepository
import com.example.ui.components.BigparaMarketStrip
import com.example.ui.components.MansetSliderComponent
import com.example.ui.theme.BerlinBlue
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinYellow
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SportsAndMarketsScreen(
    language: AppLanguage,
    onBack: () -> Unit
) {
    BackHandler { onBack() }
    val context = LocalContext.current

    // Live Ticking Clock State (Updated every second)
    var currentTimeMillis by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            currentTimeMillis = System.currentTimeMillis()
            delay(1000)
        }
    }

    val timeFormat = remember { SimpleDateFormat("HH:mm:ss", Locale.GERMANY) }
    val dateFormatDe = remember { SimpleDateFormat("EEEE, d. MMMM yyyy", Locale.GERMAN) }
    val dateFormatTr = remember { SimpleDateFormat("d MMMM yyyy, EEEE", Locale("tr", "TR")) }

    val formattedTime = timeFormat.format(Date(currentTimeMillis))
    val formattedDate = if (language == AppLanguage.TURKISH) {
        dateFormatTr.format(Date(currentTimeMillis))
    } else {
        dateFormatDe.format(Date(currentTimeMillis))
    }

    // Connect to real feeds from LiveBerlinFeedRepository
    val liveWeather by LiveBerlinFeedRepository.liveWeather.collectAsState()
    val liveQuotes by LiveBerlinFeedRepository.liveQuotes.collectAsState()
    val liveNews by LiveBerlinFeedRepository.liveNews.collectAsState()
    val liveSportNews by LiveBerlinFeedRepository.liveSportNews.collectAsState()
    val liveSportData by LiveBerlinFeedRepository.liveSportData.collectAsState()
    val isRefreshingFeeds by LiveBerlinFeedRepository.isRefreshing.collectAsState()

    // Sport League Tab State (0 = 1. Bundesliga, 1 = 2. Bundesliga)
    var selectedLeagueTabIndex by remember { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Berlin Canlı Spor & Piyasa" else "Berlin Live-Sport & Märkte",
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp
                        )
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Saat, Hava Durumu, Borsa & Canlı Spor" else "Uhrzeit, Wetter, Börse & Live-Sport",
                            fontSize = 11.5.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.testTag("sports_markets_back_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Zurück"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        currentTimeMillis = System.currentTimeMillis()
                        LiveBerlinFeedRepository.refreshLiveFeeds()
                        LiveBerlinFeedRepository.refreshSportData()
                    }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Aktualisieren",
                            tint = if (isRefreshingFeeds) BerlinGreen else MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(14.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. DIGITAL LIVE BERLIN CLOCK & DATE BANNER
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, BerlinBlue.copy(alpha = 0.3f)),
                    shadowElevation = 3.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        BerlinBlue.copy(alpha = 0.08f),
                                        Color.Transparent
                                    )
                                )
                            )
                            .padding(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .background(BerlinGreen, CircleShape)
                                )
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "BERLİN CANLI SAATİ" else "BERLIN ECHTZEIT-UHR",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = BerlinBlue,
                                    letterSpacing = 0.5.sp
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = BerlinGreen.copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = "MEZ (UTC+1) · LIVE",
                                    color = BerlinGreen,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = formattedTime,
                            fontSize = 38.sp,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.onSurface,
                            letterSpacing = 1.sp
                        )

                        Text(
                            text = formattedDate,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // 2. LIVE WEATHER & 7-DAY FORECAST (Dynamically from /api/live)
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                    shadowElevation = 2.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.WbSunny, contentDescription = null, tint = BerlinYellow)
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Berlin Canlı Hava Durumu" else "Berlin Live-Wetter",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                            Text(
                                text = "Station: Berlin Alexanderplatz",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        val weather = liveWeather
                        if (weather == null) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.padding(vertical = 8.dp)
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Canlı hava verileri alınıyor..." else "Live-Wetter wird geladen...",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        } else {
                            // Current Temperature & Conditions
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "${weather.temperature.roundToInt()}°C",
                                        fontSize = 36.sp,
                                        fontWeight = FontWeight.Black,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = getWeatherConditionLabel(weather.code, language),
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                        Text(
                                            text = if (language == AppLanguage.TURKISH)
                                                "Hissedilen: ${weather.feelsLike.roundToInt()}°C · Nem: %${weather.humidity}"
                                            else
                                                "Gefühlt: ${weather.feelsLike.roundToInt()}°C · Luftfeuchte: ${weather.humidity}%",
                                            fontSize = 11.5.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = BerlinBlue.copy(alpha = 0.12f)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.Air, contentDescription = null, tint = BerlinBlue, modifier = Modifier.size(14.dp))
                                        Text(text = "${weather.wind} km/h", fontSize = 11.5.sp, color = BerlinBlue, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            // 7-Tage Forecast
                            if (weather.days.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(14.dp))
                                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                                Spacer(modifier = Modifier.height(12.dp))

                                Text(
                                    text = if (language == AppLanguage.TURKISH) "📅 7 Günlük Canlı Tahmin" else "📅 7-Tage Wetterprognose",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.primary
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    items(weather.days) { day ->
                                        Surface(
                                            shape = RoundedCornerShape(10.dp),
                                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                                            modifier = Modifier.width(96.dp)
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(8.dp),
                                                horizontalAlignment = Alignment.CenterHorizontally
                                            ) {
                                                Text(
                                                    text = formatForecastDate(day.date, language),
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 11.sp,
                                                    maxLines = 1
                                                )
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Icon(
                                                    imageVector = getWeatherIcon(day.code),
                                                    contentDescription = null,
                                                    tint = if (day.rainChance > 20) BerlinBlue else BerlinYellow,
                                                    modifier = Modifier.size(22.dp)
                                                )
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = "${day.max.roundToInt()}° / ${day.min.roundToInt()}°",
                                                    fontWeight = FontWeight.ExtraBold,
                                                    fontSize = 12.sp
                                                )
                                                Text(
                                                    text = "☔ ${day.rainChance}%",
                                                    fontSize = 10.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 3. BERLIN GÜNLÜK MANŞET SLAYTI (Dynamic live slides mapped from /api/live news)
            item {
                MansetSliderComponent(language = language)
            }

            // 4. BIGPARA CANLI PİYASA BANDI (Exclusively from /api/live quotes)
            item {
                BigparaMarketStrip(language = language)
            }

            // 5. LIVE FINANCIAL MARKETS & CURRENCIES (Quotes grid from /api/live)
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                    shadowElevation = 2.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.TrendingUp, contentDescription = null, tint = BerlinGreen)
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Canlı Piyasa & Kurlar" else "Live-Märkte & Devisen",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = BerlinGreen.copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = "mykiezberlin.com/api/live",
                                    color = BerlinGreen,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        if (liveQuotes.isEmpty()) {
                            Text(
                                text = "Live-Daten nicht erreichbar",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                liveQuotes.chunked(2).forEach { rowQuotes ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        rowQuotes.forEach { q ->
                                            Surface(
                                                shape = RoundedCornerShape(10.dp),
                                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                                border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .clickable {
                                                        val targetUrl = when {
                                                            q.code.contains("USD") -> "https://bigpara.hurriyet.com.tr/doviz/dolar/"
                                                            q.code.contains("EUR") -> "https://bigpara.hurriyet.com.tr/doviz/euro/"
                                                            q.code.contains("GOLD") -> "https://bigpara.hurriyet.com.tr/altin/gram-altin-fiyati/"
                                                            q.code.contains("BIST") -> "https://bigpara.hurriyet.com.tr/borsa/canli-borsa/"
                                                            q.code.contains("DAX") -> "https://www.boerse-frankfurt.de/indices/dax"
                                                            else -> "https://bigpara.hurriyet.com.tr/"
                                                        }
                                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl)))
                                                    }
                                            ) {
                                                Column(modifier = Modifier.padding(10.dp)) {
                                                    Row(
                                                        modifier = Modifier.fillMaxWidth(),
                                                        horizontalArrangement = Arrangement.SpaceBetween,
                                                        verticalAlignment = Alignment.CenterVertically
                                                    ) {
                                                        Text(
                                                            text = q.code,
                                                            fontWeight = FontWeight.Bold,
                                                            fontSize = 12.sp,
                                                            color = MaterialTheme.colorScheme.onSurface
                                                        )
                                                        Text(
                                                            text = q.formattedChange(),
                                                            fontSize = 11.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = if (q.isPositive) BerlinGreen else BerlinRed
                                                        )
                                                    }
                                                    Spacer(modifier = Modifier.height(4.dp))
                                                    Text(
                                                        text = "${q.formattedValue()} ${q.currency}",
                                                        fontWeight = FontWeight.Black,
                                                        fontSize = 14.5.sp,
                                                        color = MaterialTheme.colorScheme.primary
                                                    )
                                                    Text(
                                                        text = "${q.name} · ${q.source}",
                                                        fontSize = 10.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                }
                                            }
                                        }
                                        if (rowQuotes.size == 1) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 6. SPOR VERİSİ (https://mykiezberlin.com/api/sport)
            // Berlin kulüpleri üstte, altında 1. ve 2. Bundesliga puan durumu ve fikstürler
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                    shadowElevation = 2.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.SportsSoccer, contentDescription = null, tint = BerlinRed)
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Berlin Kulüpleri & Bundesliga" else "Berliner Klubs & Bundesliga",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                            TextButton(
                                onClick = {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.kicker.de/bundesliga/spieltag")))
                                },
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("kicker.de", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(imageVector = Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(12.dp))
                            }
                        }

                        val sportData = liveSportData
                        if (sportData == null) {
                            Text(
                                text = "Live-Daten nicht erreichbar",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        } else {
                            // 6.1 BERLIN KULÜPLERİ (ÜSTTE ÖZEL KARTLAR)
                            if (sportData.berlin.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Başkent Kulüpleri (Canlı Durum)" else "Berliner Hauptstadt-Klubs",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.height(6.dp))

                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    sportData.berlin.forEach { bTeam ->
                                        val teamColor = if (bTeam.team.contains("Union", true)) BerlinRed else BerlinBlue
                                        Surface(
                                            shape = RoundedCornerShape(12.dp),
                                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                                            border = BorderStroke(1.dp, teamColor.copy(alpha = 0.4f)),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column(modifier = Modifier.padding(12.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Row(
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                    ) {
                                                        Box(modifier = Modifier.size(10.dp).background(teamColor, CircleShape))
                                                        Text(
                                                            text = bTeam.team,
                                                            fontWeight = FontWeight.ExtraBold,
                                                            fontSize = 14.sp
                                                        )
                                                    }
                                                    Surface(
                                                        shape = RoundedCornerShape(6.dp),
                                                        color = teamColor.copy(alpha = 0.15f)
                                                    ) {
                                                        Text(
                                                            text = "${bTeam.position}. Platz · ${bTeam.points} Pkt.",
                                                            fontSize = 11.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = teamColor,
                                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                        )
                                                    }
                                                }

                                                Text(
                                                    text = bTeam.league,
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )

                                                if (bTeam.lastMatch.isNotBlank()) {
                                                    Spacer(modifier = Modifier.height(4.dp))
                                                    Text(
                                                        text = (if (language == AppLanguage.TURKISH) "Son Maç: " else "Letztes Spiel: ") + bTeam.lastMatch,
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                }
                                                if (bTeam.nextMatch.isNotBlank()) {
                                                    Text(
                                                        text = (if (language == AppLanguage.TURKISH) "Gelecek Maç: " else "Nächstes Spiel: ") + bTeam.nextMatch,
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = teamColor
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // 6.2 1. & 2. BUNDESLIGA TABLOLARI VE MAÇLARI
                            Spacer(modifier = Modifier.height(14.dp))
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                            Spacer(modifier = Modifier.height(10.dp))

                            // League Tabs
                            TabRow(
                                selectedTabIndex = selectedLeagueTabIndex,
                                containerColor = Color.Transparent,
                                contentColor = MaterialTheme.colorScheme.primary
                            ) {
                                Tab(
                                    selected = selectedLeagueTabIndex == 0,
                                    onClick = { selectedLeagueTabIndex = 0 },
                                    text = { Text("1. Bundesliga", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
                                )
                                Tab(
                                    selected = selectedLeagueTabIndex == 1,
                                    onClick = { selectedLeagueTabIndex = 1 },
                                    text = { Text("2. Bundesliga", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
                                )
                            }

                            val activeLeague = if (selectedLeagueTabIndex == 0) {
                                sportData.leagues.firstOrNull { it.id == "bl1" } ?: sportData.leagues.getOrNull(0)
                            } else {
                                sportData.leagues.firstOrNull { it.id == "bl2" } ?: sportData.leagues.getOrNull(1)
                            }

                            if (activeLeague != null) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = activeLeague.name + (if (language == AppLanguage.TURKISH) " — Puan Durumu" else " — Tabelle"),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                                Spacer(modifier = Modifier.height(6.dp))

                                // Table Header
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("#", fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(22.dp))
                                    Text(if (language == AppLanguage.TURKISH) "Takım" else "Team", fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                                    Text(if (language == AppLanguage.TURKISH) "OM" else "Sp", fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(28.dp))
                                    Text(if (language == AppLanguage.TURKISH) "Av" else "+/-", fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(28.dp))
                                    Text(if (language == AppLanguage.TURKISH) "Puan" else "Pkt", fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(36.dp))
                                }

                                // Table Rows (Berlin clubs highlighted)
                                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    activeLeague.table.forEach { row ->
                                        val isBerlinClub = row.berlin
                                        Surface(
                                            color = if (isBerlinClub) BerlinBlue.copy(alpha = 0.15f) else Color.Transparent,
                                            shape = RoundedCornerShape(4.dp),
                                            border = if (isBerlinClub) BorderStroke(1.dp, BerlinBlue.copy(alpha = 0.4f)) else null,
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = "${row.position}",
                                                    fontSize = 11.sp,
                                                    fontWeight = if (isBerlinClub) FontWeight.Black else FontWeight.Normal,
                                                    color = if (isBerlinClub) BerlinBlue else MaterialTheme.colorScheme.onSurface,
                                                    modifier = Modifier.width(22.dp)
                                                )
                                                Row(
                                                    modifier = Modifier.weight(1f),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    Text(
                                                        text = row.team,
                                                        fontSize = 11.5.sp,
                                                        fontWeight = if (isBerlinClub) FontWeight.Black else FontWeight.Medium,
                                                        color = if (isBerlinClub) BerlinBlue else MaterialTheme.colorScheme.onSurface,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                    if (isBerlinClub) {
                                                        Surface(shape = RoundedCornerShape(3.dp), color = BerlinRed) {
                                                            Text("BERLIN", fontSize = 8.sp, fontWeight = FontWeight.Black, color = Color.White, modifier = Modifier.padding(horizontal = 3.dp, vertical = 1.dp))
                                                        }
                                                    }
                                                }
                                                Text("${row.played}", fontSize = 11.sp, modifier = Modifier.width(28.dp))
                                                Text(
                                                    text = if (row.goalDiff > 0) "+${row.goalDiff}" else "${row.goalDiff}",
                                                    fontSize = 11.sp,
                                                    modifier = Modifier.width(28.dp)
                                                )
                                                Text(
                                                    text = "${row.points}",
                                                    fontSize = 11.5.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (isBerlinClub) BerlinBlue else MaterialTheme.colorScheme.onSurface,
                                                    modifier = Modifier.width(36.dp)
                                                )
                                            }
                                        }
                                    }
                                }

                                // Matches & Fixtures
                                if (activeLeague.matches.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text(
                                        text = activeLeague.name + (if (language == AppLanguage.TURKISH) " — Maç Fikstürü" else " — Spieltag"),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.5.sp
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))

                                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                        activeLeague.matches.forEach { match ->
                                            Surface(
                                                shape = RoundedCornerShape(8.dp),
                                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(8.dp),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text(match.home, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                                                    Surface(shape = RoundedCornerShape(4.dp), color = MaterialTheme.colorScheme.surface) {
                                                        Text(
                                                            text = if (match.finished && match.homeGoals != null && match.awayGoals != null)
                                                                "${match.homeGoals} : ${match.awayGoals}"
                                                            else
                                                                formatKickoffTime(match.kickoff),
                                                            fontSize = 11.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = if (match.finished) BerlinRed else MaterialTheme.colorScheme.primary,
                                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                        )
                                                    }
                                                    Text(match.away, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), textAlign = androidx.compose.ui.text.style.TextAlign.End)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 7. BERLIN CANLI BASIN VE SPOR HABERLERİ (Exclusively from /api/live news and sport)
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                    shadowElevation = 2.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Newspaper, contentDescription = null, tint = BerlinBlue)
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Berlin Basın ve Spor Haberleri" else "Berliner Presse & Sportnews",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                            Text(
                                text = "mykiezberlin.com/api/live",
                                fontSize = 11.sp,
                                color = BerlinBlue,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "Canlı gazetelerden anlık haberler. Başlığa veya resme tıklayarak doğrudan orijinal habere ulaşabilirsiniz."
                            else
                                "Echtzeit-Meldungen aus Berliner Medien mit Direktlink zum Originalartikel.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        val allArticles = (liveNews + liveSportNews).distinctBy { it.link.ifBlank { it.title } }
                        if (allArticles.isEmpty()) {
                            Text(
                                text = "Live-Daten nicht erreichbar",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                allArticles.take(12).forEach { article ->
                                    val publisherColor = when {
                                        article.source.contains("Tagesspiegel", true) -> 0xFF003087
                                        article.source.contains("rbb", true) -> 0xFFE30613
                                        article.source.contains("Kurier", true) -> 0xFF005A9C
                                        article.source.contains("B.Z.", true) -> 0xFFE50000
                                        article.source.contains("Bild", true) -> 0xFFE2001A
                                        else -> 0xFF003399
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                                        border = BorderStroke(0.8.dp, Color(publisherColor).copy(alpha = 0.3f)),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                if (article.link.isNotBlank()) {
                                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(article.link)))
                                                }
                                            }
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Surface(
                                                    shape = RoundedCornerShape(6.dp),
                                                    color = Color(publisherColor)
                                                ) {
                                                    Text(
                                                        text = article.source,
                                                        color = Color.White,
                                                        fontSize = 10.5.sp,
                                                        fontWeight = FontWeight.ExtraBold,
                                                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.5.dp)
                                                    )
                                                }
                                                Text(
                                                    text = formatRelativeTime(article.publishedAt, language),
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }

                                            Spacer(modifier = Modifier.height(8.dp))

                                            Text(
                                                text = article.title,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.5.sp,
                                                color = MaterialTheme.colorScheme.onSurface
                                            )

                                            if (article.summary.isNotBlank()) {
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = article.summary,
                                                    fontSize = 12.sp,
                                                    lineHeight = 16.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                    maxLines = 3,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                            }

                                            // Article Image or Placeholder
                                            Spacer(modifier = Modifier.height(8.dp))
                                            if (article.image.isNotBlank()) {
                                                AsyncImage(
                                                    model = article.image,
                                                    contentDescription = article.title,
                                                    contentScale = ContentScale.Crop,
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .height(130.dp)
                                                        .clip(RoundedCornerShape(8.dp))
                                                )
                                            } else {
                                                // Clean placeholder when image is absent
                                                Surface(
                                                    shape = RoundedCornerShape(8.dp),
                                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .height(60.dp)
                                                ) {
                                                    Row(
                                                        modifier = Modifier.padding(10.dp),
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                    ) {
                                                        Icon(
                                                            imageVector = Icons.Default.Newspaper,
                                                            contentDescription = null,
                                                            tint = Color(publisherColor),
                                                            modifier = Modifier.size(24.dp)
                                                        )
                                                        Text(
                                                            text = article.source + (if (language == AppLanguage.TURKISH) " · Haberin devamını okumak için tıklayın ›" else " · Zum Artikel ›"),
                                                            fontSize = 11.sp,
                                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                                        )
                                                    }
                                                }
                                            }

                                            Spacer(modifier = Modifier.height(8.dp))

                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.End
                                            ) {
                                                Button(
                                                    onClick = {
                                                        if (article.link.isNotBlank()) {
                                                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(article.link)))
                                                        }
                                                    },
                                                    shape = RoundedCornerShape(8.dp),
                                                    colors = ButtonDefaults.buttonColors(containerColor = Color(publisherColor)),
                                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                                    modifier = Modifier.height(30.dp)
                                                ) {
                                                    Text(
                                                        text = if (language == AppLanguage.TURKISH) "Gazetede Oku" else "Im Original lesen",
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Icon(
                                                        imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(12.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

// ==========================================
// Weather and Date Formatting Helpers
// ==========================================

private fun getWeatherConditionLabel(code: Int, lang: AppLanguage): String {
    val isTr = lang == AppLanguage.TURKISH
    return when (code) {
        0 -> if (isTr) "Güneşli & Açık" else "Klarer Himmel"
        1, 2 -> if (isTr) "Az Bulutlu" else "Leicht bewölkt"
        3 -> if (isTr) "Parçalı Bulutlu" else "Bewölkt"
        45, 48 -> if (isTr) "Sisli" else "Nebel"
        51, 53, 55 -> if (isTr) "Çisenti" else "Leichter Nieselregen"
        61, 63, 65 -> if (isTr) "Yağmurlu" else "Regen"
        71, 73, 75 -> if (isTr) "Karlı" else "Schneefall"
        80, 81, 82 -> if (isTr) "Sağanak Yağış" else "Regenschauer"
        95, 96, 99 -> if (isTr) "Fırtına & Gök Gürültüsü" else "Gewitter"
        else -> if (isTr) "Açık & Ilık" else "Heiter & Mild"
    }
}

private fun getWeatherIcon(code: Int) = when (code) {
    0, 1 -> Icons.Default.WbSunny
    2, 3 -> Icons.Default.CloudQueue
    45, 48 -> Icons.Default.Cloud
    61, 63, 65, 80, 81, 82 -> Icons.Default.WaterDrop
    71, 73, 75 -> Icons.Default.AcUnit
    95, 96, 99 -> Icons.Default.FlashOn
    else -> Icons.Default.WbSunny
}

private fun formatForecastDate(dateStr: String, lang: AppLanguage): String {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.GERMANY)
        val d = sdf.parse(dateStr) ?: return dateStr
        val outSdf = if (lang == AppLanguage.TURKISH) {
            SimpleDateFormat("EEE, d MMM", Locale("tr", "TR"))
        } else {
            SimpleDateFormat("EEE, d. MMM", Locale.GERMAN)
        }
        outSdf.format(d)
    } catch (_: Exception) {
        dateStr
    }
}

private fun formatKickoffTime(kickoff: Long): String {
    if (kickoff <= 0L) return "–"
    return try {
        val sdf = SimpleDateFormat("dd.MM. HH:mm", Locale.GERMANY)
        sdf.format(Date(kickoff))
    } catch (_: Exception) {
        "–"
    }
}

private fun formatRelativeTime(publishedAt: Long, lang: AppLanguage): String {
    if (publishedAt <= 0L) return if (lang == AppLanguage.TURKISH) "az önce" else "gerade eben"
    val diffMs = (System.currentTimeMillis() - publishedAt).coerceAtLeast(0L)
    val diffMins = diffMs / 60000L
    return when {
        diffMins < 1 -> if (lang == AppLanguage.TURKISH) "az önce" else "gerade eben"
        diffMins < 60 -> if (lang == AppLanguage.TURKISH) "$diffMins dk. önce" else "vor $diffMins Min."
        diffMins < 1440 -> {
            val hours = diffMins / 60
            if (lang == AppLanguage.TURKISH) "$hours sa. önce" else "vor $hours Std."
        }
        else -> {
            val days = diffMins / 1440
            if (lang == AppLanguage.TURKISH) "$days gün önce" else "vor $days T."
        }
    }
}
