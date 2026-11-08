/* Demonstração da agenda: faz o papel do Firebase, mas guarda tudo no próprio aparelho (localStorage).
   Na primeira abertura entra com os serviços de exemplo e alguns horários de exemplo.
   Na versão oficial, este arquivo sai e entra o Firebase (login + banco na nuvem), igual ao da Essence Glam. */
(function(){
  const KEY = "isabellafernanda.agenda.v1";
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  const dia = n => { const d = new Date(); d.setDate(d.getDate()+n); return ymd(d); };

  /* serviços que já vêm cadastrados; preço e tempo ela coloca em Ajustes */
  /* cuidados gerais de unha (texto de exemplo; ela muda em Ajustes) */
  const CUID = "• Nas primeiras horas, evite água quente e produto de limpeza.\n• Use luva pra lavar louça e fazer faxina.\n• Passe óleo de cutícula todo dia.\n• Não use a unha como ferramenta.";
  const CUID_GEL = CUID + "\n• Não puxe nem descasque o gel. Quando for tirar, me chama que eu removo sem estragar sua unha.";
  const sv = (id, nome, retornoDias, cuidados) => ({id, nome, profId: "isa", preco: null, duracao: null, retornoDias, cuidados: cuidados || CUID});
  function seed(){
    const cfg = {
      estudio: "Isabella Fernanda · Manicure e Pedicure",
      profissionais: [{id: "isa", nome: "Isabella Fernanda", area: "Manicure e pedicure", cor: "#B07F6E"}],
      servicos: [
        sv("s-mao", "Manicure", 15),
        sv("s-pe", "Pedicure", 15),
        sv("s-pemao", "Pé e mão", 15),
        sv("s-gel", "Esmaltação em gel", 21, CUID_GEL)
      ],
      reservaPct: 0,
      semProxima: "^$nenhum",
      proxDe: 7,
      proxAte: 15,
      domicilioServicos: "^$sem-domiciliar",
      taxas: {"Cartão de débito": {pct: 0, proxDiaUtil: true}, "Cartão de crédito": {pct: 0, proxDiaUtil: true}, "Link de pagamento (crédito)": {pct: 0, proxDiaUtil: true}}
    };
    const cli = (id, nome) => ({nome, telefone: "", obs: "Cliente de exemplo", criadoEm: dia(-40)});
    const ag = (cid, sid, nome, data, hora, status) => ({clienteId: cid, profId: "isa", divisao: [], servicos: [{id: sid, nome, preco: null, duracao: null}], servicoId: sid, servicoNome: nome, domicilio: null, data, hora, valor: null, duracao: null, obs: "", status, criadoEm: new Date().toISOString()});
    return {
      config: {geral: cfg},
      clientes: {}, agendamentos: {},
      caixa: {}, acompanhamentos: {}, reservas: {}, pedidos: {}
    };
  }
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY)); } catch(e){}
  if (!store || !store.config) store = seed();
  ["config","clientes","agendamentos","caixa","acompanhamentos","reservas","pedidos"].forEach(c => store[c] = store[c] || {});
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch(e){} };
  save();

  const subs = []; let n = 0;
  const notify = () => { save(); setTimeout(() => subs.forEach(f => f()), 0); };
  const clone = d => JSON.parse(JSON.stringify(d === undefined ? null : d));
  const novoId = () => Date.now().toString(36) + (++n).toString(36) + Math.random().toString(36).slice(2, 6);
  function docRef(c, id){ return { id,
    set: async d => { store[c][id] = clone(d); notify(); },
    update: async d => { store[c][id] = {...store[c][id], ...clone(d)}; notify(); },
    delete: async () => { delete store[c][id]; notify(); },
    get: async () => ({exists: !!store[c][id], data: () => store[c][id]}),
    onSnapshot: cb => { const f = () => cb({exists: !!store[c][id], data: () => store[c][id]}); subs.push(f); f(); return () => {}; } }; }
  function q(c, filt){ return {
    doc: id => docRef(c, id || novoId()), orderBy: () => q(c, filt), limit: () => q(c, filt),
    where: (k, op, v) => q(c, d => d[k] === v),
    get: async () => ({docs: Object.entries(store[c]).map(([i, d]) => ({id: i, data: () => d}))}),
    onSnapshot: cb => { const f = () => cb({docs: Object.entries(store[c]).filter(([i, d]) => !filt || filt(d)).map(([i, d]) => ({id: i, data: () => d}))}); subs.push(f); f(); return () => {}; } }; }
  const db = { collection: c => q(c), doc: p => { const [c, i] = p.split("/"); return docRef(c, i); }, settings(){}, enablePersistence: async () => {},
    batch(){ const ops = []; return {set: (r, d) => ops.push(() => r.set(d)), commit: async () => { for (const o of ops) await o(); }}; } };
  const auth = { setPersistence: async () => {}, onAuthStateChanged: cb => setTimeout(() => cb({email: "demonstração"}), 0), signOut: async () => {},
    signInWithEmailAndPassword: async () => {}, sendPasswordResetEmail: async () => {} };
  window.firebase = { initializeApp(){}, auth: Object.assign(() => auth, {Auth: {Persistence: {LOCAL: 1}}}), firestore: () => db };
  window.__DEMO = true;
  window.__demoReset = () => { try { localStorage.removeItem(KEY); } catch(e){} location.reload(); };
})();
