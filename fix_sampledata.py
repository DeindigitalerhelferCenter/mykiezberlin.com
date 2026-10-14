import re

with open("app/src/main/java/com/example/data/repository/SampleData.kt", "r", encoding="utf-8") as f:
    content = f.read()

helper = """    private fun formatKiezTimeAgo(hours: Int, lang: AppLanguage): String {
        return when (lang) {
            AppLanguage.TURKISH -> "$hours sa. önce"
            AppLanguage.ENGLISH -> "${hours}h ago"
            else -> "vor $hours Std."
        }
    }

    // Kiez-Reporter Community Posts"""

content = content.replace("    // Kiez-Reporter Community Posts", helper, 1)

content = re.sub(
    r'timeAgo = when \(lang\) \{ AppLanguage\.TURKISH -> "(\d+) sa\. önce" AppLanguage\.ENGLISH -> "\d+h ago" else -> "vor \d+ Std\." \},',
    r'timeAgo = formatKiezTimeAgo(\1, lang),',
    content
)

with open("app/src/main/java/com/example/data/repository/SampleData.kt", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
