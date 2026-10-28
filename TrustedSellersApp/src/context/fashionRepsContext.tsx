import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// --- Interfaces ---
export interface Seller {
  name: string;
  url: string;
  platform: "yupoo" | "weidian" | "taobao" | "other";
}

export interface Brand {
  name: string;
  sellers: Seller[];
}

export interface FashionRepsContextType {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Détection automatique de la plateforme
const detectPlatform = (url: string): Seller["platform"] => {
  if (url.includes("yupoo.com")) return "yupoo";
  if (url.includes("weidian.com") || url.includes("youshop10.com"))
    return "weidian";
  if (url.includes("taobao.com")) return "taobao";
  return "other";
};

// Utilisation de corsproxy.io (alternative plus stable)
const PROXY_URL = "https://corsproxy.io/?";
const REDDIT_WIKI_URL = "https://www.reddit.com/r/FashionReps/wiki/trusted/";

// Données de secours (Fallback) si le proxy est bloqué
const FALLBACK_BRANDS: Brand[] = [
  {
    name: "Acne Studios",
    sellers: [
      {
        name: "Mook",
        url: "https://mook-official.x.yupoo.com/",
        platform: "yupoo",
      },
      {
        name: "Singor",
        url: "https://steven-1989.x.yupoo.com/",
        platform: "yupoo",
      },
      {
        name: "TopBatch",
        url: "https://topbatch.x.yupoo.com/",
        platform: "yupoo",
      },
    ],
  },
  {
    name: "Balenciaga",
    sellers: [
      {
        name: "MadebyKungFu",
        url: "https://madebykungfu.x.yupoo.com/",
        platform: "yupoo",
      },
      {
        name: "Carrotmade",
        url: "https://carrotmade.x.yupoo.com/",
        platform: "yupoo",
      },
      {
        name: "Shark Breeder",
        url: "https://k.youshop10.com/123456",
        platform: "weidian",
      },
    ],
  },
];

const FashionRepsContext = createContext<FashionRepsContextType | undefined>(
  undefined,
);

interface ProviderProps {
  children: ReactNode;
}

export const FashionRepsProvider: React.FC<ProviderProps> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndParseSellers = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        PROXY_URL + encodeURIComponent(REDDIT_WIKI_URL),
      );
      if (!response.ok) {
        throw new Error(`Erreur réseau HTTP: ${response.status}`);
      }

      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      const parsedBrands: Brand[] = [];
      const headers = doc.querySelectorAll(".md h2, .md h3, .md p strong");

      headers.forEach((header) => {
        const brandName = header.textContent?.trim() || "";
        if (!brandName) return;

        let sibling = header.parentElement
          ? header.parentElement.nextElementSibling
          : null;
        if (!sibling) sibling = header.nextElementSibling;

        while (
          sibling &&
          sibling.tagName !== "TABLE" &&
          !["H2", "H3"].includes(sibling.tagName)
        ) {
          sibling = sibling.nextElementSibling;
        }

        if (sibling && sibling.tagName === "TABLE") {
          const rows = sibling.querySelectorAll("tbody tr");
          const sellers: Seller[] = [];

          rows.forEach((row) => {
            const cols = row.querySelectorAll("td");
            if (cols.length >= 2) {
              const name = cols[0].textContent?.trim() || "";
              const linkElem = cols[1].querySelector("a");
              const url = linkElem
                ? linkElem.getAttribute("href") || ""
                : cols[1].textContent?.trim() || "";

              if (name && url) {
                sellers.push({
                  name,
                  url,
                  platform: detectPlatform(url),
                });
              }
            }
          });

          if (sellers.length > 0) {
            parsedBrands.push({
              name: brandName,
              sellers,
            });
          }
        }
      });
      setBrands(parsedBrands);
    } catch (err) {
      console.warn(
        "Échec du scraping direct (CORS/Réseau), basculement sur les données de secours.",
        err,
      );
      // Fallback automatique pour ne pas casser l'application
      setBrands(FALLBACK_BRANDS);
      setError(
        "Impossible de joindre Reddit en direct (CORS). Affichage des données de secours.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndParseSellers();
  }, []);

  return (
    <FashionRepsContext.Provider
      value={{ brands, loading, error, refetch: fetchAndParseSellers }}
    >
      {children}
    </FashionRepsContext.Provider>
  );
};

export const useFashionReps = (): FashionRepsContextType => {
  const context = useContext(FashionRepsContext);
  if (!context) {
    throw new Error(
      "useFashionReps doit être utilisé au sein d’un FashionRepsProvider",
    );
  }
  return context;
};
