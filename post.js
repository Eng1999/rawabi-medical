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

  function mdInline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
  }

  function isTableSep(line) {
    return !!line && /^[\s|:-]+$/.test(line) && line.indexOf("-") !== -1;
  }

  function splitRow(line) {
    return line.split("|").map(function (c) { return c.trim(); }).filter(function (c) { return c.length; });
  }

  function mdToHtml(md) {
    if (!md) return "";
    var lines = md.replace(/\r\n/g, "\n").split("\n");
    var out = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }

      var h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        var level = h[1].length;
        out.push("<h" + level + ">" + mdInline(h[2].trim()) + "</h" + level + ">");
        i++;
        continue;
      }

      if (line.indexOf("|") !== -1 && isTableSep(lines[i + 1])) {
        var headerCells = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].indexOf("|") !== -1 && !/^\s*$/.test(lines[i])) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        var thead = "<thead><tr>" + headerCells.map(function (c) { return "<th>" + mdInline(c) + "</th>"; }).join("") + "</tr></thead>";
        var tbody = "<tbody>" + rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + mdInline(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody>";
        out.push('<div class="table-wrap"><table>' + thead + tbody + "</table></div>");
        continue;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        var items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
          i++;
        }
        out.push("<ul>" + items.map(function (it) { return "<li>" + mdInline(it) + "</li>"; }).join("") + "</ul>");
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        var oitems = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          oitems.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
          i++;
        }
        out.push("<ol>" + oitems.map(function (it) { return "<li>" + mdInline(it) + "</li>"; }).join("") + "</ol>");
        continue;
      }

      var para = [line];
      i++;
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^(#{1,3})\s+/.test(lines[i]) &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+[.)]\s+/.test(lines[i]) &&
        !(lines[i].indexOf("|") !== -1 && isTableSep(lines[i + 1]))
      ) {
        para.push(lines[i]);
        i++;
      }
      out.push("<p>" + mdInline(para.join(" ")) + "</p>");
    }
    return out.join("");
  }

  function splitBilingualBody(body) {
    var marker = /\n?\s*<!--\s*EN\s*-->\s*\n?/;
    var parts = body.split(marker);
    return { ar: (parts[0] || "").trim(), en: (parts[1] || parts[0] || "").trim() };
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

    function render(meta, bodies, lang) {
      titleEl.textContent = lang === "en" ? (meta.title_en || meta.title) : meta.title;
      document.title = titleEl.textContent + " | Rawabi Medical";
      dateEl.textContent = formatDate(meta.date, lang);
      bodyEl.innerHTML = mdToHtml(lang === "en" ? bodies.en : bodies.ar);
    }

    fetch(rawUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("not found");
        return res.text();
      })
      .then(function (raw) {
        var parsed = parseFrontmatter(raw);
        var meta = parsed.meta;
        var bodies = splitBilingualBody(parsed.body);
        if (meta.image) imageEl.style.backgroundImage = "url('" + meta.image + "')";
        render(meta, bodies, currentLang());

        document.querySelectorAll(".lang-toggle").forEach(function (btn) {
          btn.addEventListener("click", function () {
            render(meta, bodies, currentLang());
          });
        });
      })
      .catch(function () {
        titleEl.textContent = currentLang() === "en" ? "News item not found" : "الخبر غير موجود";
      });
  });
})();
