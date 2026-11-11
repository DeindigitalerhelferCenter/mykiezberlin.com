package com.example.data.repository

/**
 * Domains that must never be opened from the app (2026-11-11), same list as functions/_lib/blocklist.js.
 * jet-gas.de / jetgas.de redirected users to adult pages (*.sexyflirt.top, *.lovemeto.org).
 */
object LinkGuard {
    private val BLOCKED = Regex("""(^|[/.])(jet-?gas\.de|[\w-]*\.?sexyflirt\.[a-z]+|[\w-]*\.?lovemeto\.[a-z]+)""", RegexOption.IGNORE_CASE)

    fun isBlocked(url: String?): Boolean = !url.isNullOrBlank() && BLOCKED.containsMatchIn(url)

    /** The url, or "" when it points to a blocked domain. */
    fun safe(url: String?): String = if (isBlocked(url)) "" else url.orEmpty()
}
