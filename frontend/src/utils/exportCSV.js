/**
 * Export an array of history items to a CSV file and trigger browser download.
 */
export function exportHistoryCSV(history) {
  const headers = ["Headline", "Verdict", "Confidence (%)", "Credibility (1-10)", "Source Reliability", "Date/Time"];
  const rows = history.map((h) => [
    `"${h.text.replace(/"/g, "'").slice(0, 120)}"`,
    h.result.verdict,
    h.result.confidence,
    h.result.credibility_score,
    h.result.source_reliability,
    `"${h.time}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `fake_news_history_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
