
/* global QUESTIONS */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  pool: [],
  idx: 0,
  good: 0,
  bad: 0,
  started: false,
  answerVisible: false,
};

function uniq(arr){ return Array.from(new Set(arr)); }

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function buildFilters(){
  const pages = uniq(QUESTIONS.map(q=>q.page)).sort((a,b)=>a-b);
  const sel = $("#pageFilter");
  pages.forEach(p=>{
    const opt=document.createElement("option");
    opt.value=String(p);
    opt.textContent=`Страница ${p}`;
    sel.appendChild(opt);
  });
}

function applyFilters(){
  const q = $("#search").value.trim().toLowerCase();
  const pageVal = $("#pageFilter").value;
  const onlyImg = $("#onlyWithImages").checked;

  let pool = QUESTIONS.slice();

  if(pageVal !== "all"){
    pool = pool.filter(x=>String(x.page)===pageVal);
  }
  if(onlyImg){
    pool = pool.filter(x=>x.img);
  }
  if(q){
    pool = pool.filter(x => (x.question + " " + (x.answer||"")).toLowerCase().includes(q));
  }

  if($("#shuffle").checked){
    pool = shuffle(pool);
  }

  state.pool = pool;
  state.idx = 0;
  state.good = 0;
  state.bad = 0;
  state.started = pool.length > 0;
  state.answerVisible = !$("#hideAnswer").checked;

  render();
}

function current(){
  return state.pool[state.idx] || null;
}

function setAnswerVisibility(visible){
  state.answerVisible = visible;
  renderAnswer();
}

function renderAnswer(){
  const item = current();
  const a = $("#aText");
  const btn = $("#toggleAnswer");

  if(!item){
    a.textContent = "—";
    btn.textContent = "Показать";
    return;
  }

  const has = (item.answer || "").trim().length > 0;
  if(!has){
    a.textContent = "Ответ в файле (на странице).";
    btn.textContent = "Показать";
    btn.disabled = true;
    return;
  }
  btn.disabled = false;

  if(state.answerVisible){
    a.textContent = item.answer;
    btn.textContent = "Скрыть";
  }else{
    a.textContent = "••••••••••";
    btn.textContent = "Показать";
  }
}

function render(){
  const item = current();

  $("#statIndex").textContent = state.started ? `${state.idx+1}/${state.pool.length}` : "—";
  $("#statGood").textContent = String(state.good);
  $("#statBad").textContent = String(state.bad);

  const progress = state.started ? ((state.idx)/Math.max(1,state.pool.length))*100 : 0;
  $("#progress").style.width = `${Math.min(100, Math.max(0, progress))}%`;
  $("#progressText").textContent = state.started ? `${state.idx}/${state.pool.length}` : "—";

  if(!item){
    $("#pillMeta").textContent = state.started ? "Нет вопросов по фильтру" : "—";
    $("#qText").textContent = state.started ? "Попробуй снять фильтры" : "Нажми “Начать”";
    $("#imgWrap").classList.add("hidden");
    $("#btnGood").disabled = true;
    $("#btnBad").disabled = true;
    $("#btnOpenPage").disabled = true;
    $("#toggleAnswer").disabled = true;
    $("#aText").textContent = "—";
    return;
  }

  $("#btnGood").disabled = false;
  $("#btnBad").disabled = false;
  $("#btnOpenPage").disabled = false;

  $("#pillMeta").textContent = `ID ${item.id} • Страница ${item.page}`;
  $("#qText").textContent = item.question;

  // question image
  if(item.img){
    $("#imgWrap").classList.remove("hidden");
    $("#qImg").src = item.img;
  }else{
    $("#imgWrap").classList.add("hidden");
    $("#qImg").removeAttribute("src");
  }

  renderAnswer();
}

function next(){
  if(!state.started) return;
  if(state.idx < state.pool.length-1){
    state.idx += 1;
    // reset answer visibility if hideAnswer mode
    state.answerVisible = !$("#hideAnswer").checked;
    render();
  }else{
    // finish
    $("#progress").style.width = "100%";
    $("#progressText").textContent = `${state.pool.length}/${state.pool.length}`;
    $("#qText").textContent = `Готово ✅  Правильно: ${state.good}, Ошибки: ${state.bad}`;
    $("#pillMeta").textContent = "Финиш";
    $("#imgWrap").classList.add("hidden");
    $("#aText").textContent = "Можешь нажать “Начать” ещё раз или поменять фильтры.";
    $("#toggleAnswer").disabled = true;
    $("#btnGood").disabled = true;
    $("#btnBad").disabled = true;
  }
}

function openPage(){
  const item = current();
  if(!item) return;
  $("#pageImg").src = item.pageImg;
  $("#modalTitle").textContent = `Страница ${item.page}`;
  $("#pageModal").classList.remove("hidden");
}

function closeModal(){
  $("#pageModal").classList.add("hidden");
  $("#pageImg").removeAttribute("src");
}

function initTabs(){
  $$(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      $$(".tab").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      if(view==="quiz"){
        $("#quizView").classList.remove("hidden");
        $("#pagesView").classList.add("hidden");
      }else{
        $("#quizView").classList.add("hidden");
        $("#pagesView").classList.remove("hidden");
      }
    });
  });
}

function buildPagesView(){
  const grid = $("#pagesGrid");
  grid.innerHTML = "";
  const pages = uniq(QUESTIONS.map(q=>q.page)).sort((a,b)=>a-b);
  pages.forEach(p=>{
    const card=document.createElement("div");
    card.className="pageCard";
    const img=document.createElement("img");
    img.loading="lazy";
    img.src = QUESTIONS.find(x=>x.page===p).pageImg;
    img.alt = `Страница ${p}`;
    img.title = `Страница ${p}`;
    img.addEventListener("click", ()=>{
      $("#pageImg").src = img.src;
      $("#modalTitle").textContent = `Страница ${p}`;
      $("#pageModal").classList.remove("hidden");
    });
    card.appendChild(img);
    grid.appendChild(card);
  });
}

function wire(){
  $("#start").addEventListener("click", applyFilters);
  $("#reset").addEventListener("click", ()=>{
    $("#search").value="";
    $("#pageFilter").value="all";
    $("#onlyWithImages").checked=false;
    $("#shuffle").checked=true;
    $("#hideAnswer").checked=true;
    applyFilters();
  });

  $("#toggleAnswer").addEventListener("click", ()=>{
    setAnswerVisibility(!state.answerVisible);
  });

  $("#btnGood").addEventListener("click", ()=>{
    state.good += 1;
    next();
  });
  $("#btnBad").addEventListener("click", ()=>{
    state.bad += 1;
    next();
  });

  $("#btnOpenPage").addEventListener("click", openPage);
  $("#closeModal").addEventListener("click", closeModal);
  $("#pageModal").addEventListener("click", (e)=>{
    if(e.target.id==="pageModal") closeModal();
  });

  // live filter preview (optional)
  $("#search").addEventListener("keydown", (e)=>{
    if(e.key==="Enter") applyFilters();
  });
}

buildFilters();
buildPagesView();
initTabs();
wire();
render();
