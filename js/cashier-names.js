/* =============================================================================
 *  CASHIER NAME CLEANUP  —  Admin tool
 *  ---------------------------------------------------------------------------
 *  Sales records keep the cashier name exactly as typed at the POS, so the same
 *  person can show up as "AisyahM", "Aisyah M", "Aisyah.m", "AISYAH M" ...
 *
 *  This module scans a date range, groups the spellings that look like the same
 *  person, and lets you merge them into ONE standard name.
 *
 *  What it writes:  sales/{store}/{y}/{m}/{d}/{saleId}/cashierName
 *                   sales/{store}/{y}/{m}/{d}/{saleId}/shiftInfo/cashierName
 *  It never touches items, totals, shifts, dates or sales_stats.
 *  Every merge is recorded in `cashier_name_changes` for audit / undo.
 * ========================================================================== */

(function () {
    'use strict';

    const LOG_NODE = 'cashier_name_changes';
    const BATCH_KEYS = 120;          // multi-path keys per write
    const MAX_DAYS = 400;            // safety cap for a single scan
    const READ_CONCURRENCY = 3;      // month nodes fetched in parallel

    const state = {
        inited: false,
        busy: false,
        from: '',
        to: '',
        storeIds: [],
        variants: [],        // [{ name, count, total, first, last, stores:[], refs:[] }]
        groups: [],          // [[name, name, ...], ...]
        totalRecords: 0,
        filter: '',
        selected: new Set(),
        pending: null,
        scanned: false
    };

    /* ------------------------------------------------------------------ utils */

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function shiftDays(dateStr, days) {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + days);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function daysBetween(a, b) {
        const ms = new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00');
        return Math.round(ms / 86400000);
    }

    function escapeHtml(s) {
        return String(s === undefined || s === null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function fmtInt(n) {
        return Number(n || 0).toLocaleString('en-MY');
    }

    function fmtMoney(n) {
        return 'RM ' + Number(n || 0).toLocaleString('en-MY', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });
    }

    // Display helper: empty cashier names are grouped under a readable label
    function displayName(raw) {
        return raw === '' ? '(no name)' : raw;
    }

    function $id(id) {
        return document.getElementById(id);
    }

    /* ------------------------------------------------- grouping / similarity */

    function normKey(s) {
        return String(s).toLowerCase().replace(/[.,\-_/\\]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function compactKey(s) {
        return String(s).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
    }

    function levenshtein(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        let prev = new Array(b.length + 1);
        for (let j = 0; j <= b.length; j++) prev[j] = j;
        for (let i = 1; i <= a.length; i++) {
            let cur = [i];
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
            }
            prev = cur;
        }
        return prev[b.length];
    }

    function isSimilar(a, b) {
        const na = normKey(a);
        const nb = normKey(b);
        if (na === nb) return true;

        const ca = compactKey(a);
        const cb = compactKey(b);
        if (!ca || !cb) return false;
        if (ca === cb) return true;                 // "Aisyah.M" === "aisyah m"

        const minLen = Math.min(ca.length, cb.length);

        // one name is a slightly longer version of the other: "Hazella" / "Hazellaa"
        const short = ca.length <= cb.length ? ca : cb;
        const long = ca.length <= cb.length ? cb : ca;
        if (short.length >= 4 && long.indexOf(short) === 0 && long.length - short.length <= 2) return true;

        // typo tolerance — deliberately strict, a wrong merge is expensive
        if (minLen >= 7 && levenshtein(ca, cb) <= 1) return true;
        if (minLen >= 10 && levenshtein(ca, cb) <= 2) return true;

        return false;
    }

    function buildGroups(variants) {
        const names = variants.map(v => v.name);
        const parent = names.map((_, i) => i);
        const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
        const union = (a, b) => {
            a = find(a); b = find(b);
            if (a !== b) parent[b] = a;
        };

        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                if (isSimilar(names[i], names[j])) union(i, j);
            }
        }

        const buckets = new Map();
        names.forEach((n, i) => {
            const root = find(i);
            if (!buckets.has(root)) buckets.set(root, []);
            buckets.get(root).push(n);
        });

        const groups = Array.from(buckets.values());
        // keep the busiest groups first
        const weight = group => group.reduce((sum, name) => {
            const v = variants.find(x => x.name === name);
            return sum + (v ? v.count : 0);
        }, 0);
        groups.sort((g1, g2) => weight(g2) - weight(g1) || g2.length - g1.length);
        return groups;
    }

    function variantByName(name) {
        return state.variants.find(v => v.name === name) || null;
    }

    /* -------------------------------------------------------------- data read */

    function monthList(from, to) {
        const out = [];
        let d = new Date(from + 'T00:00:00');
        const end = new Date(to + 'T00:00:00');
        while (d <= end) {
            out.push({ y: String(d.getFullYear()), m: pad(d.getMonth() + 1) });
            d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        }
        return out;
    }

    // Walk a month node and collect sale records (tolerates legacy shapes)
    function collectSales(node, relPath, depth, out) {
        if (!node || typeof node !== 'object' || Array.isArray(node) || depth > 6) return;
        const looksLikeSale = node.cashierName !== undefined ||
            (node.items && (node.total_amount !== undefined || node.totalAmount !== undefined));
        if (looksLikeSale) {
            out.push({ relPath, order: node });
            return;
        }
        Object.keys(node).forEach(key => {
            if (key === 'items' || key === 'shiftInfo') return;
            collectSales(node[key], relPath ? `${relPath}/${key}` : key, depth + 1, out);
        });
    }

    function dateOfRelPath(relPath, fallback) {
        const parts = String(relPath).split('/');
        if (parts.length >= 3 && /^\d{4}$/.test(parts[0]) && /^\d{1,2}$/.test(parts[1]) && /^\d{1,2}$/.test(parts[2])) {
            return `${parts[0]}-${pad(parseInt(parts[1], 10))}-${pad(parseInt(parts[2], 10))}`;
        }
        return fallback;
    }

    /* ------------------------------------------------------------------- scan */

    function setProgress(pct, text) {
        const wrap = $id('cnProgressWrap');
        const fill = $id('cnProgressFill');
        const label = $id('cnProgressText');
        if (wrap) wrap.style.display = 'flex';
        if (fill) fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
        if (label) label.textContent = text || '';
    }

    function hideProgress() {
        const wrap = $id('cnProgressWrap');
        if (wrap) wrap.style.display = 'none';
    }

    async function resolveStoreIds() {
        const sel = $id('cnStoreSelect');
        const value = sel ? sel.value : 'all';
        if (value !== 'all') return [value];

        if (typeof stores !== 'undefined' && stores && Object.keys(stores).length) {
            return Object.keys(stores);
        }
        if (typeof loadStores === 'function') {
            try {
                await loadStores();
                if (typeof stores !== 'undefined' && stores) return Object.keys(stores);
            } catch (e) { /* ignore */ }
        }
        return [];
    }

    async function runScan() {
        if (state.busy) return;

        const from = ($id('cnDateFrom') || {}).value || '';
        const to = ($id('cnDateTo') || {}).value || '';

        if (!from || !to) { alert('Please choose both a start date and an end date.'); return; }
        if (from > to) { alert('The start date must be before the end date.'); return; }
        if (daysBetween(from, to) > MAX_DAYS) {
            alert(`That range is too long (${daysBetween(from, to)} days). Please scan ${MAX_DAYS} days or fewer at a time.`);
            return;
        }

        const storeIds = await resolveStoreIds();
        if (!storeIds.length) {
            alert('No store found. Make sure your store list has loaded, then try again.');
            return;
        }
        populateStores();

        state.busy = true;
        state.selected.clear();
        state.filter = '';
        const searchBox = $id('cnSearchInput');
        if (searchBox) searchBox.value = '';

        const scanBtn = $id('cnScanBtn');
        if (scanBtn) scanBtn.disabled = true;

        const months = monthList(from, to);
        const tasks = [];
        storeIds.forEach(sid => months.forEach(mm => tasks.push({ sid, y: mm.y, m: mm.m })));

        const variants = new Map();
        let totalRecords = 0;
        let done = 0;
        let cursor = 0;

        const variantFor = name => {
            let v = variants.get(name);
            if (!v) {
                v = { name, count: 0, total: 0, first: '', last: '', stores: new Set(), refs: [] };
                variants.set(name, v);
            }
            return v;
        };

        setProgress(0, `Preparing ${tasks.length} month block(s)…`);

        const worker = async () => {
            while (cursor < tasks.length) {
                const task = tasks[cursor++];
                const storeLabel = (typeof stores !== 'undefined' && stores && stores[task.sid] && stores[task.sid].name) || task.sid;
                const label = `${storeLabel} · ${task.y}/${task.m}`;
                setProgress((done / tasks.length) * 100, `Reading ${label} (${done + 1}/${tasks.length})`);

                let orders = [];
                try {
                    const snap = await database.ref(`sales/${task.sid}/${task.y}/${task.m}`).once('value');
                    collectSales(snap.val() || {}, `${task.y}/${task.m}`, 0, orders);
                } catch (err) {
                    console.warn('[CashierNames] Could not read month block', task, err);
                }

                orders.forEach(({ relPath, order }) => {
                    const dateStr = dateOfRelPath(relPath, `${task.y}-${task.m}-01`);
                    if (dateStr < from || dateStr > to) return;

                    const rawName = typeof order.cashierName === 'string' ? order.cashierName.trim() : '';
                    const hasShiftName = !!(order.shiftInfo && typeof order.shiftInfo.cashierName === 'string' && order.shiftInfo.cashierName.length);
                    const amount = Number(order.total_amount !== undefined ? order.total_amount : (order.totalAmount || 0));

                    const v = variantFor(rawName);
                    v.count += 1;
                    v.total += isNaN(amount) ? 0 : amount;
                    v.stores.add(task.sid);
                    if (!v.first || dateStr < v.first) v.first = dateStr;
                    if (!v.last || dateStr > v.last) v.last = dateStr;
                    v.refs.push(makeRef(task.sid, relPath, hasShiftName));

                    totalRecords += 1;
                });

                done += 1;
                setProgress((done / tasks.length) * 100, `Reading ${label} (${done}/${tasks.length})`);
            }
        };

        const startedAt = Date.now();
        await Promise.all(Array.from({ length: Math.min(READ_CONCURRENCY, tasks.length) }, worker));

        const variantList = Array.from(variants.values()).map(v => ({
            name: v.name,
            count: v.count,
            total: v.total,
            first: v.first,
            last: v.last,
            stores: Array.from(v.stores),
            refs: v.refs
        }));

        state.from = from;
        state.to = to;
        state.storeIds = storeIds;
        state.variants = variantList;
        state.groups = buildGroups(variantList);
        state.totalRecords = totalRecords;
        state.scanned = true;

        state.busy = false;
        if (scanBtn) scanBtn.disabled = false;

        const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
        setProgress(100, `Done — ${fmtInt(totalRecords)} records in ${secs}s`);
        setTimeout(hideProgress, 1500);

        render();
        return true;
    }

    // ref = "{storeId}|{yyyy/mm/dd}/{saleId}" (+ "|s" when the record also keeps
    // a copy of the name under shiftInfo.cashierName)
    function makeRef(sid, relPath, hasShiftName) {
        return `${sid}|${relPath}${hasShiftName ? '|s' : ''}`;
    }

    function parseRef(ref) {
        const parts = String(ref).split('|');
        const sid = parts[0];
        const hasShift = parts[parts.length - 1] === 's';
        if (hasShift) parts.pop();
        const relPath = parts.slice(1).join('|');
        const segs = relPath.split('/');
        const saleId = segs[segs.length - 1];
        return { sid, relPath, saleId, hasShift };
    }

    /* --------------------------------------------------------------- rendering */

    function renderStats() {
        const host = $id('cnStats');
        if (!host) return;

        const names = state.variants.length;
        const dupGroups = state.groups.filter(g => g.length > 1);
        const dupRecords = dupGroups.reduce((sum, g) => sum + g.reduce((s, n) => {
            const v = variantByName(n);
            return s + (v ? v.count : 0);
        }, 0), 0);

        host.innerHTML = `
            <div class="cn-stat"><span>Records scanned</span><strong>${fmtInt(state.totalRecords)}</strong></div>
            <div class="cn-stat"><span>Distinct names</span><strong>${fmtInt(names)}</strong></div>
            <div class="cn-stat"><span>Possible duplicate groups</span><strong>${fmtInt(dupGroups.length)}</strong></div>
            <div class="cn-stat"><span>Records in those groups</span><strong>${fmtInt(dupRecords)}</strong></div>
        `;
    }

    function renderMergeBar() {
        const bar = $id('cnMergeBar');
        if (!bar) return;

        let records = 0;
        state.selected.forEach(name => {
            const v = variantByName(name);
            if (v) records += v.count;
        });

        const countEl = $id('cnSelectionCount');
        if (countEl) {
            countEl.innerHTML = state.selected.size
                ? `<strong>${state.selected.size}</strong> name(s) selected · <strong>${fmtInt(records)}</strong> record(s)`
                : 'Select the spellings that belong to the same person (tick the boxes)';
        }

        const btn = $id('cnMergeBtn');
        if (btn) {
            const target = (($id('cnTargetName') || {}).value || '').trim();
            btn.disabled = state.busy || state.selected.size === 0 || !target;
        }
    }

    function renderList() {
        const host = $id('cnNameList');
        if (!host) return;

        if (!state.variants.length) {
            host.innerHTML = state.scanned
                ? `<div class="cn-empty">
                    <i class="material-icons">search_off</i>
                    <h4>No sales records in this range</h4>
                    <p>Nothing was found for the store and dates you picked. Try a wider date range.</p>
                   </div>`
                : `<div class="cn-empty">
                    <i class="material-icons">manage_accounts</i>
                    <h4>No cashier names loaded</h4>
                    <p>Pick a store and a date range above, then press <strong>Scan Names</strong>.</p>
                   </div>`;
            return;
        }

        // keep the "standard name" suggestions in sync with what we actually found
        const datalist = $id('cnKnownNames');
        if (datalist) {
            datalist.innerHTML = state.variants
                .map(v => v.name)
                .filter(n => n)
                .sort((a, b) => a.localeCompare(b))
                .map(n => `<option value="${escapeHtml(n)}"></option>`)
                .join('');
        }

        const filter = state.filter.trim().toLowerCase();
        let groupIndex = 0;
        let html = '';
        const groupLookup = {};

        state.groups.forEach(group => {
            const members = group
                .map(n => variantByName(n))
                .filter(Boolean)
                .filter(v => !filter || displayName(v.name).toLowerCase().includes(filter))
                .sort((a, b) => b.count - a.count);

            if (!members.length) return;

            groupIndex += 1;
            const isDupGroup = members.length > 1;
            const groupTotal = members.reduce((s, v) => s + v.count, 0);
            const suggested = members[0];
            groupLookup[groupIndex] = members.map(m => m.name);

            if (isDupGroup) {
                html += `
                <tr class="cn-group-row">
                    <td colspan="7">
                        <span class="cn-group-chip">Group ${groupIndex}</span>
                        <span class="cn-group-text">${members.length} spellings · ${fmtInt(groupTotal)} records — probably the same person</span>
                        <button type="button" class="cn-mini-btn" data-group="${groupIndex}">
                            <i class="material-icons">done_all</i> Select all in group
                        </button>
                        <button type="button" class="cn-mini-btn ghost" data-suggest="${escapeHtml(suggested.name)}">
                            Use “${escapeHtml(displayName(suggested.name))}” as target
                        </button>
                    </td>
                </tr>`;
            }

            members.forEach(v => {
                const checked = state.selected.has(v.name) ? 'checked' : '';
                const storeNames = v.stores
                    .map(id => (stores && stores[id] && stores[id].name) || id)
                    .join(', ');
                const period = v.first === v.last ? v.first : `${v.first} → ${v.last}`;

                html += `
                <tr class="cn-row ${checked ? 'is-selected' : ''}" data-name="${escapeHtml(v.name)}">
                    <td class="cn-col-check">
                        <input type="checkbox" class="cn-check" data-name="${escapeHtml(v.name)}" ${checked}>
                    </td>
                    <td>
                        <div class="cn-name">${escapeHtml(displayName(v.name))}</div>
                        ${v.name === '' ? '<span class="cn-badge">empty field</span>' : ''}
                        ${isDupGroup && v.name !== suggested.name ? `<span class="cn-badge warn">variant of ${escapeHtml(displayName(suggested.name))}</span>` : ''}
                        ${isDupGroup && v.name === suggested.name ? '<span class="cn-badge">most used</span>' : ''}
                    </td>
                    <td class="cn-num">${fmtInt(v.count)}</td>
                    <td class="cn-num">${fmtMoney(v.total)}</td>
                    <td class="cn-nowrap">${escapeHtml(period)}</td>
                    <td class="cn-stores" title="${escapeHtml(storeNames)}">${escapeHtml(storeNames)}</td>
                    <td class="cn-col-action">
                        <button type="button" class="cn-mini-btn ghost" data-rename="${escapeHtml(v.name)}">
                            <i class="material-icons">edit</i> Rename
                        </button>
                    </td>
                </tr>`;
            });
        });

        if (!html) {
            host.innerHTML = `<div class="cn-empty"><h4>No name matches “${escapeHtml(state.filter)}”</h4></div>`;
            return;
        }

        host.innerHTML = `
            <table class="cn-table">
                <thead>
                    <tr>
                        <th class="cn-col-check"></th>
                        <th>Cashier name</th>
                        <th class="cn-num">Records</th>
                        <th class="cn-num">Sales</th>
                        <th>Period</th>
                        <th>Store</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${html}</tbody>
            </table>`;

        host.querySelectorAll('.cn-check').forEach(cb => {
            cb.addEventListener('change', () => {
                const name = cb.dataset.name;
                if (cb.checked) state.selected.add(name);
                else state.selected.delete(name);
                cb.closest('tr').classList.toggle('is-selected', cb.checked);
                renderMergeBar();
            });
        });

        host.querySelectorAll('[data-group]').forEach(btn => {
            btn.addEventListener('click', () => {
                const names = groupLookup[btn.dataset.group] || [];
                const allSelected = names.every(n => state.selected.has(n));
                names.forEach(n => {
                    if (allSelected) state.selected.delete(n);
                    else state.selected.add(n);
                });
                renderList();
                renderMergeBar();
            });
        });

        host.querySelectorAll('[data-suggest]').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = $id('cnTargetName');
                if (input) {
                    input.value = btn.dataset.suggest;
                    renderMergeBar();
                }
            });
        });

        host.querySelectorAll('[data-rename]').forEach(btn => {
            btn.addEventListener('click', () => startRename(btn.dataset.rename));
        });
    }

    function render() {
        renderStats();
        renderList();
        renderMergeBar();
    }

    /* ------------------------------------------------------------------ merge */

    function startRename(oldName) {
        const box = $id('cnTargetName');
        if (box) {
            box.value = oldName;
            box.focus();
            if (box.select) box.select();
        }
        state.selected = new Set([oldName]);
        renderList();
        renderMergeBar();
    }

    function openConfirm() {
        if (state.busy) return;

        const target = (($id('cnTargetName') || {}).value || '').trim();
        if (!target) { alert('Please type the standard name to merge into.'); return; }
        if (!state.selected.size) { alert('Please tick at least one cashier name first.'); return; }

        const sources = Array.from(state.selected).map(name => variantByName(name)).filter(Boolean);
        if (sources.length === 1 && sources[0].name === target) {
            alert('That name is already the target — nothing to change. Pick a different spelling or type a new name.');
            return;
        }
        const recordCount = sources.reduce((s, v) => s + v.count, 0);
        const storeSet = new Set();
        sources.forEach(v => v.stores.forEach(s => storeSet.add(s)));

        state.pending = {
            newName: target,
            sources: sources.map(v => v.name),
            recordCount: recordCount
        };

        const body = $id('cnConfirmBody');
        if (body) {
            body.innerHTML = `
                <div class="cn-confirm-target">
                    <span>Merge into</span>
                    <strong>${escapeHtml(target)}</strong>
                </div>
                <table class="cn-confirm-table">
                    <thead><tr><th>Current name</th><th class="cn-num">Records</th><th class="cn-num">Sales</th></tr></thead>
                    <tbody>
                        ${sources.map(v => `
                            <tr>
                                <td>${escapeHtml(displayName(v.name))}</td>
                                <td class="cn-num">${fmtInt(v.count)}</td>
                                <td class="cn-num">${fmtMoney(v.total)}</td>
                            </tr>`).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>${sources.length} name(s) → 1</td>
                            <td class="cn-num">${fmtInt(recordCount)}</td>
                            <td class="cn-num">${fmtMoney(sources.reduce((s, v) => s + v.total, 0))}</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="cn-confirm-note">
                    <i class="material-icons">info</i>
                    <div>
                        ${fmtInt(recordCount)} sales record(s) across ${storeSet.size} store(s) will get the cashier name
                        <strong>“${escapeHtml(target)}”</strong>. Only the cashier name field is changed — items, totals,
                        shifts and statistics stay exactly the same. The change is logged and can be undone.
                    </div>
                </div>`;
        }

        const modal = $id('cnConfirmModal');
        if (modal) modal.classList.add('open');
    }

    function closeConfirm() {
        const modal = $id('cnConfirmModal');
        if (modal) modal.classList.remove('open');
        state.pending = null;
    }

    async function writePairs(pairs, onProgress) {
        let batch = {};
        let keys = 0;
        let written = 0;

        const flush = async () => {
            if (!keys) return;
            await database.ref().update(batch);
            batch = {};
            keys = 0;
        };

        for (let i = 0; i < pairs.length; i++) {
            const { ref, name } = pairs[i];
            const info = parseRef(ref);
            batch[`sales/${info.sid}/${info.relPath}/cashierName`] = name;
            keys += 1;
            if (info.hasShift) {
                batch[`sales/${info.sid}/${info.relPath}/shiftInfo/cashierName`] = name;
                keys += 1;
            }
            written += 1;
            if (keys >= BATCH_KEYS) {
                await flush();
                if (onProgress) onProgress(written, pairs.length);
            }
        }
        await flush();
        if (onProgress) onProgress(pairs.length, pairs.length);
    }

    async function executeMerge() {
        const pending = state.pending;
        if (!pending) return;
        if (state.busy) return;

        const modal = $id('cnConfirmModal');
        const confirmBtn = $id('cnConfirmBtn');
        if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Merging…'; }

        state.busy = true;

        const sources = pending.sources.map(n => variantByName(n)).filter(Boolean);
        const allRefs = [];
        sources.forEach(v => v.refs.forEach(ref => allRefs.push({ ref, oldName: v.name })));

        try {
            setProgress(0, `Merging ${fmtInt(allRefs.length)} record(s) → “${pending.newName}”`);
            await writePairs(
                allRefs.map(r => ({ ref: r.ref, name: pending.newName })),
                (done, total) => setProgress((done / total) * 100, `Updating ${fmtInt(done)} / ${fmtInt(total)} record(s)`)
            );

            const logId = 'CNC_' + Date.now();
            const record = {
                id: logId,
                newName: pending.newName,
                oldNames: sources.map(v => ({ name: v.name, count: v.count })),
                recordCount: allRefs.length,
                stores: Array.from(new Set(sources.flatMap(v => v.stores))),
                from: state.from,
                to: state.to,
                createdAt: new Date().toISOString(),
                createdBy: (firebase.auth().currentUser && firebase.auth().currentUser.email) || 'unknown',
                undone: false
            };
            if (allRefs.length <= 4000) {
                // keep a compact undo payload so the merge can be reverted later
                record.undo = allRefs.map(r => [r.ref, r.oldName]);
            }
            await database.ref(`${LOG_NODE}/${logId}`).set(record);

            // reflect the merge in the current view without re-scanning
            applyMergeLocally(pending.newName, pending.sources);

            setProgress(100, `Done — ${fmtInt(allRefs.length)} record(s) updated`);
            setTimeout(hideProgress, 1600);

            state.selected.clear();
            const targetInput = $id('cnTargetName');
            if (targetInput) targetInput.value = '';

            closeConfirm();
            render();
            loadAudit();
            showBanner('success', `Merged ${fmtInt(allRefs.length)} record(s) into “${pending.newName}”.`);
        } catch (err) {
            console.error('[CashierNames] Merge failed', err);
            alert('Merge failed: ' + (err && err.message ? err.message : err) +
                '\n\nSome records may already have been updated. Press Scan again to check the current state.');
            hideProgress();
        } finally {
            state.busy = false;
            state.pending = null;
            if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm merge'; }
            renderMergeBar();
        }
    }

    function applyMergeLocally(newName, oldNames) {
        const target = variantByName(newName);
        const sources = oldNames.map(n => variantByName(n)).filter(Boolean);

        let merged = target ? {
            name: target.name,
            count: target.count,
            total: target.total,
            first: target.first,
            last: target.last,
            stores: new Set(target.stores),
            refs: target.refs.slice()
        } : { name: newName, count: 0, total: 0, first: '', last: '', stores: new Set(), refs: [] };

        sources.forEach(v => {
            if (v.name === newName) return;
            merged.count += v.count;
            merged.total += v.total;
            merged.stores = new Set([...merged.stores, ...v.stores]);
            merged.refs = merged.refs.concat(v.refs);
            if (!merged.first || (v.first && v.first < merged.first)) merged.first = v.first;
            if (!merged.last || (v.last && v.last > merged.last)) merged.last = v.last;
        });

        merged.name = newName;
        merged.stores = Array.from(merged.stores);

        state.variants = state.variants.filter(v => v.name !== newName && oldNames.indexOf(v.name) === -1);
        state.variants.push(merged);
        state.variants.sort((a, b) => b.count - a.count);
        state.groups = buildGroups(state.variants);
        oldNames.forEach(n => state.selected.delete(n));
        state.selected.delete(newName);
    }

    /* ------------------------------------------------------------------ audit */

    function showBanner(type, message) {
        const host = $id('cnBanner');
        if (!host) return;
        host.className = 'cn-banner ' + type;
        host.innerHTML = `<i class="material-icons">${type === 'success' ? 'check_circle' : 'error'}</i><span>${escapeHtml(message)}</span>`;
        host.style.display = 'flex';
        setTimeout(() => { host.style.display = 'none'; }, 6000);
    }

    function loadAudit() {
        const host = $id('cnAuditList');
        if (!host) return;

        database.ref(LOG_NODE).orderByKey().limitToLast(12).once('value')
            .then(snap => {
                const data = snap.val() || {};
                const rows = Object.keys(data).map(k => data[k]).filter(Boolean).reverse();

                if (!rows.length) {
                    host.innerHTML = '<div class="cn-empty small"><p>No merge has been recorded yet.</p></div>';
                    return;
                }

                host.innerHTML = rows.map(r => {
                    const oldNames = (r.oldNames || []).map(o => displayName(o.name)).join(' · ');
                    const when = r.createdAt ? r.createdAt.replace('T', ' ').slice(0, 19) : '';
                    return `
                    <div class="cn-audit-row">
                        <div class="cn-audit-main">
                            <div class="cn-audit-title">
                                <span class="cn-old">${escapeHtml(oldNames)}</span>
                                <i class="material-icons">arrow_forward</i>
                                <strong>${escapeHtml(displayName(r.newName))}</strong>
                            </div>
                            <div class="cn-audit-meta">
                                ${fmtInt(r.recordCount)} record(s) · ${when} · ${escapeHtml(r.createdBy || '')}
                                ${r.undone ? ' · <span class="cn-badge">already undone</span>' : ''}
                                ${r.undo ? '' : ' · <span class="cn-badge warn">too large to undo</span>'}
                            </div>
                        </div>
                        ${(r.undo && !r.undone) ? `<button type="button" class="cn-mini-btn ghost" data-undo="${escapeHtml(r.id)}"><i class="material-icons">undo</i> Undo</button>` : ''}
                    </div>`;
                }).join('');

                host.querySelectorAll('[data-undo]').forEach(btn => {
                    btn.addEventListener('click', () => undoMerge(btn.dataset.undo));
                });
            })
            .catch(err => {
                console.warn('[CashierNames] Could not load audit log', err);
                host.innerHTML = '<div class="cn-empty small"><p>Audit log unavailable.</p></div>';
            });
    }

    async function undoMerge(logId) {
        if (state.busy) return;

        let record;
        try {
            const snap = await database.ref(`${LOG_NODE}/${logId}`).once('value');
            record = snap.val();
        } catch (err) {
            alert('Could not read the audit record: ' + err.message);
            return;
        }
        if (!record || !record.undo) { alert('This merge cannot be undone automatically.'); return; }

        if (!confirm(`Undo this merge?\n\n${record.recordCount} record(s) that were renamed to "${record.newName}" ` +
            `will get their original names back.`)) return;

        state.busy = true;
        try {
            const pairs = record.undo.map(([ref, oldName]) => ({ ref, name: oldName }));
            setProgress(0, `Restoring ${fmtInt(pairs.length)} record(s)…`);
            await writePairs(pairs, (done, total) => setProgress((done / total) * 100, `Restoring ${fmtInt(done)} / ${fmtInt(total)}`));
            await database.ref(`${LOG_NODE}/${logId}`).update({
                undone: true,
                undoneAt: new Date().toISOString(),
                undoneBy: (firebase.auth().currentUser && firebase.auth().currentUser.email) || 'unknown'
            });
            setProgress(100, 'Undo complete');
            setTimeout(hideProgress, 1500);
            showBanner('success', `Restored ${fmtInt(pairs.length)} record(s). Press Scan again to refresh the list.`);
            loadAudit();
        } catch (err) {
            console.error('[CashierNames] Undo failed', err);
            alert('Undo failed: ' + err.message);
            hideProgress();
        } finally {
            state.busy = false;
        }
    }

    /* -------------------------------------------------------------------- init */

    function populateStores() {
        const sel = $id('cnStoreSelect');
        if (!sel) return;

        const current = sel.value || 'all';
        sel.innerHTML = '<option value="all">All Stores</option>';

        if (typeof stores !== 'undefined' && stores) {
            Object.keys(stores).forEach(id => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = (stores[id] && stores[id].name) || id;
                sel.appendChild(opt);
            });
        }
        sel.value = current;
        if (sel.selectedIndex === -1) sel.value = 'all';
    }

    function applyPreset(kind) {
        const to = todayStr();
        let from = to;

        if (kind === 'month') {
            const d = new Date();
            from = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
        } else if (kind === '30') {
            from = shiftDays(to, -29);
        } else if (kind === '90') {
            from = shiftDays(to, -89);
        } else if (kind === 'year') {
            from = `${new Date().getFullYear()}-01-01`;
        }

        const fromEl = $id('cnDateFrom');
        const toEl = $id('cnDateTo');
        if (fromEl) fromEl.value = from;
        if (toEl) toEl.value = to;
    }

    function initUI() {
        if (state.inited) return;
        state.inited = true;

        applyPreset('30');
        populateStores();

        const scanBtn = $id('cnScanBtn');
        if (scanBtn) scanBtn.addEventListener('click', runScan);

        document.querySelectorAll('#cashier-namesView .cn-chip').forEach(chip => {
            chip.addEventListener('click', () => applyPreset(chip.dataset.range));
        });

        const search = $id('cnSearchInput');
        if (search) {
            search.addEventListener('input', () => {
                state.filter = search.value;
                renderList();
            });
        }

        const target = $id('cnTargetName');
        if (target) {
            target.addEventListener('input', renderMergeBar);
            target.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); openConfirm(); }
            });
        }

        const mergeBtn = $id('cnMergeBtn');
        if (mergeBtn) mergeBtn.addEventListener('click', openConfirm);

        const clearBtn = $id('cnClearSelectionBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                state.selected.clear();
                render();
            });
        }

        const cancelBtn = $id('cnConfirmCancel');
        if (cancelBtn) cancelBtn.addEventListener('click', closeConfirm);
        const confirmBtn = $id('cnConfirmBtn');
        if (confirmBtn) confirmBtn.addEventListener('click', executeMerge);

        const modal = $id('cnConfirmModal');
        if (modal) {
            modal.addEventListener('click', e => {
                if (e.target === modal) closeConfirm();
            });
        }

        const refreshAudit = $id('cnRefreshAuditBtn');
        if (refreshAudit) refreshAudit.addEventListener('click', loadAudit);

        render();
        loadAudit();
    }

    window.loadCashierNamesView = function () {
        initUI();
        // the store list can arrive after the first click
        populateStores();
    };
})();
