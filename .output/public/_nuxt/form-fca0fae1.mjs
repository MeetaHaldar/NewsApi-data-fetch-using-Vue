function n(o={},t=null,e=[]){for(let[i,f]of Object.entries(o))l(e,u(t,i),f);return e}function u(o,t){return o?o+"["+t+"]":t}function l(o,t,e){if(Array.isArray(e))for(let[i,f]of e.entries())l(o,u(t,i.toString()),f);else e instanceof Date?o.push([t,e.toISOString()]):typeof e=="boolean"?o.push([t,e?"1":"0"]):typeof e=="string"?o.push([t,e]):typeof e=="number"?o.push([t,`${e}`]):e==null?o.push([t,""]):n(e,t,o)}function r(o){var t;let e=(t=o==null?void 0:o.form)!=null?t:o.closest("form");if(e){for(let i of e.elements)if(i.tagName==="INPUT"&&i.type==="submit"||i.tagName==="BUTTON"&&i.type==="submit"||i.nodeName==="INPUT"&&i.type==="image"){i.click();return}}}export{n as e,r as p};