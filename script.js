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

  var form = document.getElementById("contact-form");
  if (form) {
    var successBox = document.getElementById("form-success");

    function setError(group, hasError) {
      group.classList.toggle("invalid", hasError);
    }

    function validate() {
      var valid = true;
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var phone = form.querySelector("#phone");
      var message = form.querySelector("#message");

      var nameGroup = name.closest(".form-group");
      var emailGroup = email.closest(".form-group");
      var phoneGroup = phone.closest(".form-group");
      var messageGroup = message.closest(".form-group");

      var nameOk = name.value.trim().length >= 2;
      setError(nameGroup, !nameOk);
      if (!nameOk) valid = false;

      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      setError(emailGroup, !emailOk);
      if (!emailOk) valid = false;

      var phoneOk = phone.value.trim().length >= 8;
      setError(phoneGroup, !phoneOk);
      if (!phoneOk) valid = false;

      var messageOk = message.value.trim().length >= 10;
      setError(messageGroup, !messageOk);
      if (!messageOk) valid = false;

      return valid;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;

      var name = form.querySelector("#name").value.trim();
      var email = form.querySelector("#email").value.trim();
      var phone = form.querySelector("#phone").value.trim();
      var subject = form.querySelector("#subject").value.trim() || "طلب تواصل من الموقع";
      var message = form.querySelector("#message").value.trim();

      var body =
        "الاسم: " + name + "\n" +
        "البريد الإلكتروني: " + email + "\n" +
        "رقم الهاتف: " + phone + "\n\n" +
        message;

      var mailto =
        "mailto:info@rawabimedical.sa" +
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
});
