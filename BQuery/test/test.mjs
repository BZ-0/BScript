import Q from "../src/index.mjs";
export * from "./test.css?inline";

//
Q(document).ready((e)=>{
    Q("#test").css({
        "background-color": "#000000FF",
        "color": "#FFFFFFFF",
        "width": "100px",
        "height": "100px",
        "box-sizing": "border-box",
        "padding":"10px"
    }).html("An test...");
});
