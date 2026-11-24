package com.example.util

/** 2026-11-25 (owner): true while the app is on the screen (MainActivity onStart/onStop). Refresh loops skip their
 *  requests while it is false, so phones with the app in the background do not use up the D1 read limit. */
object AppVisible {
    @Volatile var on: Boolean = true
}
