package com.example.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.theme.BerlinRed

@Composable
fun MyKiezLogoView(
    modifier: Modifier = Modifier,
    height: Int = 44,
    showText: Boolean = false,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = modifier
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // High-res Vector Logo featuring Berlin Bear and TV Tower
        Image(
            painter = painterResource(id = R.drawable.ic_mykiez_logo),
            contentDescription = "My Kiez Berlin Logo",
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .size(height.dp)
                .clip(RoundedCornerShape(8.dp))
        )

        if (showText) {
            Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "My ",
                    fontSize = 17.sp,
                    fontStyle = FontStyle.Italic,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Kiez",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = " ♥ ",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = BerlinRed
                )
                Text(
                    text = "Berlin",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Black,
                    color = BerlinRed
                )
            }
            Text(
                text = "mykiezberlin.com",
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                letterSpacing = 0.5.sp
            )
        }
    }
}
}
