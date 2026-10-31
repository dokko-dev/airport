import {create} from 'zustand';
export type Pocket='main'|'front'|'inner';
export type Phase='menu'|'prepare'|'handoff'|'search'|'result';
export const spaces:Record<Pocket,{name:string,size:[number,number,number],entry:[number,number],pos:[number,number,number]}>={
 main:{name:'메인 수납실',size:[1.7,.42,2.1],entry:[1.6,1.8],pos:[0,.35,-.12]},
 front:{name:'전면 보조 포켓',size:[1.3,.26,.75],entry:[1.2,.7],pos:[0,.75,1.65]},
 inner:{name:'안쪽 지퍼 포켓',size:[.85,.28,.65],entry:[.8,.6],pos:[0,.40,-.77]}
};
export const itemSize:[number,number,number]=[.64,.14,.38];
export function fits(p:Pocket,rotated:boolean){const [x,y,z]=rotated?[itemSize[2],itemSize[1],itemSize[0]]:itemSize;const s=spaces[p];return x<=s.size[0]&&y<=s.size[1]&&z<=s.size[2]&&x<=s.entry[0]&&z<=s.entry[1];}
export function zipCost(depth:number){return depth>=1&&depth<=3?depth:Infinity;}
type State={phase:Phase;seconds:number;points:number;depth:number;zip:boolean;flap:boolean;front:boolean;inner:boolean;layers:number;hidden:Pocket|null;rotated:boolean;color:string;selected:string|null;tool:'hand'|'light';moved:boolean;winner:string;message:string;history:number[];
 begin:()=>void;tick:()=>void;submit:()=>void;search:()=>void;add:()=>void;undo:()=>void;place:(p:Pocket)=>void;toggle:(p:'zip'|'flap'|'front'|'inner'|'layers')=>void;select:(id:string)=>void;seize:()=>void;patch:(s:Partial<State>)=>void;};
const initial={seconds:120,points:8,depth:0,zip:false,flap:false,front:false,inner:false,layers:0,hidden:null,rotated:false,color:'#c66b51',selected:null,tool:'hand' as const,moved:false,winner:'',message:'지퍼를 열고 덮개를 들어 내부를 확인하세요.',history:[] as number[]};
export const useGame=create<State>((set,get)=>({phase:'menu',...initial,
 patch:s=>set(s),begin:()=>set({...initial,phase:'prepare'}),
 tick:()=>{const s=get();if(s.phase!=='prepare'&&s.phase!=='search')return;if(s.seconds<=1){if(s.phase==='prepare')s.submit();else set({phase:'result',seconds:0,winner:'밀반입팀 승리',message:'검사 시간이 종료되었습니다.'});}else set({seconds:s.seconds-1});},
 submit:()=>{const s=get();set({phase:'handoff',hidden:s.hidden??'main',zip:false,flap:false,front:false,inner:false,layers:0,selected:null,moved:false,tool:'hand',message:''});},
 search:()=>set({phase:'search',seconds:90,message:'가방을 직접 열고 의심스러운 물품을 조사하세요.'}),
 add:()=>{const s=get(),cost=zipCost(s.depth+1);if(!s.flap)return set({message:'먼저 메인 덮개를 여세요.'});if(s.points<cost||s.depth>=3)return set({message:'포인트 또는 최대 깊이 제한에 도달했습니다.'});set({history:[...s.history,s.depth],depth:s.depth+1,points:s.points-cost,message:'안쪽 포켓에 실제 천 덮개와 지퍼가 추가되었습니다.'});},
 undo:()=>{const s=get();if(!s.history.length)return;set({depth:s.depth-1,points:s.points+s.depth,history:s.history.slice(0,-1),layers:Math.min(s.layers,s.depth-1)});},
 place:p=>{const s=get();if(!s.flap||p==='front'&&!s.front||p==='inner'&&(!s.inner||s.layers<s.depth))return set({message:'배치할 공간의 지퍼와 덮개를 모두 여세요.'});if(!fits(p,s.rotated))return set({message:'물품이 입구 또는 수납공간보다 큽니다. 회전하거나 다른 공간을 선택하세요.'});set({hidden:p,message:`${spaces[p].name}에 물품을 배치했습니다.`});},
 toggle:p=>{const s=get();if(p==='zip')set({zip:!s.zip,flap:false,inner:false,layers:0});if(p==='flap'){if(!s.zip)return set({message:'메인 지퍼를 먼저 여세요.'});set({flap:!s.flap,inner:false,layers:0});}if(p==='front')set({front:!s.front});if(p==='inner'&&s.flap)set({inner:!s.inner,layers:0});if(p==='layers'&&s.inner&&s.layers<s.depth)set({layers:s.layers+1});set({selected:null});},
 select:id=>{const s=get();if(s.phase==='search'&&id==='device'&&s.hidden==='inner'&&(!s.flap||!s.inner||s.layers<s.depth))return;set({selected:id,message:id==='device'?'가상 전자 장치 · 선택됨. 압수 여부를 판단하세요.':'일반 소지품 · 들어 올려 아래를 확인할 수 있습니다.'});},
 seize:()=>{if(get().selected!=='device')return set({message:'일반 소지품입니다. 압수할 수 없습니다.'});set({phase:'result',winner:'수색팀 승리',message:'가상 금지 물품 1개를 모두 발견했습니다.'});}
}));
