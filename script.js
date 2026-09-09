const $=id=>document.getElementById(id);
let photoFile=null;
let photoUrl="";

$("photo").addEventListener("change",e=>{
  const f=e.target.files && e.target.files[0];
  if(!f)return;
  photoFile=f;
  if(photoUrl)URL.revokeObjectURL(photoUrl);
  photoUrl=URL.createObjectURL(f);

  $("photoPreview").src=photoUrl;
  $("photoBox").classList.add("has-image");

  // Prepare the exact same original photo for the preview.
  $("artImage").src=photoUrl;
  $("art").classList.add("has-image");
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
  let s=String(v).trim().replace(/[^\d,.-]/g,"");
  if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");
  else s=s.replace(",",".");
  const n=Number(s);
  if(!Number.isFinite(n))return "";
  return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function valid(){
  $("error").textContent="";
  if(!photoFile){$("error").textContent="Escolha uma foto do produto.";return false}
  if(!$("name").value.trim()){$("error").textContent="Digite o nome do produto.";return false}
  if(!money($("price").value)){$("error").textContent="Digite o preço atual.";return false}
  const link=$("link").value.trim();
  if(!link){$("error").textContent="Cole o link do produto.";return false}
  if(!/^https?:\/\//i.test(link)){$("error").textContent="O link deve começar com https://";return false}
  return true;
}

$("generate").addEventListener("click",()=>{
  if(!valid())return;

  // The preview is ONLY the selected photo. No text is drawn on it.
  if(!photoUrl)photoUrl=URL.createObjectURL(photoFile);
  $("artImage").src=photoUrl;
  $("art").classList.add("has-image");

  setTimeout(()=>$("previewSection").scrollIntoView({behavior:"smooth",block:"center"}),80);
});

function buildMessage(){
  const name=$("name").value.trim();
  const price=money($("price").value);
  const old=money($("oldPrice").value);
  const coupon=$("coupon").value.trim();
  const pix=money($("pix").value);
  const link=$("link").value.trim();

  let text=`🔥 ${name}\n`;
  if(old)text+=`De ${old} por ${price}\n`;else text+=`💰 ${price}\n`;
  if($("couponOn").checked&&coupon)text+=`🎟️ CUPOM: ${coupon}\n`;
  if($("pixOn").checked&&pix)text+=`💳 PREÇO NO PIX: ${pix}\n`;
  text+=`🛒 COMPRE AQUI: ${link}`;
  return text;
}

$("whatsapp").addEventListener("click",async()=>{
  if(!valid())return;
  const text=buildMessage();

  try{
    if(navigator.share && navigator.canShare && navigator.canShare({files:[photoFile]})){
      // Share the original file itself — never a generated/annotated image.
      await navigator.share({files:[photoFile]});
      try{await navigator.clipboard.writeText(text)}catch(_){}
      return;
    }
  }catch(err){
    if(err&&err.name==="AbortError")return;
  }

  try{await navigator.clipboard.writeText(text)}catch(_){}
  window.location.href=`https://wa.me/?text=${encodeURIComponent(text)}`;
});