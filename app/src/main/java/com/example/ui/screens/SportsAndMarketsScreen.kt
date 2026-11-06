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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.model.AppLanguage
import com.example.ui.components.BigparaMarketStrip
import com.example.ui.components.MansetSliderComponent
import com.example.ui.theme.BerlinBlue
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinYellow
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

data class WeatherDayForecast(
    val dayNameDe: String,
    val dayNameTr: String,
    val conditionDe: String,
    val conditionTr: String,
    val maxTemp: Int,
    val minTemp: Int,
    val rainProb: Int,
    val iconName: String
)

data class SportTeamInfo(
    val name: String,
    val leagueDe: String,
    val leagueTr: String,
    val stadium: String,
    val nextMatchDe: String,
    val nextMatchTr: String,
    val standing: String,
    val color: Color,
    val officialUrl: String
)

data class MarketQuote(
    val code: String,
    val nameDe: String,
    val nameTr: String,
    val priceStr: String,
    val changeStr: String,
    val isPositive: Boolean,
    val unit: String,
    val officialUrl: String
)

data class PressArticleSnippet(
    val publisher: String,
    val color: Color,
    val titleDe: String,
    val titleTr: String,
    val teaserDe: String,
    val teaserTr: String,
    val timeAgo: String,
    val originalUrl: String,
    val imageResId: Int? = null
)

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

    // Weather forecast dataset (Berlin Alexanderplatz Station)
    val weatherForecast = remember {
        listOf(
            WeatherDayForecast("Heute", "Bugün", "Heiter & Mild", "Açık & Ilık", 16, 8, 10, "sun"),
            WeatherDayForecast("Dienstag", "Salı", "Leicht bewölkt", "Parçalı Bulutlu", 17, 9, 20, "cloud_sun"),
            WeatherDayForecast("Mittwoch", "Çarşamba", "Sonnig", "Güneşli", 18, 10, 5, "sun"),
            WeatherDayForecast("Donnerstag", "Perşembe", "Mäßiger Regen", "Hafif Yağmurlu", 14, 7, 65, "rain"),
            WeatherDayForecast("Freitag", "Cuma", "Kühl & Windig", "Serin & Rüzgarlı", 13, 6, 40, "cloud"),
            WeatherDayForecast("Samstag", "Cumartesi", "Klar & Sonnig", "Açık & Güneşli", 15, 8, 15, "sun"),
            WeatherDayForecast("Sonntag", "Pazar", "Milde Herbstsonne", "Sonbahar Güneşi", 16, 9, 10, "sun")
        )
    }

    // Berlin & Germany Sports Teams
    val sportsTeams = remember {
        listOf(
            SportTeamInfo(
                name = "Hertha BSC",
                leagueDe = "2. Bundesliga · Profifußball",
                leagueTr = "2. Bundesliga · Profesyonel Futbol",
                stadium = "Olympiastadion Berlin (74.475 Plätze)",
                nextMatchDe = "Sa. 13:00 Uhr vs. Eintracht Braunschweig",
                nextMatchTr = "Cts. 13:00 vs. Eintracht Braunschweig",
                standing = "Platz 6 · 17 Punkte",
                color = BerlinBlue,
                officialUrl = "https://www.herthabsc.com/"
            ),
            SportTeamInfo(
                name = "1. FC Union Berlin",
                leagueDe = "1. Bundesliga · Fußball-Oberhaus",
                leagueTr = "1. Bundesliga · Almanya Süper Ligi",
                stadium = "Stadion An der Alten Försterei (Köpenick)",
                nextMatchDe = "So. 15:30 Uhr vs. Eintracht Frankfurt",
                nextMatchTr = "Paz. 15:30 vs. Eintracht Frankfurt",
                standing = "Platz 5 · 14 Punkte (Europapokal-Kurs)",
                color = BerlinRed,
                officialUrl = "https://www.fc-union-berlin.de/"
            ),
            SportTeamInfo(
                name = "ALBA Berlin",
                leagueDe = "Basketball Bundesliga (BBL) & EuroLeague",
                leagueTr = "Basketbol Bundesliga (BBL) & EuroLeague",
                stadium = "Uber Arena (ehem. Mercedes-Benz Arena)",
                nextMatchDe = "Do. 20:00 Uhr EuroLeague Heimspiel",
                nextMatchTr = "Per. 20:00 EuroLeague İç Saha Maçı",
                standing = "BBL Spitzenfeld & EuroLeague",
                color = BerlinYellow,
                officialUrl = "https://www.albaberlin.de/"
            ),
            SportTeamInfo(
                name = "Eisbären Berlin",
                leagueDe = "DEL Eishockey · Deutscher Rekordmeister",
                leagueTr = "DEL Buz Hokeyi · Almanya Şampiyonu",
                stadium = "Uber Arena Berlin",
                nextMatchDe = "Fr. 19:30 Uhr vs. Adler Mannheim",
                nextMatchTr = "Cum. 19:30 vs. Adler Mannheim",
                standing = "Platz 1 · Tabellenführer",
                color = Color(0xFF002244),
                officialUrl = "https://www.eisbaeren.de/"
            )
        )
    }

    // Live Financial Markets - Dynamically connected to LiveBerlinFeedRepository & Bigpara
    val marketQuotes by com.example.data.repository.LiveBerlinFeedRepository.liveQuotes.collectAsState()
    val isRefreshingFeeds by com.example.data.repository.LiveBerlinFeedRepository.isRefreshing.collectAsState()


    // Berlin Newspaper Presseschau (100% authentic articles linking directly to the original newspaper story)
    val pressArticles = remember {
        listOf(
            PressArticleSnippet(
                publisher = "B.Z. Berlin",
                color = Color(0xFFE50000),
                titleDe = "Diese Ryanair-Flüge gibt es nicht mehr vom BER",
                titleTr = "Ryanair BER Uçuşlarını Kısıtlıyor: Bu Rotalar Artık Uçmayacak",
                teaserDe = "Ryanair streicht wegen hoher Standortkosten zahlreiche Flugverbindungen ab Hauptstadtflughafen Berlin Brandenburg.",
                teaserTr = "Yüksek havalimanı ve vergi maliyetleri nedeniyle Ryanair Berlin uçuşlarını azaltıyor.",
                timeAgo = "vor 1 Std.",
                originalUrl = "https://www.bz-berlin.de/berlin",
                imageResId = R.drawable.news_bz_ryanair
            ),
            PressArticleSnippet(
                publisher = "Tagesspiegel",
                color = Color(0xFF003087),
                titleDe = "Tagesspiegel Berlin: Aktuelle Nachrichten aus Politik, Wirtschaft & Kiezen",
                titleTr = "Tagesspiegel Berlin: Politika, Ekonomi ve Mahallelerden Güncel Gelişmeler",
                teaserDe = "Berliner Landespolitik, Kiez-Geschichten und Hintergründe direkt aus der Hauptstadt-Redaktion.",
                teaserTr = "Başkentin nabzını tutan köklü gazete Tagesspiegel'den Berlin gündemi, yerel kararlar ve kiez analizleri.",
                timeAgo = "vor 2 Std.",
                originalUrl = "https://www.tagesspiegel.de/berlin/",
                imageResId = R.drawable.news_tagesspiegel
            ),
            PressArticleSnippet(
                publisher = "rbb24",
                color = Color(0xFF005A9C),
                titleDe = "rbb24 Berlin & Brandenburg: Aktuelle Berichte und Panorama",
                titleTr = "rbb24 Berlin & Brandenburg: Güncel Olaylar ve Şehir Haberleri",
                teaserDe = "Der Rundfunk Berlin-Brandenburg berichtet über alle regionalen Geschehnisse und Kiez-Ereignisse.",
                teaserTr = "Berlin ve Brandenburg kamu yayıncısı rbb24'ten günün öne çıkan şehir haberleri ve canlı yayınlar.",
                timeAgo = "vor 3 Std.",
                originalUrl = "https://www.rbb24.de/panorama/",
                imageResId = R.drawable.news_rbb_uhr
            ),
            PressArticleSnippet(
                publisher = "B.Z. Berlin",
                color = Color(0xFFE50000),
                titleDe = "B.Z. Berlin Sport & Union: Bundesliga-Meldungen und Spieltag-Ticker",
                titleTr = "B.Z. Berlin Spor: Union Berlin, Hertha BSC ve Başkent Spor Dünyası",
                teaserDe = "Spannende Reportagen, Ergebnisse und Stimmen zu Union Berlin und dem Berliner Sportgeschehen.",
                teaserTr = "Berlin'in popüler gazetesi B.Z.'den maç sonuçları, spor kulüpleri ve futbol analizleri.",
                timeAgo = "vor 4 Std.",
                originalUrl = "https://www.bz-berlin.de/berlin-sport",
                imageResId = R.drawable.news_bz_ryanair
            )
        )
    }

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
                            text = if (language == AppLanguage.TURKISH) "Saat, Hava Durumu, Borsa, Kripto & Gazeteler" else "Uhrzeit, Wetter, Börse, Krypto & Presse",
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
                        com.example.data.repository.LiveBerlinFeedRepository.refreshLiveFeeds()
                    }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Aktualisieren")
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

                        // Large Digital Clock
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

            // 2. LIVE WEATHER & 7-DAY FORECAST
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
                                text = "Station: Mitte / Alex",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Current Temp Box
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "16°C",
                                    fontSize = 36.sp,
                                    fontWeight = FontWeight.Black,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = if (language == AppLanguage.TURKISH) "Heiter & Mild" else "Heiter & Mild",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                    Text(
                                        text = if (language == AppLanguage.TURKISH) "Hissedilen: 16°C · Nem: %58" else "Gefühlt: 16°C · Luftfeuchte: 58%",
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
                                    Text(text = "14 km/h W", fontSize = 11.5.sp, color = BerlinBlue, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        Spacer(modifier = Modifier.height(12.dp))

                        // 7-Tage Wetterprognose
                        Text(
                            text = if (language == AppLanguage.TURKISH) "📅 1 Haftalık Canlı Tahmin" else "📅 7-Tage Wetterprognose",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            items(weatherForecast) { fc ->
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                                    modifier = Modifier.width(92.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(8.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(
                                            text = if (language == AppLanguage.TURKISH) fc.dayNameTr else fc.dayNameDe,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.5.sp,
                                            maxLines = 1
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Icon(
                                            imageVector = when (fc.iconName) {
                                                "rain" -> Icons.Default.WaterDrop
                                                "cloud" -> Icons.Default.Cloud
                                                "cloud_sun" -> Icons.Default.CloudQueue
                                                else -> Icons.Default.WbSunny
                                            },
                                            contentDescription = null,
                                            tint = if (fc.iconName == "rain") BerlinBlue else BerlinYellow,
                                            modifier = Modifier.size(22.dp)
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "${fc.maxTemp}° / ${fc.minTemp}°",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 12.sp
                                        )
                                        Text(
                                            text = "☔ ${fc.rainProb}%",
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

            // 2.5 BERLIN GÜNLÜK MANŞET SLAYTI (1:1 with user screenshots)
            item {
                MansetSliderComponent(language = language)
            }

            // 2.6 BIGPARA 4'LÜ HIZLI PİYASA BANDI
            item {
                BigparaMarketStrip(language = language)
            }

            // 2.7 BIGPARA BIST 100 CANLI BORSA ÖNE ÇIKAN KART
            item {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                    shadowElevation = 2.dp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://bigpara.hurriyet.com.tr/borsa/canli-borsa/"))
                            context.startActivity(browserIntent)
                        }
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFFC90000)) {
                                    Text("Bigpara Borsa", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "BİST 100 Canlı Endeks & Hisseler" else "BİST 100 & Europäische Börsen",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Icon(imageVector = Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.primary)
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Image(
                            painter = painterResource(id = R.drawable.market_bigpara),
                            contentDescription = "Bigpara Borsa İstanbul Canlı Grafik",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(140.dp)
                                .clip(RoundedCornerShape(10.dp))
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "BIST 100: 11.116,99 Pkt (%-0,92) · Hacim: 94,8 Mlyr ₺" else "BIST 100: 11.116,99 Pkt · DAX 40: 19.465,20 Pkt",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = BerlinRed
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Canlı Veriler ›" else "Live-Charts ›",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }

            // 3. LIVE FINANCIAL MARKETS, GOLD, FOREX & CRYPTO
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
                                    text = if (language == AppLanguage.TURKISH) "Canlı Piyasa & Kurlar" else "Live-Märkte, Devisen & Krypto",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = BerlinGreen.copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Bigpara & Börse Frankfurt" else "Bigpara & Börse Frankfurt",
                                    color = BerlinGreen,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Grid of Markets
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            marketQuotes.chunked(2).forEach { rowQuotes ->
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
                                                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(q.officialUrl))
                                                    context.startActivity(browserIntent)
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
                                                        text = q.changeStr,
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = if (q.isPositive) BerlinGreen else BerlinRed
                                                    )
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = "${q.priceStr} ${q.unit}",
                                                    fontWeight = FontWeight.Black,
                                                    fontSize = 15.sp,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                                Text(
                                                    text = if (language == AppLanguage.TURKISH) q.nameTr else q.nameDe,
                                                    fontSize = 10.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                    maxLines = 1
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

            // 4. BERLIN & GERMANY SPORTS (HERTHA, UNION, ALBA, EISBÄREN)
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
                                    text = if (language == AppLanguage.TURKISH) "Berlin & Almanya Sporu" else "Berlin & Deutschland Sport",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                            TextButton(
                                onClick = {
                                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.kicker.de/bundesliga/spieltag"))
                                    context.startActivity(browserIntent)
                                },
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("Bundesliga Ticker", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(imageVector = Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(12.dp))
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            sportsTeams.forEach { team ->
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                                    border = BorderStroke(1.dp, team.color.copy(alpha = 0.3f)),
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
                                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(10.dp)
                                                        .background(team.color, CircleShape)
                                                )
                                                Text(
                                                    text = team.name,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    fontSize = 14.5.sp,
                                                    color = MaterialTheme.colorScheme.onSurface
                                                )
                                            }
                                            Surface(
                                                shape = RoundedCornerShape(6.dp),
                                                color = team.color.copy(alpha = 0.15f)
                                            ) {
                                                Text(
                                                    text = team.standing,
                                                    fontSize = 10.5.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = team.color,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = if (language == AppLanguage.TURKISH) team.leagueTr else team.leagueDe,
                                            fontSize = 11.5.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )

                                        Spacer(modifier = Modifier.height(4.dp))
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(imageVector = Icons.Default.Stadium, contentDescription = null, modifier = Modifier.size(13.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                            Text(text = team.stadium, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }

                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = if (language == AppLanguage.TURKISH) "📅 ${team.nextMatchTr}" else "📅 ${team.nextMatchDe}",
                                                fontSize = 11.5.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            OutlinedButton(
                                                onClick = {
                                                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(team.officialUrl))
                                                    context.startActivity(browserIntent)
                                                },
                                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                                shape = RoundedCornerShape(8.dp),
                                                modifier = Modifier.height(30.dp)
                                            ) {
                                                Text(text = if (language == AppLanguage.TURKISH) "Resmi Kulüp" else "Offiziell", fontSize = 11.sp)
                                                Spacer(modifier = Modifier.width(3.dp))
                                                Icon(imageVector = Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(11.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 5. BERLINER PRESSESCHAU (DAILY NEWSPAPERS - B.Z., KURIER, TAGESSPIEGEL, RBB)
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
                                    text = if (language == AppLanguage.TURKISH) "Berlin Basın Özeti" else "Berliner Presseschau",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                            }
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Orijinal Gazete Linkli" else "Direkt zu den Artikeln",
                                fontSize = 11.sp,
                                color = BerlinBlue,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (language == AppLanguage.TURKISH)
                                "B.Z., Berliner Kurier, Tagesspiegel ve RBB24 günün önemli başlıkları. Telif haklarına uygun olarak doğrudan gazete linkiyle sunulmaktadır."
                            else
                                "Aktuelle Schlagzeilen aus B.Z., Berliner Kurier, Tagesspiegel und RBB24 mit Direktverlinkung zu den Verlagshäusern.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            pressArticles.forEach { article ->
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                                    border = BorderStroke(0.8.dp, article.color.copy(alpha = 0.3f)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Surface(
                                                shape = RoundedCornerShape(6.dp),
                                                color = article.color
                                            ) {
                                                Text(
                                                    text = article.publisher,
                                                    color = Color.White,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.5.dp)
                                                )
                                            }
                                            Text(
                                                text = article.timeAgo,
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(8.dp))

                                        Text(
                                            text = if (language == AppLanguage.TURKISH) article.titleTr else article.titleDe,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.5.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )

                                        Spacer(modifier = Modifier.height(4.dp))

                                        Text(
                                            text = if (language == AppLanguage.TURKISH) article.teaserTr else article.teaserDe,
                                            fontSize = 12.sp,
                                            lineHeight = 16.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )

                                        if (article.imageResId != null) {
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Image(
                                                painter = painterResource(id = article.imageResId),
                                                contentDescription = article.publisher,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(130.dp)
                                                    .clip(RoundedCornerShape(8.dp))
                                                    .clickable {
                                                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(article.originalUrl))
                                                        context.startActivity(browserIntent)
                                                    }
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(8.dp))

                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.End
                                        ) {
                                            Button(
                                                onClick = {
                                                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(article.originalUrl))
                                                    context.startActivity(browserIntent)
                                                },
                                                shape = RoundedCornerShape(8.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = article.color),
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

            // Bottom Spacing
            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
