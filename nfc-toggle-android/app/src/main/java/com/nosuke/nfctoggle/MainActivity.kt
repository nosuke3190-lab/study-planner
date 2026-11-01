package com.nosuke.nfctoggle

import android.app.Activity
import android.app.StatusBarManager
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.drawable.Icon
import android.nfc.NfcAdapter
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {

    private lateinit var statusIcon: ImageView
    private lateinit var statusText: TextView
    private lateinit var toggleButton: Button
    private lateinit var rootSwitch: Switch
    private val main = Handler(Looper.getMainLooper())

    private val nfcReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            render()
            NfcWidgetProvider.updateAll(context)
            NfcTileService.requestRefresh(context)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusIcon = findViewById(R.id.status_icon)
        statusText = findViewById(R.id.status_text)
        toggleButton = findViewById(R.id.toggle_button)
        rootSwitch = findViewById(R.id.root_switch)

        toggleButton.setOnClickListener {
            startActivity(Intent(this, ToggleActivity::class.java))
        }

        rootSwitch.isChecked = NfcController.isRootMode(this)
        rootSwitch.setOnCheckedChangeListener { _, checked ->
            if (!checked) {
                NfcController.setRootMode(this, false)
                return@setOnCheckedChangeListener
            }
            rootSwitch.isEnabled = false
            Thread {
                val ok = NfcController.checkRoot()
                main.post {
                    rootSwitch.isEnabled = true
                    NfcController.setRootMode(this, ok)
                    rootSwitch.isChecked = ok
                    Toast.makeText(
                        this,
                        if (ok) R.string.root_enabled else R.string.root_unavailable,
                        Toast.LENGTH_LONG,
                    ).show()
                }
            }.start()
        }

        findViewById<Button>(R.id.add_widget_button).setOnClickListener { requestPinWidget() }

        val addTile = findViewById<Button>(R.id.add_tile_button)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            addTile.setOnClickListener { requestAddTile() }
        } else {
            addTile.visibility = View.GONE
        }
    }

    override fun onResume() {
        super.onResume()
        val filter = IntentFilter(NfcAdapter.ACTION_ADAPTER_STATE_CHANGED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(nfcReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(nfcReceiver, filter)
        }
        render()
        NfcWidgetProvider.updateAll(this)
    }

    override fun onPause() {
        super.onPause()
        unregisterReceiver(nfcReceiver)
    }

    private fun render() {
        val state = NfcController.state(this)
        statusText.setText(
            when (state) {
                NfcState.ON -> R.string.state_on
                NfcState.OFF -> R.string.state_off
                NfcState.UNSUPPORTED -> R.string.state_unsupported
            }
        )
        statusIcon.setImageResource(if (state == NfcState.ON) R.drawable.ic_nfc else R.drawable.ic_nfc_off)
        statusIcon.setBackgroundResource(
            if (state == NfcState.ON) R.drawable.widget_bg_on else R.drawable.widget_bg_off
        )
        statusIcon.setColorFilter(getColor(if (state == NfcState.ON) R.color.on_text else R.color.off_text))
        toggleButton.isEnabled = state != NfcState.UNSUPPORTED
        toggleButton.setText(if (state == NfcState.ON) R.string.button_turn_off else R.string.button_turn_on)
    }

    private fun requestPinWidget() {
        val manager = getSystemService(AppWidgetManager::class.java)
        if (manager != null && manager.isRequestPinAppWidgetSupported) {
            manager.requestPinAppWidget(ComponentName(this, NfcWidgetProvider::class.java), null, null)
        } else {
            Toast.makeText(this, R.string.widget_manual, Toast.LENGTH_LONG).show()
        }
    }

    private fun requestAddTile() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        val sbm = getSystemService(StatusBarManager::class.java) ?: return
        sbm.requestAddTileService(
            ComponentName(this, NfcTileService::class.java),
            getString(R.string.tile_label),
            Icon.createWithResource(this, R.drawable.ic_nfc),
            mainExecutor,
        ) { }
    }
}
