import { compile } from "@danielx/civet";

//
export default {
    transpilers: [
        {
            extension: ".civet",
            target: ".mjs",
            compile: function (path, source) {
                const code = compile(source, {
                    filename: path,
                });

                return {
                    code,
                };
            },
        },
    ],
};
