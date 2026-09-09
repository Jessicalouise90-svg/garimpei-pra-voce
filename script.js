const $=id=>document.getElementById(id);
let photoData="";

$("photo").addEventListener("change",e=>{
  const f=e.target.files[0];
  if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    photoData=r.result;
    $("photoPreview").src=photoData;
    $("artImage").src=photoData;
    $("photo").closest(".photo-box").classList.add("has-image");
  };
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

function buildMessage(){
  const name=$("name").value.trim();
  const price=money($("price").value);
  const old=money($("oldPrice").value);
  const coupon=$("coupon").value.trim();
  const pix=money($("pix").value);
  const link=$("link").value.trim();

  let text=`🔥 ${name}\n`;
  if(old) text+=`De ${old} por ${price}\n`;
  else text+=`💰 ${price}\n`;
  if($("couponOn").checked && coupon) text+=`🎟️ CUPOM: ${coupon}\n`;
  if($("pixOn").checked && pix) text+=`💳 PREÇO NO PIX: ${pix}\n`;
  text+=`🛒 COMPRE AQUI: ${link}`;
  return text;
}

$("generate").onclick=()=>{
  $("error").textContent="";
  const name=$("name").value.trim();
  const link=$("link").value.trim();
  const price=money($("price").value);

  if(!name){$("error").textContent="Digite o nome do produto.";return}
  if(!price){$("error").textContent="Digite o preço atual.";return}
  if(!photoData){$("error").textContent="Escolha uma foto do produto.";return}
  if(!link){$("error").textContent="Cole o link do produto.";return}
  if(!/^https?:\/\//i.test(link)){$("error").textContent="O link deve começar com https://";return}

  $("artImage").src=photoData;
  $("art").scrollIntoView({behavior:"smooth",block:"center"});
};

$("whatsapp").onclick=async()=>{
  $("error").textContent="";
  const link=$("link").value.trim();
  const name=$("name").value.trim();
  const price=money($("price").value);

  if(!photoData){$("error").textContent="Escolha uma foto do produto.";return}
  if(!name){$("error").textContent="Digite o nome do produto.";return}
  if(!price){$("error").textContent="Digite o preço atual.";return}
  if(!link){$("error").textContent="Cole o link do produto.";return}
  if(!/^https?:\/\//i.test(link)){$("error").textContent="O link deve começar com https://";return}

  const text=buildMessage();

  try{
    const blob=await (await fetch(photoData)).blob();
    const file=new File([blob],"produto.png",{type:blob.type||"image/png"});

    // Prefer sharing ONLY the original photo. This prevents the offer information
    // from being rendered into the image. After the photo share, the user can
    // paste/send the copied offer text in WhatsApp.
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file]});
      try{await navigator.clipboard.writeText(text)}catch(_){}
      return;
    }

    // Fallback: copy the complete offer text and open WhatsApp.
    try{await navigator.clipboard.writeText(text)}catch(_){}
    window.location.href=`https://wa.me/?text=${encodeURIComponent(text)}`;
  }catch(err){
    if(err && err.name==="AbortError")return;
    try{await navigator.clipboard.writeText(text)}catch(_){}
    window.location.href=`https://wa.me/?text=${encodeURIComponent(text)}`;
  }
};