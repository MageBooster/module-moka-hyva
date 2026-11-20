/**
 * Moka United inline card form for MageBooster Checkout (handler protocol: see MageBooster_Checkout checkout.js).
 * The card inputs have no name and are not part of any request to Magento's REST API: after the order is placed the
 * handler gets the signed card page URL from mbmoka/redirect/start?json=1 and posts the fields there, which goes
 * straight on to 3D Secure (same server-side path as the card page of the redirect mode).
 */
(function () {
    'use strict';
    var el = document.getElementById('mb-moka-data'), C;
    try { C = el ? JSON.parse(el.textContent) : null; } catch (e) { C = null; }
    if (!C || !C.inline || !C.startUrl) { return; }

    var digits = function (v) { return String(v || '').replace(/\D/g, ''); };
    var val = function (id) { var i = document.getElementById(id); return i ? i.value : ''; };
    var luhn = function (n) {
        var sum = 0, i, d;
        if (n.length < 12 || n.length > 19) { return false; }
        for (i = 0; i < n.length; i++) {
            d = parseInt(n.charAt(n.length - 1 - i), 10) * (i % 2 ? 2 : 1);
            sum += d > 9 ? d - 9 : d;
        }
        return sum % 10 === 0;
    };
    var card = function () {
        var year = digits(val('mb-moka-cc-year'));
        return {
            name: val('mb-moka-cc-name').trim(),
            number: digits(val('mb-moka-cc-number')),
            month: digits(val('mb-moka-cc-month')),
            year: year.length === 2 ? '20' + year : year,
            cvc: digits(val('mb-moka-cc-cvc'))
        };
    };
    var cookie = function (name) {
        var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : '';
    };
    var post = function (url, fields) {
        var form = document.createElement('form');
        form.method = 'post';
        form.action = url;
        form.style.display = 'none';
        Object.keys(fields).forEach(function (k) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = fields[k];
            form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
    };

    window.mbCheckoutMethods = window.mbCheckoutMethods || {};
    window.mbCheckoutMethods[C.code] = {
        validate: function () {
            var c = card(), month = parseInt(c.month, 10);
            return (!c.name || !luhn(c.number) || !(month >= 1 && month <= 12) || c.year.length !== 4
                || c.cvc.length < 3 || c.cvc.length > 4) ? C.t.card : '';
        },
        afterPlace: async function (ctx) {
            var c = card(), res = null, sep = C.startUrl.indexOf('?') < 0 ? '?' : '&';
            try {
                var r = await fetch(C.startUrl + sep + 'json=1', {credentials: 'same-origin', headers: {Accept: 'application/json'}});
                res = await r.json();
            } catch (e) {
                res = null;
            }
            if (!res) { window.location.assign(C.startUrl); return true; } // fall back to the card page
            if (!res.url) {
                if (ctx) { ctx.error = res.error || C.t.failed; }
                window.location.assign(res.cart || '/checkout/cart');
                return true;
            }
            post(res.url, {
                'card[name]': c.name, 'card[number]': c.number, 'card[month]': c.month,
                'card[year]': c.year, 'card[cvc]': c.cvc,
                form_key: (ctx && ctx.V && ctx.V.formKey) || cookie('form_key')
            });
            return true;
        }
    };
})();
