package com.example.ui.screens

import android.net.Uri
import android.view.ViewGroup
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

// Shows a page of the website, so the website and the app always stay identical.
@Composable
fun KiezWebScreen(url: String, onBack: () -> Unit, adminToken: String = "") {
    var webView by remember { mutableStateOf<WebView?>(null) }
    var pendingUpload by remember { mutableStateOf<ValueCallback<Array<Uri>>?>(null) }

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        pendingUpload?.onReceiveValue(uri?.let { arrayOf(it) })
        pendingUpload = null
    }
    // 2026-11-17: the web admin also uploads videos and several files at once (story planner, sponsor media)
    val multiPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        pendingUpload?.onReceiveValue(if (uris.isEmpty()) null else uris.toTypedArray())
        pendingUpload = null
    }

    BackHandler {
        val view = webView
        if (view != null && view.canGoBack()) view.goBack() else onBack()
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                // Without a fixed size the page sees no viewport height and its dialogs collapse.
                layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webViewClient = object : WebViewClient() {
                    // 2026-11-17 (owner): web admin in the app – the app's admin session is written into the page
                    // (same keys as admin-auth-ui.js) and the page loads once more, so no second login is needed.
                    override fun onPageFinished(view: WebView, pageUrl: String?) {
                        super.onPageFinished(view, pageUrl)
                        if (adminToken.isBlank() || pageUrl?.contains("mykiezberlin.com/admin") != true) return
                        val t = org.json.JSONObject.quote(adminToken)
                        view.evaluateJavascript(
                            "(function(){try{var t=$t;if(localStorage.getItem('mykiez_admin_session_v1')===t&&sessionStorage.getItem('mykiez_admin_token_v1')===t)return;" +
                                "sessionStorage.setItem('mykiez_admin_token_v1',t);localStorage.setItem('mykiez_admin_session_v1',t);localStorage.setItem('mykiez_admin_auth_v1','true');location.reload();}catch(e){}})()",
                            null
                        )
                    }
                    // Card payment (Stripe), phone, mail and WhatsApp open outside the in-app page.
                    override fun shouldOverrideUrlLoading(view: WebView, request: android.webkit.WebResourceRequest): Boolean {
                        val target = request.url
                        val scheme = target.scheme.orEmpty()
                        val host = target.host.orEmpty()
                        val external = scheme in listOf("tel", "mailto", "whatsapp", "intent") ||
                            host.endsWith("stripe.com") || host == "wa.me" || host.endsWith("instagram.com")
                        if (!external) return false
                        return try {
                            view.context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, target))
                            true
                        } catch (_: Exception) {
                            false
                        }
                    }
                }
                webChromeClient = object : WebChromeClient() {
                    override fun onShowFileChooser(
                        view: WebView,
                        callback: ValueCallback<Array<Uri>>,
                        params: FileChooserParams
                    ): Boolean {
                        pendingUpload?.onReceiveValue(null)
                        pendingUpload = callback
                        val accept = params.acceptTypes.joinToString(",").lowercase()
                        val type = when {
                            accept.contains("video") && accept.contains("image") -> "*/*"
                            accept.contains("video") -> "video/*"
                            else -> "image/*"
                        }
                        if (params.mode == FileChooserParams.MODE_OPEN_MULTIPLE) multiPicker.launch(type) else imagePicker.launch(type)
                        return true
                    }
                }
                loadUrl(url)
                webView = this
            }
        }
    )
}
