import{t as u}from"./dom-0d1fce75.mjs";import{m as r,l,h as f}from"./entry-fba3770b.mjs";function a(t,n){if(t)return t;let e=n!=null?n:"button";if(typeof e=="string"&&e.toLowerCase()==="button")return"button"}function v(t,n){let e=f(a(t.value.type,t.value.as));return r(()=>{e.value=a(t.value.type,t.value.as)}),l(()=>{var o;e.value||!u(n)||u(n)instanceof HTMLButtonElement&&!((o=u(n))!=null&&o.hasAttribute("type"))&&(e.value="button")}),e}export{v as b};
