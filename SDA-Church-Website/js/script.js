/* Durban Central SDA Church — site behaviour.
   Everything here is a progressive enhancement: the site works without it. */
(function () {
    "use strict";

    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Church details used by the form fallback */
    var CHURCH_EMAIL = "info@durbancentralsda.org";
    var SAST_OFFSET_HOURS = 2; // South Africa has no daylight saving

    /* ------------------------------------------------------------------
       1. Navigation + sticky header
       ------------------------------------------------------------------ */
    var header = $(".site-header");
    var toggle = $(".nav-toggle");
    var nav = $("#primary-nav");

    function setMenu(open) {
        if (!toggle || !nav) return;
        nav.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
    }

    if (toggle && nav) {
        toggle.addEventListener("click", function () {
            setMenu(toggle.getAttribute("aria-expanded") !== "true");
        });
        nav.addEventListener("click", function (e) {
            if (e.target.closest("a")) setMenu(false);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
                setMenu(false);
                toggle.focus();
            }
        });
        window.addEventListener("resize", function () {
            if (window.innerWidth > 900) setMenu(false);
        });
    }

    /* ------------------------------------------------------------------
       2. Back-to-top button + header shadow
       ------------------------------------------------------------------ */
    var topBtn = document.createElement("button");
    topBtn.type = "button";
    topBtn.className = "back-to-top";
    topBtn.setAttribute("aria-label", "Back to top");
    topBtn.innerHTML = "&uarr;";
    topBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    document.body.appendChild(topBtn);

    function onScroll() {
        var y = window.scrollY;
        if (header) header.classList.toggle("scrolled", y > 8);
        topBtn.classList.toggle("show", y > 700);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ------------------------------------------------------------------
       3. "Next Sabbath" countdown (home page hero)
          Sabbath School 9:00 AM, Divine Service 10:30 AM–12:30 PM, SAST
       ------------------------------------------------------------------ */
    var countdown = $("[data-sabbath-countdown]");

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function sabbathStatus() {
        var now = new Date();
        // Shift "now" so that UTC getters read as South African local time.
        var sast = new Date(now.getTime() + SAST_OFFSET_HOURS * 3600 * 1000);
        var dow = sast.getUTCDay(); // 6 = Saturday
        var minutes = sast.getUTCHours() * 60 + sast.getUTCMinutes();

        if (dow === 6 && minutes >= 9 * 60 && minutes < 12 * 60 + 30) {
            return { live: true };
        }
        var daysAhead = (6 - dow + 7) % 7;
        if (dow === 6 && minutes >= 12 * 60 + 30) daysAhead = 7;
        var target = Date.UTC(sast.getUTCFullYear(), sast.getUTCMonth(), sast.getUTCDate() + daysAhead, 9, 0) -
            SAST_OFFSET_HOURS * 3600 * 1000;
        return { live: false, ms: target - now.getTime() };
    }

    function renderCountdown() {
        var s = sabbathStatus();
        if (s.live) {
            countdown.innerHTML = '<span class="live-dot" aria-hidden="true"></span> Sabbath worship is happening now &mdash; ' +
                '<a href="#watch-live">watch live</a> or <a href="#visit">come and join us</a>.';
            return;
        }
        var totalMin = Math.max(0, Math.floor(s.ms / 60000));
        var d = Math.floor(totalMin / 1440);
        var h = Math.floor((totalMin % 1440) / 60);
        var m = totalMin % 60;
        var parts = [];
        if (d) parts.push(d + (d === 1 ? " day" : " days"));
        parts.push(h + (h === 1 ? " hour" : " hours"));
        if (!d) parts.push(m + (m === 1 ? " minute" : " minutes"));
        countdown.textContent = "Next Sabbath School starts in " + parts.join(", ") + " (Saturday, 9:00 AM).";
    }

    if (countdown) {
        renderCountdown();
        setInterval(renderCountdown, 30000);
    }

    /* ------------------------------------------------------------------
       4. Events: label finished events, tidy their buttons
          Reads dates written like "Saturday, October 18, 2026 | 10:30 AM – 12:30 PM"
       ------------------------------------------------------------------ */
    var MONTHS = ["january", "february", "march", "april", "may", "june", "july",
        "august", "september", "october", "november", "december"];

    function eventEnd(text) {
        var m = text.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
        if (!m) return null;
        var month = MONTHS.indexOf(m[1].toLowerCase());
        if (month < 0) return null;
        var hour = 23, min = 59;
        var t = text.match(/[–\-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (t) {
            hour = parseInt(t[1], 10) % 12 + (t[3].toUpperCase() === "PM" ? 12 : 0);
            min = parseInt(t[2], 10);
        }
        return Date.UTC(+m[3], month, +m[2], hour, min) - SAST_OFFSET_HOURS * 3600 * 1000;
    }

    function markPastEvents() {
        var now = Date.now();
        var sections = {};

        $$(".event-datetime, .event-info > p:first-of-type").forEach(function (el) {
            var card = el.closest(".event-card, .featured-event");
            if (!card || card.dataset.checked) return;
            var end = eventEnd(el.textContent);
            if (end === null) return;
            card.dataset.checked = "1";

            var section = card.closest("section");
            if (section) {
                sections[section.id || "s"] = sections[section.id || "s"] || { section: section, total: 0, past: 0 };
                sections[section.id || "s"].total++;
            }
            if (end < now) {
                card.classList.add("is-past");
                if (section) sections[section.id || "s"].past++;

                var badge = $(".event-badge", card);
                if (badge) {
                    badge.textContent = "Past event";
                    badge.classList.add("event-badge-past");
                } else {
                    var chip = document.createElement("span");
                    chip.className = "event-tag event-tag-past";
                    chip.textContent = "Past event";
                    el.parentNode.insertBefore(chip, el.parentNode.firstChild);
                }
                $$('a[href*="calendar.google.com"]', card).forEach(function (a) { a.remove(); });
            }
        });

        Object.keys(sections).forEach(function (k) {
            var s = sections[k];
            if (s.total && s.past === s.total) {
                var note = document.createElement("p");
                note.className = "events-note";
                note.innerHTML = "There are no upcoming events listed right now. " +
                    'Check back soon or <a href="contact.html">get in touch</a> to hear what\'s next.';
                var grid = $(".events-track, .event-grid", s.section);
                if (grid) grid.parentNode.insertBefore(note, grid);
            }
        });
    }
    markPastEvents();

    /* ------------------------------------------------------------------
       5. Forms: friendly validation + honest submission
          - If a form has data-endpoint="https://…", it is sent with fetch().
          - Otherwise the message opens in the visitor's email app, addressed
            to the church, so nothing is silently lost.
       ------------------------------------------------------------------ */
    function fieldLabel(field) {
        var label = field.id && $('label[for="' + field.id + '"]');
        return label ? label.textContent.trim() : (field.placeholder || "This field");
    }

    function clearError(field) {
        field.removeAttribute("aria-invalid");
        var err = field.parentNode.querySelector(".field-error");
        if (err) err.remove();
    }

    function showError(field, message) {
        clearError(field);
        field.setAttribute("aria-invalid", "true");
        var err = document.createElement("p");
        err.className = "field-error";
        err.id = (field.id || field.name) + "-error";
        err.textContent = message;
        field.setAttribute("aria-describedby", err.id);
        field.parentNode.appendChild(err);
    }

    function validateForm(form) {
        var firstBad = null;
        $$("input, select, textarea", form).forEach(function (f) {
            if (f.type === "checkbox" || f.type === "submit") return;
            clearError(f);
            var v = (f.value || "").trim();
            var msg = "";
            if (f.required && !v) {
                msg = fieldLabel(f) + " is required.";
            } else if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                msg = "Please enter a valid email address.";
            } else if (f.type === "tel" && v && !/^[+\d][\d\s()\-]{6,}$/.test(v)) {
                msg = "Please enter a valid phone number.";
            }
            if (msg) {
                showError(f, msg);
                if (!firstBad) firstBad = f;
            }
        });
        if (firstBad) firstBad.focus();
        return !firstBad;
    }

    function setStatus(form, message, type) {
        var s = $(".form-status", form);
        if (!s) {
            s = document.createElement("p");
            s.className = "form-status";
            s.setAttribute("role", "status");
            form.appendChild(s);
        }
        s.textContent = message;
        s.className = "form-status " + (type || "");
    }

    function mailtoFallback(form) {
        var data = {};
        $$("input, select, textarea", form).forEach(function (f) {
            if (!f.name) return;
            if (f.type === "checkbox") { data[f.name] = f.checked ? "Yes" : "No"; return; }
            data[f.name] = (f.value || "").trim();
        });
        var isContact = form.classList.contains("contact-form");
        var subject = isContact
            ? (data.subject || "Message from the website")
            : "Please add me to the mailing list";
        var lines = isContact
            ? ["Name: " + data.name, "Email: " + data.email, "Phone: " + (data.phone || "—"),
               "Reason: " + (data.reason || "—"), "Mailing list: " + (data.newsletter || "No"), "", data.message]
            : ["Name: " + data.name, "Email: " + data.email, "", "Please add me to the weekly updates list."];
        window.location.href = "mailto:" + CHURCH_EMAIL + "?subject=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(lines.join("\n"));
    }

    $$(".contact-form, .newsletter-form").forEach(function (form) {
        form.setAttribute("novalidate", "");

        form.addEventListener("input", function (e) {
            if (e.target.getAttribute("aria-invalid")) clearError(e.target);
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!validateForm(form)) {
                setStatus(form, "Please fix the highlighted fields and try again.", "error");
                return;
            }
            var endpoint = form.dataset.endpoint;
            if (!endpoint) {
                setStatus(form, "Opening your email app so you can send this to us…", "info");
                mailtoFallback(form);
                return;
            }
            var btn = $('button[type="submit"]', form);
            if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }
            fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
                .then(function (r) {
                    if (!r.ok) throw new Error("bad status");
                    form.reset();
                    setStatus(form, "Thank you! Your message has been sent. We'll be in touch soon.", "success");
                })
                .catch(function () {
                    setStatus(form, "Sorry, that didn't go through. Please try again, or email " + CHURCH_EMAIL + ".", "error");
                })
                .then(function () {
                    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
                });
        });
    });

    /* ------------------------------------------------------------------
       6. Prayer-request shortcut: /contact.html?reason=prayer
          (also lets other pages deep-link to a form reason)
       ------------------------------------------------------------------ */
    var reason = $("#contact-reason");
    if (reason) {
        var wanted = new URLSearchParams(window.location.search).get("reason");
        if (wanted && $('option[value="' + wanted + '"]', reason)) reason.value = wanted;
    }

    /* ------------------------------------------------------------------
       7. Giving page: copy bank details
       ------------------------------------------------------------------ */
    function copyText(text, btn) {
        var done = function (ok) {
            var old = btn.dataset.label || btn.textContent;
            btn.dataset.label = old;
            btn.textContent = ok ? "Copied ✓" : "Press Ctrl+C to copy";
            setTimeout(function () { btn.textContent = old; }, 1800);
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        } else {
            var ta = document.createElement("textarea");
            ta.value = text; ta.setAttribute("readonly", "");
            ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            var ok = false;
            try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
            document.body.removeChild(ta);
            done(ok);
        }
    }

    $$(".bank-details li").forEach(function (li) {
        var label = $("strong", li);
        if (!label) return;
        var name = label.textContent.trim();
        if (!/account number|branch code/i.test(name)) return;
        var value = li.textContent.replace(name, "").trim();
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "copy-btn";
        btn.textContent = "Copy";
        btn.setAttribute("aria-label", "Copy " + name.toLowerCase());
        btn.addEventListener("click", function () { copyText(value, btn); });
        li.appendChild(btn);
    });

    /* ------------------------------------------------------------------
       8. Photo gallery lightbox (ministries page)
       ------------------------------------------------------------------ */
    var galleryImgs = $$(".gallery-item img");
    if (galleryImgs.length && typeof HTMLDialogElement === "function") {
        var dlg = document.createElement("dialog");
        dlg.className = "lightbox";
        dlg.setAttribute("aria-label", "Photo viewer");
        dlg.innerHTML =
            '<button type="button" class="lb-close" aria-label="Close photo">&times;</button>' +
            '<button type="button" class="lb-prev" aria-label="Previous photo">&lsaquo;</button>' +
            '<figure><img alt=""><figcaption></figcaption></figure>' +
            '<button type="button" class="lb-next" aria-label="Next photo">&rsaquo;</button>';
        document.body.appendChild(dlg);

        var lbImg = $("img", dlg), lbCap = $("figcaption", dlg), idx = 0, opener = null;

        var show = function (i) {
            idx = (i + galleryImgs.length) % galleryImgs.length;
            lbImg.src = galleryImgs[idx].currentSrc || galleryImgs[idx].src;
            lbImg.alt = galleryImgs[idx].alt;
            lbCap.textContent = galleryImgs[idx].alt + "  (" + (idx + 1) + " of " + galleryImgs.length + ")";
        };
        var open = function (i, from) {
            opener = from; show(i);
            if (!dlg.open) dlg.showModal();
        };

        galleryImgs.forEach(function (img, i) {
            var item = img.closest(".gallery-item");
            item.tabIndex = 0;
            item.setAttribute("role", "button");
            item.setAttribute("aria-label", "View larger: " + img.alt);
            item.addEventListener("click", function () { open(i, item); });
            item.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i, item); }
            });
        });

        $(".lb-close", dlg).addEventListener("click", function () { dlg.close(); });
        $(".lb-prev", dlg).addEventListener("click", function () { show(idx - 1); });
        $(".lb-next", dlg).addEventListener("click", function () { show(idx + 1); });
        dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); }); // click backdrop
        dlg.addEventListener("keydown", function (e) {
            if (e.key === "ArrowLeft") show(idx - 1);
            if (e.key === "ArrowRight") show(idx + 1);
        });
        dlg.addEventListener("close", function () { if (opener) opener.focus(); });
    }

    /* ------------------------------------------------------------------
       9. Gentle reveal-on-scroll for cards
       ------------------------------------------------------------------ */
    if ("IntersectionObserver" in window && !reduceMotion) {
        var targets = $$(".ministry-card, .event-card, .value-card, .leader-card, .testimonial-card, " +
            ".giving-card, .give-card, .give-method, .visiting-card, .info-card, .gallery-item, .faq-item");
        targets.forEach(function (el) { el.classList.add("reveal"); });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add("in");
                    io.unobserve(en.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
        targets.forEach(function (el) { io.observe(el); });
    }
})();

