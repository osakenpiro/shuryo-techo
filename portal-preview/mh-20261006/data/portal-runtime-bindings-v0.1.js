(() => {
  const model = window.MH_PORTAL_MODEL_V01;
  if (!model) return;

  // Presentation relation intentionally distinct from hunter practice state.
  model.presentation = model.presentation || {};
  model.presentation.currentWorkbench = {
    notebookArtifactWeaponIds: ["switch-axe", "bow", "great-sword"],
    note: "Presentation/destination artifacts; not equivalent to hunterState.currentLoadout.practiceWeaponIds."
  };

  document.documentElement.dataset.semanticModel = model.schemaVersion || "unknown";

  const currentTitle = model.titles?.[model.hunterState?.currentTitleId];
  const weapon = model.weaponCatalog?.[model.hunterState?.currentLoadout?.mainWeaponId];

  const activeHunter = document.querySelector(".active-hunter");
  if (activeHunter && currentTitle) activeHunter.textContent = "CURRENT: " + currentTitle.short;

  const weaponStatus = document.getElementById("weaponStatus");
  if (weaponStatus && weapon) weaponStatus.textContent = "CURRENT WEAPON — " + weapon.jp;

  const rows = [...document.querySelectorAll(".log-row")];
  const metrics = model.hunterState?.knownMetrics || {};
  for (const row of rows) {
    const label = row.querySelector("span")?.textContent?.trim();
    const strong = row.querySelector("strong");
    if (!strong) continue;
    if (label === "HR") {
      const m = metrics.hunterRank;
      strong.textContent = m?.state === "NOT_RECORDED" ? "— 未記録" : String(m?.value ?? "—");
    }
    if (label === "総狩猟数") {
      const m = metrics.totalHunts;
      strong.textContent = m?.state === "NOT_RECORDED" ? "— 未記録" : String(m?.value ?? "—");
    }
  }
})();
