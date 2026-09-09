const $=id=>document.getElementById(id);
let photoData="";

$("photo").addEventListener("change",e=>{
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=()=>{photoData=r.result;$("photoPreview").src=photoData;$("photo-box");$("photo").closest(".photo-box").classList.add("has-image");};
  r.readAsDataURL(f);
});
function toggle(check,input){$(check).addEventListener("change",()=>{$(input).disabled=!$(check).checked;if(!$(check).checked)$(input).value=""})}
toggle("couponOn","coupon");toggle("pixOn","pix");

function money(v){
  if(!v)return "";
  v=v.replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",",".");
  const n=Number(v); if(!isFinite(n))return "";
  return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
$("generate").onclick=()=>{
  $("error").textContent="";
  const name=$("name").value.trim(), price=money($("price").value);
  if(!name){$("error").textContent="Digite o nome do produto.";return}
  if(!price){$("error").textContent="Digite o preço atual.";return}
  if(!photoData){$("error").textContent="Escolha uma foto do produto.";return}
  $("artName").textContent=name;
  $("artImage").src=photoData;
  const old=money($("oldPrice").value);
  $("prices").innerHTML=(old?`<span class="old">${old}</span>`:"")+`<span class="current">${price}</span>`;
  let x="";
  if($("couponOn").checked && $("coupon").value.trim())x+=`<span class="badge">🎟️ CUPOM: ${escapeHtml($("coupon").value.trim())}</span>`;
  if($("pixOn").checked && money($("pix").value))x+=`<span class="badge">💳 ${money($("pix").value)} NO PIX</span>`;
  $("extras").innerHTML=x;
  $("art").scrollIntoView({behavior:"smooth",block:"center"});
};
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

$("download").onclick=async()=>{
  if(!$("artImage").src || $("artName").textContent==="Seu produto aparecerá aqui"){alert("Gere a prévia primeiro.");return}
  const art=$("art");
  const scale=3, canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1080;
  const ctx=canvas.getContext("2d");
  const rect=art.getBoundingClientRect(), ratio=1080/rect.width;
  const data=await htmlToCanvas(art,ratio,ctx,canvas);
  const a=document.createElement("a");a.download="garimpei-pra-voce.png";a.href=data;a.click();
};
async function htmlToCanvas(el,ratio,ctx,canvas){
  // Geração nativa simples, evitando bibliotecas externas e falhas de carregamento.
  const bg=getComputedStyle(el).backgroundColor||"#f7f3e9";ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1080);
  ctx.fillStyle="#0d6b4f";ctx.fillRect(0,0,1080,Math.round(1080*.06));
  ctx.fillStyle="#fff";ctx.font="900 34px Arial";ctx.textAlign="center";ctx.fillText("ACHADINHO DO DIA 🛍️",540,44);
  const img=$("artImage");await new Promise(r=>{if(img.complete)r();else img.onload=r});
  const areaTop=65, areaH=510, iw=img.naturalWidth,ih=img.naturalHeight,sc=Math.min(1000/iw,470/ih);
  const w=iw*sc,h=ih*sc;ctx.drawImage(img,(1080-w)/2,areaTop+(areaH-h)/2,w,h);
  ctx.fillStyle="#17352b";ctx.font="900 40px Arial";wrap(ctx,$("artName").textContent,540,625,900,48);
  const current=$("prices").querySelector(".current")?.textContent||"";const old=$("prices").querySelector(".old")?.textContent||"";
  if(old){ctx.fillStyle="#8b948f";ctx.font="24px Arial";ctx.fillText(old,450,760);ctx.strokeStyle="#8b948f";ctx.beginPath();ctx.moveTo(390,752);ctx.lineTo(510,752);ctx.stroke()}
  ctx.fillStyle="#0d6b4f";ctx.font="900 62px Arial";ctx.fillText(current,650,765);
  let y=820;ctx.font="900 25px Arial";ctx.fillStyle="#0d6b4f";
  for(const b of $("extras").querySelectorAll(".badge")){ctx.fillText(b.textContent,540,y);y+=38}
  ctx.fillStyle="#0d6b4f";ctx.roundRect(390,920,300,60,30);ctx.fill();ctx.fillStyle="#fff";ctx.font="900 25px Arial";ctx.fillText("VER OFERTA →",540,958);
  ctx.fillStyle="#718078";ctx.font="800 18px Arial";ctx.fillText("Garimpei pra Você",540,1015);
  return canvas.toDataURL("image/png");
}
function wrap(ctx,text,x,y,maxWidth,lineH){const words=text.split(" ");let line="";for(const w of words){const test=line?line+" "+w:w;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineH;line=w}else line=test}if(line)ctx.fillText(line,x,y)}
