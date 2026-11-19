/* =============================================================================
 *  CASHIER AVATAR  —  Admin tool (Settings → Cashier Avatar)
 *  ---------------------------------------------------------------------------
 *  Lists every cashier account from Firebase RTDB `cashiers/{nameKey}`
 *  (same node used by the POS login screen), showing each cashier's
 *  avatar, name and 4-digit PIN, with a button to delete an account.
 *
 *  Account shape: { name, pin, avatar, createdAt }
 *  avatar uses the DiceBear "avataaars" style (same as pos.js).
 * ========================================================================== */

(function () {
    'use strict';

    const CASHIER_NODE = 'cashiers';
    const AVATAR_STYLE = 'avataaars';

    // avataaars component variants (mirrors pos.js so avatars render identically)
    const AVATAR_COMPONENTS = {
        top: ['bigHair', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'frizzle', 'fro', 'hat', 'hijab', 'longButNotTooLong', 'miaWallace', 'shaggy', 'shaggyMullet', 'shavedSides', 'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'sides', 'straight01', 'straight02', 'straightAndStrand', 'theCaesar', 'theCaesarAndSidePart', 'turban', 'winterHat02', 'winterHat03', 'winterHat04'],
        accessories: ['eyepatch', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'],
        facialHair: ['beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum'],
        eyebrows: ['angry', 'angryNatural', 'default', 'defaultNatural', 'flatNatural', 'frownNatural', 'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural'],
        eyes: ['closed', 'cry', 'default', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky', 'xDizzy'],
        mouth: ['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'],
        clothes: ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'],
        clothesGraphic: ['bat', 'bear', 'cumbia', 'deer', 'diamond', 'hola', 'pizza', 'resist', 'skull', 'skullOutline']
    };

    function cashierDefaultAvatar() {
        return {
            top: 'shortFlat',
            accessories: 'none',
            facialHair: 'none',
            eyebrows: 'default',
            eyes: 'happy',
            mouth: 'smile',
            clothes: 'shirtCrewNeck',
            clothesGraphic: 'none',
            skin: '#edb98a',
            hairColor: '#2c1b18',
            clothesColor: '#5199e4',
            accessoriesColor: '#262e33',
            hatColor: '#5199e4',
            background: '#b6e3f4'
        };
    }

    function cashierAvatarUrl(name, avatar) {
        const seed = encodeURIComponent(String(name || '?'));
        const a = avatar || cashierDefaultAvatar();

        const params = new URLSearchParams();
        params.set('seed', seed);

        Object.keys(AVATAR_COMPONENTS).forEach(comp => {
            const val = a[comp];
            if (!val || val === 'none') return;
            if (AVATAR_COMPONENTS[comp].indexOf(val) === -1) return;
            if (comp === 'clothesGraphic' && a.clothes !== 'graphicShirt') return;
            params.set(comp + 'Variant', val);
        });

        if (a.accessories && a.accessories !== 'none') params.set('accessoriesProbability', '100');
        if (a.facialHair && a.facialHair !== 'none') params.set('facialHairProbability', '100');

        function cleanHex(c) {
            const h = String(c || '').replace('#', '');
            return /^[a-fA-F0-9]{6}$/.test(h) ? h : '';
        }
        const skinHex = cleanHex(a.skin);
        const hairHex = cleanHex(a.hairColor);
        const clothesHex = cleanHex(a.clothesColor);
        const accessoriesHex = cleanHex(a.accessoriesColor);
        const hatHex = cleanHex(a.hatColor);
        const bgHex = cleanHex(a.background);
        if (skinHex) params.set('skinColor', skinHex);
        if (hairHex) params.set('hairColor', hairHex);
        if (clothesHex) params.set('clothesColor', clothesHex);
        if (accessoriesHex && a.accessories && a.accessories !== 'none') params.set('accessoriesColor', accessoriesHex);
        if (hatHex) params.set('hatColor', hatHex);
        if (bgHex) params.set('backgroundColor', bgHex);

        return `https://api.dicebear.com/10.x/${AVATAR_STYLE}/svg?${params.toString()}`;
    }

    const state = {
        inited: false,
        accounts: [],        // [{ key, name, pin, avatar }]
        filter: '',
        pendingDelete: null  // { key, name }
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function $id(id) {
        return document.getElementById(id);
    }

    function showBanner(type, msg) {
        const b = $id('caBanner');
        if (!b) return;
        b.className = 'cn-banner ' + type;
        b.innerHTML = `<i class="material-icons">${type === 'success' ? 'check_circle' : 'error'}</i> ${msg}`;
        b.style.display = 'flex';
    }

    function hideBanner() {
        const b = $id('caBanner');
        if (b) b.style.display = 'none';
    }

    function loadAccounts() {
        if (typeof database === 'undefined' || !database) {
            state.accounts = [];
            render();
            return;
        }
        return database.ref(CASHIER_NODE).once('value')
            .then(snap => {
                const data = snap.val() || {};
                state.accounts = Object.keys(data).map(k => ({
                    key: k,
                    name: data[k].name || k,
                    pin: data[k].pin || '',
                    avatar: (data[k].avatar && data[k].avatar.top !== undefined) ? data[k].avatar : null
                }));
                render();
            })
            .catch(err => {
                console.warn('[CashierAvatar] 读取账号失败', err);
                showBanner('error', 'Failed to load cashier accounts.');
                render();
            });
    }

    function avatarHtml(acc, sizeCls) {
        const initial = (acc.name || '?').charAt(0).toUpperCase();
        const url = cashierAvatarUrl(acc.name, acc.avatar);
        return `
            <span class="ca-avatar ${sizeCls || ''}">
                <img src="${esc(url)}" alt="" loading="lazy"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <span class="ca-avatar-fallback" style="display:none;">${esc(initial)}</span>
            </span>`;
    }

    function render() {
        const grid = $id('caGrid');
        if (!grid) return;

        const q = state.filter.trim().toLowerCase();
        const list = state.accounts
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter(a => !q || a.name.toLowerCase().indexOf(q) !== -1);

        if (!state.accounts.length) {
            grid.innerHTML = `
                <div class="cn-empty ca-empty-state">
                    <i class="material-icons">group_off</i>
                    <h4>No cashiers yet</h4>
                    <p>Cashier accounts created on the POS will appear here.</p>
                </div>`;
            return;
        }
        if (!list.length) {
            grid.innerHTML = `
                <div class="cn-empty ca-empty-state">
                    <i class="material-icons">search_off</i>
                    <h4>No matching cashiers</h4>
                    <p>Try a different search term.</p>
                </div>`;
            return;
        }

        grid.innerHTML = list.map(acc => {
            const pin = acc.pin || '—';
            return `
                <div class="ca-card">
                    <button type="button" class="ca-del" data-key="${esc(acc.key)}" data-name="${esc(acc.name)}" title="Delete account">
                        <i class="material-icons">delete_outline</i>
                    </button>
                    ${avatarHtml(acc)}
                    <div class="ca-name">${esc(acc.name)}</div>
                    <div class="ca-pin"><i class="material-icons">pin</i>${esc(pin)}</div>
                </div>`;
        }).join('');

        grid.querySelectorAll('.ca-del').forEach(btn => {
            btn.addEventListener('click', () => {
                state.pendingDelete = { key: btn.dataset.key, name: btn.dataset.name };
                openDeleteModal();
            });
        });
    }

    function openDeleteModal() {
        const target = $id('caDeleteTarget');
        if (!target || !state.pendingDelete) return;
        const acc = { name: state.pendingDelete.name, avatar: null };
        const found = state.accounts.find(a => a.key === state.pendingDelete.key);
        if (found) acc.avatar = found.avatar;
        target.innerHTML = `
            ${avatarHtml({ name: acc.name, avatar: acc.avatar }, '')}
            <span>${esc(acc.name)}</span>`;
        $id('caDeleteModal').classList.add('open');
    }

    function closeDeleteModal() {
        $id('caDeleteModal').classList.remove('open');
        state.pendingDelete = null;
    }

    function confirmDelete() {
        if (!state.pendingDelete) return;
        const key = state.pendingDelete.key;
        const name = state.pendingDelete.name;
        const btn = $id('caDeleteConfirm');
        if (btn) btn.disabled = true;
        hideBanner();

        database.ref(`${CASHIER_NODE}/${key}`).remove()
            .then(() => {
                closeDeleteModal();
                showBanner('success', `Deleted cashier "${name}".`);
                return loadAccounts();
            })
            .catch(err => {
                console.warn('[CashierAvatar] 删除失败', err);
                if (btn) btn.disabled = false;
                showBanner('error', 'Failed to delete cashier account.');
            });
    }

    function initUI() {
        if (state.inited) return;
        state.inited = true;

        const search = $id('caSearchInput');
        if (search) {
            search.addEventListener('input', () => {
                state.filter = search.value;
                render();
            });
        }

        const refresh = $id('caRefreshBtn');
        if (refresh) {
            refresh.addEventListener('click', () => {
                hideBanner();
                loadAccounts();
            });
        }

        const modal = $id('caDeleteModal');
        if (modal) {
            modal.addEventListener('click', e => {
                if (e.target === modal) closeDeleteModal();
            });
        }

        const cancel = $id('caDeleteCancel');
        if (cancel) cancel.addEventListener('click', closeDeleteModal);

        const confirm = $id('caDeleteConfirm');
        if (confirm) confirm.addEventListener('click', confirmDelete);

        loadAccounts();
    }

    // 入口：admin.js 切换视图时调用
    window.loadCashierAvatarsView = function () {
        initUI();
        hideBanner();
        loadAccounts();
    };

    // 供 dashboard 卡片复用：根据收银员名字/头像配置生成 DiceBear 头像地址
    window.cashierAvatarUrl = cashierAvatarUrl;
    // 默认头像配置（未命中 cashiers 节点时使用，保证同一名字头像稳定）
    window.cashierDefaultAvatar = cashierDefaultAvatar;
})();
