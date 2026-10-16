const entryUrl = new URL(import.meta.url);
const build = entryUrl.searchParams.get('build');

const styleUrl = new URL('./ai-monitoring.css', import.meta.url);
if (build) styleUrl.searchParams.set('build', build);
if (!document.querySelector('link[data-ai-monitoring-style]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = styleUrl.href;
  link.dataset.aiMonitoringStyle = 'true';
  document.head.append(link);
}

const moduleUrl = new URL('./ai-monitoring.js', import.meta.url);
if (build) moduleUrl.searchParams.set('build', build);
await import(moduleUrl.href);
