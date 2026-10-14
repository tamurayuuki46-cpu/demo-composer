export const PRIVATE_SHEET_URL = "https://songwriting-full-workbook-31.yoshitamura.chatgpt.site/sheet-app/versions/v0.5/composition_sheet_v0.5.html";
export function queueDemoHandoff(songProject, storage = localStorage) {
  storage.setItem('music-project-songproject-handoff-v1', JSON.stringify({
    kind: 'music-project-songproject-handoff', schemaVersion: 1, sourceApp: 'project-home',
    targetApp: 'demo-composer', createdAt: new Date().toISOString(), songProject,
  }));
}
