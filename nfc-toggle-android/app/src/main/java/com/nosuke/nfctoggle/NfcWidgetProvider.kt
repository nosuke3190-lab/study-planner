package com.nosuke.nfctoggle

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/** ホーム画面ウィジェット。タップで NFC を切り替え、現在の ON/OFF を表示する。 */
class NfcWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        val views = buildViews(context)
        ids.forEach { manager.updateAppWidget(it, views) }
    }

    companion object {
        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, NfcWidgetProvider::class.java))
            if (ids.isEmpty()) return
            val views = buildViews(context)
            ids.forEach { manager.updateAppWidget(it, views) }
        }

        private fun buildViews(context: Context): RemoteViews {
            val state = NfcController.state(context)
            val views = RemoteViews(context.packageName, R.layout.widget_nfc)

            val (bg, label) = when (state) {
                NfcState.ON -> R.drawable.widget_bg_on to R.string.state_on
                NfcState.OFF -> R.drawable.widget_bg_off to R.string.state_off
                NfcState.UNSUPPORTED -> R.drawable.widget_bg_off to R.string.state_unsupported
            }
            views.setImageViewResource(R.id.widget_bg, bg)
            views.setImageViewResource(
                R.id.widget_icon,
                if (state == NfcState.ON) R.drawable.ic_nfc else R.drawable.ic_nfc_off,
            )
            views.setTextViewText(R.id.widget_label, context.getString(label))
            val textColor = context.getColor(
                if (state == NfcState.ON) R.color.on_text else R.color.off_text
            )
            views.setTextColor(R.id.widget_label, textColor)
            views.setInt(R.id.widget_icon, "setColorFilter", textColor)

            val intent = Intent(context, ToggleActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION)
            val pending = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_root, pending)
            return views
        }
    }
}
