package com.example.util

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import com.example.R
import java.io.OutputStream

object WatermarkHelper {

    /**
     * Stamps the official My Kiez Berlin logo onto the bottom-right corner of the bitmap as a watermark.
     */
    fun addLogoWatermark(context: Context, originalBitmap: Bitmap): Bitmap {
        val resultBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(resultBitmap)

        // Load the official logo
        val logoBitmap = BitmapFactory.decodeResource(context.resources, R.drawable.mykiez_logo)
            ?: return originalBitmap

        // Desired width of watermark is approx 22% of target width
        val watermarkWidth = (resultBitmap.width * 0.24f).toInt().coerceAtLeast(120)
        val aspectRatio = logoBitmap.height.toFloat() / logoBitmap.width.toFloat()
        val watermarkHeight = (watermarkWidth * aspectRatio).toInt()

        val margin = (resultBitmap.width * 0.03f).toInt().coerceAtLeast(16)
        val left = resultBitmap.width - watermarkWidth - margin
        val top = resultBitmap.height - watermarkHeight - margin

        val destRect = Rect(left, top, left + watermarkWidth, top + watermarkHeight)
        val paint = Paint().apply {
            isAntiAlias = true
            isFilterBitmap = true
            alpha = 220 // ~86% opacity seal / damga
        }

        canvas.drawBitmap(logoBitmap, null, destRect, paint)
        return resultBitmap
    }

    /**
     * Creates a high-resolution Bitmap for text stories and stamps the official My Kiez Berlin logo.
     */
    fun createTextStoryBitmap(context: Context, headline: String, subtext: String, kiez: String): Bitmap {
        val width = 1080
        val height = 1920
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Dark background
        val bgPaint = Paint().apply {
            color = android.graphics.Color.parseColor("#18191A")
            style = Paint.Style.FILL
        }
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

        // Accent top bar
        val barPaint = Paint().apply {
            color = android.graphics.Color.parseColor("#E11D48")
            style = Paint.Style.FILL
        }
        canvas.drawRect(0f, 0f, width.toFloat(), 18f, barPaint)

        // Kiez badge
        val kiezPaint = Paint().apply {
            color = android.graphics.Color.parseColor("#E11D48")
            textSize = 42f
            isFakeBoldText = true
            isAntiAlias = true
        }
        canvas.drawText("📍 $kiez", 80f, 220f, kiezPaint)

        // Headline text
        val titlePaint = Paint().apply {
            color = android.graphics.Color.WHITE
            textSize = 58f
            isFakeBoldText = true
            isAntiAlias = true
        }

        // Draw wrapped headline
        var yPos = 320f
        val headlineWords = headline.split(" ")
        var currentLine = ""
        for (word in headlineWords) {
            val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
            if (titlePaint.measureText(testLine) < 920f) {
                currentLine = testLine
            } else {
                canvas.drawText(currentLine, 80f, yPos, titlePaint)
                yPos += 72f
                currentLine = word
            }
        }
        if (currentLine.isNotEmpty()) {
            canvas.drawText(currentLine, 80f, yPos, titlePaint)
            yPos += 90f
        }

        // Subtext
        if (subtext.isNotBlank()) {
            val subPaint = Paint().apply {
                color = android.graphics.Color.parseColor("#CBD5E1")
                textSize = 40f
                isAntiAlias = true
            }
            yPos += 20f
            val subWords = subtext.split(" ")
            var subLine = ""
            for (word in subWords) {
                val testLine = if (subLine.isEmpty()) word else "$subLine $word"
                if (subPaint.measureText(testLine) < 920f) {
                    subLine = testLine
                } else {
                    canvas.drawText(subLine, 80f, yPos, subPaint)
                    yPos += 54f
                    subLine = word
                }
            }
            if (subLine.isNotEmpty()) {
                canvas.drawText(subLine, 80f, yPos, subPaint)
            }
        }

        // Stamp logo at bottom right
        return addLogoWatermark(context, bitmap)
    }

    /**
     * Saves the watermarked bitmap to device gallery / Downloads folder.
     */
    fun saveWatermarkedImageToGallery(context: Context, bitmap: Bitmap, title: String = "MyKiezBerlin_Story"): Boolean {
        val watermarked = addLogoWatermark(context, bitmap)
        val filename = "${title}_${System.currentTimeMillis()}.jpg"

        return try {
            val outputStream: OutputStream?
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/MyKiezBerlin")
                }
                val uri: Uri? = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                outputStream = uri?.let { context.contentResolver.openOutputStream(it) }
            } else {
                val imagesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                val image = java.io.File(imagesDir, filename)
                outputStream = java.io.FileOutputStream(image)
            }

            outputStream?.use {
                watermarked.compress(Bitmap.CompressFormat.JPEG, 92, it)
                it.flush()
            }
            Toast.makeText(context, "Bild mit My Kiez Berlin Wasserzeichen gespeichert! 📸", Toast.LENGTH_SHORT).show()
            true
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(context, "Fehler beim Speichern: ${e.message}", Toast.LENGTH_SHORT).show()
            false
        }
    }
}
