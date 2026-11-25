package com.example.ui.components

import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.lifecycle.Lifecycle
import androidx.compose.ui.platform.LocalLifecycleOwner
import com.example.data.repository.AdsRepository
import com.example.data.repository.KiezStorageManager

/**
 * 2026-11-25 (owner: honest sponsor numbers, same rule as the web – public/sponsor-seen.js):
 * a sponsor counts as "seen" only when at least half of its card is on the screen for 1 second
 * while the app is in front. The admin phone never counts. Every sponsor is counted at most once per app start.
 */
fun Modifier.sponsorSeen(adId: String): Modifier = composed {
    if (adId.isBlank()) return@composed this
    val context = LocalContext.current
    val view = LocalView.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var visible by remember(adId) { mutableStateOf(false) }
    val admin = remember { KiezStorageManager.isAdminAuthenticated(context) }
    LaunchedEffect(adId, visible) {
        if (!visible || admin) return@LaunchedEffect
        kotlinx.coroutines.delay(1000)
        if (lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) AdsRepository.trackImpressions(listOf(adId))
    }
    this.onGloballyPositioned { c ->
        val full = c.size.width.toFloat() * c.size.height.toFloat()
        if (!c.isAttached || full <= 0f || !view.isShown) {
            visible = false
            return@onGloballyPositioned
        }
        // boundsInWindow is already cut by scrolling parents (lists, pager); also cut by the screen itself
        val b = c.boundsInWindow()
        val w = (minOf(b.right, view.width.toFloat()) - maxOf(b.left, 0f)).coerceAtLeast(0f)
        val h = (minOf(b.bottom, view.height.toFloat()) - maxOf(b.top, 0f)).coerceAtLeast(0f)
        visible = w * h / full >= 0.5f
    }
}
