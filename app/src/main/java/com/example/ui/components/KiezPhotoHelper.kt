package com.example.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import coil.compose.AsyncImage
import com.example.R

object KiezPhotoHelper {

    @DrawableRes
    fun getKiezDrawable(kiezId: String): Int {
        return when (kiezId.lowercase().replace("-", "").replace(" ", "").replace("ö", "oe").replace("ä", "ae").replace("ü", "ue")) {
            "mitte" -> R.drawable.kiez_mitte
            "kreuzberg" -> R.drawable.kiez_kreuzberg
            "neukoelln" -> R.drawable.kiez_neukoelln
            "friedrichshain" -> R.drawable.kiez_friedrichshain
            "prenzlauerberg" -> R.drawable.kiez_prenzlauerberg
            "charlottenburg" -> R.drawable.kiez_charlottenburg
            "wilmersdorf" -> R.drawable.kiez_wilmersdorf
            "schoeneberg" -> R.drawable.kiez_schoeneberg
            "wedding" -> R.drawable.kiez_wedding
            "gesundbrunnen" -> R.drawable.kiez_wedding
            "moabit" -> R.drawable.kiez_moabit
            "tiergarten" -> R.drawable.kiez_tiergarten
            "tempelhof" -> R.drawable.kiez_tempelhof
            "steglitz" -> R.drawable.kiez_schoeneberg
            "zehlendorf" -> R.drawable.kiez_wilmersdorf
            "spandau" -> R.drawable.kiez_charlottenburg
            "reinickendorf" -> R.drawable.kiez_wedding
            "pankow" -> R.drawable.kiez_prenzlauerberg
            "lichtenberg" -> R.drawable.kiez_friedrichshain
            "treptow" -> R.drawable.kiez_neukoelln
            "koepenick" -> R.drawable.kiez_tiergarten
            "marzahn" -> R.drawable.kiez_mitte
            "britz" -> R.drawable.kiez_neukoelln
            else -> R.drawable.hero_berlin
        }
    }

    @DrawableRes
    fun getFoodDrawable(foodId: String): Int {
        return when {
            foodId.contains("mustafa", ignoreCase = true) -> R.drawable.food_mustafas
            foodId.contains("anna", ignoreCase = true) || foodId.contains("blume", ignoreCase = true) -> R.drawable.food_annablume
            foodId.contains("curry", ignoreCase = true) -> R.drawable.food_curry36
            foodId.contains("burger", ignoreCase = true) -> R.drawable.food_burgermeister
            foodId.contains("zola", ignoreCase = true) || foodId.contains("pizza", ignoreCase = true) -> R.drawable.food_zola
            foodId.contains("sahara", ignoreCase = true) || foodId.contains("falafel", ignoreCase = true) -> R.drawable.food_sahara
            else -> R.drawable.food_mustafas
        }
    }

    @DrawableRes
    fun getEventDrawable(eventId: String): Int {
        return when {
            eventId.contains("mauerpark", ignoreCase = true) -> R.drawable.event_mauerpark
            eventId.contains("streetfood", ignoreCase = true) || eventId.contains("markthalle", ignoreCase = true) -> R.drawable.event_markthalle
            eventId.contains("eastside", ignoreCase = true) || eventId.contains("gallery", ignoreCase = true) -> R.drawable.event_eastside
            eventId.contains("jazz", ignoreCase = true) || eventId.contains("bergmann", ignoreCase = true) -> R.drawable.event_jazz
            else -> R.drawable.event_mauerpark
        }
    }

    @DrawableRes
    fun getQuizDrawable(questionId: Int): Int {
        return when (questionId) {
            1 -> R.drawable.quiz_brandenburg
            2 -> R.drawable.kiez_kreuzberg
            3 -> R.drawable.quiz_fernsehturm
            4 -> R.drawable.kiez_tempelhof
            5 -> R.drawable.kiez_prenzlauerberg
            6 -> R.drawable.food_curry36
            7 -> R.drawable.kiez_charlottenburg
            8 -> R.drawable.kiez_friedrichshain
            9 -> R.drawable.kiez_neukoelln
            10 -> R.drawable.kiez_tiergarten
            11 -> R.drawable.kiez_moabit
            12 -> R.drawable.kiez_wedding
            else -> R.drawable.hero_berlin
        }
    }
}

@Composable
fun RealKiezImage(
    @DrawableRes drawableId: Int,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    imageUrl: String? = null,
    contentScale: ContentScale = ContentScale.Crop,
    showBottomGradient: Boolean = false
) {
    Box(modifier = modifier) {
        if (!imageUrl.isNullOrBlank()) {
            AsyncImage(
                model = imageUrl,
                placeholder = painterResource(id = drawableId),
                error = painterResource(id = drawableId),
                contentDescription = contentDescription,
                modifier = Modifier.fillMaxSize(),
                contentScale = contentScale
            )
        } else {
            Image(
                painter = painterResource(id = drawableId),
                contentDescription = contentDescription,
                modifier = Modifier.fillMaxSize(),
                contentScale = contentScale
            )
        }
        if (showBottomGradient) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.7f)
                            ),
                            startY = 100f
                        )
                    )
            )
        }
    }
}
