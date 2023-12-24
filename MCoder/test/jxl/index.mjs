import {loadJXL} from "/coder/index.mjs";

//
const $img = document.querySelector("#jxl");
$img.src = URL.createObjectURL(new Blob([await loadJXL($img.src)], {type: 'image/png'}));
