// -----------------------------------------------------------------------------
// build.mjs — recupere le classement, ecrit dist/index.html.
// En cas d'erreur reseau/API, on sort en erreur : le job Pages "deploy" (qui
// depend de "build") est alors saute, et la derniere page valide reste en ligne.
// -----------------------------------------------------------------------------
import { mkdir, writeFile } from "node:fs/promises";
import { getStandings } from "./fetch-standings.mjs";
import { renderHtml } from "./render.mjs";

const OUT_DIR = "dist";

async function main() {
  const data = await getStandings();
  const html = renderHtml(data);
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(`${OUT_DIR}/index.html`, html, "utf8");
  await writeFile(`${OUT_DIR}/.nojekyll`, "", "utf8"); // sert le dossier tel quel sur Pages
  console.log(
    `OK — ${data.entries.length} joueurs, ${data.mock ? "MOCK" : "live"}, ecrit dans ${OUT_DIR}/index.html`
  );
}

main().catch((err) => {
  console.error("ECHEC build :", err.message);
  process.exit(1);
});
