let pid="";
let data=[];

/* ---------- utils ---------- */
const wait = ms => new Promise(r=>setTimeout(r,ms));

function shuffle(a){
return a.sort(()=>Math.random()-0.5);
}

/* ---------- start ---------- */
async function start(){

pid=document.getElementById("pid").value.trim();
if(!pid){alert("请输入ID");return;}

document.getElementById("startPage").style.display="none";

await goNoGo();
await stroop();
await digitSpan();

exportCSV();
}

/* =========================
   GO / NO-GO
========================= */

async function goNoGo(){

let training = shuffle([
...Array(7).fill("orange"),
...Array(3).fill("blue")
]);

await runBlock(training,"training");

let test = shuffle([
...Array(30).fill("orange"),
...Array(10).fill("blue")
]);

await runBlock(test,"test");
}

async function runBlock(trials,phase){

for(let i=0;i<trials.length;i++){

document.getElementById("fix").style.display="block";
await wait(500);
document.getElementById("fix").style.display="none";

let stim=document.getElementById("stim");
stim.style.display="block";
stim.style.background=trials[i];

let start=performance.now();
let resp="none";

let done=false;

await new Promise(res=>{

let t=setTimeout(()=>res(),1500);

document.onkeydown=e=>{
if(e.code==="Space"&&!done){
done=true;
resp="space";
clearTimeout(t);
res();
}
};

});

let rt = resp==="space"?performance.now()-start:"";

let correct =
(trials[i]==="orange" && resp==="space") ||
(trials[i]==="blue" && resp==="none");

data.push({
pid,task:"GoNoGo",phase,stimulus:trials[i],
response:resp,accuracy:correct?1:0,rt
});

stim.style.display="none";
document.onkeydown=null;

await wait(800);
}
}

/* =========================
   STROOP (ARROWS)
========================= */

async function stroop(){

let colors=[
{word:"红",color:"red",key:"ArrowLeft"},
{word:"蓝",color:"blue",key:"ArrowDown"},
{word:"绿",color:"green",key:"ArrowRight"}
];

let trials=[];

for(let i=0;i<15;i++){
let c=colors[i%3];
trials.push({...c,cond:"cong"});
trials.push({
word:c.word,
color:colors[(i+1)%3].color,
key:colors[(i+1)%3].key,
cond:"incong"
});
}

shuffle(trials);

for(let i=0;i<trials.length;i++){

let stim=document.getElementById("stim");
stim.style.display="block";
stim.style.background="white";

stim.innerHTML=
`<span style="color:${trials[i].color}">
${trials[i].word}
</span>`;

let start=performance.now();
let resp="none";
let done=false;

await new Promise(res=>{

let t=setTimeout(()=>res(),2000);

document.onkeydown=e=>{
if(["ArrowLeft","ArrowDown","ArrowRight"].includes(e.key)&&!done){
done=true;
resp=e.key;
clearTimeout(t);
res();
}
};

});

let rt = resp==="none"?"":performance.now()-start;

data.push({
pid,task:"Stroop",phase:"test",
stimulus:trials[i].word,
condition:trials[i].cond,
response:resp,
accuracy:resp===trials[i].key?1:0,
rt
});

stim.style.display="none";
document.onkeydown=null;

await wait(700);
}
}

/* =========================
   DIGIT SPAN (adaptive)
========================= */

function gen(n){
return Array.from({length:n},()=>Math.floor(Math.random()*9)+1);
}

async function digitSpan(){

let span=2;
let fail=0;

while(span<=15){

let correct=0;

for(let t=0;t<2;t++){

let seq=gen(span);

let stim=document.getElementById("stim");
stim.style.display="block";
stim.innerHTML=seq.join("");

await wait(2000);

stim.style.display="none";

let ans=prompt("请输入倒序数字：");

let correctAns=[...seq].reverse().join("");

let ok=ans===correctAns;

if(ok)correct++;

data.push({
pid,task:"DigitSpan",
span,trial:t+1,
stimulus:seq.join(""),
response:ans,
accuracy:ok?1:0
});

}

if(correct===0)fail++;
else fail=0;

if(fail>=2)break;

span++;
}
}

/* =========================
   CSV
========================= */

function exportCSV(){

let headers=Object.keys(data[0]);

let csv=headers.join(",")+"\n";

data.forEach(r=>{
csv+=headers.map(h=>r[h]??"").join(",")+"\n";
});

let blob=new Blob([csv],{type:"text/csv"});
let a=document.createElement("a");

a.href=URL.createObjectURL(blob);
a.download=pid+"_EF.csv";
a.click();
}
