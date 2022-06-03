var ne=Object.defineProperty,ae=Object.defineProperties;var ue=Object.getOwnPropertyDescriptors;var Y=Object.getOwnPropertySymbols;var re=Object.prototype.hasOwnProperty,pe=Object.prototype.propertyIsEnumerable;var Z=(a,r,v)=>r in a?ne(a,r,{enumerable:!0,configurable:!0,writable:!0,value:v}):a[r]=v,x=(a,r)=>{for(var v in r||(r={}))re.call(r,v)&&Z(a,v,r[v]);if(Y)for(var v of Y(r))pe.call(r,v)&&Z(a,v,r[v]);return a},F=(a,r)=>ae(a,ue(r));import{k as D,m as j,u as _}from"./render-04a01df5.mjs";import{t as V}from"./use-id-b6e0887a.mjs";import{o as O}from"./keyboard-b81851fc.mjs";import{H as $,p as w,T as M,L as R,S as ve,b as se}from"./focus-management-c0b49fb2.mjs";import{t as n}from"./dom-0d1fce75.mjs";import{c as ie,p as z,l as G}from"./open-closed-5740cd5c.mjs";import{b as ce}from"./use-resolve-button-type-bc6e1b89.mjs";import{g as de}from"./use-outside-click-30e9fbf7.mjs";import{e as L}from"./owner-f2792c55.mjs";import{r as K}from"./use-event-listener-442b8502.mjs";import{g as C,h,i as I,p as N,s as U,l as W,n as fe}from"./entry-fba3770b.mjs";var be=(a=>(a[a.Open=0]="Open",a[a.Closed=1]="Closed",a))(be||{});let J=Symbol("PopoverContext");function H(a){let r=U(J,null);if(r===null){let v=new Error(`<${a} /> is missing a parent <${Pe.name} /> component.`);throw Error.captureStackTrace&&Error.captureStackTrace(v,H),v}return r}let ee=Symbol("PopoverGroupContext");function te(){return U(ee,null)}let le=Symbol("PopoverPanelContext");function me(){return U(le,null)}let Pe=C({name:"Popover",props:{as:{type:[Object,String],default:"div"}},setup(a,{slots:r,attrs:v,expose:S}){var f;let e=`headlessui-popover-button-${V()}`,b=`headlessui-popover-panel-${V()}`,l=h(null);S({el:l,$el:l});let u=h(1),P=h(null),m=h(null),s=I(()=>L(l)),t={popoverState:u,buttonId:e,panelId:b,panel:m,button:P,togglePopover(){u.value=_(u.value,{[0]:1,[1]:0})},closePopover(){u.value!==1&&(u.value=1)},close(c){t.closePopover();let o=(()=>c?c instanceof HTMLElement?c:c.value instanceof HTMLElement?n(c):n(t.button):n(t.button))();o==null||o.focus()}};N(J,t),ie(I(()=>_(u.value,{[0]:G.Open,[1]:G.Closed})));let p={buttonId:e,panelId:b,close(){t.closePopover()}},i=te(),g=i==null?void 0:i.registerPopover;function E(){var c,o,d,y;return(y=i==null?void 0:i.isFocusWithinPopoverGroup())!=null?y:((c=s.value)==null?void 0:c.activeElement)&&(((o=n(P))==null?void 0:o.contains(s.value.activeElement))||((d=n(m))==null?void 0:d.contains(s.value.activeElement)))}return W(()=>g==null?void 0:g(p)),K((f=s.value)==null?void 0:f.defaultView,"focus",()=>{u.value===0&&(E()||!P||!m||t.closePopover())},!0),de([P,m],(c,o)=>{var d;u.value===0&&(t.closePopover(),ve(o,se.Loose)||(c.preventDefault(),(d=n(P))==null||d.focus()))}),()=>{let c={open:u.value===0,close:t.close};return D({props:F(x({},a),{ref:l}),slot:c,slots:r,attrs:v,name:"Popover"})}}}),De=C({name:"PopoverButton",props:{as:{type:[Object,String],default:"button"},disabled:{type:[Boolean],default:!1}},setup(a,{attrs:r,slots:v,expose:S}){var f;let e=H("PopoverButton"),b=I(()=>L(e.button));S({el:e.button,$el:e.button});let l=te(),u=l==null?void 0:l.closeOthers,P=me(),m=P===null?!1:P===e.panelId,s=h(null),t=h();K((f=b.value)==null?void 0:f.defaultView,"focus",()=>{var o;t.value=s.value,s.value=(o=b.value)==null?void 0:o.activeElement},!0);let p=h(null);m||W(()=>{e.button.value=p.value});let i=ce(I(()=>({as:a.as,type:r.type})),p);function g(o){var d,y,k,B,T,q,A,Q;if(m){if(e.popoverState.value===1)return;switch(o.key){case O.Space:case O.Enter:o.preventDefault(),(y=(d=o.target).click)==null||y.call(d),e.closePopover(),(k=n(e.button))==null||k.focus();break}}else switch(o.key){case O.Space:case O.Enter:o.preventDefault(),o.stopPropagation(),e.popoverState.value===1&&(u==null||u(e.buttonId)),e.togglePopover();break;case O.Escape:if(e.popoverState.value!==0)return u==null?void 0:u(e.buttonId);if(!n(e.button)||((B=b.value)==null?void 0:B.activeElement)&&!((T=n(e.button))!=null&&T.contains(b.value.activeElement)))return;o.preventDefault(),o.stopPropagation(),e.closePopover();break;case O.Tab:if(e.popoverState.value!==0||!e.panel||!e.button)return;if(o.shiftKey){if(!t.value||(q=n(e.button))!=null&&q.contains(t.value)||(A=n(e.panel))!=null&&A.contains(t.value))return;let X=M((Q=b.value)==null?void 0:Q.body),oe=X.indexOf(t.value);if(X.indexOf(n(e.button))>oe)return;o.preventDefault(),o.stopPropagation(),$(n(e.panel),w.Last)}else o.preventDefault(),o.stopPropagation(),$(n(e.panel),w.First);break}}function E(o){var d,y,k;if(!m&&(o.key===O.Space&&o.preventDefault(),e.popoverState.value===0&&!!e.panel&&!!e.button))switch(o.key){case O.Tab:if(!t.value||(d=n(e.button))!=null&&d.contains(t.value)||(y=n(e.panel))!=null&&y.contains(t.value))return;let B=M((k=b.value)==null?void 0:k.body),T=B.indexOf(t.value);if(B.indexOf(n(e.button))>T)return;o.preventDefault(),o.stopPropagation(),$(n(e.panel),w.Last);break}}function c(o){var d,y;a.disabled||(m?(e.closePopover(),(d=n(e.button))==null||d.focus()):(o.preventDefault(),o.stopPropagation(),e.popoverState.value===1&&(u==null||u(e.buttonId)),(y=n(e.button))==null||y.focus(),e.togglePopover()))}return()=>{let o={open:e.popoverState.value===0},d=m?{ref:p,type:i.value,onKeydown:g,onClick:c}:{ref:p,id:e.buttonId,type:i.value,"aria-expanded":a.disabled?void 0:e.popoverState.value===0,"aria-controls":n(e.panel)?e.panelId:void 0,disabled:a.disabled?!0:void 0,onKeydown:g,onKeyup:E,onClick:c};return D({props:x(x({},a),d),slot:o,attrs:r,slots:v,name:"PopoverButton"})}}}),Ce=C({name:"PopoverOverlay",props:{as:{type:[Object,String],default:"div"},static:{type:Boolean,default:!1},unmount:{type:Boolean,default:!0}},setup(a,{attrs:r,slots:v}){let S=H("PopoverOverlay"),f=`headlessui-popover-overlay-${V()}`,e=z(),b=I(()=>e!==null?e.value===G.Open:S.popoverState.value===0);function l(){S.closePopover()}return()=>{let u={open:S.popoverState.value===0};return D({props:F(x({},a),{id:f,"aria-hidden":!0,onClick:l}),slot:u,attrs:r,slots:v,features:j.RenderStrategy|j.Static,visible:b.value,name:"PopoverOverlay"})}}}),Te=C({name:"PopoverPanel",props:{as:{type:[Object,String],default:"div"},static:{type:Boolean,default:!1},unmount:{type:Boolean,default:!0},focus:{type:Boolean,default:!1}},setup(a,{attrs:r,slots:v,expose:S}){var f,e;let{focus:b}=a,l=H("PopoverPanel"),u=I(()=>L(l.panel));S({el:l.panel,$el:l.panel}),N(le,l.panelId),fe(()=>{l.panel.value=null}),W(()=>{var t,p;if(!b||l.popoverState.value!==0||!l.panel)return;let i=(t=u.value)==null?void 0:t.activeElement;(p=n(l.panel))!=null&&p.contains(i)||$(n(l.panel),w.First)}),K((f=u.value)==null?void 0:f.defaultView,"keydown",t=>{var p,i,g;if(l.popoverState.value!==0||!n(l.panel)||t.key!==O.Tab||!((p=u.value)!=null&&p.activeElement)||!((i=n(l.panel))!=null&&i.contains(u.value.activeElement)))return;t.preventDefault();let E=$(n(l.panel),t.shiftKey?w.Previous:w.Next);if(E===R.Underflow)return(g=n(l.button))==null?void 0:g.focus();if(E===R.Overflow){if(!n(l.button))return;let c=M(u.value.body),o=c.indexOf(n(l.button)),d=c.splice(o+1).filter(y=>{var k;return!((k=n(l.panel))!=null&&k.contains(y))});$(d,w.First)===R.Error&&$(u.value.body,w.First)}}),K((e=u.value)==null?void 0:e.defaultView,"focus",()=>{var t,p;!b||l.popoverState.value===0&&(!n(l.panel)||((t=u.value)==null?void 0:t.activeElement)&&((p=n(l.panel))==null?void 0:p.contains(u.value.activeElement))||l.closePopover())},!0);let P=z(),m=I(()=>P!==null?P.value===G.Open:l.popoverState.value===0);function s(t){var p,i;switch(t.key){case O.Escape:if(l.popoverState.value!==0||!n(l.panel)||u.value&&!((p=n(l.panel))!=null&&p.contains(u.value.activeElement)))return;t.preventDefault(),t.stopPropagation(),l.closePopover(),(i=n(l.button))==null||i.focus();break}}return()=>{let t={open:l.popoverState.value===0,close:l.close},p={ref:l.panel,id:l.panelId,onKeydown:s};return D({props:x(x({},a),p),slot:t,attrs:r,slots:v,features:j.RenderStrategy|j.Static,visible:m.value,name:"PopoverPanel"})}}}),Fe=C({name:"PopoverGroup",props:{as:{type:[Object,String],default:"div"}},setup(a,{attrs:r,slots:v,expose:S}){let f=h(null),e=h([]),b=I(()=>L(f));S({el:f,$el:f});function l(s){let t=e.value.indexOf(s);t!==-1&&e.value.splice(t,1)}function u(s){return e.value.push(s),()=>{l(s)}}function P(){var s;let t=b.value;if(!t)return!1;let p=t.activeElement;return(s=n(f))!=null&&s.contains(p)?!0:e.value.some(i=>{var g,E;return((g=t.getElementById(i.buttonId))==null?void 0:g.contains(p))||((E=t.getElementById(i.panelId))==null?void 0:E.contains(p))})}function m(s){for(let t of e.value)t.buttonId!==s&&t.close()}return N(ee,{registerPopover:u,unregisterPopover:l,isFocusWithinPopoverGroup:P,closeOthers:m}),()=>D({props:F(x({},a),{ref:f}),slot:{},attrs:r,slots:v,name:"PopoverGroup"})}});export{Pe as Popover,De as PopoverButton,Fe as PopoverGroup,Ce as PopoverOverlay,Te as PopoverPanel};