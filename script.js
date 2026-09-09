const $=id=>document.getElementById(id);
let photoData="";
let lastArtDataUrl="";

$("photo").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{photoData=r.result;$("photoPreview").src=photoData;$("photo").closest(".photo-box").classList.add("has-image")};
  r.readAsDataURL(f);
});

function toggle(check,input){
  $(check).addEventListener("change",()=>{
    $(input).disabled=!$(check).checked;
    if(!$(check).checked)$(input).value="";
  });
}
toggle("couponOn","coupon");
toggle("pixOn","pix");

function money(v){
  if(!v)return "";
  v=v.replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",",".");
  const n=Number(v);
  if(!isFinite(n))return "";
  return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

$("generate").onclick=async()=>{
  $("error").textContent="";
  const name=$("name").value.trim(),link=$("link").value.trim(),price=money($("price").value);
  if(!name){$("error").textContent="Digite o nome do produto.";return}
  if(!price){$("error").textContent="Digite o preço atual.";return}
  if(!photoData){$("error").textContent="Escolha uma foto do produto.";return}
  if(link && !/^https?:\/\//i.test(link)){$("error").textContent="O link deve começar com https://";return}

  $("artName").textContent=name;
  $("artImage").src=photoData;
  const old=money($("oldPrice").value);
  $("prices").innerHTML=(old?`<span class="old">${old}</span>`:"")+`<span class="current">${price}</span>`;

  let x="";
  if($("couponOn").checked&&$("coupon").value.trim())x+=`<span class="badge">🎟️ ${escapeHtml($("coupon").value.trim())}</span>`;
  if($("pixOn").checked&&money($("pix").value))x+=`<span class="badge">💳 PIX ${money($("pix").value)}</span>`;
  $("extras").innerHTML=x;

  lastArtDataUrl=await renderArt();
  $("art").scrollIntoView({behavior:"smooth",block:"center"});
};

function fitFont(ctx,text,maxWidth,start,min){
  let size=start;
  while(size>min){
    ctx.font=`900 ${size}px Arial`;
    if(ctx.measureText(text).width<=maxWidth)return size;
    size-=2;
  }
  return min;
}
function wrapLines(ctx,text,maxWidth,maxLines){
  const words=text.split(/\s+/),lines=[];
  let line="";
  for(const w of words){
    const test=line?line+" "+w:w;
    if(ctx.measureText(test).width>maxWidth&&line){
      lines.push(line);line=w;
    }else line=test;
  }
  if(line)lines.push(line);
  if(lines.length<=maxLines)return lines;
  let last=lines.slice(maxLines-1).join(" ");
  while(ctx.measureText(last+"…").width>maxWidth&&last.includes(" ")){
    last=last.substring(0,last.lastIndexOf(" "));
  }
  lines.splice(maxLines-1,lines.length-(maxLines-1),last+"…");
  return lines;
}
function drawCenteredLines(ctx,lines,x,startY,lineH){
  lines.forEach((line,i)=>ctx.fillText(line,x,startY+i*lineH));
}

async function renderArt(){
  const canvas=document.createElement("canvas");
  canvas.width=1080;canvas.height=1080;
  const ctx=canvas.getContext("2d");

  ctx.fillStyle="#f7f3e9";ctx.fillRect(0,0,1080,1080);

  ctx.fillStyle="#0d6b4f";ctx.fillRect(0,0,1080,70);
  ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="900 34px Arial";
  ctx.fillText("ACHADINHO DO DIA 🛍️",540,46);

  const img=$("artImage");
  await new Promise(r=>{if(img.complete)r();else img.onload=r});

  const areaTop=70,areaH=410,iw=img.naturalWidth||1,ih=img.naturalHeight||1;
  const sc=Math.min(900/iw,370/ih),w=iw*sc,h=ih*sc;
  ctx.drawImage(img,(1080-w)/2,areaTop+(areaH-h)/2,w,h);

  const productName=$("artName").textContent.trim();
  const nameSize=fitFont(ctx,productName,900,34,22);
  ctx.fillStyle="#17352b";
  ctx.font=`900 ${nameSize}px Arial`;
  const lines=wrapLines(ctx,productName,900,2);
  drawCenteredLines(ctx,lines,540,535,nameSize*1.12);

  const current=$("prices").querySelector(".current")?.textContent||"";
  const old=$("prices").querySelector(".old")?.textContent||"";

  let priceY=650;
  if(lines.length===2)priceY=675;

  if(old){
    const oldSize=27;
    ctx.font=`700 ${oldSize}px Arial`;
    ctx.fillStyle="#8b948f";
    const oldW=ctx.measureText(old).width;
    ctx.fillText(old,540-18-oldW/2,priceY);
    ctx.strokeStyle="#8b948f";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(540-18-oldW/2,priceY-8);ctx.lineTo(540-18+oldW/2,priceY-8);ctx.stroke();

    ctx.font="900 62px Arial";ctx.fillStyle="#0d6b4f";
    ctx.fillText(current,690,priceY);
  }else{
    ctx.font="900 68px Arial";ctx.fillStyle="#0d6b4f";
    ctx.fillText(current,540,priceY);
  }

  const badges=[...$("extras").querySelectorAll(".badge")].map(b=>b.textContent.trim());
  let y=735;
  if(badges.length){
    ctx.font="900 25px Arial";
    badges.forEach((b,i)=>{
      const max=850;
      let s=25;
      while(s>17){
        ctx.font=`900 ${s}px Arial`;
        if(ctx.measureText(b).width<=max)break;
        s-=1;
      }
      const bw=Math.min(ctx.measureText(b).width+36,max+36),bh=44,bx=540-bw/2;
      ctx.fillStyle="#e2f3e9";
      ctx.beginPath();ctx.roundRect(bx,y-31,bw,bh,22);ctx.fill();
      ctx.fillStyle="#0d6b4f";ctx.font=`900 ${s}px Arial`;
      ctx.fillText(b,540,y);
      y+=58;
    });
  }

  ctx.fillStyle="#0d6b4f";
  ctx.beginPath();ctx.roundRect(390,885,300,62,31);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="900 25px Arial";
  ctx.fillText("VER OFERTA →",540,925);

  ctx.fillStyle="#718078";ctx.font="800 18px Arial";
  ctx.fillText("Garimpei pra Você",540,985);

  return canvas.toDataURL("image/png");
}

$("whatsapp").onclick=()=>{
  $("error").textContent="";
  const link=$("link").value.trim();
  const name=$("name").value.trim();
  const price=money($("price").value);
  const old=money($("oldPrice").value);

  if(!lastArtDataUrl){$("error").textContent="Gere a prévia primeiro.";return}
  if(!link){$("error").textContent="Cole o link do produto antes de enviar para o WhatsApp.";return}
  if(!/^https?:\/\//i.test(link)){$("error").textContent="O link deve começar com https://";return}

  let text=`🔥 ${name}\n`;
  if(old)text+=`De ${old} por ${price}\n`;else text+=`💰 ${price}\n`;
  if($("couponOn").checked&&$("coupon").value.trim())text+=`🎟️ Cupom: ${$("coupon").value.trim()}\n`;
  if($("pixOn").checked&&money($("pix").value))text+=`💳 PIX: ${money($("pix").value)}\n`;
  text+=`🛒 Compre aqui: ${link}`;

  window.location.href=`https://wa.me/?text=${encodeURIComponent(text)}`;
};
