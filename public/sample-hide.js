/* 2026-11-14 (owner): sample businesses / deals that look invented (generic names, fake numbers) are not shown.
 * Same list as SampleData.HIDDEN_SAMPLE_IDS in the app. The data stays in data-extended.js. */
(function () {
  var HIDDEN = ["kiez_friseur", "brotzeit", "kiez_fitness", "kiez_apotheke", "rechtbox", "wedding_doener", "silberfisch_fshain", "simondach_barber", "kant_konditorei", "winterfeldt_markt", "tempelhof_sport", "deal_kiez_fitness", "deal_kiez_friseur_active", "schloss_apotheke"];
  function clean(list) {
    if (!list || !list.splice) return;
    for (var i = list.length - 1; i >= 0; i--) if (HIDDEN.indexOf(list[i].id) >= 0) list.splice(i, 1);
  }
  if (typeof BUSINESSES === "object") clean(BUSINESSES);
  if (typeof DEALS === "object") clean(DEALS);
})();
