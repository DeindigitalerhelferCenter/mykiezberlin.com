package com.example.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppLanguage
import com.example.ui.theme.BerlinRed
import com.example.ui.viewmodel.AppScreen

@Composable
fun MyKiezBottomNav(
    currentScreen: AppScreen,
    currentLanguage: AppLanguage,
    onNavigate: (AppScreen) -> Unit,
    onOpenMoreMenu: () -> Unit
) {
    // tonalElevation tinted the bar pink (red primary); plain surface + thin top line instead
    val topLine = MaterialTheme.colorScheme.outlineVariant
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
        modifier = Modifier.drawBehind { drawLine(topLine, androidx.compose.ui.geometry.Offset(0f, 0f), androidx.compose.ui.geometry.Offset(size.width, 0f), 1.dp.toPx()) }
    ) {
        // 1. Betriebe (Businesses)
        val isBetriebeActive = currentScreen == AppScreen.BUSINESSES || currentScreen == AppScreen.HOME
        NavigationBarItem(
            selected = isBetriebeActive,
            onClick = { onNavigate(AppScreen.BUSINESSES) },
            icon = {
                Icon(
                    imageVector = Icons.Default.Storefront,
                    contentDescription = "Betriebe",
                    modifier = Modifier.size(22.dp)
                )
            },
            label = {
                Text(
                    text = if (currentLanguage == AppLanguage.TURKISH) "İşletmeler" else "Betriebe",
                    fontSize = 10.5.sp,
                    fontWeight = if (isBetriebeActive) FontWeight.Bold else FontWeight.Normal
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = BerlinRed,
                selectedTextColor = BerlinRed,
                indicatorColor = MaterialTheme.colorScheme.primaryContainer
            )
        )

        // 2. Canlı Ticker (Live Bulletin - S-Bahn, BVG, Polis)
        val isBulletinActive = currentScreen == AppScreen.LIVE_BULLETIN
        NavigationBarItem(
            selected = isBulletinActive,
            onClick = { onNavigate(AppScreen.LIVE_BULLETIN) },
            icon = {
                BadgedBox(
                    badge = {
                        Badge(containerColor = BerlinRed) {
                            Text("LIVE", fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.Sensors,
                        contentDescription = "Live Ticker",
                        modifier = Modifier.size(22.dp)
                    )
                }
            },
            label = {
                Text(
                    text = if (currentLanguage == AppLanguage.TURKISH) "Canlı Ticker" else "Live-Ticker",
                    fontSize = 10.sp,
                    fontWeight = if (isBulletinActive) FontWeight.Bold else FontWeight.Normal
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = BerlinRed,
                selectedTextColor = BerlinRed,
                indicatorColor = MaterialTheme.colorScheme.primaryContainer
            )
        )

        // 3. Spor & Piyasa (Live Clock, Weather, Rates & Sports)
        val isSportsActive = currentScreen == AppScreen.SPORTS_AND_MARKETS
        NavigationBarItem(
            selected = isSportsActive,
            onClick = { onNavigate(AppScreen.SPORTS_AND_MARKETS) },
            icon = {
                Icon(
                    imageVector = Icons.Default.TrendingUp,
                    contentDescription = "Spor & Piyasa",
                    modifier = Modifier.size(22.dp)
                )
            },
            label = {
                Text(
                    text = if (currentLanguage == AppLanguage.TURKISH) "Spor & Piyasa" else "Sport & Kurse",
                    fontSize = 10.sp,
                    fontWeight = if (isSportsActive) FontWeight.Bold else FontWeight.Normal
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = BerlinRed,
                selectedTextColor = BerlinRed,
                indicatorColor = MaterialTheme.colorScheme.primaryContainer
            )
        )

        // 4. Gutscheine (Deals & Coupons)
        val isDealsActive = currentScreen == AppScreen.DEALS
        NavigationBarItem(
            selected = isDealsActive,
            onClick = { onNavigate(AppScreen.DEALS) },
            icon = {
                Icon(
                    imageVector = Icons.Default.LocalOffer,
                    contentDescription = "Gutscheine",
                    modifier = Modifier.size(22.dp)
                )
            },
            label = {
                Text(
                    text = if (currentLanguage == AppLanguage.TURKISH) "Kuponlar" else "Gutscheine",
                    fontSize = 10.sp,
                    fontWeight = if (isDealsActive) FontWeight.Bold else FontWeight.Normal
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = BerlinRed,
                selectedTextColor = BerlinRed,
                indicatorColor = MaterialTheme.colorScheme.primaryContainer
            )
        )

        // 5. Mehr (Menü & Weitere Bereiche)
        val isMoreActive = currentScreen == AppScreen.NOTRUF ||
                currentScreen == AppScreen.REPORTER ||
                currentScreen == AppScreen.KIEZE ||
                currentScreen == AppScreen.KIEZ_DETAIL ||
                currentScreen == AppScreen.FOOD ||
                currentScreen == AppScreen.EVENTS ||
                currentScreen == AppScreen.KNOWLEDGE ||
                currentScreen == AppScreen.FAVORITES ||
                currentScreen == AppScreen.PROFILE ||
                currentScreen == AppScreen.BUSINESS_PORTAL

        NavigationBarItem(
            selected = isMoreActive,
            onClick = onOpenMoreMenu,
            icon = {
                Icon(
                    imageVector = Icons.Default.Menu,
                    contentDescription = "Mehr",
                    modifier = Modifier.size(22.dp)
                )
            },
            label = {
                Text(
                    text = if (currentLanguage == AppLanguage.TURKISH) "Menü" else if (currentLanguage == AppLanguage.ENGLISH) "More" else "Mehr",
                    fontSize = 10.5.sp,
                    fontWeight = if (isMoreActive) FontWeight.Bold else FontWeight.Normal
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = BerlinRed,
                selectedTextColor = BerlinRed,
                indicatorColor = MaterialTheme.colorScheme.primaryContainer
            )
        )
    }
}
