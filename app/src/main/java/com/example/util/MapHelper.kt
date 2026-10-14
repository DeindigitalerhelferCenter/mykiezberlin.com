package com.example.util

import android.content.Context
import android.content.Intent
import android.net.Uri

object MapHelper {
    /**
     * Opens Google Maps in a single click directly.
     * Uses direct Maps package or direct URL without showing a chooser dialog.
     */
    fun openGoogleMaps(context: Context, query: String, lat: Double? = null, lng: Double? = null) {
        val uri = if (lat != null && lng != null && lat != 0.0 && lng != 0.0) {
            Uri.parse("https://www.google.com/maps/search/?api=1&query=$lat,$lng")
        } else {
            Uri.parse("https://www.google.com/maps/search/?api=1&query=${Uri.encode(query)}")
        }

        val mapIntent = Intent(Intent.ACTION_VIEW, uri).apply {
            setPackage("com.google.android.apps.maps")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        try {
            context.startActivity(mapIntent)
        } catch (e: Exception) {
            // If Google Maps app is not installed or unavailable, open web link directly without chooser
            val browserIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(browserIntent)
        }
    }

    /**
     * Opens directions directly in Google Maps in a single click.
     */
    fun openDirections(context: Context, destination: String, lat: Double? = null, lng: Double? = null) {
        val uri = if (lat != null && lng != null && lat != 0.0 && lng != 0.0) {
            Uri.parse("https://www.google.com/maps/dir/?api=1&destination=$lat,$lng")
        } else {
            Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${Uri.encode(destination)}")
        }

        val mapIntent = Intent(Intent.ACTION_VIEW, uri).apply {
            setPackage("com.google.android.apps.maps")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }

        try {
            context.startActivity(mapIntent)
        } catch (e: Exception) {
            val browserIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(browserIntent)
        }
    }
}
