package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AppLanguage
import com.example.data.model.Deal
import com.example.data.repository.SampleData
import com.example.ui.components.KiezPhotoHelper
import com.example.ui.components.RealKiezImage
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinGreenLight
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinRedLight

@Composable
fun DealsScreen(
    language: AppLanguage,
    activeRedeemDeal: Deal?,
    onOpenRedeem: (Deal) -> Unit,
    onCloseRedeem: () -> Unit
) {
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Top intro
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            shape = RoundedCornerShape(14.dp),
            color = BerlinRedLight
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.LocalOffer,
                    contentDescription = null,
                    tint = BerlinRed,
                    modifier = Modifier.size(24.dp)
                )
                Column {
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Özel Kiez İndirimleri" else "Exklusive Kiez-Vorteile",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = BerlinRed
                    )
                    Text(
                        text = if (language == AppLanguage.TURKISH) "Mahallendeki işletmelerde geçerli fırsatlar" else "Direkt vor Ort einlösen und Kiez-Betriebe unterstützen",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // 2-column grid of deals
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 80.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(SampleData.deals) { deal ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenRedeem(deal) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column {
                        // Real photo banner with discount badge
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(105.dp)
                        ) {
                            RealKiezImage(
                                drawableId = KiezPhotoHelper.getFoodDrawable(deal.businessName),
                                contentDescription = deal.title,
                                showBottomGradient = true,
                                modifier = Modifier.fillMaxSize()
                            )
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = BerlinRed,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(8.dp)
                            ) {
                                Text(
                                    text = deal.discountBadge,
                                    color = Color.White,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 14.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = deal.businessName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                maxLines = 1
                            )
                            Text(
                                text = deal.title,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 2,
                                lineHeight = 16.sp
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = deal.validUntil,
                                fontSize = 10.sp,
                                color = Color.Gray
                            )
                        }
                    }
                }
            }
        }

        // Redeem Voucher Dialog
        if (activeRedeemDeal != null) {
            Dialog(onDismissRequest = onCloseRedeem) {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(8.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (language == AppLanguage.TURKISH) "Kuponu Kullan" else "Deal einlösen",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            IconButton(onClick = onCloseRedeem) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = BerlinRedLight,
                            modifier = Modifier.padding(8.dp)
                        ) {
                            Text(
                                text = activeRedeemDeal.discountBadge,
                                color = BerlinRed,
                                fontWeight = FontWeight.Black,
                                fontSize = 28.sp,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                        }

                        Text(
                            text = activeRedeemDeal.businessName,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = activeRedeemDeal.title,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Icon(
                            imageVector = Icons.Default.QrCode,
                            contentDescription = "QR Code",
                            tint = Color.Black,
                            modifier = Modifier.size(100.dp)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.clickable {
                                Toast.makeText(context, "Code ${activeRedeemDeal.code} kopiert!", Toast.LENGTH_SHORT).show()
                            }
                        ) {
                            Text(
                                text = "CODE: ${activeRedeemDeal.code}",
                                fontWeight = FontWeight.Black,
                                fontSize = 15.sp,
                                letterSpacing = 2.sp,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = {
                                    val waIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/4915126509586?text=Hallo,%20ich%20möchte%20den%20Gutschein%20${activeRedeemDeal.code}%20von%20${activeRedeemDeal.businessName}%20einlösen."))
                                    context.startActivity(waIntent)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = BerlinGreen)
                            ) {
                                Text("WhatsApp", fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = onCloseRedeem,
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = if (language == AppLanguage.TURKISH) "Kasada Göster" else "Vorzeigen",
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
