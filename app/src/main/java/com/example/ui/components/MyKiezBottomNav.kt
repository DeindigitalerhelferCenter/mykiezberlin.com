package com.example.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
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
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
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

        // 2. Gutscheine (Deals & Coupons)
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
                    fontSize = 10.5.sp,
                    fontWeight = if (isDealsActive) FontWeight.Bold else FontWeight.Normal
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = BerlinRed,
                selectedTextColor = BerlinRed,
                indicatorColor = MaterialTheme.colorScheme.primaryContainer
            )
        )

        // 3. Jobs (Kiez Jobs)
        val isJobsActive = currentScreen == AppScreen.JOBS
        NavigationBarItem(
            selected = isJobsActive,
            onClick = { onNavigate(AppScreen.JOBS) },
            icon = {
                Icon(
                    imageVector = Icons.Default.Work,
                    contentDescription = "Jobs",
                    modifier = Modifier.size(22.dp)
                )
            },
            label = {
                Text(
                    text = "Jobs",
                    fontSize = 10.5.sp,
                    fontWeight = if (isJobsActive) FontWeight.Bold else FontWeight.Normal
                )
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = BerlinRed,
                selectedTextColor = BerlinRed,
                indicatorColor = MaterialTheme.colorScheme.primaryContainer
            )
        )

        // 4. Quiz (Kiez Quiz)
        val isQuizActive = currentScreen == AppScreen.QUIZ
        NavigationBarItem(
            selected = isQuizActive,
            onClick = { onNavigate(AppScreen.QUIZ) },
            icon = {
                Icon(
                    imageVector = Icons.Default.EmojiEvents,
                    contentDescription = "Quiz",
                    modifier = Modifier.size(22.dp)
                )
            },
            label = {
                Text(
                    text = "Quiz",
                    fontSize = 10.5.sp,
                    fontWeight = if (isQuizActive) FontWeight.Bold else FontWeight.Normal
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
