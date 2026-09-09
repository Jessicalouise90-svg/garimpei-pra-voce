const $=id=>document.getElementById(id);
let photoData="";
let lastArtDataUrl="";

$("photo").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{photoData=r.result;$("photoPreview").src=photoData;$("photo").closest(".photo-box").classList.add("has-image")};r.readAsDataURL(f);
});
function toggle(check,input){$(check).addEventListener("change",()=>{$(input).disabled=!$(check).checked;if(!$(check).checked)$(input).value=""})}
toggle("couponOn","coupon");toggle("pixOn","pix");
function money(v){if(!v)return "";v=v.replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",",".");const n=Number(v);if(!isFinite(n))return "";return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

$("generate").onclick=async()=>{
  $("error").textContent="";
  const name=$("name").value.trim(),link=$("link").value.trim(),price=money($("price").value);
  if(!name){$("error").textContent="Digite o nome do produto.";return}
  if(!price){$("error").textContent="Digite o preço atual.";return}
  if(!photoData){$("error").textContent="Escolha uma foto do produto.";return}
  if(link && !/^https?:\/\//i.test(link)){$("error").textContent="O link deve começar com https://";return}
  $("artName").textContent=name;$("artImage").src=photoData;
  const old=money($("oldPrice").value);$("prices").innerHTML=(old?`<span class="old">${old}</span>`:"")+`<span class="current">${price}</span>`;
  let x="";
  if($("couponOn").checked&&$("coupon").value.trim())x+=`<span class="badge">🎟️ CUPOM: ${escapeHtml($("coupon").value.trim())}</span>`;
  if($("pixOn").checked&&money($("pix").value))x+=`<span class="badge">💳 ${money($("pix").value)} NO PIX</span>`;
  $("extras").innerHTML=x;
  lastArtDataUrl=await renderArt();
  $("art").scrollIntoView({behavior:"smooth",block:"center"});
};

async function renderArt(){
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1080;const ctx=canvas.getContext("2d");
  ctx.fillStyle="#f7f3e9";ctx.fillRect(0,0,1080,1080);
  ctx.fillStyle="#0d6b4f";ctx.fillRect(0,0,1080,65);ctx.fillStyle="#fff";ctx.font="900 34px Arial";ctx.textAlign="center";ctx.fillText("ACHADINHO DO DIA 🛍️",540,44);
  const img=$("artImage");await new Promise(r=>{if(img.complete)r();else img.onload=r});
  const areaTop=65,areaH=485,iw=img.naturalWidth,ih=img.naturalHeight,sc=Math.min(1000/iw,470/ih),w=iw*sc,h=ih*sc;ctx.drawImage(img,(1080-w)/2,areaTop+(areaH-h)/2,w,h);
  ctx.textAlign="center";ctx.fillStyle="#17352b";
  let nameSize=40;while(nameSize>24){ctx.font=`900 ${nameSize}px Arial`;if(measureWrap(ctx,$("artName").textContent,900).length<=3)break;nameSize-=2}
  wrap(ctx,$("artName").textContent,540,610,900,nameSize+8,3);
  const current=$("prices").querySelector(".current")?.textContent||"",old=$("prices").querySelector(".old")?.textContent||"";
  if(old){ctx.fillStyle="#8b948f";ctx.font="24px Arial";ctx.fillText(old,450,790);ctx.strokeStyle="#8b948f";ctx.beginPath();ctx.moveTo(390,782);ctx.lineTo(510,782);ctx.stroke()}
  ctx.fillStyle="#0d6b4f";ctx.font="900 62px Arial";ctx.fillText(current,650,795);
  let y=850;ctx.font="900 25px Arial";ctx.fillStyle="#0d6b4f";for(const b of $("extras").querySelectorAll(".badge")){ctx.fillText(b.textContent,540,y);y+=38}
  ctx.fillStyle="#0d6b4f";ctx.beginPath();ctx.roundRect(390,925,300,60,30);ctx.fill();ctx.fillStyle="#fff";ctx.font="900 25px Arial";ctx.fillText("VER OFERTA →",540,963);
  ctx.fillStyle="#718078";ctx.font="800 18px Arial";ctx.fillText("Garimpei pra Você",540,1018);
  return canvas.toDataURL("image/png");
}
function measureWrap(ctx,text,maxWidth){const words=text.split(/\s+/),lines=[];let line="";for(const w of words){const test=line?line+" "+w:w;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);return lines}
function wrap(ctx,text,x,y,maxWidth,lineH,maxLines=3){const lines=measureWrap(ctx,text,maxWidth).slice(0,maxLines);for(const line of lines){ctx.fillText(line,x,y);y+=lineH}}

$("whatsapp").onclick=async()=>{
  $("error").textContent="";
  if(!lastArtDataUrl){$("error").textContent="Gere a prévia primeiro.";return}
  const link=$("link").value.trim();
  if(!link){$("error").textContent="Cole o link do produto antes de enviar para o WhatsApp.";return}
  try{
    const blob=await (await fetch(lastArtDataUrl)).blob();
    const file=new File([blob],"garimpei-pra-voce.png",{type:"image/png"});
    const name=$("name").value.trim(),price=money($("price").value),old=money($("oldPrice").value);
    let text=`🔥 ${name}\n`;
    if(old)text+=`De ${old} por ${price}\n`;else text+=`💰 ${price}\n`;
    if($("couponOn").checked&&$("coupon").value.trim())text+=`🎟️ Cupom: ${$("coupon").value.trim()}\n`;
    if($("pixOn").checked&&money($("pix").value))text+=`💳 PIX: ${money($("pix").value)}\n`;
    text+=`🛒 Compre aqui: ${link}`;
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({files:[file],text});
    }else if(navigator.share){await navigator.share({text});}
    else{alert("Seu navegador não permite compartilhar a imagem diretamente. Use o botão de compartilhamento do iPhone.")}
  }catch(e){if(e.name!=="AbortError")alert("Não foi possível abrir o compartilhamento. Tente novamente.")}
};
