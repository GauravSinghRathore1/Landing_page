'use strict';

const pick = items => items[Math.floor(Math.random() * items.length)];
const shuffle = items => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const action = (label, run, disabled = false, primary = false) => ({ label, run, disabled, primary });
const row = (title, detail) => [title, detail];
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

const town = {
  title: 'The Town That Copies You',
  intro: 'Steal the mayor’s trophy. Record up to ten moves on rehearsal day. On heist day, a resident repeats them one turn at a time.',
  start: () => ({ day: 1, turn: 0, position: [0, 2], echo: [0, 2], tape: [], trophy: false, crate: false, msg: 'Try recording a route to the square pressure plate or the cellar latch.' }),
  view(s) {
    const gate = s.crate || same(s.echo, [2, 1]);
    const cellar = same(s.echo, [2, 3]);
    const layout = [
      ['Wall', 'Roof', 'Roof', 'Vault', 'Wall'],
      ['Lane', 'Crate', 'Plate', 'Gate', 'Hall'],
      ['Exit', 'Square', 'Square', 'Wall', 'Hall'],
      ['Lane', 'Alley', 'Latch', 'Cellar', 'Hall'],
      ['Wall', 'Wall', 'Wall', 'Wall', 'Wall']
    ];
    const pass = ([x, y]) => {
      const tile = layout[y]?.[x];
      if (!tile || tile === 'Wall') return false;
      if (tile === 'Gate') return s.day === 2 && gate;
      if (tile === 'Cellar') return s.day === 2 && cellar;
      if (tile === 'Roof') return s.day === 2 && same(s.echo, [1, 3]);
      return s.day === 2 || x < 3;
    };
    const move = target => {
      s.position = target;
      step();
    };
    const step = () => {
      s.turn++;
      if (s.day === 1) {
        s.tape.push([...s.position]);
        s.msg = 'Recorded ' + s.turn + '/10. The resident will replay every step and wait.';
      } else {
        s.echo = s.tape[(s.turn - 1) % s.tape.length];
        s.msg = 'The resident repeats move ' + ((s.turn - 1) % s.tape.length + 1) + '.';
        if (s.trophy && same(s.position, [0, 2])) s.end = 'Trophy stolen. Tomorrow the whole town will know how you did it.';
        else if (s.turn === 20) s.end = 'The mayor caught you after curfew.';
      }
    };
    const [x,y] = s.position;
    const moves = [['North',0,-1],['West',-1,0],['South',0,1],['East',1,0]].map(([name,dx,dy]) => {
      const target = [x+dx,y+dy];
      return action(name, () => move(target), !pass(target) || (s.day === 1 && s.turn === 10));
    });
    moves.push(action('Wait', step, s.day === 1 && s.turn === 10));
    if (s.day === 1) moves.push(action('Start heist day', () => {
      Object.assign(s, { day: 2, turn: 0, position: [0,2], msg: 'Open the gate with the Plate, Cellar with the Latch, or Roof with the Alley. Each opens while the resident stands there.' });
    }, !s.tape.length, true));
    if (s.day === 2 && same(s.position,[1,1]) && !s.crate) moves.push(action('Wedge crate on plate', () => {
      s.crate = true; step(); s.msg = 'The crate holds the gate open.';
    }));
    if (s.day === 2 && same(s.position,[3,0]) && !s.trophy) moves.push(action('Take trophy', () => {
      s.trophy = true; step(); s.msg = 'You have the trophy. Get back to the Exit.';
    }, false, true));
    return {
      stats: [row('Day', s.day), row('Turn', s.turn + '/' + (s.day === 1 ? 10 : 20)), row('Trophy', s.trophy ? 'Stolen' : 'In vault')],
      map: layout.flatMap((line, j) => line.map((label,i) => ({ label, blocked: !pass([i,j]), player: same(s.position,[i,j]), echo: s.day === 2 && same(s.echo,[i,j]) }))),
      heading: 'Town square', help: '◆ You · ◇ Resident. A resident can open a route for one turn per recorded stop. The crate beside the plate can keep the gate open.', actions: moves
    };
  }
};

const haunted = {
  title: 'Haunted Mall After Hours',
  intro: 'Survive four lockdown votes. Possess mall fixtures, tamper with security footage, and make the mannequin look guilty.',
  start: () => ({ shift: 1, move: 0, ghost: 0, mannequin: 0, camera: true, evidence: [], scares:0, witness: pick(['Guard','Cleaner','Manager']), last: '', msg: 'Use a fixture at least once each shift or the mall loses its haunted reputation.' }),
  view(s) {
    const fixtures = { vending: 'Vending machine rattled', escalator: 'Escalator reversed', speaker: 'The speakers whispered a coupon code' };
    const doMove = (id, title) => {
      let note = title;
      if (id in fixtures) {
        s.scares++;
        s.ghost += s.camera ? 2 : 1;
        if (id === 'vending' && s.witness === 'Cleaner') { s.ghost++; note += '. The cleaner saw it happen'; }
        if (s.last === id) { s.ghost++; note += '. The crew recognized the pattern'; }
      }
      if (id === 'loop') { s.camera = false; if (s.witness === 'Guard') { s.ghost++; note += '. The guard noticed the repeated footage'; } }
      if (id === 'frame') { s.mannequin += s.camera ? 3 : 2; if (s.witness === 'Manager') s.mannequin--; }
      if (id === 'hide') s.ghost = Math.max(0,s.ghost - 2);
      s.last = id;
      s.evidence.unshift(note);
      s.evidence = s.evidence.slice(0,6);
      s.msg = note + '.';
      if (++s.move === 2) {
        if (!s.scares) { s.end = 'Too quiet. The owners renovated your haunted shop into a smoothie bar.'; return; }
        if (s.ghost >= 4 && s.ghost >= s.mannequin) { s.end = 'Lockdown vote lost. Security sealed your haunted shop.'; return; }
        if (s.shift === 4) { s.end = 'You made it to sunrise. The mannequin has requested a lawyer.'; return; }
        s.shift++; s.move = 0; s.camera = true; s.scares = 0;
        const suspect = s.mannequin > s.ghost ? 'The mannequin takes the blame.' : 'The vote ends without a lockdown.';
        s.ghost = Math.max(0,s.ghost - 1);
        s.mannequin = Math.max(0,s.mannequin - 2);
        s.witness = pick(['Guard','Cleaner','Manager'].filter(name=>name!==s.witness));
        s.msg += ' ' + suspect + ' The ' + s.witness.toLowerCase() + ' is watching next.';
      }
    };
    return {
      stats: [row('Shift',s.shift+'/4'),row('Moves left',2-s.move),row('Haunting',s.scares?'Done':'Required'),row('Ghost suspicion',s.ghost),row('Mannequin suspicion',s.mannequin),row('Camera',s.camera?'Live':'Looped')],
      heading:'Security notes', items:[row('Witness',s.witness+' is on patrol.'),...s.evidence.map(note=>row('Report',note))],
      help:'Haunt a fixture each shift. At four suspicion or higher, you lose a vote if the mannequin has no more suspicion than you. The guard spots footage loops. The cleaner watches the vending machine. The manager mistrusts mannequin sightings.',
      actions:Object.entries(fixtures).map(([id,note])=>action('Possess '+({vending:'vending machine',escalator:'escalator',speaker:'speakers'}[id]),()=>doMove(id,note))).concat([
        action('Loop security footage',()=>doMove('loop','The camera feed looped'),!s.camera),
        action('Frame mannequin',()=>doMove('frame','A witness saw the mannequin move')),
        action('Hide in lost and found',()=>doMove('hide','The mall went quiet'))
      ])
    };
  }
};

const landlordCards = {
  Rent: { text:'Collect rent from all tenants.', play:s=>{s.gold+=s.tenants.reduce((n,t)=>n+t.rent+(t.leak&&t.name==='Slime'?2:0),0);} },
  Repair: { text:'Fix the first leaky room and gain 1 reputation.', play:s=>{const room=s.tenants.find(t=>t.leak); if(room) room.leak=false; s.rep++;} },
  Curse: { text:'Gain 5 gold. Lose 1 reputation.', play:s=>{s.gold+=5;s.rep--;} },
  Inspection: { text:'Gain 2 reputation if no one is upset by a leak.', play:s=>{s.rep+=s.tenants.some(t=>t.leak&&t.name!=='Slime')?0:2;} },
  Boards: { text:'Board up the windows. Vampires pay 2 extra gold each week.', play:s=>{s.boards=true;} },
  Fundraiser: { text:'Gain gold equal to reputation.', play:s=>{s.gold+=s.rep;} },
  'Free Snacks': { text:'Gain 2 reputation and pay 2 gold.', play:s=>{s.gold-=2;s.rep+=2;} }
};
const tenants = [{name:'Slime',rent:2},{name:'Vampire',rent:3},{name:'Ogre',rent:4},{name:'Mimic',rent:3},{name:'Goblin',rent:2}];
function drawHand(s) {
  s.hand = [];
  while (s.hand.length < 4) {
    if (!s.deck.length) { s.deck = shuffle(s.discard); s.discard = []; }
    s.hand.push(s.deck.pop());
  }
}
const landlord = {
  title:'Dungeon Landlord',
  intro:'Keep your monster tenants happy and finish six weeks with at least 15 gold. Play two cards each week and add new cards to your deck along the way.',
  start() {
    const s = { week:1,gold:9,rep:4,plays:2,boards:false,deck:shuffle(['Rent','Rent','Repair','Repair','Curse','Inspection','Boards','Fundraiser']),discard:[],tenants:shuffle(tenants).slice(0,3).map(t=>({...t,leak:false})),offers:[],msg:'The dungeon is open for business.' };
    s.tenants[0].leak=true; drawHand(s);return s;
  },
  view(s) {
    const next = card => {
      if (card) s.discard.push(card);
      s.offers = [];
      s.week++; s.plays=2;
      pick(s.tenants).leak = true;
      drawHand(s);
      s.msg = 'A pipe burst overnight.';
    };
    const endWeek = () => {
      s.gold -= 4;
      if(s.boards) s.gold += 2*s.tenants.filter(t=>t.name==='Vampire').length;
      s.rep -= s.tenants.filter(t=>t.leak&&t.name!=='Slime').length;
      if(s.rep<=0||s.gold<0) s.end='The tenants changed the locks. Your landlord career is over.';
      else if(s.week===6) s.end=s.gold>=15?'You kept the dungeon and paid off the mortgage.':'The dungeon survived, but you came up short on the mortgage.';
      else { s.discard.push(...s.hand); s.hand=[]; s.offers=shuffle(Object.keys(landlordCards)).slice(0,3); s.msg='Weekly upkeep paid. Pick a card to add to your discard pile.'; }
    };
    return {
      stats:[row('Week',s.week+'/6'),row('Gold',s.gold),row('Reputation',s.rep),row('Plays left',s.plays)],
      heading:'Occupied rooms',
      items:[...s.tenants.map(t=>row(t.name,(t.leak?'Leaky · ':'Dry · ')+t.rent+' base rent'+(t.name==='Vampire'&&s.boards?' · Boarded windows':''))),...s.hand.map(card=>row(card,landlordCards[card].text)),...s.offers.map(card=>row(card,landlordCards[card].text))],
      help: s.offers.length ? 'Draft one card or skip. Your discard pile reshuffles when the draw pile runs out.' : 'Upkeep costs 4 gold. Each non-Slime tenant with a leak costs 1 reputation.',
      actions:s.offers.length ? [...s.offers.map(card=>action('Draft '+card,()=>next(card))),action('Skip draft',()=>next())] : [
        ...s.hand.map((card,i)=>action('Play '+card,()=>{s.hand.splice(i,1);s.discard.push(card);s.plays--;landlordCards[card].play(s);s.msg=landlordCards[card].text;},!s.plays||(card==='Free Snacks'&&s.gold<2))),
        action('End week',endWeek,false,true)
      ]
    };
  }
};

const deliveryRoutes = [
  { name:'Market', road:[['Broad avenue',0],['Produce stand',2],['Market straight',0],['Crowded corner',2],['Boulevard',0]] },
  { name:'Canal', road:[['Canal bend',1],['Old bridge',2],['Towpath',1],['Waterfront straight',0]] },
  { name:'Warehouse', road:[['Warehouse straight',0],['Loading ramp',2],['Back road',0],['Forklift crossing',2],['Overpass',1]] }
];
const delivery = {
  title:'Midnight Delivery League',
  intro:'Race a rival courier through a city that changes each night. Choose a route and decide how hard to take each turn. The wedding cake has to survive the ride.',
  start() {
    return { night:1, leg:0, speed:1, time:0, cake:100, straps:false, route:null, wins:0, rival:6, msg:'Choose a route and decide whether to strap down the cake.' };
  },
  view(s) {
    const drive = change => {
      const [name, sharpness] = s.route.road[s.leg++];
      s.speed = clamp(s.speed+change,1,3);
      s.time += 4-s.speed;
      const damage = sharpness ? Math.max(0, s.speed*s.speed*sharpness*3 - (s.straps?13:3)) : 0;
      s.cake = Math.max(0,s.cake-damage);
      s.msg = name+' cleared. '+(damage?damage+' points of cake damage.':'Cake intact.');
      if (s.cake===0) s.end='The cake is now frosting across the windshield.';
      else if(s.leg===s.route.road.length) {
        const win = s.time <= s.rival && s.cake >= 35;
        if(win) s.wins++;
        s.result = win?'You beat the rival and delivered an intact cake.':s.time>s.rival?'The rival arrived first.':'The customer rejected the battered cake.';
        s.msg += ' '+s.result;
        if(s.night===3) s.end = s.wins>=2?'League won. The bakery is naming a cake after your van.':'League finished. You won '+s.wins+' of three races.';
      }
    };
    const available = deliveryRoutes.filter((_,i)=>i!==((s.night+1)%3));
    const moves = s.result ? [action('Next night',()=>{
      Object.assign(s,{night:s.night+1,leg:0,speed:1,time:0,cake:100,straps:false,route:null,result:'',rival:s.night===2?8:6,msg:'The city has rerouted traffic. Pick tonight’s route.'});
    },false,true)] : !s.route ? [
      action(s.straps?'Remove straps (save 1 beat)':'Strap down cake (costs 1 beat)',()=>{s.straps=!s.straps;s.time=s.straps?1:0;}),
      ...available.map(route=>action('Drive via '+route.name,()=>{s.route=route;s.msg='You’re on the '+route.name.toLowerCase()+' route.';}))
    ] : [action('Brake',()=>drive(-1),s.speed===1),action('Coast',()=>drive(0)),action('Accelerate',()=>drive(1),s.speed===3,true)];
    return {
      stats:[row('Night',s.night+'/3'),row('Race wins',s.wins),row('Speed',s.speed+'/3'),row('Time',s.time+' / '+s.rival),row('Cake',s.cake+'%')],
      heading:s.route?s.route.name+' route':'Open routes',
      items:s.route?s.route.road.map(([name,turn],i)=>row((i<s.leg?'Passed · ':i===s.leg?'Next · ':'')+name,['Straight','Bend','Sharp turn'][turn])):available.map(route=>row(route.name,route.road.map(([_,turn])=>['straight','bend','sharp turn'][turn]).join(' · '))),
      help:'Fast driving saves time. Taking sharp turns at high speed damages the cake. Finish on or before the rival’s time with at least 35% cake intact.',
      actions:moves
    };
  }
};

const buildings = {
  Farm: { cost:3, detail:'Makes 4 food. Uses 1 power.' },
  Solar: { cost:3, detail:'Makes 4 power in sunlight, 1 in shadow.' },
  Housing: { cost:4, detail:'Adds space for 3 residents. Uses 1 power.' },
  Battery: { cost:4, detail:'Makes 2 power every week.' },
  Market: { cost:3, detail:'Earns 3 credits if the colony has no shortages. Uses 1 power.' },
  Parking: { cost:2, detail:'Adds 2 morale each week if the colony has no shortages.' }
};
const planet = {
  title:'Pocket Planet, Big Problems',
  intro:'Build a colony across six orbital zones. Grow to eight residents and keep morale above zero for eight weeks. The sun moves every week, and everyone wants moon parking.',
  start:()=>({week:1,credits:8,people:3,morale:6,zones:['Farm','Solar','Housing',null,null,null],slot:3,msg:'Pick a zone and choose a project. The first three zones are in sunlight.'}),
  view(s) {
    const sun = i => ((i-(s.week-1)%6+6)%6)<3;
    const count = type => s.zones.filter(z=>z===type).length;
    const food = 1+4*count('Farm');
    const power = 1+2*count('Battery')+s.zones.reduce((n,z,i)=>n+(z==='Solar'?(sun(i)?4:1):0),0);
    const load = count('Farm')+count('Housing')+count('Market');
    const capacity = 2+3*count('Housing');
    function advance() {
      const shortage = Math.max(0,s.people-food)+Math.max(0,load-power);
      s.credits += 2 + (shortage?0:3*count('Market'));
      if(shortage) s.morale -= Math.min(4,shortage);
      else {
        s.morale=Math.min(10,s.morale+1+2*count('Parking'));
        if(s.people<capacity&&s.people<food) s.people++;
      }
      if(s.morale<=0) s.end='The colony voted to leave orbit.';
      else if(s.week===8) s.end=s.people>=8?'Colony thriving. The moon has officially become a parking lot.':'The colony survived, but fell short of eight residents.';
      else {
        s.week++;
        s.msg=shortage?'Shortages hit morale. Check the next sunlight band.':'The week went smoothly. The sunlight band has moved.';
      }
    }
    return {
      stats:[row('Week',s.week+'/8'),row('Credits',s.credits),row('Residents',s.people+'/'+capacity),row('Morale',s.morale),row('Food',food+'/'+s.people),row('Power',power+'/'+load)],
      heading:'Orbital zones',
      items:s.zones.map((z,i)=>row((i===s.slot?'Selected · ':'')+'Zone '+(i+1)+' · '+(sun(i)?'Sun':'Shadow'),z ? z+' · '+buildings[z].detail : 'Empty')),
      help:'Select a zone to build or redevelop. Replacing a building costs full price. Food feeds one resident per unit, and power runs buildings across the planet.',
      actions:[...s.zones.map((_,i)=>action('Select zone '+(i+1),()=>{s.slot=i;},s.slot===i)),...Object.entries(buildings).map(([name,b])=>action(name+' · '+b.cost,()=>{s.zones[s.slot]=name;s.credits-=b.cost;s.msg=name+' built in zone '+(s.slot+1)+'.';},s.credits<b.cost||s.zones[s.slot]===name)),action('Advance week',advance,false,true)]
    };
  }
};

const games = { 'town-that-copies-you':town, 'haunted-mall':haunted, 'dungeon-landlord':landlord, 'midnight-delivery':delivery, 'pocket-planet':planet };
const game = games[document.body.dataset.game];
const get = id => document.getElementById(id);
let state;
function make(tag,text,cls) {
  const el = document.createElement(tag);
  el.textContent = text;
  if(cls) el.className = cls;
  return el;
}
function reset() {
  state = game.start();
  render();
}
function render() {
  const data = game.view(state);
  get('hud').replaceChildren(...data.stats.map(([label,value])=>{
    const stat=make('span',label+' ');
    stat.append(make('strong',value)); return stat;
  }));
  get('board-title').textContent=data.heading;
  const board = get('board');
  board.replaceChildren();
  if(data.map) {
    const grid = make('div','','map');
    data.map.forEach(tile=>{
      const el=make('div','',['tile',tile.player?'player':'',tile.echo?'echo':'',tile.blocked?'blocked':''].join(' '));
      if(tile.player||tile.echo) el.append(make('b',(tile.player?'◆':'')+(tile.echo?'◇':'')));
      el.append(make('span',tile.label));
      grid.append(el);
    });
    board.append(grid);
  } else {
    const list=make('ul','','list');
    data.items.forEach(([title,detail])=>{
      const li=make('li','');
      li.append(make('strong',title),document.createTextNode(' · '+detail));
      list.append(li);
    });
    board.append(list);
  }
  get('help').textContent=data.help;
  const status=get('status');
  status.textContent=state.end||state.msg;
  status.classList.toggle('outcome',Boolean(state.end));
  const actions=get('actions');
  actions.replaceChildren();
  if(state.end) return;
  data.actions.forEach((item,index)=>{
    const button=make('button',item.label,item.primary?'primary':'');
    button.type='button';
    button.disabled=item.disabled;
    button.addEventListener('click',()=>{
      item.run();
      render();
      const sameButton=[...actions.children].find(el=>!el.disabled&&el.textContent===item.label);
      const adjacent=[...actions.children].slice(index).find(el=>!el.disabled);
      (sameButton||adjacent||actions.querySelector('button:not(:disabled)')||get('restart')).focus();
    });
    actions.append(button);
  });
}
get('intro').textContent=game.intro;
get('restart').addEventListener('click',()=>{
  reset();
  get('actions').querySelector('button:not(:disabled)')?.focus();
});
reset();
