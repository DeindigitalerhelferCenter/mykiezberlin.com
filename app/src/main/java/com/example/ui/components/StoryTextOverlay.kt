package com.example.ui.components

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.layout.BoxWithConstraints
import com.example.data.model.StoryOverlay

/*
 * 2026-11-17 (owner): text on top of a story picture or video – same rules as the web (public/story-text.js).
 * x/y = centre of the text (0..1 of the picture), size = font size as part of the picture width,
 * box = dark box behind the text (else a shadow). Pictures get the text burned in (burnStoryText) before upload,
 * videos carry it as data and the viewer draws it on top (StoryTextOverlay).
 */

/** Text layer exactly over the visible picture of a video (aspect = width / height, 0 = unknown -> whole box). */
@Composable
fun StoryTextOverlay(overlay: StoryOverlay, aspect: Float, modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        val inner = if (aspect > 0f) Modifier.aspectRatio(aspect) else Modifier.fillMaxSize()
        BoxWithConstraints(inner) {
            val density = LocalDensity.current
            val widthPx = with(density) { maxWidth.toPx() }
            val fontSp = with(density) { (overlay.size * widthPx).coerceAtLeast(10f).toSp() }
            val padDp = with(density) { (overlay.size * widthPx * 0.45f).toDp() }
            val textColor = runCatching { Color(android.graphics.Color.parseColor(overlay.color)) }.getOrDefault(Color.White)
            Box(Modifier.fillMaxSize()) {
                Text(
                    text = overlay.text,
                    color = textColor,
                    textAlign = TextAlign.Center,
                    style = TextStyle(
                        fontSize = fontSp,
                        lineHeight = fontSp * 1.25f,
                        fontWeight = FontWeight.ExtraBold,
                        shadow = if (overlay.box) null else Shadow(Color.Black.copy(alpha = 0.75f), Offset(0f, 0f), 8f)
                    ),
                    modifier = Modifier
                        .layout { measurable, constraints ->
                            val w = constraints.maxWidth
                            val h = constraints.maxHeight
                            val p = measurable.measure(constraints.copy(minWidth = 0, minHeight = 0, maxWidth = (w * 0.94f).toInt()))
                            layout(w, h) {
                                val x = (overlay.x * w - p.width / 2f).toInt().coerceIn(0, maxOf(0, w - p.width))
                                val y = (overlay.y * h - p.height / 2f).toInt().coerceIn(0, maxOf(0, h - p.height))
                                p.place(x, y)
                            }
                        }
                        .then(if (overlay.box) Modifier.background(Color.Black.copy(alpha = 0.55f), RoundedCornerShape(padDp * 0.8f)).padding(horizontal = padDp, vertical = padDp * 0.6f) else Modifier)
                )
            }
        }
    }
}

/** Picture + overlay -> new picture with the text inside (like mkBurnStoryText on the web). */
fun burnStoryText(src: Bitmap, overlay: StoryOverlay): Bitmap {
    val bmp = src.copy(Bitmap.Config.ARGB_8888, true)
    val w = bmp.width.toFloat()
    val h = bmp.height.toFloat()
    val canvas = Canvas(bmp)
    val px = (overlay.size * w).coerceAtLeast(10f)
    val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        textSize = px
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        color = runCatching { android.graphics.Color.parseColor(overlay.color) }.getOrDefault(android.graphics.Color.WHITE)
        if (!overlay.box) setShadowLayer(px * 0.25f, 0f, 0f, android.graphics.Color.argb(190, 0, 0, 0))
    }
    val maxW = (w * 0.9f).toInt()
    val layout = StaticLayout.Builder.obtain(overlay.text, 0, overlay.text.length, paint, maxW)
        .setAlignment(Layout.Alignment.ALIGN_CENTER)
        .setLineSpacing(px * 0.25f, 1f)
        .build()
    var textW = 0f
    for (i in 0 until layout.lineCount) textW = maxOf(textW, layout.getLineWidth(i))
    val textH = layout.height.toFloat()
    val cx = overlay.x * w
    val cy = overlay.y * h
    if (overlay.box) {
        val pad = px * 0.45f
        val box = RectF(cx - textW / 2f - pad, cy - textH / 2f - pad * 0.6f, cx + textW / 2f + pad, cy + textH / 2f + pad * 0.6f)
        canvas.drawRoundRect(box, px * 0.35f, px * 0.35f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = android.graphics.Color.argb(140, 0, 0, 0) })
    }
    canvas.save()
    canvas.translate(cx - maxW / 2f, cy - textH / 2f)
    layout.draw(canvas)
    canvas.restore()
    return bmp
}
