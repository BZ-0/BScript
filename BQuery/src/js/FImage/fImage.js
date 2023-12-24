/**
 * What we doing?
 * 1. Pre-fetching images, but not decoding (speed-up display speed).
 * 2. When visible in viewport, mark high priority and do eager loading.
 * 3. When out of viewport, mark low priority and lazy loading.
 */

//
const DescriptorNames = { w: "width", x: "density" };
const SRCSEG = /(\S*[^,\s])(\s+([\d.]+)(x|w))?/g;
const parse = (srcset) => matchAll(srcset, SRCSEG).map(([, url, , value, modifier]) => {
    let modKey = DescriptorNames[modifier];
    return modKey ? { url, [modKey]: parseFloat(value) } : { url };
});

//
const matchAll = (str, regex) => {
    let match = null, result = [];
    while ((match = regex.exec(str)) !== null) result.push(match);
    return result;
};

//
const callback = (entries) => {
    entries.forEach((entry) => {
        const img = entry.target;
        if (img) {
            if (entry.isIntersecting) {
                img.loading = "eager"
                img.fetchPriority = "high"
                img.style.removeProperty("visibility");
                //console.log("intersection with image");
            } else {
                img.loading = "lazy"
                img.fetchPriority = "low"
                img.style.setProperty("visibility", "hidden", "");
                //console.log("image not visible");
            }
        }
    });
}

//
const includer = new MutationObserver((mut)=>{ Array.from(mut.addedNodes??[]).map(fImage); });
const observer = new IntersectionObserver(callback, { root: null, rootMargin: "0px", threshold: 0.0, });

//
const optSelector = async (selector = "img") => { 
    if (document.body) { includer.observe(document.body, {childList: true, subtree: true}); };
    return Array.from(document.querySelectorAll(selector)).map((I)=>fImage(I,selector)); 
}

//
const fImage = async (img,selector) => {
    const Q = new Set(document.querySelectorAll(selector));
    if (Q.has(img) && !img.getAttribute("data-optimized")) {
        observer.observe(img);

        //
        if (img.src) {
            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = img.src;
            link.as = "image";
            link.fetchpriority = "low";
            document.head.appendChild(link);
            link.onload = ()=>{
                document.head.removeChild(link);
            }
        }
        
        //
        if (img.srcset) {
            const cands = parse(img.srcset.trim());
            cands.map(async (can)=>{
                const link = document.createElement("link");
                link.rel = "prefetch";
                link.href = can.url;
                link.as = "image";
                link.fetchpriority = "low";
                document.head.appendChild(link);
                link.onload = ()=>{
                    document.head.removeChild(link);
                }
            })
        }

        //img.crossOrigin = "anonymous";
        img.setAttribute("data-optimized", true);
    }
}

//
const optMedia = ()=>{ optSelector("img"); }

//
document.addEventListener("DOMContentLoaded", optMedia);
optMedia();
