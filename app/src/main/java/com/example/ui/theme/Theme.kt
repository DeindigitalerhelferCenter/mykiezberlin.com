package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = BerlinRed,
    onPrimary = Color.White,
    primaryContainer = BerlinRedDark,
    onPrimaryContainer = Color.White,
    secondary = BerlinBlue,
    onSecondary = Color.White,
    background = Color(0xFF0F172A),
    surface = Color(0xFF1E293B),
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = Color(0xFF334155),
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = Color(0xFF475569)
)

private val LightColorScheme = lightColorScheme(
    primary = BerlinRed,
    onPrimary = Color.White,
    primaryContainer = BerlinRedLight,
    onPrimaryContainer = BerlinRedDark,
    secondary = BerlinDark,
    onSecondary = Color.White,
    secondaryContainer = BerlinSurfaceVariant,
    onSecondaryContainer = BerlinDark,
    tertiary = BerlinBlue,
    onTertiary = Color.White,
    background = BerlinBackground,
    surface = BerlinSurface,
    onBackground = BerlinCharcoal,
    onSurface = BerlinCharcoal,
    surfaceVariant = BerlinSurfaceVariant,
    onSurfaceVariant = BerlinTextMuted,
    outline = BerlinBorder
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
