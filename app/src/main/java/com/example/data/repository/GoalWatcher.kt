package com.example.data.repository

import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException

data class GoalEvent(
    val team: String,
    val scorer: String,
    val minute: Int,
    val score: String,
    val home: String,
    val away: String
)

/** Emits new Berlin goals. Goals from before the app came to the front are not replayed. */
object GoalWatcher {
    private const val GOALS_URL = "https://mykiezberlin.com/api/goals"
    private const val LIVE_POLL_MS = 60_000L
    private const val IDLE_POLL_MS = 300_000L

    private val client = OkHttpClient()

    private class Poll(val live: Boolean, val goals: List<Pair<String, GoalEvent>>)

    private fun fetch(): Poll {
        val request = Request.Builder().url(GOALS_URL).build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("HTTP ${response.code}")
            val matches = JSONObject(response.body?.string().orEmpty()).optJSONArray("matches")
            var live = false
            val goals = mutableListOf<Pair<String, GoalEvent>>()
            for (i in 0 until (matches?.length() ?: 0)) {
                val match = matches!!.getJSONObject(i)
                val matchLive = match.optBoolean("live")
                live = live || matchLive
                val list = match.optJSONArray("goals") ?: continue
                for (j in 0 until list.length()) {
                    val goal = list.getJSONObject(j)
                    val id = goal.optString("id")
                    val event = GoalEvent(
                        team = goal.optString("team"),
                        scorer = goal.optString("scorer"),
                        minute = goal.optInt("minute"),
                        score = goal.optString("score"),
                        home = match.optString("home"),
                        away = match.optString("away")
                    )
                    // Non-celebrated goals still count as seen through the blank event marker.
                    goals.add(id to if (matchLive && goal.optBoolean("forBerlin")) event else event.copy(team = ""))
                }
            }
            return Poll(live, goals)
        }
    }

    fun events(): Flow<GoalEvent> = flow {
        if (BuildConfig.GOAL_DEMO) {
            delay(5_000)
            emit(GoalEvent("Hertha BSC", "Testspieler", 31, "1:0", "Hertha BSC", "VfL Wolfsburg"))
        }
        val seen = mutableSetOf<String>()
        var firstPoll = true
        while (true) {
            var live = false
            try {
                val poll = fetch()
                live = poll.live
                for ((id, event) in poll.goals) {
                    if (seen.add(id) && !firstPoll && event.team.isNotEmpty()) emit(event)
                }
                firstPoll = false
            } catch (e: IOException) {
                // The next poll retries.
            } catch (e: JSONException) {
                // The next poll retries.
            }
            delay(if (live) LIVE_POLL_MS else IDLE_POLL_MS)
        }
    }.flowOn(Dispatchers.IO)
}
