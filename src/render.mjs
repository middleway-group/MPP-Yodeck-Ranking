// render.mjs
// Genere une page signage autonome (HTML/CSS/JS inline) pour un ecran Yodeck.
// Page 0 (speciale) : podium top 3 + Hall of Flame bottom 3.
// Pages suivantes   : classement complet pagine.
// Charte MiddleWay : navy #020735, cyan #44BFDD, coral #FF3354, vert #8CC63F, typo Montserrat.
// Pensee pour du 1920x1080 paysage.

const ROWS_PER_PAGE = Number(process.env.MPP_ROWS_PER_PAGE || 12);
const PAGE_CYCLE_MS = Number(process.env.MPP_PAGE_CYCLE_MS || 12000);
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

  /* board */
  .board{flex:1;display:flex;flex-direction:column;justify-content:center;gap:.9vh;padding:1.6vh 0}

  /* === VUE LISTE === */
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
  .up{color:var(--green)}.down{color:var(--coral)}.flat{color:var(--muted);opacity:.5}
  .row.p1{border-color:var(--coral);background:linear-gradient(90deg,rgba(255,51,84,.16),var(--navy-2) 42%)}
  .row.p1 .rank,.row.p1 .name{color:#fff}
  .row.p1 .pts{color:var(--coral)}
  .row.p2{border-color:var(--cyan)}.row.p2 .pts{color:var(--cyan)}
  .row.p3{border-color:var(--green)}.row.p3 .pts{color:var(--green)}

  /* === VUE SPECIALE : podium + Hall of Flame === */
  .sp-layout{flex:1;display:grid;grid-template-columns:3fr 2fr;gap:3vw}
  .sp-left,.sp-right{display:flex;flex-direction:column}
  .sp-title{font-size:1.4vh;font-weight:700;letter-spacing:.35em;text-transform:uppercase;
    margin-bottom:1.8vh;display:flex;align-items:center;gap:.5vw}
  /* podium */
  .sp-podium{flex:1;display:flex;align-items:flex-end;justify-content:center;gap:1vw}
  .sp-slot{display:flex;flex-direction:column;align-items:center;flex:1}
  .sp-info{text-align:center;padding-bottom:.8vh;width:100%;padding-left:.4vw;padding-right:.4vw}
  .sp-icon{font-size:3.8vh;display:block;margin-bottom:.5vh}
  .sp-pname{font-size:1.8vh;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}
  .sp-score{font-size:2vh;font-weight:900;margin-top:.4vh}
  .sp-block{width:100%;border-radius:.5vh .5vh 0 0;display:flex;align-items:center;justify-content:center}
  .sp-num{font-size:6vh;font-weight:900;line-height:1}
  .sp-ground{height:.5vh;border-radius:0 0 3px 3px;background:var(--navy-2)}
  /* couleurs par rang */
  .s1 .sp-icon,.s1 .sp-score{color:var(--coral)}
  .s1 .sp-block{height:33vh;background:#180610;border-top:2px solid var(--coral);border-left:2px solid var(--coral);border-right:2px solid var(--coral)}
  .s1 .sp-num{color:var(--coral)}
  .s2 .sp-icon,.s2 .sp-score{color:var(--cyan)}
  .s2 .sp-block{height:22vh;background:#0b1565;border-top:1px solid var(--cyan);border-left:1px solid var(--cyan);border-right:1px solid var(--cyan)}
  .s2 .sp-num{color:var(--cyan)}
  .s3 .sp-icon,.s3 .sp-score{color:var(--green)}
  .s3 .sp-block{height:14vh;background:#081812;border-top:1px solid var(--green);border-left:1px solid var(--green);border-right:1px solid var(--green)}
  .s3 .sp-num{color:var(--green)}
  /* flame cards */
  .sp-flames{flex:1;display:flex;flex-direction:column;justify-content:space-between}
  .sp-card{border-radius:.8vh;padding:1.4vh 1.5vw;display:flex;align-items:center;gap:1.2vw;
    opacity:0;transform:translateX(20px);animation:enter-r .5s cubic-bezier(.2,.7,.2,1) forwards}
  @keyframes enter-r{to{opacity:1;transform:none}}
  .sp-card.c1{background:var(--navy-2);border:1px solid rgba(255,51,84,.22);border-left:.3vw solid rgba(255,51,84,.55)}
  .sp-card.c2{background:var(--navy-2);border:1px solid rgba(255,51,84,.4);border-left:.3vw solid rgba(255,51,84,.82)}
  .sp-card.c3{background:#180610;border:1px solid var(--coral);border-left:.4vw solid var(--coral)}
  .fc{font-size:2.8vh;flex-shrink:0}
  .c1 .fc,.c2 .fc{color:rgba(255,51,84,.72)}.c3 .fc{color:var(--coral)}
  .sp-cb{flex:1;min-width:0}
  .sp-cn{font-size:1.9vh;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sp-cr{font-size:1.3vh;color:var(--muted);font-weight:500;margin-left:.4vw}
  .sp-cq{font-size:1.5vh;font-style:italic;color:var(--muted);margin-top:.3vh;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .c3 .sp-cq{color:var(--coral);font-style:normal;font-weight:700}
  .sp-cp{flex-shrink:0;text-align:right}
  .sp-pv{font-size:2.1vh;font-weight:800;color:var(--coral)}
  .sp-pu{font-size:1.1vh;color:var(--muted);font-weight:500}

  footer{display:flex;align-items:center;justify-content:space-between;
    padding-top:1.4vh;border-top:1px solid var(--line);font-size:1.6vh;color:var(--muted)}
  .pager{display:flex;gap:.7vw}
  .pager i{width:2.2vw;max-width:34px;height:.6vh;border-radius:3px;background:var(--line);transition:background .3s}
  .pager i.on{background:var(--cyan)}
  .sign{letter-spacing:.28em;text-transform:uppercase;font-weight:600;color:var(--cyan)}

  @media(prefers-reduced-motion:reduce){
    .motion,.dot{animation:none}
    .row,.sp-card{animation:none;opacity:1;transform:none}
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
  var cfg=JSON.parse(document.getElementById("data").textContent);
  var all=cfg.entries||[];
  var per=cfg.rowsPerPage||12;

  var listPages=[];
  for(var i=0;i<all.length;i+=per) listPages.push(all.slice(i,i+per));
  if(!listPages.length) listPages=[[]];

  var SHOW_SPECIAL=all.length>=3;
  var totalPages=(SHOW_SPECIAL?1:0)+listPages.length;
  var idx=0;
  var board=document.getElementById("board");
  var pager=document.getElementById("pager");

  var ROAST=[
    {q:"Encore un effort, champion !",ic:"&#128123;"},
    {q:"Maillot jaune… mais inversé",ic:"&#128200;"},
    {q:"Spécialiste du hasard",ic:"&#128293;"}
  ];

  function escH(s){return String(s).replace(/[&<>"]/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c];});}
  function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,"&nbsp;");}
  function trendG(t){
    if(t>0) return '<span class="trend up">&#9650;</span>';
    if(t<0) return '<span class="trend down">&#9660;</span>';
    return '<span class="trend flat">&bull;</span>';
  }

  function paintSpecial(){
    var top3=all.slice(0,3);
    var bottom3=all.length>=6?all.slice(-3):[];
    var order=[
      {e:top3[1],sc:"s2",ic:"&#129352;"},
      {e:top3[0],sc:"s1",ic:"&#129351;"},
      {e:top3[2],sc:"s3",ic:"&#129353;"}
    ].filter(function(o){return !!o.e;});

    var podHtml=order.map(function(o){
      return '<div class="sp-slot '+o.sc+'">'
        +'<div class="sp-info">'
        +'<span class="sp-icon">'+o.ic+'</span>'
        +'<div class="sp-pname">'+escH(o.e.name)+'</div>'
        +'<div class="sp-score">'+fmt(o.e.points)+'&nbsp;pts</div>'
        +'</div>'
        +'<div class="sp-block"><span class="sp-num">'+o.e.rank+'</span></div>'
        +'</div>';
    }).join("");

    var flameHtml=bottom3.map(function(e,i){
      var r=ROAST[i]||ROAST[ROAST.length-1];
      return '<div class="sp-card c'+(i+1)+'" style="animation-delay:'+(i*0.12).toFixed(2)+'s">'
        +'<span class="fc">'+r.ic+'</span>'
        +'<div class="sp-cb">'
        +'<div class="sp-cn">'+escH(e.name)+'<span class="sp-cr">'+e.rank+'e</span></div>'
        +'<div class="sp-cq">'+escH(r.q)+'</div>'
        +'</div>'
        +'<div class="sp-cp"><div class="sp-pv">'+fmt(e.points)+'</div><div class="sp-pu">pts</div></div>'
        +'</div>';
    }).join("");

    board.innerHTML='<div class="sp-layout">'
      +'<div class="sp-left">'
      +'<div class="sp-title" style="color:var(--cyan)">&#129351; Podium</div>'
      +'<div class="sp-podium">'+podHtml+'</div>'
      +'<div class="sp-ground"></div>'
      +'</div>'
      +(bottom3.length
        ?'<div class="sp-right">'
          +'<div class="sp-title" style="color:var(--coral)">&#128293; Hall of Flame</div>'
          +'<div class="sp-flames">'+flameHtml+'</div>'
          +'</div>'
        :"")
      +'</div>';
  }

  function paintList(p){
    var rows=listPages[p];
    board.innerHTML=rows.map(function(e,n){
      var cls="row"+(e.rank===1?" p1":e.rank===2?" p2":e.rank===3?" p3":"");
      return '<div class="'+cls+'" style="animation-delay:'+(n*0.05).toFixed(2)+'s">'
        +'<div class="rank">'+e.rank+'</div>'
        +'<div class="name">'+escH(e.name)+trendG(e.trend||0)+'</div>'
        +'<div class="pts">'+fmt(e.points)+'<small>pts</small></div>'
        +'</div>';
    }).join("");
  }

  function paint(){
    if(SHOW_SPECIAL&&idx===0){paintSpecial();}
    else{paintList(SHOW_SPECIAL?idx-1:idx);}
    pager.innerHTML=totalPages>1
      ?Array.from({length:totalPages},function(_,p){return'<i class="'+(p===idx?"on":"")+'"></i>';}).join("")
      :"";
  }

  paint();
  if(totalPages>1){setInterval(function(){idx=(idx+1)%totalPages;paint();},${PAGE_CYCLE_MS});}
})();
</script>
</body>
</html>`;
}
