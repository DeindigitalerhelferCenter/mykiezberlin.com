package com.example.ui.components

import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.launch
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import coil.request.ImageRequest
import android.media.MediaMetadataRetriever
import android.widget.VideoView
import android.widget.FrameLayout
import androidx.compose.ui.viewinterop.AndroidView
import com.example.R
import com.example.data.model.AppLanguage
import com.example.data.model.KiezStory
import com.example.ui.theme.*
import com.example.util.WatermarkHelper

@Composable
fun KiezStoriesBar(
    stories: List<KiezStory>,
    language: AppLanguage,
    onStoryClick: (KiezStory) -> Unit,
    onAddStoryClick: () -> Unit,
    modifier: Modifier = Modifier,
    onStoryClickWithList: ((KiezStory, List<KiezStory>, Int) -> Unit)? = null
) {
    // Only display approved stories in the public bar
    val visibleStories = stories.filter { it.status == "approved" }

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = when (language) {
                    AppLanguage.TURKISH -> "Kiez Hikâyeleri"
                    AppLanguage.ENGLISH -> "Kiez Stories"
                    else -> "Kiez-Stories"
                },
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = when (language) {
                    AppLanguage.TURKISH -> "+ Durum Paylaş"
                    AppLanguage.ENGLISH -> "+ Share Story"
                    else -> "+ Deine Story"
                },
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = BerlinRed,
                modifier = Modifier.clickable { onAddStoryClick() }
            )
        }

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // First item: Add Your Story button (WhatsApp / Instagram style)
            item {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.clickable { onAddStoryClick() }
                ) {
                    Box(
                        modifier = Modifier
                            .size(62.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .border(2.dp, BerlinRed, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Add Story",
                            tint = BerlinRed,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Paylaş" else "Deine Story",
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            // Visible approved stories with sequential index support
            itemsIndexed(visibleStories) { index, story ->
                StoryAvatarItem(
                    story = story,
                    onClick = {
                        if (onStoryClickWithList != null) {
                            onStoryClickWithList(story, visibleStories, index)
                        } else {
                            onStoryClick(story)
                        }
                    }
                )
            }
        }
    }
}

data class InstitutionBrand(
    val shortName: String,
    val bgColor: Color,
    val textColor: Color
)

fun getInstitutionBrand(storyId: String, author: String = ""): InstitutionBrand {
    return when {
        storyId.contains("bvg") || author.contains("BVG", ignoreCase = true) ->
            InstitutionBrand("BVG", Color(0xFFFFCC00), Color.Black)
        storyId.contains("sbahn") || author.contains("S-Bahn", ignoreCase = true) ->
            InstitutionBrand("S-Bahn", Color(0xFF008754), Color.White)
        storyId.contains("feuerwehr") || author.contains("Feuerwehr", ignoreCase = true) ->
            InstitutionBrand("Feuerwehr", Color(0xFFD32F2F), Color.White)
        storyId.contains("polizei") || author.contains("Polizei", ignoreCase = true) ->
            InstitutionBrand("Polizei", Color(0xFF002D5A), Color.White)
        storyId.contains("buergeramt") || author.contains("Bürgeramt", ignoreCase = true) ->
            InstitutionBrand("Bürgeramt", Color(0xFF1565C0), Color.White)
        storyId.contains("senat") || author.contains("Senat", ignoreCase = true) ->
            InstitutionBrand("Senat", Color(0xFFBA1A1A), Color.White)
        storyId.contains("kultur") || author.contains("Kultur", ignoreCase = true) ->
            InstitutionBrand("Kultur", Color(0xFF7B1FA2), Color.White)
        else ->
            InstitutionBrand("Berlin", Color(0xFFC62828), Color.White)
    }
}

@Composable
fun StoryAvatarItem(
    story: KiezStory,
    onClick: () -> Unit
) {
    val isInstitution = story.id.startsWith("inst_story_")
    val brand = if (isInstitution) getInstitutionBrand(story.id, story.author) else null

    val borderColor = if (brand != null) {
        brand.bgColor
    } else {
        when (story.headlineColor.lowercase()) {
            "blau" -> BerlinBlue
            "rot" -> BerlinRed
            "gelb" -> BerlinYellow
            else -> BerlinGreen
        }
    }

    Box(
        modifier = Modifier.clickable { onClick() }
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                modifier = Modifier
                    .size(62.dp)
                    .clip(CircleShape)
                    .border(2.5.dp, borderColor, CircleShape)
                    .padding(3.dp)
                    .clip(CircleShape)
                    .background(if (brand != null) brand.bgColor else MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                if (brand != null) {
                    Text(
                        text = brand.shortName,
                        color = brand.textColor,
                        fontSize = if (brand.shortName.length > 5) 10.sp else 12.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center
                    )
                } else if (story.mediaUri != null) {
                    // Small thumbnail + Kiez photo while loading (the full 350-720 KB images left the rings white for >12 s)
                    StoryRingImage(url = story.mediaUri, description = story.headline, placeholderRes = KiezPhotoHelper.getKiezDrawable(story.kiez))
                } else if (story.mediaResId != null) {
                    Image(
                        painter = painterResource(id = story.mediaResId),
                        contentDescription = story.headline,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    // Real landmark photo for the Kiez
                    val fallbackRes = KiezPhotoHelper.getKiezDrawable(story.kiez)
                    Image(
                        painter = painterResource(id = fallbackRes),
                        contentDescription = story.headline,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
            }
            val avatarLabel = if (brand != null) {
                brand.shortName
            } else {
                story.kiez
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = avatarLabel,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
        }

        if (isInstitution) {
            Surface(
                shape = CircleShape,
                color = BerlinRed,
                border = androidx.compose.foundation.BorderStroke(1.5.dp, MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .size(19.dp)
                    .align(Alignment.TopEnd)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "10",
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }
    }
}

@Composable
fun StoryViewerDialog(
    story: KiezStory,
    language: AppLanguage,
    onClose: () -> Unit
) {
    StoryViewerDialog(
        stories = listOf(story),
        initialIndex = 0,
        language = language,
        onClose = onClose
    )
}

@Composable
fun StoryViewerDialog(
    stories: List<KiezStory>,
    initialIndex: Int = 0,
    language: AppLanguage,
    onClose: () -> Unit
) {
    if (stories.isEmpty()) return
    var currentIndex by remember(initialIndex, stories) {
        mutableIntStateOf(initialIndex.coerceIn(0, (stories.size - 1).coerceAtLeast(0)))
    }
    val story = stories.getOrElse(currentIndex) { stories.first() }
    val context = LocalContext.current
    val downloadScope = androidx.compose.runtime.rememberCoroutineScope()
    var progress by remember(currentIndex) { mutableFloatStateOf(0f) }
    var showFullTextDialog by remember { mutableStateOf(false) }
    var isImageZoomed by remember { mutableStateOf(false) }

    // Auto advancement timer
    LaunchedEffect(currentIndex, showFullTextDialog, isImageZoomed) {
        if (!showFullTextDialog && !isImageZoomed) {
            val totalMs = if (story.isVideo) 25000L else 7500L
            val intervalMs = 50L
            val step = intervalMs.toFloat() / totalMs.toFloat()
            while (progress < 1f && !showFullTextDialog && !isImageZoomed) {
                kotlinx.coroutines.delay(intervalMs)
                progress += step
            }
            if (!showFullTextDialog && !isImageZoomed && progress >= 1f) {
                if (currentIndex < stories.size - 1) {
                    currentIndex++
                    progress = 0f
                } else {
                    onClose()
                }
            }
        }
    }

    val onNextStory = {
        if (currentIndex < stories.size - 1) {
            currentIndex++
            progress = 0f
        } else {
            onClose()
        }
    }

    val onPrevStory = {
        if (currentIndex > 0) {
            currentIndex--
            progress = 0f
        } else {
            progress = 0f
        }
    }

    val bannerColor = when (story.headlineColor.lowercase()) {
        "blau" -> BerlinBlue
        "rot" -> BerlinRed
        "gelb" -> BerlinYellow
        else -> Color(0xFF334155)
    }

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
        ) {
            // AUFGABE 1: BILD (groß) - Sauberes Bild im oberen/mittleren Bereich, KEINE störende Text-Überlagerung!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .systemBarsPadding()
            ) {
                // Top: Multi-segment Progress bars, Profile header, Close Button
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    // Instagram / WhatsApp style segment progress indicators
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        stories.forEachIndexed { idx, _ ->
                            val segProgress = when {
                                idx < currentIndex -> 1f
                                idx == currentIndex -> progress
                                else -> 0f
                            }
                            LinearProgressIndicator(
                                progress = { segProgress },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(3.dp)
                                    .clip(RoundedCornerShape(2.dp)),
                                color = Color.White,
                                trackColor = Color.White.copy(alpha = 0.35f),
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Left: Author, Kiez, timeAgo and Video badge
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "${story.kiez} · ${story.author}",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.5.sp
                                    )
                                    if (story.isVideo) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = BerlinRed
                                        ) {
                                            Text(
                                                text = if (language == AppLanguage.TURKISH) "VİDEO (Oynatılıyor)" else if (language == AppLanguage.ENGLISH) "VIDEO (Playing)" else "VIDEO (Läuft)",
                                                color = Color.White,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                            )
                                        }
                                    }
                                }
                                Text(
                                    text = "${story.timeAgo} · ${story.durationHours}h · ${currentIndex + 1}/${stories.size}",
                                    color = Color.White.copy(alpha = 0.75f),
                                    fontSize = 11.sp
                                )
                            }
                        }

                        // Right: Close Button
                        IconButton(
                            onClick = onClose,
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                tint = Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }

                // Bild-Container (groß, sauber, unüberlagert) mit Tap-to-Skip Navigation
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f, fill = false)
                        .heightIn(min = 260.dp, max = 460.dp)
                        .background(Color.Black),
                    contentAlignment = Alignment.Center
                ) {
                    if (story.isVideo && story.mediaUri != null) {
                        // Real video playback with VideoView
                        AndroidView(
                            factory = { ctx ->
                                VideoView(ctx).apply {
                                    layoutParams = FrameLayout.LayoutParams(
                                        FrameLayout.LayoutParams.MATCH_PARENT,
                                        FrameLayout.LayoutParams.MATCH_PARENT
                                    )
                                    setVideoURI(Uri.parse(story.mediaUri))
                                    setOnPreparedListener { mp ->
                                        mp.isLooping = true
                                        mp.start()
                                    }
                                    setOnErrorListener { _, _, _ ->
                                        true
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    } else if (story.id.startsWith("inst_story_")) {
                        val brand = getInstitutionBrand(story.id, story.author)
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(brand.bgColor),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center,
                                modifier = Modifier.padding(24.dp)
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = brand.bgColor,
                                    border = androidx.compose.foundation.BorderStroke(2.5.dp, brand.textColor.copy(alpha = 0.4f)),
                                    shadowElevation = 6.dp
                                ) {
                                    Text(
                                        text = brand.shortName,
                                        color = brand.textColor,
                                        fontSize = 42.sp,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 1.sp,
                                        modifier = Modifier.padding(horizontal = 28.dp, vertical = 14.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = story.author,
                                    color = brand.textColor.copy(alpha = 0.9f),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    } else if (story.mediaUri != null) {
                        AsyncImage(
                            model = story.mediaUri,
                            contentDescription = story.headline,
                            modifier = Modifier
                                .fillMaxSize()
                                .clickable { isImageZoomed = !isImageZoomed },
                            contentScale = ContentScale.Fit
                        )
                    } else if (story.mediaResId != null) {
                        Image(
                            painter = painterResource(id = story.mediaResId),
                            contentDescription = story.headline,
                            modifier = Modifier
                                .fillMaxSize()
                                .clickable { isImageZoomed = !isImageZoomed },
                            contentScale = ContentScale.Fit
                        )
                    } else {
                        // Real landmark visual photo fallback for text stories so they are never plain/empty!
                        val fallbackRes = KiezPhotoHelper.getKiezDrawable(story.kiez)
                        Image(
                            painter = painterResource(id = fallbackRes),
                            contentDescription = story.headline,
                            modifier = Modifier
                                .fillMaxSize()
                                .clickable { isImageZoomed = !isImageZoomed },
                            contentScale = ContentScale.Fit
                        )
                    }

                    // Left & Right Touch Tap Areas for Previous / Next Story Navigation
                    Row(modifier = Modifier.fillMaxSize()) {
                        Box(
                            modifier = Modifier
                                .weight(0.25f)
                                .fillMaxHeight()
                                .clickable(
                                    interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                    indication = null
                                ) { onPrevStory() }
                        )
                        Spacer(modifier = Modifier.weight(0.5f))
                        Box(
                            modifier = Modifier
                                .weight(0.25f)
                                .fillMaxHeight()
                                .clickable(
                                    interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                                    indication = null
                                ) { onNextStory() }
                        )
                    }

                    // Plain logo watermark, top right, transparent (same as the saved image and the web)
                    Image(
                        painter = painterResource(id = R.drawable.mykiez_logo_watermark),
                        contentDescription = null,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(top = 10.dp, end = 10.dp)
                            .fillMaxWidth(0.24f)
                            .aspectRatio(1f)
                            .alpha(0.92f)
                    )
                }

                // Zoom hint overlay for user convenience
                if (!story.isVideo && (story.mediaUri != null || story.mediaResId != null)) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "🔍 Büyütmek için resme dokunun" else if (language == AppLanguage.ENGLISH) "🔍 Tap image to zoom full screen" else "🔍 Antippen für Vollbild",
                        color = Color.White.copy(alpha = 0.65f),
                        fontSize = 10.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(top = 2.dp)
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Kompakt & Derli Toplu Ergonomik Aksiyon Alanı
                Surface(
                    color = Color(0xFF232528),
                    shape = RoundedCornerShape(16.dp),
                    tonalElevation = 4.dp,
                    shadowElevation = 6.dp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp)
                        .padding(bottom = 12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                    ) {
                        // Official Institution source banner if it's an institution bulletin
                        if (story.id.startsWith("inst_story_") && story.author.isNotBlank()) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.padding(bottom = 4.dp)
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = bannerColor.copy(alpha = 0.25f)
                                ) {
                                    Text(
                                        text = if (language == AppLanguage.TURKISH) "🏛 RESMİ BÜLTEN" else if (language == AppLanguage.ENGLISH) "🏛 OFFICIAL BULLETIN" else "🏛 OFFIZIELL",
                                        color = bannerColor,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp,
                                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                    )
                                }
                                Text(
                                    text = story.author,
                                    color = Color.White,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 11.5.sp,
                                    maxLines = 1
                                )
                            }
                        }

                        // Metin Başlığı ve Kategori Rozeti
                        Row(
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = bannerColor,
                                modifier = Modifier.padding(top = 1.dp)
                            ) {
                                Text(
                                    text = story.kind.uppercase(),
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 9.5.sp,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                            Text(
                                text = story.headline,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.5.sp,
                                lineHeight = 19.sp,
                                maxLines = 2,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        if (story.subtext.isNotBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = story.subtext,
                                color = Color(0xFFE2E8F0),
                                fontSize = 12.5.sp,
                                maxLines = 2,
                                lineHeight = 16.5.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        val hasExternalSource = story.link.isNotBlank() &&
                                story.link != "https://mykiezberlin.com" &&
                                (story.link.startsWith("http://") || story.link.startsWith("https://"))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(42.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // [KAYNAĞA GİT / DEVAM OKU] Button
                            Button(
                                onClick = {
                                    if (hasExternalSource) {
                                        try {
                                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(story.link))
                                            context.startActivity(intent)
                                        } catch (_: Exception) {
                                            showFullTextDialog = true
                                        }
                                    } else {
                                        showFullTextDialog = true
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .weight(1.3f)
                                    .fillMaxHeight(),
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp)
                            ) {
                                Icon(
                                    imageVector = if (hasExternalSource) Icons.AutoMirrored.Filled.ArrowForward else Icons.Default.MenuBook,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (hasExternalSource && story.link.contains("instagram.com/")) {
                                        if (language == AppLanguage.TURKISH) "INSTAGRAM'DA İZLE" else "AUF INSTAGRAM ANSEHEN"
                                    } else if (hasExternalSource) {
                                        if (language == AppLanguage.TURKISH) "KAYNAĞA GİT" else "QUELLE ÖFFNEN"
                                    } else {
                                        if (language == AppLanguage.TURKISH) "DEVAM OKU" else "WEITERLESEN"
                                    },
                                    fontWeight = FontWeight.Black,
                                    fontSize = 11.5.sp,
                                    maxLines = 1
                                )
                            }

                            // [DAMGALI İNDİR] Button
                            Button(
                                onClick = {
                                    // Photo (also from the server) or a video frame, always with the logo on top;
                                    // the text image is only used when the story has no media at all.
                                    downloadScope.launch {
                                        val bmp = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                                            WatermarkHelper.loadStoryBitmap(context, story.mediaResId, story.mediaUri, story.isVideo)
                                        }
                                        if (bmp != null) {
                                            WatermarkHelper.saveWatermarkedImageToGallery(context, bmp, "Story_${story.kiez}")
                                        } else {
                                            val textBmp = WatermarkHelper.createTextStoryBitmap(
                                                context = context,
                                                headline = story.headline,
                                                subtext = story.subtext,
                                                kiez = story.kiez
                                            )
                                            WatermarkHelper.saveWatermarkedImageToGallery(context, textBmp, "Story_${story.kiez}", stamp = false)
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF475569)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .weight(1.1f)
                                    .fillMaxHeight(),
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(3.dp))
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "İndir" else "Download",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1
                                )
                            }

                            // [PAYLAŞ] Button
                            Button(
                                onClick = {
                                    val shareUrl = if (hasExternalSource) story.link else "https://mykiezberlin.com"
                                    val apkDownloadUrl = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        val shareText = if (language == AppLanguage.TURKISH) {
                                            "My Kiez Berlin (${story.kiez}):\n${story.headline}\n${story.subtext}\n\n👉 $shareUrl\n\n📲 My Kiez Berlin uygulamasını indir:\n$apkDownloadUrl"
                                        } else {
                                            "My Kiez Berlin (${story.kiez}):\n${story.headline}\n${story.subtext}\n\n👉 $shareUrl\n\n📲 My Kiez Berlin App herunterladen:\n$apkDownloadUrl"
                                        }
                                        putExtra(Intent.EXTRA_TEXT, shareText)
                                    }
                                    context.startActivity(Intent.createChooser(shareIntent, "Story teilen"))
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = BerlinGreen),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight(),
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 4.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(3.dp))
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Paylaş" else "Teilen",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1
                                )
                            }
                        }
                        // Admin only: share to WhatsApp, Instagram, Facebook, TikTok (always with link + app link + web name)
                        if (com.example.data.repository.KiezStorageManager.isAdminAuthenticated(context)) {
                            Spacer(modifier = Modifier.height(8.dp))
                            AdminShareRow(story = story)
                        }
                    }
                }
            }
        }
    }

    // Lightbox / Tam Ekran Büyütme (Resme bir kez tıklayınca gerçek büyüklükte açılır, tekrar tıklayınca veya X'e basınca geri döner)
    if (isImageZoomed) {
        Dialog(
            onDismissRequest = { isImageZoomed = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.95f))
                    .clickable { isImageZoomed = false },
                contentAlignment = Alignment.Center
            ) {
                if (story.mediaUri != null) {
                    AsyncImage(
                        model = story.mediaUri,
                        contentDescription = "Zoomed",
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        contentScale = ContentScale.Fit
                    )
                } else if (story.mediaResId != null) {
                    Image(
                        painter = painterResource(id = story.mediaResId),
                        contentDescription = "Zoomed",
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        contentScale = ContentScale.Fit
                    )
                }

                // Close Button Top Right
                IconButton(
                    onClick = { isImageZoomed = false },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(24.dp)
                        .size(44.dp)
                        .background(Color.Black.copy(alpha = 0.6f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Schließen",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }

                // Hint
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color.Black.copy(alpha = 0.7f),
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 36.dp)
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Kapatmak için ekrana dokunun" else if (language == AppLanguage.ENGLISH) "Tap anywhere to close" else "Zum Schließen tippen",
                        color = Color.White,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }
        }
    }

    // 7. GÖREV: POPUP - Kaynak yoksa veya tıklandığında direkt resim ve altındaki metin çıkar!
    if (showFullTextDialog) {
        Dialog(onDismissRequest = { showFullTextDialog = false }) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(10.dp),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Image(
                                painter = painterResource(id = R.drawable.mykiez_logo),
                                contentDescription = null,
                                modifier = Modifier.size(26.dp)
                            )
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Haber & Hikâye Detayı" else "Story-Details",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                        IconButton(onClick = { showFullTextDialog = false }, modifier = Modifier.size(28.dp)) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close", modifier = Modifier.size(18.dp))
                        }
                    }

                    // 7. GÖREV: Direkt Resim ve altındaki metin çıkmalı! (Resme tıklayınca büyür!)
                    if (story.mediaUri != null) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.Black)
                                .clickable { isImageZoomed = true }
                        ) {
                            AsyncImage(
                                model = story.mediaUri,
                                contentDescription = story.headline,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                    } else if (story.mediaResId != null) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.Black)
                                .clickable { isImageZoomed = true }
                        ) {
                            Image(
                                painter = painterResource(id = story.mediaResId),
                                contentDescription = story.headline,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                    } else {
                        val fallbackRes = KiezPhotoHelper.getKiezDrawable(story.kiez)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.Black)
                                .clickable { isImageZoomed = true }
                        ) {
                            Image(
                                painter = painterResource(id = fallbackRes),
                                contentDescription = story.headline,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                    }

                    Text(
                        text = story.headline,
                        fontWeight = FontWeight.Black,
                        fontSize = 17.sp,
                        lineHeight = 22.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Text(
                        text = "📍 ${story.kiez} · Verfasser: ${story.author} · ${story.timeAgo}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )

                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                    // Vollständiger Text (Kein Kürzen)
                    Text(
                        text = story.subtext.ifBlank { "Bu hikaye için ek açıklama metni girilmemiştir." },
                        fontSize = 14.sp,
                        lineHeight = 21.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    if (story.source.isNotBlank() || (story.link.isNotBlank() && story.link != "https://mykiezberlin.com")) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = BerlinRed.copy(alpha = 0.08f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BerlinRed.copy(alpha = 0.3f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    if (story.source.isNotBlank()) {
                                        Text(
                                            text = "Kaynak: ${story.source}",
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                    if (story.link.isNotBlank()) {
                                        Text(
                                            text = story.link,
                                            fontSize = 11.sp,
                                            color = BerlinRed,
                                            maxLines = 1
                                        )
                                    }
                                }
                                if (story.link.isNotBlank() && (story.link.startsWith("http://") || story.link.startsWith("https://"))) {
                                    IconButton(
                                        onClick = {
                                            try {
                                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(story.link))
                                                context.startActivity(intent)
                                            } catch (_: Exception) {}
                                        },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                            contentDescription = "Link",
                                            tint = BerlinRed,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Button(
                        onClick = { showFullTextDialog = false },
                        colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(if (language == AppLanguage.TURKISH) "Kapat / Hikâyeye Dön" else "Schließen", color = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun StoryCreateDialog(
    language: AppLanguage,
    onClose: () -> Unit,
    onSubmit: (
        headline: String,
        subtext: String,
        kiez: String,
        kind: String,
        color: String,
        author: String,
        mediaUri: String?,
        isVideo: Boolean,
        isCommercial: Boolean,
        durationHours: Int,
        pricePaid: Double,
        urlLink: String
    ) -> Unit,
    // Prefill when text / a picture was shared from another app (e.g. WhatsApp)
    initialHeadline: String = "",
    initialSubtext: String = "",
    initialLink: String = "",
    initialMediaUri: String? = null,
    initialIsVideo: Boolean = false
) {
    var headline by remember { mutableStateOf(initialHeadline) }
    var subtext by remember { mutableStateOf(initialSubtext) }
    var selectedKiez by remember { mutableStateOf("Kreuzberg") }
    var selectedKind by remember { mutableStateOf("news") }
    var selectedColor by remember { mutableStateOf("blau") }
    val storyContext = LocalContext.current
    // Name is required (weekly Kiez-Stars); the last one used is filled in
    var author by remember { mutableStateOf(com.example.ui.components.KiezStarsRepository.savedName(storyContext)) }
    var urlLink by remember { mutableStateOf(initialLink) }
    var customKind by remember { mutableStateOf("") }
    var isCustomKindSelected by remember { mutableStateOf(false) }
    var kiezMenuExpanded by remember { mutableStateOf(false) }
    var videoDurationWarning by remember { mutableStateOf<String?>(null) }
    var selectedDurationHours by remember { mutableIntStateOf(24) }
    var isCommercial by remember { mutableStateOf(false) }
    var rulesAccepted by remember { mutableStateOf(false) }

    var selectedMediaUri by remember { mutableStateOf<String?>(initialMediaUri) }
    var isVideoMedia by remember { mutableStateOf(initialIsVideo) }
    var durationMenuExpanded by remember { mutableStateOf(false) }
    val context = LocalContext.current

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            selectedMediaUri = uri.toString()
            isVideoMedia = false
            videoDurationWarning = null
        }
    }

    val videoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            // Check video duration: MUST be <= 90 seconds
            var durationSec = 0L
            try {
                val retriever = MediaMetadataRetriever()
                retriever.setDataSource(context, uri)
                val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
                durationSec = durationMs / 1000L
                retriever.release()
            } catch (_: Exception) {}

            if (durationSec > 90L) {
                videoDurationWarning = if (language == AppLanguage.TURKISH)
                    "Video en fazla 90 saniye olabilir! (Seçilen video: ${durationSec} saniye)"
                else if (language == AppLanguage.ENGLISH)
                    "Video must be maximum 90 seconds! (Selected: ${durationSec}s)"
                else
                    "Video darf maximal 90 Sekunden lang sein! (Gewählt: ${durationSec}s)"
                selectedMediaUri = null
                isVideoMedia = false
            } else {
                videoDurationWarning = null
                selectedMediaUri = uri.toString()
                isVideoMedia = true
            }
        }
    }

    var customKiezInput by remember { mutableStateOf("") }
    var showCustomKiezInput by remember { mutableStateOf(false) }

    val allBerlinKieze = remember {
        val baseKieze = listOf(
            "Ganz Berlin",
            "Berlin ve Çevresi",
            "Mitte",
            "Kreuzberg",
            "Friedrichshain",
            "Prenzlauer Berg",
            "Neukölln",
            "Charlottenburg",
            "Wilmersdorf",
            "Schöneberg",
            "Tempelhof",
            "Wedding",
            "Moabit",
            "Tegel",
            "Spandau",
            "Reinickendorf",
            "Pankow",
            "Tiergarten",
            "Steglitz",
            "Zehlendorf",
            "Marzahn",
            "Hellersdorf",
            "Lichtenberg",
            "Treptow",
            "Köpenick",
            "Weißensee",
            "Lichtenrade",
            "Britz",
            "Buckow",
            "Rudow",
            "Gropiusstadt",
            "Halensee",
            "Schmargendorf",
            "Grunewald",
            "Westend",
            "Charlottenburg-Nord",
            "Friedenau",
            "Mariendorf",
            "Marienfelde",
            "Lankwitz",
            "Lichterfelde",
            "Dahlem",
            "Nikolassee",
            "Wannsee",
            "Haselhorst",
            "Siemensstadt",
            "Staaken",
            "Gatow",
            "Kladow",
            "Hakenfelde",
            "Falkenhagener Feld",
            "Wilhelmstadt",
            "Wittenau",
            "Hermsdorf",
            "Waidmannslust",
            "Lübars",
            "Frohnau",
            "Heiligensee",
            "Konradshöhe",
            "Märkisches Viertel",
            "Blankenburg",
            "Blankenfelde",
            "Buch",
            "Französisch Buchholz",
            "Heinersdorf",
            "Karow",
            "Niederschönhausen",
            "Rosenthal",
            "Wilhelmsruh",
            "Friedrichsfelde",
            "Karlshorst",
            "Falkenberg",
            "Malchow",
            "Wartenberg",
            "Neu-Hohenschönhausen",
            "Alt-Hohenschönhausen",
            "Fennpfuhl",
            "Rummelsburg",
            "Biesdorf",
            "Kaulsdorf",
            "Mahlsdorf",
            "Alt-Treptow",
            "Plänterwald",
            "Baumschulenweg",
            "Johannisthal",
            "Niederschöneweide",
            "Altglienicke",
            "Adlershof",
            "Bohnsdorf",
            "Oberschöneweide",
            "Köpenick",
            "Friedrichshagen",
            "Rahnsdorf",
            "Grünau",
            "Müggelheim",
            "Schmöckwitz"
        )
        val customKieze = com.example.data.repository.KiezStorageManager.loadCustomKieze(context)
        (baseKieze + customKieze).distinct()
    }

    val priceToPay = when (selectedDurationHours) {
        168 -> 5.00
        720 -> 9.90
        else -> 0.00
    }

    Dialog(onDismissRequest = onClose) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Durum / Hikâye Paylaş" else "Story / Status teilen",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    )
                    IconButton(onClick = onClose) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Text(
                    text = if (language == AppLanguage.TURKISH)
                        "Resim veya 1 dk video seç, başlık ve metin ekle. İndirildiğinde My Kiez Berlin logosu damgalanır."
                    else
                        "Foto oder Video wählen, Text verfassen. Beim Download wird das offizielle My Kiez Berlin Logo als Siegel eingefügt.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Media picker buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            photoPickerLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Image, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (language == AppLanguage.TURKISH) "Fotoğraf Seç" else "Foto wählen", fontSize = 11.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            videoPickerLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly))
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Videocam, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (language == AppLanguage.TURKISH) "Video (1 Dk)" else "Video (1 Min)", fontSize = 11.sp)
                    }
                }

                // Video 90s Warning if exceeded
                videoDurationWarning?.let { warningText ->
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = BerlinRed.copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BerlinRed),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(20.dp))
                            Text(warningText, color = BerlinRed, fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (selectedMediaUri != null) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = if (isVideoMedia) (if (language == AppLanguage.TURKISH) "Seçilen: Video (Maks 90 sn)" else "Ausgewählt: Video (Max 90 Sek.)") else (if (language == AppLanguage.TURKISH) "Seçilen: Fotoğraf / Görsel" else "Ausgewählt: Foto"),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = BerlinGreen
                            )
                            IconButton(onClick = { selectedMediaUri = null }, modifier = Modifier.size(24.dp)) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Remove")
                            }
                        }
                    }
                }

                // 24+2 MAHALLE HAMBURGER MENÜSÜ (Ganz Berlin, Berlin ve Çevresi + 24 Berlin Mahallesi)
                Text(
                    text = if (language == AppLanguage.TURKISH) "Olay / Hikâye Mahallesi (24 Mahalle & Berlin):" else "Bezirk / Kiez wählen (24 Kieze & Umgebung):",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Box(modifier = Modifier.fillMaxWidth()) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { kiezMenuExpanded = true }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 11.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.LocationOn, contentDescription = null, tint = BerlinRed, modifier = Modifier.size(18.dp))
                                Text("📍 $selectedKiez", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                    }

                    DropdownMenu(
                        expanded = kiezMenuExpanded,
                        onDismissRequest = { kiezMenuExpanded = false }
                    ) {
                        DropdownMenuItem(
                            text = {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "+ Yeni Mahalle Ekle..." else "+ Neuen Kiez hinzufügen...",
                                    fontWeight = FontWeight.Bold,
                                    color = BerlinRed
                                )
                            },
                            onClick = {
                                showCustomKiezInput = true
                                kiezMenuExpanded = false
                            }
                        )
                        allBerlinKieze.forEach { kiezName ->
                            DropdownMenuItem(
                                text = {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = kiezName,
                                            fontWeight = if (selectedKiez == kiezName) FontWeight.Bold else FontWeight.Normal,
                                            color = if (kiezName == "Ganz Berlin" || kiezName == "Berlin ve Çevresi") BerlinRed else MaterialTheme.colorScheme.onSurface
                                        )
                                        if (selectedKiez == kiezName) {
                                            Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(16.dp))
                                        }
                                    }
                                },
                                onClick = {
                                    selectedKiez = kiezName
                                    kiezMenuExpanded = false
                                }
                            )
                        }
                    }
                }

                if (showCustomKiezInput) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = customKiezInput,
                            onValueChange = { customKiezInput = it },
                            placeholder = { Text(if (language == AppLanguage.TURKISH) "Yeni Mahalle Adı (örn: Tegel)" else "Kiez-Name eingeben") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        Button(
                            onClick = {
                                if (customKiezInput.isNotBlank()) {
                                    val trimmed = customKiezInput.trim()
                                    selectedKiez = trimmed
                                    com.example.data.repository.KiezStorageManager.saveCustomKiez(context, trimmed)
                                    showCustomKiezInput = false
                                    customKiezInput = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinGreen)
                        ) {
                            Text("Ekle")
                        }
                    }
                }

                // KATEGORİ HAPLARI (Neuigkeit, Verkehr, Veranstaltung, Warnung, Info, Politik + ÖZEL KATEGORİ GİRİŞİ)
                Text(
                    text = if (language == AppLanguage.TURKISH) "Kategori Seçimi:" else "Kategorie wählen:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val defaultCategories = listOf(
                        "Neuigkeit" to (if (language == AppLanguage.TURKISH) "Haber / Neuigkeit" else "Neuigkeit"),
                        "Verkehr" to (if (language == AppLanguage.TURKISH) "Trafik / Verkehr" else "Verkehr"),
                        "Veranstaltung" to (if (language == AppLanguage.TURKISH) "Etkinlik / Event" else "Veranstaltung"),
                        "Warnung" to (if (language == AppLanguage.TURKISH) "Uyarı / Warnung" else "Warnung"),
                        "Info" to (if (language == AppLanguage.TURKISH) "Bilgi / Info" else "Info"),
                        "Politik" to (if (language == AppLanguage.TURKISH) "Politik / Yerel" else "Politik")
                    )

                    items(defaultCategories) { (catKey, catLabel) ->
                        FilterChip(
                            selected = !isCustomKindSelected && selectedKind == catKey,
                            onClick = {
                                isCustomKindSelected = false
                                selectedKind = catKey
                            },
                            label = { Text(catLabel, fontSize = 11.sp) }
                        )
                    }

                    item {
                        FilterChip(
                            selected = isCustomKindSelected,
                            onClick = { isCustomKindSelected = true },
                            label = { Text(if (language == AppLanguage.TURKISH) "+ Kendi Kategorini Yaz" else "+ Eigene Kategorie", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        )
                    }
                }

                // Özel Kategori Serbest Metin Girişi
                if (isCustomKindSelected) {
                    OutlinedTextField(
                        value = customKind,
                        onValueChange = { customKind = it },
                        label = { Text(if (language == AppLanguage.TURKISH) "Özel Kategori İsmi Yazın" else "Eigene Kategorie eingeben") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                OutlinedTextField(
                    value = headline,
                    onValueChange = { headline = it },
                    label = { Text(if (language == AppLanguage.TURKISH) "Kısa Başlık (Maks 2 Satır)" else "Kurzer Titel (Max 2 Zeilen)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = subtext,
                    onValueChange = { subtext = it },
                    label = { Text(if (language == AppLanguage.TURKISH) "Detaylı Metin (DEVAM OKU ile okunur)" else "Ausführlicher Text (für DEVAM OKU)") },
                    maxLines = 4,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = author,
                    onValueChange = { author = it.take(40) },
                    label = { Text(if (language == AppLanguage.TURKISH) "Adın / kullanıcı adın (zorunlu) *" else if (language == AppLanguage.ENGLISH) "Your name / user name (required) *" else "Dein Name / Nutzername (Pflicht) *") },
                    supportingText = {
                        Text(
                            if (author.isNotBlank() && !isValidStoryAuthor(author)) {
                                if (language == AppLanguage.TURKISH) "⚠️ En az 2 harf – sadece emoji olmaz" else if (language == AppLanguage.ENGLISH) "⚠️ At least 2 letters – emoji only is not enough" else "⚠️ Mindestens 2 Buchstaben – nur Emojis reichen nicht"
                            } else if (language == AppLanguage.TURKISH) "🏆 Haftanın Kiez Yıldızları bu isimle sayılır" else if (language == AppLanguage.ENGLISH) "🏆 Counts for the Kiez Stars of the week" else "🏆 Zählt für die Kiez-Stars der Woche",
                            fontSize = 11.sp
                        )
                    },
                    isError = !isValidStoryAuthor(author),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // YENİ PENCERE: URL / WEB SAYFASI LİNKİ GİRİŞİ
                OutlinedTextField(
                    value = urlLink,
                    onValueChange = { urlLink = it },
                    label = { Text(if (language == AppLanguage.TURKISH) "Web Sayfası / Kaynak Linki (URL)" else "Webseite / Quellen-Link (URL)") },
                    placeholder = { Text("https://...") },
                    leadingIcon = { Icon(imageVector = Icons.Default.Link, contentDescription = "URL Link", tint = BerlinBlue) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Commercial Toggle with 3 months free
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Checkbox(checked = isCommercial, onCheckedChange = { isCommercial = it })
                    Column {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "Ticari Giriş (İşletme)" else "Gewerblicher Eintrag",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        if (isCommercial) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "İlk 3 Ay Ücretsiz! Sonra paket ücreti." else "Erste 3 Monate kostenlos!",
                                fontSize = 10.5.sp,
                                color = BerlinGreen,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Duration Selector - Clean Hamburger / Dropdown & Compact Tidy Layout
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Yayın Süresi:" else "Laufzeit:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = when (selectedDurationHours) {
                            24 -> if (language == AppLanguage.TURKISH) "24 Saat (Ücretsiz)" else "24 Std. (Kostenlos)"
                            48 -> if (language == AppLanguage.TURKISH) "48 Saat (Ücretsiz)" else "48 Std. (Kostenlos)"
                            168 -> if (language == AppLanguage.TURKISH) "7 Gün (5,00€)" else "7 Tage (5,00€)"
                            else -> if (language == AppLanguage.TURKISH) "30 Gün (9,90€)" else "30 Tage (9,90€)"
                        },
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (selectedDurationHours <= 48) BerlinGreen else BerlinRed
                    )
                }

                // Compact Hamburger Menu Selector (Takes 1 clean row, perfectly structured)
                Box(modifier = Modifier.fillMaxWidth()) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { durationMenuExpanded = true }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Menu,
                                    contentDescription = "Süre Menüsü",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = when (selectedDurationHours) {
                                        24 -> if (language == AppLanguage.TURKISH) "24 Saat (0€ Ücretsiz)" else "24 Stunden (Kostenlos 0€)"
                                        48 -> if (language == AppLanguage.TURKISH) "48 Saat (0€ Ücretsiz)" else "48 Stunden (Kostenlos 0€)"
                                        168 -> if (language == AppLanguage.TURKISH) "7 Gün (5,00€ Sponsorlu)" else "7 Tage (5,00€ Gewerblich)"
                                        else -> if (language == AppLanguage.TURKISH) "30 Gün (9,90€ Premium)" else "30 Tage (9,90€ Monatspaket)"
                                    },
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    DropdownMenu(
                        expanded = durationMenuExpanded,
                        onDismissRequest = { durationMenuExpanded = false }
                    ) {
                        listOf(
                            24 to (if (language == AppLanguage.TURKISH) "24 Saat (Ücretsiz · 0€)" else "24 Std. (Kostenlos · 0€)"),
                            48 to (if (language == AppLanguage.TURKISH) "48 Saat (Ücretsiz · 0€)" else "48 Std. (Kostenlos · 0€)")
                        ).forEach { (dur, label) ->
                            DropdownMenuItem(
                                text = {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(label, fontWeight = if (selectedDurationHours == dur) FontWeight.Bold else FontWeight.Normal)
                                        if (selectedDurationHours == dur) {
                                            Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = BerlinGreen, modifier = Modifier.size(16.dp))
                                        }
                                    }
                                },
                                onClick = {
                                    selectedDurationHours = dur
                                    durationMenuExpanded = false
                                }
                            )
                        }
                    }
                }

                // 24s and 48s choice buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (selectedDurationHours == 24) BerlinGreen.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (selectedDurationHours == 24) BerlinGreen else Color.Transparent),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { selectedDurationHours = 24 }
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "24 Saat (0€)" else "24 Std. (0€)",
                            fontSize = 12.sp,
                            fontWeight = if (selectedDurationHours == 24) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedDurationHours == 24) BerlinGreen else MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(vertical = 10.dp),
                            textAlign = TextAlign.Center
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (selectedDurationHours == 48) BerlinGreen.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (selectedDurationHours == 48) BerlinGreen else Color.Transparent),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { selectedDurationHours = 48 }
                    ) {
                        Text(
                            text = if (language == AppLanguage.TURKISH) "48 Saat (0€)" else "48 Std. (0€)",
                            fontSize = 12.sp,
                            fontWeight = if (selectedDurationHours == 48) FontWeight.Bold else FontWeight.Normal,
                            color = if (selectedDurationHours == 48) BerlinGreen else MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(vertical = 10.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                // Rules
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Checkbox(checked = rulesAccepted, onCheckedChange = { rulesAccepted = it })
                    Text(
                        text = if (language == AppLanguage.TURKISH)
                            "Politik, küfür ve 18+ içeriklerin yasak olduğunu kabul ediyorum."
                        else
                            "Ich bestätige: Keine Politik, keine Beleidigungen, keine 18+ Inhalte.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Button(
                    onClick = {
                        if (headline.isNotBlank() && rulesAccepted && author.isNotBlank()) {
                            com.example.ui.components.KiezStarsRepository.saveName(storyContext, author)
                            val finalKind = if (isCustomKindSelected && customKind.isNotBlank()) customKind.trim() else selectedKind
                            onSubmit(
                                headline,
                                subtext,
                                selectedKiez,
                                finalKind,
                                selectedColor,
                                if (author.isBlank()) "Kiez-User" else author,
                                selectedMediaUri,
                                isVideoMedia,
                                isCommercial,
                                selectedDurationHours,
                                priceToPay,
                                urlLink.trim()
                            )
                        }
                    },
                    enabled = headline.isNotBlank() && rulesAccepted && isValidStoryAuthor(author),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                ) {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Durumu Paylaş / Yayınla 🚀" else "Story veröffentlichen 🚀",
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}


/** Admin only: one tap shares the story with media, text, link, app link and web name. */
@Composable
fun AdminShareRow(story: KiezStory) {
    val context = LocalContext.current
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    val targets = listOf(
        Triple("whatsapp", "WhatsApp", Color(0xFF25D366)),
        Triple("instagram", "Instagram", Color(0xFFC13584)),
        Triple("facebook", "Facebook", Color(0xFF1877F2)),
        Triple("tiktok", "TikTok", Color(0xFF111111))
    )
    Column {
        Text("📣 Admin: teilen / paylaş", color = Color.White.copy(alpha = 0.8f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
            targets.forEach { (key, label, color) ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (busy) color.copy(alpha = 0.5f) else color)
                        .clickable(enabled = !busy) {
                            busy = true
                            scope.launch {
                                val media = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                                    com.example.util.StoryShareHelper.prepareMedia(context, story)
                                }
                                com.example.util.StoryShareHelper.share(context, story, key, media)
                                busy = false
                            }
                        }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (busy) "…" else label, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                }
            }
        }
    }
}

/** Cloudflare image resizing ("/cdn-cgi/image/"); switched off for the session after the first failure. */
private object StoryThumbs { @Volatile var resizeAvailable = true }

private const val MEDIA_PREFIX = "https://mykiezberlin.com/media/"

private fun storyThumbUrl(url: String): String? =
    if (StoryThumbs.resizeAvailable && url.startsWith(MEDIA_PREFIX))
        "https://mykiezberlin.com/cdn-cgi/image/width=200,quality=75,format=auto/media/" + url.removePrefix(MEDIA_PREFIX)
    else null

/** Story ring picture: thumbnail first, full image as fallback, decoded at ring size. */
@Composable
private fun StoryRingImage(url: String, description: String, placeholderRes: Int) {
    val context = LocalContext.current
    var useFull by remember(url) { mutableStateOf(storyThumbUrl(url) == null) }
    val request = remember(url, useFull) {
        ImageRequest.Builder(context)
            .data(if (useFull) url else storyThumbUrl(url) ?: url)
            .size(200)
            .crossfade(true)
            .build()
    }
    AsyncImage(
        model = request,
        contentDescription = description,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Crop,
        placeholder = painterResource(id = placeholderRes),
        error = painterResource(id = placeholderRes),
        onError = { if (!useFull) { StoryThumbs.resizeAvailable = false; useFull = true } }
    )
}

/** 2026-11-13: a story author needs a name or nickname with at least 2 letters or digits (not only emoji). */
fun isValidStoryAuthor(name: String): Boolean = name.count { it.isLetterOrDigit() } >= 2
