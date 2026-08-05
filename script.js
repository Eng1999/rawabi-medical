(function () {
  var STORAGE_KEY = "rawabi-lang";
  var dict = window.RAWABI_I18N || {};

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
    document.body.classList.toggle("lang-en", lang === "en");

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (!el.hasAttribute("data-ar-text")) {
        el.setAttribute("data-ar-text", el.textContent);
      }
      var key = el.getAttribute("data-i18n");
      el.textContent = lang === "en" && dict[key] ? dict[key] : el.getAttribute("data-ar-text");
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      if (!el.hasAttribute("data-ar-html")) {
        el.setAttribute("data-ar-html", el.innerHTML);
      }
      var key = el.getAttribute("data-i18n-html");
      el.innerHTML = lang === "en" && dict[key] ? dict[key] : el.getAttribute("data-ar-html");
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split("|").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0];
        var key = parts[1];
        var cacheAttr = "data-ar-" + attr;
        if (!el.hasAttribute(cacheAttr)) {
          el.setAttribute(cacheAttr, el.getAttribute(attr) || "");
        }
        el.setAttribute(attr, lang === "en" && dict[key] ? dict[key] : el.getAttribute(cacheAttr));
      });
    });

    document.querySelectorAll(".lang-toggle span").forEach(function (span) {
      span.textContent = lang === "en" ? "العربية" : "English";
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    var saved = "ar";
    try { saved = localStorage.getItem(STORAGE_KEY) || "ar"; } catch (e) {}
    applyLang(saved);

    document.querySelectorAll(".lang-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var current = document.documentElement.lang === "en" ? "en" : "ar";
        applyLang(current === "en" ? "ar" : "en");
      });
    });
  });
})();

document.addEventListener("DOMContentLoaded", function () {
  var header = document.querySelector(".site-header");
  var toggleBtn = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  var mobileClose = document.querySelector(".mobile-nav-close");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function openMobileNav() {
    if (mobileNav) mobileNav.classList.add("open");
  }
  function closeMobileNav() {
    if (mobileNav) mobileNav.classList.remove("open");
  }
  if (toggleBtn) toggleBtn.addEventListener("click", openMobileNav);
  if (mobileClose) mobileClose.addEventListener("click", closeMobileNav);
  if (mobileNav) {
    mobileNav.addEventListener("click", function (e) {
      if (e.target === mobileNav) closeMobileNav();
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobileNav);
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  function wireForm(formId, config) {
    var form = document.getElementById(formId);
    if (!form) return;
    var successBox = document.getElementById(config.successId);

    function setError(group, hasError) {
      group.classList.toggle("invalid", hasError);
    }

    function validate() {
      var valid = true;
      config.requiredFields.forEach(function (f) {
        var el = form.querySelector("#" + f.id);
        var group = el.closest(".form-group");
        var ok = f.test(el.value.trim());
        setError(group, !ok);
        if (!ok) valid = false;
      });
      return valid;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;

      var subject = config.buildSubject(form);
      var body = config.buildBody(form);
      var mailto =
        "mailto:" + config.email +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      if (successBox) successBox.classList.add("show");
      window.location.href = mailto;
      form.reset();
    });

    form.querySelectorAll("input, textarea").forEach(function (field) {
      field.addEventListener("input", function () {
        field.closest(".form-group").classList.remove("invalid");
      });
    });
  }

  var emailTest = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };

  wireForm("contact-form", {
    successId: "form-success",
    email: "info@rwabimed.com",
    requiredFields: [
      { id: "name", test: function (v) { return v.length >= 2; } },
      { id: "email", test: emailTest },
      { id: "phone", test: function (v) { return v.length >= 8; } },
      { id: "message", test: function (v) { return v.length >= 10; } }
    ],
    buildSubject: function (form) {
      return form.querySelector("#subject").value.trim() || "طلب تواصل من الموقع";
    },
    buildBody: function (form) {
      return "الاسم: " + form.querySelector("#name").value.trim() + "\n" +
        "البريد الإلكتروني: " + form.querySelector("#email").value.trim() + "\n" +
        "رقم الهاتف: " + form.querySelector("#phone").value.trim() + "\n\n" +
        form.querySelector("#message").value.trim();
    }
  });

  wireForm("drug-safety-form", {
    successId: "drug-safety-success",
    email: "qppv@rwabimed.com",
    requiredFields: [
      { id: "ds-name", test: function (v) { return v.length >= 2; } },
      { id: "ds-email", test: emailTest },
      { id: "ds-drug", test: function (v) { return v.length >= 1; } },
      { id: "ds-description", test: function (v) { return v.length >= 10; } }
    ],
    buildSubject: function () {
      return "بلاغ عن أثر جانبي - روابي الطبية";
    },
    buildBody: function (form) {
      return "اسم معدّ التقرير: " + form.querySelector("#ds-name").value.trim() + "\n" +
        "البريد الإلكتروني: " + form.querySelector("#ds-email").value.trim() + "\n" +
        "رقم الجوال: " + form.querySelector("#ds-phone").value.trim() + "\n" +
        "اسم الدواء: " + form.querySelector("#ds-drug").value.trim() + "\n" +
        "المهنة: " + form.querySelector("#ds-profession").value.trim() + "\n\n" +
        "وصف الأثر الجانبي:\n" + form.querySelector("#ds-description").value.trim();
    }
  });
});
