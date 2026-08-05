(function () {
  var REPO = "eng1999/rawabi-medical";
  var BRANCH = "main";
  var API_URL = "https://api.github.com/repos/" + REPO + "/contents/content/news?ref=" + BRANCH;

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

  function fetchPosts() {
    return fetch(API_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("GitHub API error " + res.status);
        return res.json();
      })
      .then(function (files) {
        var mdFiles = files.filter(function (f) { return /\.md$/.test(f.name); });
        return Promise.all(
          mdFiles.map(function (f) {
            return fetch(f.download_url)
              .then(function (r) { return r.text(); })
              .then(function (raw) {
                var parsed = parseFrontmatter(raw);
                var m = parsed.meta;
                return {
                  slug: f.name.replace(/\.md$/, ""),
                  title: m.title || "",
                  title_en: m.title_en || m.title || "",
                  date: m.date || "",
                  image: m.image || "",
                  excerpt: m.excerpt || "",
                  excerpt_en: m.excerpt_en || m.excerpt || "",
                  body: mdToHtml(parsed.body)
                };
              });
          })
        );
      });
  }

  function cardHtml(post, featured) {
    var lang = currentLang();
    var title = lang === "en" ? post.title_en : post.title;
    var excerpt = lang === "en" ? post.excerpt_en : post.excerpt;
    var readMore = lang === "en" ? "Read More →" : "اقرأ المزيد ←";
    if (featured) {
      return (
        '<div class="photo-card reveal" style="background-image:url(\'' + post.image + '\');min-height:340px;">' +
        '<div class="photo-card-body">' +
        '<h3 style="font-size:1.5rem;">' + title + "</h3>" +
        "<p>" + excerpt + "</p>" +
        '<a href="post.html?slug=' + encodeURIComponent(post.slug) + '" class="card-link">' + readMore + "</a>" +
        "</div></div>"
      );
    }
    return (
      '<div class="photo-card reveal" style="background-image:url(\'' + post.image + '\');">' +
      '<div class="photo-card-body">' +
      "<h3>" + title + "</h3>" +
      "<p>" + excerpt + "</p>" +
      '<a href="post.html?slug=' + encodeURIComponent(post.slug) + '" class="card-link">' + readMore + "</a>" +
      "</div></div>"
    );
  }

  var allPosts = [];

  function render() {
    var searchTerm = (document.getElementById("newsroom-search").value || "").trim().toLowerCase();
    var sortMode = document.getElementById("newsroom-sort").value;
    var lang = currentLang();

    var filtered = allPosts.filter(function (p) {
      var title = (lang === "en" ? p.title_en : p.title).toLowerCase();
      return title.indexOf(searchTerm) !== -1;
    });

    filtered.sort(function (a, b) {
      if (sortMode === "az") {
        var ta = (lang === "en" ? a.title_en : a.title);
        var tb = (lang === "en" ? b.title_en : b.title);
        return ta.localeCompare(tb);
      }
      var da = new Date(a.date).getTime() || 0;
      var db = new Date(b.date).getTime() || 0;
      return sortMode === "oldest" ? da - db : db - da;
    });

    var featuredEl = document.getElementById("newsroom-featured");
    var gridEl = document.getElementById("newsroom-grid");
    var emptyEl = document.getElementById("newsroom-empty");

    if (!filtered.length) {
      featuredEl.style.display = "none";
      gridEl.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";

    var showFeatured = sortMode !== "az";
    if (showFeatured) {
      featuredEl.style.display = "block";
      featuredEl.innerHTML = cardHtml(filtered[0], true);
      gridEl.innerHTML = filtered.slice(1).map(function (p) { return cardHtml(p, false); }).join("");
    } else {
      featuredEl.style.display = "none";
      gridEl.innerHTML = filtered.map(function (p) { return cardHtml(p, false); }).join("");
    }

    gridEl.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("visible"); });
    if (featuredEl.firstElementChild) featuredEl.firstElementChild.classList.add("visible");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var loadingEl = document.getElementById("newsroom-loading");
    if (!loadingEl) return;

    fetchPosts()
      .then(function (posts) {
        allPosts = posts;
        loadingEl.style.display = "none";
        render();
      })
      .catch(function () {
        loadingEl.textContent = currentLang() === "en"
          ? "Couldn't load news right now. Please try again shortly."
          : "تعذّر تحميل الأخبار حاليًا. يرجى المحاولة لاحقًا.";
      });

    document.getElementById("newsroom-search").addEventListener("input", render);
    document.getElementById("newsroom-sort").addEventListener("change", render);
    document.querySelectorAll(".lang-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () { setTimeout(render, 0); });
    });
  });
})();
