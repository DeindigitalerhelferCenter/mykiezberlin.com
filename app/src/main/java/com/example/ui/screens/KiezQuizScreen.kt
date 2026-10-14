package com.example.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppLanguage
import com.example.data.repository.SampleData
import com.example.ui.components.KiezPhotoHelper
import com.example.ui.components.RealKiezImage
import com.example.ui.theme.*

private data class ConfettiParticle(
    val xNorm: Float,
    val speed: Float,
    val size: Float,
    val color: Color,
    val rotationSpeed: Float
)

@Composable
fun ConfettiCelebration(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "confetti_anim")
    val animProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "confetti_fall"
    )

    val particles = remember {
        List(48) { index ->
            ConfettiParticle(
                xNorm = (index * 0.021f + 0.015f) % 1f,
                speed = 0.55f + (index % 6) * 0.11f,
                size = 7f + (index % 5) * 2.5f,
                color = when (index % 6) {
                    0 -> BerlinRed
                    1 -> BerlinYellow
                    2 -> BerlinBlue
                    3 -> BerlinGreen
                    4 -> Color(0xFF8B5CF6)
                    else -> Color(0xFFEC4899)
                },
                rotationSpeed = 2f + (index % 4) * 1.8f
            )
        }
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        particles.forEach { p ->
            val y = ((animProgress * p.speed + p.xNorm) % 1f) * size.height
            val sway = kotlin.math.sin((animProgress * 6.28f * p.rotationSpeed).toDouble()).toFloat() * 22f
            val x = (p.xNorm * size.width + sway).coerceIn(0f, size.width)
            drawCircle(
                color = p.color,
                radius = p.size,
                center = androidx.compose.ui.geometry.Offset(x, y)
            )
        }
    }
}

@Composable
fun KiezQuizScreen(
    currentIndex: Int,
    selectedOption: Int?,
    isAnswerChecked: Boolean,
    score: Int,
    isFinished: Boolean,
    language: AppLanguage,
    onSelectOption: (Int) -> Unit,
    onNextQuestion: () -> Unit,
    onRestart: () -> Unit,
    onNavigateHome: () -> Unit = {},
    onNavigateKieze: () -> Unit = {}
) {
    val questions = SampleData.quizQuestions
    val currentQuestion = if (currentIndex < questions.size) questions[currentIndex] else questions.first()
    val scrollState = rememberScrollState()

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Quiz Header with Back Navigation & Progress
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    IconButton(
                        onClick = onNavigateHome,
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = if (language == AppLanguage.TURKISH) "Geri" else "Zurück",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    Surface(
                        shape = CircleShape,
                        color = BerlinYellowLight,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.EmojiEvents,
                                contentDescription = null,
                                tint = BerlinYellow,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }

                    Text(
                        text = if (language == AppLanguage.TURKISH) "Kiez Bilgi Yarışması" else if (language == AppLanguage.ENGLISH) "Kiez Quiz" else "Kiez Quiz",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Text(
                        text = if (isFinished) "FERTIG" else "${currentIndex + 1} / ${questions.size}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = BerlinRed,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            LinearProgressIndicator(
                progress = {
                    if (isFinished) 1f else (currentIndex + 1).toFloat() / questions.size.toFloat()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                color = BerlinRed,
                trackColor = BerlinRedLight
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Scrollable Content Area so all questions, options, explanation and buttons are fully accessible!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(bottom = 90.dp)
            ) {
                if (isFinished) {
                    // Celebration Screen with Confetti & 1 to 5 smileys rating
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(6.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = BerlinYellowLight,
                                modifier = Modifier.size(80.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.EmojiEvents,
                                        contentDescription = null,
                                        tint = BerlinYellow,
                                        modifier = Modifier.size(48.dp)
                                    )
                                }
                            }

                            Text(
                                text = if (language == AppLanguage.TURKISH) "Tebrikler! 🎉" else if (language == AppLanguage.ENGLISH) "Congratulations! 🎉" else "Glückwunsch! 🎉",
                                fontWeight = FontWeight.Black,
                                fontSize = 24.sp
                            )

                            // 1 to 5 smileys score representation as requested!
                            val smileys = listOf("🧐", "😐", "🙂", "😃", "🤩")
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                for (i in 1..5) {
                                    val isAchieved = i <= score
                                    val emoji = smileys[i - 1]
                                    Surface(
                                        shape = CircleShape,
                                        color = if (isAchieved) BerlinYellowLight else MaterialTheme.colorScheme.surfaceVariant,
                                        border = if (isAchieved) androidx.compose.foundation.BorderStroke(2.dp, BerlinYellow) else null,
                                        modifier = Modifier.size(44.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                text = emoji,
                                                fontSize = 22.sp,
                                                modifier = if (!isAchieved) Modifier.padding(2.dp) else Modifier
                                            )
                                        }
                                    }
                                }
                            }

                            // Score text & motivational feedback
                            val feedbackText = when (score) {
                                5 -> if (language == AppLanguage.TURKISH) "Mükemmel! 5/5 Tam bir Berlin Uzmanısın!" else "Perfekt! 5/5 Du bist ein echter Berlin-Experte!"
                                4 -> if (language == AppLanguage.TURKISH) "Harika! 4/5 Berlin'i çok iyi biliyorsun!" else "Großartig! 4/5 Fast alles richtig gewusst!"
                                3 -> if (language == AppLanguage.TURKISH) "Güzel Sonuç! 3/5 Berlin hakkında iyi bilgin var." else "Guter Erfolg! 3/5 Solides Berlin-Wissen."
                                2 -> if (language == AppLanguage.TURKISH) "Fena Değil! 2/5 Kiezleri keşfetmeye devam et!" else "Nicht schlecht! 2/5 Erkunde noch mehr Kieze!"
                                else -> if (language == AppLanguage.TURKISH) "$score/5 Berlin'de öğrenecek daha çok kiez var!" else "$score/5 Es gibt noch viel in Berlin zu entdecken!"
                            }

                            Text(
                                text = feedbackText,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = BerlinRed,
                                textAlign = TextAlign.Center
                            )

                            Text(
                                text = if (language == AppLanguage.TURKISH)
                                    "Berlin bilginiz test edildi. Toplam skorunuz: $score / ${questions.size}"
                                else if (language == AppLanguage.ENGLISH)
                                    "Your Berlin knowledge was tested. Final score: $score / ${questions.size}"
                                else
                                    "Du bist ein echter Berlin-Kenner! Dein Ergebnis: $score / ${questions.size}",
                                fontSize = 13.5.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            // 1. Restart Button
                            Button(
                                onClick = onRestart,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                                modifier = Modifier.fillMaxWidth().height(48.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Refresh, contentDescription = null, tint = Color.White)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Yeniden Başlat" else if (language == AppLanguage.ENGLISH) "Play Again" else "Erneut spielen",
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }

                            // 2. Return Home Button
                            OutlinedButton(
                                onClick = onNavigateHome,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth().height(48.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Home, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Ana Sayfaya Dön" else if (language == AppLanguage.ENGLISH) "Back to Home" else "Zurück zur Startseite",
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }

                            // 3. Explore Kieze Button
                            TextButton(
                                onClick = onNavigateKieze,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(imageVector = Icons.Default.LocationOn, contentDescription = null, tint = BerlinBlue)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Berlin Kiezlerini Keşfet" else if (language == AppLanguage.ENGLISH) "Explore Kieze" else "Berliner Kieze entdecken",
                                    color = BerlinBlue,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                } else {
                    // Question Landmark Photo Banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .padding(horizontal = 16.dp)
                            .clip(RoundedCornerShape(18.dp))
                    ) {
                        RealKiezImage(
                            drawableId = KiezPhotoHelper.getQuizDrawable(currentQuestion.id),
                            contentDescription = currentQuestion.question,
                            showBottomGradient = true,
                            modifier = Modifier.fillMaxSize()
                        )
                        Surface(
                            color = BerlinRed,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .padding(12.dp)
                        ) {
                            Text(
                                text = "BERLIN QUIZ · FRAGE ${currentIndex + 1}/${questions.size}",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Question Text
                    Text(
                        text = currentQuestion.question,
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        lineHeight = 23.sp,
                        color = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Options List
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        currentQuestion.options.forEachIndexed { index, optionText ->
                            val isSelected = selectedOption == index
                            val isCorrect = index == currentQuestion.correctIndex

                            val (containerColor, borderColor, textColor) = when {
                                !isAnswerChecked && isSelected -> Triple(BerlinRedLight, BerlinRed, BerlinRedDark)
                                isAnswerChecked && isCorrect -> Triple(BerlinGreenLight, BerlinGreen, BerlinGreen)
                                isAnswerChecked && isSelected && !isCorrect -> Triple(Color(0xFFFEE2E2), Color(0xFFDC2626), Color(0xFFDC2626))
                                else -> Triple(MaterialTheme.colorScheme.surface, MaterialTheme.colorScheme.outline, MaterialTheme.colorScheme.onSurface)
                            }

                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable(enabled = !isAnswerChecked) { onSelectOption(index) },
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = containerColor),
                                border = androidx.compose.foundation.BorderStroke(1.5.dp, borderColor)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = optionText,
                                        fontWeight = if (isSelected || (isAnswerChecked && isCorrect)) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 15.sp,
                                        color = textColor,
                                        modifier = Modifier.weight(1f)
                                    )

                                    if (isAnswerChecked) {
                                        if (isCorrect) {
                                            Icon(imageVector = Icons.Default.CheckCircle, contentDescription = "Richtig", tint = BerlinGreen)
                                        } else if (isSelected) {
                                            Icon(imageVector = Icons.Default.Close, contentDescription = "Falsch", tint = Color(0xFFDC2626))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Explanation & Next Button
                    if (isAnswerChecked) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = BerlinGreenLight)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(
                                    text = currentQuestion.explanation,
                                    color = Color(0xFF14532D),
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Medium,
                                    lineHeight = 19.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        Button(
                            onClick = onNextQuestion,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp)
                                .height(52.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = if (currentIndex + 1 < questions.size)
                                        (if (language == AppLanguage.TURKISH) "Sonraki Soru" else if (language == AppLanguage.ENGLISH) "Next Question" else "Nächste Frage")
                                    else
                                        (if (language == AppLanguage.TURKISH) "Sonuçları Gör" else if (language == AppLanguage.ENGLISH) "See Results" else "Ergebnis ansehen"),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = Color.White
                                )
                                Icon(imageVector = Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // Overlay Confetti animation when quiz finishes!
        if (isFinished) {
            ConfettiCelebration(modifier = Modifier.fillMaxSize())
        }
    }
}
