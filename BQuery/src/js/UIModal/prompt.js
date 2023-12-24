const promptProc = {
    type: "prompt"
};

//
const makePromptTmpl = () => {
    const prompt = document.createElement("div");
    const input = document.createElement("input");
    const top = document.createElement("div");
    const bottom = document.createElement("div");
    const confirmb = document.createElement("button");
    const blackout = document.createElement("div");
    const info = document.createElement("div");
    const rejectb = document.createElement("button");
    const bblock = document.createElement("div");

    //
    blackout.style.setProperty("display", "none", "");
    blackout.classList.add("blackout");
    prompt.classList.add("prompt");
    input.classList.add("field");

    //
    confirmb.classList.add("confirm");
    rejectb.classList.add("reject");

    //
    info.classList.add("info");
    top.classList.add("top");
    bottom.classList.add("bottom");

    //
    confirmb.innerHTML = "Confirm";
    rejectb.innerHTML = "Cancel";

    //
    prompt.appendChild(top);
    prompt.appendChild(bottom);
    

    //
    bottom.appendChild(info);
    bottom.appendChild(input);

    //
    bblock.appendChild(rejectb);
    bblock.appendChild(confirmb);
    bottom.appendChild(bblock);

    //
    blackout.setAttribute("type", promptProc.type = "prompt");

    //
    input.addEventListener("input", () => { promptProc.value = input.value; });
    confirmb.addEventListener("click", () => { $resolve(); });
    rejectb.addEventListener("click", () => { $reject(); });

    //
    blackout.appendChild(prompt);
    document.body.appendChild(blackout);

    //
    {
        promptProc.input = input;
        promptProc.info = info;
        promptProc.blackout = blackout;
        promptProc.confirm = confirmb;
        promptProc.rejectb = rejectb;
    }
}

//
document.addEventListener("DOMContentLoaded", makePromptTmpl);

//
const $reject = () => {
    promptProc.blackout.style.setProperty("display", "none", "");
    promptProc.active = false;
    if (promptProc.type == "confirm") {
        promptProc?.resolve?.(false);
        //promptProc?.reject?.(false);
    }
}

//
const $hide = () => {
    promptProc.blackout.style.setProperty("display", "none", "");
    promptProc.active = false;
}

//
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { $hide(); }
});

//
const $resolve = () => {
    promptProc.blackout.style.setProperty("display", "none", "");
    promptProc.active = false;
    if (promptProc.type == "prompt") {
        promptProc?.resolve?.(promptProc.value = promptProc.input.value);
    }
    if (promptProc.type == "confirm") {
        promptProc?.resolve?.(true);
    }
}

//
const $prompt = async (msg, def = "") => {
    promptProc.message = msg;
    promptProc.active = true;
    promptProc.info.innerHTML = msg;
    promptProc.blackout.style.removeProperty("display");
    promptProc.value = def;

    //
    promptProc.blackout.setAttribute("data-type", promptProc.type = "prompt");

    //
    return new Promise((resolve)=>{
        promptProc.resolve = resolve;
    });
}

//
const $alert = async (msg, def = "") => {
    promptProc.message = msg;
    promptProc.active = true;
    promptProc.info.innerHTML = msg;
    promptProc.blackout.style.removeProperty("display");
    promptProc.value = def;

    //
    promptProc.blackout.setAttribute("data-type", promptProc.type = "alert");

    //
    return new Promise((resolve, reject)=>{
        promptProc.resolve = resolve;
        promptProc.reject = reject;
    });
}


//
const $confirm = async (msg, def = "") => {
    promptProc.message = msg;
    promptProc.active = true;
    promptProc.info.innerHTML = msg;
    promptProc.blackout.style.removeProperty("display");
    promptProc.value = def;

    //
    promptProc.blackout.setAttribute("data-type", promptProc.type = "confirm");

    //
    return new Promise((resolve)=>{
        promptProc.resolve = resolve;
    });
}