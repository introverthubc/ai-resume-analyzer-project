const latest = (r, v = r.currentVersionId) => r.analyses.findLast(a => a.versionId === v);
export function versionData(resumes) {
  const versions = resumes.flatMap(r => r.versions.map(v => ({ id: `${r._id}:${v._id}`, versionId: v._id, label: v.label, resumeId: r._id, resumeTitle: r.title, sourceType: v.sourceType, score: latest(r, v._id)?.atsScore ?? null, createdAt: v.createdAt }))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { versions, totals: { all: versions.length, uploads: versions.filter(v => v.sourceType === 'upload').length, rewrites: versions.filter(v => v.sourceType === 'rewrite').length } };
}
export function historyData(events) {
  return { events, totals: { all: events.length, ...Object.fromEntries(['upload', 'analyze', 'rewrite'].map(k => [k, events.filter(e => e.type === k).length])) } };
}
export function dashboardData(resumes, events) {
  const r = [...resumes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const a = r && latest(r);
  const versions = versionData(resumes);
  const scoreSeries = r ? r.versions.map(v => ({ label: v.label, score: latest(r, v._id)?.atsScore })).filter(s => s.score != null) : [];
  return {
    totals: { resumes: resumes.length, rewrites: versions.totals.rewrites, analyses: resumes.flatMap(r => r.analyses).length },
    latestResume: r ? { _id: r._id, title: r.title } : null, scoreSeries,
    versionStack: r ? r.versions.map(v => ({ id: v._id, label: v.label, title: v.sourceType === 'upload' ? 'Upload' : 'Rewrite pass', score: latest(r, v._id)?.atsScore ?? null })) : [],
    kpi: {
      atsScore: { value: a?.atsScore ?? null, delta: a && scoreSeries.length > 1 ? a.atsScore - scoreSeries[0].score : 0, spark: scoreSeries.map(s => ({ v: s.score })) },
      versions: { value: versions.totals.all, spark: [] },
      issuesIdentified: { value: a?.issues.length ?? null, spark: [] },
      keywordsMatched: { value: a?.keywordsPresent.length ?? null, total: a ? a.keywordsPresent.length + a.keywordsMissing.length : 0, spark: [] },
    }, activity: events.slice(0, 10),
  };
}
export function insightsData(resumes) {
  const analyses = resumes.flatMap(r => r.analyses.map(a => ({ ...a, resumeTitle: r.title }))).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const best = analyses.reduce((best, a) => !best || a.atsScore > best.atsScore ? a : best, null);
  const count = (items, key) => {
    const groups = new Map();
    for (const item of items) { const name = typeof item === 'string' ? item : item[key]; const existing = groups.get(name); groups.set(name, { ...(typeof item === 'object' ? item : {}), [key]: name, count: (existing?.count || 0) + 1 }); }
    return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  };
  return {
    empty: analyses.length === 0,
    averageScore: analyses.length ? Math.round(analyses.reduce((sum, a) => sum + a.atsScore, 0) / analyses.length) : 0,
    bestScore: best ? { value: best.atsScore, resumeId: best.resumeId, resumeTitle: best.resumeTitle } : null,
    totalAnalyses: analyses.length,
    scoreTrend: analyses.map(a => ({ score: a.atsScore, at: a.createdAt, resumeTitle: a.resumeTitle })),
    topIssues: count(analyses.flatMap(a => a.issues), 'title'),
    topMissingKeywords: count(analyses.flatMap(a => a.keywordsMissing), 'keyword'),
    topPresentKeywords: count(analyses.flatMap(a => a.keywordsPresent), 'keyword'),
    resumePerformance: resumes.map(r => ({ resumeId: r._id, title: r.title, latestScore: latest(r)?.atsScore ?? null, bestScore: r.analyses.length ? Math.max(...r.analyses.map(a => a.atsScore)) : null, improvement: latest(r) ? latest(r).atsScore - r.analyses[0].atsScore : 0, analysesCount: r.analyses.length })),
  };
}
