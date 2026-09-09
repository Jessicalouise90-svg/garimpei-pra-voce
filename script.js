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
  if($("pixOn").checked&&money($("pix").value))x+=`<span class="badge">PREÇO NO PIX: ${money($("pix").value)}</span>`;
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
  canvas.width=1080; canvas.height=1080;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#ffffff";
  ctx.fillRect(0,0,1080,1080);

  const img=$("artImage");
  await new Promise(r=>{
    if(img.complete && img.naturalWidth) r();
    else img.onload=r;
  });

  const iw=img.naturalWidth||1, ih=img.naturalHeight||1;
  // Preserve the original photo without adding any offer text, badges or overlays.
  const scale=Math.min(1080/iw,1080/ih);
  const w=iw*scale, h=ih*scale;
  ctx.drawImage(img,(1080-w)/2,(1080-h)/2,w,h);
  return canvas.toDataURL("image/png");
}

$("whatsapp").onclick=async()=>{
  $("error").textContent="";
  const link=$("link").value.trim();
  const name=$("name").value.trim();
  const price=money($("price").value);
  const old=money($("oldPrice").value);

  if(!photoData){$("error").textContent="Escolha uma foto do produto.";return}
  if(!name){$("error").textContent="Digite o nome do produto.";return}
  if(!price){$("error").textContent="Digite o preço atual.";return}
  if(!link){$("error").textContent="Cole o link do produto antes de enviar para o WhatsApp.";return}
  if(!/^https?:\/\//i.test(link)){$("error").textContent="O link deve começar com https://";return}

  let text=`🔥 ${name}\n`;
  if(old) text+=`~De ${old}~ por *${price}*\n`;
  else text+=`💰 *${price}*\n`;
  if($("couponOn").checked&&$("coupon").value.trim())
    text+=`🎟️ *CUPOM:* ${$("coupon").value.trim()}\n`;
  if($("pixOn").checked&&money($("pix").value))
    text+=`💳 *PREÇO NO PIX:* ${money($("pix").value)}\n`;
  text+=`🛒 *COMPRE AQUI:* ${link}`;

  try{
    const blob=await (await fetch(photoData)).blob();
    const file=new File([blob],"garimpei-produto.png",{type:blob.type||"image/png"});
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file],text});
      return;
    }
    if(navigator.share){
      await navigator.share({text});
      return;
    }
  }catch(err){
    if(err && err.name==="AbortError") return;
  }

  window.location.href=`https://wa.me/?text=${encodeURIComponent(text)}`;
};
