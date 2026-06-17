// -----------------------------------------------------------------------------
// render.mjs
// Genere une page signage autonome (HTML/CSS/JS inline) pour un ecran Yodeck.
// Charte MiddleWay : navy #020735, cyan #44BFDD, coral #FF3354, vert #8CC63F,
// typo Montserrat. Pensee pour du 1920x1080 paysage.
// -----------------------------------------------------------------------------

const ROWS_PER_PAGE = Number(process.env.MPP_ROWS_PER_PAGE || 12);
const PAGE_CYCLE_MS = Number(process.env.MPP_PAGE_CYCLE_MS || 12000);
// Filet de securite : rechargement complet par le navigateur (en plus du
// rafraichissement Yodeck). 0 = desactive.
const META_REFRESH_S = Number(process.env.MPP_META_REFRESH_S || 900);

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

export function renderHtml({ leagueName, updatedAt, entries, mock }) {
  const updatedLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(updatedAt));

  const dataJson = JSON.stringify({ entries, rowsPerPage: ROWS_PER_PAGE });
  const metaRefresh =
    META_REFRESH_S > 0 ? `<meta http-equiv="refresh" content="${META_REFRESH_S}">` : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${metaRefresh}
<title>${esc(leagueName)} — classement</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root{
    --navy:#020735; --navy-2:#0a1150; --cyan:#44BFDD; --coral:#FF3354; --green:#8CC63F;
    --ink:#eaf2ff; --muted:#8ea0d6; --line:rgba(68,191,221,.22);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{
    background:var(--navy);
    color:var(--ink);
    font-family:"Montserrat",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    font-feature-settings:"tnum" 1;
    overflow:hidden;
    -webkit-font-smoothing:antialiased;
  }
  .stage{
    height:100vh; width:100vw; display:flex; flex-direction:column;
    padding:3.2vh 3.6vw 2.4vh; position:relative;
  }
  /* signature "data in motion" : trait cyan anime en haut */
  .motion{position:absolute;top:0;left:0;right:0;height:4px;background:
    linear-gradient(90deg,transparent,var(--cyan) 18%,var(--green) 50%,var(--coral) 82%,transparent);
    background-size:220% 100%;animation:slide 7s linear infinite;opacity:.9}
  @keyframes slide{to{background-position:-220% 0}}

  header{display:flex;align-items:flex-end;justify-content:space-between;gap:2vw;
    padding-bottom:1.6vh;border-bottom:1px solid var(--line)}
  .brand{display:flex;flex-direction:column;gap:.4vh}
  .eyebrow{font-size:1.5vh;letter-spacing:.42em;text-transform:uppercase;
    color:var(--cyan);font-weight:600}
  .league{font-size:5.4vh;font-weight:800;line-height:1;letter-spacing:-.01em}
  .league b{color:var(--cyan);font-weight:800}
  .meta{text-align:right;display:flex;flex-direction:column;gap:.6vh;align-items:flex-end}
  .live{display:flex;align-items:center;gap:.7vw;font-size:1.7vh;font-weight:600;color:var(--muted)}
  .dot{width:1.1vh;height:1.1vh;border-radius:50%;background:var(--green);
    box-shadow:0 0 0 0 rgba(140,198,63,.6);animation:pulse 2.2s ease-out infinite}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(140,198,63,.55)}70%{box-shadow:0 0 0 1.4vh rgba(140,198,63,0)}100%{box-shadow:0 0 0 0 rgba(140,198,63,0)}}
  .mock-tag{font-size:1.3vh;font-weight:700;letter-spacing:.2em;color:var(--coral);
    border:1px solid var(--coral);border-radius:2px;padding:.3vh .6vw}

  .board{flex:1;display:flex;flex-direction:column;justify-content:center;gap:.9vh;padding:1.6vh 0}
  .row{display:grid;grid-template-columns:8vw 1fr auto;align-items:center;gap:1.6vw;
    background:var(--navy-2);border:1px solid transparent;border-radius:10px;
    padding:1.4vh 2vw;opacity:0;transform:translateY(14px);
    animation:rise .5s cubic-bezier(.2,.7,.2,1) forwards}
  @keyframes rise{to{opacity:1;transform:none}}
  .rank{font-size:3.4vh;font-weight:800;color:var(--muted);text-align:center}
  .name{font-size:3.4vh;font-weight:600;letter-spacing:-.005em;white-space:nowrap;
    overflow:hidden;text-overflow:ellipsis}
  .pts{font-size:3.6vh;font-weight:800;font-variant-numeric:tabular-nums;color:var(--cyan)}
  .pts small{font-size:1.6vh;font-weight:600;color:var(--muted);margin-left:.4vw}
  .trend{display:inline-block;width:1.4vw;text-align:center;font-size:2.2vh;margin-left:1vw}
  .up{color:var(--green)} .down{color:var(--coral)} .flat{color:var(--muted);opacity:.5}

  /* podium */
  .row.p1{border-color:var(--coral);background:linear-gradient(90deg,rgba(255,51,84,.16),var(--navy-2) 42%)}
  .row.p1 .rank,.row.p1 .name{color:#fff}
  .row.p1 .pts{color:var(--coral)}
  .row.p2{border-color:var(--cyan)} .row.p2 .pts{color:var(--cyan)}
  .row.p3{border-color:var(--green)} .row.p3 .pts{color:var(--green)}

  footer{display:flex;align-items:center;justify-content:space-between;
    padding-top:1.4vh;border-top:1px solid var(--line);font-size:1.6vh;color:var(--muted)}
  .pager{display:flex;gap:.7vw}
  .pager i{width:2.2vw;max-width:34px;height:.6vh;border-radius:3px;background:var(--line);transition:background .3s}
  .pager i.on{background:var(--cyan)}
  .sign{letter-spacing:.28em;text-transform:uppercase;font-weight:600;color:var(--cyan)}

  @media (prefers-reduced-motion:reduce){
    .motion,.dot{animation:none}
    .row{animation:none;opacity:1;transform:none}
  }
</style>
</head>
<body>
  <div class="stage">
    <div class="motion" aria-hidden="true"></div>
    <header>
      <div class="brand">
        <span class="eyebrow">MiddleWay · Data in Motion</span>
        <h1 class="league">${esc(leagueName)}</h1>
      </div>
      <div class="meta">
        ${mock ? '<span class="mock-tag">DONNEES DE DEMO</span>' : ""}
        <span class="live"><span class="dot" aria-hidden="true"></span>Maj ${esc(updatedLabel)}</span>
      </div>
    </header>

    <main class="board" id="board" aria-live="polite"></main>

    <footer>
      <span class="sign">Mon Petit Prono</span>
      <div class="pager" id="pager" aria-hidden="true"></div>
    </footer>
  </div>

<script id="data" type="application/json">${dataJson}</script>
<script>
(function(){
  var cfg = JSON.parse(document.getElementById("data").textContent);
  var all = cfg.entries || [];
  var per = cfg.rowsPerPage || 12;
  var pages = [];
  for (var i=0;i<all.length;i+=per) pages.push(all.slice(i,i+per));
  if (pages.length===0) pages=[[]];
  var board=document.getElementById("board"), pager=document.getElementById("pager");
  var idx=0;

  function trendGlyph(t){
    if(t>0) return '<span class="trend up" title="en hausse">&#9650;</span>';
    if(t<0) return '<span class="trend down" title="en baisse">&#9660;</span>';
    return '<span class="trend flat">&bull;</span>';
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c];});}

  function paint(){
    var rows=pages[idx];
    board.innerHTML = rows.map(function(e,n){
      var cls="row"+(e.rank===1?" p1":e.rank===2?" p2":e.rank===3?" p3":"");
      var delay=(n*0.05).toFixed(2);
      return '<div class="'+cls+'" style="animation-delay:'+delay+'s">'
        + '<div class="rank">'+e.rank+'</div>'
        + '<div class="name">'+esc(e.name)+trendGlyph(e.trend||0)+'</div>'
        + '<div class="pts">'+e.points+'<small>pts</small></div>'
        + '</div>';
    }).join("");
    pager.innerHTML = pages.length>1
      ? pages.map(function(_,p){return '<i class="'+(p===idx?"on":"")+'"></i>';}).join("")
      : "";
  }
  paint();
  if (pages.length>1){
    setInterval(function(){ idx=(idx+1)%pages.length; paint(); }, ${PAGE_CYCLE_MS});
  }
})();
</script>
</body>
</html>`;
}
