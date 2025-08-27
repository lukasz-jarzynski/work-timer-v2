// Work-timer v6 fixed: correct month selection, proper edit behavior, nominal info
let entries = JSON.parse(localStorage.getItem('entries') || '[]');
let hourlyRate = parseFloat(localStorage.getItem('hourlyRate') || '0');
let onAccount = parseFloat(localStorage.getItem('onAccount') || '0');
let editingId = null;

// current month shown (value as "YYYY-MM")
let now = new Date();
let currentMonthVal = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

window.addEventListener('load', () => {
  populateTimeOptions();
  // defaults
  document.getElementById('date').valueAsDate = new Date();
  document.getElementById('rate').value = hourlyRate || '';
  document.getElementById('toAccount').value = onAccount || '';
  updateMonthSelect();
  render();
  updateAddButton();
});

function populateTimeOptions(){
  let start = document.getElementById('start');
  let end = document.getElementById('end');
  start.innerHTML=''; end.innerHTML='';
  for(let h=0;h<24;h++){
    for(let m of [0,30]){
      let v = `${String(h).padStart(2,'0')}:${m===0?'00':'30'}`;
      let o1 = document.createElement('option'); o1.value=v; o1.text=v; start.appendChild(o1);
      let o2 = document.createElement('option'); o2.value=v; o2.text=v; end.appendChild(o2);
    }
  }
  document.getElementById('start').value = '07:00';
  // round current time to next half hour for default end
  let d = new Date();
  let mins = d.getMinutes();
  let rounded = mins < 30 ? 30 : 0;
  let hour = mins < 30 ? d.getHours() : d.getHours()+1;
  if (hour === 24) hour = 23, rounded = 30;
  document.getElementById('end').value = `${String(hour).padStart(2,'0')}:${rounded===0?'00':'30'}`;
}

function saveSettings(){
  hourlyRate = parseFloat(document.getElementById('rate').value) || 0;
  onAccount = parseFloat(document.getElementById('toAccount').value) || 0;
  localStorage.setItem('hourlyRate', hourlyRate);
  localStorage.setItem('onAccount', onAccount);
  render();
  alert('Zapisano ustawienia');
}

function updateMonthSelect(){
  const sel = document.getElementById('monthSelect');
  // gather months in YYYY-MM from entries
  const months = new Set(entries.map(e => e.date.slice(0,7)));
  // always include current month
  months.add(currentMonthVal);
  // convert to array and sort descending (newest first)
  let arr = Array.from(months).sort((a,b)=> b.localeCompare(a));
  sel.innerHTML = '';
  arr.forEach(m => {
    let opt = document.createElement('option');
    opt.value = m;
    // human readable
    let [y,mon] = m.split('-').map(Number);
    let label = new Date(y, mon-1, 1).toLocaleDateString('pl-PL', {month:'long', year:'numeric'});
    opt.text = label;
    sel.appendChild(opt);
  });
  // try to set selected to previously chosen or current month
  let currentSel = localStorage.getItem('selectedMonth') || currentMonthVal;
  if(!arr.includes(currentSel)) currentSel = arr[0];
  sel.value = currentSel;
  localStorage.setItem('selectedMonth', sel.value);
}

function onMonthChange(){
  const sel = document.getElementById('monthSelect');
  localStorage.setItem('selectedMonth', sel.value);
  render();
}

function addOrUpdateEntry(){
  const date = document.getElementById('date').value;
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  const note = document.getElementById('note').value;
  const bonus = parseFloat(document.getElementById('bonus').value) || 0;
  if(!date || !start || !end){ alert('Uzupełnij datę i godziny'); return; }
  const hours = calculateHours(start,end);
  if(editingId){
    // update existing entry
    const idx = entries.findIndex(en => en.id === editingId);
    if(idx !== -1){
      entries[idx].date = date;
      entries[idx].start = start;
      entries[idx].end = end;
      entries[idx].note = note;
      entries[idx].bonus = bonus;
      entries[idx].hours = hours;
    }
    editingId = null;
  } else {
    entries.push({
      id: Date.now() + Math.floor(Math.random()*1000),
      date, start, end, note, bonus, hours
    });
  }
  localStorage.setItem('entries', JSON.stringify(entries));
  // refresh month select in case new month was added
  updateMonthSelect();
  render();
  resetForm();
  updateAddButton();
}

function calculateHours(start,end){
  let [sh,sm] = start.split(':').map(Number);
  let [eh,em] = end.split(':').map(Number);
  let startM = sh*60+sm;
  let endM = eh*60+em;
  if(endM < startM) endM += 24*60;
  return +( (endM-startM) / 60 ).toFixed(2);
}

function editEntry(id){
  const e = entries.find(en => en.id === id);
  if(!e) return;
  document.getElementById('date').value = e.date;
  document.getElementById('start').value = e.start;
  document.getElementById('end').value = e.end;
  document.getElementById('note').value = e.note;
  document.getElementById('bonus').value = e.bonus;
  editingId = id;
  updateAddButton();
  // switch month select to that entry's month
  const ym = e.date.slice(0,7);
  document.getElementById('monthSelect').value = ym;
  localStorage.setItem('selectedMonth', ym);
}

function deleteEntry(id){
  if(!confirm('Usuń wpis?')) return;
  entries = entries.filter(en => en.id !== id);
  localStorage.setItem('entries', JSON.stringify(entries));
  updateMonthSelect();
  render();
}

function resetForm(){
  document.getElementById('date').valueAsDate = new Date();
  document.getElementById('start').value = '07:00';
  // default end value - next half hour
  let d = new Date();
  let mins = d.getMinutes();
  let rounded = mins < 30 ? 30 : 0;
  let hour = mins < 30 ? d.getHours() : d.getHours()+1;
  if(hour === 24) hour = 23, rounded = 30;
  document.getElementById('end').value = `${String(hour).padStart(2,'0')}:${rounded===0?'00':'30'}`;
  document.getElementById('note').value = '';
  document.getElementById('bonus').value = '';
  editingId = null;
}

function updateAddButton(){
  const btn = document.getElementById('addBtn');
  btn.textContent = editingId ? 'Zapisz zmiany' : 'Dodaj wpis';
}

function render(){
  // selected month
  const sel = document.getElementById('monthSelect');
  if(sel.options.length === 0) updateMonthSelect();
  const selected = sel.value || localStorage.getItem('selectedMonth') || currentMonthVal;
  localStorage.setItem('selectedMonth', selected);

  // update title
  const [sy, sm] = selected.split('-').map(Number);
  const monthLabel = new Date(sy, sm-1, 1).toLocaleDateString('pl-PL', {month:'long', year:'numeric'});
  document.getElementById('monthTitle').textContent = `Podsumowanie: ${monthLabel}`;

  // build list for this month
  const monthEntries = entries.filter(e => e.date.slice(0,7) === selected)
                             .sort((a,b) => new Date(a.date) - new Date(b.date));

  // fill table
  const tbody = document.getElementById('entriesTable');
  tbody.innerHTML = '';
  monthEntries.forEach(e => {
    const tr = document.createElement('tr');
    const d = new Date(e.date);
    const dayLabel = d.toLocaleDateString('pl-PL', {weekday:'short', day:'numeric'});
    tr.innerHTML = `
      <td>${dayLabel}</td>
      <td>${e.start} - ${e.end}</td>
      <td>${e.hours.toFixed(2)}</td>
      <td>${e.note || ''}</td>
      <td>${(e.bonus||0).toFixed(2)}</td>
      <td>
        <button onclick="editEntry(${e.id})">✏️</button>
        <button onclick="deleteEntry(${e.id})">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });

  // compute summary numbers
  const totalHours = monthEntries.reduce((s,e)=>s+e.hours,0);
  const totalBonus = monthEntries.reduce((s,e)=>s+(e.bonus||0),0);
  // working days and nominal hours
  const workDays = getWorkingDays(sy, sm-1);
  const nominalHours = workDays * 8 + 10;
  const overtime = Math.max(0, totalHours - nominalHours);
  const baseHours = Math.min(totalHours, nominalHours);
  const basePay = baseHours * (hourlyRate || 0);
  const overtimePay = overtime * (hourlyRate || 0) * 1.5;
  const totalPay = basePay + overtimePay + totalBonus;
  const payout = totalPay - (onAccount || 0);

  // update DOM
  document.getElementById('nominalInfo').textContent = `${workDays} dni roboczych, nominalnie ${nominalHours}h`;
  document.getElementById('summary').innerHTML = `
    <div>Przepracowane godziny: <b>${totalHours.toFixed(2)} h</b></div>
    <div>Godziny w podstawie: <b>${baseHours.toFixed(2)} h</b></div>
    <div>Nadgodziny: <b>${overtime.toFixed(2)} h</b></div>
    <div>Kwota za podstawę: <b>${basePay.toFixed(2)} PLN</b></div>
    <div>Kwota za nadgodziny: <b>${overtimePay.toFixed(2)} PLN</b></div>
    <details style="margin-top:6px;"><summary>Premie: ${totalBonus.toFixed(2)} PLN</summary>
      <ul>${monthEntries.map(e=>`<li>${(e.note||'-')}: ${(e.bonus||0).toFixed(2)} PLN</li>`).join('')}</ul>
    </details>
    <div>Na konto: <b>${(onAccount||0).toFixed(2)} PLN</b></div>
    <div style="margin-top:6px;"><b>Razem do wypłaty: ${payout.toFixed(2)} PLN</b></div>`;
}

// helper to count working days in month (Mon-Fri)
function getWorkingDays(year, monthIndex){
  let d = new Date(year, monthIndex, 1);
  let count = 0;
  while(d.getMonth() === monthIndex){
    let day = d.getDay();
    if(day !== 0 && day !== 6) count++;
    d.setDate(d.getDate()+1);
  }
  return count;
}
