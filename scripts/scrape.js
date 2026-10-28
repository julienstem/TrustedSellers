const fs = require("fs");
const path = require("path");

async function scrapeReddit() {
  try {
    console.log("Récupération du wiki Reddit...");

    // On ajoute un User-Agent de navigateur pour contourner le blocage 403 de Reddit
    const response = await fetch(
      "https://www.reddit.com/r/FashionReps/wiki/trusted.json",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const markdown = json.data.content_md;

    const lines = markdown.split("\n");
    const result = [];
    let currentBrand = "Général";
    let currentSellers = [];

    lines.forEach((line) => {
      // Détection des titres de marques (# ou ##)
      if (line.startsWith("#")) {
        if (currentSellers.length > 0) {
          result.push({ name: currentBrand, sellers: currentSellers });
          currentSellers = [];
        }
        currentBrand = line.replace(/#/g, "").trim();
      }

      // Détection des lignes de tableaux Markdown
      if (
        line.includes("|") &&
        !line.includes("---") &&
        !line.toLowerCase().includes("store name")
      ) {
        const parts = line
          .split("|")
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length >= 2) {
          const name = parts[0];
          let url = parts[1];

          // Extraire l'URL propre du format markdown [texte](url)
          const match = url.match(/\((.*?)\)/);
          if (match) url = match[1];

          if (name && url && !name.toLowerCase().includes("name")) {
            let platform = "other";
            if (url.includes("yupoo.com")) platform = "yupoo";
            else if (
              url.includes("weidian.com") ||
              url.includes("youshop10.com")
            )
              platform = "weidian";
            else if (url.includes("taobao.com")) platform = "taobao";

            currentSellers.push({ name, url, platform });
          }
        }
      }
    });

    if (currentSellers.length > 0) {
      result.push({ name: currentBrand, sellers: currentSellers });
    }

    // Sauvegarde dans le dossier src de ton app React
    const outputPath = path.join(__dirname, "../src/fashionreps_trusted.json");
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(
      `Succès ! ${result.length} marques enregistrées dans le fichier JSON.`,
    );
  } catch (error) {
    console.error("Erreur lors du scraping :", error);
    process.exit(1);
  }
}

scrapeReddit();
