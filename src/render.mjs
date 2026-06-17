// render.mjs
// Genere une page signage autonome (HTML/CSS/JS inline) pour un ecran Yodeck.
// Vue unique : podium top 3 (haut) + Hall of Flame bottom 3 (bas). Pas de pagination.
// Charte MiddleWay : navy #020735, cyan #44BFDD, coral #FF3354, vert #8CC63F, typo Montserrat.
// Pensee pour du 1920x1080 paysage (fonctionne aussi en portrait).

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

  const dataJson = JSON.stringify({ entries });
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
    --navy:#020735;--navy-2:#0a1150;--cyan:#44BFDD;--coral:#FF3354;--green:#8CC63F;
    --ink:#eaf2ff;--muted:#8ea0d6;--line:rgba(68,191,221,.22);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{
    background:var(--navy);color:var(--ink);
    font-family:"Montserrat",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    font-feature-settings:"tnum" 1;overflow:hidden;-webkit-font-smoothing:antialiased;
  }
  .stage{height:100vh;width:100vw;display:flex;flex-direction:column;padding:3.2vh 3.6vw 2.4vh;position:relative}
  .motion{position:absolute;top:0;left:0;right:0;height:4px;
    background:linear-gradient(90deg,transparent,var(--cyan) 18%,var(--green) 50%,var(--coral) 82%,transparent);
    background-size:220% 100%;animation:slide 7s linear infinite;opacity:.9}
  @keyframes slide{to{background-position:-220% 0}}

  header{display:flex;align-items:flex-end;justify-content:space-between;gap:2vw;
    padding-bottom:1.6vh;border-bottom:1px solid var(--line)}
  .brand{display:flex;flex-direction:column;gap:.4vh}
  .eyebrow{font-size:1.5vh;letter-spacing:.42em;text-transform:uppercase;color:var(--cyan);font-weight:600}
  .league{font-size:5.4vh;font-weight:800;line-height:1;letter-spacing:-.01em}
  .league b{color:var(--cyan);font-weight:800}
  .meta{text-align:right;display:flex;flex-direction:column;gap:.6vh;align-items:flex-end}
  .live{display:flex;align-items:center;gap:.7vw;font-size:1.7vh;font-weight:600;color:var(--muted)}
  .dot{width:1.1vh;height:1.1vh;border-radius:50%;background:var(--green);
    box-shadow:0 0 0 0 rgba(140,198,63,.6);animation:pulse 2.2s ease-out infinite}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(140,198,63,.55)}70%{box-shadow:0 0 0 1.4vh rgba(140,198,63,0)}100%{box-shadow:0 0 0 0 rgba(140,198,63,0)}}
  .mock-tag{font-size:1.3vh;font-weight:700;letter-spacing:.2em;color:var(--coral);
    border:1px solid var(--coral);border-radius:2px;padding:.3vh .6vw}

  /* board : podium en haut, Hall of Flame en bas, centre verticalement */
  .board{flex:1;display:flex;flex-direction:column;justify-content:center;gap:4vh;padding:2.4vh 0;min-height:0}
  .sec-title{font-size:1.5vh;font-weight:700;letter-spacing:.35em;text-transform:uppercase;
    margin-bottom:2vh;display:flex;align-items:center;gap:.6vw}

  /* === PODIUM === */
  .podium{display:flex;align-items:flex-end;justify-content:center;gap:1.4vw;height:34vh}
  .slot{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex:1;max-width:30%;height:100%}
  .p-info{text-align:center;padding:0 .4vw 1vh;width:100%}
  .p-icon{font-size:4vh;display:block;margin-bottom:.6vh;line-height:1}
  .p-name{font-size:2.1vh;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}
  .p-score{font-size:2.3vh;font-weight:900;margin-top:.4vh}
  .p-block{width:100%;border-radius:.6vh .6vh 0 0;display:flex;align-items:center;justify-content:center}
  .p-num{font-size:6.4vh;font-weight:900;line-height:1}
  .ground{height:.6vh;border-radius:0 0 3px 3px;background:var(--navy-2);margin:0 auto;width:78%}
  .s1{order:2}.s2{order:1}.s3{order:3}
  .s1 .p-icon,.s1 .p-score{color:var(--coral)}
  .s1 .p-block{height:100%;background:#180610;border-top:2px solid var(--coral);border-left:2px solid var(--coral);border-right:2px solid var(--coral)}
  .s1 .p-num{color:var(--coral)}
  .s2 .p-icon,.s2 .p-score{color:var(--cyan)}
  .s2 .p-block{height:66%;background:#0b1565;border-top:1px solid var(--cyan);border-left:1px solid var(--cyan);border-right:1px solid var(--cyan)}
  .s2 .p-num{color:var(--cyan)}
  .s3 .p-icon,.s3 .p-score{color:var(--green)}
  .s3 .p-block{height:42%;background:#081812;border-top:1px solid var(--green);border-left:1px solid var(--green);border-right:1px solid var(--green)}
  .s3 .p-num{color:var(--green)}

  /* === HALL OF FLAME === */
  .flames{display:flex;flex-direction:column;gap:1.4vh}
  .fcard{border-radius:.9vh;padding:1.5vh 1.8vw;display:flex;align-items:center;gap:1.4vw;
    opacity:0;transform:translateX(20px);animation:enter-r .5s cubic-bezier(.2,.7,.2,1) forwards}
  @keyframes enter-r{to{opacity:1;transform:none}}
  .fcard.c1{background:var(--navy-2);border:1px solid rgba(255,51,84,.22);border-left:.35vw solid rgba(255,51,84,.55)}
  .fcard.c2{background:var(--navy-2);border:1px solid rgba(255,51,84,.4);border-left:.35vw solid rgba(255,51,84,.82)}
  .fcard.c3{background:#180610;border:1px solid var(--coral);border-left:.45vw solid var(--coral)}
  .f-ic{font-size:3.2vh;flex-shrink:0;line-height:1}
  .c1 .f-ic,.c2 .f-ic{color:rgba(255,51,84,.72)}.c3 .f-ic{color:var(--coral)}
  .f-body{flex:1;min-width:0}
  .f-name{font-size:2.2vh;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .f-rank{font-size:1.4vh;color:var(--muted);font-weight:500;margin-left:.5vw}
  .f-quote{font-size:1.6vh;font-style:italic;color:var(--muted);margin-top:.4vh;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .c3 .f-quote{color:var(--coral);font-style:normal;font-weight:700}
  .f-pts{flex-shrink:0;text-align:right}
  .f-val{font-size:2.4vh;font-weight:800;color:var(--coral)}
  .f-unit{font-size:1.2vh;color:var(--muted);font-weight:500}

  footer{display:flex;align-items:center;justify-content:space-between;
    padding-top:1.4vh;border-top:1px solid var(--line);font-size:1.6vh;color:var(--muted)}
  .sign{letter-spacing:.28em;text-transform:uppercase;font-weight:600;color:var(--cyan)}
  .count{font-weight:600}

  @media(prefers-reduced-motion:reduce){
    .motion,.dot{animation:none}
    .fcard{animation:none;opacity:1;transform:none}
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
    <span class="count" id="count"></span>
  </footer>
</div>
<script id="data" type="application/json">${dataJson}</script>
<script>
(function(){
  var cfg=JSON.parse(document.getElementById("data").textContent);
  var all=cfg.entries||[];
  var board=document.getElementById("board");
  var countEl=document.getElementById("count");

  var ROAST=[
    {q:"Encore un effort, champion !",ic:"&#128123;"},
    {q:"Maillot jaune… mais inversé",ic:"&#128200;"},
    {q:"Spécialiste du hasard",ic:"&#128293;"}
  ];

  function escH(s){return String(s).replace(/[&<>"]/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c];});}
  function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,"&nbsp;");}

  var top3=all.slice(0,3);
  var bottom3=all.length>=6?all.slice(-3):[];

  var podOrder=[
    {e:top3[0],sc:"s1",ic:"&#129351;"},
    {e:top3[1],sc:"s2",ic:"&#129352;"},
    {e:top3[2],sc:"s3",ic:"&#129353;"}
  ].filter(function(o){return !!o.e;});

  var podHtml=podOrder.map(function(o){
    return '<div class="slot '+o.sc+'">'
      +'<div class="p-info">'
      +'<span class="p-icon">'+o.ic+'</span>'
      +'<div class="p-name">'+escH(o.e.name)+'</div>'
      +'<div class="p-score">'+fmt(o.e.points)+'&nbsp;pts</div>'
      +'</div>'
      +'<div class="p-block"><span class="p-num">'+o.e.rank+'</span></div>'
      +'</div>';
  }).join("");

  var flameHtml=bottom3.map(function(e,i){
    var r=ROAST[i]||ROAST[ROAST.length-1];
    return '<div class="fcard c'+(i+1)+'" style="animation-delay:'+(i*0.12).toFixed(2)+'s">'
      +'<span class="f-ic">'+r.ic+'</span>'
      +'<div class="f-body">'
      +'<div class="f-name">'+escH(e.name)+'<span class="f-rank">'+e.rank+'e</span></div>'
      +'<div class="f-quote">'+escH(r.q)+'</div>'
      +'</div>'
      +'<div class="f-pts"><div class="f-val">'+fmt(e.points)+'</div><div class="f-unit">pts</div></div>'
      +'</div>';
  }).join("");

  board.innerHTML=
    '<section>'
    +'<div class="sec-title" style="color:var(--cyan)">&#129351; Podium</div>'
    +'<div class="podium">'+podHtml+'</div>'
    +'<div class="ground"></div>'
    +'</section>'
    +(bottom3.length
      ?'<section>'
        +'<div class="sec-title" style="color:var(--coral)">&#128293; Hall of Flame</div>'
        +'<div class="flames">'+flameHtml+'</div>'
        +'</section>'
      :"");

  countEl.textContent=all.length?all.length+" participants":"";
})();
</script>
</body>
</html>`;
}
