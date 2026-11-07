package com.example.ui.screens

import androidx.compose.runtime.Composable

private const val KIEZ_QUIZ_URL = "https://mykiezberlin.com/quiz/"

// Shows the same Kiez quiz as the website, so both always stay identical.
@Composable
fun KiezMatchQuizScreen(onBack: () -> Unit) {
    KiezWebScreen(url = KIEZ_QUIZ_URL, onBack = onBack)
}
