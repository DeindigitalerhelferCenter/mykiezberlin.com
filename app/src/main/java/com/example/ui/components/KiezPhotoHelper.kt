package com.example.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import coil.compose.AsyncImage
import com.example.R

object KiezPhotoHelper {


    /** 2026-11-14: photographer + licence of every bundled real photo (Wikimedia Commons) – shown on the picture. */
    val PHOTO_CREDITS: Map<Int, String> by lazy {
        mapOf(
        R.drawable.kiezfoto_mitte to "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.kiezfoto_kreuzberg to "Foto: Sarah Jane at Flickr · CC BY 2.0 · Wikimedia Commons",
        R.drawable.kiezfoto_neukoelln to "Foto: A.Savin · FAL · Wikimedia Commons",
        R.drawable.kiezfoto_friedrichshain to "Foto: Joachim F. Thurn · CC BY-SA 3.0 de · Wikimedia Commons",
        R.drawable.kiezfoto_prenzlauer_berg to "Foto: Kaspar Metz · Public domain · Wikimedia Commons",
        R.drawable.kiezfoto_charlottenburg to "Foto: Times · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.kiezfoto_schoeneberg to "Foto: Dirk Ingo Franke · CC BY 3.0 · Wikimedia Commons",
        R.drawable.kiezfoto_wedding to "Foto: Ansgar Koreng · CC BY 3.0 de · Wikimedia Commons",
        R.drawable.kiezfoto_moabit to "Foto: Ansgar Koreng · CC BY 3.0 de · Wikimedia Commons",
        R.drawable.kiezfoto_tiergarten to "Foto: Jörg Braukmann · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.kiezfoto_wilmersdorf to "Foto: Lienhard Schulz · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.kiezfoto_tempelhof to "Foto: Matti Blume · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.kiezfoto_gesundbrunnen to "Foto: Angela Monika Arnold · CC BY-SA 2.0 de · Wikimedia Commons",
        R.drawable.kiezfoto_steglitz to "Foto: Marek Śliwecki · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.kiezfoto_zehlendorf to "Foto: A.Savin · FAL · Wikimedia Commons",
        R.drawable.kiezfoto_spandau to "Foto: Carsten Steger · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.kiezfoto_reinickendorf to "Foto: TILMAN KLUGE at German Wikipedia · Public domain · Wikimedia Commons",
        R.drawable.kiezfoto_pankow to "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.kiezfoto_lichtenberg to "Foto: A.Savin · FAL · Wikimedia Commons",
        R.drawable.kiezfoto_treptow to "Foto: Andreas Steinhoff · Attribution · Wikimedia Commons",
        R.drawable.kiezfoto_koepenick to "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.kiezfoto_marzahn to "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.kiezfoto_britz to "Foto: Denis Apel · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.kiezfoto_umgebung to "Foto: Yuropoulos · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.place_mustafas to "Foto: JoachimKohler-HB · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.place_curry36 to "Foto: Er nun wieder · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.place_burgermeister to "Foto: Burgermeister Berlin · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.place_schwarzes_cafe to "Foto: Babewyn · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.place_quiz_baer to "Foto: OTFW, Berlin · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.place_quiz_schrippe to "Foto: Levin Holtkamp · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.place_quiz_mauerfall to "Foto: Unknown photographer, Reproduction by Lear 21 at English Wikipedia. · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.place_bergmann to "Foto: Fridolin freudenfett · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.place_tip_mauerpark to "Foto: Traktorminze · CC BY 3.0 · Wikimedia Commons",
        R.drawable.place_tip_east_side_gallery to "Foto: Joachim F. Thurn · CC BY-SA 3.0 de · Wikimedia Commons",
        R.drawable.place_tip_brandenburger_tor to "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.place_tip_fernsehturm to "Foto: Diego Delso · CC BY-SA 4.0 · Wikimedia Commons",
        R.drawable.place_tip_museumsinsel to "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
        R.drawable.place_tip_mauer_gedenkstaette to "Foto: HerrAdams · CC BY-SA 4.0 · Wikimedia Commons"
        )
    }

    @DrawableRes
    fun getKiezDrawable(kiezId: String): Int {
        return when (kiezId.lowercase().replace("-", "").replace(" ", "").replace("ö", "oe").replace("ä", "ae").replace("ü", "ue")) {
            // 2026-11-14 (owner): every Kiez its own real photo (Wikimedia Commons) – before, e.g. Spandau showed Charlottenburg
            "mitte" -> R.drawable.kiezfoto_mitte
            "kreuzberg" -> R.drawable.kiezfoto_kreuzberg
            "neukoelln" -> R.drawable.kiezfoto_neukoelln
            "friedrichshain" -> R.drawable.kiezfoto_friedrichshain
            "prenzlauerberg" -> R.drawable.kiezfoto_prenzlauer_berg
            "charlottenburg" -> R.drawable.kiezfoto_charlottenburg
            "wilmersdorf" -> R.drawable.kiezfoto_wilmersdorf
            "schoeneberg" -> R.drawable.kiezfoto_schoeneberg
            "wedding" -> R.drawable.kiezfoto_wedding
            "gesundbrunnen" -> R.drawable.kiezfoto_gesundbrunnen
            "moabit" -> R.drawable.kiezfoto_moabit
            "tiergarten" -> R.drawable.kiezfoto_tiergarten
            "tempelhof" -> R.drawable.kiezfoto_tempelhof
            "steglitz" -> R.drawable.kiezfoto_steglitz
            "zehlendorf" -> R.drawable.kiezfoto_zehlendorf
            "spandau" -> R.drawable.kiezfoto_spandau
            "reinickendorf" -> R.drawable.kiezfoto_reinickendorf
            "pankow" -> R.drawable.kiezfoto_pankow
            "lichtenberg" -> R.drawable.kiezfoto_lichtenberg
            "treptow" -> R.drawable.kiezfoto_treptow
            "koepenick" -> R.drawable.kiezfoto_koepenick
            "marzahn" -> R.drawable.kiezfoto_marzahn
            "britz" -> R.drawable.kiezfoto_britz
            else -> R.drawable.hero_berlin
        }
    }

    @DrawableRes
    fun getFoodDrawable(foodId: String): Int {
        return when {
            // 2026-11-14 (owner): real photos of the real places (Wikimedia Commons) – no stock photos; without one: "no photo" graphic
            foodId.contains("mustafa", ignoreCase = true) -> R.drawable.place_mustafas
            foodId.contains("curry", ignoreCase = true) -> R.drawable.place_curry36
            foodId.contains("burger", ignoreCase = true) -> R.drawable.place_burgermeister
            else -> R.drawable.place_no_photo
        }
    }

    @DrawableRes
    fun getEventDrawable(eventId: String): Int {
        return when {
            eventId.contains("mauerpark", ignoreCase = true) -> R.drawable.place_tip_mauerpark
            eventId.contains("eastside", ignoreCase = true) || eventId.contains("gallery", ignoreCase = true) -> R.drawable.place_tip_east_side_gallery
            eventId.contains("bergmann", ignoreCase = true) -> R.drawable.place_bergmann
            else -> R.drawable.place_no_photo
        }
    }

    @DrawableRes
    fun getQuizDrawable(questionId: Int): Int {
        return when (questionId) {
            1 -> R.drawable.place_tip_brandenburger_tor
            2 -> R.drawable.place_quiz_baer
            3 -> R.drawable.place_tip_fernsehturm
            4 -> R.drawable.place_quiz_schrippe
            5 -> R.drawable.place_quiz_mauerfall
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
        // 2026-11-14: photo credit (licence) for bundled real photos
        KiezPhotoHelper.PHOTO_CREDITS[drawableId]?.takeIf { imageUrl.isNullOrBlank() }?.let { credit ->
            androidx.compose.material3.Text(
                credit, fontSize = androidx.compose.ui.unit.TextUnit(8.5f, androidx.compose.ui.unit.TextUnitType.Sp), color = Color.White, maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                modifier = Modifier.align(androidx.compose.ui.Alignment.BottomEnd).padding(androidx.compose.ui.unit.Dp(4f))
                    .background(Color.Black.copy(alpha = 0.45f)).padding(horizontal = androidx.compose.ui.unit.Dp(5f), vertical = androidx.compose.ui.unit.Dp(1f))
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
