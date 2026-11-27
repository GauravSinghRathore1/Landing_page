'use strict';

const rooms = {
  lobby: { name: 'Lobby', icon: '🛎️', exits: ['dining', 'pantry'] },
  dining: { name: 'Dining room', icon: '🍽️', exits: ['lobby', 'kitchen'] },
  pantry: { name: 'Pantry', icon: '🧀', exits: ['lobby', 'kitchen'] },
  kitchen: { name: 'Kitchen', icon: '🥖', exits: ['dining', 'pantry'] }
};
const roles = {
  mouth: { name: 'Mouth', hint: 'Talk your way out of trouble. Distract the staff before you grab the bread.' },
  paws: { name: 'Paws', hint: 'Grab the basket in the kitchen. Once you have it, tuck it into the coat to calm things down.' },
  legs: { name: 'Legs', hint: 'Move the whole coat. Every move through the dining room draws extra attention.' }
};
const el = id => document.getElementById(id);
let state;

function reset() {
  state = { room: 'lobby', role: 'legs', heat: 0, turns: 11, bread: false, tucked: false, bluff: false, unattended: 0, outcome: '', log: 'The reservation is under “Mr. Human.” Pick a raccoon and make your move.' };
  render();
}

function act(id, target) {
  if (state.outcome) return;
  let message;
  switch (id) {
    case 'move':
      if (!rooms[state.room].exits.includes(target)) return;
      if (state.room === 'dining' || target === 'dining') state.heat++;
      state.room = target;
      message = 'The coat waddles into the ' + rooms[target].name.toLowerCase() + '.';
      break;
    case 'talk':
      state.heat -= 3;
      state.bluff = true;
      message = '“I’m a food critic.” The staff stops looking directly at your coat.';
      break;
    case 'grab':
      state.bread = true;
      state.heat += state.bluff ? 1 : 3;
      state.bluff = false;
      message = 'Paws swipes the entire basket. Subtlety was never on the menu.';
      break;
    case 'tuck':
      state.tucked = true;
      state.heat -= 2;
      message = 'Paws hides the basket. The coat now smells suspiciously like a bakery.';
      break;
    case 'leave':
      state.outcome = 'win';
      break;
  }

  state.turns--;
  if (state.outcome !== 'win') {
    if (state.role === 'legs') {
      state.unattended = 0;
    } else if (++state.unattended === 2) {
      state.unattended = 0;
      state.heat += 2;
      message += ' Legs starts tap dancing. The staff notices.';
    }
    if (state.bread && !state.tucked && id !== 'grab') {
      state.heat++;
      message += ' Crumbs spill from the coat.';
    }
    state.heat = Math.max(0, Math.min(8, state.heat));
    if (state.heat === 8) state.outcome = 'caught';
    else if (state.turns === 0) state.outcome = 'closed';
  }

  state.log = {
    win: 'Heist complete. Three raccoons, one basket, zero reservations for next time.',
    caught: 'Busted. The maître d’ counted six feet.',
    closed: 'Closing time. The staff found three raccoons hiding in a coat.'
  }[state.outcome] ?? message;
  render();
  (state.outcome ? el('reset') : el('roles').querySelector('[aria-pressed=true]')).focus();
}

function addAction(label, id, target) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', () => act(id, target));
  el('actions').append(button);
}

function render() {
  el('heat').textContent = state.heat + ' / 8';
  el('meter').value = state.heat;
  el('bread').textContent = state.bread ? (state.tucked ? 'Hidden' : 'Stolen') : 'Unclaimed';
  el('turns').textContent = state.turns;
  el('location').textContent = 'You’re in the ' + rooms[state.room].name.toLowerCase();
  el('log').textContent = state.log;
  for (const tile of el('map').children) {
    const active = tile.dataset.room === state.room;
    tile.classList.toggle('active', active);
    tile.querySelector('b').hidden = !active;
  }
  for (const button of el('roles').children) {
    button.setAttribute('aria-pressed', String(button.dataset.role === state.role));
    button.disabled = Boolean(state.outcome);
  }
  el('hint').textContent = state.outcome ? 'Start a new heist to play again.' : roles[state.role].hint;
  el('actions').replaceChildren();
  if (state.outcome) return;
  if (state.role === 'legs') {
    for (const target of rooms[state.room].exits) addAction('Go to ' + rooms[target].name.toLowerCase(), 'move', target);
    if (state.room === 'lobby' && state.bread) addAction('Make your escape', 'leave');
  }
  if (state.role === 'mouth') addAction('Bluff the staff', 'talk');
  if (state.role === 'paws') {
    if (state.room === 'kitchen' && !state.bread) addAction('Grab the basket', 'grab');
    if (state.bread && !state.tucked) addAction('Hide the basket', 'tuck');
    if (!el('actions').childElementCount) el('hint').textContent = state.tucked ? 'The basket is hidden. Switch to Legs to get out.' : 'The basket is in the kitchen. Switch to Legs to get there.';
  }
}

for (const [id, room] of Object.entries(rooms)) {
  const tile = document.createElement('div');
  tile.dataset.room = id;
  tile.className = 'tile';
  tile.innerHTML = '<span aria-hidden="true">' + room.icon + '</span><span>' + room.name + '</span><b aria-hidden="true">🦝</b>';
  el('map').append(tile);
}
for (const [id, role] of Object.entries(roles)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.role = id;
  button.textContent = role.name;
  button.addEventListener('click', () => {
    state.role = id;
    render();
  });
  el('roles').append(button);
}
el('reset').addEventListener('click', reset);
reset();
