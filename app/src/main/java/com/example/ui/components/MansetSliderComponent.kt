package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.data.model.AppLanguage
import com.example.data.model.MansetSlide
import com.example.data.repository.LiveBerlinFeedRepository
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import kotlinx.coroutines.delay

@Composable
fun MansetSliderComponent(
    language: AppLanguage,
    modifier: Modifier = Modifier,
    customSlides: List<MansetSlide>? = null
) {
    val liveSlides by LiveBerlinFeedRepository.liveSlides.collectAsState()
    val isRefreshing by LiveBerlinFeedRepository.isRefreshing.collectAsState()
    val slides = customSlides ?: liveSlides

    if (slides.isEmpty()) return
    val context = LocalContext.current
    val pagerState = rememberPagerState(initialPage = 0, pageCount = { slides.size })

    // Auto-scroll every 5 seconds
    LaunchedEffect(pagerState, slides.size) {
        while (true) {
            delay(5000)
            if (!pagerState.isScrollInProgress && slides.isNotEmpty()) {
                val nextPage = (pagerState.currentPage + 1) % slides.size
                pagerState.animateScrollToPage(nextPage, animationSpec = tween(600))
            }
        }
    }

    Column(modifier = modifier.fillMaxWidth()) {
        // Slider Title & Info Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Surface(
                    shape = CircleShape,
                    color = BerlinRed,
                    modifier = Modifier.size(8.dp)
                ) {}
                Text(
                    text = if (language == AppLanguage.TURKISH) "Berlin Günlük Gazete Manşetleri" else "Berliner Tages-Schlagzeilen",
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = BerlinRed.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = if (isRefreshing) "Yenileniyor..." else "CANLI RSS",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = BerlinRed,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                    )
                }
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "${if (slides.isNotEmpty()) pagerState.currentPage + 1 else 0}/${slides.size}",
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                IconButton(
                    onClick = { LiveBerlinFeedRepository.refreshLiveFeeds() },
                    modifier = Modifier.size(22.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Yenile",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(13.dp)
                    )
                }
            }
        }

        // Horizontal Pager for Manşet Slides
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .fillMaxWidth()
                .height(210.dp)
                .padding(horizontal = 14.dp)
        ) { page ->
            val slide = slides[page]
            Card(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(slide.originalUrl))
                        context.startActivity(browserIntent)
                    },
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                border = BorderStroke(1.dp, Color(slide.colorHex).copy(alpha = 0.4f))
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    // Actual photo from German & Turkish press (Live Web URL or bundled Resource fallback)
                    if (!slide.imageUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = slide.imageUrl,
                            contentDescription = slide.localizedHeadline(language),
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else if (slide.imageResId != null) {
                        Image(
                            painter = painterResource(id = slide.imageResId),
                            contentDescription = slide.localizedHeadline(language),
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Image(
                            painter = painterResource(id = R.drawable.hero_berlin),
                            contentDescription = slide.localizedHeadline(language),
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    // Dark Gradient for legibility
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        Color.Black.copy(alpha = 0.45f),
                                        Color.Transparent,
                                        Color.Black.copy(alpha = 0.90f)
                                    ),
                                    startY = 0f,
                                    endY = Float.POSITIVE_INFINITY
                                )
                            )
                    )

                    // Top Bar: Publisher Badge + Link Pill
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = Color(slide.colorHex)
                        ) {
                            Text(
                                text = "${slide.publisher} · ${slide.badge}",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color.Black.copy(alpha = 0.65f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Habere Git" else "Original",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(11.dp)
                                )
                            }
                        }
                    }

                    // Bottom Content: Headline & Teaser
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(12.dp)
                    ) {
                        Text(
                            text = slide.localizedHeadline(language),
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            lineHeight = 17.sp
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = slide.localizedTeaser(language),
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.88f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            lineHeight = 14.sp
                        )
                    }
                }
            }
        }

        // Indicator Dots Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            slides.indices.forEach { index ->
                val isSelected = pagerState.currentPage == index
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .width(if (isSelected) 18.dp else 6.dp)
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(
                            if (isSelected) BerlinRed else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.25f)
                        )
                )
            }
        }
    }
}

@Composable
fun BigparaMarketStrip(
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val liveQuotes by LiveBerlinFeedRepository.liveQuotes.collectAsState()
    val isRefreshing by LiveBerlinFeedRepository.isRefreshing.collectAsState()

    // Map 4 key items: Dolar, Euro, Altın, BIST 100
    val items = remember(liveQuotes) {
        val dolar = liveQuotes.firstOrNull { it.code.startsWith("DOLAR") }
        val euro = liveQuotes.firstOrNull { it.code.startsWith("EUR/TRY") }
        val altin = liveQuotes.firstOrNull { it.code.startsWith("ALTIN") }
        val bist = liveQuotes.firstOrNull { it.code.startsWith("BIST") }

        listOf(
            MarketItem("DOLAR", "${dolar?.priceStr ?: "49,69"} ₺", dolar?.changeStr ?: "+0,08%", dolar?.isPositive ?: true, "https://bigpara.hurriyet.com.tr/doviz/dolar/"),
            MarketItem("EURO", "${euro?.priceStr ?: "55,72"} ₺", euro?.changeStr ?: "-0,14%", euro?.isPositive ?: false, "https://bigpara.hurriyet.com.tr/doviz/euro/"),
            MarketItem("ALTIN", "${altin?.priceStr ?: "6.384,76"} ₺", altin?.changeStr ?: "-0,62%", altin?.isPositive ?: false, "https://bigpara.hurriyet.com.tr/altin/gram-altin-fiyati/"),
            MarketItem("BIST 100", bist?.priceStr ?: "11.116,99", bist?.changeStr ?: "-0,92%", bist?.isPositive ?: false, "https://bigpara.hurriyet.com.tr/borsa/canli-borsa/")
        )
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 4.dp)
    ) {
        // Strip Header with Bigpara Live Link
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = Color(0xFFC90000)
                ) {
                    Text(
                        text = "Bigpara",
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                    )
                }
                Text(
                    text = if (language == AppLanguage.TURKISH) "Canlı Piyasa & Borsa Endeksleri" else "Live-Finanzmärkte & Devisen",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (isRefreshing) {
                    Text(
                        text = "●",
                        color = BerlinGreen,
                        fontSize = 10.sp
                    )
                }
            }
            Text(
                text = if (language == AppLanguage.TURKISH) "Tüm Fiyatlar ›" else "Alle Kurse ›",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.clickable {
                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://bigpara.hurriyet.com.tr/borsa/canli-borsa/"))
                    context.startActivity(browserIntent)
                }
            )
        }

        // 4-Box Grid
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items.forEach { item ->
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clickable {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(item.url))
                            context.startActivity(browserIntent)
                        },
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(0.8.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
                    shadowElevation = 1.dp
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 8.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = item.label,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = item.price,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Icon(
                                imageVector = if (item.isPositive) Icons.Default.TrendingUp else Icons.Default.TrendingDown,
                                contentDescription = null,
                                tint = if (item.isPositive) BerlinGreen else BerlinRed,
                                modifier = Modifier.size(11.dp)
                            )
                            Text(
                                text = item.change,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (item.isPositive) BerlinGreen else BerlinRed
                            )
                        }
                    }
                }
            }
        }
    }
}

private data class MarketItem(
    val label: String,
    val price: String,
    val change: String,
    val isPositive: Boolean,
    val url: String
)
