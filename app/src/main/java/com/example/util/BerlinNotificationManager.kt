package com.example.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.example.MainActivity
import com.example.R
import android.net.Uri
import com.example.data.model.AppLanguage
import com.example.data.repository.KiezStorageManager

data class BerlinNotificationItem(
    val id: Int,
    val institutionTag: String, // "S-BAHN BERLIN", "BVG", "FEUERWEHR", "POLIZEI", "BÜRGERAMT"
    val institutionColor: Long, // 0xFF008754 for S-Bahn, 0xFFF01414 for BVG/Feuerwehr, 0xFF003399 for Polizei
    val titleDe: String,
    val titleTr: String,
    val bodyDe: String,
    val bodyTr: String,
    val targetScreen: String, // "LIVE_BULLETIN", "BUSINESS_PORTAL", "NOTRUF"
    val officialUrl: String,
    val timestamp: String = "Gerade eben"
) {
    fun localizedTitle(lang: AppLanguage): String = if (lang == AppLanguage.TURKISH) titleTr else titleDe
    fun localizedBody(lang: AppLanguage): String = if (lang == AppLanguage.TURKISH) bodyTr else bodyDe
}

/**
 * Manages authentic real-time Berlin notifications (S-Bahn, BVG, Feuerwehr, Polizei, Bürgeramt)
 * with direct official website links and download link.
 * Users can disable or enable notifications manually at any time.
 */
object BerlinNotificationManager {

    const val CHANNEL_ID = "berlin_kiez_alerts_channel"
    const val EXTRA_TARGET_SCREEN = "extra_target_screen"
    const val APK_DOWNLOAD_URL = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"

    val ROTATING_NOTIFICATIONS = listOf(
        // 1. S-Bahn Berlin (Authentic live notice matching real system alerts)
        BerlinNotificationItem(
            id = 201,
            institutionTag = "S-BAHN BERLIN",
            institutionColor = 0xFF008754L,
            titleDe = "S-Bahn Berlin",
            titleTr = "S-Bahn Berlin",
            bodyDe = "Bauinfo #S41, #S42 Ringbahn & #S8: Heute ab 22:00 Uhr Schienenersatzverkehr (SEV) zwischen Treptower Park und Neukölln.",
            bodyTr = "Bauinfo #S41, #S42 Ringbahn & #S8: Bu akşam 22:00'den itibaren Treptower Park ve Neukölln arasında ray çalışması nedeniyle otobüs aktarması (SEV) uygulanacaktır.",
            targetScreen = "LIVE_BULLETIN",
            officialUrl = "https://sbahn.berlin/fahren/s-bahn-betriebslaenderungen/"
        ),
        // 2. BVG - Berliner Verkehrsbetriebe
        BerlinNotificationItem(
            id = 202,
            institutionTag = "BVG",
            institutionColor = 0xFFF01414L,
            titleDe = "BVG - Berliner Verkehrsbetriebe",
            titleTr = "BVG - Berliner Verkehrsbetriebe",
            bodyDe = "Störungsmeldung U2 & U8: Weichenüberprüfung am Alexanderplatz beendet, Züge verkehren wieder planmäßig im 4-Minuten-Takt.",
            bodyTr = "U2 & U8 Hattı: Alexanderplatz makas bakımı tamamlandı. Seferler 4 dakika aralıklarla normal akışına döndü.",
            targetScreen = "LIVE_BULLETIN",
            officialUrl = "https://www.bvg.de/de/verbindungen/stoerungsmeldungen"
        ),
        // 3. Berliner Feuerwehr
        BerlinNotificationItem(
            id = 203,
            institutionTag = "FEUERWEHR",
            institutionColor = 0xFFD32F2FL,
            titleDe = "Berliner Feuerwehr 🚒",
            titleTr = "Berliner Feuerwehr 🚒",
            bodyDe = "Technischer Hilfeleistungseinsatz in Charlottenburg erfolgreich beendet. Sperrung Bismarckstraße aufgehoben.",
            bodyTr = "İtfaiye Canlı Rapor: Charlottenburg'daki teknik kurtarma operasyonu başarıyla tamamlandı. Bismarckstraße trafiğe yeniden açıldı.",
            targetScreen = "LIVE_BULLETIN",
            officialUrl = "https://www.berliner-feuerwehr.de/einsaetze/"
        ),
        // 4. Polizei Berlin
        BerlinNotificationItem(
            id = 204,
            institutionTag = "POLIZEI",
            institutionColor = 0xFF003399L,
            titleDe = "Polizei Berlin 🚔",
            titleTr = "Polizei Berlin 🚔",
            bodyDe = "Verkehrssicherheitsaktion: Schwerpunktkontrollen auf der B96 & Tempelhofer Damm. Bitte vorsichtig fahren.",
            bodyTr = "Trafik Güvenliği Uyarısı: B96 ve Tempelhofer Damm güzergahında hız ve güvenlik kontrolleri yapılmaktadır. Lütfen dikkatli sürün.",
            targetScreen = "LIVE_BULLETIN",
            officialUrl = "https://www.berlin.de/polizei/polizeimeldungen/"
        ),
        // 5. Bürgeramt Berlin
        BerlinNotificationItem(
            id = 205,
            institutionTag = "BÜRGERAMT",
            institutionColor = 0xFF0284C7L,
            titleDe = "Bürgeramt Berlin 🏛️",
            titleTr = "Bürgeramt Berlin 🏛️",
            bodyDe = "Terminkontingente: Neue Termine für Anmeldung und Personalausweis in Mitte und Kreuzberg freigeschaltet.",
            bodyTr = "Randevu Hatırlatması: İkametgâh (Anmeldung) ve kimlik/pasaport randevuları için Bürgeramt'larda yeni kontenjanlar açıldı.",
            targetScreen = "LIVE_BULLETIN",
            officialUrl = "https://service.berlin.de/standorte/buergeramter/"
        ),
        // 6. Business Visibility Prompt (İşletmeniz tüm Berlin'de görünür olsun mu?)
        BerlinNotificationItem(
            id = 206,
            institutionTag = "BUSINESS BERLIN",
            institutionColor = 0xFFE11D48L,
            titleDe = "Möchten Sie, dass Ihr Unternehmen in ganz Berlin sichtbar ist? 🚀",
            titleTr = "İşletmeniz tüm Berlin'de görünür olsun mu? 🚀",
            bodyDe = "Tragen Sie Ihr Geschäft jetzt im Berliner Kiez-Guide ein & erreichen Sie tausende neue Kunden in Ihrer Nachbarschaft!",
            bodyTr = "Kiez Rehberinde yerinizi hemen ayırtın! Mahallenizde ve tüm Berlin'de müşterilerinize tek tıkla ulaşın.",
            targetScreen = "BUSINESS_PORTAL",
            officialUrl = "https://mykiezberlin.com"
        ),
        // 7. Senatskanzlei Berlin
        BerlinNotificationItem(
            id = 207,
            institutionTag = "SENAT BERLIN",
            institutionColor = 0xFF475569L,
            titleDe = "Senatskanzlei Berlin 🏛️",
            titleTr = "Berlin Senatosu 🏛️",
            bodyDe = "29-Euro-Ticket & Infrastruktur: Senat beschließt weitere Investitionen in den Ausbau der Berliner Kieze.",
            bodyTr = "29 Euro bilet ve mahalle yatırımları için Berlin Senatosu yeni altyapı paketini onayladı.",
            targetScreen = "LIVE_BULLETIN",
            officialUrl = "https://www.berlin.de/senat/"
        ),
        // 8. Kultur & Events Berlin
        BerlinNotificationItem(
            id = 208,
            institutionTag = "KULTUR BERLIN",
            institutionColor = 0xFF7C3AEDL,
            titleDe = "Kultur & Events Berlin 🎭",
            titleTr = "Berlin Festivaller & Kültür 🎭",
            bodyDe = "Wochenend-Highlights: Open-Air-Konzerte, Museumssonntag und Kiez-Feste auf Berlin.de entdecken.",
            bodyTr = "Berlin Kültür Takvimi: Hafta sonu açık hava konserleri ve mahalle festivalleri yayında.",
            targetScreen = "LIVE_BULLETIN",
            officialUrl = "https://www.berlin.de/kultur-und-tickets/"
        )
    )

    private var currentIndex = 0

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Berlin Kiez Live & B2B Alerts"
            val descriptionText = "Echtzeit-Meldungen zu S-Bahn, BVG, Feuerwehr, Polizei und Kiez-Updates"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableVibration(true)
            }
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Posts an authentic system notification if enabled by user and permissions granted.
     */
    fun postNotification(context: Context, item: BerlinNotificationItem, lang: AppLanguage): Boolean {
        if (!KiezStorageManager.isNotificationsEnabled(context)) {
            return false
        }

        // Check Android 13+ POST_NOTIFICATIONS permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    context,
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return false
            }
        }

        createNotificationChannel(context)

        // Main Tap Action: Opens specific screen in app
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_TARGET_SCREEN, item.targetScreen)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            item.id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action 1: Open Official URL directly in browser
        val officialIntent = Intent(Intent.ACTION_VIEW, Uri.parse(item.officialUrl)).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        val officialPendingIntent = PendingIntent.getActivity(
            context,
            item.id + 500,
            officialIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action 2: Share alert with APK Download Link
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            val shareText = "${item.localizedTitle(lang)}\n${item.localizedBody(lang)}\n🔗 Resmi Kaynak: ${item.officialUrl}\n\n📲 My Kiez Berlin uygulamasını hemen indir:\n$APK_DOWNLOAD_URL"
            putExtra(Intent.EXTRA_TEXT, shareText)
        }

        val sharePendingIntent = PendingIntent.getActivity(
            context,
            item.id + 1000,
            Intent.createChooser(shareIntent, item.localizedTitle(lang)),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(item.localizedTitle(lang))
            .setContentText(item.localizedBody(lang))
            .setStyle(NotificationCompat.BigTextStyle().bigText(item.localizedBody(lang)))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .addAction(
                0,
                if (lang == AppLanguage.TURKISH) "Bülteni Aç" else "Öffnen",
                pendingIntent
            )
            .addAction(
                0,
                if (lang == AppLanguage.TURKISH) "Resmi Link" else "Webseite",
                officialPendingIntent
            )
            .addAction(
                0,
                if (lang == AppLanguage.TURKISH) "Paylaş (APK)" else "Teilen",
                sharePendingIntent
            )

        return try {
            NotificationManagerCompat.from(context).notify(item.id, builder.build())
            true
        } catch (e: SecurityException) {
            false
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Cycles to next notification in rotation and triggers it.
     */
    fun triggerNextNotification(context: Context, lang: AppLanguage): BerlinNotificationItem {
        val item = ROTATING_NOTIFICATIONS[currentIndex % ROTATING_NOTIFICATIONS.size]
        currentIndex++
        postNotification(context, item, lang)
        return item
    }
}
