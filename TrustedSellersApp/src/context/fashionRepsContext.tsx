import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Brand, Seller } from "../types/types";

export interface FashionRepsContextType {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Helper pour identifier la plateforme du vendeur depuis son lien
const detectPlatform = (url: string): Seller["platform"] => {
  if (url.includes("yupoo.com")) return "yupoo";
  if (url.includes("weidian.com") || url.includes("youshop10.com"))
    return "weidian";
  if (url.includes("taobao.com")) return "taobao";
  return "other";
};

const PROXY_URL = "https://api.allorigins.win/raw?url=";
const REDDIT_WIKI_URL = "https://www.reddit.com/r/FashionReps/wiki/trusted/";

// Création du Context typé
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

      // Ciblage des titres de marques dans le DOM Reddit Wiki
      const headers = doc.querySelectorAll(".md h2, .md h3, .md p strong");

      headers.forEach((header) => {
        const brandName = header.textContent?.trim() || "";
        if (!brandName) return;

        // Recherche de la table HTML associée
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
      console.error("Erreur scraping FashionReps:", err);
      setError(
        err instanceof Error ? err.message : "Erreur inconnue lors du scraping",
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
      value={{
        brands,
        loading,
        error,
        refetch: fetchAndParseSellers,
      }}
    >
      {children}
    </FashionRepsContext.Provider>
  );
};

// Hook personnalisé sécurisé
export const useFashionReps = (): FashionRepsContextType => {
  const context = useContext(FashionRepsContext);
  if (!context) {
    throw new Error(
      "useFashionReps doit être utilisé au sein d’un FashionRepsProvider",
    );
  }
  return context;
};
