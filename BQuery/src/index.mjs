import BQueryProxyHandler from "./js/Proxy/BQueryProxyHandler.mjs";
import BQuery from "./js/Core/BQuery.mjs";

//
export * from "./js/UI/Elements.mjs";

//
const BQ = (selector, parent = document, $I = 0, $options = {})=>{
    const _bq_ = new BQuery(selector, parent, $I, $options);
    return new Proxy(_bq_, new BQueryProxyHandler());
};

//
export default BQ;
