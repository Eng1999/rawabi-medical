(function () {
  var REPO = "eng1999/rawabi-medical";
  var BRANCH = "main";

  function parseFrontmatter(raw) {
    var match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };
    var meta = {};
    match[1].split("\n").forEach(function (line) {
      var idx = line.indexOf(":");
      if (idx === -1) return;
      var key = line.slice(0, idx).trim();
      var value = line.slice(idx + 1).trim();
      value = value.replace(/^"(.*)"$/, "$1");
      meta[key] = value;
    });
    return { meta: meta, body: match[2].trim() };
  }

  function mdToHtml(md) {
    return md
      .split(/\n\s*\n/)
      .map(function (para) { return "<p>" + para.trim().replace(/\n/g, " ") + "</p>"; })
      .join("");
  }

  function currentLang() {
    return document.documentElement.lang === "en" ? "en" : "ar";
  }

  function formatDate(dateStr, lang) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(lang === "en" ? "en-US" : "ar-SA", { year: "numeric", month: "long", day: "numeric" });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var titleEl = document.getElementById("post-title");
    var dateEl = document.getElementById("post-date");
    var imageEl = document.getElementById("post-image");
    var bodyEl = document.getElementById("post-body");
    if (!titleEl) return;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get("slug");
    if (!slug) {
      titleEl.textContent = currentLang() === "en" ? "News item not found" : "الخبر غير موجود";
      return;
    }

    var rawUrl = "https://raw.githubusercontent.com/" + REPO + "/" + BRANCH + "/content/news/" + encodeURIComponent(slug) + ".md";

    fetch(rawUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("not found");
        return res.text();
      })
      .then(function (raw) {
        var parsed = parseFrontmatter(raw);
        var m = parsed.meta;
        var lang = currentLang();
        titleEl.textContent = lang === "en" ? (m.title_en || m.title) : m.title;
        document.title = titleEl.textContent + " | Rawabi Medical";
        dateEl.textContent = formatDate(m.date, lang);
        if (m.image) imageEl.style.backgroundImage = "url('" + m.image + "')";
        bodyEl.innerHTML = mdToHtml(parsed.body);
      })
      .catch(function () {
        titleEl.textContent = currentLang() === "en" ? "News item not found" : "الخبر غير موجود";
      });
  });
})();
