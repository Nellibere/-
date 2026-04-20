(() => {
  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Smooth scroll
  $$("[data-scrollto]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.getAttribute("data-scrollto");
      const el = target ? $(target) : null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Simple timer (seconds from data-timer)
  const timerEl = $(".timer");
  if (timerEl) {
    let left = Number(timerEl.getAttribute("data-timer") || "0");
    const hEl = $("[data-timer-hours]", timerEl);
    const mEl = $("[data-timer-minutes]", timerEl);
    const sEl = $("[data-timer-seconds]", timerEl);

    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      if (left < 0) left = 0;
      const h = Math.floor(left / 3600);
      const m = Math.floor((left % 3600) / 60);
      const s = left % 60;
      if (hEl) hEl.textContent = pad(h);
      if (mEl) mEl.textContent = pad(m);
      if (sEl) sEl.textContent = pad(s);
      left -= 1;
    };
    tick();
    setInterval(tick, 1000);
  }

  // Hero thumbs (demo: just swaps image source set)
  const heroImg = $(".hero__img img");
  const heroThumbs = $$("[data-hero-thumb]");
  const heroSources = [
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60",
  ];
  heroThumbs.forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-hero-thumb"));
      heroThumbs.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      if (heroImg && heroSources[idx]) heroImg.src = heroSources[idx];
    });
  });

  // Slider
  const slider = $("[data-slider]");
  if (slider) {
    const track = $("[data-slider-track]", slider);
    const prevBtn = $("[data-slider-prev]", slider);
    const nextBtn = $("[data-slider-next]", slider);
    const dotsWrap = $("[data-slider-dots]", slider);
    const slides = track ? $$(".slide", track) : [];
    let index = 0;

    const renderDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const d = document.createElement("button");
        d.className = "dot" + (i === index ? " is-active" : "");
        d.type = "button";
        d.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(d);
      });
    };

    const goTo = (i) => {
      if (!track) return;
      index = Math.max(0, Math.min(i, slides.length - 1));
      track.style.transform = `translateX(${-index * 100}%)`;
      renderDots();
    };

    prevBtn?.addEventListener("click", () => goTo(index - 1));
    nextBtn?.addEventListener("click", () => goTo(index + 1));
    renderDots();
  }

  // Accordion
  const acc = $("[data-accordion]");
  if (acc) {
    const items = $$(".accordion__item", acc);
    items.forEach((btn) => {
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        // close all
        items.forEach(b => {
          b.setAttribute("aria-expanded", "false");
          const panel = b.nextElementSibling;
          if (panel && panel.classList.contains("accordion__panel")) panel.style.display = "none";
          const icon = $(".accordion__icon", b);
          if (icon) icon.textContent = "+";
        });

        // open current if was closed
        if (!expanded) {
          btn.setAttribute("aria-expanded", "true");
          const panel = btn.nextElementSibling;
          if (panel && panel.classList.contains("accordion__panel")) panel.style.display = "block";
          const icon = $(".accordion__icon", btn);
          if (icon) icon.textContent = "−";
        }
      });
    });
  }

  // Package selection
  const selectedPackageText = $("[data-selected-package]");
  const leadForm = $("#leadForm");
  const leadPkgInput = leadForm?.querySelector('input[name="package"]');
  $$("[data-select-package]").forEach(btn => {
    btn.addEventListener("click", () => {
      const pkg = btn.getAttribute("data-select-package") || "Выбранный вариант";
      if (selectedPackageText) selectedPackageText.textContent = pkg;
      if (leadPkgInput) leadPkgInput.value = pkg;

      // scroll to order
      $("#order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // UTM capture
  const params = new URLSearchParams(window.location.search);
  const utmFields = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"];
  const fillUTM = (form) => {
    if (!form) return;
    utmFields.forEach(k => {
      const el = form.querySelector(`input[name="${k}"]`);
      if (el) el.value = params.get(k) || "";
    });
    const ref = form.querySelector('input[name="referrer"]');
    if (ref) ref.value = document.referrer || "";
  };
  fillUTM(leadForm);
  fillUTM($("#callbackForm"));

  // Form validation + submit (демо отправка)
  const setError = (form, name, msg) => {
    const err = form.querySelector(`[data-error-for="${name}"]`);
    if (err) err.textContent = msg || "";
  };

  const validatePhone = (value) => {
    const v = String(value || "").trim();
    // Простейшая проверка: минимум 9 цифр
    const digits = v.replace(/\D/g, "");
    return digits.length >= 9;
  };

  const handleSubmit = async (form, endpoint) => {
    const status = form.querySelector("[data-form-status]");
    const hp = form.querySelector('input[name="company"]');
    if (hp && hp.value) return; // honeypot triggered

    // Clear errors
    ["name","phone"].forEach(f => setError(form, f, ""));

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const phone = (data.get("phone") || "").toString().trim();

    let ok = true;
    if (form.id === "leadForm") {
      if (name.length < 2) { setError(form, "name", "Введите имя (минимум 2 символа)."); ok = false; }
    }
    if (!validatePhone(phone)) { setError(form, "phone", "Введите корректный номер телефона."); ok = false; }

    if (!ok) {
      if (status) status.textContent = "Проверьте поля формы.";
      return;
    }

    if (status) status.textContent = "Отправка заявки...";

    // ВАРИАНТЫ:
    // 1) Отправка на ваш backend endpoint через fetch (JSON или FormData)
    // 2) Интеграция с Google Forms / Make / Zapier / CRM
    // Здесь сделана демо отправка. Замените endpoint и раскомментируйте fetch.

    try {
      const payload = Object.fromEntries(data.entries());

      // Пример fetch:
      // const res = await fetch(endpoint, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      // if (!res.ok) throw new Error("Bad response");

      await new Promise(r => setTimeout(r, 700)); // demo

      form.reset();
      fillUTM(form);
      if (status) status.textContent = "Спасибо. Заявка отправлена. Мы скоро свяжемся с вами.";
      status.style.color = "var(--ok)";
      setTimeout(() => { status.style.color = ""; }, 1500);

    } catch (e) {
      if (status) status.textContent = "Не удалось отправить. Попробуйте позже или позвоните нам.";
      if (status) status.style.color = "var(--danger)";
    }
  };

  leadForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSubmit(leadForm, "/api/lead");
  });

  const callbackForm = $("#callbackForm");
  callbackForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSubmit(callbackForm, "/api/callback");
  });

  // Modal
  const modal = $("[data-modal]");
  const openModalBtn = $("[data-open-modal]");
  const closeBtns = $$("[data-modal-close]");

  const openModal = () => {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };
  openModalBtn?.addEventListener("click", (e) => { e.preventDefault(); openModal(); });
  closeBtns.forEach(b => b.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

})();